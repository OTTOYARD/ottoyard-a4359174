import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Clock, Zap, Battery, Wrench, Sparkles, ParkingCircle, Car } from "lucide-react";
import { EVServiceStageTracker } from "./EVServiceStageTracker";
import type { DepotServiceStages, SubscriberVehicle } from "@/lib/orchestra-ev/types";

interface EVDepotQProps {
  depotStages: DepotServiceStages;
  vehicle: SubscriberVehicle;
}

// Stall grid definition
const stallLayout = [
  { prefix: "C", type: "Charging", icon: Zap, count: 12, color: "text-primary", bgActive: "bg-primary/20 border-primary/40" },
  { prefix: "D", type: "Detailing", icon: Sparkles, count: 6, color: "text-blue-400", bgActive: "bg-blue-500/20 border-blue-500/40" },
  { prefix: "M", type: "Maintenance", icon: Wrench, count: 4, color: "text-warning", bgActive: "bg-warning/20 border-warning/40" },
  { prefix: "S", type: "Staging", icon: ParkingCircle, count: 4, color: "text-success", bgActive: "bg-success/20 border-success/40" },
];

export const EVDepotQ: React.FC<EVDepotQProps> = ({ depotStages, vehicle }) => {
  const activeStage = depotStages.stages.find((s) => s.status === "in_progress");
  const etaMinutes = activeStage?.estimatedCompletion
    ? Math.max(
        0,
        Math.round(
          (new Date(activeStage.estimatedCompletion).getTime() - Date.now()) / 60000
        )
      )
    : null;

  const socPct = Math.round(vehicle.currentSoc * 100);

  return (
    <div className="space-y-4">
      {/* Depot Header */}
      <Card className="surface-elevated-luxury rounded-2xl overflow-hidden border-border/30">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-luxury">{depotStages.depotName}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {depotStages.depotAddress}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {depotStages.depotHours}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] mt-1 ${
                  depotStages.depotStatus === "open"
                    ? "bg-success/15 text-success border-success/30"
                    : "bg-destructive/15 text-destructive border-destructive/30"
                }`}
              >
                {depotStages.depotStatus === "open" ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Stage Tracker */}
      <Card className="surface-luxury rounded-2xl border-border/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <Car className="h-4 w-4 text-primary" />
              Service Progress
            </CardTitle>
            {etaMinutes !== null && (
              <Badge
                variant="outline"
                className="bg-primary/15 text-primary border-primary/30 rounded-full px-4 py-1.5 text-sm font-semibold"
              >
                ~<span className="tabular-nums">{etaMinutes}</span> min remaining
              </Badge>
            )}
          </div>
          {activeStage && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Current Stage: <span className="text-primary font-medium">{activeStage.name}</span>
              {" • "}Stall: {depotStages.currentStall.id}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <EVServiceStageTracker stages={depotStages.stages} />
        </CardContent>
      </Card>

      {/* Stall Map + Stall Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stall Grid Map */}
        <Card className="surface-luxury rounded-2xl border-border/30 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              Depot Stall Map
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stallLayout.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.prefix} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                    <span className="text-label-uppercase">
                      {section.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                    {Array.from({ length: section.count }, (_, i) => {
                      const stallId = `${section.prefix}-${i + 1}`;
                      const isVehicleHere = stallId === vehicle.currentStallId;
                      const isOccupied = isVehicleHere || ([2, 5, 8].includes(i + 1) && section.prefix === "C");

                      return (
                        <div
                          key={stallId}
                          className={`relative rounded-lg p-2.5 text-center text-[10px] font-medium transition-all duration-150 ${
                            isVehicleHere
                              ? `bg-primary/15 border-2 border-primary/40`
                              : isOccupied
                              ? "bg-muted/40 rounded-lg opacity-60 border border-border/30"
                              : "surface-luxury border border-border/30 hover:border-primary/20 hover:shadow-glow-sm hover:scale-105 cursor-default"
                          }`}
                        >
                          {stallId}
                          {isVehicleHere && (
                            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[9px] font-bold">
                              YOU
                            </span>
                          )}
                          {isOccupied && !isVehicleHere && (
                            <Car className="h-2.5 w-2.5 text-muted-foreground/40 mx-auto mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground rounded-lg px-3 py-1.5 bg-muted/20">
                <div className="w-3 h-3 rounded bg-primary/15 border-2 border-primary/40" />
                Your Vehicle
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground rounded-lg px-3 py-1.5 bg-muted/20">
                <div className="w-3 h-3 rounded bg-muted/40 border border-border/30" />
                Occupied
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground rounded-lg px-3 py-1.5 bg-muted/20">
                <div className="w-3 h-3 rounded border border-border/30" />
                Available
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stall Details Panel */}
        <Card className="surface-elevated-luxury rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Stall Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conic SOC ring around stall ID */}
            <div className="flex justify-center pb-2">
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${socPct}%, hsl(var(--muted)) ${socPct}%)`,
                }}
              >
                {/* Inner mask to create ring */}
                <div className="absolute inset-[6px] rounded-full bg-card flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-luxury tabular-nums leading-none">{depotStages.currentStall.id}</p>
                  <p className="text-label-uppercase mt-0.5" style={{ fontSize: "8px" }}>
                    {depotStages.currentStall.subType}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground mb-2">
              SOC: <span className="text-primary font-semibold tabular-nums text-luxury">{socPct}%</span>
            </div>

            <div className="space-y-0">
              {[
                { label: "Power Rating", value: depotStages.currentStall.power },
                { label: "Current Rate", value: depotStages.currentStall.currentRate },
                { label: "Energy Consumed", value: `${depotStages.currentStall.energyConsumed} kWh` },
                { label: "Vehicle SOC", value: `${socPct}%` },
                { label: "Target", value: `${vehicle.chargingPreferencePct}%` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2.5 border-b border-border/20">
                  <span className="text-label-uppercase">{row.label}</span>
                  <span className="font-semibold text-foreground text-sm tabular-nums text-luxury">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-label-uppercase">Vehicle</p>
              <p className="text-xs font-semibold text-foreground mt-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-[10px] text-muted-foreground">{vehicle.color}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
