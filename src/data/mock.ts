// Enhanced Fleet Operations Mock Data for OttoCommand AI - Autonomous Fleet OEM Partners
import { Stall, Vehicle, StallStatus, VehicleStatus, ChargingAssignment } from "../agent/tools";

// Comprehensive depot configurations for major autonomous fleet OEM partners
export const depots = [
  { 
    id: "depot-waymo-nash", 
    name: "OTTOYARD Waymo Hub - Nashville",
    location: { lat: 36.1627, lng: -86.7816 },
    capacity: 25,
    operatingHours: "24/7",
    utilization: 0.87,
    energyEfficiency: 0.94,
    maintenanceBays: 4,
    chargingStations: 12,
    partner: "waymo",
    slaUptime: 99.5,
    avgDisengagementMiles: 13219
  },
  { 
    id: "depot-zoox-austin", 
    name: "OTTOYARD Zoox Center - Austin",
    location: { lat: 30.2672, lng: -97.7431 },
    capacity: 30,
    operatingHours: "24/7",
    utilization: 0.82,
    energyEfficiency: 0.91,
    maintenanceBays: 5,
    chargingStations: 16,
    partner: "zoox",
    slaUptime: 99.2,
    avgDisengagementMiles: 8934
  },
  { 
    id: "depot-uber-seattle", 
    name: "OTTOYARD Uber ATG - Seattle",
    location: { lat: 47.6062, lng: -122.3321 },
    capacity: 20,
    operatingHours: "05:00-01:00",
    utilization: 0.78,
    energyEfficiency: 0.89,
    maintenanceBays: 3,
    chargingStations: 10,
    partner: "uber",
    slaUptime: 98.8,
    avgDisengagementMiles: 5432
  },
  { 
    id: "depot-lyft-sf", 
    name: "OTTOYARD Lyft Level 5 - San Francisco",
    location: { lat: 37.7749, lng: -122.4194 },
    capacity: 18,
    operatingHours: "24/7",
    utilization: 0.85,
    energyEfficiency: 0.90,
    maintenanceBays: 3,
    chargingStations: 9,
    partner: "lyft",
    slaUptime: 98.5,
    avgDisengagementMiles: 6891
  },
];

// Advanced stall configurations optimized for autonomous vehicle charging
export const stalls: Stall[] = [
  // Waymo Nashville Hub — 25 high-capacity autonomous charging stalls
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `WM-${i + 1}`,
    depotId: "depot-waymo-nash",
    status: (i % 8 === 0 ? "reserved" : i % 12 === 0 ? "maintenance" : "open") as StallStatus,
    powerKW: i % 2 === 0 ? 350 : 250, // High-speed DC charging for continuous operations
    connector: "CCS",
    maxVehicleLength: 18.0,
    lastMaintenance: new Date(Date.now() - Math.random() * 15 * 86400000).toISOString(),
    utilizationRate: Math.round((0.6 + Math.random() * 0.3) * 100) / 100,
    avgChargingTime: 45 + Math.random() * 30, // Fast charging for robotaxis
    autonomousCompatible: true,
  })),
  // Zoox Austin Center — 30 bi-directional charging stalls
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `ZX-${i + 1}`,
    depotId: "depot-zoox-austin", 
    status: (i % 10 === 0 ? "out_of_service" : i % 15 === 0 ? "reserved" : "open") as StallStatus,
    powerKW: i % 3 === 0 ? 400 : 300, // Ultra-fast charging for Zoox vehicles
    connector: "MCS", // Megawatt Charging System
    maxVehicleLength: 12.5, // Compact Zoox vehicles
    lastMaintenance: new Date(Date.now() - Math.random() * 20 * 86400000).toISOString(),
    utilizationRate: Math.round((0.55 + Math.random() * 0.35) * 100) / 100,
    avgChargingTime: 35 + Math.random() * 25,
    autonomousCompatible: true,
    biDirectional: true,
  })),
  // Uber ATG Seattle — 20 mixed-autonomy stalls
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `UA-${i + 1}`,
    depotId: "depot-uber-seattle",
    status: (i % 6 === 0 ? "reserved" : i % 14 === 0 ? "maintenance" : "open") as StallStatus,
    powerKW: i % 2 === 0 ? 250 : 200,
    connector: "CCS",
    maxVehicleLength: 16.0,
    lastMaintenance: new Date(Date.now() - Math.random() * 25 * 86400000).toISOString(),
    utilizationRate: Math.round((0.5 + Math.random() * 0.4) * 100) / 100,
    avgChargingTime: 60 + Math.random() * 40,
    autonomousCompatible: true,
  })),
  // Lyft Level 5 San Francisco — 18 premium charging stalls
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `LY-${i + 1}`,
    depotId: "depot-lyft-sf",
    status: (i % 7 === 0 ? "out_of_service" : i % 11 === 0 ? "reserved" : "open") as StallStatus,
    powerKW: i % 2 === 0 ? 300 : 225,
    connector: "CCS",
    maxVehicleLength: 15.0,
    lastMaintenance: new Date(Date.now() - Math.random() * 18 * 86400000).toISOString(),
    utilizationRate: Math.round((0.65 + Math.random() * 0.25) * 100) / 100,
    avgChargingTime: 50 + Math.random() * 35,
    autonomousCompatible: true,
  })),
];

