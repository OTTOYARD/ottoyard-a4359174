import { useFleetSummary } from "@/hooks/use-otto-q-strategic";
import { Card } from "@/components/ui/card";
import {
  Battery,
  Zap,
  Wrench,
  Truck,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FleetSummaryOverlay() {
  const { data, isLoading } = useFleetSummary();

  if (isLoading) {
    return (
      <Card className="p-3 w-[320px] surface-luxury border-border/50 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const {
    totals,
    soc_distribution,
    stall_utilization,
    depots,
    active_exceptions,
    active_ottow_missions,
  } = data;

  return (
    <Card className="p-3 w-[320px] max-w-[90vw] surface-luxury border-border/50 backdrop-blur-md bg-card/85">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Fleet Status
          </div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {totals.vehicles} <span className="text-xs font-normal text-muted-foreground">Vehicles</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Depots
          </div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {depots.length}
          </div>
        </div>
      </div>

      {/* Vehicle state chips */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <Chip icon={<Zap className="h-3 w-3" />} label="Charging" value={totals.charging} color="primary" />
        <Chip icon={<Wrench className="h-3 w-3" />} label="In Service" value={totals.in_service} color="warning" />
        <Chip icon={<Truck className="h-3 w-3" />} label="Staged" value={totals.staged} color="success" />
        <Chip icon={<Activity className="h-3 w-3" />} label="En Route" value={totals.en_route} color="violet" />
      </div>

      {/* SOC distribution mini-bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Battery className="h-3 w-3" /> SOC Distribution
          </span>
          <span className="text-muted-foreground tabular-nums">{totals.vehicles} total</span>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/40">
          <SocSegment value={soc_distribution.critical} total={totals.vehicles} className="bg-destructive" />
          <SocSegment value={soc_distribution.low} total={totals.vehicles} className="bg-warning" />
          <SocSegment value={soc_distribution.medium} total={totals.vehicles} className="bg-primary/70" />
          <SocSegment value={soc_distribution.high} total={totals.vehicles} className="bg-success" />
          <SocSegment value={soc_distribution.full} total={totals.vehicles} className="bg-success/70" />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 tabular-nums">
          <span>{soc_distribution.critical} crit</span>
          <span>{soc_distribution.low} low</span>
          <span>{soc_distribution.medium} med</span>
          <span>{soc_distribution.high} hi</span>
          <span>{soc_distribution.full} full</span>
        </div>
      </div>

      {/* Stall utilization + alerts */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <Metric
          label="Stalls"
          value={`${stall_utilization.occupied}/${stall_utilization.total}`}
          sub="occupied"
        />
        <Metric
          label="Alerts"
          value={String(active_exceptions)}
          sub={active_exceptions > 0 ? "active" : "clear"}
          warn={active_exceptions > 0}
          icon={<AlertTriangle className="h-2.5 w-2.5" />}
        />
        <Metric
          label="OTTOW"
          value={String(active_ottow_missions)}
          sub="missions"
        />
      </div>

      {/* Per-depot breakdown */}
      {depots.length > 0 && (
        <div className="border-t border-border/40 pt-2 space-y-1">
          {depots.slice(0, 4).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-[10px]">
              <span className="truncate font-medium text-foreground/90">{d.name}</span>
              <span className="text-muted-foreground tabular-nums shrink-0 ml-2">
                {d.vehicles}v · {d.stalls_occupied}/{d.stalls_total}s · {Math.round(d.utilization_pct)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Chip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "warning" | "success" | "violet";
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    success: "text-success bg-success/10 border-success/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border text-[10px]", colorMap[color])}>
      {icon}
      <span className="text-foreground/70">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  warn,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded border border-border/40 px-2 py-1.5", warn && "border-destructive/40 bg-destructive/5")}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={cn("text-sm font-bold tabular-nums leading-tight", warn && "text-destructive")}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SocSegment({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  if (!total || !value) return null;
  const pct = (value / total) * 100;
  return <div className={className} style={{ width: `${pct}%` }} />;
}
