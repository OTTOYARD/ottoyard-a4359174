// OTTO-Q Resource Manager — Stall allocation, conflict resolution, throughput optimization
import { supabase } from "@/integrations/supabase/client";
import type { StallType, StallStatus } from "@/types/ottoq";

// ── Types ──────────────────────────────────────────────────────
export interface StallRecord {
  id: string;
  depot_id: string;
  stall_number: number;
  stall_type: StallType;
  status: StallStatus;
  current_vehicle_id: string | null;
  charger_power_kw: number | null;
  current_session_start: string | null;
  estimated_completion: string | null;
}

export interface AllocationRequest {
  vehicleId: string;
  stallType: StallType;
  depotId: string;
  urgency: number; // 0-100
  nextStallType?: StallType | null; // for sequential allocation
  isMember: boolean;
}

export interface AllocationResult {
  success: boolean;
  stallId: string | null;
  stallNumber: number | null;
  reason?: string;
  waitlistPosition?: number;
}

export interface QueueEntry {
  id: string;
  vehicleId: string;
  vehicleMakeModel: string;
  stallTypeNeeded: StallType;
  requestedAt: string;
  waitTimeSeconds: number;
  estimatedWaitSeconds: number;
  position: number;
  priority: number;
  isFastTracked: boolean;
}

export interface ThroughputMetrics {
  stallType: StallType;
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  utilizationPct: number;
  avgDwellMinutes: number;
  queueDepth: number;
  status: "optimal" | "busy" | "critical" | "underutilized";
}

export interface TransitionRequest {
  vehicleId: string;
  fromStallId: string;
  toStallType: StallType;
  depotId: string;
}

export interface TransitionResult {
  success: boolean;
  newStallId: string | null;
  newStallNumber: number | null;
  queuedForWait: boolean;
  estimatedWaitSeconds: number;
}

// ── Stall scoring weights ──────────────────────────────────────
const SCORE_PROXIMITY = 0.3;
const SCORE_POWER_MATCH = 0.25;
const SCORE_LOAD_BALANCE = 0.2;
const SCORE_SEQUENTIAL = 0.25;

// Section boundaries for sequential scoring
const SECTION_RANGES: Record<string, { min: number; max: number }> = {
  charge_standard: { min: 1, max: 30 },
  charge_fast: { min: 31, max: 40 },
  clean_detail: { min: 41, max: 50 },
  service_bay: { min: 51, max: 51 },
  staging: { min: 52, max: 61 },
};