// Autonomous vehicle fleet with partner-specific configurations
export const vehicles: Vehicle[] = [
  // Waymo Chrysler Pacifica Hybrid Fleet (Nashville) - L4 Robotaxis
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `WM-PAC-${String(i + 1).padStart(2, '0')}`,
    soc: Math.max(0.15, Math.min(0.95, 0.3 + (i % 8) * 0.08)),
    status: (i % 7 === 0 ? "charging" : i % 6 === 0 ? "maintenance" : i % 4 === 0 ? "active" : "idle") as VehicleStatus,
    currentDepotId: "depot-waymo-nash",
    vehicleType: "robotaxi",
    make: "Waymo",
    model: "Chrysler Pacifica Hybrid",
    licensePlate: `WM-${String(i + 100).slice(-2)}A`,
    batteryCapacity: 85, // kWh
    maxRange: 520, // km on hybrid system
    currentRoute: `Nash-Route-${Math.floor(i / 3) + 1}`,
    lastLocationUpdate: new Date(Date.now() - Math.random() * 1800000).toISOString(),
    mileage: 25000 + Math.random() * 75000,
    engineHours: 1200 + Math.random() * 3000,
    nextMaintenanceDate: new Date(Date.now() + Math.random() * 30 * 86400000).toISOString(),
    autonomyLevel: "L4" as const,
    disengagementRate: 0.000076, // per mile
    safetyScore: 98.7 + Math.random() * 1.2,
    revenuePerDay: 280 + Math.random() * 120,
    customerRating: 4.2 + Math.random() * 0.6,
    location: {
      lat: 36.1627 + (Math.random() - 0.5) * 0.05,
      lng: -86.7816 + (Math.random() - 0.5) * 0.05,
    },
    operationalMetrics: {
      avgDailyDistance: 180 + Math.random() * 120,
      energyConsumption: 95 + Math.random() * 40,
      utilizationRate: 0.75 + Math.random() * 0.2,
      uptime: 0.92 + Math.random() * 0.07,
      maintenanceCostPerKm: 0.08 + Math.random() * 0.04,
    }
  })),
  
  // Zoox Purpose-Built Robotaxis (Austin) - L5 Fully Autonomous
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `ZX-GEN1-${String(i + 1).padStart(2, '0')}`,
    soc: Math.max(0.2, Math.min(0.95, 0.25 + (i % 10) * 0.07)),
    status: (i % 8 === 0 ? "charging" : i % 5 === 0 ? "maintenance" : i % 3 === 0 ? "active" : "idle") as VehicleStatus,
    currentDepotId: "depot-zoox-austin",
    vehicleType: "robotaxi",
    make: "Zoox",
    model: "Gen1 Robotaxi",
    licensePlate: `ZX-${String(i + 200).slice(-2)}B`,
    batteryCapacity: 133, // kWh
    maxRange: 280, // km per charge
    currentRoute: `Austin-Zone-${Math.floor(i / 4) + 1}`,
    lastLocationUpdate: new Date(Date.now() - Math.random() * 900000).toISOString(),
    mileage: 15000 + Math.random() * 45000,
    engineHours: 800 + Math.random() * 2200,
    nextMaintenanceDate: new Date(Date.now() + Math.random() * 25 * 86400000).toISOString(),
    autonomyLevel: "L5" as const,
    disengagementRate: 0.000011, // Exceptional L5 performance
    safetyScore: 99.2 + Math.random() * 0.7,
    revenuePerDay: 320 + Math.random() * 150,
    customerRating: 4.3 + Math.random() * 0.5,
    biDirectionalCharging: true,
    location: {
      lat: 30.2672 + (Math.random() - 0.5) * 0.06,
      lng: -97.7431 + (Math.random() - 0.5) * 0.06,
    },
    operationalMetrics: {
      avgDailyDistance: 220 + Math.random() * 100,
      energyConsumption: 110 + Math.random() * 50,
      utilizationRate: 0.82 + Math.random() * 0.15,
      uptime: 0.94 + Math.random() * 0.05,
      maintenanceCostPerKm: 0.06 + Math.random() * 0.03,
    }
  })),

  // Uber ATG Volvo XC90 Fleet (Seattle) - L4 Rideshare
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `UA-XC90-${String(i + 1).padStart(2, '0')}`,
    soc: Math.max(0.1, Math.min(0.95, 0.4 + (i % 6) * 0.09)),
    status: (i % 6 === 0 ? "charging" : i % 7 === 0 ? "maintenance" : i % 3 === 0 ? "active" : "idle") as VehicleStatus,
    currentDepotId: "depot-uber-seattle",
    vehicleType: "rideshare_av",
    make: "Uber ATG",
    model: "Volvo XC90",
    licensePlate: `UA-${String(i + 300).slice(-2)}C`,
    batteryCapacity: 107, // kWh
    maxRange: 380, // km
    currentRoute: `Seattle-Corridor-${Math.floor(i / 3) + 1}`,
    lastLocationUpdate: new Date(Date.now() - Math.random() * 1200000).toISOString(),
    mileage: 35000 + Math.random() * 85000,
    engineHours: 1500 + Math.random() * 4000,
    nextMaintenanceDate: new Date(Date.now() + Math.random() * 35 * 86400000).toISOString(),
    autonomyLevel: "L4" as const,
    disengagementRate: 0.000184, // Higher rate due to complex urban environment
    safetyScore: 97.8 + Math.random() * 1.5,
    revenuePerDay: 240 + Math.random() * 100,
    customerRating: 3.9 + Math.random() * 0.8,
    location: {
      lat: 47.6062 + (Math.random() - 0.5) * 0.04,
      lng: -122.3321 + (Math.random() - 0.5) * 0.04,
    },
    operationalMetrics: {
      avgDailyDistance: 160 + Math.random() * 90,
      energyConsumption: 85 + Math.random() * 35,
      utilizationRate: 0.68 + Math.random() * 0.25,
      uptime: 0.88 + Math.random() * 0.10,
      maintenanceCostPerKm: 0.12 + Math.random() * 0.06,
    }
  })),

  // Lyft Level 5 BMW iX Partnership Fleet (San Francisco) - L4 Premium Rideshare
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `LY-BMW-${String(i + 1).padStart(2, '0')}`,
    soc: Math.max(0.25, Math.min(0.95, 0.35 + (i % 5) * 0.12)),
    status: (i % 5 === 0 ? "charging" : i % 8 === 0 ? "maintenance" : i % 2 === 0 ? "active" : "idle") as VehicleStatus,
    currentDepotId: "depot-lyft-sf",
    vehicleType: "premium_rideshare",
    make: "Lyft",
    model: "BMW iX Partner",
    licensePlate: `LY-${String(i + 400).slice(-2)}D`,
    batteryCapacity: 111.5, // kWh
    maxRange: 425, // km
    currentRoute: `SF-Premium-${Math.floor(i / 2) + 1}`,
    lastLocationUpdate: new Date(Date.now() - Math.random() * 1000000).toISOString(),
    mileage: 28000 + Math.random() * 65000,
    engineHours: 1100 + Math.random() * 3200,
    nextMaintenanceDate: new Date(Date.now() + Math.random() * 28 * 86400000).toISOString(),
    autonomyLevel: "L4" as const,
    disengagementRate: 0.000145,
    safetyScore: 98.1 + Math.random() * 1.3,
    revenuePerDay: 310 + Math.random() * 140,
    customerRating: 4.0 + Math.random() * 0.7,
    location: {
      lat: 37.7749 + (Math.random() - 0.5) * 0.03,
      lng: -122.4194 + (Math.random() - 0.5) * 0.03,
    },
    operationalMetrics: {
      avgDailyDistance: 195 + Math.random() * 105,
      energyConsumption: 100 + Math.random() * 45,
      utilizationRate: 0.78 + Math.random() * 0.18,
      uptime: 0.90 + Math.random() * 0.08,
      maintenanceCostPerKm: 0.09 + Math.random() * 0.05,
    }
  })),
];

// Partner-specific operational metrics for autonomous fleet management
export const partnerMetrics = {
  waymo: {
    avgMilesPerDisengagement: 13219,
    customerSatisfactionScore: 4.2,
    onTimePerformance: 94.5,
    safetyIncidentsPerMillion: 0.09,
    slaUptime: 99.5,
    revenuePerVehiclePerDay: 285,
    maintenanceWindowHours: 4
  },
  zoox: {
    avgMilesPerDisengagement: 8934,
    customerSatisfactionScore: 4.1,
    onTimePerformance: 91.2,
    safetyIncidentsPerMillion: 0.12,
    slaUptime: 99.2,
    revenuePerVehiclePerDay: 335,
    maintenanceWindowHours: 6
  },
  uber: {
    avgMilesPerDisengagement: 5432,
    customerSatisfactionScore: 3.9,
    onTimePerformance: 88.7,
    safetyIncidentsPerMillion: 0.15,
    slaUptime: 98.8,
    revenuePerVehiclePerDay: 245,
    maintenanceWindowHours: 5
  },
  lyft: {
    avgMilesPerDisengagement: 6891,
    customerSatisfactionScore: 4.0,
    onTimePerformance: 90.1,
    safetyIncidentsPerMillion: 0.11,
    slaUptime: 98.5,
    revenuePerVehiclePerDay: 315,
    maintenanceWindowHours: 5
  },
};

