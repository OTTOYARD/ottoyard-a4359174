// Agent tools with JSON Schema definitions and runtime bindings

import {
  listStalls,
  getChargingQueue,
  scheduleVehicle,
  assignDetailing,
  optimizeChargingPlan,
  utilizationReport,
} from '../services/scheduling';
import { AgentTool } from '../types';

// JSON Schema definitions for agent tools
export const agentTools: AgentTool[] = [
  {
    name: 'list_stalls',
    description: 'List charging stalls in a depot, optionally filtered by status',
    parameters: {
      type: 'object',
      properties: {
        depot_id: {
          type: 'string',
          description: 'The depot identifier',
        },
        status: {
          type: 'string',
          enum: ['available', 'occupied', 'maintenance', 'reserved'],
          description: 'Optional status filter',
        },
      },
      required: ['depot_id'],
    },
    handler: (depot_id: string, status?: string) => {
      return listStalls(depot_id, status);
    },
  },

  {
    name: 'get_charging_queue',
    description: 'Get the current charging queue for a depot, sorted by priority (lowest SOC first)',
    parameters: {
      type: 'object',
      properties: {
        depot_id: {
          type: 'string',
          description: 'The depot identifier',
        },
      },
      required: ['depot_id'],
    },
    handler: (depot_id: string) => {
      return getChargingQueue(depot_id);
    },
  },

  {
    name: 'schedule_vehicle',
    description: 'Schedule a vehicle to a charging stall with double-booking prevention',
    parameters: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'The vehicle identifier',
        },
        stall_id: {
          type: 'string',
          description: 'The charging stall identifier',
        },
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Start time in ISO 8601 format',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'End time in ISO 8601 format',
        },
      },
      required: ['vehicle_id', 'stall_id', 'start', 'end'],
    },
    handler: (vehicle_id: string, stall_id: string, start: string, end: string) => {
      const startTime = new Date(start);
      const endTime = new Date(end);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }

      if (startTime >= endTime) {
        return { success: false, error: 'Start time must be before end time' };
      }

      return scheduleVehicle(vehicle_id, stall_id, startTime, endTime);
    },
  },

  {
    name: 'assign_detailing',
    description: 'Assign a vehicle to a detailing bay within a specified time window',
    parameters: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'The vehicle identifier',
        },
        bay_id: {
          type: 'string',
          description: 'The detailing bay identifier',
        },
        time_window: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Start time in ISO 8601 format',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'End time in ISO 8601 format',
            },
          },
          required: ['start', 'end'],
        },
      },
      required: ['vehicle_id', 'bay_id', 'time_window'],
    },
    handler: (vehicle_id: string, bay_id: string, time_window: { start: string; end: string }) => {
      const startTime = new Date(time_window.start);
      const endTime = new Date(time_window.end);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }

      if (startTime >= endTime) {
        return { success: false, error: 'Start time must be before end time' };
      }

      return assignDetailing(vehicle_id, bay_id, { start: startTime, end: endTime });
    },
  },

  {
    name: 'optimize_charging_plan',
    description: 'Generate an optimized charging plan for a depot with specified objective',
    parameters: {
      type: 'object',
      properties: {
        depot_id: {
          type: 'string',
          description: 'The depot identifier',
        },
        horizon_minutes: {
          type: 'integer',
          minimum: 30,
          maximum: 480,
          default: 120,
          description: 'Planning horizon in minutes (30-480)',
        },
        objective: {
          type: 'string',
          enum: ['minimize_wait', 'maximize_utilization', 'minimize_energy_cost'],
          default: 'minimize_wait',
          description: 'Optimization objective',
        },
      },
      required: ['depot_id'],
    },
    handler: (
      depot_id: string,
      horizon_minutes: number = 120,
      objective: 'minimize_wait' | 'maximize_utilization' | 'minimize_energy_cost' = 'minimize_wait'
    ) => {
      if (horizon_minutes < 30 || horizon_minutes > 480) {
        return { error: 'horizon_minutes must be between 30 and 480' };
      }

      return optimizeChargingPlan(depot_id, horizon_minutes, objective);
    },
  },

  {
    name: 'utilization_report',
    description: 'Generate a utilization report for a depot over a specified time period',
    parameters: {
      type: 'object',
      properties: {
        depot_id: {
          type: 'string',
          description: 'The depot identifier',
        },
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Report start time in ISO 8601 format',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'Report end time in ISO 8601 format',
        },
      },
      required: ['depot_id', 'start', 'end'],
    },
    handler: (depot_id: string, start: string, end: string) => {
      const startTime = new Date(start);
      const endTime = new Date(end);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return { error: 'Invalid date format' };
      }

      if (startTime >= endTime) {
        return { error: 'Start time must be before end time' };
      }

      const maxReportDays = 30;
      const reportDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
      if (reportDuration > maxReportDays) {
        return { error: `Report period cannot exceed ${maxReportDays} days` };
      }

      return utilizationReport(depot_id, startTime, endTime);
    },
  },
];

// Tool execution helper
export function executeAgentTool(toolName: string, parameters: any): any {
  const tool = agentTools.find(t => t.name === toolName);
  if (!tool) {
    return { error: `Tool '${toolName}' not found` };
  }

  try {
    // Basic parameter validation could be added here
    return tool.handler(...Object.values(parameters));
  } catch (error) {
    return {
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Tool registry for easy access
export const toolRegistry = agentTools.reduce((registry, tool) => {
  registry[tool.name] = tool;
  return registry;
}, {} as Record<string, AgentTool>);

// Export individual tools for direct use
export const tools = {
  listStalls: toolRegistry['list_stalls'],
  getChargingQueue: toolRegistry['get_charging_queue'],
  scheduleVehicle: toolRegistry['schedule_vehicle'],
  assignDetailing: toolRegistry['assign_detailing'],
  optimizeChargingPlan: toolRegistry['optimize_charging_plan'],
  utilizationReport: toolRegistry['utilization_report'],
};