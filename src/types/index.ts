// Core types for OttoCommand system

export interface Vehicle {
  id: string;
  model: string;
  stateOfCharge: number; // 0-100
  status: 'available' | 'charging' | 'maintenance' | 'assigned';
  location: string;
  lastUpdated: Date;
}

export interface ChargingStall {
  id: string;
  depotId: string;
  powerRating: number; // kW
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentVehicleId?: string;
  connectorType: string;
}

export interface DetailingBay {
  id: string;
  depotId: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentVehicleId?: string;
}

export interface ScheduleAssignment {
  id: string;
  vehicleId: string;
  stallId?: string;
  bayId?: string;
  startTime: Date;
  endTime: Date;
  type: 'charging' | 'detailing';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface ChargingQueue {
  vehicles: Vehicle[];
  estimatedWaitTimes: Record<string, number>; // vehicleId -> minutes
}

export interface OptimizationPlan {
  assignments: ScheduleAssignment[];
  metrics: {
    totalUtilization: number;
    avgWaitTime: number;
    energyEfficiency: number;
  };
  objective: 'minimize_wait' | 'maximize_utilization' | 'minimize_energy_cost';
}

export interface UtilizationReport {
  depotId: string;
  period: {
    start: Date;
    end: Date;
  };
  chargingStats: {
    totalSessions: number;
    avgSessionDuration: number;
    stallUtilization: number;
    peakHours: string[];
  };
  detailingStats: {
    totalSessions: number;
    avgSessionDuration: number;
    bayUtilization: number;
  };
  recommendations: string[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: any; // JSON Schema
  handler: (...args: any[]) => any;
}