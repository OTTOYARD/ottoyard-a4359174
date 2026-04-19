import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type {
  ScheduleIntelligenceWave,
  DemandForecastPoint,
} from "@/lib/otto-q-api";
import { AlertTriangle, Brain } from "lucide-react";

export function SchedulingTimeline({
  window,
  waves,
  forecast,
}: {
  window: { start: string; end: string; hours: number };
  waves: ScheduleIntelligenceWave[];
  forecast: DemandForecastPoint[];
}) {
  const [expandedWaveId, setExpandedWaveId] = useState<string | null>(null);
  const startMs = new Date(window.start).getTime();
  const endMs = new Date(window.end).getTime();
  const windowMs = endMs - startMs;
  const nowMs = Date.now();

  const chartData = useMemo(
    () =>
      forecast
        .filter((p) => {
          const t = new Date(p.time).getTime();
          return t >= startMs && t <= endMs;
        })
        .map((p) => ({
          time: new Date(p.time).getTime(),
          demand: Number(p.predicted_demand_kw.toFixed(1)),
          solar: Number(p.predicted_solar_kw.toFixed(1)),
          source: p.source,
        })),
    [forecast, startMs, endMs]
  );

  const hasForecastData =
    chartData.length > 0 &&
    chartData.some((p) => p.demand > 0 || p.solar > 0);

  return (
    <div className="space-y-3">
      {/* Forecast overlay chart */}
      <div className="h-32 w-full rounded-md border border-border/40 bg-muted/10 p-2">
        {hasForecastData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(45 90% 55%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(45 90% 55%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                type="number"
                domain={[startMs, endMs]}
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString(undefined, { hour: "numeric" })
                }
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={32} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelFormatter={(t) => new Date(t as number).toLocaleString()}
                formatter={(v: number, name: string) => [
                  `${v} kW`,
                  name === "demand" ? "Demand" : "Solar",
                ]}
              />
              <Area
                type="monotone"
                dataKey="demand"
                stroke="hsl(var(--primary))"
                fill="url(#demandGradient)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="solar"
                stroke="hsl(45 90% 55%)"
                fill="url(#solarGradient)"
                strokeWidth={1.5}
              />
              <ReferenceLine
                x={nowMs}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground gap-2">
            <Brain className="h-3.5 w-3.5" />
            Demand forecast warming up — engine needs more snapshots to project the curve
          </div>
        )}
      </div>

      {/* Wave track */}
      <div className="relative h-16 rounded-md border border-border/40 bg-muted/5">
        {/* Hour ticks */}
        <div className="absolute inset-x-0 top-0 flex h-3 pointer-events-none">
          {Array.from({ length: window.hours + 1 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-l border-border/30 first:border-l-0 relative"
            >
              <span className="absolute -top-0.5 left-1 text-[9px] text-muted-foreground">
                {i === 0 ? "Now" : `+${i}h`}
              </span>
            </div>
          ))}
        </div>

        {/* Wave markers */}
        {waves.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            No waves scheduled in this window
          </div>
        ) : (
          waves.map((w) => {
            const waveStart = new Date(w.arrival_window_start).getTime();
            const waveEnd = new Date(w.arrival_window_end).getTime();
            const left = Math.max(0, ((waveStart - startMs) / windowMs) * 100);
            const width = Math.max(2, ((waveEnd - waveStart) / windowMs) * 100);
            const clampedLeft = Math.min(left, 98);
            const clampedWidth = Math.min(width, 100 - clampedLeft);

            const riskColor =
              w.risk_level === "high"
                ? "bg-red-500/90 border-red-600"
                : w.risk_level === "medium"
                ? "bg-amber-500/90 border-amber-600"
                : w.risk_level === "low"
                ? "bg-blue-500/90 border-blue-600"
                : "bg-slate-500/90 border-slate-600";

            return (
              <button
                key={w.id}
                onClick={() =>
                  setExpandedWaveId(expandedWaveId === w.id ? null : w.id)
                }
                className={`absolute top-5 h-9 rounded border-2 ${riskColor} text-white text-[10px] font-medium px-1.5 overflow-hidden hover:ring-2 hover:ring-offset-1 hover:ring-offset-background hover:ring-primary transition`}
                style={{ left: `${clampedLeft}%`, width: `${clampedWidth}%` }}
                title={`${w.wave_code} · ${w.vehicle_count} vehicles · ${w.risk_level} risk`}
              >
                <div className="flex items-center gap-1 h-full">
                  {w.risk_level === "high" && (
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  )}
                  {w.ai_recommendation_count > 0 && (
                    <Brain className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span className="truncate">{w.wave_code}</span>
                  <span className="opacity-80 flex-shrink-0">· {w.vehicle_count}v</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Expanded wave detail */}
      {expandedWaveId &&
        (() => {
          const wave = waves.find((w) => w.id === expandedWaveId);
          if (!wave) return null;
          return (
            <WaveDetailCard
              wave={wave}
              onClose={() => setExpandedWaveId(null)}
            />
          );
        })()}
    </div>
  );
}

function WaveDetailCard({
  wave,
  onClose,
}: {
  wave: ScheduleIntelligenceWave;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/10 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{wave.wave_code}</span>
            <RiskBadge level={wave.risk_level} score={wave.risk_score} />
          </div>
          <div className="text-xs text-muted-foreground">
            {wave.depot_name} · {wave.vehicle_count} vehicles ·{" "}
            {new Date(wave.arrival_window_start).toLocaleTimeString()} →{" "}
            {new Date(wave.arrival_window_end).toLocaleTimeString()}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      {wave.risk_factors.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Risk Factors
          </div>
          <div className="flex flex-wrap gap-1">
            {wave.risk_factors.map((rf) => (
              <span
                key={rf}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
              >
                {rf.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {wave.ai_recommendations.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Top AI Recommendations ({wave.ai_recommendation_count} total)
          </div>
          <div className="space-y-1">
            {wave.ai_recommendations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 text-xs rounded-md bg-background/50 p-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{r.title}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({r.prediction_type.replace(/_/g, " ")})
                  </span>
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(r.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskBadge({
  level,
  score,
}: {
  level: "none" | "low" | "medium" | "high";
  score: number;
}) {
  const styles: Record<string, string> = {
    none: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    high: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border tabular-nums ${styles[level]}`}
    >
      Risk: {level} · {score.toFixed(2)}
    </span>
  );
}
