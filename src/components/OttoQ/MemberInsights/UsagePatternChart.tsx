import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Zap, Droplets } from "lucide-react";

interface DataPoint {
  date: string;
  soc: number;
  event?: string;
}

// Generate 30 days of mock SOC data
const generateMockData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  let soc = 85;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Drain ~8-15% per day, charge events jump up
    soc -= Math.random() * 15 + 5;
    if (soc < 25) {
      soc = 80 + Math.random() * 15; // charge event
      data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), soc: Math.round(soc), event: "charge" });
    } else if (i % 10 === 0) {
      data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), soc: Math.round(soc), event: "detail" });
    } else {
      data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), soc: Math.round(soc) });
    }
  }
  return data;
};

export const UsagePatternChart: React.FC = () => {
  const [range, setRange] = useState<30 | 60 | 90>(30);
  const data = useMemo(() => generateMockData(), []);

  return (
    <div className="surface-luxury rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-luxury">Usage Pattern</p>
          <p className="text-[10px] text-muted-foreground">SOC trajectory & service events</p>
        </div>
        <div className="surface-luxury rounded-lg p-0.5 flex">
          {([30, 60, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                range === r ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border) / 0.3)",
                borderRadius: "12px",
                fontSize: "11px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
              formatter={(value: number) => [`${value}%`, "SOC"]}
            />
            <ReferenceLine y={20} stroke="hsl(var(--destructive) / 0.3)" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="soc" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#socGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">Charge Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] text-muted-foreground">Detail Clean</span>
        </div>
      </div>
    </div>
  );
};
