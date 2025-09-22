export interface Vehicle {
  id: string;
  depot_id: string;
  soc: number; // State of charge (0-100)
  status: 'available' | 'charging' | 'in_use' | 'maintenance' | 'detailing';
  location: {
    stall_id?: string;
    bay_id?: string;
  };
  model: string;
  battery_capacity: number; // kWh
  created_at: string;
  updated_at: string;
}

export interface ChargingStall {
  id: string;
  depot_id: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  power_kw: number;
  vehicle_id?: string;
  reserved_until?: string;
  created_at: string;
  updated_at: string;
}

export interface DetailingBay {
  id: string;
  depot_id: string;
  status: 'available' | 'occupied' | 'maintenance';
  vehicle_id?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
}

export interface Depot {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: {
    vehicles: number;
    charging_stalls: number;
    detailing_bays: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ScheduleAssignment {
  id: string;
  vehicle_id: string;
  stall_id?: string;
  bay_id?: string;
  start_time: string;
  end_time: string;
  type: 'charging' | 'detailing' | 'staging';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OptimizationPlan {
  id: string;
  depot_id: string;
  assignments: ScheduleAssignment[];
  objective: 'minimize_time' | 'maximize_utilization' | 'balance_load';
  metrics: {
    total_charging_time: number;
    utilization_rate: number;
    conflicts_resolved: number;
  };
  created_at: string;
}

export interface UtilizationReport {
  depot_id: string;
  start_time: string;
  end_time: string;
  metrics: {
    vehicle_utilization: number;
    stall_utilization: number;
    bay_utilization: number;
    peak_demand_hour: string;
    average_soc_improvement: number;
  };
  recommendations: string[];
}

export type ScheduleVehicleRequest = {
  vehicle_id: string;
  stall_id: string;
  start_time: string;
  end_time: string;
};

export type AssignDetailingRequest = {
  vehicle_id: string;
  bay_id: string;
  time_window: {
    start: string;
    end: string;
  };
};

export type OptimizeChargingPlanRequest = {
  depot_id: string;
  horizon_minutes?: number;
  objective?: 'minimize_time' | 'maximize_utilization' | 'balance_load';
};