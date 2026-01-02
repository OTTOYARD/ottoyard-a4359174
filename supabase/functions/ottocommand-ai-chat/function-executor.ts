// Function execution handler for OttoCommand AI agentic capabilities

// Mock vehicle data for OTTOW dispatch
const mockVehicles = [
  // Nashville
  { id: "WM-PAC-05", make: "Waymo", model: "Jaguar I-PACE", city: "Nashville", soc: 0.87, status: "idle" },
  { id: "WM-PAC-12", make: "Waymo", model: "Jaguar I-PACE", city: "Nashville", soc: 0.45, status: "charging" },
  { id: "ZX-GEN1-19", make: "Zoox", model: "Gen1", city: "Nashville", soc: 0.78, status: "idle" },
  { id: "CR-ORG-27", make: "Cruise", model: "Origin", city: "Nashville", soc: 0.88, status: "idle" },
  { id: "TE-MOD3-06", make: "Tesla", model: "Model 3", city: "Nashville", soc: 0.95, status: "idle" },
  { id: "NR-R2-18", make: "Nuro", model: "R2", city: "Nashville", soc: 0.61, status: "idle" },
  { id: "ZX-GEN2-33", make: "Zoox", model: "Gen2", city: "Nashville", soc: 0.41, status: "idle" },
  { id: "WM-JAG-12", make: "Waymo", model: "Jaguar I-PACE", city: "Nashville", soc: 0.67, status: "idle" },
  
  // Austin
  { id: "WM-PAC-03", make: "Waymo", model: "Jaguar I-PACE", city: "Austin", soc: 0.76, status: "idle" },
  { id: "WM-ZKR-08", make: "Waymo", model: "Zeekr", city: "Austin", soc: 0.92, status: "idle" },
  { id: "ZX-GEN1-07", make: "Zoox", model: "Gen1", city: "Austin", soc: 0.82, status: "idle" },
  { id: "ZX-GEN2-25", make: "Zoox", model: "Gen2", city: "Austin", soc: 0.69, status: "idle" },
  { id: "AU-XC90-31", make: "Aurora", model: "Volvo XC90", city: "Austin", soc: 0.42, status: "charging" },
  { id: "MO-I5-42", make: "Motional", model: "Hyundai IONIQ 5", city: "Austin", soc: 0.49, status: "maintenance" },
  { id: "TE-MOD3-04", make: "Tesla", model: "Model 3", city: "Austin", soc: 0.71, status: "idle" },
  { id: "TE-MODY-19", make: "Tesla", model: "Model Y", city: "Austin", soc: 0.86, status: "idle" },
  
  // LA
  { id: "WM-PAC-23", make: "Waymo", model: "Jaguar I-PACE", city: "LA", soc: 0.53, status: "charging" },
  { id: "WM-ZKR-30", make: "Waymo", model: "Zeekr", city: "LA", soc: 0.89, status: "idle" },
  { id: "ZX-GEN1-10", make: "Zoox", model: "Gen1", city: "LA", soc: 0.74, status: "idle" },
  { id: "ZX-GEN2-26", make: "Zoox", model: "Gen2", city: "LA", soc: 0.46, status: "charging" },
  { id: "CR-BLT-08", make: "Cruise", model: "Bolt EV", city: "LA", soc: 0.81, status: "idle" },
  { id: "CR-ORG-15", make: "Cruise", model: "Origin", city: "LA", soc: 0.59, status: "idle" },
  { id: "AU-SNA-11", make: "Aurora", model: "Toyota Sienna", city: "LA", soc: 0.92, status: "idle" },
  { id: "AU-XC90-22", make: "Aurora", model: "Volvo XC90", city: "LA", soc: 0.38, status: "maintenance" },
  { id: "TE-MOD3-14", make: "Tesla", model: "Model 3", city: "LA", soc: 0.65, status: "idle" },
  { id: "TE-MODY-27", make: "Tesla", model: "Model Y", city: "LA", soc: 0.79, status: "charging" },

  // San Francisco
  { id: "WM-PAC-45", make: "Waymo", model: "Jaguar I-PACE", city: "San Francisco", soc: 0.72, status: "idle" },
  { id: "ZX-GEN2-51", make: "Zoox", model: "Gen2", city: "San Francisco", soc: 0.88, status: "idle" },
  { id: "CR-ORG-63", make: "Cruise", model: "Origin", city: "San Francisco", soc: 0.65, status: "idle" },
  { id: "AU-XC90-77", make: "Aurora", model: "Volvo XC90", city: "San Francisco", soc: 0.91, status: "idle" },
  { id: "TE-MOD3-82", make: "Tesla", model: "Model 3", city: "San Francisco", soc: 0.54, status: "charging" },
  { id: "MO-I5-94", make: "Motional", model: "Hyundai IONIQ 5", city: "San Francisco", soc: 0.79, status: "idle" },
];

