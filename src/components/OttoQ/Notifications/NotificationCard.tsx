// NotificationCard — Premium concierge-style service recommendation card
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServiceNotification } from "@/services/ottoq-notifications";
import type { ServiceType } from "@/types/ottoq";
import {
  Zap,
  Droplets,
  CircleDot,
  HeartPulse,
  Wrench,
  Clock,
  DollarSign,
  ChevronDown,
  Check,
  CalendarClock,
} from "lucide-react";

const SERVICE_ICONS: Record<ServiceType, typeof Zap> = {
  charge: Zap,
  detail_clean: Droplets,
  tire_rotation: CircleDot,
  battery_health_check: HeartPulse,
  full_service: Wrench,
};

const SEVERITY_DOT: Record<string, string> = {
  routine: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
};

interface Props {
  notification: ServiceNotification;
  onAccept: (id: string) => void;
  onAcceptAll?: (id: string) => void;
  onReschedule: (id: string) => void;
}

export default function NotificationCard({ notification, onAccept, onAcceptAll, onReschedule }: Props) {
  const [expanded, setExpanded] = useState(false);
  const Icon = SERVICE_ICONS[notification.serviceType] || Wrench;
  const slot = notification.recommendedSlot;
  const isAccepted = notification.status === "accepted";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm",
        "p-4 transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in",
        "hover:bg-white/[0.05] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
        isAccepted && "border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/[0.03]"
      )}
    >
      {/* Severity dot */}
      <span
        className={cn(
          "absolute top-3 right-3 h-2 w-2 rounded-full",
          SEVERITY_DOT[notification.severity],
          notification.severity === "critical" && "animate-pulse"
        )}
      />

      {/* ── Top: Icon + Headline ─────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 rounded-lg bg-[hsl(var(--primary))]/10">
          <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground leading-tight">
            {notification.headline}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {notification.reason}
          </p>
        </div>
      </div>

      {/* ── Middle: Slot details ──────────────────────────── */}
      {slot && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {slot.stallNumber && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5">
              Stall #{slot.stallNumber}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5">
            <Clock className="h-3 w-3" />
            {new Date(slot.start).toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/5">
            ~{notification.estimatedDurationMinutes} min
          </span>
          {notification.estimatedCostDollars !== null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5">
              <DollarSign className="h-3 w-3" />
              ${notification.estimatedCostDollars.toFixed(2)}
            </span>
          )}
          {slot.isOffPeak && (
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 px-1.5 py-0">
              Off-Peak
            </Badge>
          )}
        </div>
      )}

      {/* Savings note */}
      {notification.savingsNote && (
        <p className="mt-2 text-[11px] text-emerald-400/80 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {notification.savingsNote}
        </p>
      )}

      {/* ── Bundled services ──────────────────────────────── */}
      {notification.bundledServices.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            {notification.bundledServices.length} additional service{notification.bundledServices.length > 1 ? "s" : ""} recommended
          </button>
          {expanded && (
            <div className="mt-1.5 space-y-1 pl-4">
              {notification.bundledServices.map((bs) => {
                const BsIcon = SERVICE_ICONS[bs.serviceType] || Wrench;
                return (
                  <div key={bs.serviceType} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BsIcon className="h-3 w-3 text-[hsl(var(--primary))]/60" />
                    <span className="capitalize">{bs.serviceType.replace(/_/g, " ")}</span>
                    <span className="text-[10px]">+{bs.additionalMinutes} min</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom: Actions ───────────────────────────────── */}
      {notification.status === "pending" && (
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onAccept(notification.id)}
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground text-xs h-8 px-4"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Accept
          </Button>
          {notification.bundledServices.length > 0 && onAcceptAll && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcceptAll(notification.id)}
              className="text-xs h-8 border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]"
            >
              Accept All
            </Button>
          )}
          <button
            onClick={() => onReschedule(notification.id)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto flex items-center gap-1"
          >
            <CalendarClock className="h-3 w-3" />
            Reschedule
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--primary))]">
          <Check className="h-4 w-4" />
          <span className="font-medium">Confirmed</span>
        </div>
      )}
    </div>
  );
}
