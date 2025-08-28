import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  onAddToCart?: (items: any[]) => void;
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
              <MapboxMap vehicles={vehicle ? [vehicle] : []} depots={[]} />
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

export const MaintenancePopup = ({ open, onOpenChange, vehicle, depots, onAddToCart }: MaintenancePopupProps) => {
  const [step, setStep] = useState<'select' | 'calendar' | 'confirm'>('select');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const getServiceDetails = (serviceType: string) => {
    const services = {
      routine: { name: "Routine Maintenance", icon: Wrench, duration: "2-3 hours", price: 500 },
      battery: { name: "Battery Check", icon: Battery, duration: "1 hour", price: 50 },
      safety: { name: "Safety Inspection", icon: Gauge, duration: "1-2 hours", price: 100 },
      "detailing-interior": { name: "Interior Detailing", icon: Sparkles, duration: "2-3 hours", price: 100 },
      "detailing-exterior": { name: "Exterior Detailing", icon: Sparkles, duration: "2-3 hours", price: 100 },
      "detailing-full": { name: "Full Interior/Exterior Detailing", icon: Sparkles, duration: "4-5 hours", price: 150 },
      "detailing-premium": { name: "Premium Detailing Package", icon: Sparkles, duration: "6-8 hours", price: 250 }
    };
    return services[serviceType as keyof typeof services];
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = getServiceDetails(serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const getSelectedDepot = () => depots.find(d => d.id === selectedDepot);

  const handleNext = () => {
    if (step === 'select' && selectedServices.length > 0 && selectedDepot) {
      setStep('calendar');
    } else if (step === 'calendar' && selectedDate && selectedTime) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'calendar') setStep('select');
    if (step === 'confirm') setStep('calendar');
  };

  const handleConfirm = () => {
    // Add items to cart if function is provided
    if (onAddToCart && vehicle) {
      const cartItems = selectedServices.map(serviceId => ({
        id: `${vehicle.id}-${serviceId}-${Date.now()}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        service: serviceId,
        serviceName: getServiceDetails(serviceId)?.name || serviceId,
        price: getServiceDetails(serviceId)?.price || 0,
        date: selectedDate?.toLocaleDateString(),
        time: selectedTime,
        depot: getSelectedDepot()?.name
      }));
      onAddToCart(cartItems);
    }
    
    onOpenChange(false);
    // Reset state
    setStep('select');
    setSelectedServices([]);
    setSelectedDepot("");
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setStep('select');
    setSelectedServices([]);
    setSelectedDepot("");
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center text-base sm:text-lg">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
            {step === 'select' && `Schedule Maintenance/Detailing for ${vehicle?.name}`}
            {step === 'calendar' && `Select Date & Time`}
            {step === 'confirm' && `Confirm Appointment`}
          </DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Select Service and Depot */}
        {step === 'select' && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Services (Multiple allowed)</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'routine', name: 'Routine Maintenance', icon: Wrench, price: 500 },
                    { id: 'battery', name: 'Battery Check', icon: Battery, price: 50 },
                    { id: 'safety', name: 'Safety Inspection', icon: Gauge, price: 100 },
                    { id: 'detailing-interior', name: 'Interior Detailing', icon: Sparkles, price: 100 },
                    { id: 'detailing-exterior', name: 'Exterior Detailing', icon: Sparkles, price: 100 },
                    { id: 'detailing-full', name: 'Full Interior/Exterior Detailing', icon: Sparkles, price: 150 },
                    { id: 'detailing-premium', name: 'Premium Detailing Package', icon: Sparkles, price: 250 }
                  ].map((service) => (
                    <div
                      key={service.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedServices.includes(service.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => toggleService(service.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {React.createElement(service.icon, { className: "h-4 w-4 mr-2" })}
                          <span className="font-medium text-sm">{service.name}</span>
                        </div>
                        <span className="font-semibold text-primary">${service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="text-lg font-bold text-primary">${getTotalPrice()}</span>
                    </div>
                  </div>
                )}
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
        )}

        {/* Step 2: Calendar and Time Selection */}
        {step === 'calendar' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Date</Label>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border pointer-events-auto"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </div>
              
              {selectedDate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Available Times</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Services:</h4>
                    {selectedServices.map(serviceId => (
                      <div key={serviceId} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                          {React.createElement(getServiceDetails(serviceId)?.icon || Wrench, { className: "h-4 w-4 mr-2" })}
                          <span className="font-medium">{getServiceDetails(serviceId)?.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${getServiceDetails(serviceId)?.price}</p>
                          <p className="text-sm text-muted-foreground">{getServiceDetails(serviceId)?.duration}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 font-bold text-lg border-t">
                      <span>Total:</span>
                      <span className="text-primary">${getTotalPrice()}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="font-medium">Location</span>
                  </div>
                  <span>{getSelectedDepot()?.name}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">Date</span>
                  </div>
                  <span>{selectedDate?.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">Time</span>
                  </div>
                  <span>{selectedTime}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sticky bottom-0 bg-background border-t -mx-6 -mb-6 px-6 pb-6">
          {step !== 'select' && (
            <Button 
              variant="outline" 
              className="w-full sm:flex-1 h-10" 
              onClick={handleBack}
            >
              Back
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full sm:flex-1 h-10" 
            onClick={handleClose}
          >
            Cancel
          </Button>
          
          {step === 'confirm' ? (
            <Button 
              className="w-full sm:flex-1 h-10"
              onClick={handleConfirm}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Confirm Appointment
            </Button>
          ) : (
            <Button 
              className="w-full sm:flex-1 h-10"
              disabled={
                (step === 'select' && (selectedServices.length === 0 || !selectedDepot)) ||
                (step === 'calendar' && (!selectedDate || !selectedTime))
              }
              onClick={handleNext}
            >
              {step === 'select' && (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Select Date & Time
                </>
              )}
              {step === 'calendar' && (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Review Appointment
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};