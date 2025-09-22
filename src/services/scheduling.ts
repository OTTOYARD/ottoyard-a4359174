// Core scheduling services for OttoCommand

import {
  Vehicle,
  ChargingStall,
  DetailingBay,
  ScheduleAssignment,
  ChargingQueue,
  OptimizationPlan,
  UtilizationReport,
} from '../types';
import {
  mockVehicles,
  mockChargingStalls,
  mockDetailingBays,
  mockScheduleAssignments,
  findVehicleById,
  findStallById,
  findBayById,
  getAvailableStalls,
  getAvailableBays,
} from '../data/mock';

// Service function implementations
export const listStalls = (depotId: string, status?: string): ChargingStall[] => {
  let stalls = mockChargingStalls.filter(stall => stall.depotId === depotId);

  if (status) {
    stalls = stalls.filter(stall => stall.status === status);
  }

  // Sort by power rating (highest first) for better optimization
  return stalls.sort((a, b) => b.powerRating - a.powerRating);
};

export const getChargingQueue = (depotId: string): ChargingQueue => {
  // Get vehicles that need charging (SOC < 80 and available)
  const vehiclesNeedingCharge = mockVehicles
    .filter(v =>
      v.location === getDepotName(depotId) &&
      v.stateOfCharge < 80 &&
      v.status === 'available'
    )
    .sort((a, b) => a.stateOfCharge - b.stateOfCharge); // Lowest SOC first

  // Calculate estimated wait times based on queue position and available stalls
  const availableStalls = getAvailableStalls(depotId);
  const estimatedWaitTimes: Record<string, number> = {};

  vehiclesNeedingCharge.forEach((vehicle, index) => {
    const stallsInUse = Math.min(index, availableStalls.length);
    const waitTime = stallsInUse === 0 ? 0 : Math.ceil(index / availableStalls.length) * 45; // 45 min avg charge time
    estimatedWaitTimes[vehicle.id] = waitTime;
  });

  return {
    vehicles: vehiclesNeedingCharge,
    estimatedWaitTimes,
  };
};

export const scheduleVehicle = (
  vehicleId: string,
  stallId: string,
  startTime: Date,
  endTime: Date
): { success: boolean; assignment?: ScheduleAssignment; error?: string } => {
  // Validate vehicle exists and is available
  const vehicle = findVehicleById(vehicleId);
  if (!vehicle) {
    return { success: false, error: 'Vehicle not found' };
  }
  if (vehicle.status !== 'available') {
    return { success: false, error: 'Vehicle is not available for scheduling' };
  }

  // Validate stall exists and is available
  const stall = findStallById(stallId);
  if (!stall) {
    return { success: false, error: 'Charging stall not found' };
  }
  if (stall.status !== 'available') {
    return { success: false, error: 'Charging stall is not available' };
  }

  // Check for double-booking conflicts
  const conflictingAssignment = mockScheduleAssignments.find(assignment =>
    assignment.stallId === stallId &&
    assignment.status !== 'completed' &&
    assignment.status !== 'cancelled' &&
    (
      (startTime >= assignment.startTime && startTime < assignment.endTime) ||
      (endTime > assignment.startTime && endTime <= assignment.endTime) ||
      (startTime <= assignment.startTime && endTime >= assignment.endTime)
    )
  );

  if (conflictingAssignment) {
    return {
      success: false,
      error: `Stall ${stallId} is already booked from ${conflictingAssignment.startTime.toISOString()} to ${conflictingAssignment.endTime.toISOString()}`
    };
  }

  // Create new assignment
  const newAssignment: ScheduleAssignment = {
    id: `SA${Date.now()}`,
    vehicleId,
    stallId,
    startTime,
    endTime,
    type: 'charging',
    status: 'scheduled',
  };

  // Update mock data (in real implementation, this would persist to database)
  mockScheduleAssignments.push(newAssignment);
  stall.status = 'reserved';
  stall.currentVehicleId = vehicleId;
  vehicle.status = 'assigned';

  return { success: true, assignment: newAssignment };
};

