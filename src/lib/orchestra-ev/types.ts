// OrchestraEV — TypeScript Interfaces

export type MembershipTier = "basic" | "premium" | "enterprise";
export type SubscriptionStatus = "active" | "paused" | "trial" | "cancelled";
export type VehicleStatus = "at_home" | "en_route_depot" | "at_depot" | "in_service" | "charging" | "ready";
export type ServiceType = "charging" | "detailing" | "interior_clean" | "exterior_wash" | "tire_rotation" | "brake_inspection" | "battery_diagnostic" | "oil_change" | "full_maintenance" | "cabin_air_filter";
export type ServiceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type TowStatus = "requested" | "driver_assigned" | "en_route" | "arrived" | "loaded" | "delivering" | "completed" | "cancelled";
export type TowIssueType = "flat_tire" | "dead_battery" | "accident" | "mechanical" | "other";
export type AmenityType = "sim_golf" | "cowork_table" | "privacy_pod" | "meeting_room";
export type ReservationStatus = "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show";
export type StageStatus = "completed" | "in_progress" | "upcoming";
export type Urgency = "routine" | "soon" | "urgent";
export type Confidence = "high" | "medium" | "low";

export interface Subscriber {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipTier: MembershipTier;
  subscriptionStatus: SubscriptionStatus;
  memberSince: string;
  homeAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    lat: number;
    lng: number;
  };
  preferredDepotId: string;
}

export interface SubscriberVehicle {
  id: string;
  subscriberId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  licensePlate: string;
  batteryCapacityKwh: number;
  currentSoc: number;
  currentStatus: VehicleStatus;
  currentLocation: { lat: number; lng: number };
  currentDepotId: string | null;
  currentStallId: string | null;
  healthScore: number;
  odometerMiles: number;
  chargingPreferencePct: number;
  estimatedRangeMiles: number;
  tirePressure: { fl: number; fr: number; rl: number; rr: number; unit: "psi" | "bar" };
  brakeWearPct: { front: number; rear: number };
  batteryHealthPct: number;
  lastDiagnosticDate: string;
}

export interface ServiceRecord {
  id: string;
  type: ServiceType;
  status: ServiceStatus;
  depotName: string;
  stallId?: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt: string | null;
  cost: number;
  notes: string;
  technicianName: string | null;
}

export interface MaintenancePrediction {
  id: string;
  serviceType: ServiceType;
  label: string;
  predictedDueDate: string;
  confidence: Confidence;
  urgency: Urgency;
  reasoning: string;
  mileageTrigger: number;
}

export interface TowRequest {
  id: string;
  status: TowStatus;
  pickupLocation: { lat: number; lng: number; address: string };
  destinationDepot: string;
  issueType: TowIssueType;
  issueDescription: string;
  driverName: string;
  driverVehicle: string;
  driverPhone: string;
  driverLocation?: { lat: number; lng: number };
  etaMinutes?: number;
  requestedAt: string;
  completedAt: string | null;
}

export interface AmenityReservation {
  id: string;
  type: AmenityType;
  depotName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ReservationStatus;
  bayNumber?: string;
}

export interface ServiceStage {
  name: string;
  status: StageStatus;
  timestamp: string | null;
  estimatedCompletion?: string;
}

export interface DepotServiceStages {
  vehicleId: string;
  depotName: string;
  depotAddress: string;
  depotHours: string;
  depotStatus: "open" | "closed";
  stages: ServiceStage[];
  currentStall: {
    id: string;
    type: string;
    subType: string;
    power: string;
    currentRate: string;
    energyConsumed: number;
  };
}

export interface EVNotification {
  id: string;
  message: string;
  time: string;
  type: "charge" | "maintenance" | "amenity" | "service" | "system";
  read: boolean;
}

export interface EVEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  rsvpd: boolean;
}

export interface SimGolfBay {
  bayNumber: string;
  slots: string[];
}

export interface CoworkTable {
  tableId: string;
  type: string;
  amenities: string[];
  slots: string[];
}

export interface PrivacyPod {
  podId: string;
  capacity: number;
  equipment: string[];
  slots: string[];
}

export interface AmenityAvailability {
  simGolf: SimGolfBay[];
  coworkTables: CoworkTable[];
  privacyPods: PrivacyPod[];
}
