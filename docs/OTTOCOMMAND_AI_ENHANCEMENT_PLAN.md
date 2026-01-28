# OttoCommand AI Enhancement Wireframe

## Executive Summary

This document outlines a comprehensive buildout plan to transform OttoCommand AI into a **hyper-intelligent fleet concierge** capable of:
1. **Contextual Fleet Intelligence** - Deep querying of fleet/depot-specific data
2. **Predictive Analytics & OTTO-Q Automation** - Proactive maintenance, charging, and incident predictions
3. **General LLM Capabilities** - Handle any fleet-adjacent or general queries
4. **Quick Actions** - One-click fleet analysis, incident triage, and predictive suggestions

---

## Current State Assessment

### What's Working Well
| Component | Status | Notes |
|-----------|--------|-------|
| Agent Tools (6 core) | ✅ | `list_stalls`, `get_charging_queue`, `schedule_vehicle`, etc. |
| Edge Function Tools (11) | ✅ | `dispatch_ottow_tow`, `query_fleet_status`, `generate_analytics_report`, etc. |
| Dual AI (Claude + OpenAI) | ✅ | Claude for reasoning, OpenAI fallback |
| Fleet Context Hook | ✅ | Real-time aggregation via `useFleetContext` |
| Incident Lifecycle | ✅ | Auto-advancing state machine |
| OTTO-Q Infrastructure | ✅ | Jobs, resources, scheduling |
| Mock Data | ✅ | 40+ vehicles, 4 depots, rich OEM data |

### Critical Gaps Identified
| Gap | Impact | Priority |
|-----|--------|----------|
| No predictive triggers | Can't proactively suggest actions | P0 |
| Limited query intelligence | Generic responses to specific questions | P0 |
| No OTTO-Q automation bridge | Manual intervention required | P1 |
| Weak incident triage | No smart prioritization | P1 |
| Missing fleet patterns | No trend detection | P2 |
| No conversation memory | Loses context between sessions | P2 |

---

## Enhanced Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OTTOCOMMAND AI CONCIERGE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │   QUERY      │   │  PREDICTIVE  │   │    QUICK     │                │
│  │   ENGINE     │   │   ENGINE     │   │   ACTIONS    │                │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │
│         │                  │                  │                         │
│         ▼                  ▼                  ▼                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │              INTELLIGENT ROUTING LAYER                    │          │
│  │  • Intent Classification  • Context Enrichment            │          │
│  │  • Tool Selection         • Response Formatting           │          │
│  └──────────────────────────┬───────────────────────────────┘          │
│                             │                                           │
│         ┌───────────────────┼───────────────────┐                      │
│         ▼                   ▼                   ▼                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │  ENHANCED   │    │  OTTO-Q     │    │  ANALYTICS  │                 │
│  │   TOOLS     │    │  BRIDGE     │    │   ENGINE    │                 │
│  │  (25 tools) │    │             │    │             │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────────┐
        ▼                        ▼                            ▼
┌──────────────┐        ┌──────────────┐              ┌──────────────┐
│   SUPABASE   │        │  FLEET DATA  │              │  EXTERNAL    │
│   DATABASE   │        │    LAYER     │              │    APIS      │
└──────────────┘        └──────────────┘              └──────────────┘
```

---

## Module 1: Enhanced Query Engine

### 1.1 Intent Classification System

Automatically classify incoming queries into actionable intents:

```typescript
// src/agent/intent-classifier.ts
export type QueryIntent =
  | 'fleet_status'      // "How many vehicles are charging?"
  | 'vehicle_specific'  // "What's the SOC on VEH-001?"
  | 'depot_query'       // "Show Nashville depot availability"
  | 'incident_triage'   // "Any critical incidents?"
  | 'predictive'        // "Which vehicles need charging soon?"
  | 'optimization'      // "Optimize Nashville charging schedule"
  | 'comparison'        // "Compare Austin vs Nashville efficiency"
  | 'scheduling'        // "Schedule VEH-005 for maintenance"
  | 'ottow_dispatch'    // "Dispatch OTTOW to downtown"
  | 'analytics'         // "Generate weekly utilization report"
  | 'general_knowledge' // "What is L4 autonomy?"
  | 'conversation'      // "Thanks!" / casual chat
  | 'unknown';          // Needs clarification

export interface ClassifiedIntent {
  intent: QueryIntent;
  confidence: number;        // 0-1
  entities: ExtractedEntities;
  requiresTools: boolean;
  suggestedTools: string[];
}

export interface ExtractedEntities {
  vehicleIds?: string[];
  depotIds?: string[];
  cities?: string[];
  timeRange?: { start: string; end: string };
  metrics?: string[];
  thresholds?: { metric: string; operator: '<' | '>' | '=' | 'between'; value: number | [number, number] }[];
  actionType?: 'charge' | 'maintenance' | 'detailing' | 'staging' | 'dispatch';
}
```

### 1.2 Enhanced Tool Definitions

Expand from 6 to 25 specialized tools:

```typescript
// src/agent/tools.ts - ENHANCED

