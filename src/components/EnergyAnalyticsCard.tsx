import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingDown, Gauge, Leaf } from "lucide-react";

interface EnergyAnalytics {
  energyConsumed: number; // kWh
  energyRegenerated: number; // kWh
  efficiency: number; // percentage
  peakDemand: number; // kW
  carbonOffset: number; // kg CO2
}

interface EnergyAnalyticsCardProps {
  data: EnergyAnalytics;
  className?: string;
}

export const EnergyAnalyticsCard = ({ data, className = "" }: EnergyAnalyticsCardProps) => {
  const netEnergy = data.energyConsumed - data.energyRegenerated;
  const regenerationRate = (data.energyRegenerated / data.energyConsumed) * 100;

  return (
    <Card className={`futuristic-card border-primary/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Energy Analytics
          </CardTitle>
          <Badge variant="outline" className="border-success/40 text-success">
            {data.efficiency}% Efficient
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Consumed</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {data.energyConsumed.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">kWh</div>
          </div>

          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Regenerated</span>
            </div>
            <div className="text-lg font-bold text-success">
              {data.energyRegenerated.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              kWh ({regenerationRate.toFixed(1)}%)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-3.5 h-3.5 text-accent-foreground" />
              <span className="text-xs text-muted-foreground">Peak Demand</span>
            </div>
            <div className="text-lg font-bold">
              {data.peakDemand.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">kW</div>
          </div>

          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Carbon Offset</span>
            </div>
            <div className="text-lg font-bold text-success">
              {data.carbonOffset.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">kg CO₂</div>
          </div>
        </div>

        <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-muted/40">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Net Energy Usage:</span>
            <span className="font-semibold">{netEnergy.toLocaleString()} kWh</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};