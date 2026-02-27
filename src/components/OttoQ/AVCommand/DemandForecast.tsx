import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Area } from "recharts";
import type { DemandWindow } from "@/services/ottoq-av-orchestrator";

interface Props {
  forecast: DemandWindow[];
}

export function DemandForecast({ forecast }: Props) {
  const currentHour = new Date().getHours();

  const data = forecast.map((w) => ({
    hour: w.label,
    demand: w.vehiclesNeeded,
    available: w.vehiclesAvailable,
    deficit: w.deficit,
    isCurrent: w.startHour === currentHour,
  }));

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">24h Demand Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                interval={2}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="available" fill="hsl(var(--success) / 0.6)" radius={[2, 2, 0, 0]} name="Available" />
              <Bar dataKey="deficit" fill="hsl(var(--destructive) / 0.5)" radius={[2, 2, 0, 0]} name="Deficit" stackId="gap" />
              <Line
                type="monotone"
                dataKey="demand"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
                name="Demand"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />Available</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />Deficit</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Demand</span>
        </div>
      </CardContent>
    </Card>
  );
}
