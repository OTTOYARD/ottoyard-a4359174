import {
  listStalls,
  getChargingQueue,
  scheduleVehicle,
  assignDetailing,
  optimizeChargingPlan,
  utilizationReport
} from '../services/scheduling';

export const agentTools = {
  list_stalls: {
    schema: {
      name: 'list_stalls',
      description: 'List charging stalls at a depot, optionally filtered by status',
      parameters: {
        type: 'object',
        properties: {
          depot_id: {
            type: 'string',
            description: 'The depot ID to list stalls for'
          },
          status: {
            type: 'string',
            enum: ['available', 'occupied', 'maintenance', 'reserved'],
            description: 'Optional status filter'
          }
        },
        required: ['depot_id']
      }
    },
    execute: (params: { depot_id: string; status?: string }) => {
      return listStalls(params.depot_id, params.status as any);
    }
  },

  get_charging_queue: {
    schema: {
      name: 'get_charging_queue',
      description: 'Get vehicles in charging queue (available vehicles with low SOC first)',
      parameters: {
        type: 'object',
        properties: {
          depot_id: {
            type: 'string',
            description: 'The depot ID to get charging queue for'
          }
        },
        required: ['depot_id']
      }
    },
    execute: (params: { depot_id: string }) => {
      return getChargingQueue(params.depot_id);
    }
  },

  schedule_vehicle: {
    schema: {
      name: 'schedule_vehicle',
      description: 'Schedule a vehicle to a charging stall with double-booking prevention',
      parameters: {
        type: 'object',
        properties: {
          vehicle_id: {
            type: 'string',
            description: 'The vehicle ID to schedule'
          },
          stall_id: {
            type: 'string',
            description: 'The stall ID to assign'
          },
          start_time: {
            type: 'string',
            format: 'date-time',
            description: 'Start time in ISO format'
          },
          end_time: {
            type: 'string',
            format: 'date-time',
            description: 'End time in ISO format'
          }
        },
        required: ['vehicle_id', 'stall_id', 'start_time', 'end_time']
      }
    },
    execute: (params: { vehicle_id: string; stall_id: string; start_time: string; end_time: string }) => {
      return scheduleVehicle(params);
    }
  },

  assign_detailing: {
    schema: {
      name: 'assign_detailing',
      description: 'Assign a vehicle to a detailing bay for a time window',
      parameters: {
        type: 'object',
        properties: {
          vehicle_id: {
            type: 'string',
            description: 'The vehicle ID to assign'
          },
          bay_id: {
            type: 'string',
            description: 'The detailing bay ID'
          },
          time_window: {
            type: 'object',
            properties: {
              start: {
                type: 'string',
                format: 'date-time',
                description: 'Start time in ISO format'
              },
              end: {
                type: 'string',
                format: 'date-time',
                description: 'End time in ISO format'
              }
            },
            required: ['start', 'end']
          }
        },
        required: ['vehicle_id', 'bay_id', 'time_window']
      }
    },
    execute: (params: { vehicle_id: string; bay_id: string; time_window: { start: string; end: string } }) => {
      return assignDetailing(params);
    }
  },

  optimize_charging_plan: {
    schema: {
      name: 'optimize_charging_plan',
      description: 'Generate optimized charging plan for a depot',
      parameters: {
        type: 'object',
        properties: {
          depot_id: {
            type: 'string',
            description: 'The depot ID to optimize for'
          },
          horizon_minutes: {
            type: 'number',
            default: 120,
            description: 'Planning horizon in minutes'
          },
          objective: {
            type: 'string',
            enum: ['minimize_time', 'maximize_utilization', 'balance_load'],
            default: 'maximize_utilization',
            description: 'Optimization objective'
          }
        },
        required: ['depot_id']
      }
    },
    execute: (params: { depot_id: string; horizon_minutes?: number; objective?: string }) => {
      return optimizeChargingPlan(params as any);
    }
  },

  utilization_report: {
    schema: {
      name: 'utilization_report',
      description: 'Generate utilization report for a depot and time range',
      parameters: {
        type: 'object',
        properties: {
          depot_id: {
            type: 'string',
            description: 'The depot ID to report on'
          },
          start_time: {
            type: 'string',
            format: 'date-time',
            description: 'Report start time in ISO format'
          },
          end_time: {
            type: 'string',
            format: 'date-time',
            description: 'Report end time in ISO format'
          }
        },
        required: ['depot_id', 'start_time', 'end_time']
      }
    },
    execute: (params: { depot_id: string; start_time: string; end_time: string }) => {
      return utilizationReport(params.depot_id, params.start_time, params.end_time);
    }
  }
};

export type AgentToolName = keyof typeof agentTools;

export function executeAgentTool(toolName: AgentToolName, params: any) {
  const tool = agentTools[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    return tool.execute(params);
  } catch (error) {
    throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}