import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Battery, 
  Zap, 
  Truck, 
  Calendar, 
  TrendingUp,
  Activity,
  Settings,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import FleetMap from "@/components/FleetMap";
import MapboxMap from "@/components/MapboxMap";
import SettingsDialog from "@/components/SettingsDialog";
import VehicleCard from "@/components/VehicleCard";
import DepotCard from "@/components/DepotCard";
import MetricsCard from "@/components/MetricsCard";

// Generate 45 vehicles with unique 5-digit alphanumeric IDs
const generateVehicles = () => {
  const statuses = ['active', 'charging', 'maintenance', 'idle'];
  const routes = [
    'Downtown Delivery', 'Warehouse Route A', 'Port Transfer', 'Industrial Zone B',
    'Airport Cargo', 'Highway Distribution', 'City Center Loop', 'Suburban Route',
    'Cross-town Express', 'Harbor District', 'Tech Park Circuit', 'Mall Complex',
    'University Campus', 'Hospital Route', 'Financial District'
  ];
  
  const vehicles = [];
  for (let i = 0; i < 45; i++) {
    // Generate unique 5-digit alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let j = 0; j < 5; j++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const battery = Math.floor(Math.random() * 100);
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    // Generate random SF Bay Area coordinates
    const lat = 37.7749 + (Math.random() - 0.5) * 0.2;
    const lng = -122.4194 + (Math.random() - 0.5) * 0.3;
    
    vehicles.push({
      id,
      name: `OTTOYARD ${id}`,
      status,
      battery,
      location: { lat, lng },
      route,
      chargingTime: status === 'charging' ? `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m` : 'N/A',
      nextMaintenance: status === 'maintenance' ? 'In Progress' : `2025-${Math.random() < 0.5 ? '10' : '12'}-${Math.floor(Math.random() * 28) + 1}`
    });
  }
  return vehicles;
};

const vehicles = generateVehicles();

const depots = [
  {
    id: "depot-1",
    name: "OTTOYARD Central",
    energyGenerated: 2400,
    energyReturned: 1200,
    vehiclesCharging: 3,
    status: "optimal"
  },
  {
    id: "depot-2", 
    name: "OTTOYARD North",
    energyGenerated: 1800,
    energyReturned: 950,
    vehiclesCharging: 2,
    status: "optimal"
  }
];

