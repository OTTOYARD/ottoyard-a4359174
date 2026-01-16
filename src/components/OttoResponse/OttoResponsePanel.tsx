import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Radio } from 'lucide-react';
import { useOttoResponseStore, TrafficSeverity } from '@/stores/ottoResponseStore';
import { useOttoResponseData, calculateZoneAnalytics, updateSafeHarborDistances } from '@/hooks/useOttoResponseData';
import { OttoResponseMap, MapInteractionState } from './OttoResponseMap';
import { AdvisoryBuilder } from './AdvisoryBuilder';
import { AdvisoryLog } from './AdvisoryLog';
import { cn } from '@/lib/utils';

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
    trafficSeverity,
    setTrafficSeverity
  } = useOttoResponseStore();

  // Map interaction states
  const [mapState, setMapState] = useState<MapInteractionState>('collapsed');
  const [zoneConfirmed, setZoneConfirmed] = useState(false);

  // Reset map state when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      setMapState('collapsed');
      setZoneConfirmed(false);
      
      // Auto-generate random traffic severity
      const severities: TrafficSeverity[] = ['Low', 'Medium', 'High'];
      const weights = [0.2, 0.5, 0.3]; // 20% Low, 50% Medium, 30% High
      const random = Math.random();
      let cumulative = 0;
      for (let i = 0; i < severities.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
          setTrafficSeverity(severities[i]);
          break;
        }
      }
    }
  }, [isPanelOpen, setTrafficSeverity]);

  // Handle reset from AdvisoryBuilder - reset map state too
  const handleMapReset = () => {
    setMapState('collapsed');
    setZoneConfirmed(false);
  };

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

  return (
    <Sheet open={isPanelOpen} onOpenChange={open => !open && closePanel()}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] md:max-w-[1100px] p-0 flex flex-col pt-8 md:pt-0">
        <SheetHeader className="px-4 md:px-6 py-3 md:py-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base md:text-xl font-bold">OTTO-RESPONSE</SheetTitle>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Advisory Protocol</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <Badge variant="outline" className="flex items-center gap-1 text-[10px] md:text-xs px-1.5 md:px-2.5">
                <Radio className="h-2 w-2 md:h-3 md:w-3 animate-pulse" />
                Live
              </Badge>
              <Badge className={`text-[10px] md:text-xs px-1.5 md:px-2.5 ${getSeverityColor(trafficSeverity)}`}>
                {trafficSeverity}
              </Badge>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="advisory" className="h-full flex flex-col">
            <div className="pt-2 border-b border-border flex flex-col items-center px-2 md:px-3 pb-2 md:pb-3">
              <TabsList className="grid max-w-[300px] w-full grid-cols-2 h-8 md:h-9">
                <TabsTrigger value="advisory" className="text-xs md:text-sm px-2 md:px-4">Builder</TabsTrigger>
                <TabsTrigger value="log" className="text-xs md:text-sm px-2 md:px-4">Log</TabsTrigger>
              </TabsList>
              <h2 className="text-base md:text-xl font-bold text-center mt-2 md:mt-3">Incident Management</h2>
              <p className="text-xs md:text-sm text-muted-foreground text-center">Active response protocols</p>
            </div>
            
            <TabsContent value="advisory" className="flex-1 overflow-hidden m-0 data-[state=active]:flex">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Map Section - Dynamic height based on state */}
                <div className={cn(
                  "border-b md:border-b-0 md:border-r border-border transition-all duration-300 ease-in-out",
                  mapState === 'expanded' 
                    ? "min-h-[50vh] md:min-h-0 md:flex-1" 
                    : "h-[180px] md:h-[200px] shrink-0"
                )}>
                  <OttoResponseMap 
                    vehicles={vehicles} 
                    mapState={mapState}
                    onMapStateChange={setMapState}
                    zoneConfirmed={zoneConfirmed}
                    onZoneConfirmed={setZoneConfirmed}
                  />
                </div>
                
                {/* Builder Section - Takes remaining space */}
                <div className={cn(
                  "flex-1 overflow-hidden flex flex-col",
                  mapState === 'expanded' ? "md:w-1/2" : "md:flex-1"
                )}>
                  <AdvisoryBuilder safeHarbors={harborsWithDistances} onReset={handleMapReset} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="log" className="flex-1 overflow-hidden m-0 data-[state=active]:flex">
              <ScrollArea className="flex-1">
                <div className="p-3 md:p-4">
                  <AdvisoryLog />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}