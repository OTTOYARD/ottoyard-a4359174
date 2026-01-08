import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';
export function OttoResponseButton() {
  const {
    openPanel
  } = useOttoResponseStore();
  return <Button variant="outline" size="sm" onClick={openPanel} className="gap-0.5 border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors h-4 text-[8px] py-0 border rounded-none px-0.5 self-start">
      <AlertTriangle className="h-2 w-2 text-primary" />
      <span className="font-semibold">OTTO-RESPONSE</span>
    </Button>;
}