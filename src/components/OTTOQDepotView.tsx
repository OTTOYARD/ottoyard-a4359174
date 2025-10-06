import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Zap, RefreshCw, Battery, Wrench, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  type: string;
  index: number;
  status: string;
  label: string;
  job_id: string | null;
}

interface DepotResources {
  depot_id: string;
  depot_name: string;
  city: string;
  branding: string;
  resources: Resource[];
  updated_at: string;
}

interface City {
  id: string;
  name: string;
  tz: string;
}

interface Depot {
  id: string;
  name: string;
  city_id: string;
  address: string | null;
}

interface OTTOQDepotViewProps {
  selectedCityName?: string;
}

export const OTTOQDepotView = ({ selectedCityName }: OTTOQDepotViewProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>("");
  const [depotResources, setDepotResources] = useState<DepotResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCityName && cities.length > 0) {
      const city = cities.find(c => c.name === selectedCityName);
      if (city) {
        setSelectedCity(city.id);
      }
    }
  }, [selectedCityName, cities]);

  useEffect(() => {
    if (selectedCity) {
      fetchDepotsForCity(selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDepot) {
      fetchDepotResources(selectedDepot);
    }
  }, [selectedDepot]);

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

  const fetchDepotsForCity = async (cityId: string) => {
    const { data, error } = await supabase
      .from("ottoq_depots")
      .select("*")
      .eq("city_id", cityId)
      .order("name");

    if (error) {
      toast.error("Failed to load depots");
      return;
    }

    setDepots(data || []);
    if (data && data.length > 0) {
      setSelectedDepot(data[0].id);
    }
  };

  const fetchDepotResources = async (depotId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `ottoq-depots-resources/${depotId}`,
        { method: "GET" }
      );

      if (error) throw error;
      setDepotResources(data);
    } catch (error) {
      console.error("Error fetching depot resources:", error);
      toast.error("Failed to load depot resources");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedDepot) {
      setRefreshing(true);
      await fetchDepotResources(selectedDepot);
      setRefreshing(false);
      toast.success("Depot data refreshed");
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "CHARGE_STALL":
        return <Zap className="w-4 h-4" />;
      case "MAINTENANCE_BAY":
        return <Wrench className="w-4 h-4" />;
      case "CLEAN_DETAIL_STALL":
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Battery className="w-4 h-4" />;
    }
  };

  const getResourceColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "border-success/40 bg-success/5 text-success";
      case "OCCUPIED":
        return "border-primary/40 bg-primary/5 text-primary";
      case "OUT_OF_SERVICE":
        return "border-destructive/40 bg-destructive/5 text-destructive";
      default:
        return "border-muted/40 bg-muted/5 text-muted-foreground";
    }
  };

  const groupResourcesByType = (resources: Resource[]) => {
    const groups: { [key: string]: Resource[] } = {};
    resources.forEach((resource) => {
      if (!groups[resource.type]) {
        groups[resource.type] = [];
      }
      groups[resource.type].push(resource);
    });
    return groups;
  };

  const getResourceTypeName = (type: string) => {
    switch (type) {
      case "CHARGE_STALL":
        return "Charging Stalls";
      case "MAINTENANCE_BAY":
        return "Maintenance Bays";
      case "CLEAN_DETAIL_STALL":
        return "Clean & Detail Stalls";
      default:
        return type;
    }
  };

  const currentCity = cities.find(c => c.id === selectedCity);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OTTOYARD Depots - {currentCity?.name || ''}</h2>
          <p className="text-sm text-muted-foreground">
            Real-time depot resource monitoring
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
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {depots.map((depot) => (
                <Button
                  key={depot.id}
                  variant={selectedDepot === depot.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepot(depot.id)}
                  className="whitespace-nowrap"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {depot.name}
                </Button>
              ))}
            </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : depotResources ? (
            <div className="space-y-6">
                <Card className="futuristic-card border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-primary" />
                        {depotResources.depot_name}
                      </CardTitle>
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        {depotResources.city}
                      </Badge>
                    </div>
                    {depotResources.branding && (
                      <p className="text-xs text-muted-foreground italic">
                        {depotResources.branding}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="text-2xl font-bold text-success">
                          {
                            depotResources.resources.filter(
                              (r) => r.status === "AVAILABLE"
                            ).length
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Available</div>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="text-2xl font-bold text-primary">
                          {
                            depotResources.resources.filter(
                              (r) => r.status === "OCCUPIED"
                            ).length
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Occupied</div>
                      </div>
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="text-2xl font-bold text-destructive">
                          {
                            depotResources.resources.filter(
                              (r) => r.status === "OUT_OF_SERVICE"
                            ).length
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Out of Service
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-6 pr-4">
                    {Object.entries(groupResourcesByType(depotResources.resources)).map(
                      ([type, resources]) => (
                        <Card key={type} className="futuristic-card">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              {getResourceIcon(type)}
                              <span className="ml-2">{getResourceTypeName(type)}</span>
                              <Badge variant="outline" className="ml-auto">
                                {resources.length} Total
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {resources.map((resource) => (
                                <div
                                  key={`${resource.type}-${resource.index}`}
                                  className={`p-3 rounded-lg border transition-all ${getResourceColor(
                                    resource.status
                                  )} ${
                                    resource.status === "OCCUPIED"
                                      ? "pulse-border"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">
                                      {resource.type === "CHARGE_STALL"
                                        ? `Stall ${resource.index}`
                                        : resource.type === "MAINTENANCE_BAY"
                                        ? `Bay ${resource.index}`
                                        : `Stall ${resource.index}`}
                                    </span>
                                    {getResourceIcon(resource.type)}
                                  </div>
                                  <div className="text-xs">
                                    {resource.status === "AVAILABLE" ? (
                                      <span className="text-success font-medium">
                                        Available
                                      </span>
                                    ) : resource.status === "OUT_OF_SERVICE" ? (
                                      <span className="text-destructive font-medium">
                                        Out of Service
                                      </span>
                                    ) : (
                                      <div className="space-y-1">
                                        <div className="font-medium line-clamp-2">
                                          {resource.label}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
              </ScrollArea>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
