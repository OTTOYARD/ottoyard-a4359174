import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Share, MoreVertical, Plus, Download, ArrowRight, CheckCircle2 } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) return 'desktop';
  return 'unknown';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function StepTile({ num, delay, children }: { num: number; delay: number; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 surface-luxury rounded-xl p-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-primary">{num}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 40%, hsl(var(--primary) / 0.06) 0%, transparent 70%)' }}
        />
        <div className="surface-elevated-luxury rounded-3xl max-w-md w-full p-8 text-center overflow-hidden animate-fade-in-scale relative z-10 space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center shadow-[0_0_20px_hsl(var(--success)/0.15)]">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-luxury mb-2">Already Installed!</h1>
            <p className="text-muted-foreground">
              OTTOYARD is already installed on your device. You're all set!
            </p>
          </div>
          <Button onClick={() => navigate('/')} className="futuristic-button rounded-xl w-full py-3 text-base font-semibold gap-2">
            Open OTTOYARD
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 40%, hsl(var(--primary) / 0.06) 0%, transparent 70%)' }}
      />

      <div className="surface-elevated-luxury rounded-3xl max-w-md w-full p-8 overflow-hidden animate-fade-in-scale relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
            <img
              src="/ottoyard-logo-new.png"
              alt="OTTOYARD"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-luxury">Install OTTOYARD</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add to your home screen for the best experience
            </p>
          </div>
        </div>

        {/* Platform-specific instructions */}
        <div className="space-y-4">
          {platform === 'ios' && (
            <>
              <h2 className="text-lg font-semibold text-luxury">For iPhone & iPad</h2>
              <div className="space-y-3">
                <StepTile num={1} delay={100}>
                  <p className="text-sm text-foreground">
                    Tap the <strong>Share</strong> button
                  </p>
                  <Share className="w-5 h-5 text-muted-foreground mt-1" />
                </StepTile>
                <StepTile num={2} delay={200}>
                  <p className="text-sm text-foreground">
                    Scroll and tap <strong>"Add to Home Screen"</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs">Add to Home Screen</span>
                  </div>
                </StepTile>
                <StepTile num={3} delay={300}>
                  <p className="text-sm text-foreground">
                    Tap <strong>"Add"</strong> in the top right corner
                  </p>
                </StepTile>
              </div>
            </>
          )}

          {platform === 'android' && (
            <>
              <h2 className="text-lg font-semibold text-luxury">For Android</h2>
              <div className="space-y-3">
                <StepTile num={1} delay={100}>
                  <p className="text-sm text-foreground">
                    Tap the <strong>menu</strong> button (three dots)
                  </p>
                  <MoreVertical className="w-5 h-5 text-muted-foreground mt-1" />
                </StepTile>
                <StepTile num={2} delay={200}>
                  <p className="text-sm text-foreground">
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Download className="w-4 h-4" />
                    <span className="text-xs">Install app</span>
                  </div>
                </StepTile>
                <StepTile num={3} delay={300}>
                  <p className="text-sm text-foreground">
                    Tap <strong>"Install"</strong> to confirm
                  </p>
                </StepTile>
              </div>
            </>
          )}

          {(platform === 'desktop' || platform === 'unknown') && (
            <>
              <h2 className="text-lg font-semibold text-luxury">Install Instructions</h2>
              <div className="space-y-4">
                <div className="surface-luxury rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  <h3 className="text-sm font-semibold text-luxury mb-2">Chrome / Edge</h3>
                  <p className="text-sm text-muted-foreground">
                    Look for the install icon <Download className="w-4 h-4 inline mx-1" /> in the address bar, or use the menu → "Install OTTOYARD"
                  </p>
                </div>
                <div className="surface-luxury rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <h3 className="text-sm font-semibold text-luxury mb-2">Safari (Mac)</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to File → "Add to Dock"
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Benefits */}
        <div className="space-y-3 pt-4 border-t border-border/20">
          <p className="text-label-uppercase">Benefits</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              </div>
              Full-screen experience
            </li>
            <li className="flex items-center gap-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              </div>
              Quick access from home screen
            </li>
            <li className="flex items-center gap-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              </div>
              Works offline
            </li>
          </ul>
        </div>

        {/* Action button */}
        <Button
          onClick={() => navigate('/')}
          className="glass-button rounded-xl w-full py-3 text-base font-medium gap-2"
        >
          Continue to OTTOYARD
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
