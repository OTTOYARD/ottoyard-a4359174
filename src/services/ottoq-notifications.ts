// OTTO-Q Notification Service — Generates member-facing service recommendations
import type { ServiceType, OttoQMemberPreferences, OttoQEnergyPricing } from "@/types/ottoq";
import type { PredictedServiceNeed, BundledServiceRecommendation, ChargeRecommendation } from "@/services/ottoq-engine";

// ── Types ──────────────────────────────────────────────────────
export interface ServiceNotification {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  headline: string;
  reason: string;
  recommendedSlot: TimeSlot;
  alternativeSlots: TimeSlot[];
  estimatedDurationMinutes: number;
  estimatedCostDollars: number | null;
  savingsNote: string | null;
  bundledServices: BundledServiceSuggestion[];
  urgencyScore: number;
  severity: "routine" | "warning" | "critical";
  createdAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface TimeSlot {
  start: string;
  end: string;
  stallId: string | null;
  stallNumber: number | null;
  stallType: string;
  isOffPeak: boolean;
  costDollars: number | null;
  savingsVsPeak: number | null;
}

export interface BundledServiceSuggestion {
  serviceType: ServiceType;
  reason: string;
  additionalMinutes: number;
  additionalCost: number | null;
}

// ── Service labels ─────────────────────────────────────────────
const SERVICE_LABELS: Record<ServiceType, string> = {
  charge: "Charge",
  detail_clean: "Detail & Clean",
  tire_rotation: "Tire Rotation",
  battery_health_check: "Battery Health Check",
  full_service: "Full Service",
};

const BUFFER_MINUTES: Record<string, number> = {
  charge_standard: 15,
  charge_fast: 15,
  clean_detail: 30,
  service_bay: 60,
  staging: 10,
};

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// ── NotificationService ────────────────────────────────────────
export class NotificationService {
  private energyPricing: OttoQEnergyPricing[];

  constructor(energyPricing: OttoQEnergyPricing[]) {
    this.energyPricing = energyPricing;
  }

  // ── 1. Generate notification from a predicted need ─────────
  generateNotification(
    need: PredictedServiceNeed,
    bundle: BundledServiceRecommendation | undefined,
    chargeRec: ChargeRecommendation | undefined,
    preferences: OttoQMemberPreferences | null,
    availableStalls: { id: string; stall_number: number; stall_type: string }[]
  ): ServiceNotification {
    const severity: ServiceNotification["severity"] =
      need.urgencyScore >= 90 ? "critical" : need.urgencyScore >= 60 ? "warning" : "routine";

    const headline = this.buildHeadline(need, chargeRec);
    const reason = this.buildReason(need);

    // Generate time slots
    const slots = this.selectSlots(need, preferences, availableStalls, chargeRec);
    const recommendedSlot = slots[0];
    const alternativeSlots = slots.slice(1, 3);

    // Duration
    const durationMap: Record<ServiceType, number> = {
      charge: chargeRec?.chargeDurationMinutes ?? 60,
      detail_clean: 45,
      tire_rotation: 30,
      battery_health_check: 20,
      full_service: 120,
    };
    const duration = durationMap[need.serviceType];

    // Cost
    const cost = need.serviceType === "charge" ? (chargeRec?.estimatedCostDollars ?? null) : null;
    const savings = chargeRec?.savingsVsNowDollars
      ? `Save $${chargeRec.savingsVsNowDollars.toFixed(2)} by charging at off-peak rates`
      : null;

    // Bundled services
    const bundled: BundledServiceSuggestion[] = [];
    if (bundle) {
      for (const bs of bundle.bundledServices) {
        bundled.push({
          serviceType: bs,
          reason: `Within threshold — bundle saves ${bundle.timeSavingsMinutes} min total`,
          additionalMinutes: 30,
          additionalCost: null,
        });
      }
    }

    return {
      id: `notif-${need.vehicleId}-${need.serviceType}-${Date.now()}`,
      vehicleId: need.vehicleId,
      serviceType: need.serviceType,
      headline,
      reason,
      recommendedSlot,
      alternativeSlots,
      estimatedDurationMinutes: duration,
      estimatedCostDollars: cost,
      savingsNote: savings,
      bundledServices: bundled,
      urgencyScore: need.urgencyScore,
      severity,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
  }

  // ── 2. Timing intelligence ─────────────────────────────────
  shouldNotifyNow(
    need: PredictedServiceNeed,
    preferences: OttoQMemberPreferences | null
  ): boolean {
    const hour = new Date().getHours();

    // Critical: always notify
    if (need.urgencyScore >= 90) return true;

    // Charge below 25%: notify immediately
    if (need.serviceType === "charge" && need.currentValue <= 25) return true;

    // Quiet hours: 10pm - 7am
    if (hour >= 22 || hour < 7) return false;

    // Check lead time preference
    if (preferences) {
      const needDate = new Date(need.predictedNeedDate);
      const hoursUntil = (needDate.getTime() - Date.now()) / 3_600_000;
      if (hoursUntil > preferences.notification_lead_time_hours) return false;
    }

    return true;
  }

  // ── 3. Slot selection ──────────────────────────────────────
  private selectSlots(
    need: PredictedServiceNeed,
    prefs: OttoQMemberPreferences | null,
    stalls: { id: string; stall_number: number; stall_type: string }[],
    chargeRec?: ChargeRecommendation
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const stallType = this.serviceToStallType(need.serviceType);
    const matching = stalls.filter((s) => s.stall_type === stallType);
    if (matching.length === 0 && stalls.length > 0) matching.push(stalls[0]);

    const durationMin = need.serviceType === "charge"
      ? (chargeRec?.chargeDurationMinutes ?? 60)
      : 45;
    const buffer = BUFFER_MINUTES[stallType] ?? 15;

    // Generate candidate start times
    const candidates: Date[] = [];

    // If charge rec has a recommended time, use it first
    if (chargeRec?.recommendedStartTime) {
      candidates.push(new Date(chargeRec.recommendedStartTime));
    }

    // Member preferred times
    if (prefs?.preferred_charge_times) {
      for (const window of prefs.preferred_charge_times) {
        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const d = new Date(now);
          d.setDate(d.getDate() + dayOffset);
          const [h, m] = window.start.split(":").map(Number);
          d.setHours(h, m || 0, 0, 0);
          if (d > now) {
            // Check preferred days
            if (!prefs.preferred_days?.length || prefs.preferred_days.includes(DAY_NAMES[d.getDay()])) {
              candidates.push(d);
            }
          }
        }
      }
    }

    // Fill with off-peak windows if needed
    for (let dayOffset = 0; dayOffset < 3 && candidates.length < 5; dayOffset++) {
      const offPeak = this.energyPricing.find((p) => p.period_name === "off_peak");
      if (offPeak) {
        const d = new Date(now);
        d.setDate(d.getDate() + dayOffset);
        d.setHours(offPeak.start_hour, 0, 0, 0);
        if (d > now) candidates.push(d);
      }
      // Morning shoulder
      const shoulder = this.energyPricing.find((p) => p.period_name === "shoulder_am");
      if (shoulder) {
        const d = new Date(now);
        d.setDate(d.getDate() + dayOffset);
        d.setHours(shoulder.start_hour + 1, 0, 0, 0);
        if (d > now) candidates.push(d);
      }
    }

    // Fallback: next 3 hours
    if (candidates.length === 0) {
      for (let h = 1; h <= 3; h++) {
        candidates.push(new Date(now.getTime() + h * 3_600_000));
      }
    }

    // Build slots from candidates
    for (const start of candidates) {
      if (slots.length >= 3) break;
      const end = new Date(start.getTime() + (durationMin + buffer) * 60_000);
      const stall = matching[slots.length % matching.length] ?? null;
      const hour = start.getHours();
      const rate = this.getRateForHour(hour);
      const isOffPeak = rate?.period_name === "off_peak";

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        stallId: stall?.id ?? null,
        stallNumber: stall?.stall_number ?? null,
        stallType: stall?.stall_type ?? stallType,
        isOffPeak,
        costDollars: need.serviceType === "charge" && rate
          ? Math.round(((chargeRec?.chargeDurationMinutes ?? 60) / 60) * 50 * rate.rate_per_kwh * 100) / 100
          : null,
        savingsVsPeak: isOffPeak ? (chargeRec?.savingsVsNowDollars ?? null) : null,
      });
    }

