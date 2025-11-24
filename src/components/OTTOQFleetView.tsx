import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Battery, Zap, Wrench, MapPin, Activity, RefreshCw, Car, Calendar, Heart, Download } from "lucide-react";
import { toast } from "sonner";
import { OTTOQScheduleDialog } from "./OTTOQScheduleDialog";
import { VehicleHealthCard } from "./VehicleHealthCard";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Vehicle {
  id: string;
  external_ref: string;
  oem: string;
  vin: string | null;
  plate: string | null;
  soc: number;
  odometer_km: number;
  status: string;
  city: string;
  last_telemetry_at: string | null;
  assignment?: {
    job_id: string;
    job_type: string;
    state: string;
    depot: {
      id: string;
      name: string;
      address: string;
    };
    resource?: {
      type: string;
      index: number;
      label: string;
    };
    eta_seconds?: number;
    completion_at?: string;
    scheduled_start_at?: string;
  };
}

interface City {
  id: string;
  name: string;
  tz: string;
}

interface OTTOQFleetViewProps {
  selectedCityName?: string;
  highlightedVehicleId?: string | null;
}

export const OTTOQFleetView = ({ selectedCityName, highlightedVehicleId }: OTTOQFleetViewProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { loading: healthLoading, healthData, fetchHealthScore } = useVehicleHealth();

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCityName && cities.length > 0) {
      // Try exact match first, then case-insensitive partial match
      let city = cities.find(c => c.name === selectedCityName);
      if (!city) {
        city = cities.find(c => 
          c.name.toLowerCase().includes(selectedCityName.toLowerCase()) ||
          selectedCityName.toLowerCase().includes(c.name.toLowerCase())
        );
      }
      if (city) {
        console.log('OTTO-Q FleetView: Syncing to city:', city.name, 'from prop:', selectedCityName);
        setSelectedCity(city.id);
      } else {
        console.warn('OTTO-Q FleetView: No matching city found for:', selectedCityName, 'Available cities:', cities.map(c => c.name));
      }
    }
  }, [selectedCityName, cities]);

  useEffect(() => {
    if (selectedCity) {
      fetchVehiclesForCity(selectedCity);
    }
  }, [selectedCity]);

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("ottoq_cities")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load cities");
      return;
    }

    setCities(data || []);
    if (data && data.length > 0) {
      setSelectedCity(data[0].id);
    }
  };

  const fetchVehiclesForCity = async (cityId: string) => {
    setLoading(true);
    try {
      // Fetch with random ordering to show mix of OEMs
      const { data: vehiclesData, error } = await supabase.rpc('get_random_vehicles_for_city', {
        p_city_id: cityId,
        p_limit: 50
      });

      if (error) throw error;

      // Fetch status for each vehicle with cache busting
      const vehiclesWithStatus = await Promise.all(
        (vehiclesData || []).map(async (v) => {
          try {
            const { data: statusData } = await supabase.functions.invoke(
              `ottoq-vehicles-status/${v.id}?t=${Date.now()}`,
              { method: "GET" }
            );

            return {
              id: v.id,
              external_ref: v.external_ref,
              oem: v.oem,
              vin: v.vin,
              plate: v.plate,
              soc: v.soc,
              odometer_km: v.odometer_km,
              status: v.status,
              last_telemetry_at: v.last_telemetry_at,
              city: v.city_name || "Unknown",
              assignment: statusData?.assignment || null,
            };
          } catch (err) {
            return {
              id: v.id,
              external_ref: v.external_ref,
              oem: v.oem,
              vin: v.vin,
              plate: v.plate,
              soc: v.soc,
              odometer_km: v.odometer_km,
              status: v.status,
              last_telemetry_at: v.last_telemetry_at,
              city: v.city_name || "Unknown",
              assignment: null,
            };
          }
        })
      );

      // Already limited to 50 from the function
      setVehicles(vehiclesWithStatus);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedCity) {
      setRefreshing(true);
      await fetchVehiclesForCity(selectedCity);
      setRefreshing(false);
      toast.success("Fleet data refreshed");
    }
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    if (vehicle.assignment) {
      const { state, job_type } = vehicle.assignment;
      
      if (state === "ACTIVE") {
        if (job_type === "CHARGE") {
          return (
            <Badge className="bg-energy-grid/20 text-energy-grid border-energy-grid/40">
              <Zap className="w-3 h-3 mr-1" />
              Charging
            </Badge>
          );
        } else if (job_type === "MAINTENANCE") {
          return (
            <Badge className="bg-warning/20 text-warning border-warning/40">
              <Wrench className="w-3 h-3 mr-1" />
              In Maintenance
            </Badge>
          );
        }
        return (
          <Badge className="bg-primary/20 text-primary border-primary/40">
            <Activity className="w-3 h-3 mr-1" />
            {job_type}
          </Badge>
        );
      } else if (state === "SCHEDULED") {
        return (
          <Badge className="bg-muted/20 text-muted-foreground border-muted/40">
            <MapPin className="w-3 h-3 mr-1" />
            En Route
          </Badge>
        );
      }
    }

    if (vehicle.status === "IDLE") {
      return (
        <Badge variant="outline" className="border-success/40 text-success">
          Available
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-muted-foreground">
        {vehicle.status}
      </Badge>
    );
  };

  const getBatteryColor = (soc: number) => {
    if (soc >= 0.8) return "text-success";
    if (soc >= 0.5) return "text-warning";
    return "text-destructive";
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleScheduleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setScheduleDialogOpen(true);
  };

  const handleScheduleSuccess = () => {
    // Refresh vehicles after successful scheduling
    if (selectedCity) {
      fetchVehiclesForCity(selectedCity);
    }
  };

  const handleHealthClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setHealthDialogOpen(true);
    await fetchHealthScore(vehicle.id);
  };

  const handleExportHealthReport = () => {
    if (!healthData?.health_score || !selectedVehicle) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("OTTO-Q Vehicle Health Report", pageWidth / 2, 20, { align: "center" });
    
    // Vehicle Info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const vehicleInfo = `Vehicle: ${selectedVehicle.external_ref || selectedVehicle.id.slice(0, 8)} | ${selectedVehicle.oem || "Unknown OEM"}`;
    doc.text(vehicleInfo, pageWidth / 2, 30, { align: "center" });
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: "center" });
    
    // Overall Health Score
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Overall Health Score", 14, 50);
    
    doc.setFontSize(32);
    const scoreColor = healthData.health_score.overall_score >= 90 ? [34, 197, 94] :
                       healthData.health_score.overall_score >= 75 ? [34, 197, 94] :
                       healthData.health_score.overall_score >= 60 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${healthData.health_score.overall_score}`, 14, 65);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Status: ${healthData.health_score.status.toUpperCase()}`, 14, 72);
    
    // Active Alerts Section
    let yPosition = 85;
    if (healthData.health_score.alerts.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Active Alerts", 14, yPosition);
      yPosition += 7;
      
      const alertsData = healthData.health_score.alerts.map(alert => [
        alert.component,
        alert.severity.toUpperCase(),
        alert.message
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [["Component", "Severity", "Message"]],
        body: alertsData,
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 'auto' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Component Health Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Component Health Details", 14, yPosition);
    yPosition += 7;
    
    const componentsData = healthData.health_score.components.map(comp => [
      comp.component,
      `${comp.score}%`,
      comp.status.toUpperCase(),
      comp.trend.toUpperCase(),
      comp.next_service_km ? `${comp.next_service_km.toLocaleString()} km` : "N/A"
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [["Component", "Score", "Status", "Trend", "Next Service"]],
      body: componentsData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Cost Projections Section
    if (healthData.cost_projections && yPosition < 250) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Cost Projections", 14, yPosition);
      yPosition += 7;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Estimated Cost: $${healthData.cost_projections.total_estimated_cost}`, 14, yPosition);
      yPosition += 7;
      
      if (healthData.cost_projections.breakdown) {
        const breakdownData = Object.entries(healthData.cost_projections.breakdown).map(([key, value]) => [
          key,
          `$${value}`
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [["Item", "Cost"]],
          body: breakdownData,
          theme: "plain",
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 'auto', halign: 'right' }
          }
        });
      }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by OTTO-Q Fleet Management System", pageWidth / 2, 285, { align: "center" });
    
    // Save the PDF
    const fileName = `health-report-${selectedVehicle.external_ref || selectedVehicle.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success("Health report exported successfully");
  };

  const currentCity = cities.find(c => c.id === selectedCity);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OTTO-Q Fleet - {currentCity?.name || ''}</h2>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} vehicles
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {selectedCity && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {vehicles.map((vehicle) => (
                    <Card
                      key={vehicle.id}
                      id={`vehicle-${vehicle.id}`}
                      className={`hover:shadow-glow transition-all duration-500 border-border/50 futuristic-card ${
                        highlightedVehicleId === vehicle.id ? 'ring-4 ring-primary shadow-fleet-xl bg-primary/5' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Car className="w-5 h-5 text-primary" />
                            <CardTitle className="text-base">
                              {vehicle.external_ref || vehicle.id.slice(0, 8)}
                            </CardTitle>
                          </div>
                          {getStatusBadge(vehicle)}
                        </div>
                        {vehicle.oem && (
                          <p className="text-xs text-muted-foreground">{vehicle.oem}</p>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Battery Level */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                              <Battery className="w-4 h-4 mr-1" />
                              Battery
                            </span>
                            <span className={`font-medium ${getBatteryColor(vehicle.soc)}`}>
                              {Math.round(vehicle.soc * 100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                vehicle.soc >= 0.8
                                  ? "bg-success"
                                  : vehicle.soc >= 0.5
                                  ? "bg-warning"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${vehicle.soc * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Assignment Info */}
                        {vehicle.assignment && (
                          <div className="p-3 rounded-lg bg-muted/30 space-y-2 border border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                Location
                              </span>
                              <span className="text-xs font-medium">
                                {vehicle.assignment.depot.name}
                              </span>
                            </div>

                            {vehicle.assignment.resource && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Position
                                </span>
                                <span className="text-xs font-medium">
                                  {vehicle.assignment.resource.label}
                                </span>
                              </div>
                            )}

                            {vehicle.assignment.state === "ACTIVE" &&
                              vehicle.assignment.eta_seconds && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Time Remaining
                                  </span>
                                  <span className="text-xs font-medium text-primary">
                                    {formatTimeRemaining(vehicle.assignment.eta_seconds)}
                                  </span>
                                </div>
                              )}

                            {vehicle.assignment.state === "SCHEDULED" && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Status
                                </span>
                                <span className="text-xs font-medium text-warning">
                                  En Route to Depot
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vehicle Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {vehicle.plate && (
                            <div>
                              <span className="text-muted-foreground">Plate:</span>
                              <span className="ml-1 font-medium">{vehicle.plate}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">ODO:</span>
                            <span className="ml-1 font-medium">
                              {vehicle.odometer_km.toLocaleString()} km
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHealthClick(vehicle)}
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Health
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleScheduleClick(vehicle)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Schedule Dialog */}
        <OTTOQScheduleDialog
          vehicle={selectedVehicle}
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          cityId={selectedCity}
          onSuccess={handleScheduleSuccess}
        />

        {/* Health Score Dialog */}
        <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  Vehicle Health Analysis - {selectedVehicle?.external_ref || selectedVehicle?.id.slice(0, 8)}
                </DialogTitle>
                {healthData?.health_score && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportHealthReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                )}
              </div>
            </DialogHeader>
            {healthLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : healthData?.health_score ? (
              <div className="space-y-4 pb-4">
                <VehicleHealthCard
                  overallScore={healthData.health_score.overall_score}
                  status={healthData.health_score.status}
                  components={healthData.health_score.components}
                  alerts={healthData.health_score.alerts}
                />
                
                {/* Cost Projections */}
                {healthData.cost_projections && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cost Projections</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Estimated Cost:</span>
                        <span className="font-medium">${healthData.cost_projections.total_estimated_cost}</span>
                      </div>
                      {healthData.cost_projections.breakdown && (
                        <div className="space-y-1 mt-3">
                          <p className="text-xs text-muted-foreground font-medium">Breakdown:</p>
                          {Object.entries(healthData.cost_projections.breakdown).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs pl-3">
                              <span className="text-muted-foreground">{key}:</span>
                              <span>${value as number}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No health data available
              </p>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
};
