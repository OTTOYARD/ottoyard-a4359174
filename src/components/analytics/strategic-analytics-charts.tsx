import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useEnergyHistory,
  useFleetSummary,
} from "@/hooks/use-otto-q-strategic";

type Range = "7d" | "30d" | "90d";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  boxShadow: "0 4px 12px hsl(var(--muted) / 0.15)",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 500 as const,
};

function RangeToggle({
  range,
  setRange,
}: {
  range: Range;
  setRange: (r: Range) => void;
}) {
  return (
    <div className="flex space-x-1">
      {(["7d", "30d", "90d"] as const).map((r) => (
        <Button
          key={r}
          size="sm"
          variant={range === r ? "default" : "outline"}
          onClick={() => setRange(r)}
          className="min-w-16 text-xs px-2 py-1"
        >
          {r === "7d" ? "Week" : r === "30d" ? "Month" : "90 Days"}
        </Button>
      ))}
    </div>
  );
}

export function EnergyEfficiencyChart() {
  const [range, setRange] = useState<Range>("7d");
  const { data, isLoading } = useEnergyHistory(range);

  const chartData = (data?.series || []).map((p) => ({
    time: new Date(p.snapshot_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      ...(range === "7d" ? { hour: "2-digit" } : {}),
    }),
    demand: Math.round(p.current_demand_kw),
    solar: Math.round(p.solar_generation_kw),
    bess: Math.round(p.bess_output_kw),
  }));

  return (
    <Card className="shadow-fleet-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Energy Efficiency Trends</CardTitle>
          <RangeToggle range={range} setRange={setRange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full w-full animate-pulse bg-muted/40 rounded" />
          ) : chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              No energy data in this range yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "kW", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#demandGrad)" name="Demand" />
                <Area type="monotone" dataKey="solar" stroke="hsl(var(--warning))" strokeWidth={2} fill="url(#solarGrad)" name="Solar" />
                <Area type="monotone" dataKey="bess" stroke="hsl(var(--success))" strokeWidth={2} fill="hsl(var(--success) / 0.15)" name="BESS" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {data?.summary && (
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/40">
            <Stat label="Avg Demand" value={`${Math.round(data.summary.avg_demand_kw)} kW`} />
            <Stat label="Peak Demand" value={`${Math.round(data.summary.peak_demand_kw)} kW`} />
            <Stat label="Solar" value={`${Math.round(data.summary.total_solar_kwh)} kWh`} />
            <Stat label="BESS" value={`${Math.round(data.summary.total_bess_kwh)} kWh`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function FleetStatusPie() {
  const { data, isLoading } = useFleetSummary();

  return (
    <Card className="shadow-fleet-md">
      <CardHeader>
        <CardTitle>Fleet Status</CardTitle>
        {data && (
          <p className="text-xs text-muted-foreground">
            {data.totals.vehicles} vehicles across {data.depots.length} active depot{data.depots.length !== 1 ? "s" : ""}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading || !data ? (
            <div className="h-full w-full animate-pulse bg-muted/40 rounded" />
          ) : (() => {
            const { totals } = data;
            const idle = Math.max(
              0,
              totals.vehicles - totals.charging - totals.in_service - totals.staged - totals.en_route
            );
            const pieData = [
              { name: "Idle / On-Site", value: idle, fill: "hsl(var(--success))" },
              { name: "Charging", value: totals.charging, fill: "hsl(var(--primary))" },
              { name: "In Service", value: totals.in_service, fill: "hsl(var(--warning))" },
              { name: "Staged", value: totals.staged, fill: "hsl(262 83% 58%)" },
              { name: "En Route", value: totals.en_route, fill: "hsl(330 81% 60%)" },
            ].filter((d) => d.value > 0);

            if (pieData.length === 0) {
              return (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  No fleet data
                </div>
              );
            }

            return (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    innerRadius={30}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v} vehicles`, n]} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => (
                      <span style={{ color: "hsl(var(--foreground))", fontSize: "11px" }}>
                        {value}: {entry.payload.value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyEnergyGeneration() {
  const [range, setRange] = useState<Range>("30d");
  const { data, isLoading } = useEnergyHistory(range);

  // Aggregate by day: 15-min buckets * 0.25 = kWh
  const byDay: Record<string, number> = {};
  for (const p of data?.series || []) {
    const day = p.snapshot_at.split("T")[0];
    byDay[day] = (byDay[day] || 0) + p.solar_generation_kw * 0.25;
  }
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, kwh]) => ({
      day: new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      kwh: Math.round(kwh),
    }));

  return (
    <Card className="shadow-fleet-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Energy Generation</CardTitle>
          <RangeToggle range={range} setRange={setRange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full w-full animate-pulse bg-muted/40 rounded" />
          ) : chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              No generation data in this range yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="solarDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "kWh", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} kWh`, "Solar"]} />
                <Area type="monotone" dataKey="kwh" stroke="hsl(var(--warning))" strokeWidth={2} fill="url(#solarDaily)" name="Solar Generated" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VehicleBatteryLevels() {
  const { data, isLoading } = useFleetSummary();

  return (
    <Card className="shadow-fleet-md">
      <CardHeader>
        <CardTitle>Vehicle Battery Levels</CardTitle>
        {data && (
          <p className="text-xs text-muted-foreground">
            Distribution across {data.totals.vehicles} vehicles
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading || !data ? (
            <div className="h-full w-full animate-pulse bg-muted/40 rounded" />
          ) : (() => {
            const s = data.soc_distribution;
            const chartData = [
              { range: "0-20%", count: s.critical, fill: "hsl(var(--destructive))" },
              { range: "20-40%", count: s.low, fill: "hsl(var(--warning))" },
              { range: "40-70%", count: s.medium, fill: "hsl(var(--primary))" },
              { range: "70-95%", count: s.high, fill: "hsl(var(--success))" },
              { range: "95-100%", count: s.full, fill: "hsl(var(--success))" },
            ];
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: "Vehicles", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} vehicles`, "Count"]} />
                  <Bar dataKey="count" name="Vehicles">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
