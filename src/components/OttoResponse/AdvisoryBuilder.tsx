import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Car,
  Building2,
  FileDown,
  Send,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useOttoResponseStore, SafeHarbor, AIProvider } from '@/stores/ottoResponseStore';
import { getPolygonAreaSqMiles } from '@/hooks/useOttoResponseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdvisoryBuilderProps {
  safeHarbors: SafeHarbor[];
}

export function AdvisoryBuilder({ safeHarbors }: AdvisoryBuilderProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [aiDraftText, setAIDraftText] = useState<string | null>(null);
  
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
    aiProvider,
    setAIProvider,
    isAILoading,
    setIsAILoading,
    createAdvisory,
    submitAdvisory,
    resetBuilder,
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
        provider: aiProvider,
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
        // Mock fallback
        setAIDraftText(data.draft);
        setOemNotes(data.draft);
        toast.info('Mock AI draft generated (no API keys configured)');
      }
    } catch (err) {
      console.error('AI draft error:', err);
      // Fallback to template-based mock
      const mockDraft = generateMockDraft();
      setAIDraftText(mockDraft);
      setOemNotes(mockDraft);
      toast.info('Mock AI draft generated (no API keys configured)');
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
    toast.success(`Advisory ${advisory.id} submitted`);
  };
  
  // Handle export
  const handleExport = () => {
    const advisory = createAdvisory();
    const payload = JSON.stringify(advisory, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${advisory.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Advisory exported as JSON');
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
    <div className="space-y-4">
      {/* Snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Traffic Severity</span>
            <Badge variant="outline" className={getSeverityColor(trafficSeverity)}>
              {trafficSeverity}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Zone Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Zone Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drawnZone ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{drawnZone.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="font-medium">{zoneSize}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vehicles Inside</p>
                <p className="font-medium text-destructive">{vehiclesInside}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vehicles Near</p>
                <p className="font-medium text-warning">{vehiclesNear}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <Badge variant="outline">{confidence}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Draw a zone on the map to see analytics
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="pauseDispatches"
                checked={recommendations.pauseDispatches}
                onCheckedChange={(checked) => setRecommendation('pauseDispatches', !!checked)}
              />
              <div className="grid gap-1">
                <Label htmlFor="pauseDispatches" className="cursor-pointer">
                  Pause new dispatches in zone
                </Label>
                <p className="text-xs text-muted-foreground">
                  Temporarily halt new vehicle assignments to affected area
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="avoidZoneRouting"
                checked={recommendations.avoidZoneRouting}
                onCheckedChange={(checked) => setRecommendation('avoidZoneRouting', !!checked)}
              />
              <div className="grid gap-1">
                <Label htmlFor="avoidZoneRouting" className="cursor-pointer">
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
              <div className="grid gap-1">
                <Label htmlFor="waveBasedRecovery" className="cursor-pointer">
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
              <div className="grid gap-1">
                <Label htmlFor="safeHarborStaging" className="cursor-pointer">
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
              <div className="grid gap-1">
                <Label htmlFor="keepClearCorridors" className="cursor-pointer">
                  Keep-clear corridors
                </Label>
                <p className="text-xs text-muted-foreground">
                  Maintain emergency access routes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Safe Harbor Destinations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Safe Harbor Destinations
            <Badge variant="secondary" className="ml-auto">
              {selectedSafeHarbors.length}/3
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[180px]">
            <div className="space-y-2">
              {safeHarbors
                .sort((a, b) => a.distanceFromZone - b.distanceFromZone)
                .map((harbor) => {
                  const isSelected = selectedSafeHarbors.some(h => h.id === harbor.id);
                  const isDisabled = !isSelected && selectedSafeHarbors.length >= 3;
                  
                  return (
                    <div
                      key={harbor.id}
                      className={cn(
                        "p-2 rounded-md border cursor-pointer transition-colors",
                        isSelected && "border-primary bg-primary/10",
                        !isSelected && !isDisabled && "border-border hover:border-primary/50",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => !isDisabled && toggleSafeHarbor(harbor)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelected} className="pointer-events-none" />
                          <div>
                            <p className="text-sm font-medium">{harbor.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] h-4">
                                {harbor.type}
                              </Badge>
                              <span>{harbor.distanceFromZone} mi</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{harbor.availableCapacity}</p>
                          <p className="text-xs text-muted-foreground">slots</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Notes to OEM */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Notes to OEM</CardTitle>
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
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              AI Draft
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={oemNotes}
            onChange={(e) => setOemNotes(e.target.value.slice(0, maxNotes))}
            placeholder="Enter notes for the OEM..."
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">
            {oemNotes.length}/{maxNotes}
          </p>
          {aiDraftText && (
            <p className="text-xs text-muted-foreground mt-1">
              {isAILoading ? '' : '✨ AI-generated draft'}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => setShowSubmitDialog(true)}
          disabled={!canSubmit || hasErrors}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Advisory to OEM
        </Button>
      </div>
      
      {!canSubmit && (
        <p className="text-xs text-muted-foreground text-center">
          Draw a zone on the map to enable submission
        </p>
      )}
      
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
