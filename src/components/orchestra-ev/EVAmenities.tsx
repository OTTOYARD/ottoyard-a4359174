import React from "react";
import type { AmenityReservation, AmenityAvailability } from "@/lib/orchestra-ev/types";

interface EVAmenitiesProps {
  reservations: AmenityReservation[];
  availability: AmenityAvailability;
}

export const EVAmenities: React.FC<EVAmenitiesProps> = ({ reservations }) => {
  return (
    <div className="glass-panel rounded-xl border border-border/50 p-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">Amenities</h2>
      <p className="text-sm text-muted-foreground">{reservations.length} reservation(s)</p>
      <p className="text-xs text-muted-foreground mt-2">Full component coming in next build prompt.</p>
    </div>
  );
};
