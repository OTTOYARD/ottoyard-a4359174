// OTTO-Q Engine Monitor — Mission Control Dashboard
import { useOttoQEngine } from "@/hooks/useOttoQEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Battery,
  Sparkles,
  Wrench,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_ICONS: Record<string, typeof Battery> = {
  charge: Battery,
  detail_clean: Sparkles,
  tire_rotation: Wrench,
  battery_health_check: Activity,
  full_service: Gauge,
};

function severityColor(sev: string) {
  if (sev === "critical") return "text-red-400";
  if (sev === "warning") return "text-amber-400";
  return "text-emerald-400";
}

function urgencyBarColor(score: number) {
  if (score >= 90) return "bg-red-500";
  if (score >= 70) return "bg-amber-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-emerald-500";
}

function tierLabel(tier: string) {
  if (tier === "off_peak") return "Off-Peak";
  if (tier === "peak") return "Peak";
  if (tier.startsWith("shoulder")) return "Shoulder";
  return tier;
}

function tierColor(tier: string) {
  if (tier === "off_peak") return "text-emerald-400";
  if (tier === "peak") return "text-red-400";
  return "text-amber-400";
}

export default function EngineMonitor() {
  const {
    currentQueue,
    recentAlerts,
    engineStatus,
    lastScanTimestamp,
    vehiclesMonitored,
    activePredictions,
    scheduledToday,
    depotUtilizationPct,
    currentEnergyTier,
    triggerManualScan,
  } = useOttoQEngine(30_000);

  const topQueue = currentQueue.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* ── Stats Strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatChip icon={Car} label="Monitored" value={vehiclesMonitored} />
        <StatChip icon={AlertTriangle} label="Predictions" value={activePredictions} accent />
        <StatChip icon={Clock} label="Today" value={scheduledToday} />
        <StatChip icon={Gauge} label="Depot Util" value={`${depotUtilizationPct}%`} />
        <StatChip
          icon={Zap}
          label="Energy"
          value={tierLabel(currentEnergyTier)}
          className={tierColor(currentEnergyTier)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Activity Feed ───────────────────────────────────── */}
        <Card className="lg:col-span-1 relative overflow-hidden">
          {/* scan-line overlay */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary))]/30 to-transparent animate-scan"
              style={{ animationDuration: "4s" }}
            />
          </div>

          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
              Activity Feed
            </CardTitle>
            <button
              onClick={triggerManualScan}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              aria-label="Trigger scan"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground",
                  engineStatus === "scanning" && "animate-spin text-[hsl(var(--primary))]"
                )}
              />
            </button>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[340px] px-4 pb-4">
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  {engineStatus === "scanning" ? "Scanning…" : "No alerts yet — engine idle"}
                </p>
              ) : (
                <div className="space-y-2">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0 animate-in slide-in-from-left-2 duration-300"
                    >
                      <span className={cn("mt-0.5", severityColor(alert.severity))}>
                        {alert.severity === "critical" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : alert.severity === "warning" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-snug text-foreground/90 truncate">
                          {alert.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1.5 py-0 shrink-0",
                          alert.severity === "critical" && "border-red-500/30 text-red-400",
                          alert.severity === "warning" && "border-amber-500/30 text-amber-400"
                        )}
                      >
                        {Math.round(alert.urgencyScore)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── Priority Queue ──────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[hsl(var(--primary))]" />
              Priority Queue
              {lastScanTimestamp && (
                <span className="text-[10px] text-muted-foreground font-normal ml-auto">
                  Last scan: {new Date(lastScanTimestamp).toLocaleTimeString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topQueue.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                No service needs detected — all vehicles healthy
              </p>
            ) : (
              <div className="space-y-2.5">
                {topQueue.map((need, i) => {
                  const Icon = SERVICE_ICONS[need.serviceType] || Wrench;
                  const isPulsing = need.urgencyScore >= 80;

                  return (
                    <div
                      key={`${need.vehicleId}-${need.serviceType}`}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5",
                        "animate-in slide-in-from-right-3 duration-300",
                        isPulsing && "ring-1 ring-red-500/20"
                      )}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className={cn(
                        "shrink-0 p-1.5 rounded-md bg-white/5",
                        isPulsing && "animate-pulse"
                      )}>
                        <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground/90 truncate">
                            {need.vehicleMakeModel}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 capitalize"
                          >
                            {need.serviceType.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {/* Urgency bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-700",
                                urgencyBarColor(need.urgencyScore)
                              )}
                              style={{ width: `${Math.min(100, need.urgencyScore)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                            {Math.round(need.urgencyScore)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(need.predictedNeedDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scan-line animation keyframe */}
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 4s linear infinite; }
      `}</style>
    </div>
  );
}

// ── Stat Chip ────────────────────────────────────────────────
function StatChip({
  icon: Icon,
  label,
  value,
  accent,
  className,
}: {
  icon: typeof Battery;
  label: string;
  value: string | number;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          accent ? "text-[hsl(var(--primary))]" : "text-muted-foreground",
          className
        )}
      />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className={cn("text-sm font-semibold leading-tight tabular-nums", className)}>
          {value}
        </p>
      </div>
    </div>
  );
}
