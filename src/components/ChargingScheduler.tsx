import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Zap, Car, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Vehicle, ChargingStall, ScheduleAssignment, OptimizationPlan } from '../types';

interface ChargingSchedulerProps {
  depotId?: string;
}

export function ChargingScheduler({ depotId = 'depot-1' }: ChargingSchedulerProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stalls, setStalls] = useState<ChargingStall[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [optimizationPlan, setOptimizationPlan] = useState<OptimizationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedVehicle, setDraggedVehicle] = useState<Vehicle | null>(null);

  const API_BASE = 'http://localhost:3001/api';

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [vehiclesRes, stallsRes] = await Promise.all([
        fetch(`${API_BASE}/charging-queue?depot_id=${depotId}`),
        fetch(`${API_BASE}/stalls?depot_id=${depotId}`)
      ]);

      if (!vehiclesRes.ok || !stallsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const vehiclesData = await vehiclesRes.json();
      const stallsData = await stallsRes.json();

      setVehicles(vehiclesData.queue || []);
      setStalls(stallsData.stalls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setVehicles([
        { id: 'vehicle-1', depot_id: depotId, soc: 15, status: 'available', location: {}, model: 'Tesla Model Y', battery_capacity: 75, created_at: '', updated_at: '' },
        { id: 'vehicle-2', depot_id: depotId, soc: 8, status: 'available', location: {}, model: 'Tesla Model 3', battery_capacity: 60, created_at: '', updated_at: '' }
      ]);
      setStalls([
        { id: 'stall-1', depot_id: depotId, status: 'available', power_kw: 150, created_at: '', updated_at: '' },
        { id: 'stall-2', depot_id: depotId, status: 'available', power_kw: 250, created_at: '', updated_at: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, vehicle: Vehicle) => {
    setDraggedVehicle(vehicle);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stall: ChargingStall) => {
    e.preventDefault();

    if (!draggedVehicle || stall.status !== 'available') {
      setDraggedVehicle(null);
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    try {
      const response = await fetch(`${API_BASE}/schedule-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: draggedVehicle.id,
          stall_id: stall.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAssignments(prev => [...prev, result.assignment]);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to schedule vehicle');
      }
    } catch (err) {
      setError('Network error occurred');
    }

    setDraggedVehicle(null);
  };

  const optimizeCharging = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/optimize-charging-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depot_id: depotId,
          horizon_minutes: 120,
          objective: 'maximize_utilization'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setOptimizationPlan(result.plan);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to optimize charging plan');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyOptimizationPlan = () => {
    if (!optimizationPlan) return;

    setAssignments(prev => [...prev, ...optimizationPlan.assignments]);
    setOptimizationPlan(null);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [depotId]);

  const getSocColor = (soc: number) => {
    if (soc < 20) return 'text-red-600';
    if (soc < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'maintenance': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6" data-testid="charging-scheduler">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" />
          Charging/Staging Scheduler
        </h2>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={optimizeCharging} disabled={loading}>
            Optimize Plan
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicles (Low SOC First)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, vehicle)}
                  className="p-3 border rounded-lg cursor-grab hover:shadow-md transition-shadow bg-white"
                  data-testid="vehicle-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{vehicle.model}</div>
                    <Badge variant="outline" className={getSocColor(vehicle.soc)}>
                      {vehicle.soc}% SOC
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {vehicle.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Battery: {vehicle.battery_capacity} kWh
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stalls Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Open Stalls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stalls.map((stall) => (
                <div
                  key={stall.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stall)}
                  className={`p-3 border rounded-lg transition-all ${
                    stall.status === 'available'
                      ? 'border-dashed border-green-300 hover:border-green-500 hover:bg-green-50'
                      : 'border-solid opacity-60'
                  }`}
                  data-testid="stall-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">Stall {stall.id.split('-')[1]}</div>
                    <Badge className={getStatusColor(stall.status)}>
                      {stall.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {stall.power_kw} kW Power
                  </div>
                  {stall.vehicle_id && (
                    <div className="text-sm text-blue-600">
                      Vehicle: {stall.vehicle_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  No active assignments
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-3 border rounded-lg bg-blue-50 border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">
                        {assignment.vehicle_id} → {assignment.stall_id || assignment.bay_id}
                      </div>
                      <Badge variant="outline">{assignment.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Type: {assignment.type}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(assignment.start_time).toLocaleTimeString()} - {new Date(assignment.end_time).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Plan */}
      {optimizationPlan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Proposed Optimization Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Charging Time</div>
                  <div>{Math.round(optimizationPlan.metrics.total_charging_time)} minutes</div>
                </div>
                <div>
                  <div className="font-medium">Utilization Rate</div>
                  <div>{Math.round(optimizationPlan.metrics.utilization_rate)}%</div>
                </div>
                <div>
                  <div className="font-medium">Assignments</div>
                  <div>{optimizationPlan.assignments.length} vehicles</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                {optimizationPlan.assignments.slice(0, 3).map((assignment, idx) => (
                  <div key={idx} className="text-sm p-2 bg-white rounded border">
                    {assignment.vehicle_id} → {assignment.stall_id} at {new Date(assignment.start_time).toLocaleTimeString()}
                  </div>
                ))}
                {optimizationPlan.assignments.length > 3 && (
                  <div className="text-sm text-gray-600">
                    +{optimizationPlan.assignments.length - 3} more assignments...
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={applyOptimizationPlan}>
                  Apply Plan
                </Button>
                <Button variant="outline" onClick={() => setOptimizationPlan(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}