export const assignDetailing = (
  vehicleId: string,
  bayId: string,
  timeWindow: { start: Date; end: Date }
): { success: boolean; assignment?: ScheduleAssignment; error?: string } => {
  // Validate vehicle exists
  const vehicle = findVehicleById(vehicleId);
  if (!vehicle) {
    return { success: false, error: 'Vehicle not found' };
  }

  // Validate bay exists and is available
  const bay = findBayById(bayId);
  if (!bay) {
    return { success: false, error: 'Detailing bay not found' };
  }
  if (bay.status !== 'available') {
    return { success: false, error: 'Detailing bay is not available' };
  }

  // Check for conflicts
  const conflictingAssignment = mockScheduleAssignments.find(assignment =>
    assignment.bayId === bayId &&
    assignment.status !== 'completed' &&
    assignment.status !== 'cancelled' &&
    (
      (timeWindow.start >= assignment.startTime && timeWindow.start < assignment.endTime) ||
      (timeWindow.end > assignment.startTime && timeWindow.end <= assignment.endTime) ||
      (timeWindow.start <= assignment.startTime && timeWindow.end >= assignment.endTime)
    )
  );

  if (conflictingAssignment) {
    return {
      success: false,
      error: `Bay ${bayId} is already booked during the requested time window`
    };
  }

  // Create detailing assignment
  const newAssignment: ScheduleAssignment = {
    id: `DA${Date.now()}`,
    vehicleId,
    bayId,
    startTime: timeWindow.start,
    endTime: timeWindow.end,
    type: 'detailing',
    status: 'scheduled',
  };

  // Update mock data
  mockScheduleAssignments.push(newAssignment);
  bay.status = 'occupied';
  bay.currentVehicleId = vehicleId;

  return { success: true, assignment: newAssignment };
};

export const optimizeChargingPlan = (
  depotId: string,
  horizonMinutes: number = 120,
  objective: 'minimize_wait' | 'maximize_utilization' | 'minimize_energy_cost' = 'minimize_wait'
): OptimizationPlan => {
  const queue = getChargingQueue(depotId);
  const availableStalls = getAvailableStalls(depotId);
  const assignments: ScheduleAssignment[] = [];

  // Simple optimization heuristic based on objective
  if (objective === 'minimize_wait') {
    // Assign vehicles to highest power stalls first (faster charging)
    const sortedStalls = availableStalls.sort((a, b) => b.powerRating - a.powerRating);

    queue.vehicles.forEach((vehicle, index) => {
      if (index < sortedStalls.length) {
        const stall = sortedStalls[index];
        const startTime = new Date();
        const chargeDuration = calculateChargeDuration(vehicle, stall);
        const endTime = new Date(startTime.getTime() + chargeDuration * 60 * 1000);

        assignments.push({
          id: `OPT${Date.now()}_${index}`,
          vehicleId: vehicle.id,
          stallId: stall.id,
          startTime,
          endTime,
          type: 'charging',
          status: 'scheduled',
        });
      }
    });
  } else if (objective === 'maximize_utilization') {
    // Distribute vehicles across all available stalls
    availableStalls.forEach((stall, index) => {
      if (index < queue.vehicles.length) {
        const vehicle = queue.vehicles[index];
        const startTime = new Date();
        const chargeDuration = calculateChargeDuration(vehicle, stall);
        const endTime = new Date(startTime.getTime() + chargeDuration * 60 * 1000);

        assignments.push({
          id: `OPT${Date.now()}_${index}`,
          vehicleId: vehicle.id,
          stallId: stall.id,
          startTime,
          endTime,
          type: 'charging',
          status: 'scheduled',
        });
      }
    });
  }

  // Calculate metrics
  const totalUtilization = assignments.length / availableStalls.length;
  const avgWaitTime = queue.vehicles.reduce((sum, v) =>
    sum + (queue.estimatedWaitTimes[v.id] || 0), 0) / queue.vehicles.length;
  const energyEfficiency = assignments.reduce((sum, a) => {
    const vehicle = findVehicleById(a.vehicleId);
    const stall = findStallById(a.stallId!);
    return sum + (vehicle && stall ? stall.powerRating * (100 - vehicle.stateOfCharge) / 100 : 0);
  }, 0) / assignments.length;

  return {
    assignments,
    metrics: {
      totalUtilization,
      avgWaitTime,
      energyEfficiency,
    },
    objective,
  };
};

