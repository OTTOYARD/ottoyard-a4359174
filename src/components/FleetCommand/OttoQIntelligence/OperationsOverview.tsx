import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Zap, Users, Bot, Clock, TrendingUp, TrendingDown, DollarSign, CheckCircle2, Target, BarChart3, BatteryCharging, Sparkles, AlertTriangle } from "lucide-react";

// --- Gauge Component ---
const SemiGauge = ({ label, used, total, color }: { label: string; used: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const radius = 40;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
        <text x="50" y="48" textAnchor="middle" className="fill-foreground text-sm font-bold">{used}/{total}</text>
      </svg>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <span className="text-xs font-semibold" style={{ color }}>{Math.round(pct)}%</span>
    </div>
  );
};

// --- Metric Card ---
const KPICard = ({ label, value, sub, trend, icon: Icon, sparkColor }: { label: string; value: string; sub: string; trend: "up" | "down" | "flat"; icon: any; sparkColor: string }) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Activity;
  const trendCls = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <Card className="glass-card p-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
          <div className={`flex items-center gap-1 text-xs ${trendCls}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{sub}</span>
          </div>
        </div>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${sparkColor}20` }}>
          <Icon className="h-4 w-4" style={{ color: sparkColor }} />
        </div>
      </div>
    </Card>
  );
};

type EventEntry = { id: string; time: string; category: string; severity: "info" | "warning" | "critical" | "success"; message: string };

const mockEvents: EventEntry[] = [
  { id: "1", time: "14:32:08", category: "AV", severity: "success", message: "AV-017 pipeline complete — staged for deployment" },
  { id: "2", time: "14:31:45", category: "Member", severity: "info", message: "Member #2847 accepted charge recommendation for Thu 10pm" },
  { id: "3", time: "14:30:12", category: "System", severity: "warning", message: "Charge stall utilization at 87% — approaching threshold" },
  { id: "4", time: "14:29:58", category: "AV", severity: "info", message: "AV-003 transitioning: charge stall → clean stall" },
  { id: "5", time: "14:28:30", category: "Energy", severity: "success", message: "Rate change: Shoulder → Off-peak ($0.06/kWh)" },
  { id: "6", time: "14:27:15", category: "Member", severity: "info", message: "Notification sent: tire rotation due for Member #1923" },
  { id: "7", time: "14:26:02", category: "Alert", severity: "critical", message: "Service Bay 1 occupied 2.3x estimated duration" },
  { id: "8", time: "14:25:44", category: "AV", severity: "info", message: "AV-009 arrived at depot — intake pipeline initiated" },
  { id: "9", time: "14:24:30", category: "System", severity: "info", message: "OTTO-Q scan completed — 3 threshold crossings detected" },
  { id: "10", time: "14:23:11", category: "Member", severity: "success", message: "Detail clean completed for Member #3102 at Stall C-04" },
];

const severityColors: Record<string, string> = {
  info: "hsl(var(--primary))",
  warning: "hsl(var(--warning))",
  critical: "hsl(var(--destructive))",
  success: "hsl(var(--success))",
};

const categoryIcons: Record<string, any> = {
  AV: Bot,
  Member: Users,
  System: Activity,
  Energy: Zap,
  Alert: AlertTriangle,
};

const filterOptions = ["All", "Alerts Only", "Member", "AV", "System"] as const;

export const OperationsOverview = () => {
  const [filter, setFilter] = useState<string>("All");
  const [scanAgo, setScanAgo] = useState(4);

  useEffect(() => {
    const t = setInterval(() => setScanAgo(prev => (prev >= 30 ? 4 : prev + 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = mockEvents.filter(e => {
    if (filter === "All") return true;
    if (filter === "Alerts Only") return e.severity === "warning" || e.severity === "critical";
    return e.category === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">OTTO-Q Operations Hub</h2>
        <Badge variant="outline" className="border-success/50 text-success gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Engine Active — Last scan: {scanAgo}s ago
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT — Live Status */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Depot Utilization</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <SemiGauge label="Charge" used={32} total={40} color="hsl(var(--primary))" />
              <SemiGauge label="Clean" used={7} total={10} color="hsl(217, 91%, 60%)" />
              <SemiGauge label="Service Bay" used={1} total={1} color="hsl(45, 93%, 47%)" />
              <SemiGauge label="Staging" used={6} total={10} color="hsl(var(--muted-foreground))" />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Queue Depth</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Charge", depth: 3, max: 10 },
                { label: "Clean", depth: 1, max: 10 },
                { label: "Service", depth: 0, max: 10 },
                { label: "Staging", depth: 2, max: 10 },
              ].map(q => (
                <div key={q.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{q.label}</span>
                    <span className={`font-medium ${q.depth > 6 ? "text-destructive" : q.depth > 3 ? "text-warning" : "text-foreground"}`}>{q.depth} waiting</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50">
                    <div className={`h-full rounded-full transition-all ${q.depth > 6 ? "bg-destructive" : q.depth > 3 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${(q.depth / q.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CENTER — Activity Stream */}
        <div className="lg:col-span-5">
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Live Activity</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  {filterOptions.map(f => (
                    <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"}
                      className="h-6 text-[10px] px-2" onClick={() => setFilter(f)}>{f}</Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                <div className="space-y-2">
                  {filtered.map(ev => {
                    const Icon = categoryIcons[ev.category] || Activity;
                    return (
                      <div key={ev.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="p-1 rounded" style={{ backgroundColor: `${severityColors[ev.severity]}20` }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: severityColors[ev.severity] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground leading-snug">{ev.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{ev.time}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] shrink-0" style={{ borderColor: severityColors[ev.severity], color: severityColors[ev.severity] }}>
                          {ev.category}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — KPIs */}
        <div className="lg:col-span-4 space-y-3">
          <KPICard label="Services Completed Today" value="47" sub="+12% vs yesterday" trend="up" icon={CheckCircle2} sparkColor="hsl(var(--primary))" />
          <KPICard label="Average Wait Time" value="8.3 min" sub="-2.1 min vs last week" trend="down" icon={Clock} sparkColor="hsl(217, 91%, 60%)" />
          <KPICard label="Depot Throughput" value="6.2 veh/hr" sub="+0.4 vs yesterday" trend="up" icon={BarChart3} sparkColor="hsl(var(--primary))" />
          <KPICard label="Energy Cost Today" value="$142.80" sub="$38.50 saved" trend="down" icon={BatteryCharging} sparkColor="hsl(45, 93%, 47%)" />
          <KPICard label="Prediction Accuracy" value="84%" sub="+3% this week" trend="up" icon={Target} sparkColor="hsl(142, 76%, 36%)" />
          <KPICard label="Revenue Today" value="$2,847" sub="+8% vs yesterday" trend="up" icon={DollarSign} sparkColor="hsl(45, 93%, 47%)" />
          <KPICard label="Member Satisfaction" value="91%" sub="Based on accept rate" trend="up" icon={Sparkles} sparkColor="hsl(var(--primary))" />
        </div>
      </div>
    </div>
  );
};