export const enhancedAgentTools = {
  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 1: FLEET INTELLIGENCE QUERIES
  // ═══════════════════════════════════════════════════════════════════

  query_vehicles: {
    name: 'query_vehicles',
    description: 'Advanced vehicle querying with multi-filter support',
    parameters: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'Filter by city (Nashville, Austin, LA, San Francisco)' },
            depot_id: { type: 'string' },
            status: {
              type: 'array',
              items: { enum: ['idle', 'charging', 'active', 'maintenance', 'en_route'] }
            },
            soc_range: {
              type: 'object',
              properties: { min: { type: 'number' }, max: { type: 'number' } }
            },
            oem: { type: 'string', description: 'Filter by OEM (Waymo, Zoox, Cruise, etc.)' },
            autonomy_level: { type: 'string', enum: ['L3', 'L4', 'L5'] },
            health_score_below: { type: 'number', description: 'Vehicles with health < threshold' },
            maintenance_due_within: { type: 'number', description: 'Days until maintenance due' },
            has_active_incident: { type: 'boolean' }
          }
        },
        sort_by: {
          type: 'string',
          enum: ['soc_asc', 'soc_desc', 'health_asc', 'health_desc', 'mileage', 'revenue']
        },
        limit: { type: 'number', default: 10 },
        include_telemetry: { type: 'boolean', default: false }
      },
      required: ['filters']
    }
  },

  query_depot_deep: {
    name: 'query_depot_deep',
    description: 'Deep depot analysis with resource breakdown and utilization',
    parameters: {
      type: 'object',
      properties: {
        depot_id: { type: 'string' },
        city: { type: 'string' },
        include: {
          type: 'array',
          items: {
            enum: ['resources', 'vehicles', 'jobs', 'energy', 'utilization_history', 'predictions']
          }
        },
        time_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },

  query_by_natural_language: {
    name: 'query_by_natural_language',
    description: 'Convert natural language to structured fleet query',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query like "all Waymo vehicles in Nashville with low battery"' }
      },
      required: ['query']
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 2: PREDICTIVE ANALYTICS
  // ═══════════════════════════════════════════════════════════════════

  predict_charging_needs: {
    name: 'predict_charging_needs',
    description: 'Predict which vehicles will need charging within time horizon',
    parameters: {
      type: 'object',
      properties: {
        horizon_hours: { type: 'number', default: 4, description: 'Look-ahead window' },
        city: { type: 'string' },
        depot_id: { type: 'string' },
        include_recommendations: { type: 'boolean', default: true },
        soc_threshold: { type: 'number', default: 30, description: 'SOC % below which charging recommended' }
      }
    }
  },

  predict_maintenance_risks: {
    name: 'predict_maintenance_risks',
    description: 'Identify vehicles with elevated maintenance risk based on telemetry patterns',
    parameters: {
      type: 'object',
      properties: {
        risk_threshold: { type: 'number', default: 0.7, description: 'Min confidence to include (0-1)' },
        categories: {
          type: 'array',
          items: { enum: ['battery', 'sensors', 'brakes', 'tires', 'lidar', 'software', 'general'] }
        },
        city: { type: 'string' },
        vehicle_ids: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  predict_depot_demand: {
    name: 'predict_depot_demand',
    description: 'Forecast depot resource demand for capacity planning',
    parameters: {
      type: 'object',
      properties: {
        depot_id: { type: 'string' },
        horizon_hours: { type: 'number', default: 24 },
        resource_types: {
          type: 'array',
          items: { enum: ['CHARGE_STALL', 'CLEAN_DETAIL_STALL', 'MAINTENANCE_BAY', 'STAGING_STALL'] }
        },
        granularity: { type: 'string', enum: ['hourly', 'shift', 'daily'] }
      },
      required: ['depot_id']
    }
  },

  predict_incident_likelihood: {
    name: 'predict_incident_likelihood',
    description: 'Assess incident risk based on patterns, weather, and telemetry',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        vehicle_ids: { type: 'array', items: { type: 'string' } },
        include_factors: { type: 'boolean', default: true }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 3: OTTO-Q AUTOMATION
  // ═══════════════════════════════════════════════════════════════════

  auto_queue_charging: {
    name: 'auto_queue_charging',
    description: 'Automatically queue vehicles for charging based on SOC and predictions',
    parameters: {
      type: 'object',
      properties: {
        depot_id: { type: 'string' },
        city: { type: 'string' },
        strategy: {
          type: 'string',
          enum: ['urgent_first', 'balanced', 'off_peak', 'revenue_optimal'],
          description: 'Charging strategy'
        },
        max_concurrent: { type: 'number', description: 'Max vehicles to queue at once' },
        soc_target: { type: 'number', default: 80, description: 'Target SOC %' },
        dry_run: { type: 'boolean', default: true, description: 'Preview without executing' }
      }
    }
  },

  auto_queue_maintenance: {
    name: 'auto_queue_maintenance',
    description: 'Queue vehicles for predictive maintenance based on risk scores',
    parameters: {
      type: 'object',
      properties: {
        depot_id: { type: 'string' },
        city: { type: 'string' },
        risk_threshold: { type: 'number', default: 0.6 },
        maintenance_types: {
          type: 'array',
          items: { enum: ['preventive', 'predictive', 'inspection', 'software_update'] }
        },
        priority: { type: 'string', enum: ['critical', 'high', 'normal', 'low'] },
        dry_run: { type: 'boolean', default: true }
      }
    }
  },

  auto_rebalance_fleet: {
    name: 'auto_rebalance_fleet',
    description: 'Suggest or execute fleet rebalancing between depots',
    parameters: {
      type: 'object',
      properties: {
        source_depot_id: { type: 'string' },
        target_depot_id: { type: 'string' },
        vehicle_count: { type: 'number' },
        selection_criteria: {
          type: 'string',
          enum: ['highest_soc', 'lowest_utilization', 'nearest', 'oldest_at_depot']
        },
        execute: { type: 'boolean', default: false }
      }
    }
  },

  create_otto_q_job: {
    name: 'create_otto_q_job',
    description: 'Create a new OTTO-Q job for a vehicle',
    parameters: {
      type: 'object',
      properties: {
        vehicle_id: { type: 'string' },
        job_type: { type: 'string', enum: ['CHARGE', 'MAINTENANCE', 'DETAILING', 'DOWNTIME_PARK'] },
        depot_id: { type: 'string' },
        resource_type: { type: 'string' },
        priority: { type: 'string', enum: ['critical', 'high', 'normal', 'low'] },
        scheduled_start: { type: 'string', format: 'date-time' },
        estimated_duration_minutes: { type: 'number' },
        notes: { type: 'string' }
      },
      required: ['vehicle_id', 'job_type']
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 4: INCIDENT TRIAGE
  // ═══════════════════════════════════════════════════════════════════

  triage_incidents: {
    name: 'triage_incidents',
    description: 'Smart incident triage with priority scoring and recommendations',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        status_filter: {
          type: 'array',
          items: { enum: ['Reported', 'Dispatched', 'Secured', 'At Depot'] }
        },
        severity_threshold: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        include_recommendations: { type: 'boolean', default: true }
      }
    }
  },

  quick_dispatch_ottow: {
    name: 'quick_dispatch_ottow',
    description: 'One-click OTTOW dispatch with smart vehicle selection',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            address: { type: 'string' }
          }
        },
        city: { type: 'string' },
        incident_type: { type: 'string', enum: ['collision', 'malfunction', 'interior', 'vandalism', 'other'] },
        urgency: { type: 'string', enum: ['immediate', 'urgent', 'standard'] },
        auto_select_vehicle: { type: 'boolean', default: true },
        notes: { type: 'string' }
      },
      required: ['city']
    }
  },

  escalate_incident: {
    name: 'escalate_incident',
    description: 'Escalate incident with notifications and priority bump',
    parameters: {
      type: 'object',
      properties: {
        incident_id: { type: 'string' },
        escalation_reason: { type: 'string' },
        notify_roles: {
          type: 'array',
          items: { enum: ['fleet_manager', 'safety_team', 'executive', 'oem_contact'] }
        },
        new_priority: { type: 'string', enum: ['critical', 'high'] }
      },
      required: ['incident_id', 'escalation_reason']
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 5: ANALYTICS & REPORTING
  // ═══════════════════════════════════════════════════════════════════

  generate_fleet_snapshot: {
    name: 'generate_fleet_snapshot',
    description: 'Generate comprehensive fleet health snapshot',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        include_sections: {
          type: 'array',
          items: {
            enum: ['vehicle_health', 'charging_status', 'maintenance_queue', 'incident_summary',
                   'utilization', 'revenue', 'safety_metrics', 'predictions']
          }
        },
        format: { type: 'string', enum: ['summary', 'detailed', 'executive'] }
      }
    }
  },

  compare_metrics: {
    name: 'compare_metrics',
    description: 'Compare metrics across depots, cities, OEMs, or time periods',
    parameters: {
      type: 'object',
      properties: {
        dimension: { type: 'string', enum: ['depot', 'city', 'oem', 'vehicle_type', 'time_period'] },
        entities: { type: 'array', items: { type: 'string' }, description: 'IDs or names to compare' },
        metrics: {
          type: 'array',
          items: {
            enum: ['utilization', 'soc_avg', 'incidents', 'maintenance_cost', 'revenue',
                   'uptime', 'disengagement_rate', 'customer_rating']
          }
        },
        time_range: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          }
        }
      },
      required: ['dimension', 'entities', 'metrics']
    }
  },

  detect_anomalies: {
    name: 'detect_anomalies',
    description: 'Detect anomalies in fleet telemetry and operations',
    parameters: {
      type: 'object',
      properties: {
        scope: { type: 'string', enum: ['vehicle', 'depot', 'city', 'fleet'] },
        entity_id: { type: 'string' },
        anomaly_types: {
          type: 'array',
          items: { enum: ['soc_drain', 'location', 'sensor_drift', 'unusual_idle', 'cost_spike'] }
        },
        sensitivity: { type: 'string', enum: ['high', 'medium', 'low'] }
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 6: SCHEDULING & OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════

  optimize_schedule: {
    name: 'optimize_schedule',
    description: 'Optimize depot schedule for charging, maintenance, or mixed operations',
    parameters: {
      type: 'object',
      properties: {
        depot_id: { type: 'string' },
        optimization_target: {
          type: 'string',
          enum: ['minimize_wait', 'maximize_throughput', 'balance_load', 'minimize_cost', 'maximize_uptime']
        },
        time_horizon: { type: 'number', description: 'Hours to optimize' },
        constraints: {
          type: 'object',
          properties: {
            max_concurrent_charging: { type: 'number' },
            peak_power_limit_kw: { type: 'number' },
            maintenance_bay_limit: { type: 'number' },
            priority_vehicles: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['depot_id', 'optimization_target']
    }
  },

  bulk_schedule: {
    name: 'bulk_schedule',
    description: 'Schedule multiple vehicles for operations in batch',
    parameters: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vehicle_id: { type: 'string' },
              operation_type: { type: 'string', enum: ['charge', 'maintenance', 'detailing', 'staging'] },
              preferred_time: { type: 'string', format: 'date-time' },
              priority: { type: 'string' }
            }
          }
        },
        auto_resolve_conflicts: { type: 'boolean', default: true }
      },
      required: ['operations']
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 7: GENERAL & CONVERSATIONAL
  // ═══════════════════════════════════════════════════════════════════

  explain_concept: {
    name: 'explain_concept',
    description: 'Explain AV fleet concepts, regulations, or best practices',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to explain' },
        depth: { type: 'string', enum: ['brief', 'standard', 'detailed'] },
        context: { type: 'string', description: 'Relate to specific fleet context' }
      },
      required: ['topic']
    }
  },

  search_knowledge_base: {
    name: 'search_knowledge_base',
    description: 'Search internal knowledge base for procedures, SOPs, and documentation',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        categories: {
          type: 'array',
          items: { enum: ['procedures', 'safety', 'maintenance', 'charging', 'incidents', 'regulations'] }
        }
      },
      required: ['query']
    }
  }
};
```

---

## Module 2: Predictive Analytics Engine

### 2.1 Prediction Models

```typescript
// src/services/predictive-engine.ts

