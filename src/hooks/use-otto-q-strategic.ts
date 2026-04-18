import { useQuery } from "@tanstack/react-query";
import {
  ottoQFetch,
  FleetSummary,
  AIFleetSummary,
  EnergyHistory,
} from "@/lib/otto-q-api";

export function useFleetSummary() {
  return useQuery<FleetSummary>({
    queryKey: ["otto-q", "fleet-summary"],
    queryFn: () => ottoQFetch<FleetSummary>("/fleet/summary"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useAIFleetSummary() {
  return useQuery<AIFleetSummary>({
    queryKey: ["otto-q", "ai-fleet-summary"],
    queryFn: () => ottoQFetch<AIFleetSummary>("/ai/fleet-summary"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useEnergyHistory(
  range: "24h" | "7d" | "30d" | "90d",
  depotId?: string
) {
  const qs = new URLSearchParams({ range });
  if (depotId) qs.set("depot_id", depotId);
  return useQuery<EnergyHistory>({
    queryKey: ["otto-q", "energy-history", range, depotId || "all"],
    queryFn: () => ottoQFetch<EnergyHistory>(`/energy/history?${qs}`),
    staleTime: 5 * 60 * 1000,
  });
}
