import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Zap, Activity, Sun, BatteryCharging, DollarSign } from "lucide-react";
import { useEnergyHistory } from "@/hooks/use-otto-q-strategic";

// Primary depot (OTTOYARD Nashville Flagship) — the one OTTO-Q actively orchestrates.
const FLAGSHIP_DEPOT = "11111111-1111-1111-1111-111111111111";

const fmt = (v: number | null | undefined, unit: string, digits = 0) =>
  v == null ? "—" : `${v.toLocaleString(undefined, { maximumFractionDigits: digits })} ${unit}`;

export const EnergyDashboard = () => {
  const { data, isLoading } = useEnergyHistory("24h", FLAGSHIP_DEPOT);
  const series = data?.series ?? [];
  const summary = data?.summary;
  const latest = series[series.length - 1];

  const chartData = series.map((p) => ({
    t: new Date(p.snapshot_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    demand: Math.round(p.current_demand_kw),
    solar: Math.round(p.solar_generation_kw),
  }));

  const currentRate = latest?.current_rate_per_kwh;

  const stats = [
    { label: "Avg Demand (24h)", value: fmt(summary?.avg_demand_kw, "kW"), icon: Activity, color: "hsl(var(--primary))" },
    { label: "Peak Demand", value: fmt(summary?.peak_demand_kw, "kW"), icon: Zap, color: "hsl(var(--destructive))" },
    { label: "Solar Captured", value: fmt(summary?.total_solar_kwh, "kWh"), icon: Sun, color: "hsl(45, 93%, 47%)" },
    { label: "Battery Throughput", value: fmt(summary?.total_bess_kwh, "kWh"), icon: BatteryCharging, color: "hsl(142, 76%, 36%)" },
    { label: "Current Rate", value: currentRate != null ? `$${currentRate.toFixed(3)}/kWh` : "—", icon: DollarSign, color: "hsl(45, 93%, 47%)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Energy Management</h2>
        <Badge variant="outline" className="text-[10px]">live · flagship depot</Badge>
      </div>

      {/* Real stat cards from otto-q-core's energy history */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Real grid-demand profile (current_demand_kw) + solar generation */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Grid Demand &amp; Solar — last 24h</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[9px]" style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}>Grid demand</Badge>
              <Badge variant="outline" className="text-[9px]" style={{ borderColor: "hsl(45, 93%, 47%)", color: "hsl(45, 93%, 47%)" }}>Solar</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={Math.max(0, Math.floor(chartData.length / 8))} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} label={{ value: "kW", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="demand" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth={2} name="Grid demand" />
                  <Area type="monotone" dataKey="solar" fill="hsl(45, 93%, 47%, 0.2)" stroke="hsl(45, 93%, 47%)" strokeWidth={1.5} name="Solar" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center px-6">
                <p className="text-xs text-muted-foreground max-w-sm">
                  {isLoading ? "Loading energy history…" : "No energy history in the last 24h. It populates as OTTO-Q orchestrates a live operation at the depot."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
