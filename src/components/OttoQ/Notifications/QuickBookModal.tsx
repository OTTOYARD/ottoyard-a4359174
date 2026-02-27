// QuickBookModal — Booking confirmation / reschedule modal
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceNotification, TimeSlot } from "@/services/ottoq-notifications";
import {
  X,
  Check,
  Clock,
  MapPin,
  CalendarPlus,
  DollarSign,
  Zap,
  Droplets,
  CircleDot,
  HeartPulse,
  Wrench,
} from "lucide-react";
import type { ServiceType } from "@/types/ottoq";

const SERVICE_ICONS: Record<ServiceType, typeof Zap> = {
  charge: Zap,
  detail_clean: Droplets,
  tire_rotation: CircleDot,
  battery_health_check: HeartPulse,
  full_service: Wrench,
};

interface Props {
  notification: ServiceNotification;
  rescheduleMode?: boolean;
  onConfirm: (slot: TimeSlot) => void;
  onCancel: () => void;
}

export default function QuickBookModal({ notification, rescheduleMode, onConfirm, onCancel }: Props) {
  const allSlots = [notification.recommendedSlot, ...notification.alternativeSlots];
  const [selectedIdx, setSelectedIdx] = useState(rescheduleMode ? -1 : 0);
  const [confirmed, setConfirmed] = useState(false);
  const Icon = SERVICE_ICONS[notification.serviceType] || Wrench;

  const handleConfirm = () => {
    if (selectedIdx < 0) return;
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(allSlots[selectedIdx]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl",
        "bg-[hsl(var(--card))] border border-white/[0.06] backdrop-blur-xl",
        "animate-in slide-in-from-bottom-6 duration-300 shadow-2xl shadow-black/40"
      )}>
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Confirmed animation */}
        {confirmed && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[hsl(var(--card))]/95">
            <div className="flex flex-col items-center animate-in zoom-in-50 duration-500">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-[hsl(var(--primary))] animate-in zoom-in-0 duration-700" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">Booking Confirmed</p>
              <p className="text-xs text-muted-foreground mt-1">We'll have everything ready</p>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10">
              <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {rescheduleMode ? "Choose New Time" : "Confirm Booking"}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {notification.serviceType.replace(/_/g, " ")} · ~{notification.estimatedDurationMinutes} min
              </p>
            </div>
          </div>

          {/* Mini depot visualization */}
          <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              <span>OTTOYARD Nashville Pilot</span>
            </div>
            {/* Simplified stall grid */}
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => {
                const isSelected = allSlots[selectedIdx]?.stallNumber === i + 1;
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-6 w-8 rounded text-[9px] flex items-center justify-center font-mono",
                      isSelected
                        ? "bg-[hsl(var(--primary))] text-primary-foreground"
                        : "bg-white/5 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time slot selection */}
          <div className="space-y-2 mb-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {rescheduleMode ? "Available Slots" : "Recommended Time"}
            </p>
            {allSlots.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  selectedIdx === idx
                    ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  selectedIdx === idx ? "border-[hsl(var(--primary))]" : "border-white/20"
                )}>
                  {selectedIdx === idx && (
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {new Date(slot.start).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {idx === 0 && !rescheduleMode && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {slot.stallNumber && (
                      <span className="text-[10px] text-muted-foreground">Stall #{slot.stallNumber}</span>
                    )}
                    {slot.isOffPeak && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <DollarSign className="h-2.5 w-2.5" />
                        Off-peak savings
                      </span>
                    )}
                  </div>
                </div>
                {slot.costDollars !== null && (
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    ${slot.costDollars.toFixed(2)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Estimated completion */}
          {selectedIdx >= 0 && (
            <p className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Est. completion:{" "}
              {new Date(allSlots[selectedIdx].end).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={selectedIdx < 0 || confirmed}
              className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground h-10"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Confirm Booking
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-white/10"
              aria-label="Add to calendar"
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
