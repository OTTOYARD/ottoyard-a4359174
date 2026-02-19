import React from "react";
import type { TowRequest, SubscriberVehicle, Subscriber } from "@/lib/orchestra-ev/types";

interface EVTowingProps {
  towRequests: TowRequest[];
  vehicle: SubscriberVehicle;
  subscriber: Subscriber;
}

export const EVTowing: React.FC<EVTowingProps> = ({ towRequests }) => {
  return (
    <div className="glass-panel rounded-xl border border-border/50 p-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">OTTOW Towing</h2>
      <p className="text-sm text-muted-foreground">{towRequests.length} tow request(s)</p>
      <p className="text-xs text-muted-foreground mt-2">Full component coming in next build prompt.</p>
    </div>
  );
};
