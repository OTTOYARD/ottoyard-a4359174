import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ottoqRpc, ottoqTable } from "@/lib/otto-q-api";

// Frontier controls on the OTTO-Q brain (otto-q-core), called directly via PostgREST RPC/table.
// No mocks — energy control, the live confidence read, and the self-improving (CIL) log.

const DEPOT_ID = "11111111-1111-1111-1111-111111111111";

// ---- Live status + how confident OTTO-Q is right now ---------------------------------------
export interface OttoQStatusBrief {
  active_run: boolean;
  note?: string;
  sim_clock?: string;
  energy_aggressiveness_factor?: number;
  forecast_uncertainty_0to1?: number;
  battery_soc_pct?: number;
  recent_grid_peak_kw?: number;
  ready_to_deploy?: number;
  charging_now?: number;
  unsafe_so_far?: number;
}

export function useStatusBrief() {
  return useQuery<OttoQStatusBrief>({
    queryKey: ["ottoq-status-brief"],
    queryFn: () => ottoqRpc<OttoQStatusBrief>("ottoq_nl_status_brief", { p_sim_run_id: null }),
    refetchInterval: 15000,
  });
}

// ---- Energy aggressiveness dial -------------------------------------------------------------
// UI "aggressiveness" 0..1 (1 = shave the peak hardest). Backend stores energy_demand_factor_peak
// in [0.25..0.95] where a LOWER factor shaves harder, so we invert.
const FACTOR_MIN = 0.25;
const FACTOR_MAX = 0.95;
export const aggressivenessToFactor = (a: number) =>
  +(FACTOR_MAX - Math.max(0, Math.min(1, a)) * (FACTOR_MAX - FACTOR_MIN)).toFixed(3);
export const factorToAggressiveness = (f: number) =>
  Math.max(0, Math.min(1, (FACTOR_MAX - f) / (FACTOR_MAX - FACTOR_MIN)));

export function useEnergyAggressiveness() {
  return useQuery({
    queryKey: ["ottoq-energy-aggressiveness"],
    queryFn: async () => {
      const rows = await ottoqTable<{ param_value: number }[]>(
        "ottoq_policy_params",
        `select=param_value&scope_type=eq.depot&scope_id=eq.${DEPOT_ID}&param_key=eq.energy_demand_factor_peak`
      );
      const factor = rows?.[0]?.param_value ?? 0.5;
      return { factor, aggressiveness: factorToAggressiveness(factor) };
    },
  });
}

export interface PolicySetResult {
  ok: boolean;
  applied: number;
  requested: number;
  clamped: boolean;
  safe_range: [number, number];
}

export function useSetEnergyAggressiveness() {
  const qc = useQueryClient();
  return useMutation<PolicySetResult, Error, number>({
    mutationFn: (aggressiveness: number) =>
      ottoqRpc<PolicySetResult>("ottoq_policy_set", {
        p_scope_type: "depot",
        p_scope_id: DEPOT_ID,
        p_param_key: "energy_demand_factor_peak",
        p_param_value: aggressivenessToFactor(aggressiveness),
        p_by: "orchestra_ui",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ottoq-energy-aggressiveness"] });
      qc.invalidateQueries({ queryKey: ["ottoq-status-brief"] });
    },
  });
}

// ---- Self-improving loop (CIL) audit log ----------------------------------------------------
export interface CilAdoption {
  decided_at: string;
  adopted: boolean;
  plan_label: string;
  rationale: string;
  score_current: number | null;
  score_adopted: number | null;
}

export function useCilAdoptions(limit = 6) {
  return useQuery<CilAdoption[]>({
    queryKey: ["ottoq-cil-adoptions", limit],
    queryFn: () =>
      ottoqTable<CilAdoption[]>(
        "ottoq_cil_adoptions",
        `select=decided_at,adopted,plan_label,rationale,score_current,score_adopted&order=decided_at.desc&limit=${limit}`
      ),
    refetchInterval: 30000,
  });
}
