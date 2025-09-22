import { describe, it, expect } from 'vitest'
import { agentTools, executeAgentTool } from '../../src/agent/tools'

describe('Agent Tools', () => {
  describe('Tool Schemas', () => {
    it('should have proper schema structure for all tools', () => {
      const toolNames = Object.keys(agentTools)
      expect(toolNames).toContain('list_stalls')
      expect(toolNames).toContain('get_charging_queue')
      expect(toolNames).toContain('schedule_vehicle')
      expect(toolNames).toContain('assign_detailing')
      expect(toolNames).toContain('optimize_charging_plan')
      expect(toolNames).toContain('utilization_report')

      toolNames.forEach(toolName => {
        const tool = agentTools[toolName as keyof typeof agentTools]
        expect(tool).toHaveProperty('schema')
        expect(tool).toHaveProperty('execute')
        expect(tool.schema).toHaveProperty('name')
        expect(tool.schema).toHaveProperty('description')
        expect(tool.schema).toHaveProperty('parameters')
        expect(typeof tool.execute).toBe('function')
      })
    })

    it('should have valid JSON schema parameters', () => {
      Object.values(agentTools).forEach(tool => {
        expect(tool.schema.parameters).toHaveProperty('type', 'object')
        expect(tool.schema.parameters).toHaveProperty('properties')
        expect(tool.schema.parameters).toHaveProperty('required')
        expect(Array.isArray(tool.schema.parameters.required)).toBe(true)
      })
    })
  })

  describe('executeAgentTool', () => {
    it('should execute list_stalls tool', () => {
      const result = executeAgentTool('list_stalls', { depot_id: 'depot-1' })
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('depot_id', 'depot-1')
    })

    it('should execute get_charging_queue tool', () => {
      const result = executeAgentTool('get_charging_queue', { depot_id: 'depot-1' })
      expect(Array.isArray(result)).toBe(true)
      result.forEach(vehicle => {
        expect(vehicle).toHaveProperty('status', 'available')
        expect(vehicle).toHaveProperty('depot_id', 'depot-1')
      })
    })

    it('should execute schedule_vehicle tool', () => {
      const params = {
        vehicle_id: 'vehicle-1',
        stall_id: 'stall-2',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }

      const result = executeAgentTool('schedule_vehicle', params)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('vehicle_id', params.vehicle_id)
      expect(result).toHaveProperty('stall_id', params.stall_id)
      expect(result).toHaveProperty('type', 'charging')
    })

    it('should execute assign_detailing tool', () => {
      const params = {
        vehicle_id: 'vehicle-1',
        bay_id: 'bay-1',
        time_window: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
        }
      }

      const result = executeAgentTool('assign_detailing', params)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('vehicle_id', params.vehicle_id)
      expect(result).toHaveProperty('bay_id', params.bay_id)
      expect(result).toHaveProperty('type', 'detailing')
    })

    it('should execute optimize_charging_plan tool', () => {
      const params = {
        depot_id: 'depot-1',
        horizon_minutes: 120,
        objective: 'maximize_utilization'
      }

      const result = executeAgentTool('optimize_charging_plan', params)
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('depot_id', params.depot_id)
      expect(result).toHaveProperty('assignments')
      expect(result).toHaveProperty('metrics')
      expect(Array.isArray(result.assignments)).toBe(true)
    })

    it('should execute utilization_report tool', () => {
      const params = {
        depot_id: 'depot-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      const result = executeAgentTool('utilization_report', params)
      expect(result).toHaveProperty('depot_id', params.depot_id)
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('recommendations')
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should throw error for unknown tool', () => {
      expect(() => {
        executeAgentTool('unknown_tool' as any, {})
      }).toThrow('Unknown tool: unknown_tool')
    })

    it('should propagate execution errors', () => {
      // Try to schedule with invalid vehicle ID
      const params = {
        vehicle_id: 'invalid-vehicle',
        stall_id: 'stall-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }

      expect(() => {
        executeAgentTool('schedule_vehicle', params)
      }).toThrow('Tool execution failed')
    })
  })

  describe('Tool Parameter Validation', () => {
    it('should handle optional parameters correctly', () => {
      // list_stalls with optional status parameter
      const result1 = executeAgentTool('list_stalls', { depot_id: 'depot-1' })
      const result2 = executeAgentTool('list_stalls', { depot_id: 'depot-1', status: 'available' })

      expect(Array.isArray(result1)).toBe(true)
      expect(Array.isArray(result2)).toBe(true)
      expect(result2.length).toBeLessThanOrEqual(result1.length)
    })

    it('should handle default values for optimize_charging_plan', () => {
      const result = executeAgentTool('optimize_charging_plan', { depot_id: 'depot-1' })
      expect(result).toHaveProperty('depot_id', 'depot-1')
      expect(result).toHaveProperty('objective', 'maximize_utilization')
    })
  })
})