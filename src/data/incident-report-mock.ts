// Extended mock data for incident reports - simulating vehicle health, depot, and repair data

export interface VehicleReportData {
  vehicleId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  odometerKm: number;
  lastServiceDate: string;
  batteryHealth: number; // percentage
  sensorStatus: 'operational' | 'degraded' | 'faulty';
  currentSoc: number; // state of charge percentage
}

export interface DepotLocationDataBase {
  depotId: string;
  depotName: string;
  address: string;
  city: string;
  stallNumber: string;
  stallType: 'charging' | 'maintenance' | 'detailing' | 'staging';
}

export interface DepotLocationData extends DepotLocationDataBase {
  arrivalTime: string;
}

export interface RepairAssessment {
  requiresRepair: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  estimatedDowntimeHours: number;
  estimatedCost: number;
  repairItems: RepairItem[];
  partsRequired: PartRequired[];
  technicianNotes: string;
}

export interface RepairItem {
  component: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
}

export interface PartRequired {
  partNumber: string;
  description: string;
  quantity: number;
  availability: 'in-stock' | 'ordered' | 'backordered';
  estimatedArrival?: string;
}

export interface InsuranceInfo {
  policyNumber: string;
  provider: string;
  coverageType: string;
  claimNumber?: string;
  deductible: number;
}

export interface WeatherConditions {
  temperature: number;
  conditions: string;
  visibility: 'good' | 'moderate' | 'poor';
  precipitation: boolean;
}

export interface IncidentReportData {
  vehicle: VehicleReportData;
  depot: DepotLocationData;
  repair: RepairAssessment;
  insurance: InsuranceInfo;
  weather: WeatherConditions;
  responseMetrics: {
    reportToDispatchMinutes: number;
    dispatchToSecuredMinutes: number;
    securedToDepotMinutes: number;
    totalResponseMinutes: number;
  };
  thirdPartyInvolved: boolean;
  thirdPartyDetails?: string;
  policeReportFiled: boolean;
  policeReportNumber?: string;
  witnessCount: number;
  photosCollected: number;
  dashcamFootageAvailable: boolean;
}

// Mock vehicle database
const vehicleDatabase: Record<string, VehicleReportData> = {
  'Waymo': {
    vehicleId: '',
    vin: '1WAYMO2025AV00',
    make: 'Jaguar',
    model: 'I-PACE',
    year: 2024,
    licensePlate: 'AV-WM',
    odometerKm: 45230,
    lastServiceDate: '2024-12-15',
    batteryHealth: 94,
    sensorStatus: 'operational',
    currentSoc: 78,
  },
  'Zoox': {
    vehicleId: '',
    vin: '2ZOOX2024AV00',
    make: 'Zoox',
    model: 'Robotaxi',
    year: 2024,
    licensePlate: 'AV-ZX',
    odometerKm: 32150,
    lastServiceDate: '2024-12-20',
    batteryHealth: 97,
    sensorStatus: 'operational',
    currentSoc: 85,
  },
  'Cruise': {
    vehicleId: '',
    vin: '3CRUI2024AV00',
    make: 'Chevrolet',
    model: 'Bolt EUV',
    year: 2024,
    licensePlate: 'AV-CR',
    odometerKm: 58420,
    lastServiceDate: '2024-12-10',
    batteryHealth: 91,
    sensorStatus: 'operational',
    currentSoc: 62,
  },
  'Aurora': {
    vehicleId: '',
    vin: '4AURO2024AV00',
    make: 'Toyota',
    model: 'Sienna Autono-MaaS',
    year: 2024,
    licensePlate: 'AV-AU',
    odometerKm: 72350,
    lastServiceDate: '2024-12-08',
    batteryHealth: 88,
    sensorStatus: 'operational',
    currentSoc: 71,
  },
  'Motional': {
    vehicleId: '',
    vin: '5MOTI2024AV00',
    make: 'Hyundai',
    model: 'IONIQ 5',
    year: 2024,
    licensePlate: 'AV-MT',
    odometerKm: 41280,
    lastServiceDate: '2024-12-18',
    batteryHealth: 95,
    sensorStatus: 'operational',
    currentSoc: 83,
  },
  'Tensor': {
    vehicleId: '',
    vin: '6TENS2024AV00',
    make: 'Tesla',
    model: 'Model Y',
    year: 2024,
    licensePlate: 'AV-TS',
    odometerKm: 38920,
    lastServiceDate: '2024-12-22',
    batteryHealth: 96,
    sensorStatus: 'operational',
    currentSoc: 90,
  },
  'Nuro': {
    vehicleId: '',
    vin: '7NURO2024AV00',
    make: 'Nuro',
    model: 'R3',
    year: 2024,
    licensePlate: 'AV-NR',
    odometerKm: 28750,
    lastServiceDate: '2024-12-25',
    batteryHealth: 98,
    sensorStatus: 'operational',
    currentSoc: 75,
  },
};

