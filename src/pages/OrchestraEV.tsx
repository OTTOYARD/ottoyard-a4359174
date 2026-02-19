import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/shared/AppHeader";
import { AIAgentPopup } from "@/components/AIAgentPopup";
import { EVOverview } from "@/components/orchestra-ev/EVOverview";
import { EVDepotQ } from "@/components/orchestra-ev/EVDepotQ";
import { EVServices } from "@/components/orchestra-ev/EVServices";
import { EVTowing } from "@/components/orchestra-ev/EVTowing";

import { EVReports } from "@/components/orchestra-ev/EVReports";

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
            <TabsList className="flex overflow-x-auto md:grid md:grid-cols-5 w-full max-w-xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="depot-q">Depot</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="towing">OTTOW</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <EVOverview subscriber={mockSubscriber} vehicle={mockVehicle} serviceRecords={mockServiceRecords} notifications={mockNotifications} events={mockEvents} predictions={mockMaintenancePredictions} amenityAvailability={mockAmenityAvailability} amenityReservations={mockAmenityReservations} onTabChange={setSelectedTab} />
          </TabsContent>

          <TabsContent value="depot-q">
            <EVDepotQ depotStages={mockDepotServiceStages} vehicle={mockVehicle} />
          </TabsContent>

          <TabsContent value="services">
            <EVServices serviceRecords={mockServiceRecords} predictions={mockMaintenancePredictions} />
          </TabsContent>

          <TabsContent value="towing">
            <EVTowing towRequests={mockTowRequests} />
          </TabsContent>

          <TabsContent value="reports">
            <EVReports serviceRecords={mockServiceRecords} />
          </TabsContent>
        </Tabs>
      </div>

      {/* OttoCommand AI Agent */}
      <AIAgentPopup
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
