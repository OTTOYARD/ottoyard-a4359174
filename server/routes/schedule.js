import { Router } from 'express';

const router = Router();

// In-memory storage (should be replaced with database in production)
let vehicles = [
  {
    id: 'vehicle-1',
    depot_id: 'depot-1',
    soc: 15,
    status: 'available',
    location: {},
    model: 'Tesla Model Y',
    battery_capacity: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vehicle-2',
    depot_id: 'depot-1',
    soc: 8,
    status: 'available',
    location: {},
    model: 'Tesla Model 3',
    battery_capacity: 60,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vehicle-3',
    depot_id: 'depot-1',
    soc: 85,
    status: 'charging',
    location: { stall_id: 'stall-1' },
    model: 'Tesla Model Y',
    battery_capacity: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

let chargingStalls = [
  {
    id: 'stall-1',
    depot_id: 'depot-1',
    status: 'occupied',
    power_kw: 150,
    vehicle_id: 'vehicle-3',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'stall-2',
    depot_id: 'depot-1',
    status: 'available',
    power_kw: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'stall-3',
    depot_id: 'depot-1',
    status: 'available',
    power_kw: 250,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

let detailingBays = [
  {
    id: 'bay-1',
    depot_id: 'depot-1',
    status: 'available',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'bay-2',
    depot_id: 'depot-1',
    status: 'available',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

let scheduleAssignments = [
  {
    id: 'assignment-1',
    vehicle_id: 'vehicle-3',
    stall_id: 'stall-1',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    type: 'charging',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Validation middleware
function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field] && !req.query[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing_fields: missing
      });
    }
    next();
  };
}

// GET /api/stalls?depot_id=&status=
router.get('/stalls', (req, res) => {
  try {
    const { depot_id, status } = req.query;

    if (!depot_id) {
      return res.status(400).json({ error: 'depot_id is required' });
    }

    let stalls = chargingStalls.filter(stall => stall.depot_id === depot_id);

    if (status) {
      stalls = stalls.filter(stall => stall.status === status);
    }

    // Sort by power (highest first)
    stalls.sort((a, b) => b.power_kw - a.power_kw);

    res.json({ stalls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/charging-queue?depot_id=
router.get('/charging-queue', (req, res) => {
  try {
    const { depot_id } = req.query;

    if (!depot_id) {
      return res.status(400).json({ error: 'depot_id is required' });
    }

    const queue = vehicles
      .filter(vehicle => vehicle.depot_id === depot_id && vehicle.status === 'available')
      .sort((a, b) => a.soc - b.soc);

    res.json({ queue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/schedule-vehicle
router.post('/schedule-vehicle', validateRequired(['vehicle_id', 'stall_id', 'start_time', 'end_time']), (req, res) => {
  try {
    const { vehicle_id, stall_id, start_time, end_time } = req.body;

    const vehicle = vehicles.find(v => v.id === vehicle_id);
    const stall = chargingStalls.find(s => s.id === stall_id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (!stall) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    if (stall.status !== 'available') {
      return res.status(400).json({ error: 'Stall is not available' });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    // Check for double-booking
    const conflictingAssignments = scheduleAssignments.filter(assignment => {
      if (assignment.stall_id !== stall_id) return false;
      if (assignment.status === 'completed' || assignment.status === 'cancelled') return false;

      const assignmentStart = new Date(assignment.start_time);
      const assignmentEnd = new Date(assignment.end_time);

      return (startDate < assignmentEnd && endDate > assignmentStart);
    });

    if (conflictingAssignments.length > 0) {
      return res.status(409).json({
        error: 'Double-booking detected: stall is already reserved during this time',
        conflicting_assignments: conflictingAssignments
      });
    }

    const assignment = {
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

    // Update stall and vehicle status
    stall.status = 'reserved';
    stall.vehicle_id = vehicle_id;
    stall.reserved_until = end_time;

    vehicle.status = 'charging';
    vehicle.location.stall_id = stall_id;

    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assign-detailing
router.post('/assign-detailing', validateRequired(['vehicle_id', 'bay_id', 'time_window']), (req, res) => {
  try {
    const { vehicle_id, bay_id, time_window } = req.body;

    if (!time_window.start || !time_window.end) {
      return res.status(400).json({ error: 'time_window must include start and end' });
    }

    const vehicle = vehicles.find(v => v.id === vehicle_id);
    const bay = detailingBays.find(b => b.id === bay_id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (!bay) {
      return res.status(404).json({ error: 'Bay not found' });
    }

    if (bay.status !== 'available') {
      return res.status(400).json({ error: 'Bay is not available' });
    }

    const assignment = {
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

    // Update bay and vehicle status
    bay.status = 'occupied';
    bay.vehicle_id = vehicle_id;
    bay.estimated_completion = time_window.end;

    vehicle.status = 'detailing';
    vehicle.location.bay_id = bay_id;

    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/optimize-charging-plan
router.post('/optimize-charging-plan', validateRequired(['depot_id']), (req, res) => {
  try {
    const { depot_id, horizon_minutes = 120, objective = 'maximize_utilization' } = req.body;

    const availableVehicles = vehicles.filter(v =>
      v.depot_id === depot_id &&
      v.status === 'available' &&
      v.soc < 80
    ).sort((a, b) => a.soc - b.soc);

    const availableStalls = chargingStalls.filter(s =>
      s.depot_id === depot_id &&
      s.status === 'available'
    ).sort((a, b) => b.power_kw - a.power_kw);

    const assignments = [];
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

    const plan = {
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

    res.json({ plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/utilization-report?depot_id=&start=&end=
router.get('/utilization-report', (req, res) => {
  try {
    const { depot_id, start, end } = req.query;

    if (!depot_id || !start || !end) {
      return res.status(400).json({
        error: 'depot_id, start, and end are required'
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const depotVehicles = vehicles.filter(v => v.depot_id === depot_id);
    const depotStalls = chargingStalls.filter(s => s.depot_id === depot_id);
    const depotBays = detailingBays.filter(b => b.depot_id === depot_id);

    const relevantAssignments = scheduleAssignments.filter(a => {
      const assignmentStart = new Date(a.start_time);
      const assignmentEnd = new Date(a.end_time);
      return (assignmentStart < endDate && assignmentEnd > startDate);
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

    const peakDemandHour = new Date(startDate.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const averageSocImprovement = depotVehicles.reduce((sum, v) => sum + v.soc, 0) / depotVehicles.length;

    const recommendations = [];

    if (stallUtilization < 70) {
      recommendations.push('Consider promoting charging services to increase stall utilization');
    }

    if (vehicleUtilization > 90) {
      recommendations.push('High demand detected - consider expanding fleet capacity');
    }

    if (bayUtilization < 50) {
      recommendations.push('Detailing bays are underutilized - optimize scheduling or repurpose');
    }

    const report = {
      depot_id,
      start_time: start,
      end_time: end,
      metrics: {
        vehicle_utilization: vehicleUtilization,
        stall_utilization: stallUtilization,
        bay_utilization: bayUtilization,
        peak_demand_hour: peakDemandHour,
        average_soc_improvement: averageSocImprovement
      },
      recommendations
    };

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as scheduleRoutes };