// Mock depot database (without arrivalTime - that's added dynamically)
const depotDatabase: Record<string, DepotLocationDataBase[]> = {
  Nashville: [
    { depotId: 'NAS-01', depotName: 'Nashville Central Depot', address: '2100 Charlotte Ave', city: 'Nashville, TN 37203', stallNumber: 'A-12', stallType: 'maintenance' },
    { depotId: 'NAS-02', depotName: 'Nashville East Hub', address: '1500 Gallatin Pike', city: 'Nashville, TN 37206', stallNumber: 'B-08', stallType: 'charging' },
  ],
  Austin: [
    { depotId: 'AUS-01', depotName: 'Austin Downtown Depot', address: '800 Congress Ave', city: 'Austin, TX 78701', stallNumber: 'C-15', stallType: 'maintenance' },
    { depotId: 'AUS-02', depotName: 'Austin Tech Campus Hub', address: '4500 N Lamar Blvd', city: 'Austin, TX 78756', stallNumber: 'D-03', stallType: 'staging' },
  ],
  LA: [
    { depotId: 'LAX-01', depotName: 'Los Angeles Central Depot', address: '1200 S Figueroa St', city: 'Los Angeles, CA 90015', stallNumber: 'E-22', stallType: 'maintenance' },
    { depotId: 'LAX-02', depotName: 'LA West Fleet Center', address: '3400 W Olympic Blvd', city: 'Los Angeles, CA 90019', stallNumber: 'F-11', stallType: 'charging' },
  ],
  'San Francisco': [
    { depotId: 'SFO-01', depotName: 'SF Mission Bay Depot', address: '500 Terry A Francois Blvd', city: 'San Francisco, CA 94158', stallNumber: 'G-07', stallType: 'maintenance' },
  ],
};

// Repair templates based on incident type
const repairTemplates: Record<string, Partial<RepairAssessment>> = {
  collision: {
    severity: 'moderate',
    estimatedDowntimeHours: 48,
    estimatedCost: 4500,
    repairItems: [
      { component: 'Front Bumper Assembly', issue: 'Impact damage requiring replacement', priority: 'high', estimatedHours: 3 },
      { component: 'Sensor Array', issue: 'Calibration check required', priority: 'high', estimatedHours: 2 },
      { component: 'Body Panel', issue: 'Dent repair and paint', priority: 'medium', estimatedHours: 4 },
    ],
    partsRequired: [
      { partNumber: 'BMP-2024-001', description: 'Front Bumper Cover', quantity: 1, availability: 'in-stock' },
      { partNumber: 'SNS-CAL-KIT', description: 'Sensor Calibration Kit', quantity: 1, availability: 'in-stock' },
    ],
  },
  malfunction: {
    severity: 'minor',
    estimatedDowntimeHours: 8,
    estimatedCost: 850,
    repairItems: [
      { component: 'AV Sensor Module', issue: 'Diagnostic and firmware update', priority: 'high', estimatedHours: 2 },
      { component: 'Control Unit', issue: 'Software recalibration', priority: 'medium', estimatedHours: 1 },
    ],
    partsRequired: [
      { partNumber: 'FW-UPDATE-V3', description: 'Firmware Update Package', quantity: 1, availability: 'in-stock' },
    ],
  },
  interior: {
    severity: 'minor',
    estimatedDowntimeHours: 4,
    estimatedCost: 350,
    repairItems: [
      { component: 'Interior Cabin', issue: 'Deep cleaning and sanitization', priority: 'medium', estimatedHours: 2 },
      { component: 'Upholstery', issue: 'Stain treatment or replacement', priority: 'low', estimatedHours: 1 },
    ],
    partsRequired: [],
  },
  vandalism: {
    severity: 'moderate',
    estimatedDowntimeHours: 24,
    estimatedCost: 2200,
    repairItems: [
      { component: 'Exterior Panels', issue: 'Graffiti removal and repaint', priority: 'medium', estimatedHours: 6 },
      { component: 'Security Sensors', issue: 'Inspection and testing', priority: 'high', estimatedHours: 1 },
    ],
    partsRequired: [
      { partNumber: 'PNT-MATCH-01', description: 'OEM Paint Match Kit', quantity: 1, availability: 'in-stock' },
    ],
  },
};

