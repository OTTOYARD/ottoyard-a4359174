// src/agent/tools.ts
// Tool contracts OttoCommand can call. Keep pure types + bound implementations.

export type StallStatus = "open" | "occupied" | "reserved" | "out_of_service" | "maintenance";
export type VehicleStatus = "idle" | "en_route" | "charging" | "maintenance" | "active";

export interface Stall {
  id: string;
  depotId: string;
  status: StallStatus;
  powerKW: number;
  connector?: string;
  maxVehicleLength?: number;
  lastMaintenance?: string;
  utilizationRate?: number;
  avgChargingTime?: number;
  // Autonomous vehicle specific fields
  autonomousCompatible?: boolean;
  biDirectional?: boolean;
}

export interface Vehicle {
  id: string;
  soc: number; // 0..1
  status: VehicleStatus;
  currentDepotId?: string;
  assignedStallId?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  city?: string;
  licensePlate?: string;
  batteryCapacity?: number;
  maxRange?: number;
  currentRoute?: string | null;
  lastLocationUpdate?: string;
  mileage?: number;
  engineHours?: number;
  nextMaintenanceDate?: string;
  fuelEfficiency?: number;
  // Autonomous vehicle specific fields
  autonomyLevel?: "L3" | "L4" | "L5";
  disengagementRate?: number; // per mile
  safetyScore?: number; // 0-100
  revenuePerDay?: number; // USD
  customerRating?: number; // 1-5
  biDirectionalCharging?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  operationalMetrics?: {
    avgDailyDistance: number;
    energyConsumption: number;
    utilizationRate: number;
    uptime: number;
    maintenanceCostPerKm: number;
  };
}

export interface ChargingAssignment {
  vehicleId: string;
  stallId: string;
  start: string; // ISO
  end: string;   // ISO
  chargingType?: string;
  priority?: string;
  estimatedCost?: number;
}

export const Tools = {
  list_stalls: {
    name: "list_stalls",
    description: "List stalls for a depot filtered by status.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        status: {
          type: "string",
          enum: ["open", "occupied", "reserved", "out_of_service", "maintenance"],
          nullable: true,
        },
      },
      required: ["depot_id"],
    },
  },
  get_charging_queue: {
    name: "get_charging_queue",
    description: "Get vehicles waiting/needing charge at a depot.",
    input: {
      type: "object",
      properties: { depot_id: { type: "string" } },
      required: ["depot_id"],
    },
  },
  schedule_vehicle: {
    name: "schedule_vehicle",
    description:
      "Assign a vehicle to a stall with start/end. Prevent double-bookings.",
    input: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        stall_id: { type: "string" },
        start: { type: "string", description: "ISO timestamp" },
        end: { type: "string", description: "ISO timestamp" },
      },
      required: ["vehicle_id", "stall_id", "start", "end"],
    },
  },
  assign_detailing: {
    name: "assign_detailing",
    description:
      "Assign a vehicle to a detailing/maintenance bay within a time window.",
    input: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        bay_id: { type: "string" },
        time_window: { type: "string", description: "e.g., 2025-09-22T10:00/12:00" },
      },
      required: ["vehicle_id", "bay_id", "time_window"],
    },
  },
  optimize_charging_plan: {
    name: "optimize_charging_plan",
    description:
      "Compute optimal charging plan for next horizon_minutes given stalls/vehicles/SOC.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        horizon_minutes: { type: "number", default: 120 },
        objective: {
          type: "string",
          enum: ["min_time_to_target", "max_throughput", "min_cost"],
          default: "max_throughput",
        },
      },
      required: ["depot_id"],
    },
  },
  utilization_report: {
    name: "utilization_report",
    description:
      "Return stall utilization %, average wait, avg kWh delivered over a time range.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
      },
      required: ["depot_id", "start", "end"],
    },
  },
} as const;

export type ToolName = keyof typeof Tools;

// Bindings are implemented in services and imported by server routes or AI runtime.
export interface ToolBinding<I, O> {
  schema: any;
  handler: (input: I) => Promise<O>;
}
