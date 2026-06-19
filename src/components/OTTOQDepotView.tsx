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
import { ottoQFetch, ottoqInvoke } from "@/lib/otto-q-api";
import { Building2, Zap, RefreshCw, Battery, Wrench, Sparkles, ChevronDown, ParkingCircle } from "lucide-react";
import { toast } from "sonner";
import { EnergyAnalyticsCard } from "./EnergyAnalyticsCard";

const DEFAULT_DEPOT_ID = "11111111-1111-1111-1111-111111111111";

// Map otto-q-core resource.kind -> the legacy uppercase resource "type"
// the grouping/render keys off.
function mapKindToType(kind: string | null, connector: string | null): string {
  const k = (kind || "").toLowerCase();
  if (k.includes("wash") || k.includes("detail") || k.includes("clean")) return "CLEAN_DETAIL_STALL";
  if (k.includes("service") || k.includes("maint")) return "MAINTENANCE_BAY";
  if (k.includes("stag") || k.includes("park") || k.includes("await")) return "STAGING_STALL";
  return "CHARGE_STALL";
}

// Map otto-q-core resource.status -> legacy uppercase status vocab.
function mapStatusToLegacy(status: string | null, occupantId: string | null): string {
  const s = (status || "").toLowerCase();
  if (s.includes("maint") || s.includes("out_of_service") || s.includes("offline") || s.includes("fault")) return "OUT_OF_SERVICE";
  if (s.includes("reserv")) return "RESERVED";
  if (s.includes("occup") || s.includes("busy") || s.includes("charg") || s.includes("in_use") || occupantId) return "OCCUPIED";
  return "AVAILABLE";
}

function indexFromCode(code: string | null, fallback: number): number {
  if (!code) return fallback;
  const m = String(code).match(/(\d+)/);
  return m ? Number(m[1]) : fallback;
}


interface Resource {
  id: string;
  type: string;
  index: number;
  status: string;
  label: string;
  job_id: string | null;
  vehicle_id?: string;
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

  // Sync to the parent dashboard's city prop. selectedCity holds the city name.
  useEffect(() => {
    if (selectedCityName) {
      setSelectedCity(selectedCityName);
    }
  }, [selectedCityName]);

  // Load depots from the shared brain fleet summary, grouped by the selected city.
  useEffect(() => {
    // Clear depot selection and resources when city changes
    setSelectedDepot("");
    setDepotResources(null);
    fetchDepotsForCity(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDepot) {
      fetchDepotResources(selectedDepot);
    }
  }, [selectedDepot]);

  const fetchDepotsForCity = async (cityName: string) => {
    try {
      const summary: any = await ottoQFetch("/fleet/summary");
      const allDepots: any[] = summary?.depots ?? [];

      // Build the city dropdown list from the summary's depots
      const cityNames = Array.from(
        new Set(allDepots.map((d) => String(d.city || "")).filter(Boolean))
      ).sort();
      setCities(cityNames.map((n) => ({ id: n, name: n, tz: "" })));

      const cityDepots = allDepots.filter(
        (d) => !cityName || String(d.city || "").toLowerCase() === cityName.toLowerCase()
      );
      const mapped: Depot[] = cityDepots.map((d) => ({
        id: d.id,
        name: d.name,
        city_id: d.city || "",
        address: d.state || null,
      }));

      setDepots(mapped);
      if (mapped.length > 0) {
        setSelectedDepot(mapped[0].id);
      }
    } catch (error) {
      console.error("Error fetching depots:", error);
      toast.error("Failed to load depots");
    }
  };