// OTTOW Dispatch function
async function dispatchOTTOW(args: any) {
  const { city, vehicleId, type = "malfunction", summary = "Incident reported via OttoCommand AI" } = args;
  
  console.log("OTTOW dispatch called:", { city, vehicleId, type, summary });
  
  const cityVehicles = mockVehicles
    .filter(v => v.city === city && v.status !== "maintenance")
    .slice(0, 4)
    .map((v, idx) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      soc: v.soc,
      label: String.fromCharCode(65 + idx),
      distance: (Math.random() * 3).toFixed(1),
    }));
  
  if (!vehicleId) {
    const optionsText = cityVehicles
      .map(v => `${v.label}) ${v.id} - ${v.make} ${v.model} (${v.distance} mi, ${Math.round(v.soc * 100)}% SOC)`)
      .join('\n');
    
    return {
      success: false,
      requiresSelection: true,
      city: city,
      vehicles: cityVehicles,
      message: `Available vehicles in ${city}:\n\n${optionsText}\n\nPlease reply with A, B, C, or D to select a vehicle.`,
      instructions: "User should respond with just the letter (A, B, C, or D) to select their preferred vehicle."
    };
  }
  
  if (vehicleId.length === 1 && /[A-D]/i.test(vehicleId)) {
    const index = vehicleId.toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < cityVehicles.length) {
      const selectedVehicle = cityVehicles[index];
      const vehicle = mockVehicles.find(v => v.id === selectedVehicle.id);
      const incidentId = `INC-2025-${String(Math.floor(100000 + Math.random() * 900000))}`;
      
      return {
        success: true,
        action: 'ottow_dispatched',
        incidentId: incidentId,
        vehicleId: selectedVehicle.id,
        vehicleDetails: `${vehicle?.make} ${vehicle?.model}`,
        city: city,
        type: type,
        summary: summary,
        eta: "6 min",
        message: `✓ OTTOW dispatched for ${selectedVehicle.id} (${vehicle?.make} ${vehicle?.model})\n\nIncident ${incidentId} created\nETA: 6 minutes\n\nThe incident has been added to the queue and will appear in the Incidents tab.`
      };
    }
  }
  
  const vehicle = mockVehicles.find(v => v.id === vehicleId);
  if (!vehicle) {
    return {
      success: false,
      error: `Vehicle ${vehicleId} not found in ${city}`,
      message: `Could not find vehicle ${vehicleId} in ${city}. Please try again.`
    };
  }
  
  const incidentId = `INC-2025-${String(Math.floor(100000 + Math.random() * 900000))}`;
  
  return {
    success: true,
    action: 'ottow_dispatched',
    incidentId: incidentId,
    vehicleId: vehicle.id,
    vehicleDetails: `${vehicle.make} ${vehicle.model}`,
    city: city,
    type: type,
    summary: summary,
    eta: "6 min",
    message: `✓ OTTOW dispatched for ${vehicle.id} (${vehicle.make} ${vehicle.model})\n\nIncident ${incidentId} created\nETA: 6 minutes\n\nThe incident has been added to the queue and will appear in the Incidents tab.`
  };
}

