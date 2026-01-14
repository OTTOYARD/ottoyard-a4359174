import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Battery, Zap, Truck, Calendar, TrendingUp, Activity, Settings, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2, Wrench, Bot, Eye, Radio, Car, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import FleetMap from "@/components/FleetMap";
import MapboxMap from "@/components/MapboxMap";
import CitySearchBar, { City } from "@/components/CitySearchBar";
import VehicleCard from "@/components/VehicleCard";
import DepotCard from "@/components/DepotCard";
import MetricsCard from "@/components/MetricsCard";
import { AddVehiclePopup, TrackVehiclePopup, VehicleDetailsPopup, MaintenancePopup } from "@/components/VehiclePopups";
import { AIAgentPopup } from "@/components/AIAgentPopup";
import { CartItem } from "@/components/CartButton";
import SettingsHub from "@/components/SettingsHub";
import { IncidentCard } from "@/components/IncidentCard";
import { IncidentDetails } from "@/components/IncidentDetails";
import { OTTOWDispatchDialog } from "@/components/OTTOWDispatchDialog";
import { useIncidentsStore } from "@/stores/incidentsStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, RefreshCw } from "lucide-react";
import { IncidentStatus } from "@/data/incidents-mock";
import { OTTOQFleetView } from "@/components/OTTOQFleetView";
import { OTTOQDepotView } from "@/components/OTTOQDepotView";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { OttoResponseButton, OttoResponsePanel } from "@/components/OttoResponse";
import { generateAnalyticsReportPDF } from "@/utils/analyticsReportPDF";
import { toast as sonnerToast } from "sonner";
import { WeatherButton } from "@/components/WeatherButton";

