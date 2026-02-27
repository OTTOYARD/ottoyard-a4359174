// NotificationFeed — Scrollable grouped notification feed
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOttoQBooking } from "@/hooks/useOttoQBooking";
import NotificationCard from "./NotificationCard";
import QuickBookModal from "./QuickBookModal";
import NotificationPreferences from "./NotificationPreferences";
import type { ServiceNotification } from "@/services/ottoq-notifications";

export default function NotificationFeed() {
  const {
    grouped,
    unreadCount,
    acceptService,
    declineService,
    preferences,
    updatePreferences,
    engineStatus,
  } = useOttoQBooking();

  const [selectedNotif, setSelectedNotif] = useState<ServiceNotification | null>(null);
  const [rescheduleNotif, setRescheduleNotif] = useState<ServiceNotification | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

  const handleAccept = (id: string) => {
    const notif = [...grouped.actionRequired, ...grouped.upcoming].find((n) => n.id === id);
    if (notif) setSelectedNotif(notif);
  };

  const handleReschedule = (id: string) => {
    const notif = grouped.actionRequired.find((n) => n.id === id);
    if (notif) setRescheduleNotif(notif);
  };

  const isEmpty =
    grouped.actionRequired.length === 0 &&
    grouped.upcoming.length === 0 &&
    grouped.recent.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-[hsl(var(--primary))] text-primary-foreground">
              {unreadCount}
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowPrefs(!showPrefs)}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          aria-label="Notification settings"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Preferences panel (toggle) */}
      {showPrefs && (
        <NotificationPreferences
          preferences={preferences}
          onUpdate={updatePreferences}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {/* Feed */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {isEmpty ? (
            <EmptyState scanning={engineStatus === "scanning"} />
          ) : (
            <>
              {grouped.actionRequired.length > 0 && (
                <Section title="Action Required" count={grouped.actionRequired.length} accent>
                  {grouped.actionRequired.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onAcceptAll={handleAccept}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </Section>
              )}

              {grouped.upcoming.length > 0 && (
                <Section title="Upcoming" count={grouped.upcoming.length}>
                  {grouped.upcoming.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </Section>
              )}

              {grouped.recent.length > 0 && (
                <Section title="Recent" count={grouped.recent.length}>
                  {grouped.recent.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Modals */}
      {selectedNotif && (
        <QuickBookModal
          notification={selectedNotif}
          onConfirm={async (slot) => {
            await acceptService(selectedNotif.id, slot);
            setSelectedNotif(null);
          }}
          onCancel={() => setSelectedNotif(null)}
        />
      )}

      {rescheduleNotif && (
        <QuickBookModal
          notification={rescheduleNotif}
          rescheduleMode
          onConfirm={async (slot) => {
            await acceptService(rescheduleNotif.id, slot);
            setRescheduleNotif(null);
          }}
          onCancel={() => setRescheduleNotif(null)}
        />
      )}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────
function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-px flex-1", accent ? "bg-[hsl(var(--primary))]/20" : "bg-white/5")} />
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-wider",
            accent ? "text-[hsl(var(--primary))]" : "text-muted-foreground"
          )}
        >
          {title} ({count})
        </span>
        <div className={cn("h-px flex-1", accent ? "bg-[hsl(var(--primary))]/20" : "bg-white/5")} />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState({ scanning }: { scanning: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={cn("p-4 rounded-full bg-[hsl(var(--primary))]/10 mb-4", scanning && "animate-pulse")}>
        <Activity className="h-8 w-8 text-[hsl(var(--primary))]" />
      </div>
      <p className="text-sm font-medium text-foreground">You're all set</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        OTTO-Q is monitoring your vehicle. We'll notify you when service is recommended.
      </p>
    </div>
  );
}