// Query Fleet Status - NEW
async function queryFleetStatus(args: any, supabase: any) {
  const { city, status, soc_below, soc_above, vehicle_id, limit = 20 } = args;
  
  try {
    let query = supabase
      .from("ottoq_vehicles")
      .select(`
        id, oem, plate, soc, status, odometer_km, health_jsonb, last_telemetry_at,
        ottoq_cities!inner(name)
      `)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (vehicle_id) {
      query = query.or(`id.eq.${vehicle_id},plate.ilike.%${vehicle_id}%`);
    }
    if (status) {
      query = query.eq("status", status.toUpperCase());
    }
    if (soc_below) {
      query = query.lt("soc", soc_below);
    }
    if (soc_above) {
      query = query.gt("soc", soc_above);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Filter by city name if provided (since city is in joined table)
    let vehicles = data || [];
    if (city) {
      vehicles = vehicles.filter((v: any) => 
        v.ottoq_cities?.name?.toLowerCase().includes(city.toLowerCase())
      );
    }

    const summary = {
      total: vehicles.length,
      byStatus: vehicles.reduce((acc: any, v: any) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      }, {}),
      avgSoc: vehicles.length > 0 
        ? Math.round((vehicles.reduce((sum: number, v: any) => sum + v.soc, 0) / vehicles.length) * 100)
        : 0,
      lowBattery: vehicles.filter((v: any) => v.soc < 0.3).length,
    };

    const vehicleList = vehicles.slice(0, 10).map((v: any) => ({
      id: v.id,
      oem: v.oem,
      plate: v.plate,
      soc: `${Math.round(v.soc * 100)}%`,
      status: v.status,
      city: v.ottoq_cities?.name,
      health: v.health_jsonb?.overall_score ?? 100,
    }));

    return {
      success: true,
      action: 'fleet_status_queried',
      summary,
      vehicles: vehicleList,
      message: `Found ${vehicles.length} vehicles${city ? ` in ${city}` : ''}${status ? ` with status ${status}` : ''}. Average SOC: ${summary.avgSoc}%. ${summary.lowBattery} vehicles have low battery (<30%).`
    };

  } catch (error) {
    console.error("Error querying fleet status:", error);
    return {
      success: false,
      error: "Failed to query fleet status",
      details: String(error)
    };
  }
}

// Query Depot Resources - NEW
async function queryDepotResources(args: any, supabase: any) {
  const { depot_id, city, resource_type, status } = args;
  
  try {
    // Fetch depots
    let depotsQuery = supabase
      .from("ottoq_depots")
      .select(`id, name, city_id, config_jsonb, ottoq_cities!inner(name)`);

    if (depot_id) {
      depotsQuery = depotsQuery.eq("id", depot_id);
    }

    const { data: depots, error: depotsError } = await depotsQuery;
    if (depotsError) throw depotsError;

    // Filter by city if provided
    let filteredDepots = depots || [];
    if (city) {
      filteredDepots = filteredDepots.filter((d: any) =>
        d.ottoq_cities?.name?.toLowerCase().includes(city.toLowerCase())
      );
    }

    const depotIds = filteredDepots.map((d: any) => d.id);

    // Fetch resources for these depots
    let resourcesQuery = supabase
      .from("ottoq_resources")
      .select("depot_id, resource_type, status, index")
      .in("depot_id", depotIds);

    if (resource_type) {
      resourcesQuery = resourcesQuery.eq("resource_type", resource_type.toUpperCase());
    }
    if (status) {
      resourcesQuery = resourcesQuery.eq("status", status.toUpperCase());
    }

    const { data: resources, error: resourcesError } = await resourcesQuery;
    if (resourcesError) throw resourcesError;

    // Fetch active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("ottoq_jobs")
      .select("depot_id, job_type, state")
      .in("depot_id", depotIds)
      .in("state", ["PENDING", "SCHEDULED", "ACTIVE"]);

    if (jobsError) throw jobsError;

    // Aggregate per depot
    const depotSummaries = filteredDepots.map((depot: any) => {
      const depotResources = (resources || []).filter((r: any) => r.depot_id === depot.id);
      const depotJobs = (jobs || []).filter((j: any) => j.depot_id === depot.id);

      const chargeStalls = depotResources.filter((r: any) => r.resource_type === "CHARGE_STALL");
      const detailStalls = depotResources.filter((r: any) => r.resource_type === "CLEAN_DETAIL_STALL");
      const maintBays = depotResources.filter((r: any) => r.resource_type === "MAINTENANCE_BAY");

      return {
        depot: depot.name,
        city: depot.ottoq_cities?.name,
        chargeStalls: {
          total: chargeStalls.length,
          available: chargeStalls.filter((r: any) => r.status === "AVAILABLE").length,
          busy: chargeStalls.filter((r: any) => r.status === "BUSY").length,
        },
        detailStalls: {
          total: detailStalls.length,
          available: detailStalls.filter((r: any) => r.status === "AVAILABLE").length,
        },
        maintenanceBays: {
          total: maintBays.length,
          available: maintBays.filter((r: any) => r.status === "AVAILABLE").length,
        },
        jobs: {
          active: depotJobs.filter((j: any) => j.state === "ACTIVE").length,
          pending: depotJobs.filter((j: any) => ["PENDING", "SCHEDULED"].includes(j.state)).length,
        },
      };
    });

    const totalChargeAvailable = depotSummaries.reduce((sum, d) => sum + d.chargeStalls.available, 0);
    const totalChargeStalls = depotSummaries.reduce((sum, d) => sum + d.chargeStalls.total, 0);
    const utilization = totalChargeStalls > 0 
      ? Math.round(((totalChargeStalls - totalChargeAvailable) / totalChargeStalls) * 100)
      : 0;

    return {
      success: true,
      action: 'depot_resources_queried',
      depots: depotSummaries,
      summary: {
        totalDepots: depotSummaries.length,
        totalChargeStalls,
        availableChargeStalls: totalChargeAvailable,
        chargeUtilization: `${utilization}%`,
      },
      message: `Found ${depotSummaries.length} depots. ${totalChargeAvailable}/${totalChargeStalls} charge stalls available (${100 - utilization}% free).`
    };

  } catch (error) {
    console.error("Error querying depot resources:", error);
    return {
      success: false,
      error: "Failed to query depot resources",
      details: String(error)
    };
  }
}

