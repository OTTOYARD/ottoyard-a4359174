import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ServicePipeline } from "@/services/ottoq-av-orchestrator";
import { Zap, Droplets, Wrench, Battery, Clock } from "lucide-react";

const SERVICE_COLORS: Record<string, string> = {
  charge: "bg-accent",
  detail_clean: "bg-energy-grid",
  tire_rotation: "bg-warning",
  battery_health_check: "bg-warning",
  full_service: "bg-warning",
};

const SERVICE_ICONS: Record<string, typeof Zap> = {
  charge: Zap,
  detail_clean: Droplets,
  tire_rotation: Wrench,
  battery_health_check: Battery,
  full_service: Wrench,
};

const STATE_BADGE: Record<string, string> = {
  ARRIVED: "bg-muted text-muted-foreground",
  QUEUED: "bg-warning/20 text-warning",
  IN_SERVICE: "bg-accent/20 text-accent",
  TRANSITIONING: "bg-energy-grid/20 text-energy-grid",
  STAGING: "bg-success/20 text-success",
  DEPLOYED: "bg-muted text-muted-foreground",
};

interface Props {
  pipelines: ServicePipeline[];
}

export function AVPipelineView({ pipelines }: Props) {
  const inDepot = pipelines.filter((p) => p.state !== "DEPLOYED").length;
  const inService = pipelines.filter((p) => p.state === "IN_SERVICE" || p.state === "TRANSITIONING").length;
  const staged = pipelines.filter((p) => p.state === "STAGING").length;
  const deployed = pipelines.filter((p) => p.state === "DEPLOYED").length;

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">AV Pipeline</CardTitle>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>In Depot: <strong className="text-foreground">{inDepot}</strong></span>
            <span>In Service: <strong className="text-accent">{inService}</strong></span>
            <span>Staged: <strong className="text-success">{staged}</strong></span>
            <span>Deployed: <strong className="text-muted-foreground">{deployed}</strong></span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {pipelines.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No AVs in pipeline. Trigger an arrival to begin.
          </p>
        )}
        {pipelines.map((p) => (
          <PipelineRow key={p.vehicleId} pipeline={p} />
        ))}
      </CardContent>
    </Card>
  );
}

function PipelineRow({ pipeline }: { pipeline: ServicePipeline }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-md border border-border/20 bg-card/40 p-3 cursor-pointer hover:bg-card/60 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-[100px] text-xs font-medium truncate">{pipeline.vehicleMakeModel || pipeline.vehicleId.slice(0, 12)}</div>
        <Badge className={`text-[10px] ${STATE_BADGE[pipeline.state] ?? ""}`}>{pipeline.state}</Badge>

        {/* Gantt blocks */}
        <div className="flex-1 flex items-center gap-0.5 h-5">
          {pipeline.steps.map((step, i) => {
            const Icon = SERVICE_ICONS[step.serviceType] ?? Wrench;
            const width = Math.max(16, (step.estimatedDurationMinutes / pipeline.totalDurationMinutes) * 100);
            const isActive = step.status === "active";
            const isCompleted = step.status === "completed";

            return (
              <div
                key={step.id}
                className={`relative h-full rounded-sm flex items-center justify-center text-[9px] font-bold text-background transition-all
                  ${SERVICE_COLORS[step.serviceType] ?? "bg-muted"}
                  ${isCompleted ? "opacity-50" : ""}
                  ${isActive ? "animate-pulse-energy ring-1 ring-accent" : ""}
                `}
                style={{ width: `${width}%`, minWidth: 20 }}
                title={`${step.serviceType} — ${Math.round(step.progress)}%`}
              >
                {isActive && <span className="text-[8px]">{Math.round(step.progress)}%</span>}
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {pipeline.totalDurationMinutes}m
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pl-[100px] space-y-1 text-xs">
          {pipeline.steps.map((step) => {
            const Icon = SERVICE_ICONS[step.serviceType] ?? Wrench;
            return (
              <div key={step.id} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-3 h-3" />
                <span className="capitalize">{step.serviceType.replace("_", " ")}</span>
                <span>— Stall #{step.assignedStallNumber ?? "TBD"}</span>
                <span>— {step.estimatedDurationMinutes}min</span>
                <Badge variant="outline" className="text-[9px] ml-auto">
                  {step.status}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
