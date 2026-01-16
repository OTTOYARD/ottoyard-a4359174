import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Zap, MapPin, Car, AlertTriangle, Check } from 'lucide-react';
import { useOttoResponseStore, TrafficSeverity, SafeHarbor } from '@/stores/ottoResponseStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface PredictiveAdvisoryProps {
  safeHarbors: SafeHarbor[];
}

export function PredictiveAdvisory({ safeHarbors }: PredictiveAdvisoryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenario, setScenario] = useState<PredictiveScenario | null>(null);
  const [isImplementing, setIsImplementing] = useState(false);

  const {
    setDrawnZone,
    setTrafficSeverity,
    setRecommendation,
    toggleSafeHarbor,
    selectedSafeHarbors,
    setOemNotes,
    createAdvisory,
    submitAdvisory,
    resetBuilder,
    updateZoneAnalytics,
  } = useOttoResponseStore();

  const generateScenario = async () => {
    setIsGenerating(true);
    setScenario(null);

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
        setScenario(data.scenario);
        toast.success('AI scenario generated');
      }
    } catch (err) {
      console.error('Scenario generation error:', err);
      // Fallback to mock scenario
      const mockScenario = generateMockScenario();
      setScenario(mockScenario);
      toast.info('Mock scenario generated');
    } finally {
      setIsGenerating(false);
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
      {
        scenarioName: 'Utility Emergency',
        cause: 'Gas line rupture requiring area evacuation',
        severity: 'High' as TrafficSeverity,
        radiusMiles: 0.5,
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
      oemNotes: `OTTO-RESPONSE Predictive Advisory: ${selected.cause}. Automated scenario generated based on historical patterns and current fleet positioning. Recommended actions have been pre-selected based on severity level and available safe harbor capacity.`,
    };
  };

  const implementScenario = async () => {
    if (!scenario) return;

    setIsImplementing(true);

    try {
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
      resetBuilder();
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

      // Create and submit advisory
      const advisory = createAdvisory();
      submitAdvisory(advisory.id);

      toast.success(`Advisory ${advisory.id} implemented and submitted`);
      setScenario(null);
    } catch (err) {
      console.error('Implementation error:', err);
      toast.error('Failed to implement scenario');
    } finally {
      setIsImplementing(false);
    }
  };

  const getSeverityColor = (severity: TrafficSeverity) => {
    switch (severity) {
      case 'High': return 'bg-destructive text-destructive-foreground';
      case 'Medium': return 'bg-warning text-warning-foreground';
      case 'Low': return 'bg-success text-success-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            AI Predictive Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate AI-powered incident scenarios with pre-configured response protocols.
            One-click implementation pushes the advisory directly to OEMs.
          </p>
          <Button
            onClick={generateScenario}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Scenario...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Scenario
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Scenario */}
      {scenario && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {scenario.scenarioName}
              </CardTitle>
              <Badge className={getSeverityColor(scenario.severity)}>
                {scenario.severity} Severity
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cause */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Incident Cause</p>
              <p className="text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                {scenario.cause}
              </p>
            </div>

            {/* Zone Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Zone</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {scenario.radiusMiles} mi radius
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Affected Vehicles</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Car className="h-3 w-3 text-destructive" />
                  {scenario.vehiclesAffected} inside, {scenario.vehiclesNearby} nearby
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Recommended Actions</p>
              <div className="flex flex-wrap gap-1">
                {scenario.recommendations.map((rec) => (
                  <Badge key={rec} variant="outline" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {rec === 'pauseDispatches' && 'Pause Dispatches'}
                    {rec === 'avoidZoneRouting' && 'Avoid Zone'}
                    {rec === 'waveBasedRecovery' && 'Wave Recovery'}
                    {rec === 'safeHarborStaging' && 'Safe Harbor'}
                    {rec === 'keepClearCorridors' && 'Keep-Clear'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Safe Harbors */}
            {scenario.suggestedSafeHarbors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Suggested Safe Harbors</p>
                <div className="flex flex-wrap gap-1">
                  {scenario.suggestedSafeHarbors.map((harbor) => (
                    <Badge key={harbor} variant="secondary" className="text-xs">
                      {harbor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Notes Preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">OEM Notes (AI Generated)</p>
              <p className="text-xs bg-muted p-2 rounded-md line-clamp-3">
                {scenario.oemNotes}
              </p>
            </div>

            {/* Implement Button */}
            <Button
              onClick={implementScenario}
              disabled={isImplementing}
              className="w-full"
              size="lg"
            >
              {isImplementing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Implementing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Implement Advisory
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will apply the zone, recommendations, and submit to OEMs
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info when no scenario */}
      {!scenario && !isGenerating && (
        <Card>
          <CardContent className="py-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Click "Generate AI Scenario" to create a predictive incident response
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
