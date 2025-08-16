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
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
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
      nextMaintenance: status === 'maintenance' ? 'In Progress' : `2024-08-${Math.floor(Math.random() * 30) + 1}`
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
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
              <MetricsCard 
                title="Energy Generated"
                value="4.2 MWh"
                change="+15%"
                trend="up"
                icon={Zap}
              />
              <MetricsCard 
                title="Grid Return"
                value="2.1 MWh"
                change="+8%"
                trend="up"
                icon={TrendingUp}
              />
              <MetricsCard 
                title="Fleet Efficiency"
                value="94.2%"
                change="+3.1%"
                trend="up"
                icon={Activity}
              />
            </div>

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
                      Fleet Status
                    </span>
                    <Button variant="ghost" size="sm">
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
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Analytics Chart Placeholder
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-fleet-md">
                <CardHeader>
                  <CardTitle>Fleet Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Utilization Chart Placeholder
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