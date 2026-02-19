import React from "react";
import type { ServiceRecord, MaintenancePrediction, SubscriberVehicle } from "@/lib/orchestra-ev/types";

interface EVServicesProps {
  serviceRecords: ServiceRecord[];
  predictions: MaintenancePrediction[];
  vehicle: SubscriberVehicle;
}

export const EVServices: React.FC<EVServicesProps> = ({ serviceRecords }) => {
  return (
    <div className="glass-panel rounded-xl border border-border/50 p-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">Services</h2>
      <p className="text-sm text-muted-foreground">{serviceRecords.length} service records</p>
      <p className="text-xs text-muted-foreground mt-2">Full component coming in next build prompt.</p>
    </div>
  );
};
