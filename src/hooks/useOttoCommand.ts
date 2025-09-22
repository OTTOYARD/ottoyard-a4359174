// React hook for OttoCommand API interactions

import { useState, useEffect } from 'react';
import { Vehicle, ChargingStall, ScheduleAssignment, OptimizationPlan, ChargingQueue, UtilizationReport } from '../types';
import { mockVehicles, mockChargingStalls, mockScheduleAssignments } from '../data/mock';

const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3001/api';

interface UseOttoCommandOptions {
  depotId: string;
  enablePolling?: boolean;
  pollInterval?: number;
}

export function useOttoCommand({ depotId, enablePolling = false, pollInterval = 30000 }: UseOttoCommandOptions) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [stalls, setStalls] = useState<ChargingStall[]>(mockChargingStalls);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>(mockScheduleAssignments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback to mock data with API-like responses
  const withFallback = async <T>(apiCall: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await apiCall();
    } catch (err) {
      console.warn('API call failed, using mock data:', err);
      return fallback;
    }
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  // Agent tool functions
  const listStalls = async (status?: string) => {
    return withFallback(
      () => apiCall(`/stalls?depot_id=${depotId}${status ? `&status=${status}` : ''}`),
      mockChargingStalls.filter(s => s.depotId === depotId && (!status || s.status === status))
    );
  };

  const getChargingQueue = async (): Promise<ChargingQueue> => {
    return withFallback(
      () => apiCall(`/charging-queue?depot_id=${depotId}`),
      {
        vehicles: mockVehicles.filter(v => v.stateOfCharge < 80 && v.status === 'available'),
        estimatedWaitTimes: mockVehicles.reduce((acc, v) => {
          acc[v.id] = Math.floor(Math.random() * 45);
          return acc;
        }, {} as Record<string, number>),
      }
    );
  };

  const scheduleVehicle = async (vehicleId: string, stallId: string): Promise<{ success: boolean; assignment?: ScheduleAssignment; error?: string }> => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour from now

    return withFallback(
      () => apiCall('/schedule-vehicle', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: vehicleId,
          stall_id: stallId,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        }),
      }),
      {
        success: true,
        assignment: {
          id: `SA${Date.now()}`,
          vehicleId,
          stallId,
          startTime,
          endTime,
          type: 'charging' as const,
          status: 'scheduled' as const,
        },
      }
    );
  };

  const assignDetailing = async (vehicleId: string, bayId: string, timeWindow: { start: Date; end: Date }) => {
    return withFallback(
      () => apiCall('/assign-detailing', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: vehicleId,
          bay_id: bayId,
          time_window: {
            start: timeWindow.start.toISOString(),
            end: timeWindow.end.toISOString(),
          },
        }),
      }),
      {
        success: true,
        assignment: {
          id: `DA${Date.now()}`,
          vehicleId,
          bayId,
          startTime: timeWindow.start,
          endTime: timeWindow.end,
          type: 'detailing' as const,
          status: 'scheduled' as const,
        },
      }
    );
  };

  const optimizeChargingPlan = async (horizonMinutes = 120, objective: 'minimize_wait' | 'maximize_utilization' | 'minimize_energy_cost' = 'minimize_wait'): Promise<OptimizationPlan> => {
    return withFallback(
      () => apiCall('/optimize-charging-plan', {
        method: 'POST',
        body: JSON.stringify({
          depot_id: depotId,
          horizon_minutes: horizonMinutes,
          objective,
        }),
      }),
      {
        assignments: mockVehicles.slice(0, 3).map((vehicle, index) => ({
          id: `OPT${Date.now()}_${index}`,
          vehicleId: vehicle.id,
          stallId: mockChargingStalls[index]?.id || 'CS001',
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 60 * 1000),
          type: 'charging' as const,
          status: 'scheduled' as const,
        })),
        metrics: {
          totalUtilization: 0.75,
          avgWaitTime: 15,
          energyEfficiency: 125.5,
        },
        objective,
      }
    );
  };

  const getUtilizationReport = async (start: Date, end: Date): Promise<UtilizationReport> => {
    return withFallback(
      () => apiCall(`/utilization-report?depot_id=${depotId}&start=${start.toISOString()}&end=${end.toISOString()}`),
      {
        depotId,
        period: { start, end },
        chargingStats: {
          totalSessions: 45,
          avgSessionDuration: 75,
          stallUtilization: 0.68,
          peakHours: ['08:00-10:00', '17:00-19:00'],
        },
        detailingStats: {
          totalSessions: 12,
          avgSessionDuration: 45,
          bayUtilization: 0.4,
        },
        recommendations: [
          'Consider adding 2 more charging stalls to meet peak demand',
          'Schedule more detailing sessions during off-peak hours',
        ],
      }
    );
  };

  // Refresh data
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [stallsData, queueData] = await Promise.all([
        listStalls(),
        getChargingQueue(),
      ]);

      setStalls(stallsData);
      setVehicles(queueData.vehicles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Polling effect
  useEffect(() => {
    if (enablePolling) {
      refreshData();
      const interval = setInterval(refreshData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [depotId, enablePolling, pollInterval]);

  // Apply optimization plan
  const applyOptimizationPlan = async (plan: OptimizationPlan) => {
    const results = await Promise.allSettled(
      plan.assignments.map(assignment =>
        scheduleVehicle(assignment.vehicleId, assignment.stallId!)
      )
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      throw new Error(`Failed to apply ${failed.length} assignments`);
    }

    // Update local state with new assignments
    const newAssignments = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value.assignment)
      .filter(Boolean);

    setAssignments(prev => [...prev, ...newAssignments]);
  };

  return {
    // Data
    vehicles,
    stalls,
    assignments,
    isLoading,
    error,

    // Actions
    listStalls,
    getChargingQueue,
    scheduleVehicle: async (vehicleId: string, stallId: string) => {
      const result = await scheduleVehicle(vehicleId, stallId);
      if (result.success && result.assignment) {
        setAssignments(prev => [...prev, result.assignment!]);
      }
      return result;
    },
    assignDetailing,
    optimizeChargingPlan,
    getUtilizationReport,
    applyOptimizationPlan,
    refreshData,
  };
}