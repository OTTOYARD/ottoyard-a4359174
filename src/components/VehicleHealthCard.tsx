import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Activity, TrendingDown, TrendingUp } from "lucide-react";

interface ComponentHealth {
  component: string;
  score: number;
  status: string;
  trend: string;
  next_service_km: number | null;
}

interface HealthAlert {
  component: string;
  severity: string;
  message: string;
}

interface VehicleHealthCardProps {
  overallScore: number;
  status: string;
  components: ComponentHealth[];
  alerts: HealthAlert[];
}

export const VehicleHealthCard = ({ overallScore, status, components, alerts }: VehicleHealthCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-success/80";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-destructive/80";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-success";
    if (score >= 75) return "bg-success/80";
    if (score >= 60) return "bg-warning";
    if (score >= 40) return "bg-destructive/80";
    return "bg-destructive";
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      excellent: "bg-success/10 text-success border-success/20",
      good: "bg-success/10 text-success/80 border-success/20",
      fair: "bg-warning/10 text-warning border-warning/20",
      poor: "bg-destructive/10 text-destructive/80 border-destructive/20",
      critical: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return colors[status as keyof typeof colors] || colors.good;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'stable') return <Activity className="w-3 h-3" />;
    if (trend === 'declining') return <TrendingDown className="w-3 h-3 text-warning" />;
    return <TrendingDown className="w-3 h-3 text-destructive" />;
  };

  return (
    <Card className="shadow-fleet-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Vehicle Health Score</CardTitle>
          <Badge variant="outline" className={getStatusBadge(status)}>
            {status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallScore / 100) * 351.86} 351.86`}
                className={getScoreColor(overallScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-xs text-muted-foreground">Overall</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Active Alerts</span>
            </div>
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-destructive/10 border-destructive/20'
                    : 'bg-warning/10 border-warning/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{alert.component}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      alert.severity === 'critical'
                        ? 'bg-destructive/10 text-destructive border-destructive/40'
                        : 'bg-warning/10 text-warning border-warning/40'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Component Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Component Health</p>
          {components.map((comp, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">{comp.component}</span>
                  {getTrendIcon(comp.trend)}
                </div>
                <span className={`font-medium ${getScoreColor(comp.score)}`}>
                  {comp.score}%
                </span>
              </div>
              <Progress
                value={comp.score}
                className="h-1.5"
              />
              {comp.next_service_km && (
                <p className="text-xs text-muted-foreground">
                  Next service: {comp.next_service_km.toLocaleString()} km
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