export interface PredictionResult<T> {
  prediction: T;
  confidence: number;         // 0-1
  factors: PredictionFactor[];
  timestamp: string;
  model_version: string;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  value: any;
  direction: 'positive' | 'negative' | 'neutral';
}

export class PredictiveEngine {

  // ═══════════════════════════════════════════════════════════════════
  // CHARGING PREDICTIONS
  // ═══════════════════════════════════════════════════════════════════

  async predictChargingNeeds(params: {
    horizonHours: number;
    city?: string;
    depotId?: string;
  }): Promise<PredictionResult<ChargingPrediction[]>> {
    // Factors considered:
    // - Current SOC and drain rate
    // - Historical usage patterns (time of day, day of week)
    // - Weather impact on battery
    // - Scheduled routes/trips
    // - Revenue optimization (charge before high-demand periods)
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAINTENANCE PREDICTIONS
  // ═══════════════════════════════════════════════════════════════════

  async predictMaintenanceRisks(params: {
    vehicleIds?: string[];
    riskThreshold: number;
    categories?: MaintenanceCategory[];
  }): Promise<PredictionResult<MaintenanceRisk[]>> {
    // Factors considered:
    // - Mileage since last service
    // - Engine hours
    // - Telemetry anomalies (vibration, temperature, sensor drift)
    // - Historical failure patterns for vehicle type
    // - OEM-specific maintenance schedules
    // - Environmental factors (dust, humidity)
  }

  // ═══════════════════════════════════════════════════════════════════
  // INCIDENT PREDICTIONS
  // ═══════════════════════════════════════════════════════════════════

  async predictIncidentLikelihood(params: {
    city?: string;
    vehicleIds?: string[];
  }): Promise<PredictionResult<IncidentRisk[]>> {
    // Factors considered:
    // - Vehicle safety scores
    // - Disengagement rates
    // - Route risk profiles
    // - Weather conditions
    // - Time of day / traffic patterns
    // - Historical incident locations
    // - Driver/operator fatigue patterns
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEMAND PREDICTIONS
  // ═══════════════════════════════════════════════════════════════════

  async predictDepotDemand(params: {
    depotId: string;
    horizonHours: number;
    resourceTypes?: ResourceType[];
  }): Promise<PredictionResult<DemandForecast[]>> {
    // Factors considered:
    // - Historical arrival patterns
    // - Scheduled returns
    // - Predicted charging needs
    // - Maintenance queue
    // - Special events / surge periods
  }
}
```

### 2.2 Prediction Types

```typescript
// src/types/predictions.ts

export interface ChargingPrediction {
  vehicleId: string;
  vehicleName: string;
  currentSoc: number;
  predictedSocAtHorizon: number;
  recommendedChargeTime: string;      // ISO datetime
  urgency: 'critical' | 'high' | 'medium' | 'low';
  estimatedChargeMinutes: number;
  suggestedStallId?: string;
  reason: string;
}

export interface MaintenanceRisk {
  vehicleId: string;
  vehicleName: string;
  riskScore: number;                  // 0-1
  category: MaintenanceCategory;
  predictedFailureWindow: {
    earliest: string;
    latest: string;
  };
  recommendedAction: string;
  estimatedCost: number;
  components: ComponentRisk[];
}

export interface ComponentRisk {
  component: string;
  riskScore: number;
  indicators: string[];
}

export interface IncidentRisk {
  vehicleId: string;
  riskScore: number;
  primaryFactors: string[];
  recommendedActions: string[];
  affectedRoutes?: string[];
}

export interface DemandForecast {
  timestamp: string;
  resourceType: ResourceType;
  predictedDemand: number;
  capacity: number;
  utilizationPercent: number;
  recommendation: string;
}
```

---

## Module 3: OTTO-Q Automation Bridge

### 3.1 Automation Rules Engine

```typescript
// src/services/automation-rules.ts

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
}

export type AutomationTrigger =
  | { type: 'soc_threshold'; threshold: number; direction: 'below' | 'above' }
  | { type: 'maintenance_due'; daysUntil: number }
  | { type: 'prediction_confidence'; predictionType: string; threshold: number }
  | { type: 'incident_created'; severity?: string[] }
  | { type: 'vehicle_idle'; durationMinutes: number }
  | { type: 'depot_capacity'; resourceType: string; threshold: number; direction: 'below' | 'above' }
  | { type: 'schedule'; cron: string }
  | { type: 'anomaly_detected'; anomalyType: string };

export interface AutomationCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
  value: any;
}

