import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Battery, Zap, Truck, Calendar, TrendingUp, Activity, Settings, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2, Wrench, Bot, Eye } from "lucide-react";
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

// Generate vehicles for specific city with unique 5-digit alphanumeric IDs
const generateVehiclesForCity = (city: City) => {
  const statuses = ['active', 'charging', 'maintenance', 'idle'];
  const routes = ['Downtown Delivery', 'Warehouse Route A', 'Port Transfer', 'Industrial Zone B', 'Airport Cargo', 'Highway Distribution', 'City Center Loop', 'Suburban Route', 'Cross-town Express', 'Harbor District', 'Tech Park Circuit', 'Mall Complex', 'University Campus', 'Hospital Route', 'Financial District'];
  const avCompanies = ['Waymo', 'Zoox', 'Tensor', 'Cruise', 'Aurora', 'Argo AI', 'Nuro', 'Mobileye', 'Motional', 'Waymo'];
  const vehicles = [];
  const vehicleCount = Math.floor(Math.random() * 20) + 30; // 30-50 vehicles per city

  for (let i = 0; i < vehicleCount; i++) {
    // Generate unique 5-digit alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let j = 0; j < 5; j++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const battery = Math.floor(Math.random() * 100);
    const route = routes[Math.floor(Math.random() * routes.length)];
    const company = avCompanies[Math.floor(Math.random() * avCompanies.length)];

    // Generate random coordinates around the city center
    const lat = city.coordinates[1] + (Math.random() - 0.5) * 0.2;
    const lng = city.coordinates[0] + (Math.random() - 0.5) * 0.3;
    vehicles.push({
      id,
      name: `${company} ${id}`,
      status,
      battery,
      location: {
        lat,
        lng
      },
      route,
      chargingTime: status === 'charging' ? `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m` : 'N/A',
      nextMaintenance: status === 'maintenance' ? 'In Progress' : `2025-${Math.random() < 0.5 ? '10' : '12'}-${Math.floor(Math.random() * 28) + 1}`
    });
  }
  return vehicles;
};
const depots = [{
  id: "depot-1",
  name: "OTTOYARD Central",
  energyGenerated: 2400,
  energyReturned: 1200,
  vehiclesCharging: 8,
  totalStalls: 42,
  availableStalls: 34,
  status: "optimal"
}, {
  id: "depot-2",
  name: "OTTOYARD North",
  energyGenerated: 1800,
  energyReturned: 950,
  vehiclesCharging: 6,
  totalStalls: 35,
  availableStalls: 29,
  status: "optimal"
}, {
  id: "depot-3",
  name: "OTTOYARD East",
  energyGenerated: 2100,
  energyReturned: 1100,
  vehiclesCharging: 12,
  totalStalls: 38,
  availableStalls: 26,
  status: "optimal"
}, {
  id: "depot-4",
  name: "OTTOYARD West",
  energyGenerated: 1900,
  energyReturned: 850,
  vehiclesCharging: 4,
  totalStalls: 30,
  availableStalls: 26,
  status: "maintenance"
}, {
  id: "depot-5",
  name: "OTTOYARD South",
  energyGenerated: 2200,
  energyReturned: 1150,
  vehiclesCharging: 9,
  totalStalls: 45,
  availableStalls: 36,
  status: "optimal"
}, {
  id: "depot-6",
  name: "OTTOYARD Harbor",
  energyGenerated: 1600,
  energyReturned: 780,
  vehiclesCharging: 7,
  totalStalls: 32,
  availableStalls: 25,
  status: "optimal"
}, {
  id: "depot-7",
  name: "OTTOYARD Airport",
  energyGenerated: 2500,
  energyReturned: 1300,
  vehiclesCharging: 15,
  totalStalls: 50,
  availableStalls: 35,
  status: "optimal"
}];
const Index = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedDepot, setSelectedDepot] = useState<string | null>(null);
  const [overviewView, setOverviewView] = useState<'main' | 'vehicles' | 'energy' | 'grid' | 'efficiency'>('main');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [currentCity, setCurrentCity] = useState<City>({
    name: "San Francisco",
    coordinates: [-122.4194, 37.7749],
    country: "USA"
  });
  const [vehicles, setVehicles] = useState(() => generateVehiclesForCity({
    name: "San Francisco",
    coordinates: [-122.4194, 37.7749],
    country: "USA"
  }));

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
  const handleCitySelect = (city: City) => {
    setCurrentCity(city);
    setVehicles(generateVehiclesForCity(city));
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:py-6 py-[18px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                <img src="/lovable-uploads/0802aeb6-e42e-4389-8e93-c10d17cf963e.png" alt="Fleet Command Logo" className="h-14 w-14 sm:h-18 sm:w-18" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate text-center">OTTOYARD</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate text-center">Fleet Command</p>
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
                <CartButton 
                  cartItems={cartItems}
                  onRemoveItem={handleRemoveFromCart}
                  onCheckout={handleCheckout}
                />
              </div>
              
              {/* Bottom Row: Status + AI */}
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="hidden md:inline">All Systems Operational</span>
                  <span className="md:hidden">Online</span>
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAiAgentOpen(true)} 
                  className="bg-gradient-primary text-white border-0 hover:bg-gradient-primary/90"
                >
                  <Bot className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">FieldOps AI</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <div className="overflow-x-auto scrollbar-hide pb-2 md:overflow-visible">
              <TabsList className="inline-flex w-max h-12 min-w-full md:min-w-0 md:w-auto justify-start md:justify-center">
                <TabsTrigger value="overview" className="whitespace-nowrap px-4 sm:px-5 text-base flex-shrink-0">Overview</TabsTrigger>
                <TabsTrigger value="fleet" className="whitespace-nowrap px-4 sm:px-5 text-base flex-shrink-0">Fleet</TabsTrigger>
                <TabsTrigger value="depots" className="whitespace-nowrap px-4 sm:px-5 text-base flex-shrink-0">Depots</TabsTrigger>
                <TabsTrigger value="maintenance" className="whitespace-nowrap px-4 sm:px-5 text-base flex-shrink-0">Maintenance</TabsTrigger>
                <TabsTrigger value="analytics" className="whitespace-nowrap px-4 sm:px-5 text-base flex-shrink-0">Analytics</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {overviewView === 'main' && <>
                {/* Fleet Map */}
                <Card className="shadow-fleet-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-primary" />
                        Live Fleet Tracking
                      </CardTitle>
                      <CitySearchBar currentCity={currentCity} onCitySelect={handleCitySelect} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-[500px]">
                      <MapboxMap vehicles={vehicles} city={currentCity} onVehicleClick={vehicleId => {
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
                  <h2 className="text-xl font-semibold text-foreground">Quick Glance</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricsCard title="Active Vehicles" value="12" change="+2" trend="up" icon={Truck} onClick={() => setOverviewView('vehicles')} />
                    <MetricsCard title="Energy & Grid" value="4.2 MWh" change="+15%" trend="up" icon={Zap} secondaryValue="2.1 MWh returned" secondaryLabel="Grid Return" onClick={() => setOverviewView('energy')} />
                    <MetricsCard title="Fleet Efficiency" value="94.2%" change="+3.1%" trend="up" icon={Activity} onClick={() => setOverviewView('efficiency')} />
                    <MetricsCard title="Scheduled Services" value="8" change="+3" trend="up" icon={Wrench} secondaryValue="2 today" secondaryLabel="Due Today" onClick={() => setSelectedTab('maintenance')} />
                  </div>
                </div>

                {/* Quick Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-fleet-md">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Battery className="h-5 w-5 mr-2 text-accent" />
                          Active Vehicles
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setOverviewView('vehicles')}>
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
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTab('depots')}>
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
                      <Battery className="h-5 w-5 mr-2 text-accent" />
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
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Energy Generation Chart Placeholder</p>
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
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Grid Return Chart Placeholder</p>
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
                    <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Fleet Efficiency Chart Placeholder</p>
                    </div>
                  </div>
                </CardContent>
              </Card>}
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Fleet Management</h2>
               <Button className="bg-gradient-primary hover:bg-primary-hover sm:px-6 px-3 sm:text-base text-sm" onClick={() => setAddVehicleOpen(true)}>
                 <Truck className="h-4 w-4 sm:mr-2 mr-1" />
                 <span className="sm:inline hidden">Add Vehicle</span>
                 <span className="sm:hidden inline">Add</span>
               </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map(vehicle => <div key={vehicle.id} id={`vehicle-${vehicle.id}`} className={`cursor-pointer transition-all duration-200 ${selectedVehicle === vehicle.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}>
                  <VehicleCard vehicle={vehicle} onTrack={handleTrackVehicle} onDetails={handleVehicleDetails} onSchedule={handleMaintenanceSchedule} onSendToOtto={handleSendToOtto} />
                  {selectedVehicle === vehicle.id && <div className="mt-2 p-3 bg-card border border-border rounded-lg">
                      <h4 className="font-semibold mb-2">Vehicle Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Location:</span> {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}</p>
                        <p><span className="font-medium">Last Service:</span> 2024-07-15</p>
                        <p><span className="font-medium">Total Miles:</span> {Math.floor(Math.random() * 50000 + 10000)} mi</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => handleMaintenanceSchedule(vehicle)}>
                            Schedule Maintenance
                          </Button>
                          <Button size="sm" variant="outline">Schedule Detailing</Button>
                        </div>
                      </div>
                    </div>}
                </div>)}
            </div>
          </TabsContent>

          <TabsContent value="depots" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Energy Depots</h2>
               <Button className="bg-gradient-energy hover:bg-accent-hover sm:px-6 px-3 sm:text-base text-sm">
                 <Zap className="h-4 w-4 sm:mr-2 mr-1" />
                 <span className="sm:inline hidden">Add Depot</span>
                 <span className="sm:hidden inline">Add</span>
               </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {depots.map(depot => <div key={depot.id} id={`depot-${depot.id}`} className={`cursor-pointer transition-all duration-200 ${selectedDepot === depot.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedDepot(selectedDepot === depot.id ? null : depot.id)}>
                  <DepotCard depot={depot} />
                  {selectedDepot === depot.id && <div className="mt-2 p-3 bg-card border border-border rounded-lg">
                      <h4 className="font-semibold mb-2">Depot Actions</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Available Stalls:</span> {depot.availableStalls}/{depot.totalStalls}</p>
                        <p><span className="font-medium">Current Charging:</span> {depot.vehiclesCharging} vehicles</p>
                        <p><span className="font-medium">Daily Revenue:</span> ${Math.floor(depot.energyReturned * 0.12 * 100)}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">Reserve Stall</Button>
                          <Button size="sm" variant="outline">Schedule Maintenance</Button>
                        </div>
                      </div>
                    </div>}
                </div>)}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Maintenance & Detailing</h2>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button variant="outline" className="bg-warning/5 border-warning/30 text-warning hover:bg-warning/10 w-full sm:w-auto sm:max-w-md" onClick={() => setShowDueSoonSummary(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Due Soon Summary ({vehicles.slice(0, 3).length} vehicles)
                <Eye className="h-4 w-4 ml-2" />
              </Button>
              
              <Button className="bg-gradient-primary hover:bg-primary-hover w-full sm:w-auto sm:max-w-md" onClick={() => handleMaintenanceSchedule(vehicles[0])}>
                <Wrench className="h-4 w-4 mr-2" />
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
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="50%" stopColor="hsl(var(--destructive))" stopOpacity={0.6}/>
                            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
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
                        <Area 
                          type="monotone" 
                          dataKey="efficiency" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2} 
                          fill="url(#efficiencyGradient)" 
                          name="Fleet Efficiency" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Fleet Status Distribution (Total: 45 vehicles)</CardTitle>
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
        </Tabs>
        
        {/* Popup Components */}
        <AddVehiclePopup open={addVehicleOpen} onOpenChange={setAddVehicleOpen} />
        <TrackVehiclePopup open={trackVehicleOpen} onOpenChange={setTrackVehicleOpen} vehicle={popupVehicle} />
        <VehicleDetailsPopup open={vehicleDetailsOpen} onOpenChange={setVehicleDetailsOpen} vehicle={popupVehicle} />
        <MaintenancePopup open={maintenanceOpen} onOpenChange={setMaintenanceOpen} vehicle={popupVehicle} depots={depots} onAddToCart={handleAddToCart} />
        <AIAgentPopup open={aiAgentOpen} onOpenChange={setAiAgentOpen} />

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