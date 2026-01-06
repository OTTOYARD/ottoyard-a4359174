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
      className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors"
    >
      <AlertTriangle className="h-4 w-4 text-primary" />
      <span className="font-semibold">OTTO-RESPONSE</span>
    </Button>
  );
}
