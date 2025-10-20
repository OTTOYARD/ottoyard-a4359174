import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Battery, Zap, Truck, Calendar, TrendingUp, Activity, Settings, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2, Wrench, Bot, Eye, Radio, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import FleetMap from "@/components/FleetMap";
import MapboxMap from "@/components/MapboxMap";
import CitySearchBar, { City } from "@/components/CitySearchBar";
import SettingsDialog from "@/components/SettingsDialog";
import VehicleCard from "@/components/VehicleCard";
import DepotCard from "@/components/DepotCard";
import MetricsCard from "@/components/MetricsCard";
import { AddVehiclePopup, TrackVehiclePopup, VehicleDetailsPopup, MaintenancePopup } from "@/components/VehiclePopups";
import { AIAgentPopup } from "@/components/AIAgentPopup";
import CartButton, { CartItem } from "@/components/CartButton";
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
          <h2 className="text-2xl font-bold">Incidents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {sortedIncidents.length} incident{sortedIncidents.length !== 1 ? 's' : ''}
          </p>
          <Badge className="bg-success text-white border-0 text-xs px-2 py-0.5 relative mt-2 inline-flex items-center w-fit" style={{
          boxShadow: '0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)',
          animation: 'glow-pulse 3s ease-in-out infinite'
        }}>
            <Activity className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
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

  // Popup states
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [trackVehicleOpen, setTrackVehicleOpen] = useState(false);
  const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [aiAgentOpen, setAiAgentOpen] = useState(false);
  const [showDueSoonSummary, setShowDueSoonSummary] = useState(false);
  const [popupVehicle, setPopupVehicle] = useState<typeof vehicles[0] | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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
    const cityMap: { [key: string]: string } = {
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

  // Fetch real vehicles and depots from database
  const fetchCityData = async (cityName: string) => {
    setLoadingData(true);
    try {
      // Get city ID
      const { data: cityData, error: cityError } = await supabase
        .from("ottoq_cities")
        .select("id, name")
        .eq("name", cityName)
        .maybeSingle();

      if (cityError) throw cityError;
      if (!cityData) {
        console.warn(`City ${cityName} not found in database`);
        setVehicles([]);
        setDepots([]);
        return;
      }

      // Fetch vehicles for this city
      const { data: vehiclesData, error: vehiclesError } = await supabase.rpc('get_random_vehicles_for_city', {
        p_city_id: cityData.id,
        p_limit: 50
      });

      if (vehiclesError) throw vehiclesError;

      // Transform vehicles to match the format expected by Overview
      const transformedVehicles = (vehiclesData || []).map((v: any) => ({
        id: v.external_ref?.split(' ')[1] || v.id.slice(0, 5),
        name: v.external_ref || v.id.slice(0, 8),
        status: v.status.toLowerCase(),
        battery: Math.round(v.soc * 100),
        location: {
          lat: 36.1627 + (Math.random() - 0.5) * 0.2, // Mock location near city
          lng: -86.7816 + (Math.random() - 0.5) * 0.3
        },
        route: 'Downtown Delivery',
        chargingTime: v.status === 'CHARGING' ? `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m` : 'N/A',
        nextMaintenance: v.status === 'MAINTENANCE' ? 'In Progress' : `2025-${Math.random() < 0.5 ? '10' : '12'}-${Math.floor(Math.random() * 28) + 1}`
      }));

      setVehicles(transformedVehicles);

      // Fetch depots for this city
      const { data: depotsData, error: depotsError } = await supabase
        .from("ottoq_depots")
        .select("id, name, address, lat, lon, config_jsonb")
        .eq("city_id", cityData.id);

      if (depotsError) throw depotsError;

      // Fetch resources for each depot to calculate stalls
      const depotsWithResources = await Promise.all(
        (depotsData || []).map(async (depot: any) => {
          const { data: resourcesData } = await supabase
            .from("ottoq_resources")
            .select("status")
            .eq("depot_id", depot.id);

          const totalStalls = resourcesData?.length || 0;
          const occupiedStalls = resourcesData?.filter((r: any) => r.status === 'OCCUPIED').length || 0;
          const availableStalls = totalStalls - occupiedStalls;

          return {
            id: depot.id,
            name: depot.name,
            location: {
              lat: depot.lat || (36.1627 + (Math.random() - 0.5) * 0.05),
              lng: depot.lon || (-86.7816 + (Math.random() - 0.5) * 0.08)
            },
            energyGenerated: Math.floor(1400 + Math.random() * 800),
            energyReturned: Math.floor((1400 + Math.random() * 800) * 0.5),
            vehiclesCharging: occupiedStalls,
            totalStalls,
            availableStalls,
            status: Math.random() > 0.85 ? 'maintenance' : 'optimal'
          };
        })
      );

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
    setCurrentCity(city);
    const ottoqCity = mapToOTTOQCity(city.name);
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
  const occupancyRate = Math.round((totalStalls - availableStalls) / totalStalls * 100);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:py-6 py-[18px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 cursor-pointer hover-neon transition-all duration-300" onClick={() => window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0">
                <img src="/lovable-uploads/0802aeb6-e42e-4389-8e93-c10d17cf963e.png" alt="Fleet Command Logo" className="h-18 w-18 sm:h-24 sm:w-24" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate text-center neon-text">OTTOYARD</h1>
                <p className="text-sm truncate text-center bg-gradient-to-b from-slate-300 to-slate-600 bg-clip-text text-[#617fa5] font-medium sm:text-lg">Fleet Command</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2 flex-shrink-0">
              {/* Top Row: Settings + Cart */}
              <div className="flex items-center space-x-2">
                <SettingsDialog>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SettingsDialog>
                <CartButton cartItems={cartItems} onRemoveItem={handleRemoveFromCart} onCheckout={handleCheckout} />
              </div>
              
              {/* Second Row: AI Button */}
              <div className="flex items-center">
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
            <TabsList className="w-full md:w-auto h-10 md:h-12 justify-center">
              <TabsTrigger value="overview" className="flex-1 md:flex-none text-xs md:text-base">Overview</TabsTrigger>
              <TabsTrigger value="fleet" className="flex-1 md:flex-none text-xs md:text-base">Fleet</TabsTrigger>
              <TabsTrigger value="depots" className="flex-1 md:flex-none text-xs md:text-base">Depots</TabsTrigger>
              <TabsTrigger value="incidents" className="flex-1 md:flex-none text-xs md:text-base">
                Incidents
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex-1 md:flex-none text-xs md:text-base">
                <span className="md:hidden">Maint.</span>
                <span className="hidden md:inline">Maintenance</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 md:flex-none text-xs md:text-base">Analytics</TabsTrigger>
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
                    // Add a delay to ensure tab switches first
                    setTimeout(() => {
                      const element = document.getElementById(`vehicle-${vehicleId}`);
                      if (element) {
                        element.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center'
                        });
                        // Highlight the selected vehicle temporarily
                        element.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                        setTimeout(() => {
                          element.style.backgroundColor = '';
                        }, 2000);
                      }
                    }, 100);
                  }} onDepotClick={depotId => {
                    setSelectedTab('depots');
                    // Add a delay to ensure tab switches first
                    setTimeout(() => {
                      const element = document.getElementById(`depot-${depotId}`);
                      if (element) {
                        element.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center'
                        });
                        // Highlight the selected depot temporarily
                        element.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                        setTimeout(() => {
                          element.style.backgroundColor = '';
                        }, 2000);
                      }
                    }, 100);
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
            <OTTOQFleetView selectedCityName={selectedCityForOTTOQ} />
          </TabsContent>

          <TabsContent value="depots" className="space-y-6">
            <OTTOQDepotView selectedCityName={selectedCityForOTTOQ} />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Maintenance & Detailing</h2>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-3xl mx-auto">
              <Button variant="outline" className="bg-warning/5 border-warning/30 text-warning hover:bg-warning/10 w-full sm:w-80 md:w-96 h-10 sm:h-14 md:h-16 text-sm sm:text-base" onClick={() => setShowDueSoonSummary(true)}>
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2" />
                Due Soon Summary ({vehicles.slice(0, 3).length} vehicles)
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ml-2" />
              </Button>
              
              <Button className="bg-gradient-primary hover:bg-primary-hover w-full sm:w-80 md:w-96 h-10 sm:h-14 md:h-16 text-sm sm:text-base" onClick={() => handleMaintenanceSchedule(vehicles[0])}>
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2" />
                Schedule Maintenance
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Upcoming Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     {vehicles.slice(0, 8).map((vehicle, index) => <div key={vehicle.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                         <div className="flex items-center space-x-3">
                           <div className="flex flex-col items-center space-y-1">
                             <AlertTriangle className="h-4 w-4 text-warning" />
                             <Wrench className="h-3 w-3 text-muted-foreground" />
                           </div>
                           <div>
                             <p className="font-medium">{vehicle.name} - Routine Service</p>
                             <p className="text-sm text-muted-foreground">Due: {vehicle.nextMaintenance}</p>
                           </div>
                         </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {index < 3 ? 'Due Soon' : 'Scheduled'}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => handleMaintenanceSchedule(vehicle)} className="w-20">
                              Schedule
                            </Button>
                          </div>
                       </div>)}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Detailing Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     {vehicles.slice(8, 16).map((vehicle, index) => <div key={vehicle.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                         <div className="flex items-center space-x-3">
                           <div className="flex flex-col items-center space-y-1">
                             <CheckCircle2 className="h-4 w-4 text-accent" />
                             <Calendar className="h-3 w-3 text-muted-foreground" />
                           </div>
                           <div>
                             <p className="font-medium">{vehicle.name} - Interior/Exterior Clean</p>
                             <p className="text-sm text-muted-foreground">
                               {index < 4 ? `Completed: 2024-08-${15 + index}` : `Scheduled: 2024-08-${25 + index}`}
                             </p>
                           </div>
                         </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="outline" className={index < 4 ? "bg-success/10 text-success border-success/20" : "bg-accent/10 text-accent border-accent/20"}>
                              {index < 4 ? 'Complete' : 'Scheduled'}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => handleMaintenanceSchedule(vehicle)} className="w-20">
                              Schedule
                            </Button>
                          </div>
                       </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Fleet Analytics</h2>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
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
                  <CardTitle>Fleet Status Distribution (Total: {vehicles.length} vehicles)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={[{
                        name: 'Active',
                        value: vehicles.filter(v => v.status === 'active').length,
                        fill: 'hsl(var(--success))'
                      }, {
                        name: 'Charging',
                        value: vehicles.filter(v => v.status === 'charging').length,
                        fill: 'hsl(var(--primary))'
                      }, {
                        name: 'Maintenance',
                        value: vehicles.filter(v => v.status === 'maintenance').length,
                        fill: 'hsl(var(--warning))'
                      }, {
                        name: 'Idle',
                        value: vehicles.filter(v => v.status === 'idle').length,
                        fill: 'hsl(var(--muted-foreground))'
                      }]} cx="50%" cy="50%" labelLine={false} label={({
                        name,
                        percent,
                        value
                      }) => window.innerWidth >= 768 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : `${value}`} outerRadius={80} fill="#8884d8" dataKey="value" />
                          <Tooltip formatter={(value, name) => [`${value} vehicles`, name]} contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px hsl(var(--muted) / 0.15)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'hsl(var(--destructive))'
                      }} labelStyle={{
                        color: 'hsl(var(--destructive))'
                      }} itemStyle={{
                        color: 'hsl(var(--destructive))'
                      }} />
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
    </div>;
};
export default Index;