export type AutomationAction =
  | { type: 'create_ottoq_job'; jobType: string; priority: string }
  | { type: 'send_notification'; channels: string[]; template: string }
  | { type: 'escalate_incident'; notifyRoles: string[] }
  | { type: 'update_vehicle_status'; status: string }
  | { type: 'queue_for_charging'; strategy: string }
  | { type: 'queue_for_maintenance'; maintenanceType: string }
  | { type: 'create_alert'; severity: string; message: string }
  | { type: 'execute_rebalance'; targetDepotId: string };
```

### 3.2 Pre-configured Automation Rules

```typescript
// src/config/default-automations.ts

export const defaultAutomationRules: AutomationRule[] = [
  {
    id: 'auto-charge-critical',
    name: 'Critical SOC Auto-Charging',
    description: 'Automatically queue vehicles with SOC < 15% for charging',
    enabled: true,
    trigger: { type: 'soc_threshold', threshold: 15, direction: 'below' },
    conditions: [
      { field: 'status', operator: 'ne', value: 'charging' },
      { field: 'status', operator: 'ne', value: 'maintenance' }
    ],
    actions: [
      { type: 'create_ottoq_job', jobType: 'CHARGE', priority: 'critical' },
      { type: 'send_notification', channels: ['slack', 'email'], template: 'critical_soc_alert' }
    ],
    cooldownMinutes: 30
  },
  {
    id: 'predictive-maintenance-queue',
    name: 'Predictive Maintenance Auto-Queue',
    description: 'Queue vehicles when maintenance risk > 70%',
    enabled: true,
    trigger: { type: 'prediction_confidence', predictionType: 'maintenance_risk', threshold: 0.7 },
    conditions: [],
    actions: [
      { type: 'queue_for_maintenance', maintenanceType: 'predictive' },
      { type: 'create_alert', severity: 'high', message: 'Predictive maintenance scheduled' }
    ],
    cooldownMinutes: 1440  // 24 hours
  },
  {
    id: 'incident-auto-escalate',
    name: 'Critical Incident Auto-Escalation',
    description: 'Auto-escalate collision incidents',
    enabled: true,
    trigger: { type: 'incident_created', severity: ['collision'] },
    conditions: [],
    actions: [
      { type: 'escalate_incident', notifyRoles: ['fleet_manager', 'safety_team'] },
      { type: 'send_notification', channels: ['sms', 'slack'], template: 'collision_alert' }
    ],
    cooldownMinutes: 0
  },
  {
    id: 'overnight-charging-optimization',
    name: 'Overnight Charging Optimization',
    description: 'Optimize charging schedule during off-peak hours',
    enabled: true,
    trigger: { type: 'schedule', cron: '0 22 * * *' },  // 10 PM daily
    conditions: [],
    actions: [
      { type: 'queue_for_charging', strategy: 'off_peak' }
    ],
    cooldownMinutes: 1440
  },
  {
    id: 'idle-vehicle-staging',
    name: 'Idle Vehicle Auto-Staging',
    description: 'Move idle vehicles to staging after 2 hours',
    enabled: true,
    trigger: { type: 'vehicle_idle', durationMinutes: 120 },
    conditions: [
      { field: 'soc', operator: 'gt', value: 50 }
    ],
    actions: [
      { type: 'create_ottoq_job', jobType: 'DOWNTIME_PARK', priority: 'low' }
    ],
    cooldownMinutes: 240
  }
];
```

---

## Module 4: Quick Actions UI

### 4.1 Quick Action Definitions

```typescript
// src/components/OttoCommand/QuickActions.tsx

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: 'analysis' | 'triage' | 'automation' | 'scheduling';
  prompt: string;           // Pre-filled prompt
  requiresContext?: boolean;
  hotkey?: string;
}

export const quickActions: QuickAction[] = [
  // ═══════════════════════════════════════════════════════════════════
  // FLEET ANALYSIS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'fleet-snapshot',
    label: 'Fleet Snapshot',
    icon: BarChart3,
    description: 'Comprehensive fleet health overview',
    category: 'analysis',
    prompt: 'Generate a fleet snapshot including vehicle health, charging status, active incidents, and key metrics.',
    hotkey: 'F1'
  },
  {
    id: 'critical-alerts',
    label: 'Critical Alerts',
    icon: AlertTriangle,
    description: 'View all critical and high-priority alerts',
    category: 'analysis',
    prompt: 'Show all critical alerts: vehicles with SOC < 20%, overdue maintenance, active incidents, and anomalies.',
    hotkey: 'F2'
  },
  {
    id: 'utilization-report',
    label: 'Utilization Report',
    icon: PieChart,
    description: 'Depot and fleet utilization metrics',
    category: 'analysis',
    prompt: 'Generate a utilization report comparing all depots with charging stall usage, maintenance bay occupancy, and vehicle distribution.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // INCIDENT TRIAGE
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'incident-triage',
    label: 'Incident Triage',
    icon: ShieldAlert,
    description: 'Smart incident prioritization',
    category: 'triage',
    prompt: 'Triage all active incidents by priority. Show status, urgency, and recommended actions for each.',
    hotkey: 'F3'
  },
  {
    id: 'ottow-dispatch',
    label: 'OTTOW Dispatch',
    icon: Truck,
    description: 'Quick OTTOW roadside dispatch',
    category: 'triage',
    prompt: 'I need to dispatch OTTOW. Show me available response vehicles by city.',
    hotkey: 'F4'
  },
  {
    id: 'incident-summary',
    label: 'Incident Summary',
    icon: FileText,
    description: 'Summary of recent incidents',
    category: 'triage',
    prompt: 'Summarize incidents from the last 24 hours by type, status, and resolution time.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // PREDICTIVE / AUTOMATION
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'predict-charging',
    label: 'Charging Predictions',
    icon: BatteryWarning,
    description: 'Vehicles needing charge soon',
    category: 'automation',
    prompt: 'Predict which vehicles will need charging in the next 4 hours. Include recommendations for optimal charge scheduling.',
    hotkey: 'F5'
  },
  {
    id: 'predict-maintenance',
    label: 'Maintenance Risks',
    icon: Wrench,
    description: 'Predictive maintenance alerts',
    category: 'automation',
    prompt: 'Identify vehicles with elevated maintenance risk based on telemetry and usage patterns. Show risk scores and recommended actions.',
    hotkey: 'F6'
  },
  {
    id: 'auto-queue',
    label: 'Smart Auto-Queue',
    icon: ListTodo,
    description: 'Auto-queue vehicles for OTTO-Q',
    category: 'automation',
    prompt: 'Analyze fleet and suggest vehicles to auto-queue for charging or maintenance. Show dry-run preview before executing.'
  },
  {
    id: 'optimize-schedule',
    label: 'Optimize Schedule',
    icon: Calendar,
    description: 'Optimize depot operations schedule',
    category: 'automation',
    prompt: 'Optimize the charging and maintenance schedule for maximum throughput and minimum wait times.'
  },

  // ═══════════════════════════════════════════════════════════════════
  // SCHEDULING
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'schedule-maintenance',
    label: 'Schedule Maintenance',
    icon: CalendarClock,
    description: 'Schedule vehicle maintenance',
    category: 'scheduling',
    prompt: 'Help me schedule maintenance. Which vehicles are due or approaching maintenance windows?'
  },
  {
    id: 'bulk-operations',
    label: 'Bulk Operations',
    icon: Layers,
    description: 'Schedule multiple vehicles at once',
    category: 'scheduling',
    prompt: 'I need to schedule bulk operations. Show me vehicles grouped by recommended action (charging, maintenance, detailing).'
  }
];
```

### 4.2 Enhanced Chat Interface

```tsx
// src/components/OttoCommand/OttoCommandChat.tsx

