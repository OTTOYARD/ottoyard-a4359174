// Enhanced Fleet Operations Mock Data for OttoCommand AI
import { Stall, Vehicle, StallStatus, VehicleStatus, ChargingAssignment } from "../agent/tools";

// Comprehensive depot configurations with operational details
export const depots = [
  { 
    id: "depot-mini-nash", 
    name: "OTTOYARD Mini - Nashville",
    location: { lat: 36.1627, lng: -86.7816 },
    capacity: 20,
    operatingHours: "06:00-22:00",
    utilization: 0.75,
    energyEfficiency: 0.92,
    maintenanceBays: 3,
    chargingStations: 8
  },
  { 
    id: "depot-max-aus", 
    name: "OTTOYARD Max - Austin",
    location: { lat: 30.2672, lng: -97.7431 },
    capacity: 40,
    operatingHours: "24/7",
    utilization: 0.68,
    energyEfficiency: 0.88,
    maintenanceBays: 6,
    chargingStations: 16
  },
];

// Advanced stall configurations with real-world constraints
export const stalls: Stall[] = [
  // Nashville (Mini) — 20 stalls with varied capabilities
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `N-${i + 1}`,
    depotId: "depot-mini-nash",
    status: (i % 8 === 0 ? "reserved" : i % 12 === 0 ? "maintenance" : "open") as StallStatus,
    powerKW: i % 3 === 0 ? 150 : i % 5 === 0 ? 250 : 75,
    connector: i % 3 === 0 ? "CCS" : "Type2",
    maxVehicleLength: 12.5,
    lastMaintenance: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    utilizationRate: Math.round((0.4 + Math.random() * 0.5) * 100) / 100,
    avgChargingTime: 180 + Math.random() * 120, // minutes
  })),
  // Austin (Max) — 40 stalls with high-capacity operations
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `A-${i + 1}`,
    depotId: "depot-max-aus", 
    status: (i % 10 === 0 ? "out_of_service" : i % 15 === 0 ? "reserved" : "open") as StallStatus,
    powerKW: i % 2 === 0 ? 250 : i % 7 === 0 ? 350 : 150,
    connector: i % 2 === 0 ? "CCS" : "MCS",
    maxVehicleLength: i % 3 === 0 ? 18.0 : 12.5,
    lastMaintenance: new Date(Date.now() - Math.random() * 45 * 86400000).toISOString(),
    utilizationRate: Math.round((0.5 + Math.random() * 0.4) * 100) / 100,
    avgChargingTime: 120 + Math.random() * 180, // minutes
  })),
];

// Comprehensive vehicle fleet with operational intelligence
export const vehicles: Vehicle[] = [
  // Mixed fleet with realistic operational patterns
  ...Array.from({ length: 50 }, (_, i) => {
    const vehicleTypes = ["delivery_van", "cargo_truck", "passenger_bus", "service_vehicle"];
    const makes = ["Volvo", "Mercedes", "Scania", "BYD", "Tesla", "Rivian"];
    const statuses = ["active", "idle", "charging", "maintenance", "en_route"];
    
    const type = vehicleTypes[i % vehicleTypes.length];
    const make = makes[i % makes.length];
    const baseSOC = 0.15 + (i % 8) * 0.1; // Varied battery levels
    
    return {
      id: `V-${String(i + 1).padStart(3, '0')}`,
      soc: Math.max(0.05, Math.min(0.95, baseSOC + (Math.random() - 0.5) * 0.2)),
      status: (statuses[i % statuses.length]) as VehicleStatus,
      currentDepotId: i % 3 === 0 ? "depot-mini-nash" : "depot-max-aus",
      vehicleType: type,
      make: make,
      model: `${type.split('_')[0].toUpperCase()} ${2020 + (i % 5)}`,
      licensePlate: `OY${String(i + 100).slice(-2)}${String.fromCharCode(65 + (i % 26))}`,
      batteryCapacity: type === "passenger_bus" ? 400 : type === "cargo_truck" ? 350 : 200, // kWh
      maxRange: type === "passenger_bus" ? 300 : type === "cargo_truck" ? 250 : 180, // km
      currentRoute: `Route-${Math.floor(i / 5) + 1}`,
      lastLocationUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      mileage: 10000 + Math.random() * 50000,
      engineHours: 500 + Math.random() * 2000,
      nextMaintenanceDate: new Date(Date.now() + Math.random() * 90 * 86400000).toISOString(),
      fuelEfficiency: 3.5 + Math.random() * 2.0, // km/kWh
      location: {
        lat: (i % 2 === 0 ? 36.1627 : 30.2672) + (Math.random() - 0.5) * 0.1,
        lng: (i % 2 === 0 ? -86.7816 : -97.7431) + (Math.random() - 0.5) * 0.1,
      },
      operationalMetrics: {
        avgDailyDistance: 50 + Math.random() * 200,
        energyConsumption: 150 + Math.random() * 100, // kWh/day
        utilizationRate: 0.6 + Math.random() * 0.3,
        uptime: 0.85 + Math.random() * 0.14,
        maintenanceCostPerKm: 0.15 + Math.random() * 0.1,
      }
    };
  }),
];

