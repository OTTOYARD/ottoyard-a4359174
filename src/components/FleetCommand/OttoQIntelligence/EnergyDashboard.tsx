import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ReferenceLine } from "recharts";
import { Zap, TrendingDown, DollarSign, BatteryCharging } from "lucide-react";

const energyProfile = Array.from({ length: 24 }, (_, i) => {
  const isPeak = i >= 14 && i <= 20;
  const isShoulder = (i >= 6 && i < 14) || (i >= 20 && i < 22);
  const optimized = isPeak ? 20 + Math.random() * 15 : isShoulder ? 40 + Math.random() * 20 : 60 + Math.random() * 30;
  const unoptimized = 35 + Math.random() * 25;
  return { hour: `${i}:00`, optimized: Math.round(optimized), unoptimized: Math.round(unoptimized), rate: isPeak ? "Peak" : isShoulder ? "Shoulder" : "Off-Peak" };
});

const dailyCosts = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  cost: 120 + Math.random() * 60,
}));

const leaderboard = [
  { rank: 1, member: "Member #2847", saved: 67.40 },
  { rank: 2, member: "Member #1923", saved: 52.10 },
  { rank: 3, member: "Member #3102", saved: 48.90 },
  { rank: 4, member: "Member #4215", saved: 41.20 },
  { rank: 5, member: "Member #1087", saved: 38.75 },
];

const rateColors: Record<string, string> = { "Off-Peak": "hsl(142, 76%, 36%)", "Shoulder": "hsl(45, 93%, 47%)", "Peak": "hsl(var(--destructive))" };

export const EnergyDashboard = () => {
  const currentHour = new Date().getHours();
  const currentRate = currentHour >= 14 && currentHour <= 20 ? "Peak" : (currentHour >= 6 && currentHour < 14) || (currentHour >= 20 && currentHour < 22) ? "Shoulder" : "Off-Peak";
  const nextChange = currentRate === "Peak" ? `${20 - currentHour}h to Shoulder` : currentRate === "Shoulder" && currentHour < 14 ? `${14 - currentHour}h to Peak` : currentRate === "Shoulder" ? `${22 - currentHour}h to Off-Peak` : `${6 - currentHour + (currentHour >= 6 ? 24 : 0)}h to Shoulder`;

  const totalKwh = energyProfile.reduce((s, e) => s + e.optimized, 0);
  const totalUnopt = energyProfile.reduce((s, e) => s + e.unoptimized, 0);
  const avgCostOpt = 0.072;
  const avgCostNaive = 0.108;
  const savingsPct = Math.round(((avgCostNaive - avgCostOpt) / avgCostNaive) * 100);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Energy Management</h2>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total kWh Today", value: `${totalKwh} kWh`, icon: BatteryCharging, color: "hsl(var(--primary))" },
          { label: "Avg Cost/kWh", value: `$${avgCostOpt.toFixed(3)}`, icon: DollarSign, color: "hsl(45, 93%, 47%)" },
          { label: "Savings vs Peak", value: `${savingsPct}% saved`, icon: TrendingDown, color: "hsl(142, 76%, 36%)" },
          { label: "Current Rate", value: currentRate, icon: Zap, color: rateColors[currentRate] },
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

      {/* Energy profile chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">24-Hour Energy Consumption Profile</CardTitle>
            <div className="flex gap-2">
              {Object.entries(rateColors).map(([k, c]) => (
                <Badge key={k} variant="outline" className="text-[9px]" style={{ borderColor: c, color: c }}>{k}</Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyProfile}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} label={{ value: "kWh", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="optimized" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth={2} name="OTTO-Q Optimized" />
                <Area type="monotone" dataKey="unoptimized" fill="transparent" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" name="Unoptimized" />
                {/* Rate bands via reference lines */}
                <ReferenceLine x="6:00" stroke="hsl(45, 93%, 47%)" strokeDasharray="3 3" />
                <ReferenceLine x="14:00" stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <ReferenceLine x="20:00" stroke="hsl(45, 93%, 47%)" strokeDasharray="3 3" />
                <ReferenceLine x="22:00" stroke="hsl(142, 76%, 36%)" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly cost tracker */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Energy Cost</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyCosts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]} />
                  <Bar dataKey="cost" fill="hsl(45, 93%, 47%, 0.6)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs mt-2 text-muted-foreground">
              <span>MTD: $4,284</span>
              <span>Projected: $4,680</span>
            </div>
          </CardContent>
        </Card>

        {/* ROI + Leaderboard */}
        <div className="space-y-4">
          <Card className="glass-card p-4 border-l-4" style={{ borderLeftColor: "hsl(45, 93%, 47%)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">OTTO-Q Energy ROI</p>
            <p className="text-2xl font-bold" style={{ color: "hsl(45, 93%, 47%)" }}>$1,247</p>
            <p className="text-xs text-muted-foreground mt-1">Saved this month across 342 charge sessions</p>
            <p className="text-xs text-muted-foreground">Avg $3.65 saved per session</p>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Savings Leaderboard</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.map(m => (
                <div key={m.rank} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-center font-bold text-muted-foreground">#{m.rank}</span>
                  <span className="flex-1 text-foreground">{m.member}</span>
                  <span className="font-semibold" style={{ color: "hsl(45, 93%, 47%)" }}>${m.saved.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
