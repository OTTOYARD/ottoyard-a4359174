import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';

export function OttoResponseButton() {
  const { openPanel, advisories } = useOttoResponseStore();
  
  // Check for active incidents (Draft or Submitted advisories)
  const hasActiveIncidents = advisories.some(
    (a) => a.status === 'Draft' || a.status === 'Submitted'
  );

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openPanel}
      className={`gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors h-8 text-sm py-1 border-2 rounded-md px-3 self-start ${
        hasActiveIncidents ? 'animate-pulse' : ''
      }`}
    >
      <AlertTriangle className="h-4 w-4 text-primary" />
      <span className="font-semibold">OTTO-RESPONSE</span>
    </Button>
  );
}
