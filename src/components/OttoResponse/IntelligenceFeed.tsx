import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Cloud,
  Construction,
  Newspaper,
  AlertTriangle,
  Flame,
  Car,
  Loader2,
  RefreshCw,
  MapPin,
  Plus,
  Settings,
} from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';
import { cn } from '@/lib/utils';
import type { EventWithImpact, IntelligenceMetrics } from '@/hooks/useIntelligenceData';
import type { SourceKey, SourceStatus } from '@/stores/intelligenceStore';

interface IntelligenceFeedProps {
  events: EventWithImpact[];
  metrics: IntelligenceMetrics;
  sourceStatus: Record<SourceKey, SourceStatus>;
  isScanning: boolean;
  triggerScan: () => Promise<void>;
}

const SOURCE_ICONS: Record<string, typeof Cloud> = {
  nws_weather: Cloud,
  tomtom_traffic: Construction,
  gdelt_news: Newspaper,
  newsapi: Newspaper,
  openfema: AlertTriangle,
  manual: AlertTriangle,
};

const SOURCE_LABELS: Record<SourceKey, string> = {
  weather: 'Weather',
  traffic: 'Traffic',
  news: 'News',
  emergency: 'Emergency',
};

function getStatusColor(status: SourceStatus): string {
  switch (status) {
    case 'connected': return 'bg-success animate-pulse';
    case 'scanning': return 'bg-primary animate-spin';
    case 'error': return 'bg-destructive';
    case 'disabled': return 'bg-muted-foreground/30';
    default: return 'bg-muted-foreground/50';
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-destructive/80 text-destructive-foreground';
    case 'medium': return 'bg-warning text-warning-foreground';
    case 'low': return 'bg-success text-success-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getThreatBarColor(score: number): string {
  if (score >= 80) return 'bg-destructive';
  if (score >= 60) return 'bg-orange-500';
  if (score >= 40) return 'bg-warning';
  return 'bg-success';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function IntelligenceFeed({ events, metrics, sourceStatus, isScanning, triggerScan }: IntelligenceFeedProps) {
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const {
    setDrawnZone,
    setTrafficSeverity,
    setRecommendation,
    setOemNotes,
    updateZoneAnalytics,
  } = useOttoResponseStore();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (cityFilter !== 'all' && e.city !== cityFilter) return false;
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
      return true;
    });
  }, [events, cityFilter, severityFilter, sourceFilter]);

  const handleCreateAdvisory = (event: EventWithImpact) => {
    // Set zone from event
    if (event.locationLat != null && event.locationLng != null) {
      setDrawnZone({
        type: 'radius',
        center: { lat: event.locationLat, lng: event.locationLng },
        radiusMiles: event.radiusMiles ?? 3,
      });
    }

    // Set severity
    const sevMap: Record<string, 'High' | 'Medium' | 'Low'> = {
      critical: 'High', high: 'High', medium: 'Medium', low: 'Low', info: 'Low',
    };
    setTrafficSeverity(sevMap[event.severity] ?? 'Medium');

    // Apply recommendations
    const recs = event.autoRecommendations ?? [];
    if (recs.includes('pauseDispatches')) setRecommendation('pauseDispatches', true);
    if (recs.includes('avoidZoneRouting')) setRecommendation('avoidZoneRouting', true);
    if (recs.includes('safeHarborStaging')) setRecommendation('safeHarborStaging', true);
    if (recs.includes('keepClearCorridors')) setRecommendation('keepClearCorridors', true);

    // Update analytics
    updateZoneAnalytics(event.vehiclesAffected, event.vehiclesNearby);

    // Pre-fill notes
    setOemNotes(
      `OTTO-RESPONSE Intelligence Alert: ${event.title}\n` +
      `Source: ${event.source} | Severity: ${event.severity} | Threat Score: ${event.threatScore}/100\n` +
      (event.description ? `Details: ${event.description.slice(0, 300)}\n` : '') +
      `City: ${event.city ?? 'Unknown'} | Vehicles affected: ${event.vehiclesAffected} inside, ${event.vehiclesNearby} nearby`
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Source Status Indicators */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SOURCE_LABELS) as SourceKey[]).map((key) => (
              <div
                key={key}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/80 border border-border/50"
              >
                <div className={cn('h-1.5 w-1.5 rounded-full', getStatusColor(sourceStatus[key]))} />
                <span className="text-[9px] md:text-[10px] text-muted-foreground">{SOURCE_LABELS[key]}</span>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={triggerScan}
            disabled={isScanning}
            className="h-7 px-2 text-xs shrink-0"
          >
            {isScanning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="ml-1 hidden sm:inline">Scan</span>
          </Button>
        </div>

        {/* Summary metrics */}
        <div className="flex gap-3 text-xs mb-2">
          <div>
            <span className="text-muted-foreground">Active: </span>
            <span className="font-medium">{metrics.totalActive}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Critical: </span>
            <span className="font-medium text-destructive">{metrics.criticalCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">High Threat: </span>
            <span className="font-medium text-orange-500">{metrics.highThreatCount}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Nashville">Nashville</SelectItem>
              <SelectItem value="Austin">Austin</SelectItem>
              <SelectItem value="LA">LA</SelectItem>
              <SelectItem value="San Francisco">SF</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-7 w-[90px] text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-7 w-[90px] text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="nws_weather">Weather</SelectItem>
              <SelectItem value="tomtom_traffic">Traffic</SelectItem>
              <SelectItem value="gdelt_news">News</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Cards */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No active intelligence events
            </div>
          )}

          {filteredEvents.map((event) => {
            const Icon = SOURCE_ICONS[event.source] ?? AlertTriangle;

            return (
              <Card key={event.id} className="p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-2.5">
                  {/* Source Icon */}
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <Badge className={cn('text-[10px] h-4 px-1.5', getSeverityBadge(event.severity))}>
                        {event.severity}
                      </Badge>
                      {event.city && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          <MapPin className="h-2.5 w-2.5 mr-0.5" />
                          {event.city}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {relativeTime(event.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-xs font-medium truncate">{event.title}</p>

                    {/* Description */}
                    {event.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                        {event.description}
                      </p>
                    )}

                    {/* Threat Score Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', getThreatBarColor(event.threatScore))}
                          style={{ width: `${event.threatScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium w-6 text-right">{event.threatScore}</span>
                    </div>

                    {/* Vehicle Impact & Action */}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Car className="h-3 w-3" />
                        <span>
                          <span className="text-destructive font-medium">{event.vehiclesAffected}</span> inside
                          {' / '}
                          <span className="text-warning font-medium">{event.vehiclesNearby}</span> nearby
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => handleCreateAdvisory(event)}
                      >
                        <Plus className="h-3 w-3 mr-0.5" />
                        Advisory
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
