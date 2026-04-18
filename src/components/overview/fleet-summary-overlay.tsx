import { useFleetSummary } from "@/hooks/use-otto-q-strategic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
      <Card className="w-full h-full animate-pulse">
        <CardHeader className="p-4 pb-2">
          <div className="h-4 w-24 bg-muted rounded" />
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-12 bg-muted rounded" />
        </CardContent>
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
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Fleet Status</CardTitle>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {totals.vehicles} vehicles · {depots.length} depots
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Active
          </div>
          <div className="text-lg font-bold tabular-nums leading-tight text-primary">
            {totals.charging + totals.in_service + totals.en_route}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-3">
        {/* Vehicle state chips */}
        <div className="grid grid-cols-2 gap-2">
          <Chip icon={<Zap className="h-3 w-3" />} label="Charging" value={totals.charging} color="primary" />
          <Chip icon={<Wrench className="h-3 w-3" />} label="In Service" value={totals.in_service} color="warning" />
          <Chip icon={<Truck className="h-3 w-3" />} label="Staged" value={totals.staged} color="success" />
          <Chip icon={<Activity className="h-3 w-3" />} label="En Route" value={totals.en_route} color="violet" />
        </div>

        {/* SOC distribution mini-bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Battery className="h-3 w-3" /> SOC Distribution
            </span>
            <span className="text-muted-foreground tabular-nums">{totals.vehicles} total</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-muted/40">
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
        <div className="grid grid-cols-3 gap-2">
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
          <div className="border-t border-border/40 pt-2 space-y-1 mt-auto">
            {depots.slice(0, 4).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-[11px]">
                <span className="truncate font-medium text-foreground/90">{d.name}</span>
                <span className="text-muted-foreground tabular-nums shrink-0 ml-2">
                  {d.vehicles}v · {d.stalls_occupied}/{d.stalls_total}s · {Math.round(d.utilization_pct)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
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
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[11px]", colorMap[color])}>
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
