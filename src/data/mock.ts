import type {
  Vehicle,
  ChargingStall,
  DetailingBay,
  Depot,
  ScheduleAssignment
} from '../types';

export const mockDepots: Depot[] = [
  {
    id: 'depot-1',
    name: 'Downtown Depot',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: '123 Main St, San Francisco, CA 94105'
    },
    capacity: {
      vehicles: 50,
      charging_stalls: 20,
      detailing_bays: 5
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'depot-2',
    name: 'Airport Depot',
    location: {
      lat: 37.6213,
      lng: -122.3790,
      address: '456 Airport Blvd, San Francisco, CA 94128'
    },
    capacity: {
      vehicles: 75,
      charging_stalls: 30,
      detailing_bays: 8
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockVehicles: Vehicle[] = [
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
  },
  {
    id: 'vehicle-4',
    depot_id: 'depot-1',
    soc: 45,
    status: 'available',
    location: {},
    model: 'Tesla Model S',
    battery_capacity: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vehicle-5',
    depot_id: 'depot-1',
    soc: 22,
    status: 'available',
    location: {},
    model: 'Tesla Model 3',
    battery_capacity: 60,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockChargingStalls: ChargingStall[] = [
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
  },
  {
    id: 'stall-4',
    depot_id: 'depot-1',
    status: 'available',
    power_kw: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'stall-5',
    depot_id: 'depot-1',
    status: 'maintenance',
    power_kw: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockDetailingBays: DetailingBay[] = [
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
  },
  {
    id: 'bay-3',
    depot_id: 'depot-1',
    status: 'occupied',
    vehicle_id: 'vehicle-6',
    estimated_completion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockScheduleAssignments: ScheduleAssignment[] = [
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