    return slots;
  }

  // ── Helpers ────────────────────────────────────────────────
  private buildHeadline(need: PredictedServiceNeed, chargeRec?: ChargeRecommendation): string {
    const label = SERVICE_LABELS[need.serviceType];
    const needDate = new Date(need.predictedNeedDate);
    const dayStr = needDate.toLocaleDateString(undefined, { weekday: "long" });
    const timeStr = needDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

    if (need.urgencyScore >= 90) return `${label} Needed Now`;
    if (chargeRec && need.serviceType === "charge") {
      return `${label} Recommended — ${dayStr} ${timeStr}`;
    }
    return `${label} Due — ${dayStr}`;
  }

  private buildReason(need: PredictedServiceNeed): string {
    switch (need.serviceType) {
      case "charge":
        return `Battery at ${Math.round(need.currentValue)}%. Based on your driving pattern, you'll reach ${need.thresholdValue}% by ${new Date(need.predictedNeedDate).toLocaleDateString(undefined, { weekday: "long" })} morning.`;
      case "detail_clean":
        return `Last detail was ${Math.round(need.currentValue)} ${need.thresholdUnit} ago. A fresh detail keeps your vehicle in premium condition.`;
      case "tire_rotation":
        return `${Math.round(need.currentValue).toLocaleString()} miles since last rotation. Recommended every ${need.thresholdValue.toLocaleString()} miles for even wear.`;
      case "battery_health_check":
        return `${Math.round(need.currentValue)} days since last battery diagnostic. Regular checks protect your battery longevity.`;
      case "full_service":
        return `Vehicle approaching ${need.thresholdValue.toLocaleString()}-mile full service interval.`;
      default:
        return need.triggerReason;
    }
  }

  private serviceToStallType(st: ServiceType): string {
    switch (st) {
      case "charge": return "charge_standard";
      case "detail_clean": return "clean_detail";
      case "tire_rotation":
      case "battery_health_check":
      case "full_service": return "service_bay";
      default: return "charge_standard";
    }
  }

  private getRateForHour(hour: number): OttoQEnergyPricing | undefined {
    return this.energyPricing.find((p) => {
      if (p.start_hour < p.end_hour) return hour >= p.start_hour && hour < p.end_hour;
      return hour >= p.start_hour || hour < p.end_hour;
    });
  }
}
