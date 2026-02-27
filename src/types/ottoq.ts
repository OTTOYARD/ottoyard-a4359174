// OTTO-Q Predictive Scheduling Engine — Foundation Types

// ── Enum literals ──────────────────────────────────────────────
export type VehicleType = "member_ev" | "autonomous";
export type VehicleStatus = "active" | "in_service" | "charging" | "staged" | "offline";
export type StallType = "charge_standard" | "charge_fast" | "clean_detail" | "service_bay" | "staging";
export type StallStatus = "available" | "occupied" | "reserved" | "maintenance";
export type ServiceType = "charge" | "detail_clean" | "tire_rotation" | "battery_health_check" | "full_service";
export type ServiceStatus = "predicted" | "notified" | "accepted" | "scheduled" | "in_progress" | "completed" | "cancelled" | "declined";

// ── Table interfaces ───────────────────────────────────────────
export interface OttoQDepot {
  id: string;
  name: string;
  location_address: string | null;
  lat: number | null;
  lng: number | null;
  charge_stalls_count: number;
  clean_stalls_count: number;
  service_bays_count: number;
  staging_stalls_count: number;
  energy_rate_schedule: EnergyRateScheduleEntry[];
  operating_hours: { open: string; close: string };
  created_at: string;
}

export interface OttoQVehicle {
  id: string;
  owner_id: string | null;
  vehicle_type: VehicleType;
  make: string | null;
  model: string | null;
  year: number | null;
  battery_capacity_kwh: number;
  current_soc_percent: number;
  current_range_miles: number;
  odometer_miles: number;
  last_charge_date: string | null;
  last_detail_date: string | null;
  last_tire_rotation_date: string | null;
  last_battery_health_check: string | null;
  avg_daily_miles: number;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface OttoQDepotStall {
  id: string;
  depot_id: string;
  stall_number: number;
  stall_type: StallType;
  status: StallStatus;
  current_vehicle_id: string | null;
  charger_power_kw: number | null;
  current_session_start: string | null;
  estimated_completion: string | null;
  created_at: string;
}

export interface OttoQServiceThreshold {
  id: string;
  service_type: ServiceType;
  trigger_condition: string;
  threshold_value: number;
  threshold_unit: string;
  priority_weight: number;
  estimated_duration_minutes: number;
  created_at: string;
}

export interface OttoQScheduledService {
  id: string;
  vehicle_id: string;
  stall_id: string | null;
  service_type: ServiceType;
  status: ServiceStatus;
  predicted_need_date: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  priority_score: number;
  trigger_reason: string | null;
  notification_sent_at: string | null;
  user_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OttoQMemberPreferences {
  id: string;
  user_id: string;
  preferred_charge_times: { start: string; end: string }[];
  preferred_days: string[];
  auto_accept_charges: boolean;
  auto_accept_cleans: boolean;
  notification_lead_time_hours: number;
  calendar_sync_enabled: boolean;
  calendar_provider: string | null;
  home_zip: string | null;
  commute_miles_estimate: number | null;
  created_at: string;
  updated_at: string;
}

export interface EnergyRateScheduleEntry {
  period_name: string;
  start_hour: number;
  end_hour: number;
  rate_per_kwh: number;
  days_applicable: string[];
}

export interface OttoQEnergyPricing {
  id: string;
  depot_id: string;
  period_name: string;
  start_hour: number;
  end_hour: number;
  rate_per_kwh: number;
  days_applicable: string[];
  created_at: string;
}

// ── Computed types ─────────────────────────────────────────────
export interface ServiceUrgency {
  service_type: ServiceType;
  days_since_last: number | null;
  miles_since_last: number | null;
  urgency_score: number; // 0-100
  is_overdue: boolean;
  trigger_reason: string;
}

export interface VehicleHealthSnapshot {
  vehicle_id: string;
  current_soc_percent: number;
  days_since_last_charge: number | null;
  days_since_last_detail: number | null;
  days_since_last_tire_rotation: number | null;
  days_since_last_battery_check: number | null;
  miles_since_last_detail: number | null;
  miles_since_last_tire_rotation: number | null;
  urgencies: ServiceUrgency[];
  overall_urgency_score: number; // max of all service urgencies
}

// ── Stall utilization summary ──────────────────────────────────
export interface StallUtilizationSummary {
  charge: { total: number; occupied: number; available: number };
  clean_detail: { total: number; occupied: number; available: number };
  service_bay: { total: number; occupied: number; available: number };
  staging: { total: number; occupied: number; available: number };
  overall_occupancy_pct: number;
}
