import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIncidentsStore } from "@/stores/incidentsStore";

export interface VehicleSummary {
  id: string;
  oem: string;
  plate: string | null;
  soc: number;
  status: string;
  cityId: string;
  cityName: string;
  odometerKm: number;
  healthScore: number;
  lastTelemetryAt: string | null;
}

export interface DepotSummary {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  totalChargeStalls: number;
  availableChargeStalls: number;
  totalDetailStalls: number;
  availableDetailStalls: number;
  totalMaintenanceBays: number;
  availableMaintenanceBays: number;
  activeJobs: number;
  pendingJobs: number;
}

export interface JobSummary {
  id: string;
  vehicleId: string;
  depotId: string;
  depotName: string;
  jobType: string;
  state: string;
  scheduledStartAt: string | null;
  etaSeconds: number | null;
}

export interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  chargingVehicles: number;
  idleVehicles: number;
  maintenanceVehicles: number;
  enRouteVehicles: number;
  avgSoc: number;
  lowBatteryCount: number;
  criticalBatteryCount: number;
  avgHealthScore: number;
}

export interface DepotMetrics {
  totalDepots: number;
  totalChargeStalls: number;
  availableChargeStalls: number;
  chargeStallUtilization: number;
  totalDetailStalls: number;
  availableDetailStalls: number;
  totalMaintenanceBays: number;
  availableMaintenanceBays: number;
  activeJobs: number;
  pendingJobs: number;
  completedJobsToday: number;
}

export interface IncidentMetrics {
  totalIncidents: number;
  activeIncidents: number;
  pendingIncidents: number;
  closedIncidents: number;
  incidentsByType: Record<string, number>;
}

export interface FleetContext {
  vehicles: VehicleSummary[];
  depots: DepotSummary[];
  jobs: JobSummary[];
  fleetMetrics: FleetMetrics;
  depotMetrics: DepotMetrics;
  incidentMetrics: IncidentMetrics;
  cities: { id: string; name: string; tz: string }[];
  timestamp: string;
  isLoading: boolean;
  error: string | null;
}

