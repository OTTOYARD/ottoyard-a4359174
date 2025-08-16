import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Battery, 
  MapPin, 
  Clock, 
  Calendar,
  MoreVertical,
  Zap,
  Navigation
} from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  status: string;
  battery: number;
  location: { lat: number; lng: number };
  route: string;
  chargingTime: string;
  nextMaintenance: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  compact?: boolean;
}

const VehicleCard = ({ vehicle, compact = false }: VehicleCardProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "charging":
        return "secondary";
      case "maintenance":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "charging":
        return "bg-warning/10 text-warning border-warning/20";
      case "maintenance":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-secondary/10 text-secondary border-secondary/20";
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return "text-success";
    if (battery > 30) return "text-warning";
    return "text-destructive";
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${vehicle.status === 'active' ? 'bg-success' : vehicle.status === 'charging' ? 'bg-warning animate-pulse-energy' : 'bg-destructive'}`} />
            <span className="font-medium text-card-foreground">{vehicle.name}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Battery className={`h-4 w-4 ${getBatteryColor(vehicle.battery)}`} />
          <span className={`text-sm font-medium ${getBatteryColor(vehicle.battery)}`}>
            {vehicle.battery}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-fleet-md hover:shadow-fleet-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{vehicle.name}</CardTitle>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor(vehicle.status)}>
            {vehicle.status === "active" && "Active"}
            {vehicle.status === "charging" && (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Charging
              </>
            )}
            {vehicle.status === "maintenance" && "Maintenance"}
          </Badge>
          <span className="text-sm text-muted-foreground">{vehicle.id}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Battery Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <Battery className={`h-4 w-4 mr-2 ${getBatteryColor(vehicle.battery)}`} />
              Battery Level
            </span>
            <span className={`text-sm font-medium ${getBatteryColor(vehicle.battery)}`}>
              {vehicle.battery}%
            </span>
          </div>
          <Progress 
            value={vehicle.battery} 
            className="h-2"
          />
        </div>

        {/* Route */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <Navigation className="h-4 w-4 mr-2" />
            Current Route
          </span>
          <span className="text-sm font-medium">{vehicle.route}</span>
        </div>

        {/* Charging Time */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {vehicle.status === "charging" ? "Charging Time" : "Last Charge"}
          </span>
          <span className="text-sm font-medium">{vehicle.chargingTime}</span>
        </div>

        {/* Next Maintenance */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Next Maintenance
          </span>
          <span className="text-sm font-medium">{vehicle.nextMaintenance}</span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            Track
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;