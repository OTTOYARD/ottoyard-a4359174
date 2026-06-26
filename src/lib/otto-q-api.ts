// OTTO-Q Strategic API helper. Connects Orchestra to the OTTO-Q backend
// (separate Supabase project) for cross-depot fleet aggregates, AI Brain
// metrics and historical energy series.

const OTTOQ_BASE =
  (import.meta.env.VITE_OTTOQ_BASE_URL as string | undefined) ||
  "https://gxdrcyphqjzjsuhxuqtg.supabase.co/functions/v1/otto-q-api/api/v1";

const OTTOQ_KEY =
  (import.meta.env.VITE_OTTOQ_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4ZHJjeXBocWp6anN1aHh1cXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjk3MDMsImV4cCI6MjA5MDkwNTcwM30.v7erbnrlciPknvx_EpUpewXrvR9-F3D-hH-jWmTW0zI";

export async function ottoQFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${OTTOQ_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OTTOQ_KEY}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`OTTO-Q ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  // OTTO-Q wraps responses in { data, meta }
  return (json?.data ?? json) as T;
}

// Direct invoke of an OTTO-Q edge FUNCTION on otto-q-core (not the otto-q-api REST gateway).
// Used for the frontier functions (orchestrate-tick, amend, cleaning-cadence, …) that aren't
// exposed under /api/v1. Reuses the otto-q-core base URL + anon key above (correct project).
const OTTOQ_FN_BASE = OTTOQ_BASE.replace(/\/otto-q-api\/api\/v1\/?$/, "");

export async function ottoqInvoke<T = unknown>(fn: string, body?: unknown): Promise<T> {
  const res = await fetch(`${OTTOQ_FN_BASE}/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OTTOQ_KEY}`,
      apikey: OTTOQ_KEY,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`OTTO-Q ${fn} ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// otto-q-core root (PostgREST RPC + table reads), derived from the same base + anon key.
const OTTOQ_ROOT = OTTOQ_FN_BASE.replace(/\/functions\/v1$/, "");

// Call a SQL function on otto-q-core via PostgREST RPC (the frontier control fns).
export async function ottoqRpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${OTTOQ_ROOT}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OTTOQ_KEY}`, apikey: OTTOQ_KEY },
    body: JSON.stringify(args ?? {}),
  });
  if (!res.ok) throw new Error(`OTTO-Q rpc ${fn} ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// Read a table on otto-q-core via PostgREST (e.g. ottoq_cil_adoptions, ottoq_policy_params).