const Index = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [overviewView, setOverviewView] = useState<'main' | 'vehicles' | 'energy' | 'grid' | 'efficiency'>('main');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                <img src="/lovable-uploads/28eaaca9-b235-45e8-8e35-5ddc069f02f8.png" alt="OTTOYARD Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">OTTOYARD</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Fleet Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 hidden sm:flex">
                <Activity className="h-3 w-3 mr-1" />
                <span className="hidden md:inline">All Systems Operational</span>
                <span className="md:hidden">Online</span>
              </Badge>
              <SettingsDialog>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </SettingsDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max min-w-full h-10">
              <TabsTrigger value="overview" className="whitespace-nowrap px-4">Overview</TabsTrigger>
              <TabsTrigger value="fleet" className="whitespace-nowrap px-4">Fleet</TabsTrigger>
              <TabsTrigger value="depots" className="whitespace-nowrap px-4">Depots</TabsTrigger>
              <TabsTrigger value="maintenance" className="whitespace-nowrap px-4">Maintenance</TabsTrigger>
              <TabsTrigger value="analytics" className="whitespace-nowrap px-4">Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard 
                title="Active Vehicles"
                value="12"
                change="+2"
                trend="up"
                icon={Truck}
              />
              <div onClick={() => setOverviewView('energy')} className="cursor-pointer">
                <MetricsCard 
                  title="Energy Generated"
                  value="4.2 MWh"
                  change="+15%"
                  trend="up"
                  icon={Zap}
                />
              </div>
              <div onClick={() => setOverviewView('grid')} className="cursor-pointer">
                <MetricsCard 
                  title="Grid Return"
                  value="2.1 MWh"
                  change="+8%"
                  trend="up"
                  icon={TrendingUp}
                />
              </div>
              <div onClick={() => setOverviewView('efficiency')} className="cursor-pointer">
                <MetricsCard 
                  title="Fleet Efficiency"
                  value="94.2%"
                  change="+3.1%"
                  trend="up"
                  icon={Activity}
                />
              </div>
            </div>

            {overviewView === 'main' && (
              <>
                {/* Fleet Map */}
                <Card className="shadow-fleet-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      Live Fleet Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4">
                      <MapboxMap vehicles={vehicles} />
                    </div>
                  </CardContent>
                </Card>

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
                      {vehicles.slice(0, 3).map((vehicle) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle} compact />
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="shadow-fleet-md">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Zap className="h-5 w-5 mr-2 text-energy-grid" />
                          Depot Energy
                        </span>
                        <Button variant="ghost" size="sm">
                          View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {depots.map((depot) => (
                        <DepotCard key={depot.id} depot={depot} compact />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {overviewView === 'vehicles' && (
              <Card className="shadow-fleet-md">
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
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} 
                           className={`cursor-pointer transition-all duration-200 ${
                             selectedVehicle === vehicle.id ? 'ring-2 ring-primary' : ''
                           }`}
                           onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}>
                        <VehicleCard vehicle={vehicle} />
                        {selectedVehicle === vehicle.id && (
                          <div className="mt-2 p-3 bg-card border border-border rounded-lg">
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
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {overviewView === 'energy' && (
              <Card className="shadow-fleet-md">
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
              </Card>
            )}

            {overviewView === 'grid' && (
              <Card className="shadow-fleet-md">
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
              </Card>
            )}

            {overviewView === 'efficiency' && (
              <Card className="shadow-fleet-md">
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
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Fleet Management</h2>
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                <Truck className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} 
                     className={`cursor-pointer transition-all duration-200 ${
                       selectedVehicle === vehicle.id ? 'ring-2 ring-primary' : ''
                     }`}
                     onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}>
                  <VehicleCard vehicle={vehicle} />
                  {selectedVehicle === vehicle.id && (
                    <div className="mt-2 p-3 bg-card border border-border rounded-lg">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="depots" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Energy Depots</h2>
              <Button className="bg-gradient-energy hover:bg-accent-hover">
                <Zap className="h-4 w-4 mr-2" />
                Add Depot
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {depots.map((depot) => (
                <DepotCard key={depot.id} depot={depot} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Maintenance & Detailing</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Detailing
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Upcoming Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vehicles.slice(0, 8).map((vehicle, index) => (
                      <div key={vehicle.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          <div>
                            <p className="font-medium">{vehicle.name} - Routine Service</p>
                            <p className="text-sm text-muted-foreground">Due: {vehicle.nextMaintenance}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          {index < 3 ? 'Due Soon' : 'Scheduled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Detailing Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vehicles.slice(8, 16).map((vehicle, index) => (
                      <div key={vehicle.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                          <div>
                            <p className="font-medium">{vehicle.name} - Interior/Exterior Clean</p>
                            <p className="text-sm text-muted-foreground">
                              {index < 4 ? `Completed: 2024-08-${15 + index}` : `Scheduled: 2024-08-${25 + index}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={index < 4 
                          ? "bg-success/10 text-success border-success/20" 
                          : "bg-accent/10 text-accent border-accent/20"}>
                          {index < 4 ? 'Complete' : 'Scheduled'}
                        </Badge>
                      </div>
                    ))}
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
                  <CardTitle>Energy Efficiency Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', efficiency: 88 },
                        { month: 'Feb', efficiency: 89 },
                        { month: 'Mar', efficiency: 91 },
                        { month: 'Apr', efficiency: 93 },
                        { month: 'May', efficiency: 92 },
                        { month: 'Jun', efficiency: 94 },
                        { month: 'Jul', efficiency: 95 },
                        { month: 'Aug', efficiency: 94 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[85, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Fleet Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: vehicles.filter(v => v.status === 'active').length, fill: 'hsl(var(--success))' },
                            { name: 'Charging', value: vehicles.filter(v => v.status === 'charging').length, fill: 'hsl(var(--primary))' },
                            { name: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, fill: 'hsl(var(--warning))' },
                            { name: 'Idle', value: vehicles.filter(v => v.status === 'idle').length, fill: 'hsl(var(--muted-foreground))' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Daily Energy Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { day: 'Mon', generated: 2.8, returned: 1.2 },
                        { day: 'Tue', generated: 3.2, returned: 1.4 },
                        { day: 'Wed', generated: 2.9, returned: 1.1 },
                        { day: 'Thu', generated: 3.5, returned: 1.6 },
                        { day: 'Fri', generated: 3.1, returned: 1.3 },
                        { day: 'Sat', generated: 2.6, returned: 1.0 },
                        { day: 'Sun', generated: 2.4, returned: 0.9 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="generated" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="returned" stackId="2" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
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
                      <BarChart data={[
                        { range: '0-20%', count: vehicles.filter(v => v.battery <= 20).length },
                        { range: '21-40%', count: vehicles.filter(v => v.battery > 20 && v.battery <= 40).length },
                        { range: '41-60%', count: vehicles.filter(v => v.battery > 40 && v.battery <= 60).length },
                        { range: '61-80%', count: vehicles.filter(v => v.battery > 60 && v.battery <= 80).length },
                        { range: '81-100%', count: vehicles.filter(v => v.battery > 80).length }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;