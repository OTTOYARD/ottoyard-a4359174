import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import type { ServicePipeline } from "@/services/ottoq-av-orchestrator";

const STATE_COLORS: Record<string, string> = {
  ARRIVED: "border-l-muted-foreground",
  QUEUED: "border-l-warning",
  IN_SERVICE: "border-l-accent",
  TRANSITIONING: "border-l-energy-grid",
  STAGING: "border-l-success",
  DEPLOYED: "border-l-muted",
};

interface Props {
  pipelines: ServicePipeline[];
}

export function AVFleetTable({ pipelines }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"state" | "soc">("state");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = pipelines.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.vehicleId.toLowerCase().includes(q) ||
      p.vehicleMakeModel.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">AV Fleet</CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-7 h-7 text-xs bg-card/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="grid grid-cols-6 text-[10px] text-muted-foreground font-medium px-2 pb-1 border-b border-border/20">
          <span>Vehicle</span>
          <span>Status</span>
          <span>Current Step</span>
          <span>ETA Ready</span>
          <span>Steps Left</span>
          <span className="text-right">Duration</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No vehicles found.</p>
          )}
          {filtered.map((p) => {
            const currentStep = p.steps[p.currentStepIndex];
            const stepsRemaining = Math.max(0, p.steps.length - p.currentStepIndex - 1);
            const isExpanded = expandedId === p.vehicleId;

            return (
              <div key={p.vehicleId}>
                <div
                  className={`grid grid-cols-6 items-center text-xs px-2 py-2 border-l-2 cursor-pointer hover:bg-card/40 transition-colors ${STATE_COLORS[p.state] ?? "border-l-muted"}`}
                  onClick={() => setExpandedId(isExpanded ? null : p.vehicleId)}
                >
                  <span className="font-medium truncate">{p.vehicleMakeModel || p.vehicleId.slice(0, 10)}</span>
                  <Badge variant="outline" className="text-[9px] w-fit">{p.state}</Badge>
                  <span className="text-muted-foreground capitalize">{currentStep?.serviceType.replace("_", " ") ?? "—"}</span>
                  <span className="text-muted-foreground">{p.totalDurationMinutes}m total</span>
                  <span className="text-muted-foreground">{stepsRemaining}</span>
                  <span className="text-right text-muted-foreground">{p.totalDurationMinutes}m</span>
                </div>

                {isExpanded && (
                  <div className="pl-6 pr-2 py-2 bg-card/20 border-l-2 border-l-border/30 space-y-1">
                    {p.steps.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === "active" ? "bg-accent animate-pulse" : s.status === "completed" ? "bg-success" : "bg-muted-foreground/40"}`} />
                        <span className="capitalize w-28">{s.serviceType.replace("_", " ")}</span>
                        <span>Stall #{s.assignedStallNumber ?? "—"}</span>
                        <span className="ml-auto">{s.estimatedDurationMinutes}m</span>
                        <Badge variant="outline" className="text-[8px]">{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
