// src/agent/tools.ts
// Enhanced Tool contracts for OttoCommand AI - 25 specialized tools across 7 categories
// Keep pure types + bound implementations.

// ═══════════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type StallStatus = "open" | "occupied" | "reserved" | "out_of_service" | "maintenance";
export type VehicleStatus = "idle" | "en_route" | "charging" | "maintenance" | "active";
export type AutonomyLevel = "L3" | "L4" | "L5";
export type Priority = "critical" | "high" | "medium" | "low";
export type JobType = "CHARGE" | "MAINTENANCE" | "DETAILING" | "DOWNTIME_PARK";
export type ResourceType = "CHARGE_STALL" | "CLEAN_DETAIL_STALL" | "MAINTENANCE_BAY" | "STAGING_STALL";

export interface Stall {
  id: string;
  depotId: string;
  status: StallStatus;
  powerKW: number;
  connector?: string;
  maxVehicleLength?: number;
  lastMaintenance?: string;
  utilizationRate?: number;
  avgChargingTime?: number;
  autonomousCompatible?: boolean;
  biDirectional?: boolean;
}

export interface Vehicle {
  id: string;
  soc: number; // 0..1
  status: VehicleStatus;
  currentDepotId?: string;
  assignedStallId?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  city?: string;
  licensePlate?: string;
  batteryCapacity?: number;
  maxRange?: number;
  currentRoute?: string | null;
  lastLocationUpdate?: string;
  mileage?: number;
  engineHours?: number;
  nextMaintenanceDate?: string;
  fuelEfficiency?: number;
  autonomyLevel?: AutonomyLevel;
  disengagementRate?: number;
  safetyScore?: number;
  revenuePerDay?: number;
  customerRating?: number;
  biDirectionalCharging?: boolean;
  location?: { lat: number; lng: number };
  operationalMetrics?: {
    avgDailyDistance: number;
    energyConsumption: number;
    utilizationRate: number;
    uptime: number;
    maintenanceCostPerKm: number;
  };
}

