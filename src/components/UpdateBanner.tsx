import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdateBannerProps {
  onUpdate: () => void;
}

export function UpdateBanner({ onUpdate }: UpdateBannerProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-auto">
      <div className="glass-card flex items-center gap-3 rounded-lg border border-primary/30 bg-card/95 px-4 py-3 shadow-lg">
        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Update available</p>
          <p className="text-xs text-muted-foreground">A new version is ready</p>
        </div>
        <Button
          size="sm"
          onClick={onUpdate}
          className="shrink-0"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
