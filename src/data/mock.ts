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

// Unified autonomous vehicle fleet across Nashville, Austin, and LA with multiple OEM brands
export const vehicles: Vehicle[] = [
  // ===== NASHVILLE FLEET =====
  // Waymo Fleet
  { id: "WM-PAC-05", soc: 0.87, status: "idle" as VehicleStatus, currentDepotId: "depot-waymo-nash", vehicleType: "robotaxi", make: "Waymo", model: "Jaguar I-PACE", city: "Nashville", licensePlate: "WM-05A", batteryCapacity: 90, maxRange: 470, currentRoute: "Nash-Downtown", lastLocationUpdate: new Date().toISOString(), mileage: 45000, engineHours: 2100, nextMaintenanceDate: new Date(Date.now() + 20 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000076, safetyScore: 98.7, revenuePerDay: 280, customerRating: 4.4, location: { lat: 36.1627, lng: -86.7816 }, operationalMetrics: { avgDailyDistance: 180, energyConsumption: 95, utilizationRate: 0.85, uptime: 0.92, maintenanceCostPerKm: 0.08 }},
  { id: "WM-PAC-12", soc: 0.45, status: "charging" as VehicleStatus, currentDepotId: "depot-waymo-nash", vehicleType: "robotaxi", make: "Waymo", model: "Jaguar I-PACE", city: "Nashville", licensePlate: "WM-12A", batteryCapacity: 90, maxRange: 470, currentRoute: "Nash-Midtown", lastLocationUpdate: new Date().toISOString(), mileage: 52000, engineHours: 2400, nextMaintenanceDate: new Date(Date.now() + 15 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000072, safetyScore: 98.9, revenuePerDay: 295, customerRating: 4.5, location: { lat: 36.1527, lng: -86.7716 }, operationalMetrics: { avgDailyDistance: 190, energyConsumption: 98, utilizationRate: 0.87, uptime: 0.94, maintenanceCostPerKm: 0.07 }},
  { id: "WM-JAG-12", soc: 0.67, status: "idle" as VehicleStatus, currentDepotId: "depot-waymo-nash", vehicleType: "robotaxi", make: "Waymo", model: "Jaguar I-PACE", city: "Nashville", licensePlate: "WM-J12", batteryCapacity: 90, maxRange: 470, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 38000, engineHours: 1800, nextMaintenanceDate: new Date(Date.now() + 25 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000078, safetyScore: 98.5, revenuePerDay: 270, customerRating: 4.3, location: { lat: 36.1727, lng: -86.7916 }, operationalMetrics: { avgDailyDistance: 175, energyConsumption: 92, utilizationRate: 0.83, uptime: 0.91, maintenanceCostPerKm: 0.09 }},
  
  // Zoox Fleet
  { id: "ZX-GEN1-19", soc: 0.78, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Zoox", model: "Gen1", city: "Nashville", licensePlate: "ZX-19B", batteryCapacity: 133, maxRange: 280, currentRoute: "Nash-East", lastLocationUpdate: new Date().toISOString(), mileage: 28000, engineHours: 1400, nextMaintenanceDate: new Date(Date.now() + 18 * 86400000).toISOString(), autonomyLevel: "L5" as const, disengagementRate: 0.000011, safetyScore: 99.2, revenuePerDay: 320, customerRating: 4.6, location: { lat: 36.1627, lng: -86.7616 }, operationalMetrics: { avgDailyDistance: 220, energyConsumption: 110, utilizationRate: 0.89, uptime: 0.95, maintenanceCostPerKm: 0.06 }},
  { id: "ZX-GEN2-33", soc: 0.41, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Zoox", model: "Gen2", city: "Nashville", licensePlate: "ZX-33B", batteryCapacity: 133, maxRange: 280, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 15000, engineHours: 800, nextMaintenanceDate: new Date(Date.now() + 30 * 86400000).toISOString(), autonomyLevel: "L5" as const, disengagementRate: 0.000009, safetyScore: 99.4, revenuePerDay: 340, customerRating: 4.7, location: { lat: 36.1527, lng: -86.7916 }, operationalMetrics: { avgDailyDistance: 230, energyConsumption: 115, utilizationRate: 0.91, uptime: 0.96, maintenanceCostPerKm: 0.05 }},
  
  // Cruise Fleet
  { id: "CR-ORG-27", soc: 0.88, status: "idle" as VehicleStatus, currentDepotId: "depot-waymo-nash", vehicleType: "robotaxi", make: "Cruise", model: "Origin", city: "Nashville", licensePlate: "CR-27C", batteryCapacity: 120, maxRange: 320, currentRoute: "Nash-West", lastLocationUpdate: new Date().toISOString(), mileage: 32000, engineHours: 1600, nextMaintenanceDate: new Date(Date.now() + 22 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000065, safetyScore: 98.8, revenuePerDay: 305, customerRating: 4.4, location: { lat: 36.1727, lng: -86.8016 }, operationalMetrics: { avgDailyDistance: 195, energyConsumption: 102, utilizationRate: 0.86, uptime: 0.93, maintenanceCostPerKm: 0.07 }},
  
  // Tesla Fleet
  { id: "TE-MOD3-06", soc: 0.95, status: "idle" as VehicleStatus, currentDepotId: "depot-waymo-nash", vehicleType: "robotaxi", make: "Tesla", model: "Model 3", city: "Nashville", licensePlate: "TE-06D", batteryCapacity: 82, maxRange: 580, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 41000, engineHours: 1950, nextMaintenanceDate: new Date(Date.now() + 12 * 86400000).toISOString(), autonomyLevel: "L3" as const, disengagementRate: 0.000092, safetyScore: 97.9, revenuePerDay: 260, customerRating: 4.2, location: { lat: 36.1427, lng: -86.7816 }, operationalMetrics: { avgDailyDistance: 165, energyConsumption: 88, utilizationRate: 0.81, uptime: 0.89, maintenanceCostPerKm: 0.10 }},
  
  // Nuro Fleet
  { id: "NR-R2-18", soc: 0.61, status: "idle" as VehicleStatus, currentDepotId: "depot-waymo-nash", vehicleType: "delivery", make: "Nuro", model: "R2", city: "Nashville", licensePlate: "NR-18E", batteryCapacity: 45, maxRange: 240, currentRoute: "Nash-Delivery", lastLocationUpdate: new Date().toISOString(), mileage: 22000, engineHours: 1100, nextMaintenanceDate: new Date(Date.now() + 28 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000055, safetyScore: 99.1, revenuePerDay: 180, customerRating: 4.8, location: { lat: 36.1627, lng: -86.7716 }, operationalMetrics: { avgDailyDistance: 140, energyConsumption: 65, utilizationRate: 0.79, uptime: 0.94, maintenanceCostPerKm: 0.06 }},

  // ===== AUSTIN FLEET =====
  // Waymo Fleet
  { id: "WM-PAC-03", soc: 0.76, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Waymo", model: "Jaguar I-PACE", city: "Austin", licensePlate: "WM-03A", batteryCapacity: 90, maxRange: 470, currentRoute: "Austin-Downtown", lastLocationUpdate: new Date().toISOString(), mileage: 48000, engineHours: 2200, nextMaintenanceDate: new Date(Date.now() + 19 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000074, safetyScore: 98.6, revenuePerDay: 285, customerRating: 4.4, location: { lat: 30.2672, lng: -97.7431 }, operationalMetrics: { avgDailyDistance: 185, energyConsumption: 96, utilizationRate: 0.84, uptime: 0.92, maintenanceCostPerKm: 0.08 }},
  { id: "WM-ZKR-08", soc: 0.92, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Waymo", model: "Zeekr", city: "Austin", licensePlate: "WM-08Z", batteryCapacity: 100, maxRange: 580, currentRoute: "Austin-North", lastLocationUpdate: new Date().toISOString(), mileage: 25000, engineHours: 1300, nextMaintenanceDate: new Date(Date.now() + 26 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000068, safetyScore: 99.0, revenuePerDay: 315, customerRating: 4.6, location: { lat: 30.3072, lng: -97.7531 }, operationalMetrics: { avgDailyDistance: 205, energyConsumption: 105, utilizationRate: 0.88, uptime: 0.95, maintenanceCostPerKm: 0.07 }},
  
  // Zoox Fleet  
  { id: "ZX-GEN1-07", soc: 0.82, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Zoox", model: "Gen1", city: "Austin", licensePlate: "ZX-07B", batteryCapacity: 133, maxRange: 280, currentRoute: "Austin-Tech", lastLocationUpdate: new Date().toISOString(), mileage: 31000, engineHours: 1550, nextMaintenanceDate: new Date(Date.now() + 16 * 86400000).toISOString(), autonomyLevel: "L5" as const, disengagementRate: 0.000010, safetyScore: 99.3, revenuePerDay: 330, customerRating: 4.7, location: { lat: 30.2572, lng: -97.7331 }, operationalMetrics: { avgDailyDistance: 225, energyConsumption: 112, utilizationRate: 0.90, uptime: 0.96, maintenanceCostPerKm: 0.06 }},
  { id: "ZX-GEN2-25", soc: 0.69, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Zoox", model: "Gen2", city: "Austin", licensePlate: "ZX-25B", batteryCapacity: 133, maxRange: 280, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 18000, engineHours: 950, nextMaintenanceDate: new Date(Date.now() + 32 * 86400000).toISOString(), autonomyLevel: "L5" as const, disengagementRate: 0.000008, safetyScore: 99.5, revenuePerDay: 350, customerRating: 4.8, location: { lat: 30.2772, lng: -97.7631 }, operationalMetrics: { avgDailyDistance: 235, energyConsumption: 118, utilizationRate: 0.92, uptime: 0.97, maintenanceCostPerKm: 0.05 }},
  
  // Aurora Fleet
  { id: "AU-XC90-31", soc: 0.42, status: "charging" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "rideshare_av", make: "Aurora", model: "Volvo XC90", city: "Austin", licensePlate: "AU-31F", batteryCapacity: 107, maxRange: 380, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 44000, engineHours: 2050, nextMaintenanceDate: new Date(Date.now() + 14 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000088, safetyScore: 98.2, revenuePerDay: 270, customerRating: 4.3, location: { lat: 30.2472, lng: -97.7231 }, operationalMetrics: { avgDailyDistance: 175, energyConsumption: 93, utilizationRate: 0.82, uptime: 0.90, maintenanceCostPerKm: 0.09 }},
  
  // Motional Fleet
  { id: "MO-I5-42", soc: 0.49, status: "maintenance" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Motional", model: "Hyundai IONIQ 5", city: "Austin", licensePlate: "MO-42G", batteryCapacity: 77.4, maxRange: 450, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 36000, engineHours: 1750, nextMaintenanceDate: new Date(Date.now() + 2 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000081, safetyScore: 98.4, revenuePerDay: 280, customerRating: 4.4, location: { lat: 30.2872, lng: -97.7831 }, operationalMetrics: { avgDailyDistance: 180, energyConsumption: 95, utilizationRate: 0.83, uptime: 0.91, maintenanceCostPerKm: 0.08 }},
  
  // Tesla Fleet
  { id: "TE-MOD3-04", soc: 0.71, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Tesla", model: "Model 3", city: "Austin", licensePlate: "TE-04D", batteryCapacity: 82, maxRange: 580, currentRoute: "Austin-South", lastLocationUpdate: new Date().toISOString(), mileage: 39000, engineHours: 1850, nextMaintenanceDate: new Date(Date.now() + 17 * 86400000).toISOString(), autonomyLevel: "L3" as const, disengagementRate: 0.000095, safetyScore: 97.8, revenuePerDay: 265, customerRating: 4.1, location: { lat: 30.2372, lng: -97.7131 }, operationalMetrics: { avgDailyDistance: 170, energyConsumption: 90, utilizationRate: 0.80, uptime: 0.88, maintenanceCostPerKm: 0.10 }},
  { id: "TE-MODY-19", soc: 0.86, status: "idle" as VehicleStatus, currentDepotId: "depot-zoox-austin", vehicleType: "robotaxi", make: "Tesla", model: "Model Y", city: "Austin", licensePlate: "TE-19Y", batteryCapacity: 82, maxRange: 525, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 27000, engineHours: 1350, nextMaintenanceDate: new Date(Date.now() + 24 * 86400000).toISOString(), autonomyLevel: "L3" as const, disengagementRate: 0.000091, safetyScore: 98.0, revenuePerDay: 275, customerRating: 4.2, location: { lat: 30.2972, lng: -97.7931 }, operationalMetrics: { avgDailyDistance: 178, energyConsumption: 94, utilizationRate: 0.82, uptime: 0.89, maintenanceCostPerKm: 0.09 }},

  // ===== LA FLEET =====
  // Waymo Fleet
  { id: "WM-PAC-23", soc: 0.53, status: "charging" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Waymo", model: "Jaguar I-PACE", city: "LA", licensePlate: "WM-23A", batteryCapacity: 90, maxRange: 470, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 55000, engineHours: 2500, nextMaintenanceDate: new Date(Date.now() + 11 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000079, safetyScore: 98.3, revenuePerDay: 290, customerRating: 4.3, location: { lat: 34.0522, lng: -118.2437 }, operationalMetrics: { avgDailyDistance: 188, energyConsumption: 97, utilizationRate: 0.85, uptime: 0.91, maintenanceCostPerKm: 0.08 }},
  { id: "WM-ZKR-30", soc: 0.89, status: "idle" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Waymo", model: "Zeekr", city: "LA", licensePlate: "WM-30Z", batteryCapacity: 100, maxRange: 580, currentRoute: "LA-Hollywood", lastLocationUpdate: new Date().toISOString(), mileage: 29000, engineHours: 1450, nextMaintenanceDate: new Date(Date.now() + 27 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000070, safetyScore: 98.9, revenuePerDay: 310, customerRating: 4.5, location: { lat: 34.0922, lng: -118.3287 }, operationalMetrics: { avgDailyDistance: 202, energyConsumption: 104, utilizationRate: 0.87, uptime: 0.94, maintenanceCostPerKm: 0.07 }},
  
  // Zoox Fleet
  { id: "ZX-GEN1-10", soc: 0.74, status: "idle" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Zoox", model: "Gen1", city: "LA", licensePlate: "ZX-10B", batteryCapacity: 133, maxRange: 280, currentRoute: "LA-Downtown", lastLocationUpdate: new Date().toISOString(), mileage: 33000, engineHours: 1650, nextMaintenanceDate: new Date(Date.now() + 15 * 86400000).toISOString(), autonomyLevel: "L5" as const, disengagementRate: 0.000012, safetyScore: 99.2, revenuePerDay: 325, customerRating: 4.6, location: { lat: 34.0422, lng: -118.2537 }, operationalMetrics: { avgDailyDistance: 218, energyConsumption: 109, utilizationRate: 0.89, uptime: 0.95, maintenanceCostPerKm: 0.06 }},
  { id: "ZX-GEN2-26", soc: 0.46, status: "charging" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Zoox", model: "Gen2", city: "LA", licensePlate: "ZX-26B", batteryCapacity: 133, maxRange: 280, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 19000, engineHours: 1000, nextMaintenanceDate: new Date(Date.now() + 31 * 86400000).toISOString(), autonomyLevel: "L5" as const, disengagementRate: 0.000009, safetyScore: 99.4, revenuePerDay: 345, customerRating: 4.7, location: { lat: 34.0622, lng: -118.2737 }, operationalMetrics: { avgDailyDistance: 232, energyConsumption: 116, utilizationRate: 0.91, uptime: 0.96, maintenanceCostPerKm: 0.05 }},
  
  // Cruise Fleet
  { id: "CR-BLT-08", soc: 0.81, status: "idle" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Cruise", model: "Bolt EV", city: "LA", licensePlate: "CR-08H", batteryCapacity: 66, maxRange: 417, currentRoute: "LA-Santa Monica", lastLocationUpdate: new Date().toISOString(), mileage: 42000, engineHours: 2000, nextMaintenanceDate: new Date(Date.now() + 13 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000085, safetyScore: 98.1, revenuePerDay: 255, customerRating: 4.1, location: { lat: 34.0322, lng: -118.4837 }, operationalMetrics: { avgDailyDistance: 168, energyConsumption: 89, utilizationRate: 0.79, uptime: 0.87, maintenanceCostPerKm: 0.11 }},
  { id: "CR-ORG-15", soc: 0.59, status: "idle" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Cruise", model: "Origin", city: "LA", licensePlate: "CR-15C", batteryCapacity: 120, maxRange: 320, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 35000, engineHours: 1700, nextMaintenanceDate: new Date(Date.now() + 21 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000067, safetyScore: 98.7, revenuePerDay: 300, customerRating: 4.4, location: { lat: 34.0722, lng: -118.2337 }, operationalMetrics: { avgDailyDistance: 192, energyConsumption: 101, utilizationRate: 0.86, uptime: 0.92, maintenanceCostPerKm: 0.07 }},
  
  // Aurora Fleet
  { id: "AU-SNA-11", soc: 0.92, status: "idle" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "rideshare_av", make: "Aurora", model: "Toyota Sienna", city: "LA", licensePlate: "AU-11I", batteryCapacity: 18, maxRange: 600, currentRoute: "LA-Airport", lastLocationUpdate: new Date().toISOString(), mileage: 46000, engineHours: 2150, nextMaintenanceDate: new Date(Date.now() + 10 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000094, safetyScore: 97.6, revenuePerDay: 245, customerRating: 4.0, location: { lat: 33.9422, lng: -118.4081 }, operationalMetrics: { avgDailyDistance: 162, energyConsumption: 86, utilizationRate: 0.77, uptime: 0.86, maintenanceCostPerKm: 0.12 }},
  { id: "AU-XC90-22", soc: 0.38, status: "maintenance" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "rideshare_av", make: "Aurora", model: "Volvo XC90", city: "LA", licensePlate: "AU-22F", batteryCapacity: 107, maxRange: 380, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 48000, engineHours: 2250, nextMaintenanceDate: new Date(Date.now() + 3 * 86400000).toISOString(), autonomyLevel: "L4" as const, disengagementRate: 0.000089, safetyScore: 98.0, revenuePerDay: 268, customerRating: 4.2, location: { lat: 34.0122, lng: -118.4937 }, operationalMetrics: { avgDailyDistance: 173, energyConsumption: 92, utilizationRate: 0.81, uptime: 0.88, maintenanceCostPerKm: 0.10 }},
  
  // Tesla Fleet
  { id: "TE-MOD3-14", soc: 0.65, status: "idle" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Tesla", model: "Model 3", city: "LA", licensePlate: "TE-14D", batteryCapacity: 82, maxRange: 580, currentRoute: "LA-Venice", lastLocationUpdate: new Date().toISOString(), mileage: 41000, engineHours: 1950, nextMaintenanceDate: new Date(Date.now() + 16 * 86400000).toISOString(), autonomyLevel: "L3" as const, disengagementRate: 0.000093, safetyScore: 97.9, revenuePerDay: 262, customerRating: 4.1, location: { lat: 33.9922, lng: -118.4637 }, operationalMetrics: { avgDailyDistance: 169, energyConsumption: 89, utilizationRate: 0.80, uptime: 0.88, maintenanceCostPerKm: 0.10 }},
  { id: "TE-MODY-27", soc: 0.79, status: "charging" as VehicleStatus, currentDepotId: "depot-la-west", vehicleType: "robotaxi", make: "Tesla", model: "Model Y", city: "LA", licensePlate: "TE-27Y", batteryCapacity: 82, maxRange: 525, currentRoute: null, lastLocationUpdate: new Date().toISOString(), mileage: 30000, engineHours: 1500, nextMaintenanceDate: new Date(Date.now() + 23 * 86400000).toISOString(), autonomyLevel: "L3" as const, disengagementRate: 0.000090, safetyScore: 98.1, revenuePerDay: 278, customerRating: 4.3, location: { lat: 34.0822, lng: -118.2137 }, operationalMetrics: { avgDailyDistance: 176, energyConsumption: 93, utilizationRate: 0.82, uptime: 0.89, maintenanceCostPerKm: 0.09 }},
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