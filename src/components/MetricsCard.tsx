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
      className={`h-32 futuristic-card hover-neon pulse-border transition-all duration-300 ease-out hover-scale ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 hover:bg-gradient-to-br hover:from-card hover:to-primary/5 active:scale-95 hover:shadow-neon active:shadow-intense scanning-line' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between h-full">
          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-foreground leading-tight">{title}</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-foreground neon-text animate-cyber-fade">{value}</p>
              <div className={`flex items-center text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3 mr-1 animate-float" />
                {change}
              </div>
            </div>
            {secondaryValue && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{secondaryLabel}:</span> {secondaryValue}
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg glow-soft pulse-glow">
            <Icon className="h-6 w-6 text-primary animate-glow-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsCard;