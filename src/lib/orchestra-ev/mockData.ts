// OrchestraEV — Mock Data for Prototype
import type {
  Subscriber,
  SubscriberVehicle,
  ServiceRecord,
  MaintenancePrediction,
  TowRequest,
  AmenityReservation,
  DepotServiceStages,
  EVNotification,
  EVEvent,
  AmenityAvailability,
} from "./types";

export const mockSubscriber: Subscriber = {
  id: "sub-001",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@email.com",
  phone: "(615) 555-0198",
  membershipTier: "premium",
  subscriptionStatus: "active",
  memberSince: "2025-08-15T00:00:00Z",
  homeAddress: {
    street: "412 Broadway",
    city: "Nashville",
    state: "TN",
    zip: "37203",
    lat: 36.158,
    lng: -86.7764,
  },
  preferredDepotId: "depot-nash-01",
};

export const mockVehicle: SubscriberVehicle = {
  id: "veh-priv-001",
  subscriberId: "sub-001",
  make: "Tesla",
  model: "Model 3 Long Range",
  year: 2024,
  color: "Midnight Silver Metallic",
  vin: "5YJ3E1EA•••••7842",
  licensePlate: "TN-EV-2024",
  batteryCapacityKwh: 82,
  currentSoc: 0.78,
  currentStatus: "charging",
  currentLocation: { lat: 36.1627, lng: -86.7816 },
  currentDepotId: "depot-nash-01",
  currentStallId: "C-12",
  healthScore: 94,
  odometerMiles: 14200,
  chargingPreferencePct: 80,
  estimatedRangeMiles: 245,
  tirePressure: { fl: 42, fr: 42, rl: 40, rr: 40, unit: "psi" },
  brakeWearPct: { front: 72, rear: 81 },
  batteryHealthPct: 96,
  lastDiagnosticDate: "2026-02-01T00:00:00Z",
};

export const mockServiceRecords: ServiceRecord[] = [
  {
    id: "svc-001",
    type: "detailing",
    status: "completed",
    depotName: "OTTO Nashville #1",
    scheduledAt: "2026-01-20T10:00:00Z",
    startedAt: "2026-01-20T10:15:00Z",
    completedAt: "2026-01-20T12:30:00Z",
    cost: 89.99,
    notes: "Full interior and exterior detail. Ceramic coating applied.",
    technicianName: "Sarah Chen",
  },
  {
    id: "svc-002",
    type: "tire_rotation",
    status: "completed",
    depotName: "OTTO Nashville #1",
    scheduledAt: "2025-12-15T14:00:00Z",
    startedAt: "2025-12-15T14:10:00Z",
    completedAt: "2025-12-15T15:15:00Z",
    cost: 49.99,
    notes: "All four tires rotated. Tread depth: 7/32 all corners.",
    technicianName: "Marcus Johnson",
  },
  {
    id: "svc-003",
    type: "charging",
    status: "in_progress",
    depotName: "OTTO Nashville #1",
    stallId: "C-12",
    scheduledAt: "2026-02-18T14:00:00Z",
    startedAt: "2026-02-18T14:15:00Z",
    completedAt: null,
    cost: 0,
    notes: "DC Fast Charge, 150kW. Target: 80%.",
    technicianName: null,
  },
];

export const mockMaintenancePredictions: MaintenancePrediction[] = [
  {
    id: "pred-001",
    serviceType: "tire_rotation",
    label: "Tire Rotation",
    predictedDueDate: "2026-03-05",
    confidence: "high",
    urgency: "soon",
    reasoning:
      "Based on 14,200 miles driven. Recommended every 7,500 miles. Last rotation at 12,700 mi.",
    mileageTrigger: 15000,
  },
  {
    id: "pred-002",
    serviceType: "cabin_air_filter",
    label: "Cabin Air Filter Replacement",
    predictedDueDate: "2026-04-01",
    confidence: "medium",
    urgency: "routine",
    reasoning:
      "Recommended every 15,000 miles or 12 months. Current: 14,200 miles, 14 months of ownership.",
    mileageTrigger: 15000,
  },
  {
    id: "pred-003",
    serviceType: "brake_inspection",
    label: "Brake Inspection",
    predictedDueDate: "2026-06-15",
    confidence: "medium",
    urgency: "routine",
    reasoning:
      "Front brake pads at 72% remaining. Inspection recommended when pads reach 50%.",
    mileageTrigger: 20000,
  },
];

