import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import MapboxMap from "@/components/MapboxMap";
import { 
  Truck, 
  Battery, 
  MapPin, 
  Calendar as CalendarIcon,
  Wrench,
  Sparkles,
  Clock,
  Gauge,
  Thermometer,
  Zap,
  Navigation,
  Info
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

interface Depot {
  id: string;
  name: string;
  availableStalls: number;
  totalStalls: number;
  status: string;
}

interface AddVehiclePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TrackVehiclePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
}

interface VehicleDetailsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
}

interface MaintenancePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  depots: Depot[];
}

export const AddVehiclePopup = ({ open, onOpenChange }: AddVehiclePopupProps) => {
  const [formData, setFormData] = useState({
    vehicleId: "",
    model: "",
    status: "",
    initialRoute: ""
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2 text-primary" />
            Add New Vehicle
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle ID</Label>
            <Input 
              id="vehicleId"
              placeholder="Enter 5-digit alphanumeric ID"
              value={formData.vehicleId}
              onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
              maxLength={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Vehicle Model</Label>
            <Select onValueChange={(value) => setFormData({...formData, model: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waymo-one">Waymo One</SelectItem>
                <SelectItem value="tesla-model-y">Tesla Model Y</SelectItem>
                <SelectItem value="cruise-origin">Cruise Origin</SelectItem>
                <SelectItem value="zoox-robotaxi">Zoox Robotaxi</SelectItem>
                <SelectItem value="argo-ford">Argo AI Ford Fusion</SelectItem>
                <SelectItem value="motional-ioniq">Motional IONIQ 5</SelectItem>
                <SelectItem value="aurora-pacifica">Aurora Pacifica</SelectItem>
                <SelectItem value="nuro-r2">Nuro R2</SelectItem>
                <SelectItem value="aptiv-bmw">Aptiv BMW X5</SelectItem>
                <SelectItem value="baidu-apollo">Baidu Apollo RT6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="charging">Charging</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="route">Assign Route</Label>
            <Select onValueChange={(value) => setFormData({...formData, initialRoute: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="downtown">Downtown Delivery</SelectItem>
                <SelectItem value="warehouse-a">Warehouse Route A</SelectItem>
                <SelectItem value="port">Port Transfer</SelectItem>
                <SelectItem value="industrial-b">Industrial Zone B</SelectItem>
                <SelectItem value="ride-hail">General Ride-Hail Route</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1">
              Add Vehicle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const TrackVehiclePopup = ({ open, onOpenChange, vehicle }: TrackVehiclePopupProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Track {vehicle?.name}
          </DialogTitle>
        </DialogHeader>
        
        {vehicle && (
          <div className="space-y-4">
            <div className="h-40 bg-muted rounded-lg border overflow-hidden">
              <MapboxMap vehicles={vehicle ? [vehicle] : []} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Route</p>
                <p className="text-sm text-muted-foreground">{vehicle.route}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Speed</p>
                <p className="text-sm text-muted-foreground">45 mph</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">ETA</p>
                <p className="text-sm text-muted-foreground">2:15 PM</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Distance Remaining</p>
                <p className="text-sm text-muted-foreground">8.2 mi</p>
              </div>
            </div>
            
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Close Tracking
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const VehicleDetailsPopup = ({ open, onOpenChange, vehicle }: VehicleDetailsPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary" />
            {vehicle?.name} - Technical Details
          </DialogTitle>
        </DialogHeader>
        
        {vehicle && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Battery className="h-4 w-4 mr-2" />
                    Battery System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Charge Level</span>
                    <span className="text-sm font-medium">{vehicle.battery}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Capacity</span>
                    <span className="text-sm font-medium">85 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Temperature</span>
                    <span className="text-sm font-medium">28°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cycles</span>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Gauge className="h-4 w-4 mr-2" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Miles</span>
                    <span className="text-sm font-medium">{Math.floor(Math.random() * 50000 + 10000)} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Efficiency</span>
                    <span className="text-sm font-medium">4.2 mi/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max Speed</span>
                    <span className="text-sm font-medium">75 mph</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Load Capacity</span>
                    <span className="text-sm font-medium">2,400 lbs</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Thermometer className="h-4 w-4 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Badge className="bg-success/10 text-success border-success/20">Normal</Badge>
                    <p className="text-xs mt-1">Motor</p>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-success/10 text-success border-success/20">Normal</Badge>
                    <p className="text-xs mt-1">Brakes</p>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-warning/10 text-warning border-warning/20">Check</Badge>
                    <p className="text-xs mt-1">Tires</p>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-success/10 text-success border-success/20">Normal</Badge>
                    <p className="text-xs mt-1">Cooling</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Close Details
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const MaintenancePopup = ({ open, onOpenChange, vehicle, depots }: MaintenancePopupProps) => {
  
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDepot, setSelectedDepot] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center text-base sm:text-lg">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
            Schedule Maintenance for {vehicle?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Type</Label>
              <Select onValueChange={setSelectedService}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="routine">
                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 mr-2" />
                      Routine Maintenance
                    </div>
                  </SelectItem>
                  <SelectItem value="battery">
                    <div className="flex items-center">
                      <Battery className="h-4 w-4 mr-2" />
                      Battery Check
                    </div>
                  </SelectItem>
                  <SelectItem value="detailing">
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Interior/Exterior Detailing
                    </div>
                  </SelectItem>
                  <SelectItem value="inspection">
                    <div className="flex items-center">
                      <Gauge className="h-4 w-4 mr-2" />
                      Safety Inspection
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Depots</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {depots.slice(0, 4).map((depot) => (
                  <div 
                    key={depot.id} 
                    className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDepot === depot.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDepot(depot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{depot.name}</span>
                      <Badge className={depot.status === 'optimal' ? 'bg-success/10 text-success text-xs' : 'bg-warning/10 text-warning text-xs'}>
                        {depot.availableStalls} slots
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sticky bottom-0 bg-background border-t -mx-6 -mb-6 px-6 pb-6">
          <Button 
            variant="outline" 
            className="w-full sm:flex-1 h-10" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:flex-1 h-10"
            disabled={!selectedService || !selectedDepot}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Schedule Service
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};