export function useFleetContext(): FleetContext {
  const incidents = useIncidentsStore((state) => state.incidents);

  // Fetch vehicles with city info
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ["fleetContext", "vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ottoq_vehicles")
        .select(`
          id,
          oem,
          plate,
          soc,
          status,
          city_id,
          odometer_km,
          health_jsonb,
          last_telemetry_at,
          ottoq_cities!inner(id, name, tz)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch depots with resources
  const { data: depotsData, isLoading: depotsLoading, error: depotsError } = useQuery({
    queryKey: ["fleetContext", "depots"],
    queryFn: async () => {
      const { data: depots, error: depotsError } = await supabase
        .from("ottoq_depots")
        .select(`
          id,
          name,
          city_id,
          config_jsonb,
          ottoq_cities!inner(id, name)
        `);

      if (depotsError) throw depotsError;

      // Fetch resources grouped by depot
      const { data: resources, error: resourcesError } = await supabase
        .from("ottoq_resources")
        .select("depot_id, resource_type, status");

      if (resourcesError) throw resourcesError;

      // Fetch active/pending jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("ottoq_jobs")
        .select("depot_id, state")
        .in("state", ["PENDING", "SCHEDULED", "ACTIVE"]);

      if (jobsError) throw jobsError;

      // Aggregate resources per depot
      return (depots || []).map((depot: any) => {
        const depotResources = (resources || []).filter((r: any) => r.depot_id === depot.id);
        const depotJobs = (jobs || []).filter((j: any) => j.depot_id === depot.id);

        const chargeStalls = depotResources.filter((r: any) => r.resource_type === "CHARGE_STALL");
        const detailStalls = depotResources.filter((r: any) => r.resource_type === "CLEAN_DETAIL_STALL");
        const maintBays = depotResources.filter((r: any) => r.resource_type === "MAINTENANCE_BAY");

        return {
          id: depot.id,
          name: depot.name,
          cityId: depot.city_id,
          cityName: depot.ottoq_cities?.name || "Unknown",
          totalChargeStalls: chargeStalls.length,
          availableChargeStalls: chargeStalls.filter((r: any) => r.status === "AVAILABLE").length,
          totalDetailStalls: detailStalls.length,
          availableDetailStalls: detailStalls.filter((r: any) => r.status === "AVAILABLE").length,
          totalMaintenanceBays: maintBays.length,
          availableMaintenanceBays: maintBays.filter((r: any) => r.status === "AVAILABLE").length,
          activeJobs: depotJobs.filter((j: any) => j.state === "ACTIVE").length,
          pendingJobs: depotJobs.filter((j: any) => ["PENDING", "SCHEDULED"].includes(j.state)).length,
        };
      });
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch active jobs
  const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ["fleetContext", "jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ottoq_jobs")
        .select(`
          id,
          vehicle_id,
          depot_id,
          job_type,
          state,
          scheduled_start_at,
          eta_seconds,
          ottoq_depots!inner(name)
        `)
        .in("state", ["PENDING", "SCHEDULED", "ACTIVE"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map((job: any) => ({
        id: job.id,
        vehicleId: job.vehicle_id,
        depotId: job.depot_id,
        depotName: job.ottoq_depots?.name || "Unknown",
        jobType: job.job_type,
        state: job.state,
        scheduledStartAt: job.scheduled_start_at,
        etaSeconds: job.eta_seconds,
      }));
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch cities
  const { data: citiesData } = useQuery({
    queryKey: ["fleetContext", "cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ottoq_cities")
        .select("id, name, tz");
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000, // 5 minutes
  });

  // Transform vehicles
  const vehicles: VehicleSummary[] = (vehiclesData || []).map((v: any) => ({
    id: v.id,
    oem: v.oem,
    plate: v.plate,
    soc: v.soc,
    status: v.status,
    cityId: v.city_id,
    cityName: v.ottoq_cities?.name || "Unknown",
    odometerKm: v.odometer_km,
    healthScore: v.health_jsonb?.overall_score ?? v.health_jsonb?.score ?? 100,
    lastTelemetryAt: v.last_telemetry_at,
  }));

  // Calculate fleet metrics
  const fleetMetrics: FleetMetrics = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v) => v.status === "IN_SERVICE" || v.status === "ON_TRIP").length,
    chargingVehicles: vehicles.filter((v) => v.status === "AT_DEPOT").length,
    idleVehicles: vehicles.filter((v) => v.status === "IDLE").length,
    maintenanceVehicles: vehicles.filter((v) => v.status === "MAINTENANCE").length,
    enRouteVehicles: vehicles.filter((v) => v.status === "ENROUTE_DEPOT").length,
    avgSoc: vehicles.length > 0 ? Math.round((vehicles.reduce((sum, v) => sum + v.soc, 0) / vehicles.length) * 100) : 0,
    lowBatteryCount: vehicles.filter((v) => v.soc < 0.3).length,
    criticalBatteryCount: vehicles.filter((v) => v.soc < 0.15).length,
    avgHealthScore: vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length) : 100,
  };

  // Calculate depot metrics
  const depots = depotsData || [];
  const jobs = jobsData || [];
  const depotMetrics: DepotMetrics = {
    totalDepots: depots.length,
    totalChargeStalls: depots.reduce((sum, d) => sum + d.totalChargeStalls, 0),
    availableChargeStalls: depots.reduce((sum, d) => sum + d.availableChargeStalls, 0),
    chargeStallUtilization: depots.reduce((sum, d) => sum + d.totalChargeStalls, 0) > 0
      ? Math.round(((depots.reduce((sum, d) => sum + d.totalChargeStalls, 0) - depots.reduce((sum, d) => sum + d.availableChargeStalls, 0)) / depots.reduce((sum, d) => sum + d.totalChargeStalls, 0)) * 100)
      : 0,
    totalDetailStalls: depots.reduce((sum, d) => sum + d.totalDetailStalls, 0),
    availableDetailStalls: depots.reduce((sum, d) => sum + d.availableDetailStalls, 0),
    totalMaintenanceBays: depots.reduce((sum, d) => sum + d.totalMaintenanceBays, 0),
    availableMaintenanceBays: depots.reduce((sum, d) => sum + d.availableMaintenanceBays, 0),
    activeJobs: jobs.filter((j) => j.state === "ACTIVE").length,
    pendingJobs: jobs.filter((j) => ["PENDING", "SCHEDULED"].includes(j.state)).length,
    completedJobsToday: 0, // Would need additional query
  };

  // Calculate incident metrics
  const incidentMetrics: IncidentMetrics = {
    totalIncidents: incidents.length,
    activeIncidents: incidents.filter((i) => i.status === "Dispatched" || i.status === "Secured").length,
    pendingIncidents: incidents.filter((i) => i.status === "Reported").length,
    closedIncidents: incidents.filter((i) => i.status === "Closed").length,
    incidentsByType: incidents.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const isLoading = vehiclesLoading || depotsLoading || jobsLoading;
  const error = vehiclesError?.message || depotsError?.message || jobsError?.message || null;

  return {
    vehicles,
    depots,
    jobs,
    fleetMetrics,
    depotMetrics,
    incidentMetrics,
    cities: citiesData || [],
    timestamp: new Date().toISOString(),
    isLoading,
    error,
  };
}

// Helper function to serialize fleet context for AI
export function serializeFleetContext(context: FleetContext): string {
  const { fleetMetrics, depotMetrics, incidentMetrics, vehicles, depots, cities, timestamp } = context;

  return `
=== REAL-TIME FLEET DATA (as of ${new Date(timestamp).toLocaleString()}) ===

FLEET SUMMARY:
• Total Vehicles: ${fleetMetrics.totalVehicles}
• Active/In Service: ${fleetMetrics.activeVehicles}
• At Depot/Charging: ${fleetMetrics.chargingVehicles}
• Idle: ${fleetMetrics.idleVehicles}
• En Route to Depot: ${fleetMetrics.enRouteVehicles}
• In Maintenance: ${fleetMetrics.maintenanceVehicles}
• Average SOC: ${fleetMetrics.avgSoc}%
• Low Battery (<30%): ${fleetMetrics.lowBatteryCount} vehicles
• Critical Battery (<15%): ${fleetMetrics.criticalBatteryCount} vehicles
• Average Health Score: ${fleetMetrics.avgHealthScore}/100

DEPOT OPERATIONS:
• Total Depots: ${depotMetrics.totalDepots}
• Charge Stalls: ${depotMetrics.availableChargeStalls}/${depotMetrics.totalChargeStalls} available (${100 - depotMetrics.chargeStallUtilization}% free)
• Detail Stalls: ${depotMetrics.availableDetailStalls}/${depotMetrics.totalDetailStalls} available
• Maintenance Bays: ${depotMetrics.availableMaintenanceBays}/${depotMetrics.totalMaintenanceBays} available
• Active Jobs: ${depotMetrics.activeJobs}
• Pending/Scheduled Jobs: ${depotMetrics.pendingJobs}

INCIDENT STATUS:
• Total Incidents: ${incidentMetrics.totalIncidents}
• Active: ${incidentMetrics.activeIncidents}
• Pending: ${incidentMetrics.pendingIncidents}
• Closed: ${incidentMetrics.closedIncidents}
${Object.entries(incidentMetrics.incidentsByType).map(([type, count]) => `• ${type}: ${count}`).join('\n')}

CITIES: ${cities.map(c => c.name).join(', ')}

DEPOT DETAILS:
${depots.slice(0, 10).map(d => `• ${d.name} (${d.cityName}): ${d.availableChargeStalls}/${d.totalChargeStalls} charge stalls, ${d.activeJobs} active jobs`).join('\n')}

VEHICLE SAMPLES (top 20 by status):
${vehicles.slice(0, 20).map(v => `• ${v.oem} ${v.plate || v.id.slice(0, 8)} | SOC: ${Math.round(v.soc * 100)}% | Status: ${v.status} | City: ${v.cityName} | Health: ${v.healthScore}%`).join('\n')}
`.trim();
}
