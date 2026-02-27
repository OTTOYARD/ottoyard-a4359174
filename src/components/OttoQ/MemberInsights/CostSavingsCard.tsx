import React from "react";
import { DollarSign, TrendingDown } from "lucide-react";

export const CostSavingsCard: React.FC = () => {
  const monthSavings = 47.2;
  const avgCostPerKwh = 0.08;
  const marketAvg = 0.14;
  const projectedAnnual = monthSavings * 12;
  const savingsPct = Math.round((1 - avgCostPerKwh / marketAvg) * 100);

  return (
    <div className="surface-elevated-luxury rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-warning" />
        </div>
        <div>
          <p className="text-sm font-semibold text-luxury">Smart Savings</p>
          <p className="text-[10px] text-muted-foreground">Off-peak charging optimization</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="surface-luxury rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-warning tabular-nums">${monthSavings.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">This Month</p>
        </div>
        <div className="surface-luxury rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-primary tabular-nums">${projectedAnnual.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">Projected Annual</p>
        </div>
      </div>

      {/* Comparison bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Your avg</span>
          <span className="text-primary font-semibold tabular-nums">${avgCostPerKwh.toFixed(2)}/kWh</span>
        </div>
        <div className="h-2 rounded-full bg-muted/20 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            style={{ width: `${(avgCostPerKwh / marketAvg) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Market avg</span>
          <span className="text-muted-foreground tabular-nums">${marketAvg.toFixed(2)}/kWh</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <TrendingDown className="h-3 w-3 text-success" />
          <span className="text-[10px] text-success font-medium">{savingsPct}% below market rate</span>
        </div>
      </div>
    </div>
  );
};
