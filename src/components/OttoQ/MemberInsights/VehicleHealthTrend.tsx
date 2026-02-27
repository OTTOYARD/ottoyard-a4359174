import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VehicleHealthTrendProps {
  currentScore: number;
}

// Mock sparkline data
const trendData = [72, 74, 73, 78, 80, 82, 85, 87, 88, 90, 91, 94];

export const VehicleHealthTrend: React.FC<VehicleHealthTrendProps> = ({ currentScore }) => {
  const firstScore = trendData[0];
  const change = currentScore - firstScore;
  const changePct = Math.round((change / firstScore) * 100);
  const trend = change > 2 ? "up" : change < -2 ? "down" : "stable";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  // SVG sparkline
  const max = Math.max(...trendData, currentScore);
  const min = Math.min(...trendData, currentScore);
  const range = max - min || 1;
  const allData = [...trendData, currentScore];
  const width = 120;
  const height = 32;
  const points = allData.map((v, i) => {
    const x = (i / (allData.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const tooltipText = trend === "up"
    ? `Your health score improved ${changePct}% this month because you stayed on top of detail cleans and charged during off-peak hours.`
    : trend === "down"
    ? `Your health score declined ${Math.abs(changePct)}%. Consider scheduling a detail clean and tire rotation.`
    : "Your vehicle health is stable. Keep up the great maintenance routine.";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="surface-luxury rounded-2xl p-4 cursor-help">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Health Trend</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  <span className={`text-sm font-bold ${trendColor}`}>
                    {change > 0 ? "+" : ""}{changePct}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">this month</span>
                </div>
              </div>

              {/* Sparkline */}
              <svg width={width} height={height} className="flex-shrink-0">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <polyline
                  points={points}
                  fill="none"
                  stroke="url(#sparkGrad)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* End dot */}
                {(() => {
                  const lastX = width;
                  const lastY = height - ((currentScore - min) / range) * (height - 4) - 2;
                  return <circle cx={lastX} cy={lastY} r={3} fill="hsl(var(--primary))" />;
                })()}
              </svg>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px] text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
