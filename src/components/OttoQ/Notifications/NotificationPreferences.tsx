// NotificationPreferences — Settings panel for notification controls
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import type { OttoQMemberPreferences } from "@/types/ottoq";

interface Props {
  preferences: OttoQMemberPreferences | null;
  onUpdate: (updates: Partial<OttoQMemberPreferences>) => void;
  onClose: () => void;
}

const LEAD_OPTIONS = [
  { label: "12h", value: 12 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
];

export default function NotificationPreferences({ preferences, onUpdate, onClose }: Props) {
  const prefs = preferences ?? {
    auto_accept_charges: false,
    auto_accept_cleans: false,
    notification_lead_time_hours: 24,
    calendar_sync_enabled: false,
    preferred_days: [],
    preferred_charge_times: [],
  };

  return (
    <div className="border-b border-white/5 bg-white/[0.02] px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notification Preferences
        </h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Auto-accept toggles */}
      <ToggleRow
        label="Auto-accept routine charges"
        description="Automatically confirm charge bookings below 70% urgency"
        checked={prefs.auto_accept_charges}
        onChange={(v) => onUpdate({ auto_accept_charges: v })}
      />
      <ToggleRow
        label="Auto-accept detail cleans"
        description="Automatically confirm scheduled cleaning sessions"
        checked={prefs.auto_accept_cleans}
        onChange={(v) => onUpdate({ auto_accept_cleans: v })}
      />
      <ToggleRow
        label="Calendar sync"
        description="Add confirmed bookings to your calendar"
        checked={prefs.calendar_sync_enabled}
        onChange={(v) => onUpdate({ calendar_sync_enabled: v })}
      />

      {/* Lead time */}
      <div>
        <p className="text-xs font-medium text-foreground/80 mb-2">Notification lead time</p>
        <div className="flex gap-1.5">
          {LEAD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ notification_lead_time_hours: opt.value })}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                prefs.notification_lead_time_hours === opt.value
                  ? "bg-[hsl(var(--primary))] text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground/80">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-snug">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
