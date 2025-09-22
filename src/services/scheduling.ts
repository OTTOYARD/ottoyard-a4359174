import type {
  Vehicle,
  ChargingStall,
  DetailingBay,
  ScheduleAssignment,
  OptimizationPlan,
  UtilizationReport,
  ScheduleVehicleRequest,
  AssignDetailingRequest,
  OptimizeChargingPlanRequest
} from '../types';

import {
  mockVehicles,
  mockChargingStalls,
  mockDetailingBays,
  mockScheduleAssignments
} from '../data/mock';

let vehicles = [...mockVehicles];
let chargingStalls = [...mockChargingStalls];
let detailingBays = [...mockDetailingBays];
let scheduleAssignments = [...mockScheduleAssignments];

export function listStalls(depotId: string, status?: ChargingStall['status']): ChargingStall[] {
  let stalls = chargingStalls.filter(stall => stall.depot_id === depotId);

  if (status) {
    stalls = stalls.filter(stall => stall.status === status);
  }

  return stalls.sort((a, b) => b.power_kw - a.power_kw);
}

export function getChargingQueue(depotId: string): Vehicle[] {
  return vehicles
    .filter(vehicle => vehicle.depot_id === depotId && vehicle.status === 'available')
    .sort((a, b) => a.soc - b.soc);
}

export function scheduleVehicle(request: ScheduleVehicleRequest): ScheduleAssignment | null {
  const { vehicle_id, stall_id, start_time, end_time } = request;

  const vehicle = vehicles.find(v => v.id === vehicle_id);
  const stall = chargingStalls.find(s => s.id === stall_id);

  if (!vehicle || !stall) {
    throw new Error('Vehicle or stall not found');
  }

  if (stall.status !== 'available') {
    throw new Error('Stall is not available');
  }

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);

  const conflictingAssignments = scheduleAssignments.filter(assignment => {
    if (assignment.stall_id !== stall_id) return false;
    if (assignment.status === 'completed' || assignment.status === 'cancelled') return false;

    const assignmentStart = new Date(assignment.start_time);
    const assignmentEnd = new Date(assignment.end_time);

    return (startDate < assignmentEnd && endDate > assignmentStart);
  });

  if (conflictingAssignments.length > 0) {
    throw new Error('Double-booking detected: stall is already reserved during this time');
  }

  const assignment: ScheduleAssignment = {
    id: `assignment-${Date.now()}`,
    vehicle_id,
    stall_id,
    start_time,
    end_time,
    type: 'charging',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  scheduleAssignments.push(assignment);

  stall.status = 'reserved';
  stall.vehicle_id = vehicle_id;
  stall.reserved_until = end_time;

  vehicle.status = 'charging';
  vehicle.location.stall_id = stall_id;

  return assignment;
}

export function assignDetailing(request: AssignDetailingRequest): ScheduleAssignment | null {
  const { vehicle_id, bay_id, time_window } = request;

  const vehicle = vehicles.find(v => v.id === vehicle_id);
  const bay = detailingBays.find(b => b.id === bay_id);

  if (!vehicle || !bay) {
    throw new Error('Vehicle or bay not found');
  }

  if (bay.status !== 'available') {
    throw new Error('Bay is not available');
  }

  const assignment: ScheduleAssignment = {
    id: `assignment-${Date.now()}`,
    vehicle_id,
    bay_id,
    start_time: time_window.start,
    end_time: time_window.end,
    type: 'detailing',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  scheduleAssignments.push(assignment);

  bay.status = 'occupied';
  bay.vehicle_id = vehicle_id;
  bay.estimated_completion = time_window.end;

  vehicle.status = 'detailing';
  vehicle.location.bay_id = bay_id;

  return assignment;
}

export function optimizeChargingPlan(request: OptimizeChargingPlanRequest): OptimizationPlan {
  const { depot_id, horizon_minutes = 120, objective = 'maximize_utilization' } = request;

  const availableVehicles = vehicles.filter(v =>
    v.depot_id === depot_id &&
    v.status === 'available' &&
    v.soc < 80
  ).sort((a, b) => a.soc - b.soc);

  const availableStalls = chargingStalls.filter(s =>
    s.depot_id === depot_id &&
    s.status === 'available'
  ).sort((a, b) => b.power_kw - a.power_kw);

  const assignments: ScheduleAssignment[] = [];
  const now = new Date();

  for (let i = 0; i < Math.min(availableVehicles.length, availableStalls.length); i++) {
    const vehicle = availableVehicles[i];
    const stall = availableStalls[i];

    const chargingTimeMinutes = Math.min(
      ((80 - vehicle.soc) / 100) * vehicle.battery_capacity / (stall.power_kw / 60),
      horizon_minutes
    );

    const startTime = new Date(now.getTime() + i * 10 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + chargingTimeMinutes * 60 * 1000);

    assignments.push({
      id: `opt-assignment-${Date.now()}-${i}`,
      vehicle_id: vehicle.id,
      stall_id: stall.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type: 'charging',
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const totalChargingTime = assignments.reduce((sum, a) => {
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  const utilizationRate = availableStalls.length > 0
    ? (assignments.length / availableStalls.length) * 100
    : 0;

  return {
    id: `plan-${Date.now()}`,
    depot_id,
    assignments,
    objective,
    metrics: {
      total_charging_time: totalChargingTime,
      utilization_rate: utilizationRate,
      conflicts_resolved: 0
    },
    created_at: new Date().toISOString()
  };
}

export function utilizationReport(
  depotId: string,
  startTime: string,
  endTime: string
): UtilizationReport {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  const depotVehicles = vehicles.filter(v => v.depot_id === depotId);
  const depotStalls = chargingStalls.filter(s => s.depot_id === depotId);
  const depotBays = detailingBays.filter(b => b.depot_id === depotId);

  const relevantAssignments = scheduleAssignments.filter(a => {
    const assignmentStart = new Date(a.start_time);
    const assignmentEnd = new Date(a.end_time);
    return (assignmentStart < end && assignmentEnd > start);
  });

  const vehicleUtilization = depotVehicles.length > 0
    ? (relevantAssignments.length / depotVehicles.length) * 100
    : 0;

  const stallUtilization = depotStalls.length > 0
    ? (relevantAssignments.filter(a => a.type === 'charging').length / depotStalls.length) * 100
    : 0;

  const bayUtilization = depotBays.length > 0
    ? (relevantAssignments.filter(a => a.type === 'detailing').length / depotBays.length) * 100
    : 0;

  const peakDemandHour = new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const averageSocImprovement = depotVehicles.reduce((sum, v) => sum + v.soc, 0) / depotVehicles.length;

  const recommendations: string[] = [];

  if (stallUtilization < 70) {
    recommendations.push('Consider promoting charging services to increase stall utilization');
  }

  if (vehicleUtilization > 90) {
    recommendations.push('High demand detected - consider expanding fleet capacity');
  }

  if (bayUtilization < 50) {
    recommendations.push('Detailing bays are underutilized - optimize scheduling or repurpose');
  }

  return {
    depot_id: depotId,
    start_time: startTime,
    end_time: endTime,
    metrics: {
      vehicle_utilization: vehicleUtilization,
      stall_utilization: stallUtilization,
      bay_utilization: bayUtilization,
      peak_demand_hour: peakDemandHour,
      average_soc_improvement: averageSocImprovement
    },
    recommendations
  };
}