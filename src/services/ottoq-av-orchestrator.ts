// OTTO-Q Autonomous Vehicle Orchestrator — Zero-human-input depot lifecycle management

import type {
  OttoQVehicle,
  OttoQDepotStall,
  ServiceType,
  StallType,
} from "@/types/ottoq";
import {
  ThresholdEngine,
  type PredictedServiceNeed,
  type ChargeRecommendation,
} from "@/services/ottoq-engine";

// ── Pipeline types ─────────────────────────────────────────────
export type PipelineStepStatus = "pending" | "active" | "completed" | "blocked";
export type AVLifecycleState =
  | "ARRIVED"
  | "QUEUED"
  | "IN_SERVICE"
  | "TRANSITIONING"
  | "STAGING"
  | "DEPLOYED";

export interface PipelineStep {
  id: string;
  serviceType: ServiceType;
  stallType: StallType;
  assignedStallId: string | null;
  assignedStallNumber: number | null;
  estimatedDurationMinutes: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: PipelineStepStatus;
  progress: number; // 0-100
}

export interface ServicePipeline {
  vehicleId: string;
  vehicleMakeModel: string;
  state: AVLifecycleState;
  steps: PipelineStep[];
  currentStepIndex: number;
  arrivalTime: string;
  estimatedReadyTime: string;
  totalDurationMinutes: number;
}

export interface DemandWindow {
  label: string;
  startHour: number;
  endHour: number;
  vehiclesNeeded: number;
  vehiclesAvailable: number;
  deficit: number;
}

export interface EnergyArbitrageResult {
  totalKwhConsumed: number;
  avgCostPerKwh: number;
  savingsVsPeakDollars: number;
  savingsPercent: number;
  projectedMonthlySavings: number;
  hourlyConsumption: { hour: number; kwh: number; rate: number }[];
  currentRateTier: string;
  minutesUntilRateChange: number;
}

export interface TransitionEvent {
  timestamp: string;
  vehicleId: string;
  fromState: AVLifecycleState;
  toState: AVLifecycleState;
  stepLabel: string;
  stallId: string | null;
}

// ── Demand patterns ────────────────────────────────────────────
const WEEKDAY_DEMAND: Record<number, number> = {
  0: 2, 1: 2, 2: 2, 3: 2, 4: 3, 5: 4,
  6: 8, 7: 8, 8: 8, 9: 6, 10: 5, 11: 5,
  12: 5, 13: 5, 14: 6, 15: 7, 16: 8,
  17: 10, 18: 10, 19: 10, 20: 7, 21: 5, 22: 3, 23: 2,
};

const WEEKEND_DEMAND: Record<number, number> = {
  0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 3,
  6: 4, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5,
  12: 5, 13: 5, 14: 5, 15: 5, 16: 5,
  17: 5, 18: 5, 19: 5, 20: 4, 21: 3, 22: 3, 23: 2,
};

// ── Service sequencing order ───────────────────────────────────
const SERVICE_SEQUENCE_PRIORITY: ServiceType[] = [
  "detail_clean",
  "tire_rotation",
  "battery_health_check",
  "full_service",
  "charge",
];

const SERVICE_TO_STALL: Record<ServiceType, StallType> = {
  charge: "charge_standard",
  detail_clean: "clean_detail",
  tire_rotation: "service_bay",
  battery_health_check: "service_bay",
  full_service: "service_bay",
};

// ── Peak energy rate for comparison ────────────────────────────
const PEAK_RATE = 0.14;

// ── AVOrchestrator ─────────────────────────────────────────────
export class AVOrchestrator {
  private engine: ThresholdEngine;
  private pipelines: Map<string, ServicePipeline> = new Map();
  private events: TransitionEvent[] = [];
  private energyLog: { hour: number; kwh: number; rate: number }[] = [];
  private surgeMultiplier = 1;

  constructor(engine: ThresholdEngine) {
    this.engine = engine;
  }

