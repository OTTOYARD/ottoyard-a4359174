import React from "react";
import type { DepotServiceStages, SubscriberVehicle } from "@/lib/orchestra-ev/types";

interface EVDepotQProps {
  depotStages: DepotServiceStages;
  vehicle: SubscriberVehicle;
}

export const EVDepotQ: React.FC<EVDepotQProps> = ({ depotStages }) => {
  return (
    <div className="glass-panel rounded-xl border border-border/50 p-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">Depot & Queue</h2>
      <p className="text-sm text-muted-foreground">{depotStages.depotName} — {depotStages.depotStatus}</p>
      <p className="text-xs text-muted-foreground mt-2">Full component coming in next build prompt.</p>
    </div>
  );
};