  const fetchDepotResources = async (depotId: string) => {
    setLoading(true);
    try {
      const resp: any = await ottoqInvoke("ottoq-depot-resources", {
        depot_id: depotId || DEFAULT_DEPOT_ID,
      });
      const rawResources: any[] = resp?.resources ?? [];
      const resources: Resource[] = rawResources.map((r, i) => {
        const occupantId: string | null = r.occupant_vehicle_id ?? null;
        const occupantLabel: string =
          (r.occupant && (r.occupant.display_name || r.occupant.vin)) ||
          occupantId ||
          "Occupied";
        return {
          id: r.id,
          type: mapKindToType(r.kind, r.connector_type),
          index: indexFromCode(r.stall_code ?? r.name, i + 1),
          status: mapStatusToLegacy(r.status, occupantId),
          label: occupantLabel,
          job_id: occupantId,
          vehicle_id: occupantId ?? undefined,
        };
      });

      // otto-q-core depot-resources has no energy series; derive a lightweight
      // placeholder from resource occupancy so EnergyAnalyticsCard renders.
      const occupied = resources.filter(
        (r) => r.status === "OCCUPIED" || r.status === "RESERVED"
      ).length;
      const energyConsumed = occupied * 120;
      const energyRegenerated = Math.round(energyConsumed * 0.18);
      const energyAnalytics: EnergyAnalytics = {
        energyConsumed,
        energyRegenerated,
        efficiency: energyConsumed > 0 ? Math.round((energyRegenerated / energyConsumed) * 100) : 0,
        peakDemand: occupied * 75,
        carbonOffset: Math.round(energyRegenerated * 0.4),
      };

      const depot = resp?.depot ?? {};
      setDepotResources({
        depot_id: depot.id || depotId,
        depot_name: depot.name || "",
        city: depot.city || "",
        branding: "",
        resources,
        energyAnalytics,
        updated_at: new Date().toISOString(),
      });
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
      case "STAGING_STALL":
        return <ParkingCircle className="w-4 h-4" />;
      default:
        return <Battery className="w-4 h-4" />;
    }
  };

  const getResourceColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "border-success/40 bg-success/5 text-success";
      case "OCCUPIED":
      case "BUSY":
      case "RESERVED":
        return "border-warning/40 bg-warning/5 text-warning";
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
      case "STAGING_STALL":
        return "Staging Area";
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex flex-col md:flex-row flex-wrap md:flex-nowrap gap-1 md:gap-2 md:overflow-x-auto pb-2">
                {depots.map((depot) => (
                  <Button
                    key={depot.id}
                    id={`depot-${depot.id}`}
                    variant={selectedDepot === depot.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDepot(depot.id)}
                    className={`text-[10px] md:text-sm py-1 md:py-2 px-2 md:px-3 h-auto whitespace-nowrap transition-all duration-500 ${
                      highlightedDepotId === depot.id ? 'ring-4 ring-primary shadow-lg' : ''
                    }`}
                  >
                    <Building2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
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
                        <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                          <div className="text-xl font-bold text-warning">
                            {
                              depotResources.resources.filter(
                                (r) => r.status === "OCCUPIED" || r.status === "BUSY" || r.status === "RESERVED"
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
                          const occupiedCount = resources.filter(r => r.status === "OCCUPIED" || r.status === "BUSY" || r.status === "RESERVED").length;

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
                                      <Badge variant="outline" className="border-warning/40 text-warning text-xs">
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
                                          )}`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-xs">
                                              {resource.type === "CHARGE_STALL"
                                                ? `Stall ${resource.index}`
                                                : resource.type === "MAINTENANCE_BAY"
                                                ? `Bay ${resource.index}`
                                                : `Stall ${resource.index}`}
                                            </span>
                                            <span className="flex-shrink-0">{getResourceIcon(resource.type)}</span>
                                          </div>
                                          <div className="text-[10px] leading-tight mt-1">
                                            {resource.status === "AVAILABLE" ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                                <span className="text-success font-medium">Available</span>
                                              </div>
                                            ) : resource.status === "OUT_OF_SERVICE" ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                                <span className="text-destructive font-medium">Out of Service</span>
                                              </div>
                                            ) : (
                                              <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                                  <span className="text-warning font-medium">Occupied</span>
                                                </div>
                                                <div className="font-medium break-words text-muted-foreground pl-3">
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
