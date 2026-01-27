import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  OTTOQCity,
  SimulatorStateRow,
  UiDepot,
  UiVehicle
} from "./ottoqTypes";

export async function getCityByName(cityName: string): Promise<OTTOQCity | null> {
  const { data, error } = await supabase
    .from("ottoq_cities")
    .select("id,name,tz")
    .eq("name", cityName)
    .maybeSingle();

  if (error) throw error;
  return data as OTTOQCity | null;
}

export async function getOrCreateSimulatorState(): Promise<SimulatorStateRow> {
  const { data, error } = await supabase
    .from("ottoq_simulator_state")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as SimulatorStateRow;

  const insertPayload = {
    is_running: false,
    mode: "auto",
    config_jsonb: {
      cities: ["Nashville", "Austin", "LA"],
      utilization_target: 0.5,
      reset_interval_seconds: 420,
      reservation_interval_seconds: 45,
      job_durations: {
        CHARGE: { avg: 2400, variance: 600 },
        DETAILING: { avg: 5400, variance: 1800 },
        MAINTENANCE: { avg: 10800, variance: 3600 },
        DOWNTIME_PARK: { avg: 3600, variance: 900 }
      }
    }
  };

  const { data: created, error: createErr } = await supabase
    .from("ottoq_simulator_state")
    .insert(insertPayload)
    .select("*")
    .single();

  if (createErr) throw createErr;
  return created as SimulatorStateRow;
}

export async function simulatorStart(): Promise<void> {
  // Try RPC first
  const { error: rpcError } = await supabase.rpc("ottoq_sim_set_state", {
    p_is_running: true,
    p_mode: null
  });
  
  if (rpcError) {
    // Fallback to direct update
    const state = await getOrCreateSimulatorState();
    const { error } = await supabase.from("ottoq_simulator_state").update({ is_running: true }).eq("id", state.id);
    if (error) throw error;
  }
}

export async function simulatorStop(): Promise<void> {
  // Try RPC first
  const { error: rpcError } = await supabase.rpc("ottoq_sim_set_state", {
    p_is_running: false,
    p_mode: null
  });
  
  if (rpcError) {
    // Fallback to direct update
    const state = await getOrCreateSimulatorState();
    const { error } = await supabase.from("ottoq_simulator_state").update({ is_running: false }).eq("id", state.id);
    if (error) throw error;
  }
}

export async function simulatorReset(): Promise<void> {
  const state = await getOrCreateSimulatorState();
  const { error } = await supabase
    .from("ottoq_simulator_state")
    .update({ last_reset_at: new Date().toISOString() })
    .eq("id", state.id);
  if (error) throw error;
}

export async function simulatorSetMode(mode: string): Promise<void> {
  // Try RPC first
  const { error: rpcError } = await supabase.rpc("ottoq_sim_set_state", {
    p_is_running: null,
    p_mode: mode
  });
  
  if (rpcError) {
    // Fallback to direct update
    const state = await getOrCreateSimulatorState();
    const { error } = await supabase.from("ottoq_simulator_state").update({ mode }).eq("id", state.id);
    if (error) throw error;
  }
}

export async function simulatorUpdateConfig(config: Record<string, unknown>): Promise<void> {
  // Try RPC first - cast config to Json type
  const jsonConfig = config as Json;
  const { error: rpcError } = await supabase.rpc("ottoq_sim_set_state", {
    p_is_running: null,
    p_mode: null,
    p_config: jsonConfig
  });
  
  if (rpcError) {
    // Fallback to direct update
    const state = await getOrCreateSimulatorState();
    const { error } = await supabase.from("ottoq_simulator_state").update({ 
      config_jsonb: jsonConfig
    }).eq("id", state.id);
    if (error) throw error;
  }
}

// Helpers for Index.tsx transformation consistency
export function mapDbVehicleStatusToUi(dbStatus: string, soc: number, index: number): "active" | "charging" | "maintenance" | "idle" {
  const s = String(dbStatus || "").toUpperCase();
  switch (s) {
    case "ON_TRIP":
    case "IN_SERVICE":
      return "active";
    case "AT_DEPOT":
    case "ENROUTE_DEPOT":
      return soc < 0.5 ? "charging" : "idle";
    case "IDLE":
      return index % 8 === 0 ? "maintenance" : "idle";
    default:
      return "idle";
  }
}

export function computeVehicleStatusCounts(vehicles: UiVehicle[]) {
  const counts = { active: 0, charging: 0, maintenance: 0, idle: 0 };
  for (const v of vehicles) {
    if (v.status === "active") counts.active += 1;
    else if (v.status === "charging") counts.charging += 1;
    else if (v.status === "maintenance") counts.maintenance += 1;
    else counts.idle += 1;
  }
  return counts;
}

export function computeDepotTotals(depots: UiDepot[]) {
  const totals = {
    energyGenerated: 0,
    energyReturned: 0,
    totalStalls: 0,
    availableStalls: 0
  };
  for (const d of depots) {
    totals.energyGenerated += d.energyGenerated || 0;
    totals.energyReturned += d.energyReturned || 0;
    totals.totalStalls += d.totalStalls || 0;
    totals.availableStalls += d.availableStalls || 0;
  }
  return totals;
}

export function occupancyRatePct(totalStalls: number, availableStalls: number) {
  if (!totalStalls || totalStalls <= 0) return 0;
  return Math.round(((totalStalls - availableStalls) / totalStalls) * 100);
}
