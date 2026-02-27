import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Droplets, CircleDot, HeartPulse, Calendar } from "lucide-react";
import type { ServiceRecord } from "@/lib/orchestra-ev/types";

interface UpcomingServicePreviewProps {
  services: ServiceRecord[];
  onViewAll?: () => void;
  onAccept?: (id: string) => void;
}

const serviceIcons: Record<string, React.ElementType> = {
  charging: Zap,
  detailing: Droplets,
  interior_clean: Droplets,
  exterior_wash: Droplets,
  tire_rotation: CircleDot,
  battery_diagnostic: HeartPulse,
};

export const UpcomingServicePreview: React.FC<UpcomingServicePreviewProps> = ({
  services,
  onViewAll,
  onAccept,
}) => {
  const upcoming = services
    .filter((s) => s.status === "scheduled" || s.status === "in_progress")
    .slice(0, 2);

  if (upcoming.length === 0) {
    return (
      <div className="surface-luxury rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-luxury">Upcoming Services</span>
        </div>
        <p className="text-xs text-muted-foreground">
          You're all set. OTTO-Q is monitoring your vehicle.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-luxury rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-luxury">Upcoming Services</span>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-[10px] text-primary hover:text-primary/80 font-medium">
            View All →
          </button>
        )}
      </div>
      <div className="space-y-2">
        {upcoming.map((svc) => {
          const Icon = serviceIcons[svc.type] || Zap;
          return (
            <div
              key={svc.id}
              className="surface-luxury rounded-xl p-3 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground capitalize">{svc.type.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {svc.depotName} • {svc.stallId && `Stall ${svc.stallId} • `}
                  {new Date(svc.scheduledAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {svc.status === "in_progress" ? (
                <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30 animate-pulse">
                  In Progress
                </Badge>
              ) : onAccept ? (
                <Button
                  size="sm"
                  className="futuristic-button rounded-lg h-7 text-[10px] px-3"
                  onClick={() => onAccept(svc.id)}
                >
                  Accept
                </Button>
              ) : (
                <Badge variant="outline" className="text-[10px]">Scheduled</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
