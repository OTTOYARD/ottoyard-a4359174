import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Radio, X } from 'lucide-react';
import { useOttoResponseStore, TrafficSeverity } from '@/stores/ottoResponseStore';
import { useOttoResponseData, calculateZoneAnalytics, updateSafeHarborDistances } from '@/hooks/useOttoResponseData';
import { useIntelligenceData } from '@/hooks/useIntelligenceData';
import { OttoResponseMap, MapInteractionState } from './OttoResponseMap';
import { AdvisoryBuilder } from './AdvisoryBuilder';
import { AdvisoryLog } from './AdvisoryLog';
import { IntelligenceFeed } from './IntelligenceFeed';
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

  // Intelligence data
  const intelligence = useIntelligenceData(externalVehicles, externalDepots);

  // Derive severity from intelligence data instead of random generation
  useEffect(() => {
    if (isPanelOpen) {
      setMapState('collapsed');
      setZoneConfirmed(false);
      
      // Derive traffic severity from intelligence events
      if (intelligence.events.length > 0) {
        const maxThreat = Math.max(...intelligence.events.map(e => e.threatScore));
        if (maxThreat >= 60) setTrafficSeverity('High');
        else if (maxThreat >= 30) setTrafficSeverity('Medium');
        else setTrafficSeverity('Low');
      } else {
        setTrafficSeverity('Low');
      }
    }
  }, [isPanelOpen, setTrafficSeverity, intelligence.events.length]);

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
      <SheetContent side="right" className="w-full sm:max-w-[900px] md:max-w-[1100px] p-0 flex flex-col pt-12 md:pt-0">
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
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <Badge variant="outline" className="flex items-center gap-1 text-[10px] md:text-xs px-1.5 md:px-2.5 border-success/50 text-success bg-success/10 shadow-[0_0_6px_1px_hsl(var(--success)/0.25)]">
                <Radio className="h-2 w-2 md:h-3 md:w-3 animate-pulse-slow" />
                Live
              </Badge>
              <Badge className={`text-[10px] md:text-xs px-1.5 md:px-2.5 ${getSeverityColor(trafficSeverity)}`}>
                {trafficSeverity}
              </Badge>
              <button
                onClick={closePanel}
                className="ml-2 md:ml-3 rounded-md p-1.5 opacity-70 hover:opacity-100 hover:bg-muted/50 transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="advisory" className="h-full flex flex-col">
            <div className="pt-2 border-b border-border flex flex-col items-center px-2 md:px-3 pb-2 md:pb-3">
              <TabsList className="grid max-w-[400px] w-full grid-cols-3 h-8 md:h-9">
                <TabsTrigger value="advisory" className="text-xs md:text-sm px-2 md:px-4">Builder</TabsTrigger>
                <TabsTrigger value="intelligence" className="text-xs md:text-sm px-2 md:px-4 relative">
                  Intel
                  {intelligence.metrics.criticalCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[9px] bg-destructive text-destructive-foreground">
                      {intelligence.metrics.criticalCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="log" className="text-xs md:text-sm px-2 md:px-4">Log</TabsTrigger>
              </TabsList>
              <h2 className="text-base md:text-xl font-bold text-center mt-2 md:mt-3">Incident Management</h2>
              <p className="text-xs md:text-sm text-muted-foreground text-center">Active response protocols</p>
            </div>
            
            <TabsContent value="advisory" className="flex-1 overflow-hidden m-0 data-[state=active]:flex">
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Map Section */}
                <div className={cn(
                  "border-b md:border-b-0 md:border-r border-border transition-all duration-300 ease-in-out overflow-hidden",
                  mapState === 'expanded' 
                    ? "flex-1 min-h-[55vh] md:min-h-0 md:min-w-[400px] md:w-1/2" 
                    : "h-[180px] md:h-auto md:min-h-[250px] md:min-w-[350px] md:w-[40%] shrink-0"
                )}>
                  <OttoResponseMap 
                    vehicles={vehicles} 
                    mapState={mapState}
                    onMapStateChange={setMapState}
                    zoneConfirmed={zoneConfirmed}
                    onZoneConfirmed={setZoneConfirmed}
                    intelligenceEvents={intelligence.events}
                  />
                </div>
                
                {/* Builder Section */}
                <div className={cn(
                  "flex-1 overflow-hidden flex flex-col",
                  mapState === 'expanded' ? "md:w-1/2" : "md:flex-1"
                )}>
                  <AdvisoryBuilder safeHarbors={harborsWithDistances} onReset={handleMapReset} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="intelligence" className="flex-1 overflow-hidden m-0 data-[state=active]:flex">
              <IntelligenceFeed
                events={intelligence.events}
                metrics={intelligence.metrics}
                sourceStatus={intelligence.sourceStatus}
                isScanning={intelligence.isScanning}
                triggerScan={intelligence.triggerScan}
              />
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
