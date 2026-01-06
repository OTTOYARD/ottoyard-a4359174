import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';

export function OttoResponseButton() {
  const { openPanel } = useOttoResponseStore();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openPanel}
      className="gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors h-7 px-2 text-xs"
    >
      <AlertTriangle className="h-3 w-3 text-primary" />
      <span className="font-semibold">OTTO-RESPONSE</span>
    </Button>
  );
}
