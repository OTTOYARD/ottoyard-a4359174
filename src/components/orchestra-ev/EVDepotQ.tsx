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
  { prefix: "M", type: "Maintenance", icon: Wrench, count: 2, color: "text-warning", bgActive: "bg-warning/20 border-warning/40" },
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

  return (
    <div className="space-y-4">
      {/* Depot Header */}
      <Card className="glass-panel border-border/50">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{depotStages.depotName}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
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
              <Badge variant="outline" className={`text-[10px] mt-1 ${depotStages.depotStatus === "open" ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                {depotStages.depotStatus === "open" ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Stage Tracker */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Car className="h-4 w-4 text-primary" />
              Service Progress
            </CardTitle>
            {etaMinutes !== null && (
              <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                ~{etaMinutes} min remaining
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
        <Card className="glass-panel border-border/50 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              Depot Stall Map
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stallLayout.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.prefix} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                    <span className="text-xs font-medium text-foreground">
                      {section.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                    {Array.from({ length: section.count }, (_, i) => {
                      const stallId = `${section.prefix}-${i + 1}`;
                      const isVehicleHere = stallId === vehicle.currentStallId;
                      // Mock some stalls as occupied
                      const isOccupied = isVehicleHere || ([2, 5, 8].includes(i + 1) && section.prefix === "C");

                      return (
                        <div
                          key={stallId}
                          className={`relative rounded-md border p-1.5 text-center text-[10px] font-medium transition-all ${
                            isVehicleHere
                              ? `${section.bgActive} ring-2 ring-primary/50`
                              : isOccupied
                              ? "bg-muted/50 border-border/50 text-muted-foreground"
                              : "border-border/30 text-foreground hover:border-border/60"
                          }`}
                        >
                          {stallId}
                          {isVehicleHere && (
                            <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-primary text-primary-foreground rounded px-1">YOU</span>
                          )}
                          {isOccupied && !isVehicleHere && (
                            <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-muted-foreground/50 text-background rounded px-1">BUSY</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/40 ring-1 ring-primary/50" />
                Your Vehicle
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 rounded bg-muted/50 border border-border/50" />
                Occupied
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 rounded border border-border/30" />
                Available
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stall Details Panel */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Stall Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center pb-2 border-b border-border/30">
              <p className="text-2xl font-bold text-primary">{depotStages.currentStall.id}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {depotStages.currentStall.subType}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power Rating</span>
                <span className="font-medium text-foreground">{depotStages.currentStall.power}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Rate</span>
                <span className="font-medium text-foreground">{depotStages.currentStall.currentRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energy Consumed</span>
                <span className="font-medium text-foreground">{depotStages.currentStall.energyConsumed} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle SOC</span>
                <span className="font-medium text-foreground">{Math.round(vehicle.currentSoc * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target</span>
                <span className="font-medium text-foreground">{vehicle.chargingPreferencePct}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground">Vehicle</p>
              <p className="text-xs font-medium text-foreground">
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
