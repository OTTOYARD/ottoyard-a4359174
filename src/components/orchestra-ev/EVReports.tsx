import React from "react";
import type { SubscriberVehicle, ServiceRecord, MaintenancePrediction } from "@/lib/orchestra-ev/types";

interface EVReportsProps {
  vehicle: SubscriberVehicle;
  serviceRecords: ServiceRecord[];
  predictions: MaintenancePrediction[];
}

export const EVReports: React.FC<EVReportsProps> = ({ vehicle }) => {
  return (
    <div className="glass-panel rounded-xl border border-border/50 p-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">Reports</h2>
      <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model} reports</p>
      <p className="text-xs text-muted-foreground mt-2">Full component coming in next build prompt.</p>
    </div>
  );
};