export const utilizationReport = (
  depotId: string,
  start: Date,
  end: Date
): UtilizationReport => {
  // Filter assignments within the time period
  const periodAssignments = mockScheduleAssignments.filter(assignment =>
    assignment.startTime >= start && assignment.endTime <= end
  );

  const chargingAssignments = periodAssignments.filter(a => a.type === 'charging');
  const detailingAssignments = periodAssignments.filter(a => a.type === 'detailing');

  // Calculate charging stats
  const totalChargingSessions = chargingAssignments.length;
  const avgChargingDuration = totalChargingSessions > 0
    ? chargingAssignments.reduce((sum, a) =>
        sum + (a.endTime.getTime() - a.startTime.getTime()), 0) / totalChargingSessions / 60000
    : 0;

  const totalStalls = mockChargingStalls.filter(s => s.depotId === depotId).length;
  const stallUtilization = totalChargingSessions / totalStalls;

  // Calculate detailing stats
  const totalDetailingSessions = detailingAssignments.length;
  const avgDetailingDuration = totalDetailingSessions > 0
    ? detailingAssignments.reduce((sum, a) =>
        sum + (a.endTime.getTime() - a.startTime.getTime()), 0) / totalDetailingSessions / 60000
    : 0;

  const totalBays = mockDetailingBays.filter(b => b.depotId === depotId).length;
  const bayUtilization = totalDetailingSessions / totalBays;

  // Generate recommendations
  const recommendations: string[] = [];
  if (stallUtilization > 0.9) {
    recommendations.push('Consider adding more charging stalls to meet high demand');
  }
  if (stallUtilization < 0.3) {
    recommendations.push('Charging capacity appears underutilized - consider optimizing vehicle routing');
  }
  if (avgChargingDuration > 90) {
    recommendations.push('Average charging time is high - consider upgrading to higher power stalls');
  }

  return {
    depotId,
    period: { start, end },
    chargingStats: {
      totalSessions: totalChargingSessions,
      avgSessionDuration: avgChargingDuration,
      stallUtilization,
      peakHours: ['08:00-10:00', '17:00-19:00'], // Mock data
    },
    detailingStats: {
      totalSessions: totalDetailingSessions,
      avgSessionDuration: avgDetailingDuration,
      bayUtilization,
    },
    recommendations,
  };
};

// Helper functions
function getDepotName(depotId: string): string {
  const depotMap: Record<string, string> = {
    'depot-alpha': 'Depot Alpha',
    'depot-beta': 'Depot Beta',
    'depot-gamma': 'Depot Gamma',
  };
  return depotMap[depotId] || 'Unknown Depot';
}

function calculateChargeDuration(vehicle: Vehicle, stall: ChargingStall): number {
  // Simple calculation: time to charge from current SOC to 80%
  const chargeNeeded = Math.max(0, 80 - vehicle.stateOfCharge);
  const assumedBatterySize = 75; // kWh (average)
  const energyNeeded = (chargeNeeded / 100) * assumedBatterySize;

  // Account for charging curve (efficiency decreases at higher SOC)
  const chargingEfficiency = vehicle.stateOfCharge < 50 ? 0.9 : 0.7;
  const effectivePower = stall.powerRating * chargingEfficiency;

  return Math.ceil(energyNeeded / effectivePower * 60); // minutes
}