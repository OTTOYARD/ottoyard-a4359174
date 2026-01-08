import { useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Radio } from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';
import { useOttoResponseData, calculateZoneAnalytics, updateSafeHarborDistances } from '@/hooks/useOttoResponseData';
import { OttoResponseMap } from './OttoResponseMap';
import { AdvisoryBuilder } from './AdvisoryBuilder';
import { AdvisoryLog } from './AdvisoryLog';
interface OttoResponsePanelProps {
  vehicles?: any[];
  depots?: any[];
}
export function OttoResponsePanel({
  vehicles: externalVehicles,
  depots: externalDepots
}: OttoResponsePanelProps) {
  const {
    isPanelOpen,
    closePanel,
    drawnZone,
    updateZoneAnalytics,
    trafficSeverity
  } = useOttoResponseStore();
  const {
    vehicles,
    safeHarbors
  } = useOttoResponseData(externalVehicles, externalDepots);

  // Recalculate zone analytics when zone or vehicles change
  useEffect(() => {
    const analytics = calculateZoneAnalytics(vehicles, drawnZone);
    updateZoneAnalytics(analytics.inside, analytics.near);
  }, [vehicles, drawnZone, updateZoneAnalytics]);

  // Update safe harbor distances when zone changes
  const harborsWithDistances = useMemo(() => {
    return updateSafeHarborDistances(safeHarbors, drawnZone);
  }, [safeHarbors, drawnZone]);
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-destructive text-destructive-foreground';
      case 'Medium':
        return 'bg-warning text-warning-foreground';
      case 'Low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  return <Sheet open={isPanelOpen} onOpenChange={open => !open && closePanel()}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] md:max-w-[1100px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold">OTTO-RESPONSE</SheetTitle>
                <p className="text-sm text-muted-foreground">Advisory Protocol</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </Badge>
              <Badge className={getSeverityColor(trafficSeverity)}>
                Traffic: {trafficSeverity}
              </Badge>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="advisory" className="h-full flex flex-col">
            <div className="pt-2 border-b border-border flex-row flex items-start justify-center px-[12px]">
              <TabsList className="grid max-w-[400px] grid-cols-2">
                <TabsTrigger value="advisory">Advisory Builder</TabsTrigger>
                <TabsTrigger value="log">Advisory Log</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="advisory" className="flex-1 overflow-hidden m-0 data-[state=active]:flex">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Map Section */}
                <div className="flex-1 md:w-1/2 h-[300px] md:h-auto border-b md:border-b-0 md:border-r border-border">
                  <OttoResponseMap vehicles={vehicles} />
                </div>
                
                {/* Builder Section */}
                <div className="flex-1 md:w-1/2 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <AdvisoryBuilder safeHarbors={harborsWithDistances} />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="log" className="flex-1 overflow-hidden m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <AdvisoryLog />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>;
}