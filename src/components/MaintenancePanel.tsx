import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wrench, 
  ChevronDown, 
  Brain, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  AlertTriangle,
  Car,
  MapPin
} from "lucide-react";
import { OTTOQScheduleDialog } from "./OTTOQScheduleDialog";
import { OEMVehicleIcon } from "./OEMVehicleIcon";
import {
  predictiveMaintenanceData,
  autoScheduledQueue,
  upcomingMaintenance,
  upcomingDetailing,
  PredictedMaintenance,
  getServicePrice
} from "@/data/maintenance-mock";
import { toast } from "sonner";

import { CartItem } from "@/components/CartButton";

interface MaintenancePanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cityId: string;
  onAddToCart?: (items: CartItem[]) => void;
}

export function MaintenancePanel({ isOpen, onOpenChange, cityId, onAddToCart }: MaintenancePanelProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedVehicleForSchedule, setSelectedVehicleForSchedule] = useState<any>(null);
  const [manualVehicleId, setManualVehicleId] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("MAINTENANCE");

  const predictedCount = predictiveMaintenanceData.filter(p => !p.autoScheduled).length;
  const autoScheduledCount = autoScheduledQueue.length;

  const handleSchedulePredicted = (prediction: PredictedMaintenance) => {
    setSelectedVehicleForSchedule({
      id: prediction.vehicleId,
      external_ref: prediction.vehicleName,
      oem: prediction.oem,
      predictedService: prediction.predictedService
    });
    setSelectedServiceType(prediction.predictedService);
    setScheduleDialogOpen(true);
  };

  const handleManualSchedule = () => {
    if (manualVehicleId) {
      const vehicle = predictiveMaintenanceData.find(p => p.vehicleId === manualVehicleId);
      if (vehicle) {
        setSelectedVehicleForSchedule({
          id: vehicle.vehicleId,
          external_ref: vehicle.vehicleName,
          oem: vehicle.oem,
          predictedService: vehicle.predictedService
        });
        setSelectedServiceType(vehicle.predictedService);
        setScheduleDialogOpen(true);
      }
    }
  };

  const handleScheduleSuccess = () => {
    // Add to cart if callback provided
    if (onAddToCart && selectedVehicleForSchedule) {
      const price = getServicePrice(selectedServiceType);
      const cartItem: CartItem = {
        id: `maint-${Date.now()}`,
        vehicleId: selectedVehicleForSchedule.id,
        vehicleName: selectedVehicleForSchedule.external_ref || selectedVehicleForSchedule.id,
        service: selectedServiceType,
        serviceName: selectedServiceType,
        price: price,
        date: new Date().toLocaleDateString(),
        time: "Scheduled",
      };
      onAddToCart([cartItem]);
      toast.success(`Added to cart - $${price}`);
    }
    
    setScheduleDialogOpen(false);
    setSelectedVehicleForSchedule(null);
    toast.success("Scheduling complete! Service has been booked.");
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-warning";
    return "text-destructive";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-warning/20 text-warning border-warning/40">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-success/20 text-success border-success/40">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <Button
            className="w-full min-h-14 h-auto py-2 bg-gradient-to-r from-warning/80 to-primary/80 hover:from-warning hover:to-primary text-white font-semibold justify-between group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 items-start">
              <div className="flex items-center">
                <Wrench className="w-5 h-5 mr-2 shrink-0" />
                <span className="text-sm sm:text-base">Intelligent Maintenance</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:ml-3">
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {predictedCount} Predicted
                </Badge>
                <Badge className="bg-success/30 text-white border-0 text-xs">
                  {autoScheduledCount} Available
                </Badge>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4 animate-accordion-down">
          {/* AI Predictions Section */}
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Brain className="w-5 h-5 mr-2 text-warning" />
                AI Predictions
                <Sparkles className="w-4 h-4 ml-2 text-warning animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {predictiveMaintenanceData.map((prediction) => (
                    <Card 
                      key={prediction.id} 
                      className={`p-3 ${prediction.autoScheduled ? 'border-success/30 bg-success/5' : 'border-warning/30'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <OEMVehicleIcon name={prediction.oem} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{prediction.vehicleName}</p>
                            <p className="text-xs text-muted-foreground">{prediction.oem}</p>
                          </div>
                        </div>
                        {prediction.autoScheduled && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <p className="text-sm font-medium text-foreground">{prediction.predictedService}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className={`font-medium ${getConfidenceColor(prediction.confidenceScore)}`}>
                            {prediction.confidenceScore}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Health Score:</span>
                          <span className="font-medium">{prediction.healthScore}/100</span>
                        </div>
                      </div>

                      {prediction.autoScheduled ? (
                        <div className="text-xs p-2 bg-success/10 rounded border border-success/20">
                          <div className="flex items-center text-success mb-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Auto-Scheduled
                          </div>
                          <p className="text-muted-foreground">
                            {prediction.depotName} • {prediction.scheduledTime}
                          </p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-warning/40 text-warning hover:bg-warning/10"
                          onClick={() => handleSchedulePredicted(prediction)}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule Now
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Auto-Scheduled Queue */}
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Clock className="w-5 h-5 mr-2 text-success" />
                Auto-Scheduled Queue (OTTO-Q Algorithm)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {autoScheduledQueue.map((job) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50"
                    >
                      <div className="flex items-center space-x-3">
                        <OEMVehicleIcon name={job.oem} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{job.vehicleName}</p>
                          <p className="text-xs text-muted-foreground">{job.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.depot} • {job.bay}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={job.serviceType === "MAINTENANCE" 
                            ? "bg-warning/10 text-warning border-warning/30" 
                            : "bg-primary/10 text-primary border-primary/30"
                          }
                        >
                          {job.scheduledDate} @ {job.scheduledTime}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Manual Schedule Section */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Manual Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={manualVehicleId} onValueChange={setManualVehicleId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a vehicle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predictiveMaintenanceData.map((p) => (
                      <SelectItem key={p.vehicleId} value={p.vehicleId}>
                        <div className="flex items-center">
                          <Car className="w-4 h-4 mr-2" />
                          {p.vehicleName} ({p.oem})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleManualSchedule}
                  disabled={!manualVehicleId}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Schedule Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-warning" />
                  Upcoming Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {upcomingMaintenance.map((service) => (
                      <div 
                        key={service.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <div>
                            <p className="text-sm font-medium">{service.vehicleName}</p>
                            <p className="text-xs text-muted-foreground">{service.serviceType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">{service.scheduledDate}</p>
                          {getStatusBadge(service.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Upcoming Detailing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  Detailing Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {upcomingDetailing.map((service) => (
                      <div 
                        key={service.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{service.vehicleName}</p>
                            <p className="text-xs text-muted-foreground">{service.serviceType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">{service.scheduledDate}</p>
                          {getStatusBadge(service.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Schedule Dialog */}
      <OTTOQScheduleDialog
        vehicle={selectedVehicleForSchedule}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        cityId={cityId}
        onSuccess={handleScheduleSuccess}
      />
    </>
  );
}
