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
      className={`min-h-32 futuristic-card hover-neon transition-all duration-300 ease-out hover-scale ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 hover:bg-gradient-to-br hover:from-card hover:to-primary/5 active:scale-95 hover:shadow-neon active:shadow-intense scanning-line' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl font-bold text-foreground neon-text leading-none">{value}</p>
              <div className={`flex items-center text-xs font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3 mr-0.5" />
                {change}
              </div>
            </div>
            {secondaryValue && (
              <div className="text-xs text-muted-foreground leading-snug break-words">
                <span className="font-medium">{secondaryLabel}:</span> {secondaryValue}
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg glow-soft shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsCard;