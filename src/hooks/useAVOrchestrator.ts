// Hook for managing AV orchestrator state and simulation

import { useState, useCallback, useRef, useEffect } from "react";
import { AVOrchestrator, type ServicePipeline, type DemandWindow, type EnergyArbitrageResult, type TransitionEvent } from "@/services/ottoq-av-orchestrator";
import { ThresholdEngine } from "@/services/ottoq-engine";
import type { OttoQVehicle, OttoQDepotStall, OttoQServiceThreshold, OttoQEnergyPricing, ServiceType } from "@/types/ottoq";

const AV_MAKES = ["Waymo", "Zoox", "Cruise", "Nuro", "Motional"];
const AV_MODELS = ["Gen5", "VH6", "Origin", "R3", "IONIQ-AV"];

function randomAV(index: number): OttoQVehicle {
  const make = AV_MAKES[index % AV_MAKES.length];
  const model = AV_MODELS[index % AV_MODELS.length];
  return {
    id: `av-${Date.now()}-${index}`,
    owner_id: null,
    vehicle_type: "autonomous",
    make,
    model,
    year: 2025,
    battery_capacity_kwh: 100,
    current_soc_percent: Math.round(15 + Math.random() * 60),
    current_range_miles: Math.round(50 + Math.random() * 200),
    odometer_miles: Math.round(5000 + Math.random() * 40000),
    last_charge_date: new Date(Date.now() - Math.random() * 3 * 86400000).toISOString(),
    last_detail_date: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
    last_tire_rotation_date: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
    last_battery_health_check: new Date(Date.now() - Math.random() * 80 * 86400000).toISOString(),
    avg_daily_miles: Math.round(80 + Math.random() * 120),
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const MOCK_STALLS: OttoQDepotStall[] = Array.from({ length: 61 }, (_, i) => ({
  id: `stall-${i}`,
  depot_id: "depot-1",
  stall_number: i + 1,
  stall_type: i < 10 ? "charge_fast" : i < 40 ? "charge_standard" : i < 50 ? "clean_detail" : i < 51 ? "service_bay" : "staging",
  status: "available" as const,
  current_vehicle_id: null,
  charger_power_kw: i < 10 ? 250 : i < 40 ? 50 : null,
  current_session_start: null,
  estimated_completion: null,
  created_at: new Date().toISOString(),
}));

const MOCK_THRESHOLDS: OttoQServiceThreshold[] = [
  { id: "t1", service_type: "charge", trigger_condition: "SOC below 30%", threshold_value: 30, threshold_unit: "percent", priority_weight: 8, estimated_duration_minutes: 45, created_at: "" },
  { id: "t2", service_type: "detail_clean", trigger_condition: "Every 7 days or 500 miles", threshold_value: 7, threshold_unit: "days", priority_weight: 5, estimated_duration_minutes: 30, created_at: "" },
  { id: "t3", service_type: "tire_rotation", trigger_condition: "Every 7500 miles", threshold_value: 7500, threshold_unit: "miles", priority_weight: 4, estimated_duration_minutes: 45, created_at: "" },
  { id: "t4", service_type: "battery_health_check", trigger_condition: "Every 90 days", threshold_value: 90, threshold_unit: "days", priority_weight: 6, estimated_duration_minutes: 60, created_at: "" },
  { id: "t5", service_type: "full_service", trigger_condition: "Every 15000 miles", threshold_value: 15000, threshold_unit: "miles", priority_weight: 7, estimated_duration_minutes: 120, created_at: "" },
];

const MOCK_PRICING: OttoQEnergyPricing[] = [
  { id: "p1", depot_id: "depot-1", period_name: "off_peak", start_hour: 22, end_hour: 6, rate_per_kwh: 0.06, days_applicable: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], created_at: "" },
  { id: "p2", depot_id: "depot-1", period_name: "shoulder", start_hour: 6, end_hour: 14, rate_per_kwh: 0.09, days_applicable: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], created_at: "" },
  { id: "p3", depot_id: "depot-1", period_name: "peak", start_hour: 14, end_hour: 20, rate_per_kwh: 0.14, days_applicable: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], created_at: "" },
  { id: "p4", depot_id: "depot-1", period_name: "shoulder_eve", start_hour: 20, end_hour: 22, rate_per_kwh: 0.09, days_applicable: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"], created_at: "" },
];

export function useAVOrchestrator() {
  const engineRef = useRef(new ThresholdEngine(MOCK_THRESHOLDS, MOCK_PRICING));
  const orchestratorRef = useRef(new AVOrchestrator(engineRef.current));
  const arrivalCountRef = useRef(0);

  const [pipelines, setPipelines] = useState<ServicePipeline[]>([]);
  const [events, setEvents] = useState<TransitionEvent[]>([]);
  const [demandForecast, setDemandForecast] = useState<DemandWindow[]>([]);
  const [energyResult, setEnergyResult] = useState<EnergyArbitrageResult | null>(null);
  const [isSurge, setIsSurge] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const durationMap = new Map<ServiceType, number>();
  for (const t of MOCK_THRESHOLDS) durationMap.set(t.service_type, t.estimated_duration_minutes);

  const refresh = useCallback(() => {
    const o = orchestratorRef.current;
    setPipelines(o.getPipelines());
    setEvents(o.getEvents().slice(0, 50));
    setDemandForecast(o.getDemandForecast(isSurge));
    setEnergyResult(o.computeEnergyArbitrage(o.getPipelines().length || 5));
  }, [isSurge]);

  const triggerArrival = useCallback(() => {
    const av = randomAV(arrivalCountRef.current++);
    orchestratorRef.current.triggerArrival(av, MOCK_STALLS, durationMap);
    refresh();
  }, [refresh]);

  const fastForward = useCallback(() => {
    orchestratorRef.current.simulateProgress();
    refresh();
  }, [refresh]);

  const toggleSurge = useCallback(() => {
    const next = !isSurge;
    setIsSurge(next);
    orchestratorRef.current.setSurgeMultiplier(next ? 2 : 1);
  }, [isSurge]);

  const resetSim = useCallback(() => {
    orchestratorRef.current.resetSimulation();
    arrivalCountRef.current = 0;
    refresh();
  }, [refresh]);

  // Auto-tick when running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      orchestratorRef.current.simulateProgress();
      refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [isRunning, refresh]);

  // Initial forecast
  useEffect(() => { refresh(); }, [refresh]);

  return {
    pipelines,
    events,
    demandForecast,
    energyResult,
    isSurge,
    isRunning,
    triggerArrival,
    fastForward,
    toggleSurge,
    resetSim,
    setIsRunning,
    stagedCount: orchestratorRef.current.getStagedCount(),
    inServiceCount: orchestratorRef.current.getInServiceCount(),
    deployedCount: orchestratorRef.current.getDeployedCount(),
  };
}
