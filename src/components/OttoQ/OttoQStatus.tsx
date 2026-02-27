import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationsOverview, EnergyDashboard, PredictionPerformance } from "@/components/FleetCommand/OttoQIntelligence";
import DepotFloorPlan from "@/components/OttoQ/DepotMap/DepotFloorPlan";
import QueueManager from "@/components/OttoQ/QueueManager";
import { Activity, Zap, Target, Map, ListOrdered } from "lucide-react";

const subTabs = [
  { value: "operations", label: "Operations", icon: Activity },
  { value: "energy", label: "Energy", icon: Zap },
  { value: "predictions", label: "Predictions", icon: Target },
  { value: "depot-map", label: "Depot Map", icon: Map },
  { value: "queue", label: "Queue", icon: ListOrdered },
] as const;

export default function OttoQStatus() {
  const [activeTab, setActiveTab] = useState("operations");

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-3">
          <div className="surface-luxury rounded-2xl p-1 md:p-1.5 max-w-full md:max-w-lg w-full mx-auto">
            <TabsList className="flex overflow-x-auto scrollbar-hide flex-nowrap md:grid md:grid-cols-5 w-full bg-transparent h-auto p-0">
              {subTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-shrink-0 flex items-center justify-center rounded-xl px-2 md:px-3 py-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-muted-foreground bg-transparent transition-all duration-300 hover:bg-muted/30 hover:text-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:border data-[state=active]:border-primary/25 data-[state=active]:shadow-[0_0_12px_hsl(var(--primary)/0.1)] relative"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <TabsContent value="operations" className="animate-fade-in-up">
          <OperationsOverview />
        </TabsContent>
        <TabsContent value="energy" className="animate-fade-in-up">
          <EnergyDashboard />
        </TabsContent>
        <TabsContent value="predictions" className="animate-fade-in-up">
          <PredictionPerformance />
        </TabsContent>
        <TabsContent value="depot-map" className="animate-fade-in-up">
          <DepotFloorPlan depotId="demo" />
        </TabsContent>
        <TabsContent value="queue" className="animate-fade-in-up">
          <QueueManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