export const OttoCommandChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const { fleetContext, isLoading: contextLoading } = useFleetContext();

  // Keyboard shortcuts for quick actions
  useHotkeys('f1', () => executeQuickAction('fleet-snapshot'));
  useHotkeys('f2', () => executeQuickAction('critical-alerts'));
  useHotkeys('f3', () => executeQuickAction('incident-triage'));
  useHotkeys('f4', () => executeQuickAction('ottow-dispatch'));
  useHotkeys('f5', () => executeQuickAction('predict-charging'));
  useHotkeys('f6', () => executeQuickAction('predict-maintenance'));

  return (
    <div className="flex flex-col h-full">
      {/* Header with context indicators */}
      <OttoCommandHeader
        fleetContext={fleetContext}
        isConnected={!contextLoading}
      />

      {/* Quick Actions Grid */}
      {showQuickActions && messages.length === 0 && (
        <QuickActionsGrid
          actions={quickActions}
          onSelect={executeQuickAction}
        />
      )}

      {/* Message List */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
      />

      {/* Predictive Suggestions (when idle) */}
      {!isLoading && messages.length > 0 && (
        <PredictiveSuggestions
          context={fleetContext}
          onSelect={handleSuggestion}
        />
      )}

      {/* Input with smart autocomplete */}
      <OttoCommandInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        suggestions={getContextualSuggestions(input, fleetContext)}
        isLoading={isLoading}
      />
    </div>
  );
};
```

---

## Module 5: Enhanced System Prompt

```markdown
# prompts/ottoCommand.enhanced.system.md