// Autonomous fleet routes optimized for each partner
export const routes = [
  {
    id: "waymo-nash-downtown",
    name: "Nashville Downtown Robotaxi Circuit",
    partner: "waymo",
    distance: 28.5,
    estimatedDuration: 75, // minutes
    energyConsumption: 45, // kWh
    waypoints: 12,
    trafficFactor: 1.1,
    priorityLevel: "high",
    assignedVehicles: ["WM-PAC-01", "WM-PAC-05", "WM-PAC-08"],
    optimalTimeWindows: ["06:00-09:30", "16:00-19:30"],
    weatherSensitivity: "low",
    disengagementRisk: "minimal"
  },
  {
    id: "zoox-austin-urban", 
    name: "Austin Urban Density Loop",
    partner: "zoox",
    distance: 22.8,
    estimatedDuration: 55,
    energyConsumption: 38,
    waypoints: 15,
    trafficFactor: 0.95,
    priorityLevel: "critical",
    assignedVehicles: ["ZX-GEN1-03", "ZX-GEN1-07", "ZX-GEN1-12"],
    optimalTimeWindows: ["05:30-08:30", "17:30-20:30"],
    weatherSensitivity: "very_low",
    disengagementRisk: "ultra_low"
  },
  {
    id: "uber-seattle-corridor",
    name: "Seattle Tech Corridor Route", 
    partner: "uber",
    distance: 35.2,
    estimatedDuration: 95,
    energyConsumption: 62,
    waypoints: 18,
    trafficFactor: 1.3,
    priorityLevel: "medium",
    assignedVehicles: ["UA-XC90-02", "UA-XC90-06"],
    optimalTimeWindows: ["07:00-10:00", "15:30-18:30"],
    weatherSensitivity: "medium",
    disengagementRisk: "moderate"
  },
  {
    id: "lyft-sf-premium",
    name: "San Francisco Premium Routes",
    partner: "lyft", 
    distance: 18.5,
    estimatedDuration: 45,
    energyConsumption: 28,
    waypoints: 8,
    trafficFactor: 1.4,
    priorityLevel: "high",
    assignedVehicles: ["LY-BMW-01", "LY-BMW-04"],
    optimalTimeWindows: ["08:00-11:00", "18:00-21:00"],
    weatherSensitivity: "low",
    disengagementRisk: "low"
  }
];

// Predictive maintenance insights for autonomous vehicles
export const maintenanceInsights = {
  predictiveAlerts: [
    {
      vehicleId: "WM-PAC-07",
      component: "autonomous_sensor_suite",
      confidence: 0.89,
      estimatedFailureDate: "2025-11-18",
      severity: "high",
      costImpact: 8500,
      recommendation: "Schedule LIDAR calibration and sensor cleaning within 1 week",
      partnerSLAImpact: "critical"
    },
    {
      vehicleId: "ZX-GEN1-09",
      component: "battery_thermal_management",
      confidence: 0.76,
      estimatedFailureDate: "2025-12-12",
      severity: "medium", 
      costImpact: 3200,
      recommendation: "Monitor battery temperature patterns during peak usage",
      partnerSLAImpact: "moderate"
    },
    {
      vehicleId: "UA-XC90-04",
      component: "steering_actuator",
      confidence: 0.82,
      estimatedFailureDate: "2025-11-28",
      severity: "high",
      costImpact: 4500,
      recommendation: "Replace steering actuator during next maintenance window",
      partnerSLAImpact: "high"
    }
  ],
  fleetHealthScore: 0.91, // Higher for autonomous fleets
  avgMaintenanceCostTrend: -0.08, // 8% improvement with AI predictive maintenance
  criticalVehicles: ["WM-PAC-07", "UA-XC90-04", "LY-BMW-03"],
  autonomousSystemHealth: 0.94,
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