// Advanced route optimization data
export const routes = [
  {
    id: "route-001",
    name: "Nashville Downtown Circuit",
    distance: 45.2,
    estimatedDuration: 120, // minutes
    energyConsumption: 82, // kWh
    waypoints: 8,
    trafficFactor: 1.2,
    priorityLevel: "high",
    assignedVehicles: ["V-001", "V-007", "V-013"],
    optimalTimeWindows: ["06:00-09:00", "14:00-17:00"],
    weatherSensitivity: "medium"
  },
  {
    id: "route-002", 
    name: "Austin Logistics Hub Loop",
    distance: 78.5,
    estimatedDuration: 180,
    energyConsumption: 145,
    waypoints: 12,
    trafficFactor: 0.9,
    priorityLevel: "critical",
    assignedVehicles: ["V-025", "V-031", "V-042"],
    optimalTimeWindows: ["05:00-08:00", "20:00-23:00"],
    weatherSensitivity: "low"
  }
];

// Comprehensive maintenance intelligence
export const maintenanceInsights = {
  predictiveAlerts: [
    {
      vehicleId: "V-008",
      component: "brake_system",
      confidence: 0.87,
      estimatedFailureDate: "2025-11-15",
      severity: "high",
      costImpact: 2500,
      recommendation: "Schedule brake inspection within 2 weeks"
    },
    {
      vehicleId: "V-023",
      component: "battery_cooling",
      confidence: 0.72,
      estimatedFailureDate: "2025-12-08",
      severity: "medium", 
      costImpact: 1800,
      recommendation: "Monitor cooling system performance closely"
    }
  ],
  fleetHealthScore: 0.84,
  avgMaintenanceCostTrend: -0.05, // 5% improvement
  criticalVehicles: ["V-008", "V-017", "V-034"],
};

// Energy optimization intelligence
export const energyAnalytics = {
  totalFleetConsumption: 12450, // kWh/day
  peakDemandHours: ["07:00-09:00", "17:00-19:00"],
  renewableEnergyUsage: 0.68,
  costPerKWh: 0.12,
  projectedSavings: {
    optimizedCharging: 1200, // USD/month
    routeOptimization: 800,
    maintenanceEfficiency: 600
  },
  chargingPatterns: {
    fastCharging: 0.25,
    standardCharging: 0.65,
    slowCharging: 0.10
  }
};

// Performance benchmarks and KPIs
export const performanceMetrics = {
  fleetUtilization: 0.73,
  onTimePerformance: 0.91,
  fuelEfficiencyImprovement: 0.08, // 8% better than baseline
  maintenanceCompliance: 0.95,
  customerSatisfaction: 4.2, // out of 5
  carbonFootprintReduction: 0.22, // 22% reduction
  operationalCostPerKm: 0.85,
  vehicleAvailability: 0.88
};

// Simple in-memory schedule with intelligent planning
export const schedule: {
  assignments: ChargingAssignment[];
} = { assignments: [] };

// Export comprehensive fleet intelligence for OttoCommand AI
export const fleetIntelligence = {
  depots,
  stalls,
  vehicles,
  routes,
  maintenanceInsights,
  energyAnalytics,
  performanceMetrics,
  schedule,
  // Real-time operational context
  contextualData: {
    currentWeather: "partly_cloudy",
    trafficConditions: "moderate",
    energyGridLoad: "normal",
    operationalAlerts: 3,
    activeRoutes: 12,
    vehiclesInTransit: 28,
    chargingQueueLength: 4
  }
};