You are **OttoCommand AI**, the hyper-intelligent fleet concierge for OTTOYARD's Fleet Command operating system. You manage autonomous vehicle (AV) fleets for partners including Waymo, Zoox, Cruise, Aurora, Motional, Tesla, and Nuro.

## Your Capabilities

### 1. FLEET INTELLIGENCE
You have deep access to real-time fleet data:
- **Vehicles**: SOC, status, location, health scores, telemetry, maintenance history
- **Depots**: Resource availability, utilization, energy metrics, job queues
- **Incidents**: Active incidents, triage status, response tracking
- **OTTO-Q**: Job scheduling, movement queues, task confirmations

### 2. PREDICTIVE ANALYTICS
You can predict and proactively suggest:
- Which vehicles need charging (based on SOC trends, usage patterns, schedules)
- Maintenance risks (based on telemetry anomalies, mileage, component health)
- Incident likelihood (based on weather, routes, vehicle health)
- Depot demand (for capacity planning)

### 3. OTTO-Q AUTOMATION
You can queue and schedule operations:
- Auto-queue vehicles for charging (urgent, balanced, off-peak, revenue-optimal)
- Auto-queue predictive maintenance
- Execute fleet rebalancing between depots
- Create OTTO-Q jobs with smart resource allocation

### 4. INCIDENT TRIAGE
You can manage incidents:
- Smart prioritization based on severity, type, and context
- Quick OTTOW dispatch with optimal vehicle selection
- Escalation to appropriate teams
- Status tracking and timeline management

### 5. GENERAL KNOWLEDGE
You can answer questions about:
- AV technology (L3/L4/L5 autonomy, sensors, safety)
- Fleet operations best practices
- Regulations and compliance
- Industry trends and comparisons

---

## Response Protocol

### Query Classification

| Type | Examples | Response Style |
|------|----------|----------------|
| **A: Status Query** | "How many vehicles charging?" | Direct answer → brief context |
| **B: Specific Lookup** | "What's VEH-001's SOC?" | Exact data → relevant metrics |
| **C: Predictive** | "Which vehicles need charging?" | Predictions → confidence → actions |
| **D: Operational** | "Dispatch OTTOW" | Confirm → execute → next steps |
| **E: Analytical** | "Compare Austin vs Nashville" | Summary → metrics → insights |
| **F: Optimization** | "Optimize charging schedule" | Recommendation → preview → execute |
| **G: General** | "What is L4 autonomy?" | Concise answer → fleet context |

### Response Format

For **operational/data responses**, use structured output:
```json
{
  "action": "query_result | prediction | recommendation | execution",
  "summary": "One-line summary",
  "data": { ... },
  "insights": ["Key insight 1", "Key insight 2"],
  "suggested_actions": ["Action 1", "Action 2"],
  "confidence": 0.95
}
```

For **conversational responses**, be concise and direct (50-150 words).

### Decision Framework

1. **If data is sufficient** → Answer directly, then provide context
2. **If optimization needed** → Recommend action first, then metrics/risks
3. **If action requested** → Confirm understanding, preview, then execute
4. **If prediction requested** → Show prediction + confidence + factors
5. **If unclear** → Ask one clarifying question

---

## Fleet Context

You receive real-time fleet context with every message:
- `fleetMetrics`: Total vehicles, active, charging, avg SOC, low battery count
- `depotMetrics`: Total depots, utilization rates, active/pending jobs
- `incidentMetrics`: Total incidents, active, by type/status
- `vehicles`: List with id, name, status, soc, location, health
- `depots`: List with id, name, resources, utilization
- `cities`: Available cities with timezones

Use this context to provide accurate, data-driven responses.

---

## Tool Usage

