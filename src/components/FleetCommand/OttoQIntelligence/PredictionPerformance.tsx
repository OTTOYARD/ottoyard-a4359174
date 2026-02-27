import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, BarChart, Bar, Cell } from "recharts";
import { Target, TrendingUp, Clock, Users } from "lucide-react";

const accuracyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  accuracy: 72 + Math.random() * 18,
}));

const funnelSteps = [
  { step: "Predictions Generated", value: 520, pct: 100 },
  { step: "Notifications Sent", value: 468, pct: 90 },
  { step: "Opened", value: 398, pct: 85 },
  { step: "Accepted", value: 310, pct: 78 },
  { step: "Completed", value: 294, pct: 95 },
];

const behaviorHeatmap = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => {
    const isWeekday = day < 5;
    const isMorning = hour >= 7 && hour <= 9;
    const isEvening = hour >= 17 && hour <= 21;
    const base = isWeekday ? (isMorning ? 60 : isEvening ? 80 : 15) : (hour >= 10 && hour <= 16 ? 45 : 10);
    return Math.min(100, base + Math.floor(Math.random() * 20));
  })
);

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getIntensityClass = (v: number) => {
  if (v >= 70) return "bg-primary/80";
  if (v >= 50) return "bg-primary/50";
  if (v >= 30) return "bg-primary/25";
  return "bg-muted/20";
};

export const PredictionPerformance = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold">Prediction Performance</h2>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "30-Day Accuracy", value: "84%", icon: Target, color: "hsl(var(--primary))" },
        { label: "Trend", value: "+3.2%", icon: TrendingUp, color: "hsl(142, 76%, 36%)" },
        { label: "Avg Response Time", value: "2.4 hrs", icon: Clock, color: "hsl(217, 91%, 60%)" },
        { label: "Active Members", value: "127", icon: Users, color: "hsl(45, 93%, 47%)" },
      ].map(s => (
        <Card key={s.label} className="glass-card p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold">{s.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Accuracy over time */}
    <Card className="glass-card">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Prediction Accuracy (30 Days)</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={4} />
              <YAxis domain={[60, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v.toFixed(1)}%`, "Accuracy"]} />
              <ReferenceLine y={80} stroke="hsl(45, 93%, 47%)" strokeDasharray="4 4" label={{ value: "80% Target", fill: "hsl(45, 93%, 47%)", fontSize: 10 }} />
              <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Notification Funnel */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Notification Engagement Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {funnelSteps.map((s, i) => {
            const width = (s.value / funnelSteps[0].value) * 100;
            const dropoff = i > 0 ? funnelSteps[i - 1].value - s.value : 0;
            return (
              <div key={s.step} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{s.step}</span>
                  <span className="font-medium">{s.value} ({s.pct}%)</span>
                </div>
                <div className="h-6 rounded bg-muted/20 relative overflow-hidden">
                  <div className="h-full rounded bg-primary/60 transition-all flex items-center justify-end pr-2" style={{ width: `${width}%` }}>
                    {dropoff > 0 && <span className="text-[9px] text-destructive font-medium">-{dropoff}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Member Booking Behavior Heatmap */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Member Booking Patterns (Day × Hour)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-px text-[8px]">
              <div />
              {Array.from({ length: 24 }, (_, i) => <div key={i} className="text-center text-muted-foreground">{i}</div>)}
              {behaviorHeatmap.map((row, d) => (
                <>
                  <div key={dayLabels[d]} className="flex items-center text-xs text-muted-foreground">{dayLabels[d]}</div>
                  {row.map((v, h) => (
                    <div key={`${d}-${h}`} className={`h-5 rounded-sm ${getIntensityClass(v)}`} title={`${dayLabels[d]} ${h}:00 — ${v}%`} />
                  ))}
                </>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
