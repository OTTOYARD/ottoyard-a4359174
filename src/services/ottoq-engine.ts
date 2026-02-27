// OTTO-Q Threshold Engine — Core intelligence layer for predictive vehicle service scheduling

import type {
  OttoQVehicle,
  OttoQServiceThreshold,
  OttoQEnergyPricing,
  ServiceType,
  VehicleHealthSnapshot,
  ServiceUrgency,
} from "@/types/ottoq";

// ── Additional computed types ──────────────────────────────────
export interface PredictedServiceNeed {
  vehicleId: string;
  vehicleMakeModel: string;
  serviceType: ServiceType;
  urgencyScore: number;
  compositeScore: number;
  predictedNeedDate: string;
  triggerReason: string;
  currentValue: number;
  thresholdValue: number;
  thresholdUnit: string;
}

export interface BundledServiceRecommendation {
  vehicleId: string;
  vehicleMakeModel: string;
  primaryService: ServiceType;
  bundledServices: ServiceType[];
  combinedDurationMinutes: number;
  separateVisitsDurationMinutes: number;
  timeSavingsMinutes: number;
  reasons: string[];
}

export interface ChargeRecommendation {
  vehicleId: string;
  recommendedStartTime: string;
  estimatedCostDollars: number;
  savingsVsNowDollars: number;
  chargeDurationMinutes: number;
  recommendedChargerType: "fast" | "standard";
  currentSoc: number;
  targetSoc: number;
  riskLevel: "low" | "medium" | "high";
}

// ── Time sensitivity weights per service type ──────────────────
const TIME_SENSITIVITY: Record<ServiceType, number> = {
  charge: 100,
  detail_clean: 30,
  tire_rotation: 20,
  battery_health_check: 40,
  full_service: 50,
};

// ── Setup overhead per visit in minutes ────────────────────────
const VISIT_OVERHEAD_MINUTES = 15;

// ── ThresholdEngine ────────────────────────────────────────────
export class ThresholdEngine {
  private thresholds: OttoQServiceThreshold[];
  private energyPricing: OttoQEnergyPricing[];

  constructor(
    thresholds: OttoQServiceThreshold[],
    energyPricing: OttoQEnergyPricing[]
  ) {
    this.thresholds = thresholds;
    this.energyPricing = energyPricing;
  }

  // ── 1. Vehicle Health Scanner ──────────────────────────────
  computeHealthSnapshot(vehicle: OttoQVehicle): VehicleHealthSnapshot {
    const now = Date.now();

    const daysSince = (dateStr: string | null): number | null => {
      if (!dateStr) return null;
      return Math.max(0, (now - new Date(dateStr).getTime()) / 86_400_000);
    };

    const milesSince = (lastDate: string | null, avgDaily: number): number | null => {
      const days = daysSince(lastDate);
      if (days === null) return null;
      return Math.round(days * avgDaily);
    };

    const dSinceCharge = daysSince(vehicle.last_charge_date);
    const dSinceDetail = daysSince(vehicle.last_detail_date);
    const dSinceTire = daysSince(vehicle.last_tire_rotation_date);
    const dSinceBattery = daysSince(vehicle.last_battery_health_check);
    const mSinceDetail = milesSince(vehicle.last_detail_date, vehicle.avg_daily_miles);
    const mSinceTire = milesSince(vehicle.last_tire_rotation_date, vehicle.avg_daily_miles);

    const urgencies: ServiceUrgency[] = [];

    for (const t of this.thresholds) {
      const u = this.computeUrgency(vehicle, t, {
        dSinceCharge,
        dSinceDetail,
        dSinceTire,
        dSinceBattery,
        mSinceDetail,
        mSinceTire,
      });
      if (u) urgencies.push(u);
    }

    const overallUrgency = urgencies.length
      ? Math.max(...urgencies.map((u) => u.urgency_score))
      : 0;

    return {
      vehicle_id: vehicle.id,
      current_soc_percent: vehicle.current_soc_percent,
      days_since_last_charge: dSinceCharge !== null ? Math.round(dSinceCharge) : null,
      days_since_last_detail: dSinceDetail !== null ? Math.round(dSinceDetail) : null,
      days_since_last_tire_rotation: dSinceTire !== null ? Math.round(dSinceTire) : null,
      days_since_last_battery_check: dSinceBattery !== null ? Math.round(dSinceBattery) : null,
      miles_since_last_detail: mSinceDetail,
      miles_since_last_tire_rotation: mSinceTire,
      urgencies,
      overall_urgency_score: Math.round(overallUrgency),
    };
  }

