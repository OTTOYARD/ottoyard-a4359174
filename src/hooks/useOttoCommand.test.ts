// Unit tests for useOttoCommand hook

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOttoCommand } from './useOttoCommand';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOttoCommand hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('should initialize with mock data', () => {
    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    expect(result.current.vehicles).toBeDefined();
    expect(result.current.stalls).toBeDefined();
    expect(result.current.assignments).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should provide all agent tool functions', () => {
    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    expect(typeof result.current.listStalls).toBe('function');
    expect(typeof result.current.getChargingQueue).toBe('function');
    expect(typeof result.current.scheduleVehicle).toBe('function');
    expect(typeof result.current.assignDetailing).toBe('function');
    expect(typeof result.current.optimizeChargingPlan).toBe('function');
    expect(typeof result.current.getUtilizationReport).toBe('function');
    expect(typeof result.current.applyOptimizationPlan).toBe('function');
    expect(typeof result.current.refreshData).toBe('function');
  });

  it('should handle API calls with fallback', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 'CS001', depotId: 'depot-alpha', status: 'available' }
      ]),
    });

    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    let stalls;
    await act(async () => {
      stalls = await result.current.listStalls();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/stalls?depot_id=depot-alpha',
      expect.any(Object)
    );
  });

  it('should fallback to mock data when API fails', async () => {
    // Mock API failure
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    let stalls;
    await act(async () => {
      stalls = await result.current.listStalls();
    });

    // Should still return data (from mock fallback)
    expect(Array.isArray(stalls)).toBe(true);
  });

  it('should handle schedule vehicle with state update', async () => {
    const mockAssignment = {
      success: true,
      assignment: {
        id: 'SA001',
        vehicleId: 'V001',
        stallId: 'CS001',
        startTime: new Date(),
        endTime: new Date(),
        type: 'charging' as const,
        status: 'scheduled' as const,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAssignment),
    });

    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    const initialAssignments = result.current.assignments.length;

    await act(async () => {
      await result.current.scheduleVehicle('V001', 'CS001');
    });

    // Should have added new assignment to state
    expect(result.current.assignments.length).toBe(initialAssignments + 1);
  });

  it('should handle optimization plan application', async () => {
    const mockPlan = {
      assignments: [
        {
          id: 'OPT001',
          vehicleId: 'V001',
          stallId: 'CS001',
          startTime: new Date(),
          endTime: new Date(),
          type: 'charging' as const,
          status: 'scheduled' as const,
        },
      ],
      metrics: { totalUtilization: 0.75, avgWaitTime: 15, energyEfficiency: 125 },
      objective: 'minimize_wait' as const,
    };

    // Mock successful schedule calls
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        assignment: mockPlan.assignments[0],
      }),
    });

    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    await act(async () => {
      await result.current.applyOptimizationPlan(mockPlan);
    });

    // Should have applied the assignments
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    // Should still work with fallback
    await act(async () => {
      const queue = await result.current.getChargingQueue();
      expect(queue).toBeDefined();
      expect(queue.vehicles).toBeDefined();
    });
  });

  it('should enable polling when configured', async () => {
    vi.useFakeTimers();

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ vehicles: [], estimatedWaitTimes: {} }),
    });

    const { result } = renderHook(() =>
      useOttoCommand({
        depotId: 'depot-alpha',
        enablePolling: true,
        pollInterval: 1000,
      })
    );

    // Initial call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should have made another call
    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    vi.useRealTimers();
  });

  it('should handle refresh data', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vehicles: [], estimatedWaitTimes: {} }),
      });

    const { result } = renderHook(() =>
      useOttoCommand({ depotId: 'depot-alpha' })
    );

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.refreshData();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2); // listStalls + getChargingQueue
  });
});