// Weather conditions by city (mock current conditions)
const weatherByCity: Record<string, WeatherConditions> = {
  Nashville: { temperature: 48, conditions: 'Partly Cloudy', visibility: 'good', precipitation: false },
  Austin: { temperature: 62, conditions: 'Clear', visibility: 'good', precipitation: false },
  LA: { temperature: 68, conditions: 'Sunny', visibility: 'good', precipitation: false },
  'San Francisco': { temperature: 55, conditions: 'Foggy', visibility: 'moderate', precipitation: false },
};

// Insurance providers pool
const insuranceProviders = [
  { provider: 'Liberty Mutual Commercial', policyNumber: 'LMC-AV-2024-', coverageType: 'Commercial Fleet - Autonomous Vehicle' },
  { provider: 'Zurich North America', policyNumber: 'ZNA-FLEET-', coverageType: 'Commercial Auto - Self-Driving Technology' },
  { provider: 'Travelers AV Division', policyNumber: 'TAV-2024-', coverageType: 'Autonomous Fleet Coverage' },
];

export function generateIncidentReportData(
  vehicleId: string,
  city: string,
  incidentType: string,
  timestamps: {
    reportedAt: string;
    dispatchedAt: string | null;
    securedAt: string | null;
    atDepotAt: string | null;
    closedAt: string | null;
  }
): IncidentReportData {
  // Extract vehicle make from vehicleId (e.g., "Waymo 3KP9L" -> "Waymo")
  const vehicleMake = vehicleId.split(' ')[0];
  const vehicleCode = vehicleId.split(' ')[1] || 'XXX';
  
  // Get base vehicle data
  const baseVehicle = vehicleDatabase[vehicleMake] || vehicleDatabase['Waymo'];
  const vehicle: VehicleReportData = {
    ...baseVehicle,
    vehicleId,
    vin: baseVehicle.vin + vehicleCode,
    licensePlate: baseVehicle.licensePlate + '-' + vehicleCode,
    odometerKm: baseVehicle.odometerKm + Math.floor(Math.random() * 5000),
    currentSoc: Math.floor(Math.random() * 40) + 50, // 50-90%
  };
  
  // Get depot data
  const cityDepots = depotDatabase[city] || depotDatabase['Nashville'];
  const selectedDepot = cityDepots[Math.floor(Math.random() * cityDepots.length)];
  const depot: DepotLocationData = {
    ...selectedDepot,
    stallNumber: selectedDepot.stallType === 'maintenance' ? `M-${Math.floor(Math.random() * 20) + 1}` : `S-${Math.floor(Math.random() * 40) + 1}`,
    arrivalTime: timestamps.atDepotAt || new Date().toISOString(),
  };
  
  // Get repair assessment
  const repairTemplate = repairTemplates[incidentType] || repairTemplates['malfunction'];
  const repair: RepairAssessment = {
    requiresRepair: incidentType !== 'interior' || Math.random() > 0.5,
    severity: repairTemplate.severity || 'minor',
    estimatedDowntimeHours: repairTemplate.estimatedDowntimeHours || 4,
    estimatedCost: repairTemplate.estimatedCost || 500,
    repairItems: repairTemplate.repairItems || [],
    partsRequired: repairTemplate.partsRequired || [],
    technicianNotes: generateTechnicianNotes(incidentType, vehicleMake),
  };
  
  // If incident is minor, reduce severity randomly
  if (Math.random() > 0.7 && repair.severity === 'moderate') {
    repair.severity = 'minor';
    repair.estimatedDowntimeHours = Math.floor(repair.estimatedDowntimeHours / 2);
    repair.estimatedCost = Math.floor(repair.estimatedCost * 0.6);
  }
  
  // Insurance info
  const insuranceTemplate = insuranceProviders[Math.floor(Math.random() * insuranceProviders.length)];
  const insurance: InsuranceInfo = {
    policyNumber: insuranceTemplate.policyNumber + Math.floor(Math.random() * 90000 + 10000),
    provider: insuranceTemplate.provider,
    coverageType: insuranceTemplate.coverageType,
    claimNumber: incidentType === 'collision' ? `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}` : undefined,
    deductible: incidentType === 'collision' ? 2500 : 1000,
  };
  
  // Weather
  const weather = weatherByCity[city] || weatherByCity['Nashville'];
  
  // Response metrics
  const reportedAt = new Date(timestamps.reportedAt);
  const dispatchedAt = timestamps.dispatchedAt ? new Date(timestamps.dispatchedAt) : reportedAt;
  const securedAt = timestamps.securedAt ? new Date(timestamps.securedAt) : dispatchedAt;
  const atDepotAt = timestamps.atDepotAt ? new Date(timestamps.atDepotAt) : securedAt;
  
  const responseMetrics = {
    reportToDispatchMinutes: Math.round((dispatchedAt.getTime() - reportedAt.getTime()) / 60000),
    dispatchToSecuredMinutes: Math.round((securedAt.getTime() - dispatchedAt.getTime()) / 60000),
    securedToDepotMinutes: Math.round((atDepotAt.getTime() - securedAt.getTime()) / 60000),
    totalResponseMinutes: Math.round((atDepotAt.getTime() - reportedAt.getTime()) / 60000),
  };
  
  return {
    vehicle,
    depot,
    repair,
    insurance,
    weather,
    responseMetrics,
    thirdPartyInvolved: incidentType === 'collision' && Math.random() > 0.6,
    thirdPartyDetails: incidentType === 'collision' ? 'No third party injuries reported. Minor property damage to other vehicle.' : undefined,
    policeReportFiled: incidentType === 'collision' || incidentType === 'vandalism',
    policeReportNumber: (incidentType === 'collision' || incidentType === 'vandalism') ? `PR-${city.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900000 + 100000)}` : undefined,
    witnessCount: Math.floor(Math.random() * 4),
    photosCollected: Math.floor(Math.random() * 12) + 4,
    dashcamFootageAvailable: Math.random() > 0.2,
  };
}