export const mockTowRequests: TowRequest[] = [
  {
    id: "tow-001",
    status: "completed",
    pickupLocation: {
      lat: 36.158,
      lng: -86.7764,
      address: "412 Broadway, Nashville, TN",
    },
    destinationDepot: "OTTO Nashville #1",
    issueType: "flat_tire",
    issueDescription: "Right rear tire flat, unable to drive",
    driverName: "Mike Thompson",
    driverVehicle: "Ford F-250 Flatbed",
    driverPhone: "(615) 555-0142",
    requestedAt: "2026-01-15T16:30:00Z",
    completedAt: "2026-01-15T17:45:00Z",
  },
];

export const mockAmenityReservations: AmenityReservation[] = [
  {
    id: "res-001",
    type: "sim_golf",
    depotName: "OTTO Nashville #1",
    date: "2026-03-03",
    startTime: "16:00",
    endTime: "17:00",
    durationMinutes: 60,
    status: "confirmed",
    bayNumber: "Bay 2",
  },
];

export const mockDepotServiceStages: DepotServiceStages = {
  vehicleId: "veh-priv-001",
  depotName: "OTTO Nashville #1",
  depotAddress: "1234 Innovation Dr, Nashville, TN 37203",
  depotHours: "6:00 AM — 10:00 PM",
  depotStatus: "open",
  stages: [
    { name: "Entered Depot", status: "completed", timestamp: "2026-02-18T14:00:00Z" },
    { name: "Checked In", status: "completed", timestamp: "2026-02-18T14:02:00Z" },
    { name: "In Queue", status: "completed", timestamp: "2026-02-18T14:02:00Z" },
    { name: "Service Started", status: "completed", timestamp: "2026-02-18T14:15:00Z" },
    {
      name: "Charging",
      status: "in_progress",
      timestamp: "2026-02-18T14:15:00Z",
      estimatedCompletion: "2026-02-18T15:00:00Z",
    },
    { name: "Quality Check", status: "upcoming", timestamp: null },
    { name: "Ready for Pickup", status: "upcoming", timestamp: null },
    { name: "Departed", status: "upcoming", timestamp: null },
  ],
  currentStall: {
    id: "C-12",
    type: "charging",
    subType: "Level 3 DC Fast Charge",
    power: "150 kW",
    currentRate: "48 kW (tapering)",
    energyConsumed: 12.4,
  },
};

export const mockNotifications: EVNotification[] = [
  { id: "n-001", message: "Your vehicle reached 78% charge", time: "15 min ago", type: "charge", read: false },
  { id: "n-002", message: "Tire rotation recommended within 2 weeks", time: "2 hours ago", type: "maintenance", read: false },
  { id: "n-003", message: "Sim golf reservation confirmed: Mar 3, 4:00 PM", time: "Yesterday", type: "amenity", read: true },
  { id: "n-004", message: "Interior detailing completed successfully", time: "Jan 20", type: "service", read: true },
];

export const mockEvents: EVEvent[] = [
  {
    id: "evt-001",
    title: "EV Owner Meetup",
    date: "2026-03-08",
    time: "5:00 PM",
    location: "OTTO Nashville #1",
    description: "Monthly EV community meetup. Refreshments provided.",
    rsvpd: false,
  },
  {
    id: "evt-002",
    title: "Battery Health Workshop",
    date: "2026-03-22",
    time: "10:00 AM",
    location: "OTTO Nashville #1",
    description: "Learn best practices for EV battery longevity.",
    rsvpd: true,
  },
];

export const mockAmenityAvailability: AmenityAvailability = {
  simGolf: [
    { bayNumber: "Bay 1", slots: ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"] },
    { bayNumber: "Bay 2", slots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"] },
    { bayNumber: "Bay 3", slots: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"] },
  ],
  coworkTables: [
    { tableId: "T-1", type: "Standard Desk", amenities: ["Wi-Fi", "Power Outlet", "Monitor"], slots: ["All Day"] },
    { tableId: "T-2", type: "Standing Desk", amenities: ["Wi-Fi", "Power Outlet"], slots: ["All Day"] },
    { tableId: "T-3", type: "Standard Desk", amenities: ["Wi-Fi", "Power Outlet", "Monitor"], slots: ["All Day"] },
  ],
  privacyPods: [
    { podId: "P-1", capacity: 1, equipment: ["Screen", "Webcam", "Whiteboard"], slots: ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"] },
    { podId: "P-2", capacity: 2, equipment: ["Screen", "Webcam"], slots: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"] },
    { podId: "P-3", capacity: 4, equipment: ["Large Screen", "Video Conferencing", "Whiteboard"], slots: ["9:00 AM", "1:00 PM", "3:00 PM"] },
  ],
};
