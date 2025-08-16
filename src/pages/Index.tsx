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
import VehicleCard from "@/components/VehicleCard";
import DepotCard from "@/components/DepotCard";
import MetricsCard from "@/components/MetricsCard";

// Mock data for demonstration
const vehicles = [
  {
    id: "OY-001",
    name: "OTTOYARD Alpha",
    status: "active",
    battery: 87,
    location: { lat: 37.7749, lng: -122.4194 },
    route: "Downtown Delivery",
    chargingTime: "2h 15m",
    nextMaintenance: "2024-08-20"
  },
  {
    id: "OY-002", 
    name: "OTTOYARD Beta",
    status: "charging",
    battery: 34,
    location: { lat: 37.7849, lng: -122.4094 },
    route: "Warehouse Route A",
    chargingTime: "45m",
    nextMaintenance: "2024-08-25"
  },
  {
    id: "OY-003",
    name: "OTTOYARD Gamma", 
    status: "maintenance",
    battery: 92,
    location: { lat: 37.7649, lng: -122.4294 },
    route: "Port Transfer",
    chargingTime: "N/A",
    nextMaintenance: "In Progress"
  }
];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">OTTOYARD</h1>
                <p className="text-sm text-muted-foreground">Fleet Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <Activity className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fleet">Fleet</TabsTrigger>
            <TabsTrigger value="depots">Depots</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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
                <FleetMap vehicles={vehicles} />
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
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
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
              <h2 className="text-3xl font-bold text-foreground">Maintenance Schedule</h2>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>
            
            <Card className="shadow-fleet-md">
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">OTTOYARD Alpha - Routine Service</p>
                        <p className="text-sm text-muted-foreground">Due: August 20, 2024</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Due Soon
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">OTTOYARD Gamma - Battery Check</p>
                        <p className="text-sm text-muted-foreground">Completed: August 15, 2024</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Complete
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
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