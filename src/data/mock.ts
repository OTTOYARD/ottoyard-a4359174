// Mock data for OttoCommand system

import { Vehicle, ChargingStall, DetailingBay, ScheduleAssignment } from '../types';

export const mockVehicles: Vehicle[] = [
  {
    id: 'V001',
    model: 'Tesla Model Y',
    stateOfCharge: 15,
    status: 'available',
    location: 'Depot Alpha',
    lastUpdated: new Date(),
  },
  {
    id: 'V002',
    model: 'Ford E-Transit',
    stateOfCharge: 8,
    status: 'available',
    location: 'Depot Alpha',
    lastUpdated: new Date(),
  },
  {
    id: 'V003',
    model: 'Rivian EDV',
    stateOfCharge: 45,
    status: 'charging',
    location: 'Depot Alpha',
    lastUpdated: new Date(),
  },
  {
    id: 'V004',
    model: 'Mercedes eSprinter',
    stateOfCharge: 22,
    status: 'available',
    location: 'Depot Alpha',
    lastUpdated: new Date(),
  },
  {
    id: 'V005',
    model: 'Tesla Model Y',
    stateOfCharge: 78,
    status: 'assigned',
    location: 'Depot Alpha',
    lastUpdated: new Date(),
  },
];

export const mockChargingStalls: ChargingStall[] = [
  {
    id: 'CS001',
    depotId: 'depot-alpha',
    powerRating: 150,
    status: 'available',
    connectorType: 'CCS',
  },
  {
    id: 'CS002',
    depotId: 'depot-alpha',
    powerRating: 250,
    status: 'occupied',
    currentVehicleId: 'V003',
    connectorType: 'CCS',
  },
  {
    id: 'CS003',
    depotId: 'depot-alpha',
    powerRating: 150,
    status: 'available',
    connectorType: 'CCS',
  },
  {
    id: 'CS004',
    depotId: 'depot-alpha',
    powerRating: 350,
    status: 'available',
    connectorType: 'CCS',
  },
  {
    id: 'CS005',
    depotId: 'depot-alpha',
    powerRating: 150,
    status: 'maintenance',
    connectorType: 'CCS',
  },
];

export const mockDetailingBays: DetailingBay[] = [
  {
    id: 'DB001',
    depotId: 'depot-alpha',
    status: 'available',
  },
  {
    id: 'DB002',
    depotId: 'depot-alpha',
    status: 'available',
  },
  {
    id: 'DB003',
    depotId: 'depot-alpha',
    status: 'occupied',
    currentVehicleId: 'V001',
  },
];

export const mockScheduleAssignments: ScheduleAssignment[] = [
  {
    id: 'SA001',
    vehicleId: 'V003',
    stallId: 'CS002',
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    type: 'charging',
    status: 'active',
  },
  {
    id: 'SA002',
    vehicleId: 'V001',
    bayId: 'DB003',
    startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    type: 'detailing',
    status: 'active',
  },
];

// Utility functions for mock data manipulation
export const findVehicleById = (id: string): Vehicle | undefined => {
  return mockVehicles.find(v => v.id === id);
};

export const findStallById = (id: string): ChargingStall | undefined => {
  return mockChargingStalls.find(s => s.id === id);
};

export const findBayById = (id: string): DetailingBay | undefined => {
  return mockDetailingBays.find(b => b.id === id);
};

export const getAvailableStalls = (depotId: string): ChargingStall[] => {
  return mockChargingStalls.filter(s =>
    s.depotId === depotId && s.status === 'available'
  );
};

export const getAvailableBays = (depotId: string): DetailingBay[] => {
  return mockDetailingBays.filter(b =>
    b.depotId === depotId && b.status === 'available'
  );
};