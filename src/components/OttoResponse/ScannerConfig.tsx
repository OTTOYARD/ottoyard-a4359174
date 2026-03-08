import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw } from 'lucide-react';
import { useIntelligenceStore, type ScanConfig, type SourceKey, type SourceStatus } from '@/stores/intelligenceStore';
import { cn } from '@/lib/utils';

interface ScannerConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_LABELS: Record<SourceKey, string> = {
  weather: 'Weather (NWS)',
  traffic: 'Traffic (TomTom)',
  news: 'News (GDELT)',
  emergency: 'Emergency (FEMA)',
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusDot(status: SourceStatus) {
  switch (status) {
    case 'connected': return 'bg-success';
    case 'error': return 'bg-destructive';
    case 'disabled': return 'bg-muted-foreground/30';
    default: return 'bg-muted-foreground/50';
  }
}

const ALL_CITIES = ['Nashville', 'Austin', 'LA', 'San Francisco'];

export function ScannerConfig({ open, onOpenChange }: ScannerConfigProps) {
  const { scanConfig, sourceStatus, isScanning, triggerScan, updateConfig, fetchConfig } = useIntelligenceStore();

  // Local editable state
  const [local, setLocal] = useState<Partial<Record<string, any>>>({});

  useEffect(() => {
    if (open && !scanConfig) fetchConfig();
  }, [open, scanConfig, fetchConfig]);

  useEffect(() => {
    if (scanConfig) {
      setLocal({
        weather_enabled: scanConfig.weatherEnabled,
        weather_interval_minutes: scanConfig.weatherIntervalMinutes,
        traffic_enabled: scanConfig.trafficEnabled,
        traffic_interval_minutes: scanConfig.trafficIntervalMinutes,
        news_enabled: scanConfig.newsEnabled,
        news_interval_minutes: scanConfig.newsIntervalMinutes,
        emergency_enabled: scanConfig.emergencyEnabled,
        emergency_interval_minutes: scanConfig.emergencyIntervalMinutes,
        cities: scanConfig.cities,
        threat_score_threshold: scanConfig.threatScoreThreshold,
        auto_expire_hours: scanConfig.autoExpireHours,
      });
    }
  }, [scanConfig]);

  const handleSave = async () => {
    await updateConfig(local);
    onOpenChange(false);
  };

  type SourceDef = { key: SourceKey; enabledField: string; intervalField: string; lastScan: string | null; lastError: string | null };

  const sources: SourceDef[] = [
    { key: 'weather', enabledField: 'weather_enabled', intervalField: 'weather_interval_minutes', lastScan: scanConfig?.weatherLastScanAt ?? null, lastError: scanConfig?.weatherLastError ?? null },
    { key: 'traffic', enabledField: 'traffic_enabled', intervalField: 'traffic_interval_minutes', lastScan: scanConfig?.trafficLastScanAt ?? null, lastError: scanConfig?.trafficLastError ?? null },
    { key: 'news', enabledField: 'news_enabled', intervalField: 'news_interval_minutes', lastScan: scanConfig?.newsLastScanAt ?? null, lastError: scanConfig?.newsLastError ?? null },
    { key: 'emergency', enabledField: 'emergency_enabled', intervalField: 'emergency_interval_minutes', lastScan: scanConfig?.emergencyLastScanAt ?? null, lastError: scanConfig?.emergencyLastError ?? null },
  ];

  const cities = (local.cities as string[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Intelligence Scanner Config</DialogTitle>
        </DialogHeader>

        {/* Data Sources */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Data Sources</h4>
          {sources.map((src) => (
            <div key={src.key} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/50">
              <div className={cn('h-2 w-2 rounded-full shrink-0', statusDot(sourceStatus[src.key]))} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{SOURCE_LABELS[src.key]}</span>
                  <Switch
                    checked={!!local[src.enabledField]}
                    onCheckedChange={(v) => setLocal((s) => ({ ...s, [src.enabledField]: v }))}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Label className="text-[10px] text-muted-foreground shrink-0">Interval</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={local[src.intervalField] ?? 5}
                    onChange={(e) => setLocal((s) => ({ ...s, [src.intervalField]: Number(e.target.value) }))}
                    className="h-6 w-16 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">min</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{relativeTime(src.lastScan)}</span>
                </div>
                {src.lastError && (
                  <p className="text-[10px] text-destructive mt-0.5 truncate">{src.lastError}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Cities */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Cities</h4>
          <div className="flex flex-wrap gap-3">
            {ALL_CITIES.map((city) => (
              <div key={city} className="flex items-center gap-1.5">
                <Checkbox
                  id={`city-${city}`}
                  checked={cities.includes(city)}
                  onCheckedChange={(checked) => {
                    setLocal((s) => ({
                      ...s,
                      cities: checked
                        ? [...cities, city]
                        : cities.filter((c: string) => c !== city),
                    }));
                  }}
                />
                <Label htmlFor={`city-${city}`} className="text-xs cursor-pointer">{city}</Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Thresholds */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Thresholds</h4>
          <div>
            <Label className="text-xs">Threat Score Threshold: {local.threat_score_threshold ?? 40}</Label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[local.threat_score_threshold ?? 40]}
              onValueChange={([v]) => setLocal((s) => ({ ...s, threat_score_threshold: v }))}
              className="mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Events below this score won't surface in the UI</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">Auto-expire (hours)</Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={local.auto_expire_hours ?? 24}
              onChange={(e) => setLocal((s) => ({ ...s, auto_expire_hours: Number(e.target.value) }))}
              className="h-7 w-20 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerScan}
            disabled={isScanning}
          >
            {isScanning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Scan Now
          </Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
