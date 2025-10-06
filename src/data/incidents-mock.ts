// Incidents Mock Data for OTTOYARD - Autonomous Fleet Management

export type IncidentType = "collision" | "malfunction" | "interior" | "vandalism";
export type IncidentStatus = "Reported" | "Dispatched" | "Secured" | "At Depot" | "Closed";

export interface TowInfo {
  assigned: boolean;
  provider: string;
  truckId: string | null;
  driver: string | null;
  pickupEtaSeconds: number | null;
  returnEtaSeconds: number | null;
}

export interface TimelineEntry {
  status: IncidentStatus;
  ts: string;
  note: string;
}

export interface Incident {
  incidentId: string;
  vehicleId: string;
  city: string;
  type: IncidentType;
  summary: string;
  status: IncidentStatus;
  timestamps: {
    reportedAt: string;
    dispatchedAt: string | null;
    securedAt: string | null;
    atDepotAt: string | null;
    closedAt: string | null;
  };
  etaSeconds: number | null;
  tow: TowInfo;
  location: {
    lat: number;
    lon: number;
    addr: string;
  };
  report: {
    shortSummary: string;
    comments: string;
    attachments: string[];
  };
  timeline: TimelineEntry[];
}

// Mock tow trucks and drivers
const towTrucks = [
  { id: "TR-101", driver: "Mike Johnson" },
  { id: "TR-102", driver: "Sarah Chen" },
  { id: "TR-103", driver: "David Martinez" },
  { id: "TR-104", driver: "Lisa Anderson" },
  { id: "TR-105", driver: "James Wilson" },
  { id: "TR-106", driver: "Emma Brown" },
  { id: "TR-107", driver: "Chris Taylor" },
  { id: "TR-108", driver: "Ashley Davis" },
  { id: "TR-109", driver: "Michael Lee" },
  { id: "TR-110", driver: "Jennifer White" },
];

// City locations
const cityLocations = {
  Nashville: { lat: 36.1627, lon: -86.7816, addresses: ["123 Broadway", "456 Music Row", "789 Gulch Ave", "321 Honky Tonk Ln"] },
  Austin: { lat: 30.2672, lon: -97.7431, addresses: ["111 Congress Ave", "222 6th Street", "333 Rainey St", "444 South Lamar"] },
  LA: { lat: 34.0522, lon: -118.2437, addresses: ["555 Sunset Blvd", "666 Hollywood Blvd", "777 Venice Blvd", "888 Wilshire Blvd"] },
  "San Francisco": { lat: 37.7749, lon: -122.4194, addresses: ["101 Market St", "202 Mission St", "303 Castro St", "404 Haight St"] },
};

const incidentTypes: IncidentType[] = ["collision", "malfunction", "interior", "vandalism"];

const incidentDescriptions = {
  collision: ["Front bumper scuff, drivability uncertain", "Side mirror damage from parking incident", "Rear-end minor impact, airbags not deployed", "Fender bender at intersection"],
  malfunction: ["AV sensor array malfunction detected", "Battery thermal management alert", "Steering actuator diagnostic warning", "LIDAR calibration error reported"],
  interior: ["Interior cleaning required after passenger incident", "Upholstery damage reported", "Spill detected in rear cabin", "Seat adjustment mechanism failure"],
  vandalism: ["Graffiti on side panels", "Window etching detected", "Tire deflation suspected tampering", "Paint scratch intentional damage"],
};

let incidentCounter = 1000;

export function generateIncidentId(): string {
  return `INC-2025-${String(incidentCounter++).padStart(6, '0')}`;
}

export function getRandomTruck() {
  return towTrucks[Math.floor(Math.random() * towTrucks.length)];
}

