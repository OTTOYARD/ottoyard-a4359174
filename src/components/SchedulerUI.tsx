// Drag-and-drop scheduler UI component for OttoCommand

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Battery, Zap, Clock, AlertTriangle, CheckCircle2, Play, Loader2 } from 'lucide-react';
import { Vehicle, ChargingStall, ScheduleAssignment, OptimizationPlan } from '../types';

interface SchedulerUIProps {
  vehicles: Vehicle[];
  stalls: ChargingStall[];
  assignments: ScheduleAssignment[];
  onScheduleVehicle: (vehicleId: string, stallId: string) => Promise<any>;
  onOptimizePlan: (depotId: string) => Promise<OptimizationPlan>;
  onApplyPlan: (plan: OptimizationPlan) => Promise<void>;
}

interface DragData {
  type: 'vehicle';
  vehicleId: string;
}

export default function SchedulerUI({
  vehicles,
  stalls,
  assignments,
  onScheduleVehicle,
  onOptimizePlan,
  onApplyPlan,
}: SchedulerUIProps) {
  const [draggedItem, setDraggedItem] = useState<DragData | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [optimizationPlan, setOptimizationPlan] = useState<OptimizationPlan | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter vehicles that need charging (SOC < 80% and available)
  const vehiclesNeedingCharge = vehicles
    .filter(v => v.stateOfCharge < 80 && v.status === 'available')
    .sort((a, b) => a.stateOfCharge - b.stateOfCharge);

  // Filter available stalls
  const availableStalls = stalls
    .filter(s => s.status === 'available')
    .sort((a, b) => b.powerRating - a.powerRating);

  // Get current assignments for display
  const activeAssignments = assignments.filter(a =>
    a.status === 'scheduled' || a.status === 'active'
  );

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleDragStart = (e: React.DragEvent, data: DragData) => {
    setDraggedItem(data);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (stallId: string) => {
    if (draggedItem) {
      setDropTarget(stallId);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, stallId: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem || draggedItem.type !== 'vehicle') {
      return;
    }

    try {
      const result = await onScheduleVehicle(draggedItem.vehicleId, stallId);
      if (result.success) {
        setSuccess(`Successfully scheduled vehicle ${draggedItem.vehicleId} to stall ${stallId}`);
        clearMessages();
      } else {
        setError(result.error || 'Failed to schedule vehicle');
        clearMessages();
      }
    } catch (err) {
      setError('Error scheduling vehicle: ' + (err instanceof Error ? err.message : 'Unknown error'));
      clearMessages();
    }

    setDraggedItem(null);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const plan = await onOptimizePlan('depot-alpha');
      setOptimizationPlan(plan);
      setSuccess(`Generated optimization plan with ${plan.assignments.length} assignments`);
      clearMessages();
    } catch (err) {
      setError('Failed to generate optimization plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
      clearMessages();
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!optimizationPlan) return;

    setIsApplying(true);
    setError(null);

    try {
      await onApplyPlan(optimizationPlan);
      setSuccess('Optimization plan applied successfully!');
      setOptimizationPlan(null);
      clearMessages();
    } catch (err) {
      setError('Failed to apply plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
      clearMessages();
    } finally {
      setIsApplying(false);
    }
  };

  const getBatteryColor = (soc: number) => {
    if (soc <= 20) return 'text-red-500';
    if (soc <= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStallStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'border-green-500 bg-green-50';
      case 'occupied': return 'border-blue-500 bg-blue-50';
      case 'maintenance': return 'border-red-500 bg-red-50';
      case 'reserved': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6" data-testid="scheduler-ui">
      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Optimization Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Charging Plan Optimization
            </span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing || vehiclesNeedingCharge.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  'Optimize Plan'
                )}
              </Button>
              {optimizationPlan && (
                <Button
                  onClick={handleApplyPlan}
                  disabled={isApplying}
                  variant="outline"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply Plan'
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        {optimizationPlan && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(optimizationPlan.metrics.totalUtilization * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {optimizationPlan.metrics.avgWaitTime.toFixed(0)}m
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Energy Efficiency</p>
                <p className="text-2xl font-bold text-green-600">
                  {optimizationPlan.metrics.energyEfficiency.toFixed(1)} kW
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {optimizationPlan.assignments.length} assignments planned
            </Badge>
          </CardContent>
        )}
      </Card>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Vehicles Needing Charge */}
        <Card data-testid="vehicles-section">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Battery className="h-5 w-5 mr-2" />
              Vehicles ({vehiclesNeedingCharge.length})
              <Badge variant="secondary" className="ml-2">
                SOC &lt; 80%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehiclesNeedingCharge.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All vehicles sufficiently charged
                </p>
              ) : (
                vehiclesNeedingCharge.map(vehicle => (
                  <div
                    key={vehicle.id}
                    data-testid="vehicle-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, { type: 'vehicle', vehicleId: vehicle.id })}
                    className="p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{vehicle.id}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                      </div>
                      <div className="flex items-center space-x-2" data-testid="battery-indicator">
                        <Battery className={`h-4 w-4 ${getBatteryColor(vehicle.stateOfCharge)}`} />
                        <span className={`text-sm font-medium ${getBatteryColor(vehicle.stateOfCharge)}`}>
                          {vehicle.stateOfCharge}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Available Stalls */}
        <Card data-testid="stalls-section">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Available Stalls ({availableStalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableStalls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No stalls available
                </p>
              ) : (
                availableStalls.map(stall => (
                  <div
                    key={stall.id}
                    data-testid="stall-card"
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(stall.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stall.id)}
                    className={`p-3 border-2 border-dashed rounded-lg transition-colors ${
                      dropTarget === stall.id
                        ? 'border-blue-500 bg-blue-50'
                        : getStallStatusColor(stall.status)
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{stall.id}</p>
                        <p className="text-xs text-muted-foreground">{stall.connectorType}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{stall.powerRating}kW</span>
                      </div>
                    </div>
                    {dropTarget === stall.id && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        Drop vehicle here to schedule
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Current Assignments */}
        <Card data-testid="assignments-section">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Current Assignments ({activeAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active assignments
                </p>
              ) : (
                activeAssignments.map(assignment => (
                  <div key={assignment.id} data-testid="assignment-card" className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{assignment.vehicleId}</p>
                      <Badge
                        variant={assignment.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>→ {assignment.stallId || assignment.bayId}</p>
                      <p>Start: {new Date(assignment.startTime).toLocaleTimeString()}</p>
                      <p>End: {new Date(assignment.endTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card data-testid="instructions">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <div className="bg-blue-100 rounded-full p-1">
              <Play className="h-3 w-3 text-blue-600" />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">How to use the scheduler:</p>
              <ul className="space-y-1">
                <li>• Drag vehicles from the left column to available stalls in the middle</li>
                <li>• Click "Optimize Plan" to automatically generate assignments</li>
                <li>• Review the optimization metrics and click "Apply Plan" to execute</li>
                <li>• Current assignments are shown in the right column</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}