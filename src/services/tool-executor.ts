// src/services/tool-executor.ts
// Centralized Tool Executor for OttoCommand AI
// Handles execution of all 25 tools with consistent response formatting

import { ToolName, Tools, Vehicle, Priority } from "../agent/tools";
import { IntentClassifier, ClassifiedIntent } from "../agent/intent-classifier";
import { PredictiveEngine } from "./predictive-engine";
import { AutomationEngine, automationEngine } from "./automation-rules";
import { FleetSchedulingService } from "./scheduling";
import { fleetIntelligence, vehicles, stalls, depots, routes, maintenanceInsights, energyAnalytics, performanceMetrics } from "../data/mock";

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ToolExecutionResult {
  success: boolean;
  tool: ToolName;
  data: unknown;
  summary: string;
  insights?: string[];
  suggestedActions?: string[];
  confidence?: number;
  executionTimeMs?: number;
}

export interface FleetSnapshot {
  timestamp: string;
  summary: {
    totalVehicles: number;
    activeVehicles: number;
    chargingVehicles: number;
    maintenanceVehicles: number;
    idleVehicles: number;
    avgSoc: number;
    lowBatteryCount: number;
  };
  depotSummary: Array<{
    id: string;
    name: string;
    vehicleCount: number;
    utilizationPercent: number;
    availableStalls: number;
  }>;
  alerts: string[];
  predictions: {
    chargingNeeded: number;
    maintenanceRisks: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class ToolExecutor {

  /**
   * Execute a tool by name with given parameters
   */
  static async execute(
    toolName: ToolName,
    params: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      let result: ToolExecutionResult;

      switch (toolName) {
        // Fleet Intelligence
        case "query_vehicles":
          result = await this.executeQueryVehicles(params);
          break;
        case "query_depot_deep":
          result = await this.executeQueryDepotDeep(params);
          break;
        case "query_by_natural_language":
          result = await this.executeNaturalLanguageQuery(params);
          break;
        case "list_stalls":
          result = await this.executeListStalls(params);
          break;

        // Predictive
        case "predict_charging_needs":
          result = await this.executePredictCharging(params);
          break;
        case "predict_maintenance_risks":
          result = await this.executePredictMaintenance(params);
          break;
        case "predict_depot_demand":
          result = await this.executePredictDepotDemand(params);
          break;
        case "predict_incident_likelihood":
          result = await this.executePredictIncidents(params);
          break;

        // Automation
        case "auto_queue_charging":
          result = await this.executeAutoQueueCharging(params);
          break;
        case "auto_queue_maintenance":
          result = await this.executeAutoQueueMaintenance(params);
          break;
        case "auto_rebalance_fleet":
          result = await this.executeAutoRebalance(params);
          break;
        case "create_otto_q_job":
          result = await this.executeCreateJob(params);
          break;
        case "get_charging_queue":
          result = await this.executeGetChargingQueue(params);
          break;

        // Incident Triage
        case "triage_incidents":
          result = await this.executeTriageIncidents(params);
          break;
        case "quick_dispatch_ottow":
          result = await this.executeQuickDispatch(params);
          break;
        case "escalate_incident":
          result = await this.executeEscalateIncident(params);
          break;
        case "query_incidents":
          result = await this.executeQueryIncidents(params);
          break;

        // Analytics
        case "generate_fleet_snapshot":
          result = await this.executeGenerateSnapshot(params);
          break;
        case "compare_metrics":
          result = await this.executeCompareMetrics(params);
          break;
        case "detect_anomalies":
          result = await this.executeDetectAnomalies(params);
          break;
        case "utilization_report":
          result = await this.executeUtilizationReport(params);
          break;

        // Scheduling
        case "schedule_vehicle":
          result = await this.executeScheduleVehicle(params);
          break;
        case "optimize_schedule":
          result = await this.executeOptimizeSchedule(params);
          break;
        case "bulk_schedule":
          result = await this.executeBulkSchedule(params);
          break;

        // General
        case "explain_concept":
          result = await this.executeExplainConcept(params);
          break;
        case "search_knowledge_base":
          result = await this.executeSearchKnowledgeBase(params);
          break;

        default:
          result = {
            success: false,
            tool: toolName,
            data: null,
            summary: `Unknown tool: ${toolName}`
          };
      }

      result.executionTimeMs = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        tool: toolName,
        data: null,
        summary: `Error executing ${toolName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FLEET INTELLIGENCE TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executeQueryVehicles(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const filters = params.filters as Record<string, unknown> || {};
    const sortBy = params.sort_by as string;
    const limit = (params.limit as number) || 20;
    const includeTelemetry = params.include_telemetry as boolean;

    let result = [...vehicles];

    // Apply filters
    if (filters.city) {
      result = result.filter(v => v.city?.toLowerCase() === (filters.city as string).toLowerCase());
    }
    if (filters.depot_id) {
      result = result.filter(v => v.currentDepotId === filters.depot_id);
    }
    if (filters.status && Array.isArray(filters.status)) {
      result = result.filter(v => (filters.status as string[]).includes(v.status));
    }
    if (filters.oem) {
      result = result.filter(v => v.make?.toLowerCase() === (filters.oem as string).toLowerCase());
    }
    if (filters.autonomy_level) {
      result = result.filter(v => v.autonomyLevel === filters.autonomy_level);
    }
    if (filters.soc_range) {
      const range = filters.soc_range as { min?: number; max?: number };
      if (range.min !== undefined) {
        result = result.filter(v => (v.soc || 0) >= range.min!);
      }
      if (range.max !== undefined) {
        result = result.filter(v => (v.soc || 1) <= range.max!);
      }
    }
    if (filters.maintenance_due_within_days) {
      const days = filters.maintenance_due_within_days as number;
      const threshold = Date.now() + days * 86400000;
      result = result.filter(v => {
        if (!v.nextMaintenanceDate) return false;
        return new Date(v.nextMaintenanceDate).getTime() <= threshold;
      });
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        switch (sortBy) {
          case "soc_asc": return (a.soc || 0) - (b.soc || 0);
          case "soc_desc": return (b.soc || 0) - (a.soc || 0);
          case "mileage": return (b.mileage || 0) - (a.mileage || 0);
          case "revenue": return (b.revenuePerDay || 0) - (a.revenuePerDay || 0);
          case "safety_score": return (b.safetyScore || 0) - (a.safetyScore || 0);
          default: return 0;
        }
      });
    }

    // Apply limit
    result = result.slice(0, limit);

    // Prepare output
    const outputVehicles = result.map(v => ({
      id: v.id,
      name: `${v.make} ${v.model}`,
      status: v.status,
      soc: Math.round((v.soc || 0) * 100),
      city: v.city,
      depot: v.currentDepotId,
      autonomyLevel: v.autonomyLevel,
      safetyScore: v.safetyScore,
      ...(includeTelemetry && v.operationalMetrics ? { metrics: v.operationalMetrics } : {})
    }));

    const statusCounts = result.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      tool: "query_vehicles",
      data: {
        vehicles: outputVehicles,
        totalMatched: result.length,
        statusBreakdown: statusCounts
      },
      summary: `Found ${result.length} vehicles matching criteria`,
      insights: [
        `Average SOC: ${Math.round(result.reduce((sum, v) => sum + (v.soc || 0), 0) / result.length * 100)}%`,
        `${result.filter(v => (v.soc || 0) < 0.25).length} vehicles below 25% SOC`
      ]
    };
  }

  private static async executeQueryDepotDeep(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const depotId = params.depot_id as string;
    const city = params.city as string;
    const include = (params.include as string[]) || ["resources", "vehicles"];

    let targetDepots = [...depots];
    if (depotId) {
      targetDepots = targetDepots.filter(d => d.id === depotId);
    }
    if (city) {
      targetDepots = targetDepots.filter(d => d.name.toLowerCase().includes(city.toLowerCase()));
    }

    const depotData = targetDepots.map(depot => {
      const depotStalls = stalls.filter(s => s.depotId === depot.id);
      const depotVehicles = vehicles.filter(v => v.currentDepotId === depot.id);

      const result: Record<string, unknown> = {
        id: depot.id,
        name: depot.name,
        partner: depot.partner,
        utilization: depot.utilization,
        capacity: depot.capacity
      };

      if (include.includes("resources")) {
        result.resources = {
          totalStalls: depotStalls.length,
          openStalls: depotStalls.filter(s => s.status === "open").length,
          occupiedStalls: depotStalls.filter(s => s.status === "occupied").length,
          maintenanceBays: depot.maintenanceBays,
          chargingStations: depot.chargingStations
        };
      }

      if (include.includes("vehicles")) {
        result.vehicles = {
          total: depotVehicles.length,
          byStatus: depotVehicles.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          avgSoc: Math.round(depotVehicles.reduce((sum, v) => sum + (v.soc || 0), 0) / depotVehicles.length * 100)
        };
      }

      if (include.includes("energy")) {
        result.energy = {
          efficiency: depot.energyEfficiency,
          renewableUsage: energyAnalytics.renewableEnergyUsage,
          peakDemandHours: energyAnalytics.peakDemandHours
        };
      }

      return result;
    });

    return {
      success: true,
      tool: "query_depot_deep",
      data: depotData,
      summary: `Retrieved data for ${depotData.length} depot(s)`,
      insights: depotData.map(d => `${(d as Record<string, unknown>).name}: ${Math.round(((d as Record<string, unknown>).utilization as number) * 100)}% utilized`)
    };
  }

  private static async executeNaturalLanguageQuery(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = params.query as string;

    // Classify the intent
    const classified = IntentClassifier.classify(query);

    // Execute appropriate tool based on classification
    if (classified.suggestedTools.length > 0) {
      const primaryTool = classified.suggestedTools[0];

      // Build params from entities
      const toolParams: Record<string, unknown> = {};

      if (classified.entities.cities?.length) {
        toolParams.city = classified.entities.cities[0];
      }
      if (classified.entities.vehicleIds?.length) {
        toolParams.vehicle_ids = classified.entities.vehicleIds;
      }
      if (classified.entities.depotIds?.length) {
        toolParams.depot_id = classified.entities.depotIds[0];
      }
      if (classified.entities.statuses?.length) {
        toolParams.filters = { status: classified.entities.statuses };
      }
      if (classified.entities.thresholds?.length) {
        const threshold = classified.entities.thresholds[0];
        if (threshold.metric === "soc") {
          toolParams.filters = {
            ...(toolParams.filters as Record<string, unknown> || {}),
            soc_range: threshold.operator === "<"
              ? { max: (threshold.value as number) / 100 }
              : { min: (threshold.value as number) / 100 }
          };
        }
      }

      // Execute the tool
      const result = await this.execute(primaryTool, toolParams);

      return {
        ...result,
        tool: "query_by_natural_language",
        summary: `Interpreted as "${classified.intent}" query. ${result.summary}`,
        insights: [
          `Confidence: ${Math.round(classified.confidence * 100)}%`,
          ...(result.insights || [])
        ]
      };
    }

    return {
      success: true,
      tool: "query_by_natural_language",
      data: {
        intent: classified.intent,
        entities: classified.entities,
        confidence: classified.confidence
      },
      summary: `Classified query as "${classified.intent}" with ${Math.round(classified.confidence * 100)}% confidence`,
      suggestedActions: IntentClassifier.getSuggestedFollowUps(classified.intent, classified.entities)
    };
  }

  private static async executeListStalls(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const depotId = params.depot_id as string;
    const status = params.status as string | undefined;

    let result = stalls.filter(s => s.depotId === depotId);
    if (status) {
      result = result.filter(s => s.status === status);
    }

    const stallSummary = result.map(s => ({
      id: s.id,
      status: s.status,
      powerKW: s.powerKW,
      connector: s.connector,
      utilizationRate: s.utilizationRate
    }));

    return {
      success: true,
      tool: "list_stalls",
      data: {
        stalls: stallSummary,
        total: result.length,
        byStatus: result.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      summary: `Found ${result.length} stalls at depot ${depotId}${status ? ` with status "${status}"` : ""}`
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PREDICTIVE TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executePredictCharging(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = PredictiveEngine.predictChargingNeeds({
      horizonHours: params.horizon_hours as number,
      city: params.city as string,
      depotId: params.depot_id as string,
      socThreshold: (params.soc_threshold as number) ? (params.soc_threshold as number) / 100 : undefined,
      includeRecommendations: params.include_recommendations as boolean
    });

    return {
      success: true,
      tool: "predict_charging_needs",
      data: result.prediction,
      summary: `Identified ${result.prediction.length} vehicles needing charging within forecast window`,
      insights: [
        `${result.prediction.filter(p => p.urgency === "critical").length} critical`,
        `${result.prediction.filter(p => p.urgency === "high").length} high priority`
      ],
      confidence: result.confidence,
      suggestedActions: result.prediction.slice(0, 3).map(p =>
        `Queue ${p.vehicleId} for charging (${p.currentSoc}% SOC)`
      )
    };
  }

  private static async executePredictMaintenance(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = PredictiveEngine.predictMaintenanceRisks({
      riskThreshold: params.risk_threshold as number,
      categories: params.categories as string[],
      city: params.city as string,
      vehicleIds: params.vehicle_ids as string[]
    });

    return {
      success: true,
      tool: "predict_maintenance_risks",
      data: result.prediction,
      summary: `Identified ${result.prediction.length} vehicles with elevated maintenance risk`,
      insights: result.prediction.slice(0, 3).map(p =>
        `${p.vehicleId}: ${Math.round(p.riskScore * 100)}% risk - ${p.category}`
      ),
      confidence: result.confidence
    };
  }

  private static async executePredictDepotDemand(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = PredictiveEngine.predictDepotDemand({
      depotId: params.depot_id as string,
      horizonHours: params.horizon_hours as number,
      resourceTypes: params.resource_types as string[],
      granularity: params.granularity as "hourly" | "shift" | "daily"
    });

    return {
      success: true,
      tool: "predict_depot_demand",
      data: result.prediction,
      summary: `Generated demand forecast for ${result.prediction.depotName}`,
      insights: result.prediction.recommendations,
      confidence: result.confidence
    };
  }

  private static async executePredictIncidents(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = PredictiveEngine.predictIncidentLikelihood({
      city: params.city as string,
      vehicleIds: params.vehicle_ids as string[],
      includeFactors: params.include_factors as boolean,
      routeIds: params.route_ids as string[]
    });

    return {
      success: true,
      tool: "predict_incident_likelihood",
      data: result.prediction,
      summary: `Assessed incident risk for ${result.prediction.length} vehicles`,
      insights: result.factors.map(f => f.description),
      confidence: result.confidence
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTOMATION TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executeAutoQueueCharging(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = automationEngine.autoQueueCharging({
      depotId: params.depot_id as string,
      city: params.city as string,
      strategy: params.strategy as "urgent_first" | "balanced" | "off_peak" | "revenue_optimal",
      maxConcurrent: params.max_concurrent as number,
      socTarget: params.soc_target as number,
      socThreshold: params.soc_threshold as number,
      dryRun: params.dry_run !== false
    });

    return {
      success: result.success,
      tool: "auto_queue_charging",
      data: result,
      summary: result.summary,
      suggestedActions: result.vehiclesQueued.slice(0, 5).map(v =>
        `Confirm charging for ${v.vehicleId} (${v.priority} priority)`
      )
    };
  }

  private static async executeAutoQueueMaintenance(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = automationEngine.autoQueueMaintenance({
      depotId: params.depot_id as string,
      city: params.city as string,
      riskThreshold: params.risk_threshold as number,
      maintenanceTypes: params.maintenance_types as string[],
      priority: params.priority as Priority,
      dryRun: params.dry_run !== false
    });

    return {
      success: result.success,
      tool: "auto_queue_maintenance",
      data: result,
      summary: result.summary
    };
  }

  private static async executeAutoRebalance(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = automationEngine.autoRebalanceFleet({
      sourceDepotId: params.source_depot_id as string,
      targetDepotId: params.target_depot_id as string,
      vehicleCount: params.vehicle_count as number,
      selectionCriteria: params.selection_criteria as "highest_soc" | "lowest_utilization" | "nearest" | "oldest_at_depot",
      execute: params.execute === true
    });

    return {
      success: result.success,
      tool: "auto_rebalance_fleet",
      data: result,
      summary: result.recommendation,
      insights: result.vehiclesToMove.map(v => `${v.vehicleId}: ${v.from} → ${v.to}`)
    };
  }

  private static async executeCreateJob(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const vehicleId = params.vehicle_id as string;
    const jobType = params.job_type as string;
    const vehicle = vehicles.find(v => v.id === vehicleId);

    if (!vehicle) {
      return {
        success: false,
        tool: "create_otto_q_job",
        data: null,
        summary: `Vehicle ${vehicleId} not found`
      };
    }

    const job = {
      id: `JOB-${Date.now()}`,
      vehicleId,
      jobType,
      depotId: params.depot_id || vehicle.currentDepotId,
      resourceType: params.resource_type,
      priority: params.priority || "normal",
      scheduledStart: params.scheduled_start || new Date().toISOString(),
      estimatedDuration: params.estimated_duration_minutes || 60,
      notes: params.notes,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      tool: "create_otto_q_job",
      data: job,
      summary: `Created ${jobType} job for ${vehicleId}`,
      insights: [`Job ID: ${job.id}`, `Priority: ${job.priority}`]
    };
  }

  private static async executeGetChargingQueue(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const depotId = params.depot_id as string;
    const result = FleetSchedulingService.getChargingQueue(depotId);

    return {
      success: true,
      tool: "get_charging_queue",
      data: result,
      summary: `${result.queueLength} vehicles in charging queue`,
      insights: [
        `Estimated wait: ${result.estimatedWaitTime} minutes`,
        `Top priority: ${result.priorityVehicles[0]?.vehicleId || "None"}`
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INCIDENT TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executeTriageIncidents(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    // Simulated incident data
    const incidents = [
      { id: "INC-001", type: "malfunction", status: "Reported", severity: "high", vehicleId: "WM-PAC-05", city: "Nashville" },
      { id: "INC-002", type: "collision", status: "Dispatched", severity: "critical", vehicleId: "ZX-GEN1-07", city: "Austin" },
      { id: "INC-003", type: "interior", status: "Secured", severity: "low", vehicleId: "TE-MOD3-06", city: "Nashville" }
    ];

    let filtered = incidents;
    if (params.city) {
      filtered = filtered.filter(i => i.city.toLowerCase() === (params.city as string).toLowerCase());
    }
    if (params.status_filter && Array.isArray(params.status_filter)) {
      filtered = filtered.filter(i => (params.status_filter as string[]).includes(i.status));
    }

    const triaged = filtered.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[a.severity as keyof typeof severityOrder] || 4) -
             (severityOrder[b.severity as keyof typeof severityOrder] || 4);
    });

    return {
      success: true,
      tool: "triage_incidents",
      data: triaged,
      summary: `${triaged.length} incidents requiring attention`,
      insights: [
        `${triaged.filter(i => i.severity === "critical").length} critical`,
        `${triaged.filter(i => i.severity === "high").length} high priority`
      ],
      suggestedActions: triaged.filter(i => i.severity === "critical").map(i =>
        `Dispatch OTTOW for ${i.id} (${i.type})`
      )
    };
  }

  private static async executeQuickDispatch(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const city = params.city as string;
    const incidentType = params.incident_type as string || "malfunction";
    const urgency = params.urgency as string || "standard";

    const incidentId = `INC-${Date.now()}`;

    return {
      success: true,
      tool: "quick_dispatch_ottow",
      data: {
        incidentId,
        city,
        type: incidentType,
        urgency,
        status: "Dispatched",
        dispatchedAt: new Date().toISOString(),
        eta: `${15 + Math.floor(Math.random() * 20)} minutes`
      },
      summary: `OTTOW dispatched to ${city} for ${incidentType} incident`,
      insights: [`Incident ID: ${incidentId}`, `Urgency: ${urgency}`]
    };
  }

  private static async executeEscalateIncident(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const incidentId = params.incident_id as string;
    const reason = params.escalation_reason as string;
    const notifyRoles = params.notify_roles as string[] || ["fleet_manager"];

    return {
      success: true,
      tool: "escalate_incident",
      data: {
        incidentId,
        escalatedAt: new Date().toISOString(),
        reason,
        notifiedRoles: notifyRoles,
        newPriority: params.new_priority || "high"
      },
      summary: `Incident ${incidentId} escalated`,
      insights: [`Notified: ${notifyRoles.join(", ")}`]
    };
  }

  private static async executeQueryIncidents(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    // Return mock incident history
    return {
      success: true,
      tool: "query_incidents",
      data: {
        incidents: [],
        total: 0,
        filters: params
      },
      summary: "No incidents match the specified criteria"
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYTICS TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executeGenerateSnapshot(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const city = params.city as string;

    let targetVehicles = [...vehicles];
    if (city) {
      targetVehicles = targetVehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
    }

    const predictionSummary = PredictiveEngine.getFleetPredictionSummary(city);

    const snapshot: FleetSnapshot = {
      timestamp: new Date().toISOString(),
      summary: {
        totalVehicles: targetVehicles.length,
        activeVehicles: targetVehicles.filter(v => v.status === "active").length,
        chargingVehicles: targetVehicles.filter(v => v.status === "charging").length,
        maintenanceVehicles: targetVehicles.filter(v => v.status === "maintenance").length,
        idleVehicles: targetVehicles.filter(v => v.status === "idle").length,
        avgSoc: Math.round(targetVehicles.reduce((sum, v) => sum + (v.soc || 0), 0) / targetVehicles.length * 100),
        lowBatteryCount: targetVehicles.filter(v => (v.soc || 0) < 0.25).length
      },
      depotSummary: depots.map(d => ({
        id: d.id,
        name: d.name,
        vehicleCount: targetVehicles.filter(v => v.currentDepotId === d.id).length,
        utilizationPercent: Math.round(d.utilization * 100),
        availableStalls: stalls.filter(s => s.depotId === d.id && s.status === "open").length
      })),
      alerts: predictionSummary.recommendations,
      predictions: {
        chargingNeeded: predictionSummary.chargingNeeds.total,
        maintenanceRisks: predictionSummary.maintenanceRisks.total
      }
    };

    return {
      success: true,
      tool: "generate_fleet_snapshot",
      data: snapshot,
      summary: `Fleet snapshot generated for ${targetVehicles.length} vehicles`,
      insights: [
        `Average SOC: ${snapshot.summary.avgSoc}%`,
        `${snapshot.summary.lowBatteryCount} vehicles need charging`,
        ...snapshot.alerts
      ]
    };
  }

  private static async executeCompareMetrics(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const dimension = params.dimension as string;
    const metrics = params.metrics as string[];
    const entities = params.entities as string[];

    const comparisons: Record<string, Record<string, number>> = {};

    if (dimension === "city") {
      const cities = entities || ["Nashville", "Austin", "LA"];
      for (const city of cities) {
        const cityVehicles = vehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
        comparisons[city] = {};
        for (const metric of metrics) {
          switch (metric) {
            case "soc_avg":
              comparisons[city][metric] = Math.round(
                cityVehicles.reduce((sum, v) => sum + (v.soc || 0), 0) / cityVehicles.length * 100
              );
              break;
            case "utilization":
              comparisons[city][metric] = Math.round(
                cityVehicles.reduce((sum, v) => sum + (v.operationalMetrics?.utilizationRate || 0), 0) /
                cityVehicles.length * 100
              );
              break;
            case "safety_score":
              comparisons[city][metric] = Math.round(
                cityVehicles.reduce((sum, v) => sum + (v.safetyScore || 0), 0) / cityVehicles.length
              );
              break;
            case "revenue":
              comparisons[city][metric] = Math.round(
                cityVehicles.reduce((sum, v) => sum + (v.revenuePerDay || 0), 0)
              );
              break;
          }
        }
      }
    }

    return {
      success: true,
      tool: "compare_metrics",
      data: comparisons,
      summary: `Compared ${metrics.length} metrics across ${Object.keys(comparisons).length} ${dimension}s`,
      insights: Object.entries(comparisons).map(([entity, values]) =>
        `${entity}: ${Object.entries(values).map(([k, v]) => `${k}=${v}`).join(", ")}`
      )
    };
  }

  private static async executeDetectAnomalies(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const scope = params.scope as string || "fleet";
    const sensitivity = params.sensitivity as string || "medium";

    // Simulated anomaly detection
    const anomalies = [
      { type: "soc_drain", vehicleId: "WM-PAC-12", severity: "high", description: "Unusual SOC drain rate detected" },
      { type: "unusual_idle", vehicleId: "ZX-GEN2-25", severity: "medium", description: "Vehicle idle for extended period" }
    ];

    const filteredAnomalies = sensitivity === "low" ? anomalies.filter(a => a.severity === "high") : anomalies;

    return {
      success: true,
      tool: "detect_anomalies",
      data: filteredAnomalies,
      summary: `Detected ${filteredAnomalies.length} anomalies at ${sensitivity} sensitivity`,
      insights: filteredAnomalies.map(a => `${a.vehicleId}: ${a.description}`)
    };
  }

  private static async executeUtilizationReport(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const depotId = params.depot_id as string;
    const city = params.city as string;

    let targetDepots = [...depots];
    if (depotId) {
      targetDepots = targetDepots.filter(d => d.id === depotId);
    }
    if (city) {
      targetDepots = targetDepots.filter(d => d.name.toLowerCase().includes(city.toLowerCase()));
    }

    const reports = targetDepots.map(depot => {
      const depotStalls = stalls.filter(s => s.depotId === depot.id);
      return {
        depotId: depot.id,
        depotName: depot.name,
        utilizationPercent: Math.round(depot.utilization * 100),
        avgWaitTime: Math.round(Math.random() * 30 + 15),
        avgKwhDelivered: Math.round(Math.random() * 50 + 30),
        totalStalls: depotStalls.length,
        openStalls: depotStalls.filter(s => s.status === "open").length,
        energyEfficiency: depot.energyEfficiency
      };
    });

    return {
      success: true,
      tool: "utilization_report",
      data: reports,
      summary: `Generated utilization report for ${reports.length} depot(s)`,
      insights: reports.map(r => `${r.depotName}: ${r.utilizationPercent}% utilized, ${r.openStalls} stalls available`)
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEDULING TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executeScheduleVehicle(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const result = FleetSchedulingService.scheduleVehicle(
      params.vehicle_id as string,
      params.stall_id as string,
      params.start as string,
      params.end as string
    );

    return {
      success: result.success,
      tool: "schedule_vehicle",
      data: result,
      summary: result.success
        ? `Scheduled ${params.vehicle_id} at stall ${params.stall_id}`
        : `Scheduling failed: ${result.conflicts?.join(", ")}`,
      insights: result.recommendations
    };
  }

  private static async executeOptimizeSchedule(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const depotId = params.depot_id as string;
    const target = params.optimization_target as string;
    const insights = FleetSchedulingService.getOptimizationInsights(depotId);

    return {
      success: true,
      tool: "optimize_schedule",
      data: {
        depotId,
        target,
        utilizationScore: insights.utilizationScore,
        recommendations: insights.recommendations,
        criticalAlerts: insights.criticalAlerts,
        efficiencyMetrics: insights.efficiencyMetrics
      },
      summary: `Optimization analysis for "${target}" objective`,
      insights: insights.recommendations
    };
  }

  private static async executeBulkSchedule(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const operations = params.operations as Array<Record<string, unknown>>;
    const results = operations.map(op => ({
      vehicleId: op.vehicle_id,
      operationType: op.operation_type,
      status: "scheduled",
      scheduledTime: op.preferred_time || new Date().toISOString()
    }));

    return {
      success: true,
      tool: "bulk_schedule",
      data: results,
      summary: `Scheduled ${results.length} operations`,
      insights: results.map(r => `${r.vehicleId}: ${r.operationType} at ${r.scheduledTime}`)
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GENERAL TOOLS
  // ─────────────────────────────────────────────────────────────────────────────

  private static async executeExplainConcept(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const topic = params.topic as string;
    const depth = params.depth as string || "standard";

    const explanations: Record<string, { brief: string; standard: string; detailed: string }> = {
      "l4 autonomy": {
        brief: "L4 = High Driving Automation - vehicle handles all driving in specific conditions without human intervention.",
        standard: "Level 4 autonomy means the vehicle can handle all driving tasks in specific operational design domains (ODD) without human intervention. The vehicle can safely stop itself if conditions exceed its capabilities. Examples include Waymo and Cruise robotaxis operating in defined urban areas.",
        detailed: "Level 4 (High Driving Automation) represents vehicles that can perform all driving functions within a specific operational design domain (ODD). Key characteristics: 1) No human driver needed within ODD, 2) Vehicle can handle edge cases and make safe stops, 3) Geographic/weather limitations may apply, 4) Common in robotaxi/shuttle deployments. Waymo operates L4 in San Francisco, Phoenix, and Austin. Disengagement rates for L4 are typically measured in miles per disengagement (MPD), with leaders achieving 10,000+ MPD."
      },
      "l5 autonomy": {
        brief: "L5 = Full Driving Automation - vehicle can drive anywhere, anytime, in any condition without restrictions.",
        standard: "Level 5 represents full driving automation with no operational design domain restrictions. The vehicle can operate in any condition where a human could drive. Currently, no production L5 vehicles exist - Zoox aims for this level with their purpose-built robotaxi.",
        detailed: "Level 5 (Full Driving Automation) is the theoretical end-state where vehicles can drive anywhere a human can, under any conditions. Key points: 1) No ODD restrictions, 2) No steering wheel/pedals needed, 3) Can handle all edge cases globally, 4) Currently aspirational - no true L5 exists in production. Zoox's purpose-built vehicle is designed toward L5 capabilities with its symmetrical bi-directional design."
      },
      "disengagement rate": {
        brief: "Frequency at which the autonomous system requires human intervention, measured in miles per disengagement (MPD).",
        standard: "Disengagement rate measures how often the autonomous driving system hands control back to a human or requires intervention. Reported as Miles Per Disengagement (MPD). Higher MPD = better. Waymo leads with 13,000+ MPD. Critical for assessing AV safety and reliability.",
        detailed: "Disengagement rate is a key AV safety metric representing how often the autonomous system disengages from self-driving mode. Calculation: Total autonomous miles / Number of disengagements. Context: Waymo achieves ~13,000 MPD, Cruise ~5,000 MPD. Important caveats: 1) Not all disengagements indicate safety issues, 2) ODD complexity affects rates, 3) California DMV requires annual reporting, 4) Complement with other metrics like collision rates and safety critical events per mile."
      },
      "soc": {
        brief: "State of Charge - the battery's current charge level as a percentage of total capacity.",
        standard: "State of Charge (SOC) represents the current energy stored in an EV battery as a percentage of its total capacity. 100% = fully charged, 0% = depleted. For fleet operations, optimal SOC window is typically 20-80% to maximize battery longevity.",
        detailed: "State of Charge (SOC) is the primary metric for EV battery status. Key considerations for fleet management: 1) Target 20-80% range for daily operations (reduces degradation), 2) DC fast charging most efficient between 20-80%, 3) SOC accuracy decreases at extremes, 4) Ambient temperature affects usable range, 5) Predictive SOC accounts for planned routes and driving patterns. For autonomous fleets, maintaining vehicles above 25% SOC ensures operational flexibility."
      }
    };

    const normalizedTopic = topic.toLowerCase();
    const explanation = explanations[normalizedTopic];

    if (explanation) {
      return {
        success: true,
        tool: "explain_concept",
        data: {
          topic,
          explanation: explanation[depth as keyof typeof explanation] || explanation.standard
        },
        summary: `Explanation for "${topic}"`,
        insights: depth === "detailed" ? ["See comprehensive explanation above"] : []
      };
    }

    return {
      success: true,
      tool: "explain_concept",
      data: { topic, explanation: `I can provide information about ${topic} in the context of autonomous fleet operations.` },
      summary: `General information about "${topic}"`
    };
  }

  private static async executeSearchKnowledgeBase(params: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = params.query as string;
    const categories = params.categories as string[];

    // Simulated knowledge base results
    const results = [
      { title: "Fleet Charging Best Practices", category: "charging", relevance: 0.9 },
      { title: "Incident Response Protocol", category: "safety", relevance: 0.8 },
      { title: "Predictive Maintenance Guidelines", category: "maintenance", relevance: 0.7 }
    ];

    const filtered = categories?.length
      ? results.filter(r => categories.includes(r.category))
      : results;

    return {
      success: true,
      tool: "search_knowledge_base",
      data: filtered,
      summary: `Found ${filtered.length} knowledge base articles for "${query}"`
    };
  }
}

export default ToolExecutor;
