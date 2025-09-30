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
];

async function dispatchOTTOW(args: any) {
  const { city, vehicleId, type = "malfunction", summary = "Incident reported via OttoCommand AI" } = args;
  
  console.log("OTTOW dispatch called:", { city, vehicleId, type, summary });
  
  // Filter vehicles by city and exclude those in maintenance
  const cityVehicles = mockVehicles
    .filter(v => v.city === city && v.status !== "maintenance")
    .slice(0, 4) // Top 4 vehicles
    .map((v, idx) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      soc: v.soc,
      label: String.fromCharCode(65 + idx), // A, B, C, D
      distance: (Math.random() * 3).toFixed(1), // Mock distance in miles
    }));
  
  // If no vehicle selected yet, return options
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
  
  // Check if vehicleId is a letter selection (A, B, C, D)
  if (vehicleId.length === 1 && /[A-D]/i.test(vehicleId)) {
    const index = vehicleId.toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < cityVehicles.length) {
      const selectedVehicle = cityVehicles[index];
      const vehicle = mockVehicles.find(v => v.id === selectedVehicle.id);
      
      // Generate incident ID
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
  
  // Direct vehicle ID provided
  const vehicle = mockVehicles.find(v => v.id === vehicleId);
  if (!vehicle) {
    return {
      success: false,
      error: `Vehicle ${vehicleId} not found in ${city}`,
      message: `Could not find vehicle ${vehicleId} in ${city}. Please try again.`
    };
  }
  
  // Generate incident ID
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

export async function executeFunction(functionCall: any, supabase: any) {
  const { name, arguments: rawArgs } = functionCall;
  
  // Robust argument parsing - handle both string and already-parsed objects
  const parsedArgs = typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : (rawArgs ?? {});
  
  console.log(`Executing function: ${name}`, parsedArgs);

  switch (name) {
    case 'dispatch_ottow_tow':
      return await dispatchOTTOW(parsedArgs);
    
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

async function scheduleVehicleTask(args: any, supabase: any) {
  const { vehicle_id, task_type, description, scheduled_date, priority = 'medium' } = args;
  
  try {
    // Extract vehicle number from vehicle_id for database lookup
    const vehicleNumber = vehicle_id.replace(/[^0-9]/g, '');
    
    // Find the vehicle in database
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, vehicle_number, make, model')
      .eq('vehicle_number', vehicleNumber)
      .single();

    if (vehicleError || !vehicle) {
      console.log('Vehicle not found, creating maintenance record anyway');
      // Create maintenance record even if vehicle not found (for demo purposes)
    }

    if (task_type === 'maintenance') {
      // Create maintenance record
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

    // For non-maintenance tasks, return success with details
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
      details: error.message
    };
  }
}

async function updateVehicleStatus(args: any, supabase: any) {
  const { vehicle_id, status, location, notes } = args;

  try {
    // Extract vehicle number for database lookup
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
      details: error.message
    };
  }
}

async function performWebSearch(args: any) {
  const { query } = args;
  
  try {
    // Simulate web search with relevant fleet management information
    // In a real implementation, you would use a search API like Tavily, Serper, or Google Search API
    const searchResults = {
      query: query,
      results: [
        {
          title: "Latest Fleet Management Best Practices 2024",
          snippet: "Current industry trends show 15% efficiency gains through predictive maintenance, route optimization using AI, and electric vehicle integration strategies.",
          url: "https://fleetmanagement.com/best-practices-2024"
        },
        {
          title: "Electric Fleet Optimization Strategies",
          snippet: "Modern fleets are achieving 20-30% cost reduction through smart charging, battery health monitoring, and renewable energy integration.",
          url: "https://electricfleets.org/optimization"
        },
        {
          title: "Predictive Maintenance ROI Analysis",
          snippet: "Studies show predictive maintenance reduces downtime by 35% and maintenance costs by 25% compared to traditional scheduled maintenance.",
          url: "https://maintenance-analytics.com/roi-study"
        }
      ],
      timestamp: new Date().toISOString(),
      note: "Web search simulation - integrate with real search API for live results"
    };

    return {
      success: true,
      action: 'web_search_completed',
      query: query,
      results: searchResults,
      message: `Found ${searchResults.results.length} relevant results for: ${query}`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Web search failed',
      details: error.message
    };
  }
}

async function createOptimizationPlan(args: any) {
  const { focus_area, timeframe, goals } = args;

  const optimizationPlans = {
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
        "Schedule overdue maintenance for BUS-007, VAN-003, TRUCK-005",
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