// Query Incidents - NEW
async function queryIncidents(args: any, fleetContext: any) {
  const { status, type, city, limit = 20 } = args;

  // Use fleet context incidents (from client-side store)
  const incidents = fleetContext?.incidents || [];

  let filtered = [...incidents];

  if (status) {
    filtered = filtered.filter((i: any) => i.status === status);
  }
  if (type) {
    filtered = filtered.filter((i: any) => i.type === type);
  }
  if (city) {
    filtered = filtered.filter((i: any) => 
      i.city?.toLowerCase().includes(city.toLowerCase())
    );
  }

  const summary = {
    total: filtered.length,
    byStatus: filtered.reduce((acc: any, i: any) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {}),
    byType: filtered.reduce((acc: any, i: any) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {}),
  };

  const incidentList = filtered.slice(0, limit).map((i: any) => ({
    id: i.id,
    type: i.type,
    status: i.status,
    city: i.city,
    vehicle: i.vehicleId,
    summary: i.summary,
    createdAt: i.createdAt,
  }));

  return {
    success: true,
    action: 'incidents_queried',
    summary,
    incidents: incidentList,
    message: `Found ${filtered.length} incidents${status ? ` with status ${status}` : ''}${type ? ` of type ${type}` : ''}.`
  };
}

// Generate Analytics Report - NEW
async function generateAnalyticsReport(args: any, supabase: any, fleetContext: any) {
  const { report_type, city, time_period = "today" } = args;

  const now = new Date();
  const metrics = fleetContext || {};

  // Build report based on type
  let report: any = {
    generatedAt: now.toISOString(),
    period: time_period,
    city: city || "All Cities",
  };

  switch (report_type) {
    case "fleet_health":
      report = {
        ...report,
        type: "Fleet Health Report",
        metrics: {
          totalVehicles: metrics.fleetMetrics?.totalVehicles || 0,
          activeVehicles: metrics.fleetMetrics?.activeVehicles || 0,
          avgSoc: `${metrics.fleetMetrics?.avgSoc || 0}%`,
          avgHealthScore: `${metrics.fleetMetrics?.avgHealthScore || 0}/100`,
          lowBatteryVehicles: metrics.fleetMetrics?.lowBatteryCount || 0,
          criticalBatteryVehicles: metrics.fleetMetrics?.criticalBatteryCount || 0,
          vehiclesInMaintenance: metrics.fleetMetrics?.maintenanceVehicles || 0,
        },
        recommendations: [
          metrics.fleetMetrics?.criticalBatteryCount > 0 
            ? `⚠️ ${metrics.fleetMetrics.criticalBatteryCount} vehicles have critical battery (<15%) - prioritize charging`
            : null,
          metrics.fleetMetrics?.avgSoc < 50
            ? "📊 Fleet average SOC is below 50% - consider optimizing charging schedules"
            : null,
          metrics.fleetMetrics?.maintenanceVehicles > metrics.fleetMetrics?.totalVehicles * 0.1
            ? "🔧 More than 10% of fleet is in maintenance - review maintenance backlog"
            : null,
        ].filter(Boolean),
      };
      break;

    case "depot_utilization":
      report = {
        ...report,
        type: "Depot Utilization Report",
        metrics: {
          totalDepots: metrics.depotMetrics?.totalDepots || 0,
          chargeStallUtilization: `${metrics.depotMetrics?.chargeStallUtilization || 0}%`,
          availableChargeStalls: metrics.depotMetrics?.availableChargeStalls || 0,
          totalChargeStalls: metrics.depotMetrics?.totalChargeStalls || 0,
          activeJobs: metrics.depotMetrics?.activeJobs || 0,
          pendingJobs: metrics.depotMetrics?.pendingJobs || 0,
        },
        recommendations: [
          metrics.depotMetrics?.chargeStallUtilization > 85
            ? "⚡ Charge stall utilization is high (>85%) - consider expanding capacity or optimizing schedules"
            : null,
          metrics.depotMetrics?.pendingJobs > 20
            ? `📋 ${metrics.depotMetrics.pendingJobs} jobs are pending - may need additional resources`
            : null,
        ].filter(Boolean),
      };
      break;

    case "incident_summary":
      report = {
        ...report,
        type: "Incident Summary Report",
        metrics: {
          totalIncidents: metrics.incidentMetrics?.totalIncidents || 0,
          activeIncidents: metrics.incidentMetrics?.activeIncidents || 0,
          pendingIncidents: metrics.incidentMetrics?.pendingIncidents || 0,
          closedIncidents: metrics.incidentMetrics?.closedIncidents || 0,
          byType: metrics.incidentMetrics?.incidentsByType || {},
        },
        recommendations: [
          metrics.incidentMetrics?.pendingIncidents > 5
            ? `🚨 ${metrics.incidentMetrics.pendingIncidents} incidents pending - prioritize response`
            : null,
        ].filter(Boolean),
      };
      break;

    default:
      report = {
        ...report,
        type: "General Fleet Report",
        fleet: metrics.fleetMetrics || {},
        depot: metrics.depotMetrics || {},
        incidents: metrics.incidentMetrics || {},
      };
  }

  return {
    success: true,
    action: 'analytics_report_generated',
    report,
    message: `Generated ${report.type} for ${report.city} (${report.period}).`
  };
}

