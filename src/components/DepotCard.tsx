import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  TrendingUp, 
  Battery,
  MoreVertical,
  Activity
} from "lucide-react";
import DepotAnalytics from "./DepotAnalytics";

interface Depot {
  id: string;
  name: string;
  energyGenerated: number;
  energyReturned: number;
  vehiclesCharging: number;
  totalStalls?: number;
  availableStalls?: number;
  status: string;
}

interface DepotCardProps {
  depot: Depot;
  compact?: boolean;
  highlighted?: boolean;
}

const DepotCard = ({ depot, compact = false, highlighted = false }: DepotCardProps) => {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const efficiencyRate = (depot.energyReturned / depot.energyGenerated) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-success/10 text-success border-success/20";
      case "maintenance":
        return "bg-yellow-200/20 text-yellow-600 border-yellow-400/30";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-secondary/10 text-secondary border-secondary/20";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-energy-grid" />
            <span className="font-medium text-card-foreground">{depot.name}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-success">
              +{depot.energyReturned} kWh
            </div>
            <div className="text-xs text-muted-foreground">Grid Return</div>
          </div>
          <Badge variant="outline" className={getStatusColor(depot.status)}>
            {depot.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className={`shadow-fleet-md hover:shadow-fleet-lg transition-all duration-300 select-none ${
      highlighted ? 'ring-4 ring-energy-grid/60 shadow-[0_0_30px_rgba(var(--energy-grid),0.5)] scale-[1.02]' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Zap className="h-5 w-5 mr-2 text-energy-grid" />
            {depot.name}
          </CardTitle>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor(depot.status)}>
            <Activity className="h-3 w-3 mr-1" />
            {depot.status.charAt(0).toUpperCase() + depot.status.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground">{depot.id}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Energy Generation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Generated Today</div>
            <div className="text-2xl font-bold text-energy-grid">
              {depot.energyGenerated}
              <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Returned to Grid</div>
            <div className="text-2xl font-bold text-success">
              {depot.energyReturned}
              <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
            </div>
          </div>
        </div>

        {/* Efficiency Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-accent" />
              Grid Return Efficiency
            </span>
            <span className="text-sm font-medium text-accent">
              {efficiencyRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={efficiencyRate} 
            className="h-2"
          />
        </div>

        {/* Vehicles Charging */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <Battery className="h-4 w-4 mr-2" />
            Vehicles Charging
          </span>
          <span className="text-sm font-medium">{depot.vehiclesCharging}</span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setAnalyticsOpen(true)}>
            <Activity className="h-4 w-4 mr-2" />
            Monitor
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Details
          </Button>
        </div>
      </CardContent>
      
      <DepotAnalytics 
        depot={depot}
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />
    </Card>
  );
};

export default DepotCard;