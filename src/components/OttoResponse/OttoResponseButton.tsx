import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';
import { useIntelligenceStore } from '@/stores/intelligenceStore';

export function OttoResponseButton() {
  const { openPanel, advisories } = useOttoResponseStore();
  const events = useIntelligenceStore((s) => s.events);
  
  // Check for active incidents (Draft or Submitted advisories)
  const hasActiveIncidents = advisories.some(
    (a) => a.status === 'Draft' || a.status === 'Submitted'
  );

  // Count critical+high severity active events
  const criticalCount = events.filter(
    (e) => e.isActive && (e.severity === 'critical' || e.severity === 'high')
  ).length;

  const shouldPulse = hasActiveIncidents || criticalCount > 0;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openPanel}
      className={`gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors h-9 text-sm py-1.5 border-[5px] rounded-md px-4 ${
        shouldPulse ? 'animate-pulse-slow' : ''
      }`}
    >
      <AlertTriangle className="h-4 w-4 text-primary" />
      <span className="font-semibold">OTTO-RESPONSE</span>
      {criticalCount > 0 && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
          {criticalCount}
        </Badge>
      )}
    </Button>
  );
}
