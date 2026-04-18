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