  // ── 1. Vehicle Intake Pipeline ─────────────────────────────
  triggerArrival(
    vehicle: OttoQVehicle,
    availableStalls: OttoQDepotStall[],
    thresholdDurations: Map<ServiceType, number>
  ): ServicePipeline {
    const needs = this.engine.generatePriorityQueue([vehicle]);
    const chargeRec = this.engine.getChargeRecommendation(vehicle);

    // Always include charge if SOC < 90
    const serviceSet = new Set<ServiceType>();
    if (vehicle.current_soc_percent < 90) serviceSet.add("charge");
    for (const n of needs) serviceSet.add(n.serviceType);

    // Order services optimally: do non-charge first (while waiting for charger)
    const ordered = SERVICE_SEQUENCE_PRIORITY.filter((s) => serviceSet.has(s));

    const now = new Date();
    let cursor = now.getTime();
    const steps: PipelineStep[] = [];

    for (const svc of ordered) {
      const stallType = SERVICE_TO_STALL[svc];
      const duration = thresholdDurations.get(svc) ?? 30;
      const stall = this.findBestStall(availableStalls, stallType, svc, chargeRec);

      const step: PipelineStep = {
        id: `${vehicle.id}-${svc}-${Date.now()}`,
        serviceType: svc,
        stallType,
        assignedStallId: stall?.id ?? null,
        assignedStallNumber: stall?.stall_number ?? null,
        estimatedDurationMinutes: duration,
        estimatedStartTime: new Date(cursor).toISOString(),
        estimatedEndTime: new Date(cursor + duration * 60_000).toISOString(),
        actualStartTime: null,
        actualEndTime: null,
        status: "pending",
        progress: 0,
      };
      steps.push(step);
      cursor += duration * 60_000 + 5 * 60_000; // 5 min transition buffer
    }

    const pipeline: ServicePipeline = {
      vehicleId: vehicle.id,
      vehicleMakeModel: `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim(),
      state: "ARRIVED",
      steps,
      currentStepIndex: -1,
      arrivalTime: now.toISOString(),
      estimatedReadyTime: new Date(cursor).toISOString(),
      totalDurationMinutes: Math.round((cursor - now.getTime()) / 60_000),
    };

    this.pipelines.set(vehicle.id, pipeline);
    this.logEvent(vehicle.id, "ARRIVED", "QUEUED", "Intake complete");

    // Auto-advance to first step
    this.advancePipeline(vehicle.id);

    return pipeline;
  }

  private findBestStall(
    stalls: OttoQDepotStall[],
    stallType: StallType,
    serviceType: ServiceType,
    chargeRec: ChargeRecommendation
  ): OttoQDepotStall | null {
    const candidates = stalls.filter(
      (s) => s.stall_type === stallType && s.status === "available"
    );
    if (candidates.length === 0) {
      // Try fast charger for urgent charges
      if (serviceType === "charge" && chargeRec.recommendedChargerType === "fast") {
        const fastStalls = stalls.filter(
          (s) => s.stall_type === "charge_fast" && s.status === "available"
        );
        return fastStalls[0] ?? null;
      }
      return null;
    }
    return candidates[0];
  }

  // ── 2. Task Chaining Engine ────────────────────────────────
  advancePipeline(vehicleId: string): ServicePipeline | null {
    const pipeline = this.pipelines.get(vehicleId);
    if (!pipeline) return null;

    // Complete current step
    if (pipeline.currentStepIndex >= 0) {
      const current = pipeline.steps[pipeline.currentStepIndex];
      current.status = "completed";
      current.progress = 100;
      current.actualEndTime = new Date().toISOString();
    }

    // Move to next
    pipeline.currentStepIndex++;

    if (pipeline.currentStepIndex >= pipeline.steps.length) {
      // All done → staging
      pipeline.state = "STAGING";
      this.logEvent(vehicleId, "IN_SERVICE", "STAGING", "All services complete");
      return pipeline;
    }

    const next = pipeline.steps[pipeline.currentStepIndex];

    if (!next.assignedStallId) {
      // Stall not available → blocked
      next.status = "blocked";
      pipeline.state = "QUEUED";
      this.logEvent(vehicleId, "IN_SERVICE", "QUEUED", `Waiting for ${next.serviceType} stall`);
      return pipeline;
    }

    next.status = "active";
    next.actualStartTime = new Date().toISOString();
    pipeline.state = pipeline.currentStepIndex > 0 ? "IN_SERVICE" : "IN_SERVICE";

    this.logEvent(
      vehicleId,
      "TRANSITIONING",
      "IN_SERVICE",
      `${next.serviceType} at stall #${next.assignedStallNumber ?? "?"}`
    );

    return pipeline;
  }

  deployVehicle(vehicleId: string): void {
    const pipeline = this.pipelines.get(vehicleId);
    if (!pipeline) return;
    pipeline.state = "DEPLOYED";
    this.logEvent(vehicleId, "STAGING", "DEPLOYED", "Deployed for service");
  }

  // ── 3. Demand Prediction ───────────────────────────────────
  getDemandForecast(isSurge = false): DemandWindow[] {
    const mult = isSurge ? 2 : this.surgeMultiplier;
    const isWeekend = [0, 6].includes(new Date().getDay());
    const pattern = isWeekend ? WEEKEND_DEMAND : WEEKDAY_DEMAND;
    const windows: DemandWindow[] = [];

    const staged = this.getStagedCount();

    for (let h = 0; h < 24; h++) {
      const needed = Math.round((pattern[h] ?? 5) * mult);
      windows.push({
        label: `${h.toString().padStart(2, "0")}:00`,
        startHour: h,
        endHour: (h + 1) % 24,
        vehiclesNeeded: needed,
        vehiclesAvailable: staged,
        deficit: Math.max(0, needed - staged),
      });
    }
    return windows;
  }

