// src/hooks/use-orchestra-progression.ts
// Orchestra-side hooks for the OTTO-Q progression control engine.
// Backend: separate Supabase project (gxdrcyphqjzjsuhxuqtg) — accessed via ottoQFetch.
// NOTE: ottoQFetch already prepends "/api/v1", so paths here start at the resource.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ottoQFetch } from "@/lib/otto-q-api";

// ─── Types ────────────────────────────────────────────────────────────

export interface VisitReportPlannedStep {
  sequence_order: number;
  service: string;
  assigned_stall_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  target_soc: number | null;
}

export interface VisitReportActualStep {
  sequence_order: number;
  original_sequence_order: number | null;
  service: string;
  actual_stall_id: string | null;
  actual_start: string | null;
  actual_end: string | null;
  soc_at_end: number | null;
  confirmed_by_role: string | null;
  tech_override_action: string | null;
  tech_override_audit_note: string | null;
  abnormality_flagged: boolean;
}

export interface VisitReportOverride {
  at: string;
  action: string;
  audit_note: string;
  by: string;
}

export interface VisitReportAbnormality {
  flagged_at: string;
  flagged_by_role: string;
  resolved_at: string | null;
  resolved_by_role: string | null;
  resolution_note: string | null;
}

export interface VisitReportOemInteraction {
  event: string;
  at: string;
  latency_ms: number | null;
  audit_note: string | null;
  payload: any;
}

export interface VisitReport {
  id: string;
  vehicle_id: string;
  schedule_id: string;
  depot_id: string;
  fleet_operator_id: string;
  visit_started_at: string;
  visit_completed_at: string | null;
  planned_sequence: VisitReportPlannedStep[];
  actual_sequence: VisitReportActualStep[];
  overrides_applied: VisitReportOverride[];
  abnormalities: VisitReportAbnormality[];
  oem_interactions: VisitReportOemInteraction[];
  exceptions_raised: string[];
  deviation_count: number;
  redeployment_status: string;
  variance_minutes: number | null;
  audit_trail_complete: boolean;
  planned_duration_min: number | null;
  actual_duration_min: number | null;
  // Optional context fields the backend may include
  vehicle_external_ref?: string | null;
  vehicle_oem?: string | null;
  depot_name?: string | null;
}

export interface ProgressionDecision {
  id: string;
  decision: string;
  vehicle_id: string | null;
  vehicle_external_ref?: string | null;
  vehicle_oem?: string | null;
  depot_id: string | null;
  depot_name?: string | null;
  schedule_id: string | null;
  task_id: string | null;
  sequence_order: number | null;
  from_sequence_order?: number | null;
  to_sequence_order?: number | null;
  audit_note: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  // For oem_gate_pending rows
  expires_at?: string | null;
  on_timeout?: string | null;
}

export interface PendingOemGate extends ProgressionDecision {
  task_id: string;
  expires_at: string;
}

// ─── Queries ──────────────────────────────────────────────────────────

export function useVisitReport(scheduleId: string | null) {
  return useQuery({
    queryKey: ["visit-report", scheduleId],
    queryFn: () => ottoQFetch<VisitReport>(`/visit-reports/${scheduleId}`),
    enabled: !!scheduleId,
    staleTime: 30_000,
  });
}

export function useVehicleVisitHistory(vehicleId: string | null, limit = 10) {
  return useQuery({
    queryKey: ["visit-history", vehicleId, limit],
    queryFn: () =>
      ottoQFetch<{ vehicle_id: string; count: number; reports: VisitReport[] }>(
        `/vehicles/${vehicleId}/visit-history?limit=${limit}`,
      ),
    enabled: !!vehicleId,
    staleTime: 30_000,
  });
}

export function useProgressionDecisions(filters: {
  depot_id?: string;
  decision?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["progression-decisions", "orchestra", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.depot_id) params.append("depot_id", filters.depot_id);
      if (filters.decision) params.append("decision", filters.decision);
      params.append("limit", String(filters.limit ?? 50));
      return ottoQFetch<{ count: number; decisions: ProgressionDecision[] }>(
        `/progression-decisions?${params.toString()}`,
      );
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function usePendingOemGates(depotId?: string) {
  return useQuery({
    queryKey: ["pending-oem-gates", depotId ?? "all"],
    queryFn: () => {
      const params = new URLSearchParams();
      if (depotId) params.append("depot_id", depotId);
      params.append("decision", "oem_gate_pending");
      params.append("limit", "25");
      return ottoQFetch<{ count: number; decisions: PendingOemGate[] }>(
        `/progression-decisions?${params.toString()}`,
      );
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────

export function useOemAccept() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      taskId: string;
      accepted: boolean;
      accepted_by: string;
      reason?: string;
    }) => {
      const { taskId, ...body } = args;
      return ottoQFetch<{ ok: boolean; task_id: string; accepted: boolean }>(
        `/tasks/${taskId}/oem-accept`,
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-oem-gates"] });
      qc.invalidateQueries({ queryKey: ["progression-decisions"] });
      qc.invalidateQueries({ queryKey: ["visit-history"] });
    },
  });
}

export function useOemMidFlowFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      vehicleId: string;
      flagged_by: string;
      reason: string;
      severity?: "low" | "medium" | "high" | "critical";
      sequester?: boolean;
    }) => {
      const { vehicleId, ...body } = args;
      return ottoQFetch<{ ok: boolean; vehicle_id: string; sequestered: boolean }>(
        `/vehicles/${vehicleId}/oem-flag`,
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["visit-history", args.vehicleId] });
      qc.invalidateQueries({ queryKey: ["progression-decisions"] });
    },
  });
}
