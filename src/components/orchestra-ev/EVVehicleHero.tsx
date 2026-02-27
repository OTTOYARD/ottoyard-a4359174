import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { VehicleShowroom3D } from "./VehicleShowroom3D";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Battery,
  MapPin,
  Heart,
  Gauge,
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

const colorMap: Record<string, string> = {
  "Midnight Silver": "#71797E",
  "Pearl White": "#F0EDE5",
  "Solid Black": "#1C1C1C",
  "Deep Blue": "#1B3A5C",
  "Red Multi-Coat": "#A4262C",
};

export const EVVehicleHero: React.FC<EVVehicleHeroProps> = ({ vehicle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const socPct = Math.round(vehicle.currentSoc * 100);
  const status = statusConfig[vehicle.currentStatus] || statusConfig.at_depot;
  const StatusIcon = status.icon;
  const isCharging = vehicle.currentStatus === "charging";

  const tirePressureStatus = (psi: number) => {
    if (psi >= 40 && psi <= 44) return "text-success";
    if (psi >= 36 && psi < 40) return "text-warning";
    return "text-destructive";
  };

  const brakeBarGradient = (pct: number) => {
    if (pct > 50) return "from-success/80 to-success";
    if (pct > 25) return "from-warning/80 to-warning";
    return "from-destructive/80 to-destructive";
  };

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const dotColor = colorMap[vehicle.color] || "#71797E";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="surface-elevated-luxury rounded-2xl overflow-hidden">
        {/* ===== 3D HERO STAGE ===== */}
        <div className="relative overflow-hidden">
          <VehicleShowroom3D vehicleStatus={vehicle.currentStatus} soc={vehicle.currentSoc} />

          {/* Status badge — floating top-right */}
          <div className={`absolute top-4 right-4 z-10 ${isCharging ? "animate-pulse-ring rounded-full" : ""}`}>
            <Badge
              variant="outline"
              className={`backdrop-blur-lg bg-background/70 rounded-full px-4 py-2 border border-border/30 shadow-lg text-xs font-semibold ${status.color}`}
            >
              <StatusIcon className="h-4 w-4 mr-2" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* ===== VEHICLE NAME ===== */}
        <div className="py-4 px-5 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-luxury text-center">
            {vehicleName}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block border border-border/30"
              style={{ backgroundColor: dotColor }}
            />
            <span className="text-sm text-muted-foreground">{vehicle.color}</span>
          </div>
          <div className="h-[1px] w-16 mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-3" />
        </div>

        {/* ===== BATTERY BAR ===== */}
        <div className="px-5 pb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-luxury tabular-nums">{socPct}</span>
              <span className="text-lg text-muted-foreground ml-0.5">%</span>
            </div>
            <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden relative">
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${socPct}%`,
                  background: socPct > 30
                    ? "linear-gradient(90deg, hsl(var(--primary) / 0.7), hsl(var(--primary)))"
                    : "linear-gradient(90deg, hsl(var(--destructive) / 0.7), hsl(var(--warning)))",
                  transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Shimmer shine */}
                <div className="absolute inset-0 animate-shimmer-luxury-bg" />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-label-uppercase">Target: {vehicle.chargingPreferencePct}%</span>
            <span className="text-label-uppercase">Est. Range: {vehicle.estimatedRangeMiles} mi</span>
          </div>
        </div>

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-3 gap-3 px-5 pb-4 pt-2">
          {[
            { icon: Heart, value: String(vehicle.healthScore), label: "Health" },
            { icon: Gauge, value: `${(vehicle.odometerMiles / 1000).toFixed(1)}k`, label: "Miles" },
            { icon: MapPin, value: "Depot #1", label: "Location" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="surface-luxury rounded-xl p-3 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 mx-auto mb-2 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-lg font-bold text-luxury tabular-nums">{stat.value}</p>
                <p className="text-label-uppercase mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* ===== EXPAND/COLLAPSE GRAB BAR ===== */}
        <CollapsibleTrigger asChild>
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-1 mb-3 cursor-pointer hover:bg-muted-foreground/40 hover:w-16 transition-all duration-200" />
        </CollapsibleTrigger>

        {/* ===== EXPANDED DETAILS ===== */}
        <CollapsibleContent>
          {/* Battery Diagnostics */}
          <div
            className="surface-luxury rounded-xl p-5 mx-5 mb-3 border-t-2 border-primary/15 animate-fade-in-up"
            style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
          >
            <p className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Battery Diagnostics
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              {[
                { label: "Capacity", value: `${vehicle.batteryCapacityKwh} kWh` },
                { label: "Battery Health", value: `${vehicle.batteryHealthPct}%` },
                { label: "Current SOC", value: `${socPct}% (${(vehicle.currentSoc * vehicle.batteryCapacityKwh).toFixed(1)} kWh)` },
                { label: "Charge Target", value: `${vehicle.chargingPreferencePct}%` },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-label-uppercase">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tire Pressure */}
          <div
            className="surface-luxury rounded-xl p-5 mx-5 mb-3 animate-fade-in-up"
            style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
          >
            <p className="text-sm font-semibold text-luxury flex items-center gap-1.5 mb-4">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Tire Pressure ({vehicle.tirePressure.unit.toUpperCase()})
            </p>
            <div className="relative flex items-center justify-center">
              {/* Car silhouette */}
              <div className="relative w-28 h-36">
                {/* Car body */}
                <div className="absolute inset-x-3 inset-y-4 border-2 border-muted/30 rounded-lg" />
                {/* Wheel dots */}
                <div className="absolute top-6 left-0.5 w-2 h-4 bg-muted/40 rounded-full" />
                <div className="absolute top-6 right-0.5 w-2 h-4 bg-muted/40 rounded-full" />
                <div className="absolute bottom-6 left-0.5 w-2 h-4 bg-muted/40 rounded-full" />
                <div className="absolute bottom-6 right-0.5 w-2 h-4 bg-muted/40 rounded-full" />

                {/* Tire values at corners */}
                <span className={`absolute -top-1 -left-8 text-sm font-bold tabular-nums ${tirePressureStatus(vehicle.tirePressure.fl)}`}>
                  {vehicle.tirePressure.fl}
                </span>
                <span className={`absolute -top-1 -right-8 text-sm font-bold tabular-nums ${tirePressureStatus(vehicle.tirePressure.fr)}`}>
                  {vehicle.tirePressure.fr}
                </span>
                <span className={`absolute -bottom-1 -left-8 text-sm font-bold tabular-nums ${tirePressureStatus(vehicle.tirePressure.rl)}`}>
                  {vehicle.tirePressure.rl}
                </span>
                <span className={`absolute -bottom-1 -right-8 text-sm font-bold tabular-nums ${tirePressureStatus(vehicle.tirePressure.rr)}`}>
                  {vehicle.tirePressure.rr}
                </span>
              </div>
            </div>
            {/* Labels */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-center">
              <span className="text-label-uppercase">FL / RL</span>
              <span className="text-label-uppercase">FR / RR</span>
            </div>
          </div>

          {/* Brake Wear */}
          <div
            className="surface-luxury rounded-xl p-5 mx-5 mb-3 animate-fade-in-up"
            style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
          >
            <p className="text-sm font-semibold text-luxury flex items-center gap-1.5 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              Brake Wear
            </p>
            <div className="space-y-3">
              {[
                { label: "Front Pads", value: vehicle.brakeWearPct.front },
                { label: "Rear Pads", value: vehicle.brakeWearPct.rear },
              ].map((brake) => (
                <div key={brake.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{brake.label}</span>
                    <span className="text-foreground font-medium">{brake.value}% remaining</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${brakeBarGradient(brake.value)}`}
                      style={{
                        width: `${brake.value}%`,
                        transition: "width 600ms ease-out",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Insight */}
          <div
            className="border-l-2 border-primary/40 pl-4 ml-5 mr-5 mb-3 py-3 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
          >
            <p className="text-label-uppercase text-primary/60 mb-1.5">AI Insight</p>
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              Based on driving patterns, tire rotation is recommended in approximately 2 weeks.
              Battery degradation is normal at {vehicle.batteryHealthPct}% health after 14 months.
            </p>
          </div>

          {/* VIN / Plate info */}
          <div
            className="px-5 pb-4 flex flex-wrap gap-1 animate-fade-in-up"
            style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
          >
            <span className="text-label-uppercase">VIN: {vehicle.vin}</span>
            <span className="text-label-uppercase opacity-40">·</span>
            <span className="text-label-uppercase">Plate: {vehicle.licensePlate}</span>
            <span className="text-label-uppercase opacity-40">·</span>
            <span className="text-label-uppercase">
              Last Diagnostic: {new Date(vehicle.lastDiagnosticDate).toLocaleDateString()}
            </span>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