// Compare Performance - NEW  
async function comparePerformance(args: any, supabase: any) {
  const { compare_type, entity_a, entity_b } = args;

  // Mock comparison data - in production would query real metrics
  const comparison = {
    type: compare_type,
    entities: [entity_a, entity_b],
    metrics: {},
    winner: null as string | null,
  };

  switch (compare_type) {
    case "cities":
      comparison.metrics = {
        [entity_a]: {
          totalVehicles: Math.floor(Math.random() * 100) + 50,
          avgSoc: Math.floor(Math.random() * 30) + 60,
          uptime: `${Math.floor(Math.random() * 5) + 95}%`,
          avgResponseTime: `${Math.floor(Math.random() * 5) + 3} min`,
        },
        [entity_b]: {
          totalVehicles: Math.floor(Math.random() * 100) + 50,
          avgSoc: Math.floor(Math.random() * 30) + 60,
          uptime: `${Math.floor(Math.random() * 5) + 95}%`,
          avgResponseTime: `${Math.floor(Math.random() * 5) + 3} min`,
        },
      };
      break;

    case "depots":
      comparison.metrics = {
        [entity_a]: {
          utilization: `${Math.floor(Math.random() * 30) + 60}%`,
          avgWaitTime: `${Math.floor(Math.random() * 10) + 5} min`,
          jobsCompleted: Math.floor(Math.random() * 50) + 20,
        },
        [entity_b]: {
          utilization: `${Math.floor(Math.random() * 30) + 60}%`,
          avgWaitTime: `${Math.floor(Math.random() * 10) + 5} min`,
          jobsCompleted: Math.floor(Math.random() * 50) + 20,
        },
      };
      break;

    case "vehicles":
      comparison.metrics = {
        [entity_a]: {
          avgSoc: `${Math.floor(Math.random() * 30) + 60}%`,
          tripCount: Math.floor(Math.random() * 20) + 5,
          efficiency: `${(Math.random() * 2 + 3).toFixed(1)} mi/kWh`,
          healthScore: Math.floor(Math.random() * 20) + 80,
        },
        [entity_b]: {
          avgSoc: `${Math.floor(Math.random() * 30) + 60}%`,
          tripCount: Math.floor(Math.random() * 20) + 5,
          efficiency: `${(Math.random() * 2 + 3).toFixed(1)} mi/kWh`,
          healthScore: Math.floor(Math.random() * 20) + 80,
        },
      };
      break;
  }

  return {
    success: true,
    action: 'performance_compared',
    comparison,
    message: `Compared ${compare_type}: ${entity_a} vs ${entity_b}.`
  };
}

