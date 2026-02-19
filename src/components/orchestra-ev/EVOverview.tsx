import React from "react";
import type { Subscriber, SubscriberVehicle, EVNotification, EVEvent, DepotServiceStages } from "@/lib/orchestra-ev/types";

interface EVOverviewProps {
  subscriber: Subscriber;
  vehicle: SubscriberVehicle;
  notifications: EVNotification[];
  events: EVEvent[];
  depotStages: DepotServiceStages;
}

export const EVOverview: React.FC<EVOverviewProps> = ({ subscriber, vehicle }) => {
  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl border border-border/50 p-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Welcome, {subscriber.firstName}</h2>
        <p className="text-sm text-muted-foreground">
          {vehicle.year} {vehicle.make} {vehicle.model} • {Math.round(vehicle.currentSoc * 100)}% charged
        </p>
      </div>
      <p className="text-xs text-muted-foreground text-center">Full overview coming in next build prompt.</p>
    </div>
  );
};
