import { MapPin, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Vehicle {
  id: string;
  name: string;
  status: string;
  battery: number;
  location: { lat: number; lng: number };
  route: string;
}

interface FleetMapProps {
  vehicles: Vehicle[];
}

const FleetMap = ({ vehicles }: FleetMapProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success";
      case "charging":
        return "bg-warning animate-pulse-energy";
      case "maintenance":
        return "bg-destructive";
      default:
        return "bg-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "charging":
        return "Charging";
      case "maintenance":
        return "Maintenance";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="relative h-96 bg-gradient-subtle rounded-lg overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-muted/20">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="text-muted-foreground">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Vehicle Markers */}
      {vehicles.map((vehicle, index) => (
        <div
          key={vehicle.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-slide-up"
          style={{
            left: `${20 + index * 25}%`,
            top: `${30 + index * 15}%`,
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className="relative group cursor-pointer">
            {/* Vehicle Marker */}
            <div className={`w-4 h-4 rounded-full ${getStatusColor(vehicle.status)} border-2 border-white shadow-fleet-md`} />
            
            {/* Tooltip */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-card border border-border rounded-lg shadow-fleet-lg p-3 min-w-48">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-card-foreground">{vehicle.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(vehicle.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Navigation className="h-3 w-3 mr-1" />
                    {vehicle.route}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Battery:</span>
                    <span className={`font-medium ${vehicle.battery > 60 ? 'text-success' : vehicle.battery > 30 ? 'text-warning' : 'text-destructive'}`}>
                      {vehicle.battery}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
        <h5 className="text-sm font-medium text-card-foreground mb-2">Vehicle Status</h5>
        <div className="space-y-1">
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-success mr-2" />
            <span className="text-muted-foreground">Active</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-warning mr-2" />
            <span className="text-muted-foreground">Charging</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-destructive mr-2" />
            <span className="text-muted-foreground">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          San Francisco Bay Area
        </div>
      </div>
    </div>
  );
};

export default FleetMap;