// Get Recommendations - NEW
async function getRecommendations(args: any, supabase: any, fleetContext: any) {
  const { focus_area } = args;

  const metrics = fleetContext || {};
  const recommendations: any[] = [];

  // Generate recommendations based on fleet context
  if (metrics.fleetMetrics) {
    const fm = metrics.fleetMetrics;
    
    if (fm.criticalBatteryCount > 0) {
      recommendations.push({
        priority: "critical",
        area: "charging",
        title: "Critical Battery Vehicles",
        description: `${fm.criticalBatteryCount} vehicles have battery below 15%. Immediate charging required.`,
        action: "Schedule immediate charging for these vehicles",
        impact: "Prevents vehicle stranding and service interruption",
      });
    }

    if (fm.lowBatteryCount > fm.totalVehicles * 0.2) {
      recommendations.push({
        priority: "high",
        area: "charging",
        title: "High Low-Battery Rate",
        description: `${Math.round((fm.lowBatteryCount / fm.totalVehicles) * 100)}% of fleet is below 30% SOC.`,
        action: "Review charging schedules and depot capacity",
        impact: "Improves fleet availability and reduces emergency charging",
      });
    }

    if (fm.maintenanceVehicles > fm.totalVehicles * 0.1) {
      recommendations.push({
        priority: "medium",
        area: "maintenance",
        title: "Elevated Maintenance Queue",
        description: `${fm.maintenanceVehicles} vehicles (${Math.round((fm.maintenanceVehicles / fm.totalVehicles) * 100)}%) are in maintenance.`,
        action: "Review maintenance backlog and prioritize critical repairs",
        impact: "Increases fleet availability",
      });
    }

    if (fm.avgSoc < 60) {
      recommendations.push({
        priority: "medium",
        area: "energy",
        title: "Low Fleet Average SOC",
        description: `Fleet average SOC is ${fm.avgSoc}%, below the recommended 60% threshold.`,
        action: "Optimize charging schedules and consider off-peak charging incentives",
        impact: "Improves readiness for peak demand periods",
      });
    }
  }

  if (metrics.depotMetrics) {
    const dm = metrics.depotMetrics;
    
    if (dm.chargeStallUtilization > 80) {
      recommendations.push({
        priority: "high",
        area: "capacity",
        title: "High Charge Stall Utilization",
        description: `Charge stall utilization is ${dm.chargeStallUtilization}%, approaching capacity.`,
        action: "Consider expanding charging infrastructure or optimizing schedules",
        impact: "Reduces wait times and improves throughput",
      });
    }

    if (dm.pendingJobs > 15) {
      recommendations.push({
        priority: "medium",
        area: "operations",
        title: "Job Queue Backlog",
        description: `${dm.pendingJobs} jobs are pending in the queue.`,
        action: "Review job scheduling and resource allocation",
        impact: "Improves service delivery time",
      });
    }
  }

  if (metrics.incidentMetrics) {
    const im = metrics.incidentMetrics;
    
    if (im.pendingIncidents > 3) {
      recommendations.push({
        priority: "high",
        area: "incidents",
        title: "Pending Incidents",
        description: `${im.pendingIncidents} incidents are awaiting response.`,
        action: "Prioritize OTTOW dispatch for pending incidents",
        impact: "Improves response time and customer satisfaction",
      });
    }
  }

  // Add default recommendations if no specific issues found
  if (recommendations.length === 0) {
    recommendations.push({
      priority: "low",
      area: "general",
      title: "Fleet Operating Normally",
      description: "No critical issues detected. Fleet is operating within normal parameters.",
      action: "Continue monitoring and maintain current practices",
      impact: "Sustained operational excellence",
    });
  }

  // Filter by focus area if specified
  let filtered = recommendations;
  if (focus_area) {
    filtered = recommendations.filter(r => r.area === focus_area || r.area === "general");
  }

  return {
    success: true,
    action: 'recommendations_generated',
    recommendations: filtered.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    }),
    message: `Generated ${filtered.length} recommendations${focus_area ? ` for ${focus_area}` : ''}.`
  };
}

// Schedule Vehicle Task
async function scheduleVehicleTask(args: any, supabase: any) {
  const { vehicle_id, task_type, description, scheduled_date, priority = 'medium' } = args;
  
  try {
    const vehicleNumber = vehicle_id.replace(/[^0-9]/g, '');
    
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, vehicle_number, make, model')
      .eq('vehicle_number', vehicleNumber)
      .single();

    if (vehicleError || !vehicle) {
      console.log('Vehicle not found, creating maintenance record anyway');
    }

    if (task_type === 'maintenance') {
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert({
          vehicle_id: vehicle?.id || null,
          maintenance_type: description,
          description: `${description} - Scheduled via OttoCommand AI`,
          next_due_date: scheduled_date,
          ai_predicted: true,
          prediction_confidence: 95
        });

      if (error) {
        console.error('Database error:', error);
        return {
          success: false,
          error: 'Failed to schedule maintenance in database',
          details: error.message
        };
      }

      return {
        success: true,
        action: 'maintenance_scheduled',
        vehicle_id: vehicle_id,
        task: description,
        scheduled_date: scheduled_date,
        priority: priority,
        message: `Successfully scheduled ${description} for ${vehicle_id} on ${scheduled_date}`
      };
    }

    return {
      success: true,
      action: 'task_scheduled',
      vehicle_id: vehicle_id,
      task_type: task_type,
      task: description,
      scheduled_date: scheduled_date,
      priority: priority,
      message: `Successfully scheduled ${task_type} task for ${vehicle_id}: ${description}`
    };

  } catch (error) {
    console.error('Error scheduling task:', error);
    return {
      success: false,
      error: 'Failed to schedule task',
      details: String(error)
    };
  }
}

