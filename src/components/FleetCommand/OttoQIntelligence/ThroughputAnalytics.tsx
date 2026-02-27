import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const stallTypes = ["Charge", "Clean", "Service Bay", "Staging"];
const heatmapData = stallTypes.map(type => ({
  type,
  hours: hours.map((h, i) => {
    const base = type === "Charge" ? 60 : type === "Clean" ? 40 : type === "Service Bay" ? 70 : 30;
    const peak = (i >= 8 && i <= 11) || (i >= 16 && i <= 19) ? 30 : 0;
    return Math.min(100, base + peak + Math.floor(Math.random() * 20));
  }),
}));

const flowData = Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  arrivals: 40 + Math.floor(Math.random() * 15),
  completions: 38 + Math.floor(Math.random() * 15),
  active: 8 + Math.floor(Math.random() * 6),
}));

const serviceMix = [
  { name: "Charge", value: 48, color: "hsl(var(--primary))" },
  { name: "Detail Clean", value: 22, color: "hsl(217, 91%, 60%)" },
  { name: "Tire Rotation", value: 12, color: "hsl(45, 93%, 47%)" },
  { name: "Battery Check", value: 10, color: "hsl(142, 76%, 36%)" },
  { name: "Full Service", value: 8, color: "hsl(280, 70%, 55%)" },
];

const durationData = [
  { type: "Charge", avg: 42, target: 45 },
  { type: "Detail Clean", avg: 38, target: 30 },
  { type: "Tire Rotation", avg: 28, target: 30 },
  { type: "Battery Check", avg: 22, target: 25 },
  { type: "Full Service", avg: 90, target: 90 },
];

const getHeatColor = (v: number) => {
  if (v >= 85) return "bg-destructive/80";
  if (v >= 70) return "bg-warning/60";
  if (v >= 50) return "bg-primary/50";
  if (v >= 30) return "bg-primary/25";
  return "bg-muted/30";
};

export const ThroughputAnalytics = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold">Throughput Analytics</h2>

    {/* Heatmap */}
    <Card className="glass-card">
      <CardHeader className="pb-2"><CardTitle className="text-sm">24-Hour Utilization Heatmap</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[100px_repeat(24,1fr)] gap-px text-[9px]">
            <div />
            {hours.map(h => <div key={h} className="text-center text-muted-foreground">{h.split(":")[0]}</div>)}
            {heatmapData.map(row => (
              <>
                <div key={row.type} className="flex items-center text-xs font-medium text-muted-foreground pr-2">{row.type}</div>
                {row.hours.map((v, i) => (
                  <div key={`${row.type}-${i}`} className={`h-6 rounded-sm ${getHeatColor(v)} transition-colors`} title={`${v}%`} />
                ))}
              </>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <span>Low</span>
            {["bg-muted/30", "bg-primary/25", "bg-primary/50", "bg-warning/60", "bg-destructive/80"].map(c => (
              <div key={c} className={`h-3 w-6 rounded ${c}`} />
            ))}
            <span>High</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Vehicle Flow */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Vehicle Flow (7 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="arrivals" stackId="1" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" />
                <Area type="monotone" dataKey="completions" stackId="2" fill="hsl(142, 76%, 36%, 0.3)" stroke="hsl(142, 76%, 36%)" />
                <Area type="monotone" dataKey="active" stackId="3" fill="hsl(217, 91%, 60%, 0.3)" stroke="hsl(217, 91%, 60%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Service Mix */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Service Mix</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceMix} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {serviceMix.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 ml-2 shrink-0">
              {serviceMix.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-medium ml-auto">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration vs Target */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Service Duration vs Target (minutes)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {durationData.map(d => {
              const over = d.avg > d.target;
              const pct = (d.avg / 120) * 100;
              const tPct = (d.target / 120) * 100;
              return (
                <div key={d.type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{d.type}</span>
                    <span className={over ? "text-warning font-medium" : "text-foreground"}>{d.avg}m / {d.target}m target</span>
                  </div>
                  <div className="relative h-4 rounded-full bg-muted/30">
                    <div className={`h-full rounded-full transition-all ${over ? "bg-warning/70" : "bg-primary/60"}`}
                      style={{ width: `${pct}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${tPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
