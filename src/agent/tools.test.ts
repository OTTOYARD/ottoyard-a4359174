// Unit tests for agent tools

import { describe, it, expect, beforeEach } from 'vitest';
import { executeAgentTool, agentTools, toolRegistry } from './tools';

describe('Agent Tools', () => {
  describe('tool registry', () => {
    it('should have all 6 required tools', () => {
      const expectedTools = [
        'list_stalls',
        'get_charging_queue',
        'schedule_vehicle',
        'assign_detailing',
        'optimize_charging_plan',
        'utilization_report',
      ];

      expectedTools.forEach(toolName => {
        expect(toolRegistry[toolName]).toBeDefined();
        expect(toolRegistry[toolName].name).toBe(toolName);
      });
    });

    it('should have valid JSON schemas for all tools', () => {
      agentTools.forEach(tool => {
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
        expect(Array.isArray(tool.parameters.required)).toBe(true);
      });
    });
  });

  describe('executeAgentTool', () => {
    it('should execute list_stalls tool', () => {
      const result = executeAgentTool('list_stalls', { depot_id: 'depot-alpha' });

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(stall => stall.depotId === 'depot-alpha')).toBe(true);
    });

    it('should execute get_charging_queue tool', () => {
      const result = executeAgentTool('get_charging_queue', { depot_id: 'depot-alpha' });

      expect(result.vehicles).toBeDefined();
      expect(result.estimatedWaitTimes).toBeDefined();
      expect(Array.isArray(result.vehicles)).toBe(true);
    });

    it('should execute schedule_vehicle tool with valid dates', () => {
      const result = executeAgentTool('schedule_vehicle', {
        vehicle_id: 'V001',
        stall_id: 'CS001',
        start: '2024-10-01T10:00:00Z',
        end: '2024-10-01T11:00:00Z',
      });

      expect(result.success).toBeDefined();
    });

    it('should handle invalid tool names', () => {
      const result = executeAgentTool('invalid_tool', {});

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    it('should handle tool execution errors', () => {
      const result = executeAgentTool('schedule_vehicle', {
        vehicle_id: 'V001',
        stall_id: 'CS001',
        start: 'invalid-date',
        end: '2024-10-01T11:00:00Z',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    it('should validate time ranges for schedule_vehicle', () => {
      const result = executeAgentTool('schedule_vehicle', {
        vehicle_id: 'V001',
        stall_id: 'CS001',
        start: '2024-10-01T11:00:00Z',
        end: '2024-10-01T10:00:00Z', // End before start
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Start time must be before end time');
    });

    it('should execute assign_detailing tool', () => {
      const result = executeAgentTool('assign_detailing', {
        vehicle_id: 'V002',
        bay_id: 'DB001',
        time_window: {
          start: '2024-10-01T14:00:00Z',
          end: '2024-10-01T15:00:00Z',
        },
      });

      expect(result.success).toBeDefined();
    });

    it('should execute optimize_charging_plan tool', () => {
      const result = executeAgentTool('optimize_charging_plan', {
        depot_id: 'depot-alpha',
      });

      expect(result.assignments).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.objective).toBe('minimize_wait');
    });

    it('should validate horizon_minutes parameter', () => {
      const result = executeAgentTool('optimize_charging_plan', {
        depot_id: 'depot-alpha',
        horizon_minutes: 500, // Too high
      });

      expect(result.error).toContain('horizon_minutes must be between 30 and 480');
    });

    it('should execute utilization_report tool', () => {
      const result = executeAgentTool('utilization_report', {
        depot_id: 'depot-alpha',
        start: '2024-10-01T00:00:00Z',
        end: '2024-10-02T00:00:00Z',
      });

      expect(result.depotId).toBe('depot-alpha');
      expect(result.chargingStats).toBeDefined();
      expect(result.detailingStats).toBeDefined();
    });

    it('should validate date ranges for utilization_report', () => {
      const result = executeAgentTool('utilization_report', {
        depot_id: 'depot-alpha',
        start: '2024-10-01T00:00:00Z',
        end: '2024-09-01T00:00:00Z', // End before start
      });

      expect(result.error).toContain('Start time must be before end time');
    });

    it('should limit report period length', () => {
      const result = executeAgentTool('utilization_report', {
        depot_id: 'depot-alpha',
        start: '2024-01-01T00:00:00Z',
        end: '2024-12-31T00:00:00Z', // Too long
      });

      expect(result.error).toContain('cannot exceed 30 days');
    });
  });

  describe('tool parameter validation', () => {
    it('should have required parameters defined', () => {
      const listStallsTool = toolRegistry['list_stalls'];
      expect(listStallsTool.parameters.required).toContain('depot_id');

      const scheduleVehicleTool = toolRegistry['schedule_vehicle'];
      expect(scheduleVehicleTool.parameters.required).toEqual([
        'vehicle_id',
        'stall_id',
        'start',
        'end',
      ]);
    });

    it('should have proper parameter types', () => {
      const optimizeTool = toolRegistry['optimize_charging_plan'];
      const horizonParam = optimizeTool.parameters.properties.horizon_minutes;

      expect(horizonParam.type).toBe('integer');
      expect(horizonParam.minimum).toBe(30);
      expect(horizonParam.maximum).toBe(480);
      expect(horizonParam.default).toBe(120);
    });

    it('should have enum constraints where appropriate', () => {
      const optimizeTool = toolRegistry['optimize_charging_plan'];
      const objectiveParam = optimizeTool.parameters.properties.objective;

      expect(Array.isArray(objectiveParam.enum)).toBe(true);
      expect(objectiveParam.enum).toContain('minimize_wait');
      expect(objectiveParam.enum).toContain('maximize_utilization');
      expect(objectiveParam.enum).toContain('minimize_energy_cost');
    });
  });
});