export type OTTOQCity = {
  id: string;
  name: string;
  tz?: string;
};

export type OTTOQVehicleStatusDb = "IDLE" | "ENROUTE_DEPOT" | "AT_DEPOT" | "IN_SERVICE" | "ON_TRIP";
export type OTTOQVehicleStatusUi = "active" | "charging" | "maintenance" | "idle";

export type OTTOQVehicleRow = {
  id: string;
  city_id: string;
  oem: string;
  external_ref: string | null;
  vin: string | null;
  plate: string | null;
  soc: number; // 0..1
  odometer_km: number;
  health_jsonb: Record<string, unknown> | null;
  status: OTTOQVehicleStatusDb;
  last_telemetry_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MapPoint = { lat: number; lng: number };

export type UiVehicle = {
  id: string;
  name: string;
  status: OTTOQVehicleStatusUi;
  battery: number; // 0..100
  location: MapPoint;
  route: string;
  chargingTime: string;
  nextMaintenance: string;
  city: string;
};

export type OTTOQDepotRow = {
  id: string;
  city_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lon: number | null;
  config_jsonb: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OTTOQResourceStatus = "AVAILABLE" | "RESERVED" | "BUSY" | "OUT_OF_SERVICE";
export type OTTOQResourceRow = {
  id: string;
  depot_id: string;
  resource_type: string;
  index: number;
  capabilities_jsonb: Record<string, unknown> | null;
  status: OTTOQResourceStatus;
  current_job_id: string | null;
  updated_at: string;
};

export type UiDepot = {
  id: string;
  name: string;
  location: MapPoint;
  energyGenerated: number;
  energyReturned: number;
  vehiclesCharging: number;
  totalStalls: number;
  availableStalls: number;
  status: "optimal" | "busy" | "full";
  city: string;
};

export type SimulatorStateRow = {
  id: string;
  is_running: boolean;
  mode: string;
  last_reset_at: string | null;
  config_jsonb: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
