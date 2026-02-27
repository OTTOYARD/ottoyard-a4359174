import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Droplets, CircleDot, HeartPulse, Wrench, TrendingUp } from "lucide-react";
import type { ServiceRecord } from "@/lib/orchestra-ev/types";

interface ServiceTimelineProps {
  services: ServiceRecord[];
}

const typeIcons: Record<string, React.ElementType> = {
  charging: Zap,
  detailing: Droplets,
  interior_clean: Droplets,
  exterior_wash: Droplets,
  tire_rotation: CircleDot,
  battery_diagnostic: HeartPulse,
  brake_inspection: Wrench,
  full_maintenance: Wrench,
  cabin_air_filter: Wrench,
  oil_change: Wrench,
};

export const ServiceTimeline: React.FC<ServiceTimelineProps> = ({ services }) => {
  const [filter, setFilter] = useState<string>("all");

  const sorted = useMemo(() => {
    const filtered = filter === "all" ? services : services.filter((s) => s.type === filter);
    return [...filtered].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [services, filter]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, ServiceRecord[]>();
    for (const svc of sorted) {
      const key = new Date(svc.scheduledAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(svc);
    }
    return Array.from(map.entries());
  }, [sorted]);

  const completedThisMonth = services.filter((s) => {
    if (s.status !== "completed") return false;
    const d = new Date(s.scheduledAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const chargesThisMonth = completedThisMonth.filter((s) => s.type === "charging").length;
  const totalSaved = 47.2; // mock savings

  const filters = ["all", "charging", "detailing", "tire_rotation", "battery_diagnostic"];

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="surface-elevated-luxury rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Charges: <span className="text-foreground font-semibold">{chargesThisMonth}</span></span>
        </div>
        <div className="h-4 w-px bg-border/30" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Saved: <span className="text-primary font-semibold">${totalSaved.toFixed(2)}</span> vs peak</span>
        </div>
        <div className="h-4 w-px bg-border/30" />
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span className="text-xs text-success font-medium">Health: Improving</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all capitalize ${
              filter === f
                ? "bg-primary/15 text-primary border border-primary/25"
                : "surface-luxury text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {grouped.map(([month, items]) => (
          <div key={month}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-label-uppercase">{month}</span>
              <div className="h-px flex-1 bg-border/20" />
            </div>
            <div className="relative">
              <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-border/20" />
              <div className="space-y-2">
                {items.map((svc) => {
                  const Icon = typeIcons[svc.type] || Wrench;
                  const isCompleted = svc.status === "completed";
                  const isFuture = svc.status === "scheduled";

                  return (
                    <div
                      key={svc.id}
                      className={`surface-luxury rounded-xl p-4 flex items-start gap-3 transition-all duration-200 hover:shadow-md ${
                        isCompleted ? "opacity-75" : ""
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 ${
                        isCompleted ? "bg-success/15" : isFuture ? "bg-primary/15" : "bg-warning/15"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Icon className={`h-4 w-4 ${isFuture ? "text-primary" : "text-warning"}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-foreground capitalize">{svc.type.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {svc.depotName} •{" "}
                          {new Date(svc.scheduledAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {svc.stallId && ` • Stall ${svc.stallId}`}
                        </p>
                        {svc.notes && (
                          <p className="text-[10px] text-muted-foreground/70 italic">{svc.notes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {svc.cost > 0 ? (
                          <p className="text-sm font-bold text-primary tabular-nums">${svc.cost.toFixed(2)}</p>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/30">
                            Included
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] mt-1 ${
                          isCompleted ? "bg-success/10 text-success border-success/20" :
                          svc.status === "in_progress" ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-muted/30 text-muted-foreground"
                        }`}>
                          {svc.status === "in_progress" ? "In Progress" : isCompleted ? "Completed" : "Scheduled"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