  private computeUrgency(
    v: OttoQVehicle,
    t: OttoQServiceThreshold,
    ctx: {
      dSinceCharge: number | null;
      dSinceDetail: number | null;
      dSinceTire: number | null;
      dSinceBattery: number | null;
      mSinceDetail: number | null;
      mSinceTire: number | null;
    }
  ): ServiceUrgency | null {
    let currentValue: number | null = null;
    let thresholdValue = t.threshold_value;
    let isInverted = false; // for SOC, lower = worse

    switch (t.service_type) {
      case "charge":
        if (t.threshold_unit === "percent") {
          // SOC-based: urgency increases as SOC decreases toward threshold
          currentValue = v.current_soc_percent;
          isInverted = true;
        }
        break;
      case "detail_clean":
        currentValue =
          t.threshold_unit === "days"
            ? ctx.dSinceDetail
            : t.threshold_unit === "miles"
            ? ctx.mSinceDetail
            : null;
        break;
      case "tire_rotation":
        currentValue = ctx.mSinceTire;
        break;
      case "battery_health_check":
        currentValue = ctx.dSinceBattery;
        break;
      case "full_service":
        // use odometer-based threshold
        currentValue =
          t.threshold_unit === "miles"
            ? v.odometer_miles % thresholdValue // miles since last full service (approx)
            : null;
        break;
    }

    if (currentValue === null) return null;

    let ratio: number;
    if (isInverted) {
      // For SOC: 100% SOC = 0 urgency, threshold% SOC = 100 urgency
      ratio = Math.max(0, (thresholdValue + 20 - currentValue) / (thresholdValue + 20));
    } else {
      ratio = currentValue / thresholdValue;
    }

    // Non-linear urgency curve: stays low until ~60%, then accelerates
    const urgency = Math.max(0, Math.min(100, Math.pow(ratio, 1.5) * 100));
    const isOverdue = isInverted ? currentValue <= thresholdValue : currentValue >= thresholdValue;

    const triggerReason = isInverted
      ? `SOC at ${Math.round(currentValue)}% (threshold: ${thresholdValue}%)`
      : `${Math.round(currentValue)} ${t.threshold_unit} since last service (threshold: ${thresholdValue} ${t.threshold_unit})`;

    return {
      service_type: t.service_type,
      days_since_last: isInverted ? null : (t.threshold_unit === "days" ? currentValue : null),
      miles_since_last: isInverted ? null : (t.threshold_unit === "miles" ? currentValue : null),
      urgency_score: Math.round(urgency * 10) / 10,
      is_overdue: isOverdue,
      trigger_reason: triggerReason,
    };
  }