export interface ChargingAssignment {
  vehicleId: string;
  stallId: string;
  start: string;
  end: string;
  chargingType?: string;
  priority?: string;
  estimatedCost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS - 25 TOOLS ACROSS 7 CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const Tools = {
  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: FLEET INTELLIGENCE QUERIES (4 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  query_vehicles: {
    name: "query_vehicles",
    description: "Advanced vehicle querying with multi-filter support. Use for fleet status queries, finding vehicles by criteria, or analyzing vehicle subsets.",
    input: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filter criteria for vehicles",
          properties: {
            city: { type: "string", description: "Filter by city (Nashville, Austin, LA, San Francisco)" },
            depot_id: { type: "string", description: "Filter by depot ID" },
            status: {
              type: "array",
              items: { type: "string", enum: ["idle", "charging", "active", "maintenance", "en_route"] },
              description: "Filter by vehicle status(es)"
            },
            soc_range: {
              type: "object",
              properties: {
                min: { type: "number", description: "Minimum SOC (0-1)" },
                max: { type: "number", description: "Maximum SOC (0-1)" }
              }
            },
            oem: { type: "string", description: "Filter by OEM (Waymo, Zoox, Cruise, Aurora, Motional, Tesla, Nuro)" },
            autonomy_level: { type: "string", enum: ["L3", "L4", "L5"] },
            health_score_below: { type: "number", description: "Vehicles with health score below threshold" },
            maintenance_due_within_days: { type: "number", description: "Vehicles with maintenance due within N days" },
            has_active_incident: { type: "boolean" }
          }
        },
        sort_by: {
          type: "string",
          enum: ["soc_asc", "soc_desc", "health_asc", "health_desc", "mileage", "revenue", "safety_score"],
          description: "Sort order for results"
        },
        limit: { type: "number", description: "Max results to return (default: 20)" },
        include_telemetry: { type: "boolean", description: "Include detailed telemetry data" }
      },
      required: []
    }
  },

  query_depot_deep: {
    name: "query_depot_deep",
    description: "Deep depot analysis with resource breakdown, utilization, energy metrics, and capacity planning data.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string", description: "Specific depot ID to analyze" },
        city: { type: "string", description: "Filter depots by city" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: ["resources", "vehicles", "jobs", "energy", "utilization_history", "predictions", "alerts"]
          },
          description: "Data sections to include in response"
        },
        time_range: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start time (ISO format)" },
            end: { type: "string", description: "End time (ISO format)" }
          }
        }
      },
      required: []
    }
  },

  query_by_natural_language: {
    name: "query_by_natural_language",
    description: "Convert natural language questions into structured fleet queries. Use when user asks in plain English.",
    input: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language query like 'all Waymo vehicles in Nashville with low battery' or 'show me idle vehicles that need charging'"
        },
        context: {
          type: "string",
          description: "Additional context to refine the query"
        }
      },
      required: ["query"]
    }
  },

  list_stalls: {
    name: "list_stalls",
    description: "List stalls for a depot filtered by status. Quick lookup of stall availability.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        status: {
          type: "string",
          enum: ["open", "occupied", "reserved", "out_of_service", "maintenance"],
          nullable: true
        }
      },
      required: ["depot_id"]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: PREDICTIVE ANALYTICS (4 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  predict_charging_needs: {
    name: "predict_charging_needs",
    description: "Predict which vehicles will need charging within a time horizon based on SOC trends, usage patterns, and schedules.",
    input: {
      type: "object",
      properties: {
        horizon_hours: { type: "number", description: "Look-ahead window in hours (default: 4)" },
        city: { type: "string", description: "Filter by city" },
        depot_id: { type: "string", description: "Filter by depot" },
        soc_threshold: { type: "number", description: "SOC percentage below which charging is recommended (default: 30)" },
        include_recommendations: { type: "boolean", description: "Include optimal charge scheduling recommendations" }
      },
      required: []
    }
  },

  predict_maintenance_risks: {
    name: "predict_maintenance_risks",
    description: "Identify vehicles with elevated maintenance risk based on telemetry patterns, mileage, and component health.",
    input: {
      type: "object",
      properties: {
        risk_threshold: { type: "number", description: "Minimum confidence to include (0-1, default: 0.6)" },
        categories: {
          type: "array",
          items: { type: "string", enum: ["battery", "sensors", "brakes", "tires", "lidar", "software", "general"] },
          description: "Filter by maintenance categories"
        },
        city: { type: "string" },
        vehicle_ids: { type: "array", items: { type: "string" }, description: "Specific vehicles to analyze" }
      },
      required: []
    }
  },

  predict_depot_demand: {
    name: "predict_depot_demand",
    description: "Forecast depot resource demand for capacity planning. Predicts charging, maintenance, and staging needs.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string", description: "Depot to forecast" },
        horizon_hours: { type: "number", description: "Forecast window (default: 24)" },
        resource_types: {
          type: "array",
          items: { type: "string", enum: ["CHARGE_STALL", "CLEAN_DETAIL_STALL", "MAINTENANCE_BAY", "STAGING_STALL"] }
        },
        granularity: { type: "string", enum: ["hourly", "shift", "daily"], description: "Forecast granularity" }
      },
      required: ["depot_id"]
    }
  },

  predict_incident_likelihood: {
    name: "predict_incident_likelihood",
    description: "Assess incident risk for vehicles based on patterns, weather, routes, and telemetry anomalies.",
    input: {
      type: "object",
      properties: {
        city: { type: "string" },
        vehicle_ids: { type: "array", items: { type: "string" } },
        include_factors: { type: "boolean", description: "Include risk factor breakdown" },
        route_ids: { type: "array", items: { type: "string" }, description: "Assess specific routes" }
      },
      required: []
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: OTTO-Q AUTOMATION (5 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  auto_queue_charging: {
    name: "auto_queue_charging",
    description: "Automatically queue vehicles for charging based on SOC and predictions. Preview with dry_run before executing.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        city: { type: "string" },
        strategy: {
          type: "string",
          enum: ["urgent_first", "balanced", "off_peak", "revenue_optimal"],
          description: "Charging strategy to apply"
        },
        max_concurrent: { type: "number", description: "Max vehicles to queue at once" },
        soc_target: { type: "number", description: "Target SOC percentage (default: 80)" },
        soc_threshold: { type: "number", description: "Queue vehicles below this SOC (default: 40)" },
        dry_run: { type: "boolean", description: "Preview changes without executing (default: true)" }
      },
      required: []
    }
  },

  auto_queue_maintenance: {
    name: "auto_queue_maintenance",
    description: "Queue vehicles for predictive maintenance based on risk scores and component health.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        city: { type: "string" },
        risk_threshold: { type: "number", description: "Queue vehicles with risk above threshold (default: 0.6)" },
        maintenance_types: {
          type: "array",
          items: { type: "string", enum: ["preventive", "predictive", "inspection", "software_update", "sensor_calibration"] }
        },
        priority: { type: "string", enum: ["critical", "high", "normal", "low"] },
        dry_run: { type: "boolean", description: "Preview changes without executing (default: true)" }
      },
      required: []
    }
  },

  auto_rebalance_fleet: {
    name: "auto_rebalance_fleet",
    description: "Suggest or execute fleet rebalancing between depots based on demand and capacity.",
    input: {
      type: "object",
      properties: {
        source_depot_id: { type: "string", description: "Depot to move vehicles from" },
        target_depot_id: { type: "string", description: "Depot to move vehicles to" },
        vehicle_count: { type: "number", description: "Number of vehicles to move" },
        selection_criteria: {
          type: "string",
          enum: ["highest_soc", "lowest_utilization", "nearest", "oldest_at_depot"],
          description: "How to select vehicles for rebalancing"
        },
        execute: { type: "boolean", description: "Execute the rebalance (default: false, preview only)" }
      },
      required: []
    }
  },

  create_otto_q_job: {
    name: "create_otto_q_job",
    description: "Create a new OTTO-Q job for a vehicle (charging, maintenance, detailing, or staging).",
    input: {
      type: "object",
      properties: {
        vehicle_id: { type: "string", description: "Vehicle to create job for" },
        job_type: { type: "string", enum: ["CHARGE", "MAINTENANCE", "DETAILING", "DOWNTIME_PARK"] },
        depot_id: { type: "string", description: "Target depot" },
        resource_type: { type: "string", enum: ["CHARGE_STALL", "CLEAN_DETAIL_STALL", "MAINTENANCE_BAY", "STAGING_STALL"] },
        priority: { type: "string", enum: ["critical", "high", "normal", "low"] },
        scheduled_start: { type: "string", description: "Scheduled start time (ISO format)" },
        estimated_duration_minutes: { type: "number" },
        notes: { type: "string", description: "Additional notes for the job" }
      },
      required: ["vehicle_id", "job_type"]
    }
  },

  get_charging_queue: {
    name: "get_charging_queue",
    description: "Get vehicles waiting/needing charge at a depot with priority rankings.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        include_wait_times: { type: "boolean", description: "Include estimated wait times" }
      },
      required: ["depot_id"]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: INCIDENT TRIAGE (4 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  triage_incidents: {
    name: "triage_incidents",
    description: "Smart incident triage with priority scoring and recommended actions. Use for incident overview and prioritization.",
    input: {
      type: "object",
      properties: {
        city: { type: "string" },
        status_filter: {
          type: "array",
          items: { type: "string", enum: ["Reported", "Dispatched", "Secured", "At Depot", "Closed"] }
        },
        severity_threshold: { type: "string", enum: ["critical", "high", "medium", "low"] },
        include_recommendations: { type: "boolean", description: "Include AI-generated recommendations" },
        time_range_hours: { type: "number", description: "Look back N hours (default: 24)" }
      },
      required: []
    }
  },

  quick_dispatch_ottow: {
    name: "quick_dispatch_ottow",
    description: "One-click OTTOW dispatch with smart vehicle selection. Use when user requests roadside assistance.",
    input: {
      type: "object",
      properties: {
        location: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lng: { type: "number" },
            address: { type: "string" }
          }
        },
        city: { type: "string", description: "City for dispatch" },
        incident_type: { type: "string", enum: ["collision", "malfunction", "interior", "vandalism", "other"] },
        urgency: { type: "string", enum: ["immediate", "urgent", "standard"] },
        auto_select_vehicle: { type: "boolean", description: "Auto-select best response vehicle (default: true)" },
        vehicle_id: { type: "string", description: "Specific vehicle involved in incident" },
        notes: { type: "string" }
      },
      required: ["city"]
    }
  },

  escalate_incident: {
    name: "escalate_incident",
    description: "Escalate an incident with notifications and priority bump.",
    input: {
      type: "object",
      properties: {
        incident_id: { type: "string" },
        escalation_reason: { type: "string" },
        notify_roles: {
          type: "array",
          items: { type: "string", enum: ["fleet_manager", "safety_team", "executive", "oem_contact", "legal"] }
        },
        new_priority: { type: "string", enum: ["critical", "high"] }
      },
      required: ["incident_id", "escalation_reason"]
    }
  },

  query_incidents: {
    name: "query_incidents",
    description: "Query incident history with filters. Use for incident analysis and reporting.",
    input: {
      type: "object",
      properties: {
        city: { type: "string" },
        vehicle_id: { type: "string" },
        incident_type: { type: "string", enum: ["collision", "malfunction", "interior", "vandalism"] },
        status: { type: "array", items: { type: "string" } },
        time_range: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" }
          }
        },
        limit: { type: "number" }
      },
      required: []
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: ANALYTICS & REPORTING (4 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  generate_fleet_snapshot: {
    name: "generate_fleet_snapshot",
    description: "Generate comprehensive fleet health snapshot with key metrics and alerts.",
    input: {
      type: "object",
      properties: {
        city: { type: "string" },
        depot_id: { type: "string" },
        include_sections: {
          type: "array",
          items: {
            type: "string",
            enum: ["vehicle_health", "charging_status", "maintenance_queue", "incident_summary",
                   "utilization", "revenue", "safety_metrics", "predictions", "alerts"]
          }
        },
        format: { type: "string", enum: ["summary", "detailed", "executive"] }
      },
      required: []
    }
  },

  compare_metrics: {
    name: "compare_metrics",
    description: "Compare metrics across depots, cities, OEMs, or time periods.",
    input: {
      type: "object",
      properties: {
        dimension: { type: "string", enum: ["depot", "city", "oem", "vehicle_type", "time_period"] },
        entities: { type: "array", items: { type: "string" }, description: "IDs or names to compare" },
        metrics: {
          type: "array",
          items: {
            type: "string",
            enum: ["utilization", "soc_avg", "incidents", "maintenance_cost", "revenue",
                   "uptime", "disengagement_rate", "customer_rating", "safety_score", "energy_efficiency"]
          }
        },
        time_range: {
          type: "object",
          properties: { start: { type: "string" }, end: { type: "string" } }
        }
      },
      required: ["dimension", "metrics"]
    }
  },

  detect_anomalies: {
    name: "detect_anomalies",
    description: "Detect anomalies in fleet telemetry, operations, or performance patterns.",
    input: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["vehicle", "depot", "city", "fleet"] },
        entity_id: { type: "string", description: "Specific entity to analyze" },
        anomaly_types: {
          type: "array",
          items: { type: "string", enum: ["soc_drain", "location", "sensor_drift", "unusual_idle", "cost_spike", "performance_drop"] }
        },
        sensitivity: { type: "string", enum: ["high", "medium", "low"] },
        time_window_hours: { type: "number", description: "Analysis window (default: 24)" }
      },
      required: []
    }
  },

  utilization_report: {
    name: "utilization_report",
    description: "Return stall utilization %, average wait, avg kWh delivered over a time range.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        city: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
        breakdown_by: { type: "string", enum: ["hour", "day", "resource_type"] }
      },
      required: ["start", "end"]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: SCHEDULING & OPTIMIZATION (3 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  schedule_vehicle: {
    name: "schedule_vehicle",
    description: "Assign a vehicle to a stall with start/end. Prevents double-bookings and suggests alternatives.",
    input: {
      type: "object",
      properties: {
        vehicle_id: { type: "string" },
        stall_id: { type: "string" },
        start: { type: "string", description: "ISO timestamp" },
        end: { type: "string", description: "ISO timestamp" }
      },
      required: ["vehicle_id", "stall_id", "start", "end"]
    }
  },

  optimize_schedule: {
    name: "optimize_schedule",
    description: "Optimize depot schedule for charging, maintenance, or mixed operations.",
    input: {
      type: "object",
      properties: {
        depot_id: { type: "string" },
        optimization_target: {
          type: "string",
          enum: ["minimize_wait", "maximize_throughput", "balance_load", "minimize_cost", "maximize_uptime"],
          description: "Primary optimization objective"
        },
        time_horizon_hours: { type: "number", description: "Hours to optimize (default: 8)" },
        constraints: {
          type: "object",
          properties: {
            max_concurrent_charging: { type: "number" },
            peak_power_limit_kw: { type: "number" },
            maintenance_bay_limit: { type: "number" },
            priority_vehicles: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["depot_id", "optimization_target"]
    }
  },

  bulk_schedule: {
    name: "bulk_schedule",
    description: "Schedule multiple vehicles for operations in batch with conflict resolution.",
    input: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              vehicle_id: { type: "string" },
              operation_type: { type: "string", enum: ["charge", "maintenance", "detailing", "staging"] },
              preferred_time: { type: "string", description: "ISO timestamp" },
              priority: { type: "string", enum: ["critical", "high", "normal", "low"] }
            }
          }
        },
        auto_resolve_conflicts: { type: "boolean", description: "Automatically resolve scheduling conflicts" },
        depot_id: { type: "string" }
      },
      required: ["operations"]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 7: GENERAL & KNOWLEDGE (2 tools)
  // ─────────────────────────────────────────────────────────────────────────────

  explain_concept: {
    name: "explain_concept",
    description: "Explain AV fleet concepts, regulations, best practices, or industry knowledge.",
    input: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Topic to explain (e.g., 'L4 autonomy', 'disengagement rate', 'DC fast charging')" },
        depth: { type: "string", enum: ["brief", "standard", "detailed"] },
        context: { type: "string", description: "Relate explanation to specific fleet context" }
      },
      required: ["topic"]
    }
  },

  search_knowledge_base: {
    name: "search_knowledge_base",
    description: "Search internal knowledge base for procedures, SOPs, documentation, and best practices.",
    input: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        categories: {
          type: "array",
          items: { type: "string", enum: ["procedures", "safety", "maintenance", "charging", "incidents", "regulations", "oem_specific"] }
        },
        oem: { type: "string", description: "Filter by OEM-specific documentation" }
      },
      required: ["query"]
    }
  }
} as const;