// ── ResourceManager ────────────────────────────────────────────
export class ResourceManager {
  // ── 1. Stall Allocation ─────────────────────────────────────
  async allocateStall(req: AllocationRequest): Promise<AllocationResult> {
    const { data: stalls, error } = await supabase
      .from("ottoq_ps_depot_stalls")
      .select("*")
      .eq("depot_id", req.depotId)
      .in("stall_type", this.matchingStallTypes(req.stallType));

    if (error || !stalls?.length) {
      return { success: false, stallId: null, stallNumber: null, reason: "No stalls found" };
    }

    const available = (stalls as unknown as StallRecord[]).filter(
      (s) => s.status === "available"
    );

    if (available.length === 0) {
      return {
        success: false,
        stallId: null,
        stallNumber: null,
        reason: "All stalls occupied",
        waitlistPosition: stalls.filter((s: any) => s.status !== "maintenance").length,
      };
    }

    // Score each available stall
    const scored = available.map((s) => ({
      stall: s,
      score: this.scoreStall(s, req, stalls as unknown as StallRecord[]),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Optimistic locking: try to reserve the best stall
    for (const { stall } of scored) {
      const reserved = await this.tryReserveStall(stall.id, req.vehicleId);
      if (reserved) {
        return {
          success: true,
          stallId: stall.id,
          stallNumber: stall.stall_number,
        };
      }
    }

    return {
      success: false,
      stallId: null,
      stallNumber: null,
      reason: "Conflict: all candidates taken",
    };
  }

  private matchingStallTypes(type: StallType): StallType[] {
    if (type === "charge_standard" || type === "charge_fast") {
      return ["charge_standard", "charge_fast"];
    }
    return [type];
  }

  private scoreStall(
    stall: StallRecord,
    req: AllocationRequest,
    allStalls: StallRecord[]
  ): number {
    // Proximity: lower stall number = closer to entrance
    const maxNum = Math.max(...allStalls.map((s) => s.stall_number), 1);
    const proximityScore = 1 - stall.stall_number / maxNum;

    // Power match: fast charger for urgent, standard for non-urgent
    let powerScore = 0.5;
    if (stall.stall_type === "charge_fast" || stall.stall_type === "charge_standard") {
      const isFast = (stall.charger_power_kw ?? 0) >= 150;
      if (req.urgency > 70 && isFast) powerScore = 1;
      else if (req.urgency <= 70 && !isFast) powerScore = 1;
      else powerScore = 0.3;
    }

    // Load balancing: prefer stall in less-occupied circuit (odd vs even)
    const circuit = stall.stall_number % 2;
    const circuitOccupied = allStalls.filter(
      (s) => s.stall_number % 2 === circuit && s.status !== "available"
    ).length;
    const circuitTotal = allStalls.filter(
      (s) => s.stall_number % 2 === circuit
    ).length;
    const loadScore = circuitTotal > 0 ? 1 - circuitOccupied / circuitTotal : 0.5;

    // Sequential positioning: if next service needed, prefer stall near that section
    let seqScore = 0.5;
    if (req.nextStallType) {
      const nextSection = SECTION_RANGES[req.nextStallType];
      if (nextSection) {
        const distToNext = Math.abs(
          stall.stall_number - (nextSection.min + nextSection.max) / 2
        );
        const maxDist = 61;
        seqScore = 1 - distToNext / maxDist;
      }
    }

    return (
      proximityScore * SCORE_PROXIMITY +
      powerScore * SCORE_POWER_MATCH +
      loadScore * SCORE_LOAD_BALANCE +
      seqScore * SCORE_SEQUENTIAL
    );
  }

  // ── 2. Conflict Resolution (Optimistic Locking) ─────────────
  private async tryReserveStall(
    stallId: string,
    vehicleId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("ottoq_ps_depot_stalls")
      .update({
        status: "reserved" as any,
        current_vehicle_id: vehicleId,
        current_session_start: new Date().toISOString(),
      })
      .eq("id", stallId)
      .eq("status", "available")
      .select("id")
      .single();

    return !error && !!data;
  }

  async releaseStall(stallId: string): Promise<boolean> {
    const { error } = await supabase
      .from("ottoq_ps_depot_stalls")
      .update({
        status: "available" as any,
        current_vehicle_id: null,
        current_session_start: null,
        estimated_completion: null,
      })
      .eq("id", stallId);

    return !error;
  }

  // ── 3. Throughput Metrics ───────────────────────────────────
  async getDepotMetrics(depotId: string): Promise<ThroughputMetrics[]> {
    const { data: stalls } = await supabase
      .from("ottoq_ps_depot_stalls")
      .select("*")
      .eq("depot_id", depotId);

    if (!stalls) return [];

    const types: StallType[] = [
      "charge_standard",
      "charge_fast",
      "clean_detail",
      "service_bay",
      "staging",
    ];

    return types.map((type) => {
      const ofType = (stalls as unknown as StallRecord[]).filter(
        (s) => s.stall_type === type
      );
      const total = ofType.length;
      if (total === 0)
        return {
          stallType: type,
          total: 0,
          occupied: 0,
          available: 0,
          maintenance: 0,
          utilizationPct: 0,
          avgDwellMinutes: 0,
          queueDepth: 0,
          status: "optimal" as const,
        };

      const occupied = ofType.filter(
        (s) => s.status === "occupied" || s.status === "reserved"
      ).length;
      const available = ofType.filter((s) => s.status === "available").length;
      const maintenance = ofType.filter(
        (s) => s.status === "maintenance"
      ).length;
      const utilPct = Math.round((occupied / (total - maintenance || 1)) * 100);

      // Average dwell from current sessions
      const now = Date.now();
      const dwellMinutes = ofType
        .filter((s) => s.current_session_start)
        .map(
          (s) =>
            (now - new Date(s.current_session_start!).getTime()) / 60_000
        );
      const avgDwell =
        dwellMinutes.length > 0
          ? Math.round(
              dwellMinutes.reduce((a, b) => a + b, 0) / dwellMinutes.length
            )
          : 0;

      let status: ThroughputMetrics["status"] = "optimal";
      if (utilPct > 85) status = "critical";
      else if (utilPct > 70) status = "busy";
      else if (utilPct < 50) status = "underutilized";

      return {
        stallType: type,
        total,
        occupied,
        available,
        maintenance,
        utilizationPct: utilPct,
        avgDwellMinutes: avgDwell,
        queueDepth: 0, // populated externally
        status,
      };
    });
  }

  // ── 4. Transition Manager ──────────────────────────────────
  async transitionVehicle(req: TransitionRequest): Promise<TransitionResult> {
    // Release current stall
    await this.releaseStall(req.fromStallId);

    // Attempt to allocate next stall
    const result = await this.allocateStall({
      vehicleId: req.vehicleId,
      stallType: req.toStallType,
      depotId: req.depotId,
      urgency: 80,
      isMember: false,
    });

    if (result.success) {
      return {
        success: true,
        newStallId: result.stallId,
        newStallNumber: result.stallNumber,
        queuedForWait: false,
        estimatedWaitSeconds: 0,
      };
    }

    return {
      success: false,
      newStallId: null,
      newStallNumber: null,
      queuedForWait: true,
      estimatedWaitSeconds: 600, // 10 min default
    };
  }

  // ── 5. Maintenance Scheduler ───────────────────────────────
  async markStallMaintenance(
    stallId: string,
    offline: boolean
  ): Promise<boolean> {
    if (offline) {
      const { error } = await supabase
        .from("ottoq_ps_depot_stalls")
        .update({
          status: "maintenance" as any,
          current_vehicle_id: null,
          current_session_start: null,
          estimated_completion: null,
        })
        .eq("id", stallId);
      return !error;
    } else {
      const { error } = await supabase
        .from("ottoq_ps_depot_stalls")
        .update({ status: "available" as any })
        .eq("id", stallId);
      return !error;
    }
  }

  // ── Fetch all stalls ───────────────────────────────────────
  async fetchAllStalls(depotId: string): Promise<StallRecord[]> {
    const { data } = await supabase
      .from("ottoq_ps_depot_stalls")
      .select("*")
      .eq("depot_id", depotId)
      .order("stall_number", { ascending: true });

    return (data ?? []) as unknown as StallRecord[];
  }
}

export const resourceManager = new ResourceManager();