// Incidents Tab Component
const allStatuses: IncidentStatus[] = ["Reported", "Dispatched", "Secured", "At Depot", "Closed"];
const IncidentsTabContent = () => {
  const {
    incidents,
    selectedIncidentId,
    statusFilter,
    cityFilter,
    selectIncident,
    setStatusFilter,
    setCityFilter,
    refreshIncidents
  } = useIncidentsStore();

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(incident.status);
    const matchesCity = cityFilter === "All Cities" || incident.city === cityFilter;
    return matchesStatus && matchesCity;
  });

  // Sort: Open incidents first (by status priority then ETA), then Closed
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (a.status === "Closed" && b.status !== "Closed") return 1;
    if (a.status !== "Closed" && b.status === "Closed") return -1;
    const statusOrder = {
      "Reported": 1,
      "Dispatched": 2,
      "Secured": 3,
      "At Depot": 4,
      "Closed": 5
    };
    const aOrder = statusOrder[a.status];
    const bOrder = statusOrder[b.status];
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Within same status, sort by ETA (shortest first)
    if (a.etaSeconds !== null && b.etaSeconds !== null) {
      return a.etaSeconds - b.etaSeconds;
    }
    if (a.etaSeconds !== null) return -1;
    if (b.etaSeconds !== null) return 1;
    return 0;
  });
  const selectedIncident = incidents.find(i => i.incidentId === selectedIncidentId);
  const toggleStatusFilter = (status: IncidentStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };
  return <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-center">Incident Management</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {sortedIncidents.length} reported incident{sortedIncidents.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-col items-start gap-2 mt-2">
            <OttoResponseButton />
            <Badge className="bg-success text-white border-0 text-xs px-2 py-0.5 relative inline-flex items-center w-fit" style={{
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)',
            animation: 'glow-pulse 3s ease-in-out infinite'
          }}>
              <Activity className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          </div>
        </div>
        
        {/* Buttons stacked vertically on the right */}
        <div className="flex flex-col gap-2 min-w-[110px] shrink-0">
          <OTTOWDispatchDialog />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 w-full text-xs">
                <Filter className="w-2.5 h-2.5 md:mr-2" />
                <span className="hidden md:inline">Filters</span>
                {(statusFilter.length > 0 || cityFilter !== "All Cities") && <span className="ml-1 md:ml-2 px-1 md:px-1.5 py-0.5 text-[10px] md:text-xs bg-primary text-primary-foreground rounded-full">
                    {statusFilter.length + (cityFilter !== "All Cities" ? 1 : 0)}
                  </span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Status</Label>
                  <div className="space-y-2">
                    {allStatuses.map(status => <div key={status} className="flex items-center space-x-2">
                        <Checkbox id={`status-${status}`} checked={statusFilter.includes(status)} onCheckedChange={() => toggleStatusFilter(status)} />
                        <label htmlFor={`status-${status}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {status}
                        </label>
                      </div>)}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold mb-2 block">City</Label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Cities">All Cities</SelectItem>
                      <SelectItem value="Nashville">Nashville</SelectItem>
                      <SelectItem value="Austin">Austin</SelectItem>
                      <SelectItem value="LA">Los Angeles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="w-full" onClick={() => {
                setStatusFilter([]);
                setCityFilter("All Cities");
              }}>
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" onClick={refreshIncidents} className="h-6 w-full text-xs">
            <RefreshCw className="w-2.5 h-2.5 md:mr-2" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
      </div>
      
      {/* Single Column Layout with Inline Details */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {sortedIncidents.length === 0 ? <div className="text-center py-12 text-muted-foreground">
                  <p>No incidents match your filters.</p>
                </div> : sortedIncidents.map(incident => {
              const isSelected = incident.incidentId === selectedIncidentId;
              return <div key={incident.incidentId} id={`incident-${incident.incidentId}`}>
                      <IncidentCard incident={incident} isSelected={isSelected} onSelect={() => {
                  const newId = isSelected ? null : incident.incidentId;
                  selectIncident(newId);
                  if (newId) {
                    setTimeout(() => {
                      document.getElementById(`incident-${newId}`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 150);
                  }
                }} />
                      {/* Show details inline when selected */}
                      {isSelected && <div className="mt-3 p-4 border-l-4 border-primary bg-card/50 rounded-r-lg animate-accordion-down">
                          <IncidentDetails incident={incident} />
                        </div>}
                    </div>;
            })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>;
};
const Index = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<string | null>(null);
  const [overviewView, setOverviewView] = useState<'main' | 'vehicles' | 'energy' | 'grid' | 'efficiency'>('main');
  const [selectedQuickGlanceTile, setSelectedQuickGlanceTile] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [currentCity, setCurrentCity] = useState<City>({
    name: "Nashville",
    coordinates: [-86.7816, 36.1627],
    country: "USA"
  });
  const [selectedCityForOTTOQ, setSelectedCityForOTTOQ] = useState<string>("Nashville");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<string | null>(null);
  const [highlightedDepotId, setHighlightedDepotId] = useState<string | null>(null);

  // Popup states
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [trackVehicleOpen, setTrackVehicleOpen] = useState(false);
  const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [aiAgentOpen, setAiAgentOpen] = useState(false);
  const [showDueSoonSummary, setShowDueSoonSummary] = useState(false);
  const [popupVehicle, setPopupVehicle] = useState<typeof vehicles[0] | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Checkout success handling
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    
    if (checkout === 'success' && sessionId) {
      // Store session ID and open dialog BEFORE cleaning URL
      setCheckoutSessionId(sessionId);
      setCheckoutSuccessOpen(true);
      // Clear cart on successful checkout
      setCartItems([]);
      
      // Delay URL cleanup to ensure state is captured
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('checkout');
        newParams.delete('session_id');
        setSearchParams(newParams, { replace: true });
      }, 100);
    } else if (checkout === 'cancelled') {
      toast.info('Checkout cancelled');
      // Clean up cancelled URL immediately
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      setSearchParams(newParams, { replace: true });
    }
  }, []);
  const handleTrackVehicle = (vehicle: typeof vehicles[0]) => {
    setPopupVehicle(vehicle);
    setTrackVehicleOpen(true);
  };
  const handleVehicleDetails = (vehicle: typeof vehicles[0]) => {
    setPopupVehicle(vehicle);
    setVehicleDetailsOpen(true);
  };
  const handleMaintenanceSchedule = (vehicle: typeof vehicles[0]) => {
    setPopupVehicle(vehicle);
    setMaintenanceOpen(true);
  };
  const handleSendToOtto = (vehicle: typeof vehicles[0]) => {
    // Add logic to send vehicle to OTTOYARD depot
    console.log(`Sending ${vehicle.name} to OTTOYARD depot for charging/staging`);
    // You could add a toast notification here
  };
  const handleAddToCart = (items: CartItem[]) => {
    setCartItems(prev => [...prev, ...items]);
  };
  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };
  const handleCheckout = () => {
    console.log('Processing checkout for items:', cartItems);
    // Add checkout logic here
    setCartItems([]);
  };
  // Map any city to available OTTO-Q cities (Austin, LA, Nashville)
  const mapToOTTOQCity = (cityName: string): string => {
    const cityMap: {
      [key: string]: string;
    } = {
      'Nashville': 'Nashville',
      'Austin': 'Austin',
      'Los Angeles': 'LA',
      'LA': 'LA',
      // Map other cities to the closest OTTO-Q city
      'San Francisco': 'LA',
      'New York': 'Nashville',
      'Chicago': 'Nashville',
      'Seattle': 'LA',
      'Miami': 'Nashville',
      'Denver': 'Austin'
    };
    return cityMap[cityName] || 'Nashville'; // Default to Nashville
  };

  // Enhanced city coordinates mapping
  const cityCoordinates: {
    [key: string]: {
      lat: number;
      lng: number;
    };
  } = {
    'Nashville': {
      lat: 36.1627,
      lng: -86.7816
    },
    'Austin': {
      lat: 30.2672,
      lng: -97.7431
    },
    'LA': {
      lat: 34.0522,
      lng: -118.2437
    },
    'Los Angeles': {
      lat: 34.0522,
      lng: -118.2437
    }
  };

  // Fetch real vehicles and depots from database with enhanced fallbacks
  const fetchCityData = async (cityName: string) => {
    setLoadingData(true);
    try {
      // Get city coordinates
      const cityCenter = cityCoordinates[cityName] || {
        lat: 36.1627,
        lng: -86.7816
      };

      // Get city ID
      const {
        data: cityData,
        error: cityError
      } = await supabase.from("ottoq_cities").select("id, name").eq("name", cityName).maybeSingle();
      if (cityError) throw cityError;
      if (!cityData) {
        console.warn(`City ${cityName} not found in database`);
        setVehicles([]);
        setDepots([]);
        return;
      }

      // Fetch vehicles for this city
      const {
        data: vehiclesData,
        error: vehiclesError
      } = await supabase.rpc('get_random_vehicles_for_city', {
        p_city_id: cityData.id,
        p_limit: 50
      });
      if (vehiclesError) throw vehiclesError;

      // Transform vehicles to match the format expected by Overview with city-specific locations
      const transformedVehicles = (vehiclesData || []).map((v: any, index: number) => {
        const vehicleLat = cityCenter.lat + (Math.random() - 0.5) * 0.15;
        const vehicleLng = cityCenter.lng + (Math.random() - 0.5) * 0.20;

        // Map database status to chart-friendly status
        const mapStatus = (dbStatus: string): string => {
          const statusUpper = dbStatus.toUpperCase();
          switch (statusUpper) {
            case 'ON_TRIP':
            case 'IN_SERVICE':
              return 'active';
            case 'AT_DEPOT':
            case 'ENROUTE_DEPOT':
              // Use SOC to determine if charging - low battery = charging
              return v.soc < 0.5 ? 'charging' : 'idle';
            case 'IDLE':
              // Randomly assign some idle vehicles to maintenance for demo diversity
              return index % 8 === 0 ? 'maintenance' : 'idle';
            default:
              return 'idle';
          }
        };
        const mappedStatus = mapStatus(v.status);
        return {
          id: v.external_ref?.split(' ')[1] || v.id.slice(0, 5),
          name: v.external_ref || v.id.slice(0, 8),
          status: mappedStatus,
          battery: Math.round(v.soc * 100),
          location: {
            lat: vehicleLat,
            lng: vehicleLng
          },
          route: ['Downtown Route', 'Express Line', 'Airport Shuttle', 'City Loop', 'Suburban Connect'][index % 5],
          chargingTime: mappedStatus === 'charging' ? `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m` : 'N/A',
          nextMaintenance: mappedStatus === 'maintenance' ? 'In Progress' : `2025-${Math.random() < 0.5 ? '11' : '12'}-${Math.floor(Math.random() * 28) + 1}`,
          city: cityName
        };
      });
      console.log(`Loaded ${transformedVehicles.length} vehicles for ${cityName}`);
      setVehicles(transformedVehicles);

      // Fetch depots for this city
      const {
        data: depotsData,
        error: depotsError
      } = await supabase.from("ottoq_depots").select("id, name, address, lat, lon, config_jsonb").eq("city_id", cityData.id);
      if (depotsError) throw depotsError;

      // Fetch resources for each depot to calculate stalls - ensure we always have valid depot locations
      const depotsWithResources = await Promise.all((depotsData || []).map(async (depot: any, index: number) => {
        const {
          data: resourcesData
        } = await supabase.from("ottoq_resources").select("status").eq("depot_id", depot.id);
        const totalStalls = resourcesData?.length || 12;
        const occupiedStalls = resourcesData?.filter((r: any) => r.status === 'BUSY' || r.status === 'RESERVED').length || 0;
        const availableStalls = Math.max(0, totalStalls - occupiedStalls);

        // Ensure every depot has valid coordinates - place strategically around city
        const depotOffsets = [{
          lat: 0.02,
          lng: 0.03
        },
        // North
        {
          lat: -0.02,
          lng: -0.03
        },
        // South
        {
          lat: 0.01,
          lng: -0.04
        },
        // West
        {
          lat: -0.01,
          lng: 0.04
        } // East
        ];
        const offset = depotOffsets[index % depotOffsets.length];
        return {
          id: depot.id,
          name: depot.name,
          location: {
            lat: depot.lat && typeof depot.lat === 'number' ? depot.lat : cityCenter.lat + offset.lat,
            lng: depot.lon && typeof depot.lon === 'number' ? depot.lon : cityCenter.lng + offset.lng
          },
          energyGenerated: Math.floor(1500 + Math.random() * 1000),
          energyReturned: Math.floor(800 + Math.random() * 600),
          vehiclesCharging: occupiedStalls,
          totalStalls,
          availableStalls,
          status: availableStalls > 2 ? 'optimal' : availableStalls > 0 ? 'busy' : 'full',
          city: cityName
        };
      }));
      console.log(`Loaded ${depotsWithResources.length} depots for ${cityName}:`, depotsWithResources.map(d => ({
        name: d.name,
        location: d.location
      })));
      setDepots(depotsWithResources);
    } catch (error) {
      console.error("Error fetching city data:", error);
      toast.error("Failed to load city data");
      setVehicles([]);
      setDepots([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchCityData("Nashville");
  }, []);
  const handleCitySelect = (city: City) => {
    console.log(`🌍 City selected: ${city.name} at coordinates`, city.coordinates);
    setCurrentCity(city);
    const ottoqCity = mapToOTTOQCity(city.name);
    console.log(`📍 Mapped to OTTO-Q city: ${ottoqCity}`);
    setSelectedCityForOTTOQ(ottoqCity);
    fetchCityData(ottoqCity); // Fetch real data for the mapped OTTO-Q city
  };

  // Calculate city-specific metrics
  // Active vehicles are those that are IDLE or ON_TRIP
  const activeVehicles = vehicles.filter(v => v.status === 'idle' || v.status === 'on_trip').length;
  const chargingVehicles = vehicles.filter(v => v.status === 'charging' || v.status === 'at_depot').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'in_service' || v.status === 'enroute_depot').length;
  const totalEnergyGenerated = depots.reduce((sum, depot) => sum + depot.energyGenerated, 0);
  const totalEnergyReturned = depots.reduce((sum, depot) => sum + depot.energyReturned, 0);
  const totalStalls = depots.reduce((sum, depot) => sum + depot.totalStalls, 0);
  const availableStalls = depots.reduce((sum, depot) => sum + depot.availableStalls, 0);
  const occupancyRate = totalStalls > 0 ? Math.round((totalStalls - availableStalls) / totalStalls * 100) : 0;
  console.log(`📊 ${currentCity.name} Metrics: ${vehicles.length} vehicles (${activeVehicles} active), ${depots.length} depots (${availableStalls}/${totalStalls} stalls available)`);
  return <div className="min-h-screen bg-background">
      {/* Header - with PWA safe area support */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 pwa-header">
        <div className="container mx-auto px-4 py-3 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5 items-start">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 cursor-pointer hover-neon transition-all duration-300" onClick={() => window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })}>
                <div className="w-10 h-10 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                  <img src="/lovable-uploads/0802aeb6-e42e-4389-8e93-c10d17cf963e.png" alt="Fleet Command Logo" className="h-10 w-10 sm:h-20 sm:w-20" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-3xl font-bold text-foreground truncate text-center neon-text">OTTOYARD</h1>
                  <p className="text-xs sm:text-lg truncate text-center bg-gradient-to-b from-slate-300 to-slate-600 bg-clip-text text-[#617fa5] font-medium">Fleet Command</p>
                </div>
              </div>
              <WeatherButton city={currentCity} />
            </div>
            <div className="flex flex-col items-end space-y-2 flex-shrink-0">
              {/* Top Row: Notifications + Profile + Cart */}
              <div className="flex items-center space-x-2">
                <NotificationsPanel />
                <SettingsHub cartItems={cartItems} onRemoveFromCart={handleRemoveFromCart} onCheckout={handleCheckout}>
                  <Button variant="outline" size="sm" className="relative">
                    <Settings className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Settings</span>
                    {cartItems.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {cartItems.length}
                      </Badge>
                    )}
                  </Button>
                </SettingsHub>
              </div>
              
              {/* Second Row: AI Button */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAiAgentOpen(true)} className="bg-gradient-primary text-white border-0 hover:bg-gradient-primary/90 px-3">
                  <Bot className="h-4 w-4 mr-1 hidden sm:inline" />
                  <span className="sm:hidden">OttoCommand</span>
                  <span className="hidden sm:inline">OttoCommand AI</span>
                </Button>
              </div>
              
              {/* Third Row: Status Badge */}
              <div className="flex items-center">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">All Systems Operational</span>
                  <span className="md:hidden">Online</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="fleet">Fleet</TabsTrigger>
              <TabsTrigger value="depots">Depots</TabsTrigger>
              <TabsTrigger value="incidents">Incidents</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {overviewView === 'main' && <>
                {/* Fleet Map */}
                <Card className="futuristic-card hover-neon glow-medium">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="flex items-center neon-text">
                        <Radio className="h-5 w-5 mr-2 text-primary" />
                        Live Fleet Tracking
                      </CardTitle>
                      <div className="w-full sm:w-auto">
                        <CitySearchBar currentCity={currentCity} onCitySelect={handleCitySelect} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-[500px] scanning-line">
                      <MapboxMap vehicles={vehicles} depots={depots} city={currentCity} onVehicleClick={vehicleId => {
                    setSelectedTab('fleet');
                    setHighlightedVehicleId(vehicleId);
                    setTimeout(() => setHighlightedVehicleId(null), 3000);
                    // Add a longer delay to ensure tab switches and content renders
                    setTimeout(() => {
                      const element = document.getElementById(`vehicle-${vehicleId}`);
                      if (element) {
                        // Find the parent ScrollArea viewport
                        const scrollArea = element.closest('[data-radix-scroll-area-viewport]');
                        if (scrollArea) {
                          // Calculate the scroll position to center the element
                          const elementTop = element.offsetTop;
                          const scrollAreaHeight = scrollArea.clientHeight;
                          const elementHeight = element.clientHeight;
                          const scrollTop = elementTop - scrollAreaHeight / 2 + elementHeight / 2;
                          scrollArea.scrollTo({
                            top: scrollTop,
                            behavior: 'smooth'
                          });
                        } else {
                          // Fallback to regular scrollIntoView
                          element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                          });
                        }
                      }
                    }, 300);
                  }} onDepotClick={depotId => {
                    setSelectedTab('depots');
                    setHighlightedDepotId(depotId);
                    setTimeout(() => setHighlightedDepotId(null), 3000);
                    // Add a longer delay to ensure tab switches and content renders
                    setTimeout(() => {
                      const element = document.getElementById(`depot-${depotId}`);
                      if (element) {
                        // Scroll the button container horizontally if needed
                        const buttonContainer = element.closest('.overflow-x-auto');
                        if (buttonContainer) {
                          const elementLeft = element.offsetLeft;
                          const containerWidth = buttonContainer.clientWidth;
                          const elementWidth = element.clientWidth;
                          const scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;
                          buttonContainer.scrollTo({
                            left: scrollLeft,
                            behavior: 'smooth'
                          });
                        }
                        // Also scroll into view vertically
                        element.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                          inline: 'center'
                        });
                      }
                    }, 300);
                  }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Glance Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground neon-text">Quick Glance</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <MetricsCard title="Active Vehicles" value={activeVehicles.toString()} change={`+${Math.floor(activeVehicles * 0.1)}`} trend="up" icon={Truck} onClick={() => setSelectedQuickGlanceTile(selectedQuickGlanceTile === 'vehicles' ? null : 'vehicles')} />
                      {selectedQuickGlanceTile === 'vehicles' && <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg z-10 animate-fade-in" onClick={() => setSelectedQuickGlanceTile(null)}>
                          <h4 className="font-semibold mb-3">Fleet Status Overview</h4>
                          
                          {/* Vehicle Status Chart */}
                          <div className="h-32 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie data={[{
                            name: 'Active',
                            value: activeVehicles,
                            fill: 'hsl(var(--success))'
                          }, {
                            name: 'Charging',
                            value: chargingVehicles,
                            fill: 'hsl(var(--primary))'
                          }, {
                            name: 'Maintenance',
                            value: maintenanceVehicles,
                            fill: 'hsl(var(--warning))'
                          }]} cx="50%" cy="50%" innerRadius={25} outerRadius={50} dataKey="value" />
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <p><span className="font-medium text-success">Active:</span> {activeVehicles} vehicles on deliveries</p>
                            <p><span className="font-medium text-primary">Charging:</span> {chargingVehicles} vehicles at depots</p>
                            <p><span className="font-medium text-warning">Maintenance:</span> {maintenanceVehicles} vehicle{maintenanceVehicles !== 1 ? 's' : ''} scheduled</p>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('fleet');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              View All Vehicles
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('depots');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Charging Status
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('maintenance');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Schedule Service
                            </Button>
                          </div>
                        </div>}
                    </div>
                    
                    <div className="relative">
                      <MetricsCard title="Energy & Grid" value={`${(totalEnergyGenerated / 1000).toFixed(1)} MWh`} change={`+${Math.round(totalEnergyReturned / totalEnergyGenerated * 100)}%`} trend="up" icon={Zap} secondaryValue={`${(totalEnergyReturned / 1000).toFixed(1)} MWh returned`} secondaryLabel="Grid Return" onClick={() => setSelectedQuickGlanceTile(selectedQuickGlanceTile === 'energy' ? null : 'energy')} />
                      {selectedQuickGlanceTile === 'energy' && <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg z-10 animate-fade-in" onClick={() => setSelectedQuickGlanceTile(null)}>
                          <h4 className="font-semibold mb-3">Energy Management</h4>
                          
                          {/* Energy Flow Chart */}
                          <div className="h-32 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[{
                          time: '6AM',
                          consumed: 0.3,
                          returned: 0.1
                        }, {
                          time: '9AM',
                          consumed: 0.8,
                          returned: 0.2
                        }, {
                          time: '12PM',
                          consumed: 1.2,
                          returned: 0.6
                        }, {
                          time: '3PM',
                          consumed: 0.9,
                          returned: 0.8
                        }, {
                          time: '6PM',
                          consumed: 1.0,
                          returned: 0.4
                        }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" tick={{
                            fill: '#2563eb'
                          }} />
                                <YAxis />
                                <Tooltip contentStyle={{
                            color: '#2563eb'
                          }} labelStyle={{
                            color: '#2563eb'
                          }} />
                                <Area type="monotone" dataKey="consumed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="returned" stackId="2" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <p><span className="font-medium">Net Usage:</span> 2.1 MWh consumed today</p>
                            <p><span className="font-medium">Return Rate:</span> 50% energy efficiency</p>
                            <p><span className="font-medium">Peak Hours:</span> 12PM-3PM optimal return</p>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('analytics');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Energy Analytics
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('depots');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Depot Status
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('analytics');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Grid Return Report
                            </Button>
                          </div>
                        </div>}
                    </div>
                    
                    <div className="relative">
                      <MetricsCard title="Fleet Efficiency" value={`${Math.round(85 + occupancyRate * 0.15)}%`} change={`+${Math.round(Math.random() * 5)}%`} trend="up" icon={Activity} onClick={() => setSelectedQuickGlanceTile(selectedQuickGlanceTile === 'efficiency' ? null : 'efficiency')} />
                      {selectedQuickGlanceTile === 'efficiency' && <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg z-10 animate-fade-in" onClick={() => setSelectedQuickGlanceTile(null)}>
                          <h4 className="font-semibold mb-3">Performance Metrics</h4>
                          
                          {/* Efficiency Trend Chart */}
                          <div className="h-32 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[{
                          day: 'Mon',
                          efficiency: 91.2,
                          delivery: 95.8
                        }, {
                          day: 'Tue',
                          efficiency: 92.5,
                          delivery: 97.1
                        }, {
                          day: 'Wed',
                          efficiency: 93.1,
                          delivery: 96.9
                        }, {
                          day: 'Thu',
                          efficiency: 94.2,
                          delivery: 97.8
                        }, {
                          day: 'Fri',
                          efficiency: 94.2,
                          delivery: 98.1
                        }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" tick={{
                            fill: '#2563eb'
                          }} />
                                <YAxis domain={[90, 100]} />
                                <Tooltip contentStyle={{
                            color: '#2563eb'
                          }} labelStyle={{
                            color: '#2563eb'
                          }} />
                                <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--primary))" strokeWidth={2} />
                                <Line type="monotone" dataKey="delivery" stroke="hsl(var(--success))" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <p><span className="font-medium">Fleet Efficiency:</span> 94.2% (↑3.1%)</p>
                            <p><span className="font-medium">Delivery Success:</span> 97.8% on-time</p>
                            <p><span className="font-medium">Energy Optimization:</span> 12% below target</p>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('analytics');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Performance Analytics
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('fleet');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Vehicle Performance
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('analytics');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Efficiency Reports
                            </Button>
                          </div>
                        </div>}
                    </div>
                    
                    <div className="relative">
                      <MetricsCard title="Scheduled Services" value={maintenanceVehicles.toString()} change={`+${Math.floor(maintenanceVehicles * 0.3)}`} trend="up" icon={Wrench} secondaryValue={`${Math.min(maintenanceVehicles, 2)} today`} secondaryLabel="Due Today" onClick={() => setSelectedQuickGlanceTile(selectedQuickGlanceTile === 'maintenance' ? null : 'maintenance')} />
                      {selectedQuickGlanceTile === 'maintenance' && <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg z-10 animate-fade-in" onClick={() => setSelectedQuickGlanceTile(null)}>
                          <h4 className="font-semibold mb-3">Maintenance Schedule</h4>
                          
                          {/* Maintenance Priority Chart */}
                          <div className="h-32 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[{
                          type: 'Battery',
                          today: 2,
                          week: 3,
                          urgent: 0
                        }, {
                          type: 'Brake',
                          today: 0,
                          week: 2,
                          urgent: 1
                        }, {
                          type: 'Tire',
                          today: 0,
                          week: 2,
                          urgent: 0
                        }, {
                          type: 'Software',
                          today: 0,
                          week: 1,
                          urgent: 0
                        }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" tick={{
                            fill: '#2563eb'
                          }} />
                                <YAxis />
                                <Tooltip contentStyle={{
                            color: '#2563eb'
                          }} labelStyle={{
                            color: '#2563eb'
                          }} />
                                <Bar dataKey="today" fill="hsl(var(--destructive))" />
                                <Bar dataKey="week" fill="hsl(var(--warning))" />
                                <Bar dataKey="urgent" fill="hsl(var(--primary))" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <p><span className="font-medium">Due Today:</span> {Math.min(maintenanceVehicles, 2)} battery checks</p>
                            <p><span className="font-medium">This Week:</span> {maintenanceVehicles} total services</p>
                            <p><span className="font-medium">Urgent:</span> {Math.max(1, Math.floor(maintenanceVehicles * 0.2))} brake inspection{Math.floor(maintenanceVehicles * 0.2) !== 1 ? 's' : ''}</p>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('maintenance');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Maintenance Schedule
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('fleet');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Vehicle Status
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                        setSelectedTab('maintenance');
                        setSelectedQuickGlanceTile(null);
                      }}>
                              Schedule Service
                            </Button>
                          </div>
                        </div>}
                    </div>
                  </div>
                </div>

                {/* Quick Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-fleet-md">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Car className="h-5 w-5 mr-2 text-accent" />
                          Active Vehicles
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => {
                      setOverviewView('vehicles');
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                    }}>
                          View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vehicles.slice(0, 3).map(vehicle => <div key={vehicle.id}>
                           <div className={`cursor-pointer transition-all duration-200 ${selectedVehicle === vehicle.id ? 'ring-2 ring-primary rounded-lg' : ''}`} onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}>
                             <VehicleCard vehicle={vehicle} compact onTrack={handleTrackVehicle} onDetails={handleVehicleDetails} onSchedule={handleMaintenanceSchedule} onSendToOtto={handleSendToOtto} />
                          </div>
                          {selectedVehicle === vehicle.id && <div className="mt-2 p-3 bg-card border border-border rounded-lg">
                              <h4 className="font-semibold mb-2">Quick Vehicle Info</h4>
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Location:</span> {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}</p>
                                <p><span className="font-medium">Last Service:</span> 2024-07-15</p>
                                <p><span className="font-medium">Total Miles:</span> {Math.floor(Math.random() * 50000 + 10000)} mi</p>
                                <div className="flex gap-2 mt-3">
                                  <Button size="sm" variant="outline" onClick={() => setSelectedTab('fleet')}>
                                    View Details in Fleet
                                  </Button>
                                </div>
                              </div>
                            </div>}
                        </div>)}
                    </CardContent>
                  </Card>

                  <Card className="shadow-fleet-md">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Zap className="h-5 w-5 mr-2 text-energy-grid" />
                          Available Depots
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedTab('depots');
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                    }}>
                          View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {depots.slice(0, 3).map(depot => <div key={depot.id}>
                          <div className={`cursor-pointer transition-all duration-200 ${selectedDepot === depot.id ? 'ring-2 ring-primary rounded-lg' : ''}`} onClick={() => setSelectedDepot(selectedDepot === depot.id ? null : depot.id)}>
                            <DepotCard depot={depot} compact />
                          </div>
                          {selectedDepot === depot.id && <div className="mt-2 p-3 bg-card border border-border rounded-lg">
                              <h4 className="font-semibold mb-2">Quick Depot Info</h4>
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Available Stalls:</span> {depot.availableStalls}/{depot.totalStalls}</p>
                                <p><span className="font-medium">Current Charging:</span> {depot.vehiclesCharging} vehicles</p>
                                <p><span className="font-medium">Status:</span> {depot.status}</p>
                                <div className="flex gap-2 mt-3">
                                  <Button size="sm" variant="outline" onClick={() => setSelectedTab('depots')}>
                                    View Details in Depots
                                  </Button>
                                </div>
                              </div>
                            </div>}
                        </div>)}
                    </CardContent>
                  </Card>
                </div>
              </>}

            {overviewView === 'vehicles' && <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Car className="h-5 w-5 mr-2 text-accent" />
                      All Active Vehicles
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setOverviewView('main')}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                     {vehicles.map(vehicle => <div key={vehicle.id} className={`cursor-pointer transition-all duration-200 ${selectedVehicle === vehicle.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}>
                        <VehicleCard vehicle={vehicle} onTrack={handleTrackVehicle} onDetails={handleVehicleDetails} onSchedule={handleMaintenanceSchedule} onSendToOtto={handleSendToOtto} />
                        {selectedVehicle === vehicle.id && <div className="mt-2 p-3 bg-card border border-border rounded-lg">
                            <h4 className="font-semibold mb-2">Vehicle Details</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Location:</span> {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}</p>
                              <p><span className="font-medium">Last Service:</span> 2024-07-15</p>
                              <p><span className="font-medium">Total Miles:</span> {Math.floor(Math.random() * 50000 + 10000)} mi</p>
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="outline">Schedule Maintenance</Button>
                                <Button size="sm" variant="outline">Schedule Detailing</Button>
                              </div>
                            </div>
                          </div>}
                      </div>)}
                  </div>
                </CardContent>
              </Card>}

            {overviewView === 'energy' && <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-primary" />
                      Energy Generation Analytics
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setOverviewView('main')}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Daily Generation</p>
                        <p className="text-2xl font-bold text-primary">2.8 MWh</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Weekly Generation</p>
                        <p className="text-2xl font-bold text-primary">18.4 MWh</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Peak Output</p>
                        <p className="text-2xl font-bold text-primary">3.2 MW</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Efficiency</p>
                        <p className="text-2xl font-bold text-primary">96.8%</p>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{
                      time: '6AM',
                      generated: 2.1,
                      consumed: 1.8
                    }, {
                      time: '9AM',
                      generated: 3.2,
                      consumed: 2.1
                    }, {
                      time: '12PM',
                      generated: 4.8,
                      consumed: 2.9
                    }, {
                      time: '3PM',
                      generated: 5.2,
                      consumed: 3.1
                    }, {
                      time: '6PM',
                      generated: 3.7,
                      consumed: 2.7
                    }, {
                      time: '9PM',
                      generated: 2.4,
                      consumed: 2.2
                    }]}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="time" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />
                          <Area type="monotone" dataKey="generated" stackId="1" stroke="hsl(var(--energy-high))" fill="hsl(var(--energy-high) / 0.3)" name="Generated (MWh)" />
                          <Area type="monotone" dataKey="consumed" stackId="2" stroke="hsl(var(--energy-medium))" fill="hsl(var(--energy-medium) / 0.3)" name="Consumed (MWh)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {overviewView === 'grid' && <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Grid Return Analytics
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setOverviewView('main')}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Today Return</p>
                        <p className="text-2xl font-bold text-accent">0.6 MWh</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Return Rate</p>
                        <p className="text-2xl font-bold text-accent">22.4%</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold text-accent">$1,247</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Grid Score</p>
                        <p className="text-2xl font-bold text-accent">A+</p>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[{
                      time: '6AM',
                      returned: 0.3,
                      revenue: 45
                    }, {
                      time: '9AM',
                      returned: 1.1,
                      revenue: 165
                    }, {
                      time: '12PM',
                      returned: 1.9,
                      revenue: 285
                    }, {
                      time: '3PM',
                      returned: 2.1,
                      revenue: 315
                    }, {
                      time: '6PM',
                      returned: 1.0,
                      revenue: 150
                    }, {
                      time: '9PM',
                      returned: 0.2,
                      revenue: 30
                    }]}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="time" className="text-xs" />
                          <YAxis yAxisId="left" className="text-xs" />
                          <YAxis yAxisId="right" orientation="right" className="text-xs" />
                          <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />
                          <Line yAxisId="left" type="monotone" dataKey="returned" stroke="hsl(var(--accent))" strokeWidth={3} name="Returned (MWh)" dot={{
                        fill: 'hsl(var(--accent))',
                        strokeWidth: 2,
                        r: 4
                      }} />
                          <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 5" name="Revenue ($)" dot={{
                        fill: 'hsl(var(--success))',
                        strokeWidth: 2,
                        r: 3
                      }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {overviewView === 'efficiency' && <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-primary" />
                      Fleet Efficiency Analytics
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setOverviewView('main')}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Operational</p>
                        <p className="text-2xl font-bold text-success">{vehicles.filter(v => v.status === 'operational').length}/45</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                        <p className="text-2xl font-bold text-success">94.2%</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="text-2xl font-bold text-success">98.7%</p>
                      </div>
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Distance/Day</p>
                        <p className="text-2xl font-bold text-success">1,247 mi</p>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{
                      vehicle: 'Fleet A',
                      efficiency: 96.8,
                      uptime: 99.2
                    }, {
                      vehicle: 'Fleet B',
                      efficiency: 94.2,
                      uptime: 98.7
                    }, {
                      vehicle: 'Fleet C',
                      efficiency: 92.1,
                      uptime: 97.5
                    }, {
                      vehicle: 'Fleet D',
                      efficiency: 95.7,
                      uptime: 98.9
                    }, {
                      vehicle: 'Fleet E',
                      efficiency: 91.3,
                      uptime: 96.8
                    }, {
                      vehicle: 'Fleet F',
                      efficiency: 97.2,
                      uptime: 99.5
                    }]}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="vehicle" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} />
                          <Bar dataKey="efficiency" fill="hsl(var(--success) / 0.8)" name="Efficiency (%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="uptime" fill="hsl(var(--primary) / 0.6)" name="Uptime (%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>}
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <OTTOQFleetView selectedCityName={selectedCityForOTTOQ} highlightedVehicleId={highlightedVehicleId} onAddToCart={handleAddToCart} />
          </TabsContent>

          <TabsContent value="depots" className="space-y-6">
            <OTTOQDepotView selectedCityName={selectedCityForOTTOQ} highlightedDepotId={highlightedDepotId} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground text-left">Fleet Analytics</h2>
              <Button variant="outline" onClick={async () => {
              sonnerToast.info("Generating report...", {
                description: "Please wait while we generate your analytics report with AI insights."
              });
              try {
                const weekData = [{
                  period: 'Mon',
                  efficiency: 93
                }, {
                  period: 'Tue',
                  efficiency: 94
                }, {
                  period: 'Wed',
                  efficiency: 92
                }, {
                  period: 'Thu',
                  efficiency: 95
                }, {
                  period: 'Fri',
                  efficiency: 94
                }, {
                  period: 'Sat',
                  efficiency: 93
                }, {
                  period: 'Sun',
                  efficiency: 91
                }];
                await generateAnalyticsReportPDF({
                  totalVehicles: vehicles.length || 50,
                  statusDistribution: {
                    active: vehicles.filter(v => v.status === 'active').length || 15,
                    charging: vehicles.filter(v => v.status === 'charging').length || 12,
                    maintenance: vehicles.filter(v => v.status === 'maintenance').length || 8,
                    idle: vehicles.filter(v => v.status === 'idle').length || 15
                  },
                  efficiencyTrends: weekData,
                  cityName: currentCity.name,
                  reportDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                });
                sonnerToast.success("Report downloaded!", {
                  description: "Your fleet analytics report has been generated successfully."
                });
              } catch (error) {
                console.error('Failed to generate report:', error);
                sonnerToast.error("Failed to generate report", {
                  description: "Please try again later."
                });
              }
            }}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Energy Efficiency Trends</CardTitle>
                    <div className="flex space-x-1 md:flex-row flex-col md:space-x-1 md:space-y-0 space-y-1 space-x-0">
                      <Button size="sm" variant={chartPeriod === 'week' ? 'default' : 'outline'} onClick={() => setChartPeriod('week')} className="md:min-w-0 min-w-16 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2">
                        Week
                      </Button>
                      <Button size="sm" variant={chartPeriod === 'month' ? 'default' : 'outline'} onClick={() => setChartPeriod('month')} className="md:min-w-0 min-w-16 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2">
                        Month
                      </Button>
                      <Button size="sm" variant={chartPeriod === 'year' ? 'default' : 'outline'} onClick={() => setChartPeriod('year')} className="md:min-w-0 min-w-16 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2">
                        Year
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartPeriod === 'week' ? [{
                      period: 'Mon',
                      efficiency: 93
                    }, {
                      period: 'Tue',
                      efficiency: 94
                    }, {
                      period: 'Wed',
                      efficiency: 92
                    }, {
                      period: 'Thu',
                      efficiency: 95
                    }, {
                      period: 'Fri',
                      efficiency: 94
                    }, {
                      period: 'Sat',
                      efficiency: 93
                    }, {
                      period: 'Sun',
                      efficiency: 91
                    }] : chartPeriod === 'month' ? [{
                      period: 'Jan',
                      efficiency: 88
                    }, {
                      period: 'Feb',
                      efficiency: 89
                    }, {
                      period: 'Mar',
                      efficiency: 91
                    }, {
                      period: 'Apr',
                      efficiency: 93
                    }, {
                      period: 'May',
                      efficiency: 92
                    }, {
                      period: 'Jun',
                      efficiency: 94
                    }, {
                      period: 'Jul',
                      efficiency: 95
                    }, {
                      period: 'Aug',
                      efficiency: 94
                    }] : [{
                      period: '2020',
                      efficiency: 82
                    }, {
                      period: '2021',
                      efficiency: 85
                    }, {
                      period: '2022',
                      efficiency: 89
                    }, {
                      period: '2023',
                      efficiency: 92
                    }, {
                      period: '2024',
                      efficiency: 94
                    }]}>
                        <defs>
                          <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                            <stop offset="50%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" axisLine={true} tickLine={true} tick={{
                        fontSize: 12
                      }} />
                         <YAxis domain={[80, 100]} label={{
                        value: 'Efficiency (%)',
                        angle: -90,
                        position: 'insideLeft',
                        textAnchor: 'middle',
                        style: {
                          textAnchor: 'middle'
                        }
                      }} axisLine={true} tickLine={true} tick={{
                        fontSize: 12,
                        textAnchor: 'end'
                      }} />
                         <Tooltip formatter={value => [`${value}%`, 'Efficiency']} labelFormatter={label => `Period: ${label}`} contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px hsl(var(--muted) / 0.15)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }} labelStyle={{
                        color: 'hsl(var(--foreground))',
                        marginBottom: '4px'
                      }} />
                        <Legend />
                        <Area type="monotone" dataKey="efficiency" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#efficiencyGradient)" name="Fleet Efficiency" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>{currentCity.name} Fleet Status ({vehicles.length} vehicles)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={(() => {
                        // Use actual vehicle data if available, otherwise use diverse mock data
                        const activeCount = vehicles.filter(v => v.status === 'active').length;
                        const chargingCount = vehicles.filter(v => v.status === 'charging').length;
                        const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
                        const idleCount = vehicles.filter(v => v.status === 'idle').length;
                        const total = activeCount + chargingCount + maintenanceCount + idleCount;

                        // If no real data, use well-distributed mock data
                        if (total === 0) {
                          return [{
                            name: 'Active',
                            value: 22,
                            fill: 'hsl(var(--success))'
                          }, {
                            name: 'Charging',
                            value: 15,
                            fill: 'hsl(var(--primary))'
                          }, {
                            name: 'Maintenance',
                            value: 6,
                            fill: 'hsl(var(--warning))'
                          }, {
                            name: 'Idle',
                            value: 7,
                            fill: 'hsl(142 76% 36%)'
                          }];
                        }
                        return [{
                          name: 'Active',
                          value: activeCount,
                          fill: 'hsl(var(--success))'
                        }, {
                          name: 'Charging',
                          value: chargingCount,
                          fill: 'hsl(var(--primary))'
                        }, {
                          name: 'Maintenance',
                          value: maintenanceCount,
                          fill: 'hsl(var(--warning))'
                        }, {
                          name: 'Idle',
                          value: idleCount,
                          fill: 'hsl(142 76% 36%)'
                        }];
                      })()} cx="50%" cy="50%" labelLine={true} label={({
                        name,
                        percent
                      }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={70} innerRadius={30} paddingAngle={2} dataKey="value" />
                        <Tooltip formatter={(value, name) => [`${value} vehicles`, name]} contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px hsl(var(--muted) / 0.15)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }} />
                        <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => <span style={{
                        color: 'hsl(var(--foreground))',
                        fontSize: '11px'
                      }}>
                              {value}: {entry.payload.value}
                            </span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-fleet-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Daily Energy Generation</CardTitle>
                    <div className="flex space-x-1 md:flex-row flex-col md:space-x-1 md:space-y-0 space-y-1 space-x-0">
                      <Button size="sm" variant={chartPeriod === 'week' ? 'default' : 'outline'} onClick={() => setChartPeriod('week')} className="md:min-w-0 min-w-16 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2">
                        Week
                      </Button>
                      <Button size="sm" variant={chartPeriod === 'month' ? 'default' : 'outline'} onClick={() => setChartPeriod('month')} className="md:min-w-0 min-w-16 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2">
                        Month
                      </Button>
                      <Button size="sm" variant={chartPeriod === 'year' ? 'default' : 'outline'} onClick={() => setChartPeriod('year')} className="md:min-w-0 min-w-16 text-xs md:text-sm px-2 py-1 md:px-3 md:py-2">
                        Year
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartPeriod === 'week' ? [{
                      period: 'Mon',
                      generated: 2.8,
                      returned: 1.2
                    }, {
                      period: 'Tue',
                      generated: 3.2,
                      returned: 1.4
                    }, {
                      period: 'Wed',
                      generated: 2.9,
                      returned: 1.1
                    }, {
                      period: 'Thu',
                      generated: 3.5,
                      returned: 1.6
                    }, {
                      period: 'Fri',
                      generated: 3.1,
                      returned: 1.3
                    }, {
                      period: 'Sat',
                      generated: 2.6,
                      returned: 1.0
                    }, {
                      period: 'Sun',
                      generated: 2.4,
                      returned: 0.9
                    }] : chartPeriod === 'month' ? [{
                      period: 'W1',
                      generated: 20.2,
                      returned: 8.7
                    }, {
                      period: 'W2',
                      generated: 22.1,
                      returned: 9.4
                    }, {
                      period: 'W3',
                      generated: 21.8,
                      returned: 9.1
                    }, {
                      period: 'W4',
                      generated: 23.5,
                      returned: 10.2
                    }] : [{
                      period: 'Q1',
                      generated: 265,
                      returned: 115
                    }, {
                      period: 'Q2',
                      generated: 278,
                      returned: 122
                    }, {
                      period: 'Q3',
                      generated: 295,
                      returned: 131
                    }, {
                      period: 'Q4',
                      generated: 312,
                      returned: 140
                    }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" axisLine={true} tickLine={true} tick={{
                        fontSize: 12
                      }} />
                         <YAxis label={{
                        value: 'Energy (MWh)',
                        angle: -90,
                        position: 'insideLeft',
                        textAnchor: 'middle',
                        style: {
                          textAnchor: 'middle'
                        }
                      }} axisLine={true} tickLine={true} tick={{
                        fontSize: 12,
                        textAnchor: 'end'
                      }} />
                         <Tooltip formatter={(value, name) => [`${value} MWh`, name === 'generated' ? 'Generated' : 'Returned to Grid']} labelFormatter={label => `Period: ${label}`} contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px hsl(var(--muted) / 0.15)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }} labelStyle={{
                        color: 'hsl(var(--foreground))',
                        marginBottom: '4px'
                      }} />
                        <Legend />
                        <Area type="monotone" dataKey="generated" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Energy Generated" />
                        <Area type="monotone" dataKey="returned" stackId="2" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} name="Returned to Grid" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Vehicle Battery Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{
                      range: '0-20%',
                      count: vehicles.filter(v => v.battery <= 20).length
                    }, {
                      range: '21-40%',
                      count: vehicles.filter(v => v.battery > 20 && v.battery <= 40).length
                    }, {
                      range: '41-60%',
                      count: vehicles.filter(v => v.battery > 40 && v.battery <= 60).length
                    }, {
                      range: '61-80%',
                      count: vehicles.filter(v => v.battery > 60 && v.battery <= 80).length
                    }, {
                      range: '81-100%',
                      count: vehicles.filter(v => v.battery > 80).length
                    }]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" axisLine={true} tickLine={true} tick={{
                        fontSize: 12
                      }} />
                         <YAxis label={{
                        value: 'Number of Vehicles',
                        angle: -90,
                        position: 'insideLeft',
                        textAnchor: 'middle',
                        style: {
                          textAnchor: 'middle'
                        }
                      }} axisLine={true} tickLine={true} tick={{
                        fontSize: 12,
                        textAnchor: 'end'
                      }} />
                         <Tooltip formatter={value => [`${value} vehicles`, 'Count']} labelFormatter={label => `Battery Range: ${label}`} contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px hsl(var(--muted) / 0.15)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }} labelStyle={{
                        color: 'hsl(var(--foreground))',
                        marginBottom: '4px'
                      }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name="Vehicles" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <IncidentsTabContent />
          </TabsContent>
        </Tabs>
        
        {/* Popup Components */}
        <AddVehiclePopup open={addVehicleOpen} onOpenChange={setAddVehicleOpen} />
        <TrackVehiclePopup open={trackVehicleOpen} onOpenChange={setTrackVehicleOpen} vehicle={popupVehicle} />
        <VehicleDetailsPopup open={vehicleDetailsOpen} onOpenChange={setVehicleDetailsOpen} vehicle={popupVehicle} />
        <MaintenancePopup open={maintenanceOpen} onOpenChange={setMaintenanceOpen} vehicle={popupVehicle} depots={depots} onAddToCart={handleAddToCart} />
          <AIAgentPopup open={aiAgentOpen} onOpenChange={setAiAgentOpen} currentCity={currentCity} vehicles={vehicles} depots={depots} />

        {/* Due Soon Summary Dialog */}
        <Dialog open={showDueSoonSummary} onOpenChange={setShowDueSoonSummary}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-warning" />
                Due Soon Summary
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-1 gap-3">
                {vehicles.slice(0, 3).map((vehicle, index) => <div key={vehicle.id} className="p-3 border border-warning/20 rounded-lg bg-warning/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm sm:text-base">{vehicle.name}</h3>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        Due Soon
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p><span className="font-medium">Due:</span> {vehicle.nextMaintenance}</p>
                      <p><span className="font-medium">Battery:</span> {vehicle.battery}% | <span className="font-medium">Status:</span> {vehicle.status}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="default" className="text-xs px-2 py-1 h-7" onClick={() => {
                    setPopupVehicle(vehicle);
                    setMaintenanceOpen(true);
                    setShowDueSoonSummary(false);
                  }}>
                        Schedule
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" onClick={() => {
                    setPopupVehicle(vehicle);
                    setVehicleDetailsOpen(true);
                    setShowDueSoonSummary(false);
                  }}>
                        Details
                      </Button>
                    </div>
                  </div>)}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-7" onClick={() => {
                  vehicles.slice(0, 3).forEach(vehicle => {
                    setPopupVehicle(vehicle);
                    setMaintenanceOpen(true);
                  });
                  setShowDueSoonSummary(false);
                }}>
                    Schedule All
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-7" onClick={() => setShowDueSoonSummary(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      
      {/* OTTO-RESPONSE Panel */}
      <OttoResponsePanel vehicles={vehicles} depots={depots} />
    </div>;
};
export default Index;