export async function ottoqTable<T = unknown>(table: string, query: string): Promise<T> {
  const res = await fetch(`${OTTOQ_ROOT}/rest/v1/${table}?${query}`, {
    headers: { Authorization: `Bearer ${OTTOQ_KEY}`, apikey: OTTOQ_KEY },
  });
  if (!res.ok) throw new Error(`OTTO-Q table ${table} ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// --- Type definitions ---

export interface FleetSummaryDepot {
  id: string;
  name: string;
  city: string;
  state: string;
  vehicles: number;
  on_site: number;
  charging: number;
  in_service: number;
  stalls_total: number;
  stalls_occupied: number;
  stalls_available: number;
  active_exceptions: number;
  active_ottow_missions: number;
  utilization_pct: number;
}

export interface FleetSummary {
  depots: FleetSummaryDepot[];
  totals: {
    vehicles: number;
    on_site: number;
    charging: number;
    in_service: number;
    staged: number;
    en_route: number;
  };
  soc_distribution: {
    critical: number;
    low: number;
    medium: number;
    high: number;
    full: number;
  };
  stall_utilization: {
    total: number;
    occupied: number;
    available: number;
    maintenance: number;
  };
  active_exceptions: number;
  active_ottow_missions: number;
  timestamp: string;
}

export interface AIRecentAction {
  id: string;
  depot_id: string;
  action_type: string;
  status: string;
  summary: string;
  created_at: string;
  completed_at: string | null;
}

export interface AIFleetSummary {
  depots: Array<{
    id: string;
    name: string;
    accuracy: number | null;
    active_risks: number;
    actions_24h: number;
  }>;
  model_accuracy: {
    overall: number | null;
    by_type: Record<string, number | null>;
  };
  active_risks: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  autonomous_actions_today: {
    executed: number;
    pending: number;
    failed: number;
    rolled_back: number;
  };
  recent_actions: AIRecentAction[];
  timestamp: string;
}

export interface EnergyHistoryPoint {
  snapshot_at: string;
  current_demand_kw: number;
  peak_demand_kw_15min: number;
  solar_generation_kw: number;
  bess_output_kw: number;
  current_rate_per_kwh: number | null;
}

export interface EnergyHistory {
  depot_id: string;
  range: string;
  series: EnergyHistoryPoint[];
  summary: {
    avg_demand_kw: number;
    peak_demand_kw: number;
    total_solar_kwh: number;
    total_bess_kwh: number;
    sample_count: number;
  };
  timestamp: string;
}

// --- Schedule Intelligence (P3c) ---

export type RiskLevel = "none" | "low" | "medium" | "high";
export type SchedulingCategory =
  | "timing"
  | "load_balancing"
  | "energy_policy"
  | "capacity"
  | "health"
  | "notification"
  | "other";

export interface ScheduleIntelligenceWave {
  id: string;
  depot_id: string;
  depot_name: string | null;
  wave_code: string;
  scheduled_date: string;
  arrival_window_start: string;
  arrival_window_end: string;
  departure_window_start: string | null;
  departure_window_end: string | null;
  vehicle_count: number;
  status: "planned" | "arriving" | "in_progress" | "completed" | "cancelled";
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  ai_recommendation_count: number;
  ai_recommendations: Array<{
    id: string;
    prediction_type: string;
    title: string;
    confidence: number;
  }>;
}

export interface PendingOptimization {
  id: string;
  depot_id: string;
  depot_name: string | null;
  vehicle_id: string | null;
  vehicle_display_name: string | null;
  fleet_operator_name: string | null;
  prediction_type: string;
  category: SchedulingCategory;
  title: string;
  description: string;
  recommendation: any;
  confidence: number;
  priority_score: number;
  risk_factors: string[];
  created_at: string;
  expires_at: string | null;
}

export interface AppliedOptimization {
  id: string;
  depot_id: string;
  depot_name: string | null;
  prediction_id: string | null;
  action_type: string;
  category: string;
  summary: string;
  confidence: number;
  approval_method:
    | "auto_threshold"
    | "human_approved"
    | "claude_reasoning"
    | "cron_triggered";
  risk_factors: string[];
  estimated_impact: string | null;
  estimated_savings_kwh: number | null;
  estimated_savings_usd: number | null;
  status:
    | "pending"
    | "executing"
    | "completed"
    | "failed"
    | "rolled_back"
    | "skipped";
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface DemandForecastPoint {
  time: string;
  predicted_demand_kw: number;
  predicted_solar_kw: number;
  predicted_rate_per_kwh: number | null;
  source: "prediction" | "historical_pattern";
  confidence: number;
}

export interface ScheduleIntelligence {
  window: { start: string; end: string; hours: number };
  waves: ScheduleIntelligenceWave[];
  pending_optimizations: PendingOptimization[];
  applied_optimizations_24h: AppliedOptimization[];
  demand_forecast: DemandForecastPoint[];
  summary: {
    waves_count: number;
    pending_count: number;
    applied_count_24h: number;
    avg_risk_score: number;
    estimated_savings_kwh_24h: number;
    estimated_savings_usd_24h: number;
    high_risk_waves: number;
    medium_risk_waves: number;
  };
  engine_status: {
    last_snapshot_at: string | null;
    last_prediction_at: string | null;
    last_action_at: string | null;
    snapshot_age_min: number | null;
    healthy: boolean;
    depots_tracked: number;
  };
}
