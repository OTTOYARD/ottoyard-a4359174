import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Battery, Zap, Wrench, MapPin, Activity, RefreshCw, Car, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import { OTTOQScheduleDialog } from "./OTTOQScheduleDialog";
import { VehicleHealthCard } from "./VehicleHealthCard";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
}

export const OTTOQFleetView = ({ selectedCityName }: OTTOQFleetViewProps) => {
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
                      className="hover:shadow-glow transition-all duration-300 border-border/50 futuristic-card"
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Vehicle Health Analysis - {selectedVehicle?.external_ref || selectedVehicle?.id.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            {healthLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : healthData?.health_score ? (
              <div className="space-y-4">
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preventive Maintenance:</span>
                        <span className="font-medium">${healthData.cost_projections.preventive_maintenance_cost}</span>
                      </div>
                      <div className="flex justify-between text-success">
                        <span>Potential Savings:</span>
                        <span className="font-medium">${healthData.cost_projections.potential_savings}</span>
                      </div>
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