  getChargerPriority(hoursUntilNeeded: number): "fast" | "standard" {
    return hoursUntilNeeded <= 2 ? "fast" : "standard";
  }

  setSurgeMultiplier(m: number): void {
    this.surgeMultiplier = m;
  }

  // ── 4. Energy Arbitrage ────────────────────────────────────
  computeEnergyArbitrage(vehicleCount: number): EnergyArbitrageResult {
    const hourly: { hour: number; kwh: number; rate: number }[] = [];
    let totalKwh = 0;
    let totalCost = 0;
    let peakCost = 0;

    for (let h = 0; h < 24; h++) {
      const rate = this.getRateForHour(h);
      // Simulate: most charging happens off-peak
      const isOffPeak = h >= 22 || h < 6;
      const isShoulder = (h >= 6 && h < 14) || (h >= 20 && h < 22);
      let kwh: number;
      if (isOffPeak) kwh = vehicleCount * 3.5; // heavy off-peak
      else if (isShoulder) kwh = vehicleCount * 0.8;
      else kwh = vehicleCount * 0.3; // minimal peak

      totalKwh += kwh;
      totalCost += kwh * rate;
      peakCost += kwh * PEAK_RATE;
      hourly.push({ hour: h, kwh: Math.round(kwh * 10) / 10, rate });
    }

    const savings = peakCost - totalCost;
    const currentHour = new Date().getHours();
    const currentTier = this.getTierName(currentHour);
    const minsUntilChange = this.minutesUntilNextTierChange(currentHour);

    return {
      totalKwhConsumed: Math.round(totalKwh),
      avgCostPerKwh: Math.round((totalCost / Math.max(totalKwh, 1)) * 1000) / 1000,
      savingsVsPeakDollars: Math.round(savings * 100) / 100,
      savingsPercent: Math.round((savings / Math.max(peakCost, 1)) * 100),
      projectedMonthlySavings: Math.round(savings * 30 * 100) / 100,
      hourlyConsumption: hourly,
      currentRateTier: currentTier,
      minutesUntilRateChange: minsUntilChange,
    };
  }

  private getRateForHour(h: number): number {
    if (h >= 22 || h < 6) return 0.06;
    if ((h >= 6 && h < 14) || (h >= 20 && h < 22)) return 0.09;
    return 0.14;
  }

  private getTierName(h: number): string {
    if (h >= 22 || h < 6) return "Off-Peak";
    if ((h >= 6 && h < 14) || (h >= 20 && h < 22)) return "Shoulder";
    return "Peak";
  }

  private minutesUntilNextTierChange(h: number): number {
    const boundaries = [6, 14, 20, 22];
    const now = new Date();
    const currentMinutes = h * 60 + now.getMinutes();
    for (const b of boundaries) {
      const bMin = b * 60;
      if (bMin > currentMinutes) return bMin - currentMinutes;
    }
    // Wrap to next day's first boundary (6am)
    return (24 * 60 - currentMinutes) + 6 * 60;
  }

  // ── Accessors ──────────────────────────────────────────────
  getPipelines(): ServicePipeline[] {
    return Array.from(this.pipelines.values());
  }

  getPipeline(vehicleId: string): ServicePipeline | undefined {
    return this.pipelines.get(vehicleId);
  }

  getEvents(): TransitionEvent[] {
    return [...this.events].reverse();
  }

  getStagedCount(): number {
    let count = 0;
    for (const p of this.pipelines.values()) {
      if (p.state === "STAGING") count++;
    }
    return count;
  }

  getInServiceCount(): number {
    let count = 0;
    for (const p of this.pipelines.values()) {
      if (p.state === "IN_SERVICE" || p.state === "TRANSITIONING") count++;
    }
    return count;
  }

  getDeployedCount(): number {
    let count = 0;
    for (const p of this.pipelines.values()) {
      if (p.state === "DEPLOYED") count++;
    }
    return count;
  }

  simulateProgress(): void {
    for (const pipeline of this.pipelines.values()) {
      if (pipeline.state !== "IN_SERVICE") continue;
      const step = pipeline.steps[pipeline.currentStepIndex];
      if (!step || step.status !== "active") continue;

      step.progress = Math.min(100, step.progress + Math.random() * 15 + 5);

      if (step.progress >= 100) {
        this.advancePipeline(pipeline.vehicleId);
      }
    }
  }

  resetSimulation(): void {
    this.pipelines.clear();
    this.events = [];
    this.surgeMultiplier = 1;
  }

  private logEvent(
    vehicleId: string,
    from: AVLifecycleState,
    to: AVLifecycleState,
    label: string
  ): void {
    this.events.push({
      timestamp: new Date().toISOString(),
      vehicleId,
      fromState: from,
      toState: to,
      stepLabel: label,
      stallId: null,
    });
    // Keep last 200
    if (this.events.length > 200) this.events = this.events.slice(-200);
  }
}