  // ── 2. Priority Queue Generator ────────────────────────────
  generatePriorityQueue(vehicles: OttoQVehicle[]): PredictedServiceNeed[] {
    const needs: PredictedServiceNeed[] = [];

    for (const v of vehicles) {
      if (v.status === "offline") continue;
      const snapshot = this.computeHealthSnapshot(v);

      for (const u of snapshot.urgencies) {
        if (u.urgency_score < 15) continue; // skip very low urgency

        const threshold = this.thresholds.find(
          (t) => t.service_type === u.service_type
        );
        if (!threshold) continue;

        const normalizedPriority = (threshold.priority_weight / 10) * 100;
        const timeSensitivity = TIME_SENSITIVITY[u.service_type] || 50;

        // Energy cost bonus: if charge service and currently off-peak
        let energyBonus = 0;
        if (u.service_type === "charge") {
          const hour = new Date().getHours();
          const currentRate = this.getCurrentRate(hour);
          const offPeakRate = this.getLowestRate();
          if (currentRate && offPeakRate && currentRate.rate_per_kwh <= offPeakRate.rate_per_kwh * 1.1) {
            energyBonus = 100; // it's off-peak, bonus for charging now
          }
        }

        const compositeScore =
          u.urgency_score * 0.4 +
          normalizedPriority * 0.3 +
          timeSensitivity * 0.2 +
          energyBonus * 0.1;

        const predictedDate = this.predictNeedDate(v, u, threshold);

        needs.push({
          vehicleId: v.id,
          vehicleMakeModel: `${v.make || ""} ${v.model || ""}`.trim(),
          serviceType: u.service_type,
          urgencyScore: u.urgency_score,
          compositeScore: Math.round(compositeScore * 10) / 10,
          predictedNeedDate: predictedDate,
          triggerReason: u.trigger_reason,
          currentValue: u.miles_since_last ?? u.days_since_last ?? v.current_soc_percent,
          thresholdValue: threshold.threshold_value,
          thresholdUnit: threshold.threshold_unit,
        });
      }
    }

    return needs.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  private predictNeedDate(
    v: OttoQVehicle,
    u: ServiceUrgency,
    t: OttoQServiceThreshold
  ): string {
    if (u.is_overdue) return new Date().toISOString();

    if (t.service_type === "charge") {
      // days until hitting threshold SOC
      if (v.avg_daily_miles <= 0 || v.current_range_miles <= 0) {
        return new Date(Date.now() + 86_400_000).toISOString();
      }
      const milesAboveThreshold =
        v.current_range_miles - (t.threshold_value / 100) * v.current_range_miles * (100 / v.current_soc_percent);
      const daysLeft = Math.max(0.5, milesAboveThreshold / v.avg_daily_miles);
      return new Date(Date.now() + daysLeft * 86_400_000).toISOString();
    }

    if (t.threshold_unit === "days") {
      const daysSince = u.days_since_last ?? 0;
      const remaining = Math.max(0.5, t.threshold_value - daysSince);
      return new Date(Date.now() + remaining * 86_400_000).toISOString();
    }

    if (t.threshold_unit === "miles") {
      const milesSince = u.miles_since_last ?? 0;
      const remaining = Math.max(1, t.threshold_value - milesSince);
      const daysLeft = v.avg_daily_miles > 0 ? remaining / v.avg_daily_miles : 30;
      return new Date(Date.now() + daysLeft * 86_400_000).toISOString();
    }

    return new Date(Date.now() + 7 * 86_400_000).toISOString();
  }

  // ── 3. Smart Bundling Logic ────────────────────────────────
  generateBundles(
    vehicles: OttoQVehicle[],
    queue: PredictedServiceNeed[]
  ): BundledServiceRecommendation[] {
    const bundles: BundledServiceRecommendation[] = [];
    const vehicleNeedsMap = new Map<string, PredictedServiceNeed[]>();

    for (const need of queue) {
      const existing = vehicleNeedsMap.get(need.vehicleId) ?? [];
      existing.push(need);
      vehicleNeedsMap.set(need.vehicleId, existing);
    }

    for (const [vehicleId, needs] of vehicleNeedsMap) {
      if (needs.length < 2) continue;

      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) continue;

      const primary = needs[0]; // highest composite score
      const bundleCandidates: ServiceType[] = [];
      const reasons: string[] = [];

      for (const need of needs.slice(1)) {
        // Bundle if urgency is above 40% (within ~80% of threshold)
        const ratio = need.currentValue / need.thresholdValue;
        const bundleThreshold =
          need.serviceType === "detail_clean" ? 0.8 : 0.85;

        if (ratio >= bundleThreshold || need.urgencyScore >= 40) {
          bundleCandidates.push(need.serviceType);
          reasons.push(
            `${need.serviceType} at ${Math.round(need.urgencyScore)}% urgency — bundle saves a separate visit`
          );
        }
      }

      if (bundleCandidates.length === 0) continue;

      const allServices = [primary.serviceType, ...bundleCandidates];
      const combinedDuration = allServices.reduce((sum, st) => {
        const t = this.thresholds.find((th) => th.service_type === st);
        return sum + (t?.estimated_duration_minutes ?? 30);
      }, VISIT_OVERHEAD_MINUTES);

      const separateDuration = allServices.reduce((sum, st) => {
        const t = this.thresholds.find((th) => th.service_type === st);
        return sum + (t?.estimated_duration_minutes ?? 30) + VISIT_OVERHEAD_MINUTES;
      }, 0);

      bundles.push({
        vehicleId,
        vehicleMakeModel: `${vehicle.make || ""} ${vehicle.model || ""}`.trim(),
        primaryService: primary.serviceType,
        bundledServices: bundleCandidates,
        combinedDurationMinutes: combinedDuration,
        separateVisitsDurationMinutes: separateDuration,
        timeSavingsMinutes: separateDuration - combinedDuration,
        reasons,
      });
    }

    return bundles;
  }

