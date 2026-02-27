// useOttoQEngine — Simulated cron-based threshold engine hook
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ThresholdEngine,
  type PredictedServiceNeed,
  type BundledServiceRecommendation,
  type ChargeRecommendation,
} from "@/services/ottoq-engine";
import type {
  OttoQVehicle,
  OttoQServiceThreshold,
  OttoQEnergyPricing,
} from "@/types/ottoq";

type EngineStatus = "idle" | "scanning" | "processing";

interface AlertEntry {
  id: string;
  vehicleId: string;
  vehicleMakeModel: string;
  serviceType: string;
  urgencyScore: number;
  message: string;
  severity: "routine" | "warning" | "critical";
  timestamp: string;
}

interface EngineState {
  currentQueue: PredictedServiceNeed[];
  pendingNotifications: PredictedServiceNeed[];
  recentAlerts: AlertEntry[];
  bundles: BundledServiceRecommendation[];
  chargeRecommendations: ChargeRecommendation[];
  engineStatus: EngineStatus;
  lastScanTimestamp: string | null;
  vehiclesMonitored: number;
  activePredictions: number;
  scheduledToday: number;
  depotUtilizationPct: number;
  currentEnergyTier: string;
}

export function useOttoQEngine(intervalMs = 30_000) {
  const [state, setState] = useState<EngineState>({
    currentQueue: [],
    pendingNotifications: [],
    recentAlerts: [],
    bundles: [],
    chargeRecommendations: [],
    engineStatus: "idle",
    lastScanTimestamp: null,
    vehiclesMonitored: 0,
    activePredictions: 0,
    scheduledToday: 0,
    depotUtilizationPct: 0,
    currentEnergyTier: "unknown",
  });

  const prevQueueRef = useRef<Map<string, number>>(new Map());
  const alertsRef = useRef<AlertEntry[]>([]);

  const scan = useCallback(async () => {
    setState((s) => ({ ...s, engineStatus: "scanning" }));

    try {
      // Fetch data in parallel
      const [vehiclesRes, thresholdsRes, pricingRes, stallsRes] = await Promise.all([
        supabase
          .from("ottoq_ps_vehicles")
          .select("*")
          .in("status", ["active", "charging", "in_service", "staged"]),
        supabase.from("ottoq_ps_service_thresholds").select("*"),
        supabase.from("ottoq_ps_energy_pricing").select("*"),
        supabase.from("ottoq_ps_depot_stalls").select("status"),
      ]);

      const vehicles = (vehiclesRes.data ?? []) as unknown as OttoQVehicle[];
      const thresholds = (thresholdsRes.data ?? []) as unknown as OttoQServiceThreshold[];
      const pricing = (pricingRes.data ?? []) as unknown as OttoQEnergyPricing[];
      const stalls = stallsRes.data ?? [];

      if (vehicles.length === 0 || thresholds.length === 0) {
        setState((s) => ({
          ...s,
          engineStatus: "idle",
          lastScanTimestamp: new Date().toISOString(),
          vehiclesMonitored: vehicles.length,
        }));
        return;
      }

      setState((s) => ({ ...s, engineStatus: "processing" }));

      const engine = new ThresholdEngine(thresholds, pricing);

      // Generate priority queue
      const queue = engine.generatePriorityQueue(vehicles);
      const bundles = engine.generateBundles(vehicles, queue);

      // Charge recommendations for low-SOC vehicles
      const chargeRecs = vehicles
        .filter((v) => v.current_soc_percent < 50)
        .map((v) => engine.getChargeRecommendation(v));

      // Detect new threshold crossings (compare to previous scan)
      const newAlerts: AlertEntry[] = [];
      const currentMap = new Map<string, number>();

      for (const need of queue) {
        const key = `${need.vehicleId}:${need.serviceType}`;
        currentMap.set(key, need.urgencyScore);
        const prev = prevQueueRef.current.get(key);

        // Alert if newly appeared at high urgency or crossed a boundary
        if (need.urgencyScore >= 70 && (prev === undefined || prev < 70)) {
          newAlerts.push({
            id: `${key}-${Date.now()}`,
            vehicleId: need.vehicleId,
            vehicleMakeModel: need.vehicleMakeModel,
            serviceType: need.serviceType,
            urgencyScore: need.urgencyScore,
            message: need.urgencyScore >= 90
              ? `OVERDUE: ${need.vehicleMakeModel} — ${need.serviceType}`
              : `Approaching threshold: ${need.vehicleMakeModel} — ${need.serviceType}`,
            severity: need.urgencyScore >= 90 ? "critical" : need.urgencyScore >= 70 ? "warning" : "routine",
            timestamp: new Date().toISOString(),
          });
        }
      }

      prevQueueRef.current = currentMap;

      // Keep last 50 alerts
      const allAlerts = [...newAlerts, ...alertsRef.current].slice(0, 50);
      alertsRef.current = allAlerts;

      // Depot utilization
      const totalStalls = stalls.length || 1;
      const occupied = stalls.filter((s: any) => s.status === "occupied").length;
      const utilPct = Math.round((occupied / totalStalls) * 100);

      // Current energy tier
      const hour = new Date().getHours();
      const currentPricing = pricing.find((p) => {
        if (p.start_hour < p.end_hour) return hour >= p.start_hour && hour < p.end_hour;
        return hour >= p.start_hour || hour < p.end_hour;
      });

      // Pending = predicted services with urgency > 60
      const pending = queue.filter((n) => n.urgencyScore >= 60);

      setState({
        currentQueue: queue.slice(0, 50),
        pendingNotifications: pending,
        recentAlerts: allAlerts,
        bundles,
        chargeRecommendations: chargeRecs,
        engineStatus: "idle",
        lastScanTimestamp: new Date().toISOString(),
        vehiclesMonitored: vehicles.length,
        activePredictions: queue.length,
        scheduledToday: queue.filter(
          (n) => new Date(n.predictedNeedDate).toDateString() === new Date().toDateString()
        ).length,
        depotUtilizationPct: utilPct,
        currentEnergyTier: currentPricing?.period_name ?? "unknown",
      });
    } catch (err) {
      console.error("[OTTO-Q Engine] Scan error:", err);
      setState((s) => ({ ...s, engineStatus: "idle" }));
    }
  }, []);

  // Run on mount + interval
  useEffect(() => {
    scan();
    const timer = setInterval(scan, intervalMs);
    return () => clearInterval(timer);
  }, [scan, intervalMs]);

  return {
    ...state,
    triggerManualScan: scan,
  };
}