export type ToolName = keyof typeof Tools;

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL BINDING INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ToolBinding<I, O> {
  schema: typeof Tools[ToolName];
  handler: (input: I) => Promise<O>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL CATEGORIES FOR UI GROUPING
// ═══════════════════════════════════════════════════════════════════════════════

export const ToolCategories = {
  fleet_intelligence: ["query_vehicles", "query_depot_deep", "query_by_natural_language", "list_stalls"],
  predictive: ["predict_charging_needs", "predict_maintenance_risks", "predict_depot_demand", "predict_incident_likelihood"],
  automation: ["auto_queue_charging", "auto_queue_maintenance", "auto_rebalance_fleet", "create_otto_q_job", "get_charging_queue"],
  incident_triage: ["triage_incidents", "quick_dispatch_ottow", "escalate_incident", "query_incidents"],
  analytics: ["generate_fleet_snapshot", "compare_metrics", "detect_anomalies", "utilization_report"],
  scheduling: ["schedule_vehicle", "optimize_schedule", "bulk_schedule"],
  general: ["explain_concept", "search_knowledge_base"]
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Get all tool names as array for AI function calling
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllToolNames = (): ToolName[] => Object.keys(Tools) as ToolName[];

export const getToolsByCategory = (category: keyof typeof ToolCategories): ToolName[] => {
  return ToolCategories[category] as unknown as ToolName[];
};
