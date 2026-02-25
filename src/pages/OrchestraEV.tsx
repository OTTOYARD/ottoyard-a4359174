import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/shared/AppHeader";
import { OttoCommandPanel } from "@/components/OttoCommand";
import { EVOverview } from "@/components/orchestra-ev/EVOverview";
import { EVDepotQ } from "@/components/orchestra-ev/EVDepotQ";
import { EVServices } from "@/components/orchestra-ev/EVServices";
import { EVTowing } from "@/components/orchestra-ev/EVTowing";

import { EVReports } from "@/components/orchestra-ev/EVReports";
import { LayoutDashboard, Building2, Wrench, Truck, BarChart3 } from "lucide-react";

// Mock data
import {
  mockSubscriber,
  mockVehicle,
  mockServiceRecords,
  mockMaintenancePredictions,
  mockTowRequests,
  mockAmenityReservations,
  mockDepotServiceStages,
  mockNotifications,
  mockEvents,
  mockAmenityAvailability,
} from "@/lib/orchestra-ev/mockData";

import type { City } from "@/components/CitySearchBar";

// Default city for OrchestraEV (subscriber's home city)
const defaultCity: City = {
  name: "Nashville",
  coordinates: [-86.7816, 36.1627],
  country: "USA",
};

const tabItems = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "depot-q", label: "Depot", icon: Building2 },
  { value: "services", label: "Services", icon: Wrench },
  { value: "towing", label: "OTTOW", icon: Truck },
  { value: "reports", label: "Reports", icon: BarChart3 },
] as const;

const OrchestraEV = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [aiAgentOpen, setAiAgentOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Shared Header */}
      <AppHeader
        appName="OrchestraEV1"
        currentCity={defaultCity}
        onOpenAI={() => setAiAgentOpen(true)}
      />

      {/* Main Content */}
      <div className="px-3 pb-3">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="flex justify-center mb-3">
            <div className="surface-luxury rounded-2xl p-1.5 max-w-lg w-full mx-auto">
              <TabsList className="flex overflow-x-auto scrollbar-hide flex-nowrap md:grid md:grid-cols-5 w-full bg-transparent h-auto p-0 gap-0.5">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-3 md:px-4 py-2.5 text-xs font-medium tracking-wide uppercase text-muted-foreground bg-transparent transition-all duration-300 ease-out hover:bg-muted/30 hover:text-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:border data-[state=active]:border-primary/25 data-[state=active]:shadow-[0_0_12px_hsl(var(--primary)/0.1)] relative"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="animate-fade-in-up">
            <EVOverview subscriber={mockSubscriber} vehicle={mockVehicle} serviceRecords={mockServiceRecords} notifications={mockNotifications} events={mockEvents} predictions={mockMaintenancePredictions} amenityAvailability={mockAmenityAvailability} amenityReservations={mockAmenityReservations} onTabChange={setSelectedTab} />
          </TabsContent>

          <TabsContent value="depot-q" className="animate-fade-in-up">
            <EVDepotQ depotStages={mockDepotServiceStages} vehicle={mockVehicle} />
          </TabsContent>

          <TabsContent value="services" className="animate-fade-in-up">
            <EVServices serviceRecords={mockServiceRecords} predictions={mockMaintenancePredictions} />
          </TabsContent>

          <TabsContent value="towing" className="animate-fade-in-up">
            <EVTowing towRequests={mockTowRequests} />
          </TabsContent>

          <TabsContent value="reports" className="animate-fade-in-up">
            <EVReports serviceRecords={mockServiceRecords} />
          </TabsContent>
        </Tabs>
      </div>

      {/* OttoCommand AI Agent */}
      <OttoCommandPanel
        open={aiAgentOpen}
        onOpenChange={setAiAgentOpen}
        mode="ev"
        evContext={{
          subscriber: mockSubscriber,
          vehicle: mockVehicle,
          serviceRecords: mockServiceRecords,
          amenityAvailability: mockAmenityAvailability,
          amenityReservations: mockAmenityReservations,
          depotStages: mockDepotServiceStages,
        }}
        currentCity={defaultCity}
      />
    </div>
  );
};

export default OrchestraEV;