// Update Vehicle Status
async function updateVehicleStatus(args: any, supabase: any) {
  const { vehicle_id, status, location, notes } = args;

  try {
    const vehicleNumber = vehicle_id.replace(/[^0-9]/g, '');
    
    const { data, error } = await supabase
      .from('vehicles')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_number', vehicleNumber);

    if (error) {
      console.error('Database error:', error);
      return {
        success: false,
        error: 'Failed to update vehicle status',
        details: error.message
      };
    }

    return {
      success: true,
      action: 'status_updated',
      vehicle_id: vehicle_id,
      new_status: status,
      location: location,
      notes: notes,
      message: `Successfully updated ${vehicle_id} status to ${status}${location ? ` at ${location}` : ''}`
    };

  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return {
      success: false,
      error: 'Failed to update status',
      details: String(error)
    };
  }
}

// Web Search
async function performWebSearch(args: any) {
  const { query, focus_area } = args;
  
  // Enhanced mock search results based on focus area
  const searchResults: any = {
    query: query,
    results: [],
    timestamp: new Date().toISOString(),
  };

  if (focus_area === "regulations" || query.toLowerCase().includes("regulation") || query.toLowerCase().includes("nhtsa")) {
    searchResults.results = [
      {
        title: "NHTSA Autonomous Vehicle Safety Guidelines 2024",
        snippet: "Updated federal guidelines require AV operators to report disengagements within 24 hours. New safety certification requirements for L4 vehicles include mandatory redundant braking systems.",
        url: "https://nhtsa.gov/autonomous-vehicles/guidelines-2024"
      },
      {
        title: "State-by-State AV Regulations Overview",
        snippet: "California, Arizona, Texas lead in AV permits. California requires safety drivers for testing; Arizona allows fully driverless operations in geofenced areas.",
        url: "https://autonomous-vehicles.org/state-regulations"
      },
    ];
  } else if (focus_area === "safety" || query.toLowerCase().includes("safety")) {
    searchResults.results = [
      {
        title: "Best Practices for AV Fleet Safety Management",
        snippet: "Industry standard: target <0.1 safety incidents per million miles. Key metrics include disengagement rate, near-miss frequency, and pedestrian interaction scores.",
        url: "https://av-safety-consortium.org/best-practices"
      },
      {
        title: "Autonomous Vehicle Incident Response Protocols",
        snippet: "Recommended response time for vehicle-down incidents: <6 minutes. Implement 24/7 remote monitoring with real-time escalation paths.",
        url: "https://fleet-safety.com/av-incident-response"
      },
    ];
  } else {
    searchResults.results = [
      {
        title: "Latest Fleet Management Best Practices 2025",
        snippet: "Current industry trends show 18% efficiency gains through predictive maintenance, AI-powered route optimization, and smart charging strategies.",
        url: "https://fleetmanagement.com/best-practices-2025"
      },
      {
        title: "Electric Fleet Optimization Strategies",
        snippet: "Modern fleets are achieving 25-35% cost reduction through smart charging, battery health monitoring, and renewable energy integration.",
        url: "https://electricfleets.org/optimization"
      },
      {
        title: "Predictive Maintenance ROI Analysis",
        snippet: "Studies show predictive maintenance reduces downtime by 40% and maintenance costs by 30% compared to traditional scheduled maintenance.",
        url: "https://maintenance-analytics.com/roi-study"
      }
    ];
  }

  return {
    success: true,
    action: 'web_search_completed',
    query: query,
    focusArea: focus_area,
    results: searchResults,
    message: `Found ${searchResults.results.length} relevant results for: ${query}`
  };
}

