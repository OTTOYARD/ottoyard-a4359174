// Unit tests for scheduling services

import { describe, it, expect, beforeEach } from 'vitest';
import {
  listStalls,
  getChargingQueue,
  scheduleVehicle,
  assignDetailing,
  optimizeChargingPlan,
  utilizationReport,
} from './scheduling';
import { mockVehicles, mockChargingStalls, mockDetailingBays, mockScheduleAssignments } from '../data/mock';

describe('Scheduling Services', () => {
  beforeEach(() => {
    // Reset mock data state between tests
    mockScheduleAssignments.length = 2; // Keep original assignments
  });

  describe('listStalls', () => {
    it('should return all stalls for a depot', () => {
      const result = listStalls('depot-alpha');
      expect(result).toHaveLength(5);
      expect(result.every(stall => stall.depotId === 'depot-alpha')).toBe(true);
    });

    it('should filter stalls by status', () => {
      const available = listStalls('depot-alpha', 'available');
      const occupied = listStalls('depot-alpha', 'occupied');

      expect(available.every(stall => stall.status === 'available')).toBe(true);
      expect(occupied.every(stall => stall.status === 'occupied')).toBe(true);
    });

    it('should sort stalls by power rating (highest first)', () => {
      const result = listStalls('depot-alpha');
      for (let i = 1; i < result.length; i++) {
        expect(result[i].powerRating).toBeLessThanOrEqual(result[i - 1].powerRating);
      }
    });
  });

  describe('getChargingQueue', () => {
    it('should return vehicles needing charge sorted by SOC', () => {
      const result = getChargingQueue('depot-alpha');

      // Should be sorted by lowest SOC first
      for (let i = 1; i < result.vehicles.length; i++) {
        expect(result.vehicles[i].stateOfCharge).toBeGreaterThanOrEqual(
          result.vehicles[i - 1].stateOfCharge
        );
      }
    });

    it('should only include vehicles with SOC < 80 and available status', () => {
      const result = getChargingQueue('depot-alpha');

      result.vehicles.forEach(vehicle => {
        expect(vehicle.stateOfCharge).toBeLessThan(80);
        expect(vehicle.status).toBe('available');
      });
    });

    it('should provide estimated wait times', () => {
      const result = getChargingQueue('depot-alpha');

      expect(result.estimatedWaitTimes).toBeDefined();
      result.vehicles.forEach(vehicle => {
        expect(result.estimatedWaitTimes[vehicle.id]).toBeDefined();
        expect(typeof result.estimatedWaitTimes[vehicle.id]).toBe('number');
      });
    });
  });

  describe('scheduleVehicle', () => {
    const startTime = new Date('2024-10-01T10:00:00Z');
    const endTime = new Date('2024-10-01T11:00:00Z');

    it('should successfully schedule an available vehicle to an available stall', () => {
      const result = scheduleVehicle('V001', 'CS001', startTime, endTime);

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment?.vehicleId).toBe('V001');
      expect(result.assignment?.stallId).toBe('CS001');
    });

    it('should prevent double-booking', () => {
      // First booking should succeed
      const first = scheduleVehicle('V001', 'CS001', startTime, endTime);
      expect(first.success).toBe(true);

      // Second booking to same stall at overlapping time should fail
      const overlappingStart = new Date('2024-10-01T10:30:00Z');
      const overlappingEnd = new Date('2024-10-01T11:30:00Z');

      const second = scheduleVehicle('V002', 'CS001', overlappingStart, overlappingEnd);
      expect(second.success).toBe(false);
      expect(second.error).toContain('already booked');
    });

    it('should fail for non-existent vehicle', () => {
      const result = scheduleVehicle('INVALID', 'CS001', startTime, endTime);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Vehicle not found');
    });

    it('should fail for non-existent stall', () => {
      const result = scheduleVehicle('V001', 'INVALID', startTime, endTime);

      expect(result.success).toBe(false);
      expect(result.error).toContain('stall not found');
    });

    it('should fail for unavailable vehicle', () => {
      // V003 is currently charging (not available)
      const result = scheduleVehicle('V003', 'CS001', startTime, endTime);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should fail for occupied stall', () => {
      // CS002 is occupied
      const result = scheduleVehicle('V001', 'CS002', startTime, endTime);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });
  });

  describe('assignDetailing', () => {
    const timeWindow = {
      start: new Date('2024-10-01T14:00:00Z'),
      end: new Date('2024-10-01T15:00:00Z'),
    };

    it('should successfully assign vehicle to available bay', () => {
      const result = assignDetailing('V002', 'DB001', timeWindow);

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment?.vehicleId).toBe('V002');
      expect(result.assignment?.bayId).toBe('DB001');
      expect(result.assignment?.type).toBe('detailing');
    });

    it('should prevent double-booking of bays', () => {
      // First assignment should succeed
      const first = assignDetailing('V002', 'DB001', timeWindow);
      expect(first.success).toBe(true);

      // Second assignment to same bay at overlapping time should fail
      const overlapping = {
        start: new Date('2024-10-01T14:30:00Z'),
        end: new Date('2024-10-01T15:30:00Z'),
      };

      const second = assignDetailing('V004', 'DB001', overlapping);
      expect(second.success).toBe(false);
      expect(second.error).toContain('already booked');
    });

    it('should fail for non-existent vehicle', () => {
      const result = assignDetailing('INVALID', 'DB001', timeWindow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Vehicle not found');
    });

    it('should fail for non-existent bay', () => {
      const result = assignDetailing('V002', 'INVALID', timeWindow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('bay not found');
    });
  });

  describe('optimizeChargingPlan', () => {
    it('should generate optimization plan with assignments', () => {
      const result = optimizeChargingPlan('depot-alpha');

      expect(result.assignments).toBeDefined();
      expect(Array.isArray(result.assignments)).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.objective).toBe('minimize_wait');
    });

    it('should respect different objectives', () => {
      const minimizeWait = optimizeChargingPlan('depot-alpha', 120, 'minimize_wait');
      const maximizeUtil = optimizeChargingPlan('depot-alpha', 120, 'maximize_utilization');

      expect(minimizeWait.objective).toBe('minimize_wait');
      expect(maximizeUtil.objective).toBe('maximize_utilization');
    });

    it('should include valid metrics', () => {
      const result = optimizeChargingPlan('depot-alpha');

      expect(result.metrics.totalUtilization).toBeGreaterThanOrEqual(0);
      expect(result.metrics.totalUtilization).toBeLessThanOrEqual(1);
      expect(result.metrics.avgWaitTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.energyEfficiency).toBeGreaterThanOrEqual(0);
    });

    it('should not assign more vehicles than available stalls', () => {
      const result = optimizeChargingPlan('depot-alpha');
      const availableStalls = mockChargingStalls.filter(s => s.status === 'available').length;

      expect(result.assignments.length).toBeLessThanOrEqual(availableStalls);
    });
  });

  describe('utilizationReport', () => {
    const start = new Date('2024-10-01T00:00:00Z');
    const end = new Date('2024-10-02T00:00:00Z');

    it('should generate comprehensive utilization report', () => {
      const result = utilizationReport('depot-alpha', start, end);

      expect(result.depotId).toBe('depot-alpha');
      expect(result.period.start).toEqual(start);
      expect(result.period.end).toEqual(end);
      expect(result.chargingStats).toBeDefined();
      expect(result.detailingStats).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include valid charging statistics', () => {
      const result = utilizationReport('depot-alpha', start, end);

      expect(result.chargingStats.totalSessions).toBeGreaterThanOrEqual(0);
      expect(result.chargingStats.avgSessionDuration).toBeGreaterThanOrEqual(0);
      expect(result.chargingStats.stallUtilization).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.chargingStats.peakHours)).toBe(true);
    });

    it('should include valid detailing statistics', () => {
      const result = utilizationReport('depot-alpha', start, end);

      expect(result.detailingStats.totalSessions).toBeGreaterThanOrEqual(0);
      expect(result.detailingStats.avgSessionDuration).toBeGreaterThanOrEqual(0);
      expect(result.detailingStats.bayUtilization).toBeGreaterThanOrEqual(0);
    });

    it('should provide actionable recommendations', () => {
      const result = utilizationReport('depot-alpha', start, end);

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });
});