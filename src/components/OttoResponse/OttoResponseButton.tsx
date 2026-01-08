import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useOttoResponseStore } from '@/stores/ottoResponseStore';
export function OttoResponseButton() {
  const {
    openPanel
  } = useOttoResponseStore();
  return <Button variant="outline" size="sm" onClick={openPanel} className="gap-0.5 border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors h-5 text-[10px] py-0 border rounded-none px-1 self-start">
      <AlertTriangle className="h-2.5 w-2.5 text-primary" />
      <span className="font-semibold">OTTO-RESPONSE</span>
    </Button>;
}