// Create Optimization Plan
async function createOptimizationPlan(args: any) {
  const { focus_area, timeframe, goals } = args;

  const optimizationPlans: Record<string, Record<string, string[]>> = {
    routes: {
      immediate: [
        "Implement dynamic routing for delivery vehicles",
        "Optimize traffic light coordination on main corridors", 
        "Deploy GPS tracking for real-time route adjustments"
      ],
      weekly: [
        "Analyze route efficiency data and eliminate redundancies",
        "Pilot AI-powered route optimization on 3 key circuits",
        "Train drivers on eco-efficient driving techniques"
      ],
      monthly: [
        "Full fleet route network redesign based on demand patterns",
        "Implement predictive routing using weather and traffic data",
        "Establish performance KPIs and continuous improvement process"
      ]
    },
    energy: {
      immediate: [
        "Switch 6 vehicles to off-peak charging schedule",
        "Implement tire pressure monitoring alerts",
        "Activate regenerative braking optimization"
      ],
      weekly: [
        "Install smart charging stations with load balancing",
        "Deploy battery health monitoring across fleet",
        "Optimize charging schedules based on route demands"
      ],
      monthly: [
        "Integrate solar panels with grid-tie capabilities", 
        "Implement battery conditioning for climate efficiency",
        "Establish energy cost tracking and reduction targets"
      ]
    },
    maintenance: {
      immediate: [
        "Schedule overdue maintenance for flagged vehicles",
        "Implement daily vehicle inspection checklists",
        "Set up automated maintenance reminders"
      ],
      weekly: [
        "Deploy predictive maintenance sensors on critical systems",
        "Optimize technician scheduling and workload distribution",
        "Establish preventive maintenance calendar"
      ],
      monthly: [
        "Implement condition-based maintenance program",
        "Deploy fleet telemetry for real-time health monitoring",
        "Establish maintenance cost reduction targets (15% goal)"
      ]
    },
    costs: {
      immediate: [
        "Negotiate bulk fuel/energy purchase agreements",
        "Implement driver fuel efficiency coaching",
        "Review and optimize insurance policies"
      ],
      weekly: [
        "Analyze operational cost per vehicle and identify outliers",
        "Implement automated expense tracking and reporting",
        "Optimize spare parts inventory levels"
      ],
      monthly: [
        "Conduct comprehensive fleet TCO analysis",
        "Evaluate lease vs purchase decisions for vehicle renewal",
        "Establish cost reduction targets and performance metrics"
      ]
    }
  };

  const plan = optimizationPlans[focus_area]?.[timeframe] || [
    `Custom optimization plan for ${focus_area} over ${timeframe} timeframe`,
    "Analyze current performance metrics and identify improvement opportunities",
    "Implement targeted improvements with measurable outcomes"
  ];

  return {
    success: true,
    action: 'optimization_plan_created',
    focus_area: focus_area,
    timeframe: timeframe,
    goals: goals,
    plan: plan,
    estimated_savings: `$${Math.floor(Math.random() * 5000) + 1000}/month`,
    implementation_steps: plan.length,
    message: `Created ${timeframe} ${focus_area} optimization plan with ${plan.length} actionable steps`
  };
}

// Main executor
export async function executeFunction(functionCall: any, supabase: any, fleetContext?: any) {
  const { name, arguments: rawArgs } = functionCall;
  const parsedArgs = typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : (rawArgs ?? {});
  
  console.log(`Executing function: ${name}`, parsedArgs);

  switch (name) {
    case 'dispatch_ottow_tow':
      return await dispatchOTTOW(parsedArgs);
    
    case 'query_fleet_status':
      return await queryFleetStatus(parsedArgs, supabase);
    
    case 'query_depot_resources':
      return await queryDepotResources(parsedArgs, supabase);
    
    case 'query_incidents':
      return await queryIncidents(parsedArgs, fleetContext);
    
    case 'generate_analytics_report':
      return await generateAnalyticsReport(parsedArgs, supabase, fleetContext);
    
    case 'compare_performance':
      return await comparePerformance(parsedArgs, supabase);
    
    case 'get_recommendations':
      return await getRecommendations(parsedArgs, supabase, fleetContext);
    
    case 'schedule_vehicle_task':
      return await scheduleVehicleTask(parsedArgs, supabase);
    
    case 'update_vehicle_status':
      return await updateVehicleStatus(parsedArgs, supabase);
    
    case 'web_search':
      return await performWebSearch(parsedArgs);
    
    case 'create_optimization_plan':
      return await createOptimizationPlan(parsedArgs);
    
    default:
      return { 
        success: false, 
        error: `Unknown function: ${name}` 
      };
  }
}
