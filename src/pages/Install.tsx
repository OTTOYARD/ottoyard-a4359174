import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Share, MoreVertical, Plus, Download, ArrowRight, CheckCircle2 } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
    return 'desktop';
  }
  return 'unknown';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function Install() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setAlreadyInstalled(isStandalone());
  }, []);

  if (alreadyInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Already Installed!</h1>
            <p className="text-muted-foreground">
              OTTOYARD is already installed on your device. You're all set!
            </p>
          </div>
          <Button onClick={() => navigate('/')} className="w-full gap-2">
            Open OTTOYARD
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 overflow-hidden">
            <div className="bg-background rounded-lg overflow-hidden w-16 h-16 flex items-center justify-center">
              <img 
                src="/ottoyard-logo-new.png" 
                alt="OTTOYARD" 
                className="w-16 h-16 object-contain mix-blend-multiply"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Install OTTOYARD</h1>
            <p className="text-muted-foreground mt-1">
              Add to your home screen for the best experience
            </p>
          </div>
        </div>

        {/* Platform-specific instructions */}
        <div className="space-y-4">
          {platform === 'ios' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">For iPhone & iPad</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Tap the <strong>Share</strong> button
                    </p>
                    <Share className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Scroll and tap <strong>"Add to Home Screen"</strong>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">Add to Home Screen</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Tap <strong>"Add"</strong> in the top right corner
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {platform === 'android' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">For Android</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Tap the <strong>menu</strong> button (three dots)
                    </p>
                    <MoreVertical className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Download className="w-4 h-4" />
                      <span className="text-xs">Install app</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Tap <strong>"Install"</strong> to confirm
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {(platform === 'desktop' || platform === 'unknown') && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Install Instructions</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium text-foreground mb-2">Chrome / Edge</h3>
                  <p className="text-sm text-muted-foreground">
                    Look for the install icon <Download className="w-4 h-4 inline mx-1" /> in the address bar, or use the menu → "Install OTTOYARD"
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium text-foreground mb-2">Safari (Mac)</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to File → "Add to Dock"
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Benefits */}
        <div className="space-y-2 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Benefits</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Full-screen experience
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Quick access from home screen
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Works offline
            </li>
          </ul>
        </div>

        {/* Action button */}
        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="w-full gap-2"
        >
          Continue to OTTOYARD
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
