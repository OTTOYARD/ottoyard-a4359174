import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingDown, Clock, DollarSign } from "lucide-react";
import type { EnergyArbitrageResult } from "@/services/ottoq-av-orchestrator";

interface Props {
  result: EnergyArbitrageResult | null;
}

export function EnergyArbitrageCard({ result }: Props) {
  if (!result) {
    return (
      <Card className="glass-card border-border/30">
        <CardContent className="py-8 text-center text-xs text-muted-foreground">
          No energy data available yet.
        </CardContent>
      </Card>
    );
  }

  const tierColors: Record<string, string> = {
    "Off-Peak": "text-success",
    "Shoulder": "text-warning",
    "Peak": "text-destructive",
  };

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Energy Arbitrage
          </CardTitle>
          <Badge variant="outline" className={`text-[10px] ${tierColors[result.currentRateTier] ?? ""}`}>
            {result.currentRateTier} — {result.minutesUntilRateChange}m until change
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={Zap} label="Total kWh" value={`${result.totalKwhConsumed}`} />
          <Metric icon={DollarSign} label="Avg $/kWh" value={`$${result.avgCostPerKwh}`} />
          <Metric icon={TrendingDown} label="Savings vs Peak" value={`$${result.savingsVsPeakDollars} (${result.savingsPercent}%)`} accent />
          <Metric icon={Clock} label="Monthly Projection" value={`$${result.projectedMonthlySavings}`} accent />
        </div>

        {/* Mini sparkline */}
        <div className="mt-3 flex items-end gap-[2px] h-10">
          {result.hourlyConsumption.map((h) => {
            const maxKwh = Math.max(...result.hourlyConsumption.map((x) => x.kwh), 1);
            const height = (h.kwh / maxKwh) * 100;
            const isOffPeak = h.hour >= 22 || h.hour < 6;
            return (
              <div
                key={h.hour}
                className={`flex-1 rounded-t-sm transition-all ${isOffPeak ? "bg-accent/70" : h.rate >= 0.14 ? "bg-destructive/50" : "bg-warning/50"}`}
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${h.hour}:00 — ${h.kwh} kWh @ $${h.rate}/kWh`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: typeof Zap; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${accent ? "text-accent" : "text-muted-foreground"}`} />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}
