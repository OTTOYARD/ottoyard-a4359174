import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Car,
  Building2,
  Send,
  Activity,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ChevronDown,
  Zap,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { useOttoResponseStore, SafeHarbor, TrafficSeverity } from '@/stores/ottoResponseStore';
import { getPolygonAreaSqMiles } from '@/hooks/useOttoResponseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdvisoryBuilderProps {
  safeHarbors: SafeHarbor[];
  onReset?: () => void;
}

interface PredictiveScenario {
  scenarioName: string;
  cause: string;
  severity: TrafficSeverity;
  zoneType: 'radius' | 'polygon';
  zoneCenter: { lat: number; lng: number };
  radiusMiles: number;
  vehiclesAffected: number;
  vehiclesNearby: number;
  recommendations: string[];
  suggestedSafeHarbors: string[];
  oemNotes: string;
}

export function AdvisoryBuilder({ safeHarbors, onReset }: AdvisoryBuilderProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [aiDraftText, setAIDraftText] = useState<string | null>(null);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);
  const [predictiveScenario, setPredictiveScenario] = useState<PredictiveScenario | null>(null);
  
  // Collapsible section states
  const [recommendationsOpen, setRecommendationsOpen] = useState(true);
  const [safeHarborsOpen, setSafeHarborsOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  
  const {
    trafficSeverity,
    lastUpdated,
    drawnZone,
    vehiclesInside,
    vehiclesNear,
    confidence,
    recommendations,
    setRecommendation,
    selectedSafeHarbors,
    toggleSafeHarbor,
    oemNotes,
    setOemNotes,
    isAILoading,
    setIsAILoading,
    createAdvisory,
    submitAdvisory,
    resetBuilder,
    setDrawnZone,
    setTrafficSeverity,
    updateZoneAnalytics,
  } = useOttoResponseStore();
  
  const maxNotes = 1000;
  
  // Calculate zone size
  const zoneSize = drawnZone?.type === 'radius' && drawnZone.radiusMiles
    ? `${(Math.PI * drawnZone.radiusMiles ** 2).toFixed(2)} sq mi`
    : drawnZone?.type === 'polygon' && drawnZone.points
    ? `~${getPolygonAreaSqMiles(drawnZone.points).toFixed(2)} sq mi`
    : 'N/A';
  
  // Validation
  const canSubmit = drawnZone !== null;
  const safeHarborError = recommendations.safeHarborStaging && selectedSafeHarbors.length === 0;
  const waveError = recommendations.waveBasedRecovery && 
    (!recommendations.waveSize || !recommendations.waveIntervalMinutes);
  const hasErrors = safeHarborError || waveError;

  // Handle Reset
  const handleReset = () => {
    resetBuilder();
    setAIDraftText(null);
    setPredictiveScenario(null);
    onReset?.(); // Reset map state too
    toast.info('Advisory builder reset');
  };

  // Handle Predictive Analysis
  const handlePredictiveAnalysis = async () => {
    setIsGeneratingPrediction(true);
    setPredictiveScenario(null);

    try {
      const { data, error } = await supabase.functions.invoke('otto-response-ai', {
        body: { 
          action: 'generatePredictiveScenario',
          context: {
            availableHarbors: safeHarbors.map(h => h.name),
          }
        },
      });

      if (error) throw error;

      if (data?.scenario) {
        applyPredictiveScenario(data.scenario);
        toast.success('AI prediction applied - review and submit');
      }
    } catch (err) {
      console.error('Predictive analysis error:', err);
      // Fallback to mock scenario
      const mockScenario = generateMockScenario();
      applyPredictiveScenario(mockScenario);
      toast.info('Mock prediction applied - review and submit');
    } finally {
      setIsGeneratingPrediction(false);
    }
  };

  const generateMockScenario = (): PredictiveScenario => {
    const scenarios = [
      {
        scenarioName: 'Major Interstate Incident',
        cause: 'Multi-vehicle collision on I-40 near downtown exit',
        severity: 'High' as TrafficSeverity,
        radiusMiles: 1.5,
      },
      {
        scenarioName: 'Construction Zone Closure',
        cause: 'Emergency road repair on main arterial route',
        severity: 'Medium' as TrafficSeverity,
        radiusMiles: 0.75,
      },
      {
        scenarioName: 'Special Event Traffic',
        cause: 'Major concert venue event causing congestion',
        severity: 'Medium' as TrafficSeverity,
        radiusMiles: 1.0,
      },
      {
        scenarioName: 'Weather-Related Hazard',
        cause: 'Flooding reported on low-lying roads',
        severity: 'High' as TrafficSeverity,
        radiusMiles: 2.0,
      },
    ];

    const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
    const harborsToSuggest = safeHarbors.slice(0, 2).map(h => h.name);

    return {
      ...selected,
      zoneType: 'radius',
      zoneCenter: { lat: 36.16 + (Math.random() - 0.5) * 0.05, lng: -86.78 + (Math.random() - 0.5) * 0.05 },
      vehiclesAffected: Math.floor(Math.random() * 5) + 1,
      vehiclesNearby: Math.floor(Math.random() * 8) + 2,
      recommendations: ['pauseDispatches', 'avoidZoneRouting', 'safeHarborStaging'],
      suggestedSafeHarbors: harborsToSuggest,
      oemNotes: `OTTO-RESPONSE Predictive Advisory: ${selected.cause}. Automated scenario generated based on real-time traffic patterns, weather conditions, and current fleet positioning.`,
    };
  };

  const applyPredictiveScenario = (scenario: PredictiveScenario) => {
    setPredictiveScenario(scenario);
    
    // Apply zone to map
    setDrawnZone({
      type: 'radius',
      center: scenario.zoneCenter,
      radiusMiles: scenario.radiusMiles,
    });

    // Set traffic severity
    setTrafficSeverity(scenario.severity);

    // Update zone analytics
    updateZoneAnalytics(scenario.vehiclesAffected, scenario.vehiclesNearby);

    // Apply recommendations
    scenario.recommendations.forEach(rec => {
      if (rec === 'pauseDispatches') setRecommendation('pauseDispatches', true);
      if (rec === 'avoidZoneRouting') setRecommendation('avoidZoneRouting', true);
      if (rec === 'waveBasedRecovery') setRecommendation('waveBasedRecovery', true);
      if (rec === 'safeHarborStaging') setRecommendation('safeHarborStaging', true);
      if (rec === 'keepClearCorridors') setRecommendation('keepClearCorridors', true);
    });

    // Select suggested safe harbors
    scenario.suggestedSafeHarbors.forEach(harborName => {
      const harbor = safeHarbors.find(h => h.name === harborName);
      if (harbor && !selectedSafeHarbors.some(sh => sh.id === harbor.id)) {
        toggleSafeHarbor(harbor);
      }
    });

    // Set OEM notes
    setOemNotes(scenario.oemNotes);
  };
  
  // Handle AI Draft
  const handleAIDraft = async () => {
    setIsAILoading(true);
    setAIDraftText(null);
    
    try {
      const context = {
        trafficSeverity,
        zoneType: drawnZone?.type || 'none',
        zoneSize,
        vehiclesInside,
        vehiclesNear,
        recommendations: {
          pauseDispatches: recommendations.pauseDispatches,
          avoidZoneRouting: recommendations.avoidZoneRouting,
          waveBasedRecovery: recommendations.waveBasedRecovery,
          safeHarborStaging: recommendations.safeHarborStaging,
          keepClearCorridors: recommendations.keepClearCorridors,
        },
        selectedSafeHarbors: selectedSafeHarbors.map(h => h.name),
      };
      
      const { data, error } = await supabase.functions.invoke('otto-response-ai', {
        body: { action: 'draft', context },
      });
      
      if (error) throw error;
      
      if (data?.draft) {
        setAIDraftText(data.draft);
        setOemNotes(data.draft);
        toast.success('AI draft generated');
      } else if (data?.mock) {
        setAIDraftText(data.draft);
        setOemNotes(data.draft);
        toast.info('Mock AI draft generated');
      }
    } catch (err) {
      console.error('AI draft error:', err);
      const mockDraft = generateMockDraft();
      setAIDraftText(mockDraft);
      setOemNotes(mockDraft);
      toast.info('Mock AI draft generated');
    } finally {
      setIsAILoading(false);
    }
  };
  
  // Template-based mock generator
  const generateMockDraft = () => {
    const recs = [];
    if (recommendations.pauseDispatches) recs.push('pausing new dispatches');
    if (recommendations.avoidZoneRouting) recs.push('avoiding zone routing');
    if (recommendations.waveBasedRecovery) recs.push(`wave-based recovery (${recommendations.waveSize} vehicles/${recommendations.waveIntervalMinutes}min)`);
    if (recommendations.safeHarborStaging) recs.push(`staging at ${selectedSafeHarbors.map(h => h.name).join(', ')}`);
    if (recommendations.keepClearCorridors) recs.push('keeping corridors clear');
    
    return `OTTO-RESPONSE Advisory: A ${trafficSeverity.toLowerCase()}-severity traffic incident has been identified affecting a ${drawnZone?.type || 'designated'} zone (${zoneSize}). Currently ${vehiclesInside} vehicle(s) are inside the zone with ${vehiclesNear} nearby. Recommended actions include ${recs.length ? recs.join(', ') : 'standard monitoring'}. This advisory is issued for OEM awareness and coordination.`;
  };
  
  // Handle submit
  const handleSubmit = () => {
    const advisory = createAdvisory();
    submitAdvisory(advisory.id);
    setShowSubmitDialog(false);
    resetBuilder();
    setAIDraftText(null);
    setPredictiveScenario(null);
    onReset?.(); // Reset map state too
    toast.success(`Advisory ${advisory.id} submitted`);
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-destructive';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="px-4 md:px-5 py-3 md:py-4 space-y-4 md:space-y-5 pb-24">
          {/* AI Predictive Analysis - Optional Feature */}
          <Card className="border-primary/30 bg-primary/5 overflow-hidden">
            <CardContent className="py-3 px-3 md:px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs md:text-sm font-medium">Event Engine</span>
                      <Badge variant="outline" className="text-[10px] shrink-0 h-4">Predictive</Badge>
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                      Real-time incident detection
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handlePredictiveAnalysis}
                  disabled={isGeneratingPrediction}
                  className="shrink-0 h-7 px-2 text-xs"
                >
                  {isGeneratingPrediction ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Activity className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Analyze</span>
                      <span className="sm:hidden">Run</span>
                    </>
                  )}
                </Button>
              </div>
              {predictiveScenario && (
                <div className="mt-2 p-2 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-xs font-medium text-primary line-clamp-1">{predictiveScenario.scenarioName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{predictiveScenario.cause}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Snapshot */}
          <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-2 py-2 md:py-3 px-3 md:px-4 bg-muted/50">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                </div>
                Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 md:space-y-2 py-2 px-3 md:px-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Traffic Severity</span>
                <Badge variant="outline" className={cn("text-[10px] md:text-xs", getSeverityColor(trafficSeverity))}>
                  {trafficSeverity}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs md:text-sm text-muted-foreground">Last Updated</span>
                <span className="text-xs md:text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Zone Summary */}
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2 py-2 md:py-3 px-3 md:px-4 bg-muted/50">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                </div>
                Zone Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 md:px-4">
              {drawnZone ? (
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Type</p>
                    <p className="text-sm md:text-base font-medium capitalize">{drawnZone.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Size</p>
                    <p className="text-sm md:text-base font-medium">{zoneSize}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Vehicles Inside</p>
                    <p className="text-sm md:text-base font-medium text-destructive">{vehiclesInside}</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Vehicles Near</p>
                    <p className="text-sm md:text-base font-medium text-warning">{vehiclesNear}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Confidence</p>
                    <Badge variant="outline" className="text-[10px] md:text-xs">{confidence}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-xs md:text-sm text-muted-foreground text-center py-3 md:py-4">
                  Draw a zone on the map to see analytics
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Recommendations - Collapsible */}
          <Collapsible open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
            <Card className="overflow-hidden border-l-4 border-l-green-500">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 py-2 md:py-3 px-3 md:px-4 cursor-pointer hover:bg-muted/70 transition-colors bg-muted/50">
                  <CardTitle className="text-sm md:text-base font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      </div>
                      Recommendations
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0", recommendationsOpen && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3 py-2">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="pauseDispatches"
                        checked={recommendations.pauseDispatches}
                        onCheckedChange={(checked) => setRecommendation('pauseDispatches', !!checked)}
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor="pauseDispatches" className="cursor-pointer text-sm">
                          Pause new dispatches in zone
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Halt new vehicle assignments to affected area
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="avoidZoneRouting"
                        checked={recommendations.avoidZoneRouting}
                        onCheckedChange={(checked) => setRecommendation('avoidZoneRouting', !!checked)}
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor="avoidZoneRouting" className="cursor-pointer text-sm">
                          Avoid-zone routing
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Route vehicles around the designated zone
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="waveBasedRecovery"
                        checked={recommendations.waveBasedRecovery}
                        onCheckedChange={(checked) => setRecommendation('waveBasedRecovery', !!checked)}
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor="waveBasedRecovery" className="cursor-pointer text-sm">
                          Wave-based recovery
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Stagger vehicle recovery in controlled waves
                        </p>
                        {recommendations.waveBasedRecovery && (
                          <div className="flex gap-2 mt-2">
                            <div>
                              <Label className="text-xs">Wave Size</Label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={recommendations.waveSize}
                                onChange={(e) => setRecommendation('waveSize', parseInt(e.target.value) || 5)}
                                className="h-8 w-20"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Interval (min)</Label>
                              <Input
                                type="number"
                                min={5}
                                max={60}
                                value={recommendations.waveIntervalMinutes}
                                onChange={(e) => setRecommendation('waveIntervalMinutes', parseInt(e.target.value) || 15)}
                                className="h-8 w-20"
                              />
                            </div>
                          </div>
                        )}
                        {waveError && (
                          <p className="text-xs text-destructive">Wave size and interval required</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="safeHarborStaging"
                        checked={recommendations.safeHarborStaging}
                        onCheckedChange={(checked) => setRecommendation('safeHarborStaging', !!checked)}
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor="safeHarborStaging" className="cursor-pointer text-sm">
                          Safe Harbor staging
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Direct vehicles to designated safe locations
                        </p>
                        {safeHarborError && (
                          <p className="text-xs text-destructive">Select at least one Safe Harbor below</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="keepClearCorridors"
                        checked={recommendations.keepClearCorridors}
                        onCheckedChange={(checked) => setRecommendation('keepClearCorridors', !!checked)}
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor="keepClearCorridors" className="cursor-pointer text-sm">
                          Keep-clear corridors
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Maintain emergency access routes
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          
          {/* Safe Harbor Destinations - Collapsible */}
          <Collapsible open={safeHarborsOpen} onOpenChange={setSafeHarborsOpen}>
            <Card className="overflow-hidden border-l-4 border-l-amber-500">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 py-2 md:py-3 px-3 md:px-4 cursor-pointer hover:bg-muted/70 transition-colors bg-muted/50">
                  <CardTitle className="text-sm md:text-base font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Shield className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <span className="truncate">Safe Harbors</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {selectedSafeHarbors.length}/3
                      </Badge>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0", safeHarborsOpen && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="py-2 px-3 md:px-4">
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {safeHarbors
                      .sort((a, b) => a.distanceFromZone - b.distanceFromZone)
                      .map((harbor) => {
                        const isSelected = selectedSafeHarbors.some(h => h.id === harbor.id);
                        const isDisabled = !isSelected && selectedSafeHarbors.length >= 3;
                        
                        return (
                          <div
                            key={harbor.id}
                            className={cn(
                              "p-2 rounded-md border cursor-pointer transition-colors overflow-hidden",
                              isSelected && "border-primary bg-primary/10",
                              !isSelected && !isDisabled && "border-border hover:border-primary/50",
                              isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !isDisabled && toggleSafeHarbor(harbor)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Checkbox checked={isSelected} className="pointer-events-none shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs md:text-sm font-medium truncate">{harbor.name}</p>
                                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                                      {harbor.type}
                                    </Badge>
                                    <span className="shrink-0">{harbor.distanceFromZone} mi</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs md:text-sm font-medium">{harbor.availableCapacity}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">slots</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          
          {/* Notes to OEM - Collapsible */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <Card className="overflow-hidden border-l-4 border-l-purple-500">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 py-2 md:py-3 px-3 md:px-4 cursor-pointer hover:bg-muted/70 transition-colors bg-muted/50">
                  <CardTitle className="text-sm md:text-base font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                      </div>
                      Notes to OEM
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0", notesOpen && "rotate-180")} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="py-2">
                  <div className="flex justify-end mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAIDraft}
                      disabled={isAILoading || !drawnZone}
                      className="h-7 text-xs"
                    >
                      {isAILoading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      AI Draft
                    </Button>
                  </div>
                  <Textarea
                    value={oemNotes}
                    onChange={(e) => setOemNotes(e.target.value.slice(0, maxNotes))}
                    placeholder="Enter notes for the OEM..."
                    className="min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {oemNotes.length}/{maxNotes}
                  </p>
                  {aiDraftText && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✨ AI-generated draft
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </ScrollArea>
      
      {/* Sticky Action Buttons */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 md:px-5 py-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="shrink-0 h-9 px-3"
          >
            <RotateCcw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Reset</span>
          </Button>
          <Button
            className="flex-1 h-9"
            onClick={() => setShowSubmitDialog(true)}
            disabled={!canSubmit || hasErrors}
          >
            <Send className="h-4 w-4 mr-1.5 md:mr-2" />
            <span className="text-sm">Submit</span>
          </Button>
        </div>
        {!canSubmit && (
          <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-2">
            Draw a zone on the map to enable submission
          </p>
        )}
      </div>
      
      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Advisory to OEM</DialogTitle>
            <DialogDescription className="pt-4">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm text-foreground font-medium">
                  ⚠️ Important Disclaimer
                </p>
                <p className="text-sm mt-2">
                  This advisory is a <strong>non-binding operational recommendation</strong> for OEM awareness. 
                  The OEM retains full vehicle routing and control.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
