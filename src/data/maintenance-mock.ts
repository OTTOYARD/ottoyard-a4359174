// Mock data for predictive maintenance feature

// Service pricing lookup
export const servicePricing: Record<string, number> = {
  "Tire Rotation": 75,
  "Brake Pad Replacement": 350,
  "Battery Health Check": 125,
  "Sensor Calibration": 200,
  "Fluid Top-up": 50,
  "Full Interior Detail": 150,
  "Exterior Wash": 45,
  "Interior Sanitization": 85,
  "Full Detail": 250,
  "Software Update": 0,
  "Brake Service": 400,
  "CHARGE": 25,
  "MAINTENANCE": 300,
  "DETAILING": 150,
};

// Helper to get price for a service
export const getServicePrice = (serviceType: string): number => {
  return servicePricing[serviceType] ?? 100;
};

export interface PredictedMaintenance {
  id: string;
  vehicleId: string;
  vehicleName: string;
  oem: string;
  predictedService: string;
  confidenceScore: number;
  predictedDate: string;
  healthScore: number;
  autoScheduled: boolean;
  depotName: string;
  scheduledTime: string | null;
  price?: number;
}

export interface AutoScheduledJob {
  id: string;
  vehicleId: string;
  vehicleName: string;
  oem: string;
  serviceType: "MAINTENANCE" | "DETAILING";
  scheduledDate: string;
  scheduledTime: string;
  depot: string;
  reason: string;
  bay: string;
  price?: number;
}

export interface UpcomingService {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  scheduledDate: string;
  status: "scheduled" | "in_progress" | "completed";
  price?: number;
}

// Predictive maintenance data - AI-predicted upcoming service needs
export const predictiveMaintenanceData: PredictedMaintenance[] = [
  {
    id: "pm-001",
    vehicleId: "WM-AV-042",
    vehicleName: "Waymo Pod 042",
    oem: "Waymo",
    predictedService: "Tire Rotation",
    confidenceScore: 94,
    predictedDate: "2025-01-18",
    healthScore: 78,
    autoScheduled: true,
    depotName: "Nashville Central",
    scheduledTime: "10:30 AM"
  },
  {
    id: "pm-002",
    vehicleId: "ZX-AV-015",
    vehicleName: "Zoox Shuttle 15",
    oem: "Zoox",
    predictedService: "Brake Pad Replacement",
    confidenceScore: 89,
    predictedDate: "2025-01-19",
    healthScore: 72,
    autoScheduled: true,
    depotName: "Austin Downtown",
    scheduledTime: "2:00 PM"
  },
  {
    id: "pm-003",
    vehicleId: "TS-AV-089",
    vehicleName: "Tesla Cybercab 089",
    oem: "Tesla",
    predictedService: "Battery Health Check",
    confidenceScore: 76,
    predictedDate: "2025-01-22",
    healthScore: 85,
    autoScheduled: false,
    depotName: null,
    scheduledTime: null
  },
  {
    id: "pm-004",
    vehicleId: "CR-AV-031",
    vehicleName: "Cruise Origin 31",
    oem: "Cruise",
    predictedService: "Sensor Calibration",
    confidenceScore: 91,
    predictedDate: "2025-01-20",
    healthScore: 81,
    autoScheduled: true,
    depotName: "LA West",
    scheduledTime: "9:00 AM"
  },
  {
    id: "pm-005",
    vehicleId: "NR-AV-007",
    vehicleName: "Nuro R3 007",
    oem: "Nuro",
    predictedService: "Fluid Top-up",
    confidenceScore: 82,
    predictedDate: "2025-01-21",
    healthScore: 88,
    autoScheduled: false,
    depotName: null,
    scheduledTime: null
  }
];

// Auto-scheduled queue - what OTTO-Q has automatically scheduled
export const autoScheduledQueue: AutoScheduledJob[] = [
  {
    id: "asq-001",
    vehicleId: "ZX-AV-015",
    vehicleName: "Zoox Shuttle 15",
    oem: "Zoox",
    serviceType: "MAINTENANCE",
    scheduledDate: "2025-01-19",
    scheduledTime: "2:00 PM",
    depot: "Austin Downtown",
    bay: "Bay 2",
    reason: "Predicted brake wear at 15,000 km threshold"
  },
  {
    id: "asq-002",
    vehicleId: "WM-AV-042",
    vehicleName: "Waymo Pod 042",
    oem: "Waymo",
    serviceType: "MAINTENANCE",
    scheduledDate: "2025-01-18",
    scheduledTime: "10:30 AM",
    depot: "Nashville Central",
    bay: "Bay 1",
    reason: "Tire rotation due at 12,500 km interval"
  },
  {
    id: "asq-003",
    vehicleId: "CR-AV-031",
    vehicleName: "Cruise Origin 31",
    oem: "Cruise",
    serviceType: "MAINTENANCE",
    scheduledDate: "2025-01-20",
    scheduledTime: "9:00 AM",
    depot: "LA West",
    bay: "Bay 3",
    reason: "Sensor drift detected - calibration required"
  },
  {
    id: "asq-004",
    vehicleId: "TS-AV-023",
    vehicleName: "Tesla Cybercab 023",
    oem: "Tesla",
    serviceType: "DETAILING",
    scheduledDate: "2025-01-17",
    scheduledTime: "3:30 PM",
    depot: "Nashville Central",
    bay: "Detail Stall 1",
    reason: "Scheduled deep clean after 500 trip cycles"
  }
];

// Upcoming maintenance list
export const upcomingMaintenance: UpcomingService[] = [
  {
    id: "um-001",
    vehicleId: "WM-AV-042",
    vehicleName: "Waymo Pod 042",
    serviceType: "Tire Rotation",
    scheduledDate: "2025-01-18",
    status: "scheduled"
  },
  {
    id: "um-002",
    vehicleId: "ZX-AV-015",
    vehicleName: "Zoox Shuttle 15",
    serviceType: "Brake Service",
    scheduledDate: "2025-01-19",
    status: "scheduled"
  },
  {
    id: "um-003",
    vehicleId: "CR-AV-031",
    vehicleName: "Cruise Origin 31",
    serviceType: "Sensor Calibration",
    scheduledDate: "2025-01-20",
    status: "scheduled"
  },
  {
    id: "um-004",
    vehicleId: "AU-AV-012",
    vehicleName: "Aurora Driver 12",
    serviceType: "Software Update",
    scheduledDate: "2025-01-16",
    status: "in_progress"
  }
];

// Upcoming detailing list
export const upcomingDetailing: UpcomingService[] = [
  {
    id: "ud-001",
    vehicleId: "TS-AV-023",
    vehicleName: "Tesla Cybercab 023",
    serviceType: "Full Interior Detail",
    scheduledDate: "2025-01-17",
    status: "scheduled"
  },
  {
    id: "ud-002",
    vehicleId: "NR-AV-007",
    vehicleName: "Nuro R3 007",
    serviceType: "Exterior Wash",
    scheduledDate: "2025-01-18",
    status: "scheduled"
  },
  {
    id: "ud-003",
    vehicleId: "WM-AV-042",
    vehicleName: "Waymo Pod 042",
    serviceType: "Interior Sanitization",
    scheduledDate: "2025-01-21",
    status: "scheduled"
  },
  {
    id: "ud-004",
    vehicleId: "MM-AV-005",
    vehicleName: "May Mobility 05",
    serviceType: "Full Detail",
    scheduledDate: "2025-01-15",
    status: "completed"
  }
];