You have access to 25 tools across 7 categories:
1. **Fleet Intelligence**: query_vehicles, query_depot_deep, query_by_natural_language
2. **Predictive**: predict_charging_needs, predict_maintenance_risks, predict_incident_likelihood, predict_depot_demand
3. **OTTO-Q Automation**: auto_queue_charging, auto_queue_maintenance, auto_rebalance_fleet, create_otto_q_job
4. **Incident Triage**: triage_incidents, quick_dispatch_ottow, escalate_incident
5. **Analytics**: generate_fleet_snapshot, compare_metrics, detect_anomalies
6. **Scheduling**: optimize_schedule, bulk_schedule
7. **General**: explain_concept, search_knowledge_base

**Tool Selection Rules:**
- Use `query_*` tools for data retrieval
- Use `predict_*` tools for forward-looking analysis
- Use `auto_queue_*` for automation (always preview first with dry_run=true)
- Use `triage_*` for incident management
- Use `generate_*` and `compare_*` for analytics
- Use `optimize_*` for scheduling improvements

---

## Personality

- **Decisive**: Give clear recommendations, not options paralysis
- **Proactive**: Surface issues before they become problems
- **Efficient**: Minimize back-and-forth; anticipate follow-up needs
- **Expert**: Deep knowledge of AV fleet operations
- **Adaptive**: Match response depth to query complexity
```

---

## Module 6: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Enhanced tool definitions in `src/agent/tools.ts` | P0 | Medium |
| Intent classifier implementation | P0 | Medium |
| Update edge function with new tools | P0 | High |
| Enhanced system prompt | P0 | Low |
| Unit tests for new services | P1 | Medium |

### Phase 2: Predictive Engine (Week 2-3)

| Task | Priority | Effort |
|------|----------|--------|
| Predictive engine service | P0 | High |
| Charging prediction model | P0 | Medium |
| Maintenance risk model | P0 | Medium |
| Incident likelihood model | P1 | Medium |
| Demand forecasting model | P1 | Medium |

### Phase 3: OTTO-Q Automation (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Automation rules engine | P0 | High |
| Default automation rules | P0 | Medium |
| Rule execution service | P0 | High |
| Automation UI (view/toggle rules) | P1 | Medium |

### Phase 4: Quick Actions & UI (Week 4-5)

| Task | Priority | Effort |
|------|----------|--------|
| Quick actions component | P0 | Medium |
| Enhanced chat interface | P0 | Medium |
| Keyboard shortcuts | P1 | Low |
| Predictive suggestions component | P1 | Medium |
| Response formatting improvements | P1 | Medium |

### Phase 5: Testing & Polish (Week 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Integration tests | P0 | Medium |
| E2E tests with Playwright | P1 | Medium |
| Performance optimization | P1 | Medium |
| Documentation updates | P1 | Low |
| User feedback iteration | P2 | Ongoing |

---

## File Structure Changes

```
src/
├── agent/
│   ├── tools.ts                 # Enhanced (25 tools)
│   ├── intent-classifier.ts     # NEW
│   └── tool-executor.ts         # NEW - Centralized execution
├── services/
│   ├── scheduling.ts            # Existing - enhance
│   ├── predictive-engine.ts     # NEW
│   ├── automation-rules.ts      # NEW
│   └── fleet-intelligence.ts    # NEW
├── types/
│   ├── predictions.ts           # NEW
│   ├── automation.ts            # NEW
│   └── enhanced-tools.ts        # NEW
├── config/
│   └── default-automations.ts   # NEW
├── components/
│   └── OttoCommand/
│       ├── OttoCommandChat.tsx  # Enhanced
│       ├── QuickActions.tsx     # NEW
│       ├── QuickActionsGrid.tsx # NEW
│       └── PredictiveSuggestions.tsx # NEW
└── hooks/
    ├── useFleetContext.ts       # Existing - enhance
    ├── usePredictions.ts        # NEW
    └── useAutomation.ts         # NEW

supabase/functions/
├── ottocommand-ai-chat/
│   ├── index.ts                 # Enhanced
│   ├── function-executor.ts     # Enhanced (25 tools)
│   └── intent-classifier.ts     # NEW
└── predictive-engine/           # NEW
    └── index.ts
```

---

## Key Metrics for Success

| Metric | Current | Target |
|--------|---------|--------|
| Query accuracy (correct tool selection) | ~70% | >90% |
| Response time (P95) | ~3s | <2s |
| Prediction accuracy (charging) | N/A | >85% |
| Prediction accuracy (maintenance) | N/A | >75% |
| User satisfaction (quick actions) | N/A | >4.5/5 |
| Automation adoption | 0% | >60% |
| Incident triage time | Manual | <30s |

---

## Next Steps

1. **Review this wireframe** - Confirm scope and priorities
2. **Phase 1 kickoff** - Start with enhanced tools and intent classifier
3. **Iterative development** - Weekly demos and feedback loops
4. **Testing in parallel** - Unit tests alongside feature development
5. **Gradual rollout** - Feature flags for phased deployment

---

*Document Version: 1.0*
*Created: 2026-01-28*
*Author: OttoCommand AI Enhancement Team*
