// src/services/automation-rules.ts
// OTTO-Q Automation Rules Engine for OttoCommand AI
// Enables proactive fleet management through configurable triggers and actions

import { Priority, JobType, ResourceType } from "../agent/tools";
import { PredictiveEngine } from "./predictive-engine";
import { vehicles as mockVehicles, depots } from "../data/mock";

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TriggerType =
  | "soc_threshold"
  | "maintenance_due"
  | "prediction_confidence"
  | "incident_created"
  | "vehicle_idle"
  | "depot_capacity"
  | "schedule"
  | "anomaly_detected";

export type ActionType =
  | "create_ottoq_job"
  | "send_notification"
  | "escalate_incident"
  | "update_vehicle_status"
  | "queue_for_charging"
  | "queue_for_maintenance"
  | "create_alert"
  | "execute_rebalance";

export interface AutomationTrigger {
  type: TriggerType;
  threshold?: number;
  direction?: "below" | "above";
  daysUntil?: number;
  predictionType?: string;
  severity?: string[];
  durationMinutes?: number;
  resourceType?: string;
  cron?: string;
  anomalyType?: string;
}

export interface AutomationCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "in" | "contains" | "between";
  value: string | number | boolean | string[] | [number, number];
}

export interface AutomationAction {
  type: ActionType;
  jobType?: JobType;
  priority?: Priority;
  channels?: string[];
  template?: string;
  notifyRoles?: string[];
  status?: string;
  strategy?: string;
  maintenanceType?: string;
  severity?: string;
  message?: string;
  targetDepotId?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cooldownMinutes: number;
  lastTriggered?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  vehiclesAffected: string[];
  actionsExecuted: string[];
  success: boolean;
  message: string;
  dryRun: boolean;
}

