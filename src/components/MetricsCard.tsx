import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  onClick?: () => void;
  secondaryValue?: string;
  secondaryLabel?: string;
}

const MetricsCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  onClick,
  secondaryValue,
  secondaryLabel
}: MetricsCardProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend === "up" ? "text-success" : "text-destructive";
  
  return (
    <Card 
      className={`shadow-fleet-sm hover:shadow-fleet-md transition-shadow duration-200 ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <div className={`flex items-center text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {change}
              </div>
            </div>
            {secondaryValue && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{secondaryLabel}:</span> {secondaryValue}
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsCard;