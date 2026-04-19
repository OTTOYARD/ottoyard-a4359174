// src/components/ProgressionAnalyticsSubtab.tsx
// Analytics "Progression" sub-tab — surfaces the progression engine's live
// decision log, daily category trend, and 24h rollup stats.

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Brain,
  AlertTriangle,
  Wrench,
  TrendingUp,
} from "lucide-react";
import {
  useProgressionDecisions,
  type ProgressionDecision,
} from "@/hooks/use-orchestra-progression";

interface ProgressionAnalyticsSubtabProps {
  depotId?: string;
}

// Decision category mapping
const CATEGORY: Record<string, "advance" | "oem_ok" | "override" | "blocked" | "wait"> = {
  auto_advanced: "advance",
  all_services_complete: "advance",
  overnight_staged: "advance",
  scheduled_release_fired: "oem_ok",
  oem_accepted: "oem_ok",
  tech_override_defer: "override",
  tech_override_skip: "override",
  tech_override_swap: "override",
  tech_override_repeat: "override",
  tech_override_extend: "override",
  tech_override_release: "override",
  abnormality_blocked: "blocked",
  oem_rejected: "blocked",
  held_stall_unavailable: "wait",
  oem_gate_pending: "wait",
};

const CATEGORY_COLOR = {
  advance: "hsl(var(--success))",
  oem_ok: "hsl(var(--primary))",
  override: "hsl(280 70% 60%)",
  blocked: "hsl(var(--destructive))",
  wait: "hsl(var(--warning))",
};

export function ProgressionAnalyticsSubtab({ depotId }: ProgressionAnalyticsSubtabProps) {
  const { data, isLoading } = useProgressionDecisions({
    depot_id: depotId,
    limit: 200,
  });

  const decisions = data?.decisions ?? [];

  // 24h rollups
  const stats = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const recent = decisions.filter((d) => new Date(d.created_at).getTime() >= cutoff);
    return {
      autoAdvances: recent.filter((d) => d.decision === "auto_advanced").length,
      oemGates: recent.filter((d) => d.decision === "oem_gate_pending").length,
      overrides: recent.filter((d) => d.decision.startsWith("tech_override_")).length,
      abnormalities: recent.filter((d) => d.decision === "abnormality_blocked").length,
    };
  }, [decisions]);

  // 7-day stacked chart
  const chartData = useMemo(() => buildDailySeries(decisions), [decisions]);

  // Recent feed (newest first)
  const feed = useMemo(
    () =>
      [...decisions]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 50),
    [decisions],
  );

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Auto-advances"
          value={stats.autoAdvances}
          color="text-success"
        />
        <StatCard
          icon={<Brain className="w-4 h-4" />}
          label="OEM gate requests"
          value={stats.oemGates}
          color="text-primary"
        />
        <StatCard
          icon={<Wrench className="w-4 h-4" />}
          label="Tech overrides"
          value={stats.overrides}
          color="text-purple-500"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Abnormalities"
          value={stats.abnormalities}
          color="text-destructive"
        />
      </div>

      {/* Daily stacked chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Decisions per day (last 7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No progression decisions in the last 7 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="advance" stackId="a" fill={CATEGORY_COLOR.advance} name="Advance" />
                <Bar dataKey="oem_ok" stackId="a" fill={CATEGORY_COLOR.oem_ok} name="OEM accept" />
                <Bar dataKey="override" stackId="a" fill={CATEGORY_COLOR.override} name="Override" />
                <Bar dataKey="wait" stackId="a" fill={CATEGORY_COLOR.wait} name="Wait" />
                <Bar dataKey="blocked" stackId="a" fill={CATEGORY_COLOR.blocked} name="Blocked" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Live decision feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Live decision feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Loading…</p>
          ) : feed.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No progression events in the last 24h.
            </p>
          ) : (
            <ScrollArea className="h-[360px]">
              <div className="divide-y divide-border/40">
                {feed.map((d) => (
                  <DecisionRow key={d.id} decision={d} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`flex items-center gap-1.5 text-xs ${color}`}>
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
        <p className="text-[10px] text-muted-foreground">last 24h</p>
      </CardContent>
    </Card>
  );
}

function DecisionRow({ decision }: { decision: ProgressionDecision }) {
  const cat = CATEGORY[decision.decision] ?? "wait";
  const colorClass =
    cat === "advance"
      ? "bg-success/10 text-success border-success/30"
      : cat === "oem_ok"
      ? "bg-primary/10 text-primary border-primary/30"
      : cat === "override"
      ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
      : cat === "blocked"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-warning/10 text-warning border-warning/30";

  return (
    <div className="px-3 py-2 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="font-mono text-muted-foreground tabular-nums">
          {new Date(decision.created_at).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <Badge variant="outline" className={`${colorClass} text-[10px] py-0 h-4`}>
          {decision.decision}
        </Badge>
        {decision.vehicle_external_ref && (
          <span className="font-medium">{decision.vehicle_external_ref}</span>
        )}
        {decision.vehicle_oem && (
          <span className="text-muted-foreground">{decision.vehicle_oem}</span>
        )}
        {decision.from_sequence_order != null && decision.to_sequence_order != null ? (
          <span className="text-muted-foreground">
            · seq {decision.from_sequence_order} → {decision.to_sequence_order}
          </span>
        ) : decision.sequence_order != null ? (
          <span className="text-muted-foreground">· seq {decision.sequence_order}</span>
        ) : null}
      </div>
      {decision.audit_note && (
        <p className="text-[11px] text-muted-foreground italic mt-0.5 pl-1">
          └ "{decision.audit_note}"
        </p>
      )}
    </div>
  );
}

function buildDailySeries(decisions: ProgressionDecision[]) {
  const days: Record<string, { day: string; advance: number; oem_ok: number; override: number; blocked: number; wait: number }> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = {
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      advance: 0,
      oem_ok: 0,
      override: 0,
      blocked: 0,
      wait: 0,
    };
  }
  for (const d of decisions) {
    const key = d.created_at.slice(0, 10);
    if (!days[key]) continue;
    const cat = CATEGORY[d.decision] ?? "wait";
    days[key][cat] += 1;
  }
  return Object.values(days);
}