export interface AutoQueueResult {
  success: boolean;
  vehiclesQueued: Array<{
    vehicleId: string;
    vehicleName: string;
    jobType: JobType;
    priority: Priority;
    reason: string;
    estimatedStart?: string;
  }>;
  vehiclesSkipped: Array<{
    vehicleId: string;
    reason: string;
  }>;
  summary: string;
  dryRun: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT AUTOMATION RULES
// ═══════════════════════════════════════════════════════════════════════════════

export const defaultAutomationRules: AutomationRule[] = [
  {
    id: "auto-charge-critical",
    name: "Critical SOC Auto-Charging",
    description: "Automatically queue vehicles with SOC < 15% for charging",
    enabled: true,
    trigger: { type: "soc_threshold", threshold: 15, direction: "below" },
    conditions: [
      { field: "status", operator: "ne", value: "charging" },
      { field: "status", operator: "ne", value: "maintenance" }
    ],
    actions: [
      { type: "create_ottoq_job", jobType: "CHARGE", priority: "critical" },
      { type: "send_notification", channels: ["slack"], template: "critical_soc_alert" },
      { type: "create_alert", severity: "critical", message: "Vehicle SOC critically low" }
    ],
    cooldownMinutes: 30,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "auto-charge-low",
    name: "Low SOC Auto-Charging",
    description: "Queue vehicles with SOC < 25% for charging during non-peak hours",
    enabled: true,
    trigger: { type: "soc_threshold", threshold: 25, direction: "below" },
    conditions: [
      { field: "status", operator: "ne", value: "charging" },
      { field: "status", operator: "ne", value: "maintenance" },
      { field: "status", operator: "ne", value: "active" }
    ],
    actions: [
      { type: "queue_for_charging", strategy: "balanced", priority: "high" }
    ],
    cooldownMinutes: 60,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "predictive-maintenance-queue",
    name: "Predictive Maintenance Auto-Queue",
    description: "Queue vehicles when maintenance risk > 70%",
    enabled: true,
    trigger: { type: "prediction_confidence", predictionType: "maintenance_risk", threshold: 0.7 },
    conditions: [],
    actions: [
      { type: "queue_for_maintenance", maintenanceType: "predictive", priority: "high" },
      { type: "create_alert", severity: "high", message: "Predictive maintenance scheduled" }
    ],
    cooldownMinutes: 1440, // 24 hours
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "maintenance-due-alert",
    name: "Maintenance Due Alert",
    description: "Alert when vehicle maintenance is due within 7 days",
    enabled: true,
    trigger: { type: "maintenance_due", daysUntil: 7 },
    conditions: [],
    actions: [
      { type: "send_notification", channels: ["email", "slack"], template: "maintenance_due" },
      { type: "create_alert", severity: "medium", message: "Scheduled maintenance approaching" }
    ],
    cooldownMinutes: 1440,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "incident-auto-escalate",
    name: "Critical Incident Auto-Escalation",
    description: "Auto-escalate collision incidents",
    enabled: true,
    trigger: { type: "incident_created", severity: ["collision"] },
    conditions: [],
    actions: [
      { type: "escalate_incident", notifyRoles: ["fleet_manager", "safety_team"] },
      { type: "send_notification", channels: ["sms", "slack"], template: "collision_alert" }
    ],
    cooldownMinutes: 0, // No cooldown for critical incidents
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "overnight-charging-optimization",
    name: "Overnight Charging Optimization",
    description: "Optimize charging schedule during off-peak hours (10 PM)",
    enabled: true,
    trigger: { type: "schedule", cron: "0 22 * * *" },
    conditions: [],
    actions: [
      { type: "queue_for_charging", strategy: "off_peak" }
    ],
    cooldownMinutes: 1440,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "idle-vehicle-staging",
    name: "Idle Vehicle Auto-Staging",
    description: "Move idle vehicles to staging after 2 hours",
    enabled: true,
    trigger: { type: "vehicle_idle", durationMinutes: 120 },
    conditions: [
      { field: "soc", operator: "gt", value: 0.50 }
    ],
    actions: [
      { type: "create_ottoq_job", jobType: "DOWNTIME_PARK", priority: "low" }
    ],
    cooldownMinutes: 240,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "depot-capacity-alert",
    name: "Depot Capacity Alert",
    description: "Alert when depot charging capacity exceeds 90%",
    enabled: true,
    trigger: { type: "depot_capacity", resourceType: "CHARGE_STALL", threshold: 90, direction: "above" },
    conditions: [],
    actions: [
      { type: "send_notification", channels: ["slack"], template: "capacity_warning" },
      { type: "create_alert", severity: "high", message: "Depot charging capacity near limit" }
    ],
    cooldownMinutes: 60,
    executionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class AutomationEngine {
  private rules: AutomationRule[];
  private executionLog: AutomationExecution[];

  constructor(rules?: AutomationRule[]) {
    this.rules = rules || [...defaultAutomationRules];
    this.executionLog = [];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RULE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  getRules(): AutomationRule[] {
    return this.rules;
  }

  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.find(r => r.id === ruleId);
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  addRule(rule: Omit<AutomationRule, "executionCount" | "createdAt" | "updatedAt">): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.rules.push(newRule);
    return newRule;
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-QUEUE OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Auto-queue vehicles for charging based on SOC and strategy
   */
  autoQueueCharging(params: {
    depotId?: string;
    city?: string;
    strategy?: "urgent_first" | "balanced" | "off_peak" | "revenue_optimal";
    maxConcurrent?: number;
    socTarget?: number;
    socThreshold?: number;
    dryRun?: boolean;
  }): AutoQueueResult {
    const {
      depotId,
      city,
      strategy = "balanced",
      maxConcurrent = 10,
      socTarget = 80,
      socThreshold = 40,
      dryRun = true
    } = params;

    // Get vehicles needing charging
    let targetVehicles = [...mockVehicles];
    if (city) {
      targetVehicles = targetVehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
    }
    if (depotId) {
      targetVehicles = targetVehicles.filter(v => v.currentDepotId === depotId);
    }

    // Filter by SOC threshold and status
    const eligibleVehicles = targetVehicles.filter(v =>
      (v.soc || 1) * 100 < socThreshold &&
      v.status !== "charging" &&
      v.status !== "maintenance"
    );

    // Sort based on strategy
    const sortedVehicles = this.sortByStrategy(eligibleVehicles, strategy);

    // Limit concurrent
    const vehiclesToQueue = sortedVehicles.slice(0, maxConcurrent);

    // Build result
    const vehiclesQueued = vehiclesToQueue.map(v => {
      const priority = this.determineChargingPriority(v);
      return {
        vehicleId: v.id,
        vehicleName: `${v.make} ${v.model}`,
        jobType: "CHARGE" as JobType,
        priority,
        reason: `SOC at ${Math.round((v.soc || 0) * 100)}% - below ${socThreshold}% threshold`,
        estimatedStart: new Date(Date.now() + Math.random() * 3600000).toISOString()
      };
    });

    const vehiclesSkipped = sortedVehicles.slice(maxConcurrent).map(v => ({
      vehicleId: v.id,
      reason: `Exceeds concurrent limit of ${maxConcurrent}`
    }));

    // Add already charging/maintenance vehicles
    const alreadyProcessing = targetVehicles.filter(v =>
      v.status === "charging" || v.status === "maintenance"
    );
    alreadyProcessing.forEach(v => {
      vehiclesSkipped.push({
        vehicleId: v.id,
        reason: `Already ${v.status}`
      });
    });

    return {
      success: true,
      vehiclesQueued,
      vehiclesSkipped,
      summary: `${dryRun ? "[DRY RUN] " : ""}Queued ${vehiclesQueued.length} vehicles for charging using "${strategy}" strategy`,
      dryRun
    };
  }

  /**
   * Auto-queue vehicles for maintenance based on risk scores
   */
  autoQueueMaintenance(params: {
    depotId?: string;
    city?: string;
    riskThreshold?: number;
    maintenanceTypes?: string[];
    priority?: Priority;
    dryRun?: boolean;
  }): AutoQueueResult {
    const {
      depotId,
      city,
      riskThreshold = 0.6,
      maintenanceTypes,
      priority = "normal",
      dryRun = true
    } = params;

    // Get maintenance predictions
    const predictions = PredictiveEngine.predictMaintenanceRisks({
      city,
      riskThreshold,
      categories: maintenanceTypes
    });

    // Filter by depot if specified
    let riskVehicles = predictions.prediction;
    if (depotId) {
      const depotVehicleIds = mockVehicles
        .filter(v => v.currentDepotId === depotId)
        .map(v => v.id);
      riskVehicles = riskVehicles.filter(r => depotVehicleIds.includes(r.vehicleId));
    }

    const vehiclesQueued = riskVehicles.map(risk => ({
      vehicleId: risk.vehicleId,
      vehicleName: risk.vehicleName,
      jobType: "MAINTENANCE" as JobType,
      priority: risk.urgency,
      reason: `Risk score: ${Math.round(risk.riskScore * 100)}% - ${risk.recommendedAction}`,
      estimatedStart: new Date(Date.now() + 86400000).toISOString() // Next day
    }));

    return {
      success: true,
      vehiclesQueued,
      vehiclesSkipped: [],
      summary: `${dryRun ? "[DRY RUN] " : ""}Identified ${vehiclesQueued.length} vehicles for maintenance based on risk threshold ${riskThreshold * 100}%`,
      dryRun
    };
  }

  /**
   * Auto-rebalance fleet between depots
   */
  autoRebalanceFleet(params: {
    sourceDepotId?: string;
    targetDepotId?: string;
    vehicleCount?: number;
    selectionCriteria?: "highest_soc" | "lowest_utilization" | "nearest" | "oldest_at_depot";
    execute?: boolean;
  }): {
    success: boolean;
    vehiclesToMove: Array<{ vehicleId: string; from: string; to: string; reason: string }>;
    recommendation: string;
    execute: boolean;
  } {
    const {
      sourceDepotId,
      targetDepotId,
      vehicleCount = 3,
      selectionCriteria = "highest_soc",
      execute = false
    } = params;

    // Analyze depot utilization
    const depotUtilization = depots.map(depot => {
      const depotVehicles = mockVehicles.filter(v => v.currentDepotId === depot.id);
      return {
        depotId: depot.id,
        depotName: depot.name,
        vehicleCount: depotVehicles.length,
        capacity: depot.capacity,
        utilization: depotVehicles.length / depot.capacity
      };
    });

    // Find source (over-utilized) and target (under-utilized) if not specified
    const source = sourceDepotId
      ? depotUtilization.find(d => d.depotId === sourceDepotId)
      : depotUtilization.sort((a, b) => b.utilization - a.utilization)[0];

    const target = targetDepotId
      ? depotUtilization.find(d => d.depotId === targetDepotId)
      : depotUtilization.sort((a, b) => a.utilization - b.utilization)[0];

    if (!source || !target || source.depotId === target.depotId) {
      return {
        success: false,
        vehiclesToMove: [],
        recommendation: "Unable to determine valid source and target depots",
        execute: false
      };
    }

    // Select vehicles to move
    let sourceVehicles = mockVehicles.filter(v =>
      v.currentDepotId === source.depotId &&
      v.status === "idle"
    );

    // Sort by criteria
    switch (selectionCriteria) {
      case "highest_soc":
        sourceVehicles.sort((a, b) => (b.soc || 0) - (a.soc || 0));
        break;
      case "lowest_utilization":
        sourceVehicles.sort((a, b) =>
          (a.operationalMetrics?.utilizationRate || 0) - (b.operationalMetrics?.utilizationRate || 0)
        );
        break;
      case "oldest_at_depot":
        // Simulate by mileage
        sourceVehicles.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
        break;
    }

    const vehiclesToMove = sourceVehicles.slice(0, vehicleCount).map(v => ({
      vehicleId: v.id,
      from: source.depotId,
      to: target.depotId,
      reason: `Selected by "${selectionCriteria}" - SOC: ${Math.round((v.soc || 0) * 100)}%`
    }));

    const recommendation = vehiclesToMove.length > 0
      ? `Recommend moving ${vehiclesToMove.length} vehicles from ${source.depotName} (${Math.round(source.utilization * 100)}% utilized) to ${target.depotName} (${Math.round(target.utilization * 100)}% utilized)`
      : "No idle vehicles available for rebalancing";

    return {
      success: vehiclesToMove.length > 0,
      vehiclesToMove,
      recommendation,
      execute
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RULE EVALUATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Evaluate all enabled rules and return triggered actions
   */
  evaluateRules(): AutomationExecution[] {
    const executions: AutomationExecution[] = [];
    const now = new Date();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const lastRun = new Date(rule.lastTriggered);
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (now.getTime() - lastRun.getTime() < cooldownMs) {
          continue;
        }
      }

      // Evaluate trigger
      const triggeredVehicles = this.evaluateTrigger(rule.trigger, rule.conditions);

      if (triggeredVehicles.length > 0) {
        // Execute actions (simulated)
        const actionsExecuted = rule.actions.map(a => a.type);

        const execution: AutomationExecution = {
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: now.toISOString(),
          vehiclesAffected: triggeredVehicles.map(v => v.id),
          actionsExecuted,
          success: true,
          message: `Rule "${rule.name}" triggered for ${triggeredVehicles.length} vehicles`,
          dryRun: true // Always dry run in evaluation
        };

        executions.push(execution);

        // Update rule
        rule.lastTriggered = now.toISOString();
        rule.executionCount++;
      }
    }

    this.executionLog.push(...executions);
    return executions;
  }

  private evaluateTrigger(
    trigger: AutomationTrigger,
    conditions: AutomationCondition[]
  ): typeof mockVehicles {
    let vehicles = [...mockVehicles];

    // Apply trigger filter
    switch (trigger.type) {
      case "soc_threshold":
        if (trigger.direction === "below") {
          vehicles = vehicles.filter(v => ((v.soc || 1) * 100) < (trigger.threshold || 20));
        } else {
          vehicles = vehicles.filter(v => ((v.soc || 0) * 100) > (trigger.threshold || 80));
        }
        break;

      case "maintenance_due":
        vehicles = vehicles.filter(v => {
          if (!v.nextMaintenanceDate) return false;
          const daysUntil = Math.floor(
            (new Date(v.nextMaintenanceDate).getTime() - Date.now()) / 86400000
          );
          return daysUntil <= (trigger.daysUntil || 7);
        });
        break;

      case "vehicle_idle":
        vehicles = vehicles.filter(v => v.status === "idle");
        break;

      case "prediction_confidence":
        if (trigger.predictionType === "maintenance_risk") {
          const predictions = PredictiveEngine.predictMaintenanceRisks({
            riskThreshold: trigger.threshold || 0.7
          });
          const riskVehicleIds = predictions.prediction.map(p => p.vehicleId);
          vehicles = vehicles.filter(v => riskVehicleIds.includes(v.id));
        }
        break;
    }

    // Apply additional conditions
    for (const condition of conditions) {
      vehicles = vehicles.filter(v => this.evaluateCondition(v, condition));
    }

    return vehicles;
  }

  private evaluateCondition(vehicle: Record<string, unknown>, condition: AutomationCondition): boolean {
    const value = vehicle[condition.field];

    switch (condition.operator) {
      case "eq":
        return value === condition.value;
      case "ne":
        return value !== condition.value;
      case "gt":
        return typeof value === "number" && value > (condition.value as number);
      case "lt":
        return typeof value === "number" && value < (condition.value as number);
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value as string);
      case "contains":
        return typeof value === "string" && value.includes(condition.value as string);
      case "between":
        if (typeof value === "number" && Array.isArray(condition.value)) {
          return value >= condition.value[0] && value <= condition.value[1];
        }
        return false;
      default:
        return true;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private sortByStrategy(
    vehicles: typeof mockVehicles,
    strategy: string
  ): typeof mockVehicles {
    switch (strategy) {
      case "urgent_first":
        return [...vehicles].sort((a, b) => (a.soc || 0) - (b.soc || 0));

      case "balanced":
        // Mix of urgency and utilization
        return [...vehicles].sort((a, b) => {
          const aScore = (a.soc || 0) + (a.operationalMetrics?.utilizationRate || 0);
          const bScore = (b.soc || 0) + (b.operationalMetrics?.utilizationRate || 0);
          return aScore - bScore;
        });

      case "revenue_optimal":
        // Prioritize high-revenue vehicles
        return [...vehicles].sort((a, b) => (b.revenuePerDay || 0) - (a.revenuePerDay || 0));

      case "off_peak":
        // Sort by SOC, will be scheduled for later
        return [...vehicles].sort((a, b) => (a.soc || 0) - (b.soc || 0));

      default:
        return vehicles;
    }
  }

  private determineChargingPriority(vehicle: typeof mockVehicles[0]): Priority {
    const soc = (vehicle.soc || 0) * 100;
    if (soc < 10) return "critical";
    if (soc < 20) return "high";
    if (soc < 35) return "medium";
    return "low";
  }

  getExecutionLog(): AutomationExecution[] {
    return this.executionLog;
  }

  clearExecutionLog(): void {
    this.executionLog = [];
  }
}

// Export singleton instance
export const automationEngine = new AutomationEngine();

export default AutomationEngine;