  // ── 4. Energy Cost Optimizer ───────────────────────────────
  getChargeRecommendation(vehicle: OttoQVehicle): ChargeRecommendation {
    const now = new Date();
    const hour = now.getHours();
    const currentRate = this.getCurrentRate(hour);
    const lowestRate = this.getLowestRate();
    const targetSoc = 90;

    const socDeficit = Math.max(0, targetSoc - vehicle.current_soc_percent);
    const kwhNeeded = (socDeficit / 100) * vehicle.battery_capacity_kwh;

    // Determine urgency -> charger type
    const isUrgent = vehicle.current_soc_percent < 20;
    const isMedium = vehicle.current_soc_percent < 35;
    const chargerType: "fast" | "standard" = isUrgent || isMedium ? "fast" : "standard";

    const chargerKw = chargerType === "fast" ? 250 : 50;
    const chargeDurationMinutes = Math.round((kwhNeeded / chargerKw) * 60);

    const currentCost = kwhNeeded * (currentRate?.rate_per_kwh ?? 0.10);
    const offPeakCost = kwhNeeded * (lowestRate?.rate_per_kwh ?? 0.06);
    const savings = Math.max(0, currentCost - offPeakCost);

    // Risk assessment: will vehicle hit critical before off-peak?
    const hoursUntilOffPeak = this.hoursUntilOffPeak(hour);
    const milesUntilOffPeak = (hoursUntilOffPeak / 24) * vehicle.avg_daily_miles;
    const rangeAfterUsage = vehicle.current_range_miles - milesUntilOffPeak;
    const socAfterUsage =
      vehicle.current_soc_percent -
      (milesUntilOffPeak / vehicle.current_range_miles) * vehicle.current_soc_percent;

    let riskLevel: "low" | "medium" | "high" = "low";
    if (socAfterUsage < 15) riskLevel = "high";
    else if (socAfterUsage < 25) riskLevel = "medium";

    // If risk is high, charge now regardless
    const shouldChargeNow = riskLevel === "high" || isUrgent;
    const recommendedStart = shouldChargeNow
      ? now.toISOString()
      : this.nextOffPeakStart(now);

    return {
      vehicleId: vehicle.id,
      recommendedStartTime: recommendedStart,
      estimatedCostDollars: Math.round((shouldChargeNow ? currentCost : offPeakCost) * 100) / 100,
      savingsVsNowDollars: Math.round(savings * 100) / 100,
      chargeDurationMinutes,
      recommendedChargerType: chargerType,
      currentSoc: vehicle.current_soc_percent,
      targetSoc,
      riskLevel,
    };
  }

  // ── Energy helpers ─────────────────────────────────────────
  private getCurrentRate(hour: number): OttoQEnergyPricing | undefined {
    return this.energyPricing.find((p) => {
      if (p.start_hour < p.end_hour) {
        return hour >= p.start_hour && hour < p.end_hour;
      }
      // wraps midnight
      return hour >= p.start_hour || hour < p.end_hour;
    });
  }

  private getLowestRate(): OttoQEnergyPricing | undefined {
    return [...this.energyPricing].sort(
      (a, b) => a.rate_per_kwh - b.rate_per_kwh
    )[0];
  }

  private hoursUntilOffPeak(currentHour: number): number {
    const offPeak = this.energyPricing.find((p) => p.period_name === "off_peak");
    if (!offPeak) return 6;
    const start = offPeak.start_hour;
    return currentHour <= start ? start - currentHour : 24 - currentHour + start;
  }

  private nextOffPeakStart(now: Date): string {
    const offPeak = this.energyPricing.find((p) => p.period_name === "off_peak");
    const startHour = offPeak?.start_hour ?? 22;
    const next = new Date(now);
    if (now.getHours() >= startHour) {
      // already in or past off-peak start today — use now
      return now.toISOString();
    }
    next.setHours(startHour, 0, 0, 0);
    return next.toISOString();
  }
}