function generateTechnicianNotes(incidentType: string, vehicleMake: string): string {
  const notes: Record<string, string[]> = {
    collision: [
      `Initial assessment complete. ${vehicleMake} vehicle sustained impact damage to front quarter. All safety systems performed as expected. Recommending full sensor recalibration post-repair.`,
      `Damage consistent with low-speed collision. AV safety protocols engaged correctly. Vehicle automatically disabled upon impact detection. Structural integrity verified.`,
      `Front-end damage assessed. No frame damage detected. Autonomous driving systems require recertification before return to service.`,
    ],
    malfunction: [
      `Diagnostic complete. Software anomaly detected in perception module. Firmware rollback and update resolved issue. 48-hour monitoring period recommended.`,
      `Sensor fusion unit showing intermittent faults. Component replacement completed. Full system calibration performed successfully.`,
      `LIDAR unit flagged by self-diagnostic. Cleaned optical surfaces and recalibrated. All systems now reading nominal.`,
    ],
    interior: [
      `Interior deep clean completed. Biohazard protocol followed. All surfaces sanitized. Air quality sensors reset. Vehicle ready for service.`,
      `Upholstery stain treated and cleaned. No permanent damage. Cabin air filter replaced as precaution.`,
      `Interior inspection complete. Minor wear noted on seat fabric. Recommend scheduling routine interior maintenance within 30 days.`,
    ],
    vandalism: [
      `Exterior damage documented and photographed. Graffiti removal successful using approved solvents. Paint touch-up completed.`,
      `Security assessment complete. No sensor tampering detected. Exterior damage repaired. Recommend enhanced monitoring for return routes.`,
      `Vandalism repairs completed. All security cameras and sensors verified operational. No evidence of attempted intrusion into vehicle systems.`,
    ],
  };
  
  const typeNotes = notes[incidentType] || notes['malfunction'];
  return typeNotes[Math.floor(Math.random() * typeNotes.length)];
}