export function createIncident(
  vehicleId: string,
  city: string,
  type: IncidentType,
  status: IncidentStatus,
  customSummary?: string
): Incident {
  const now = new Date();
  const cityData = cityLocations[city as keyof typeof cityLocations];
  const addr = cityData.addresses[Math.floor(Math.random() * cityData.addresses.length)];
  
  // Random offset for location
  const lat = cityData.lat + (Math.random() - 0.5) * 0.05;
  const lon = cityData.lon + (Math.random() - 0.5) * 0.05;
  
  const descriptions = incidentDescriptions[type];
  const summary = customSummary || descriptions[Math.floor(Math.random() * descriptions.length)];
  
  const timestamps = {
    reportedAt: now.toISOString(),
    dispatchedAt: null as string | null,
    securedAt: null as string | null,
    atDepotAt: null as string | null,
    closedAt: null as string | null,
  };
  
  const timeline: TimelineEntry[] = [
    { status: "Reported", ts: now.toISOString(), note: "System detected incident." }
  ];
  
  let etaSeconds: number | null = null;
  const tow: TowInfo = {
    assigned: false,
    provider: "OTTOW",
    truckId: null,
    driver: null,
    pickupEtaSeconds: null,
    returnEtaSeconds: null,
  };
  
  // Set up based on status
  if (status === "Reported") {
    etaSeconds = 60 + Math.floor(Math.random() * 120); // 1-3 min
  } else if (status === "Dispatched") {
    const truck = getRandomTruck();
    const pickupEta = 240 + Math.floor(Math.random() * 240); // 4-8 min
    timestamps.dispatchedAt = new Date(now.getTime() - 60000).toISOString();
    tow.assigned = true;
    tow.truckId = truck.id;
    tow.driver = truck.driver;
    tow.pickupEtaSeconds = pickupEta;
    etaSeconds = pickupEta;
    timeline.unshift({
      status: "Dispatched",
      ts: timestamps.dispatchedAt,
      note: `OTTOW ${truck.id} en route with driver ${truck.driver}`,
    });
  } else if (status === "Secured") {
    const truck = getRandomTruck();
    const returnEta = 300 + Math.floor(Math.random() * 300); // 5-10 min
    timestamps.dispatchedAt = new Date(now.getTime() - 300000).toISOString();
    timestamps.securedAt = new Date(now.getTime() - 120000).toISOString();
    tow.assigned = true;
    tow.truckId = truck.id;
    tow.driver = truck.driver;
    tow.returnEtaSeconds = returnEta;
    etaSeconds = returnEta;
    timeline.unshift({
      status: "Secured",
      ts: timestamps.securedAt,
      note: `Vehicle secured on truck ${truck.id}`,
    });
    timeline.unshift({
      status: "Dispatched",
      ts: timestamps.dispatchedAt,
      note: `OTTOW ${truck.id} en route with driver ${truck.driver}`,
    });
  } else if (status === "At Depot") {
    const truck = getRandomTruck();
    timestamps.dispatchedAt = new Date(now.getTime() - 600000).toISOString();
    timestamps.securedAt = new Date(now.getTime() - 300000).toISOString();
    timestamps.atDepotAt = new Date(now.getTime() - 60000).toISOString();
    tow.assigned = true;
    tow.truckId = truck.id;
    tow.driver = truck.driver;
    etaSeconds = null;
    timeline.unshift({
      status: "At Depot",
      ts: timestamps.atDepotAt,
      note: "Arrived at depot intake",
    });
    timeline.unshift({
      status: "Secured",
      ts: timestamps.securedAt,
      note: `Vehicle secured on truck ${truck.id}`,
    });
    timeline.unshift({
      status: "Dispatched",
      ts: timestamps.dispatchedAt,
      note: `OTTOW ${truck.id} en route with driver ${truck.driver}`,
    });
  } else if (status === "Closed") {
    const truck = getRandomTruck();
    timestamps.dispatchedAt = new Date(now.getTime() - 900000).toISOString();
    timestamps.securedAt = new Date(now.getTime() - 600000).toISOString();
    timestamps.atDepotAt = new Date(now.getTime() - 300000).toISOString();
    timestamps.closedAt = new Date(now.getTime() - 60000).toISOString();
    tow.assigned = true;
    tow.truckId = truck.id;
    tow.driver = truck.driver;
    etaSeconds = null;
    timeline.unshift({
      status: "Closed",
      ts: timestamps.closedAt,
      note: "Incident resolved and closed",
    });
    timeline.unshift({
      status: "At Depot",
      ts: timestamps.atDepotAt,
      note: "Arrived at depot intake",
    });
    timeline.unshift({
      status: "Secured",
      ts: timestamps.securedAt,
      note: `Vehicle secured on truck ${truck.id}`,
    });
    timeline.unshift({
      status: "Dispatched",
      ts: timestamps.dispatchedAt,
      note: `OTTOW ${truck.id} en route with driver ${truck.driver}`,
    });
  }
  
  return {
    incidentId: generateIncidentId(),
    vehicleId,
    city,
    type,
    summary,
    status,
    timestamps,
    etaSeconds,
    tow,
    location: { lat, lon, addr: `${addr}, ${city}` },
    report: {
      shortSummary: summary,
      comments: "",
      attachments: [],
    },
    timeline,
  };
}

// Seed initial incidents using fleet vehicle naming convention
export function seedIncidents(): Incident[] {
  const incidents: Incident[] = [];
  
  // 2 × Reported
  incidents.push(createIncident("Waymo 3KP9L", "Nashville", "interior", "Reported"));
  incidents.push(createIncident("Zoox 4MN2Q", "Nashville", "malfunction", "Reported"));
  
  // 3 × Dispatched
  incidents.push(createIncident("Cruise 8RP5T", "Nashville", "collision", "Dispatched"));
  incidents.push(createIncident("Aurora 2VX7K", "Austin", "vandalism", "Dispatched"));
  incidents.push(createIncident("Motional 9WJ4B", "Austin", "malfunction", "Dispatched"));
  
  // 2 × Secured
  incidents.push(createIncident("Waymo 6TL8D", "LA", "collision", "Secured"));
  incidents.push(createIncident("Zoox 1HF9M", "Nashville", "malfunction", "Secured"));
  
  // 1 × At Depot
  incidents.push(createIncident("Tensor 5CG3N", "Nashville", "interior", "At Depot"));
  
  // 1 × Closed
  incidents.push(createIncident("Nuro 7YZ2P", "Nashville", "collision", "Closed", "Minor scratch - resolved"));
  
  return incidents;
}
