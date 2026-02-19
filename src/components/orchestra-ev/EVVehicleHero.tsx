import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Car,
  Battery,
  MapPin,
  Heart,
  Gauge,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import type { SubscriberVehicle } from "@/lib/orchestra-ev/types";

interface EVVehicleHeroProps {
  vehicle: SubscriberVehicle;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  charging: { label: "Charging", color: "bg-primary/15 text-primary border-primary/30", icon: Zap },
  at_depot: { label: "At Depot", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: MapPin },
  at_home: { label: "At Home", color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  in_service: { label: "In Service", color: "bg-warning/15 text-warning border-warning/30", icon: Activity },
  en_route_depot: { label: "En Route", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Navigation },
  ready: { label: "Ready", color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
};

export const EVVehicleHero: React.FC<EVVehicleHeroProps> = ({ vehicle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const socPct = Math.round(vehicle.currentSoc * 100);
  const status = statusConfig[vehicle.currentStatus] || statusConfig.at_depot;
  const StatusIcon = status.icon;

  const tirePressureStatus = (psi: number) => {
    if (psi >= 40 && psi <= 44) return "text-success";
    if (psi >= 36 && psi < 40) return "text-warning";
    return "text-destructive";
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full p-0 h-auto hover:bg-transparent justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-muted-foreground">{vehicle.color}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Always visible — Battery & Quick Stats */}
          <div className="space-y-3">
            {/* Battery Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Battery className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Battery</span>
                </div>
                <span className="text-sm font-bold text-foreground">{socPct}%</span>
              </div>
              <Progress value={socPct} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Target: {vehicle.chargingPreferencePct}%</span>
                <span>Est. Range: {vehicle.estimatedRangeMiles} mi</span>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-panel rounded-lg p-2 text-center border border-border/30">
                <Heart className="h-3.5 w-3.5 mx-auto text-primary mb-0.5" />
                <p className="text-sm font-bold text-foreground">{vehicle.healthScore}</p>
                <p className="text-[10px] text-muted-foreground">Health Score</p>
              </div>
              <div className="glass-panel rounded-lg p-2 text-center border border-border/30">
                <Gauge className="h-3.5 w-3.5 mx-auto text-primary mb-0.5" />
                <p className="text-sm font-bold text-foreground">{(vehicle.odometerMiles / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-muted-foreground">Miles</p>
              </div>
              <div className="glass-panel rounded-lg p-2 text-center border border-border/30">
                <MapPin className="h-3.5 w-3.5 mx-auto text-primary mb-0.5" />
                <p className="text-sm font-bold text-foreground">Depot #1</p>
                <p className="text-[10px] text-muted-foreground">Location</p>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          <CollapsibleContent className="space-y-4 pt-2">
            {/* Battery Diagnostics */}
            <div className="glass-panel rounded-lg p-3 border border-border/30 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Battery Diagnostics
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-medium text-foreground">{vehicle.batteryCapacityKwh} kWh</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Battery Health</p>
                  <p className="font-medium text-foreground">{vehicle.batteryHealthPct}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current SOC</p>
                  <p className="font-medium text-foreground">{socPct}% ({(vehicle.currentSoc * vehicle.batteryCapacityKwh).toFixed(1)} kWh)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Charge Target</p>
                  <p className="font-medium text-foreground">{vehicle.chargingPreferencePct}%</p>
                </div>
              </div>
            </div>

            {/* Tire Pressure */}
            <div className="glass-panel rounded-lg p-3 border border-border/30 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                Tire Pressure ({vehicle.tirePressure.unit.toUpperCase()})
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Left</span>
                  <span className={`font-medium ${tirePressureStatus(vehicle.tirePressure.fl)}`}>
                    {vehicle.tirePressure.fl}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front Right</span>
                  <span className={`font-medium ${tirePressureStatus(vehicle.tirePressure.fr)}`}>
                    {vehicle.tirePressure.fr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Left</span>
                  <span className={`font-medium ${tirePressureStatus(vehicle.tirePressure.rl)}`}>
                    {vehicle.tirePressure.rl}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rear Right</span>
                  <span className={`font-medium ${tirePressureStatus(vehicle.tirePressure.rr)}`}>
                    {vehicle.tirePressure.rr}
                  </span>
                </div>
              </div>
            </div>

            {/* Brake Wear */}
            <div className="glass-panel rounded-lg p-3 border border-border/30 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Brake Wear
              </p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Front Pads</span>
                    <span className="text-foreground">{vehicle.brakeWearPct.front}% remaining</span>
                  </div>
                  <Progress value={vehicle.brakeWearPct.front} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Rear Pads</span>
                    <span className="text-foreground">{vehicle.brakeWearPct.rear}% remaining</span>
                  </div>
                  <Progress value={vehicle.brakeWearPct.rear} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Predictive Insight + VIN */}
            <div className="glass-panel rounded-lg p-3 border border-border/30 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Predictive Insight
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Based on driving patterns, tire rotation is recommended in approximately 2 weeks. Battery degradation is normal at {vehicle.batteryHealthPct}% health after 14 months.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
              <span>VIN: {vehicle.vin}</span>
              <span>Plate: {vehicle.licensePlate}</span>
              <span>Last Diagnostic: {new Date(vehicle.lastDiagnosticDate).toLocaleDateString()}</span>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
