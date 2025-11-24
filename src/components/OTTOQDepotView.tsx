import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Zap, RefreshCw, Battery, Wrench, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { EnergyAnalyticsCard } from "./EnergyAnalyticsCard";

interface Resource {
  type: string;
  index: number;
  status: string;
  label: string;
  job_id: string | null;
}

interface EnergyAnalytics {
  energyConsumed: number;
  energyRegenerated: number;
  efficiency: number;
  peakDemand: number;
  carbonOffset: number;
}

interface DepotResources {
  depot_id: string;
  depot_name: string;
  city: string;
  branding: string;
  resources: Resource[];
  energyAnalytics: EnergyAnalytics;
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
  highlightedDepotId?: string | null;
}

export const OTTOQDepotView = ({ selectedCityName, highlightedDepotId }: OTTOQDepotViewProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>("");
  const [depotResources, setDepotResources] = useState<DepotResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

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
        console.log('OTTO-Q DepotView: Syncing to city:', city.name, 'from prop:', selectedCityName);
        setSelectedCity(city.id);
      } else {
        console.warn('OTTO-Q DepotView: No matching city found for:', selectedCityName, 'Available cities:', cities.map(c => c.name));
      }
    }
  }, [selectedCityName, cities]);

  useEffect(() => {
    if (selectedCity) {
      // Clear depot selection and resources when city changes
      setSelectedDepot("");
      setDepotResources(null);
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

  const toggleCategory = (type: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const INITIAL_DISPLAY_COUNT = 8;

  const currentCity = cities.find(c => c.id === selectedCity);
  const currentDepot = depots.find(d => d.id === selectedDepot);

  return (
    <div className="space-y-4">
      {selectedCity && (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                {depots.map((depot) => (
                  <Button
                    key={depot.id}
                    id={`depot-${depot.id}`}
                    variant={selectedDepot === depot.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDepot(depot.id)}
                    className={`whitespace-nowrap transition-all duration-500 ${
                      highlightedDepotId === depot.id ? 'ring-4 ring-primary shadow-lg' : ''
                    }`}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    {depot.name}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : depotResources ? (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="futuristic-card border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                          <Building2 className="w-5 h-5 mr-2 text-primary" />
                          {currentDepot?.name || depotResources.depot_name}
                        </CardTitle>
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          {currentCity?.name || depotResources.city}
                        </Badge>
                      </div>
                      {depotResources.branding && (
                        <p className="text-xs text-muted-foreground italic">
                          {depotResources.branding}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 rounded-lg bg-success/10 border border-success/20">
                          <div className="text-xl font-bold text-success">
                            {
                              depotResources.resources.filter(
                                (r) => r.status === "AVAILABLE"
                              ).length
                            }
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">Available</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="text-xl font-bold text-primary">
                            {
                              depotResources.resources.filter(
                                (r) => r.status === "OCCUPIED"
                              ).length
                            }
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">Occupied</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                          <div className="text-xl font-bold text-destructive">
                            {
                              depotResources.resources.filter(
                                (r) => r.status === "OUT_OF_SERVICE"
                              ).length
                            }
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Out of Service
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <EnergyAnalyticsCard data={depotResources.energyAnalytics} />
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    <Accordion type="multiple" className="space-y-4">
                      {Object.entries(groupResourcesByType(depotResources.resources)).map(
                        ([type, resources]) => {
                          const isExpanded = expandedCategories[type];
                          const displayedResources = isExpanded ? resources : resources.slice(0, INITIAL_DISPLAY_COUNT);
                          const hasMore = resources.length > INITIAL_DISPLAY_COUNT;
                          const availableCount = resources.filter(r => r.status === "AVAILABLE").length;
                          const occupiedCount = resources.filter(r => r.status === "OCCUPIED").length;

                          return (
                            <AccordionItem key={type} value={type} className="border-none">
                              <Card className="futuristic-card">
                                <AccordionTrigger className="hover:no-underline px-6 py-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-4 gap-2">
                                    <div className="flex items-center gap-2">
                                      {getResourceIcon(type)}
                                      <span className="text-sm sm:text-base font-semibold">{getResourceTypeName(type)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="border-success/40 text-success text-xs">
                                        {availableCount} Available
                                      </Badge>
                                      <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                                        {occupiedCount} Occupied
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {resources.length} Total
                                      </Badge>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                      {displayedResources.map((resource) => (
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
                                          <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="font-medium text-xs">
                                              {resource.type === "CHARGE_STALL"
                                                ? `Stall ${resource.index}`
                                                : resource.type === "MAINTENANCE_BAY"
                                                ? `Bay ${resource.index}`
                                                : `Stall ${resource.index}`}
                                            </span>
                                            <span className="flex-shrink-0">{getResourceIcon(resource.type)}</span>
                                          </div>
                                           <div className="text-[10px] leading-tight">
                                             {resource.status === "AVAILABLE" ? (
                                               <span className="text-success font-medium">
                                                 Available
                                               </span>
                                             ) : resource.status === "OUT_OF_SERVICE" ? (
                                               <span className="text-destructive font-medium">
                                                 Out of Service
                                               </span>
                                             ) : (
                                               <div className="space-y-0.5">
                                                 <div className="font-medium break-words">
                                                   {resource.label}
                                                 </div>
                                               </div>
                                             )}
                                           </div>
                                        </div>
                                      ))}
                                    </div>
                                    {hasMore && (
                                      <div className="mt-4 flex justify-center">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => toggleCategory(type)}
                                          className="w-full sm:w-auto"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <ChevronDown className="w-4 h-4 mr-2 rotate-180" />
                                              Show Less
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown className="w-4 h-4 mr-2" />
                                              Show More ({resources.length - INITIAL_DISPLAY_COUNT} more)
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </CardContent>
                                </AccordionContent>
                              </Card>
                            </AccordionItem>
                          );
                        }
                      )}
                    </Accordion>
                  </div>
              </ScrollArea>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
