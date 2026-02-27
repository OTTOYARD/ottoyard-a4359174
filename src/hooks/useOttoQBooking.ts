// useOttoQBooking — Member-facing notification & booking state
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationService, type ServiceNotification, type TimeSlot } from "@/services/ottoq-notifications";
import { BookingService } from "@/services/ottoq-booking";
import { useOttoQEngine } from "@/hooks/useOttoQEngine";
import type { OttoQMemberPreferences, OttoQEnergyPricing } from "@/types/ottoq";

export function useOttoQBooking() {
  const engine = useOttoQEngine(30_000);
  const [notifications, setNotifications] = useState<ServiceNotification[]>([]);
  const [preferences, setPreferences] = useState<OttoQMemberPreferences | null>(null);
  const [pricing, setPricing] = useState<OttoQEnergyPricing[]>([]);
  const [availableStalls, setAvailableStalls] = useState<{ id: string; stall_number: number; stall_type: string }[]>([]);

  const bookingService = useMemo(() => new BookingService(), []);

  // Fetch supporting data on mount
  useEffect(() => {
    (async () => {
      const [pricingRes, stallsRes] = await Promise.all([
        supabase.from("ottoq_ps_energy_pricing").select("*"),
        supabase.from("ottoq_ps_depot_stalls").select("id, stall_number, stall_type").eq("status", "available"),
      ]);
      if (pricingRes.data) setPricing(pricingRes.data as unknown as OttoQEnergyPricing[]);
      if (stallsRes.data) setAvailableStalls(stallsRes.data as any);

      // Try to load member preferences for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prefs } = await supabase
          .from("ottoq_ps_member_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (prefs) setPreferences(prefs as unknown as OttoQMemberPreferences);
      }
    })();
  }, []);

  // Generate notifications from engine queue when it updates
  useEffect(() => {
    if (engine.currentQueue.length === 0 || pricing.length === 0) return;

    const svc = new NotificationService(pricing);
    const newNotifs: ServiceNotification[] = [];

    for (const need of engine.currentQueue.slice(0, 20)) {
      if (!svc.shouldNotifyNow(need, preferences)) continue;

      const bundle = engine.bundles.find((b) => b.vehicleId === need.vehicleId);
      const chargeRec = engine.chargeRecommendations.find((c) => c.vehicleId === need.vehicleId);

      const notif = svc.generateNotification(need, bundle, chargeRec, preferences, availableStalls);
      newNotifs.push(notif);
    }

    setNotifications(newNotifs);
  }, [engine.currentQueue, engine.bundles, engine.chargeRecommendations, pricing, preferences, availableStalls]);

  // ── Actions ────────────────────────────────────────────────
  const acceptService = useCallback(
    async (notifId: string, slot?: TimeSlot) => {
      const notif = notifications.find((n) => n.id === notifId);
      if (!notif) return { success: false, message: "Notification not found" };
      const targetSlot = slot ?? notif.recommendedSlot;
      const result = await bookingService.acceptService(notif, targetSlot);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, status: "accepted" as const } : n))
        );
      }
      return result;
    },
    [notifications, bookingService]
  );

  const declineService = useCallback(
    async (notifId: string, reason?: string) => {
      const notif = notifications.find((n) => n.id === notifId);
      if (!notif) return { success: false, message: "Notification not found" };
      const result = await bookingService.declineService(notif, reason);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, status: "declined" as const } : n))
        );
      }
      return result;
    },
    [notifications, bookingService]
  );

  const rescheduleService = useCallback(
    async (serviceId: string, originalSlot: TimeSlot, newSlot: TimeSlot) => {
      return bookingService.rescheduleService(serviceId, originalSlot, newSlot);
    },
    [bookingService]
  );

  const updatePreferences = useCallback(
    async (updates: Partial<OttoQMemberPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("ottoq_ps_member_preferences")
        .upsert({ user_id: user.id, ...updates } as any, { onConflict: "user_id" });
      setPreferences((prev) => (prev ? { ...prev, ...updates } : null));
    },
    []
  );

  // Counts
  const unreadCount = notifications.filter((n) => n.status === "pending").length;

  const grouped = useMemo(() => {
    const actionRequired = notifications.filter((n) => n.status === "pending");
    const upcoming = notifications.filter((n) => n.status === "accepted");
    const recent = notifications.filter((n) => n.status === "declined" || n.status === "expired");
    return { actionRequired, upcoming, recent };
  }, [notifications]);

  return {
    notifications,
    grouped,
    unreadCount,
    preferences,
    acceptService,
    declineService,
    rescheduleService,
    updatePreferences,
    engineStatus: engine.engineStatus,
    triggerScan: engine.triggerManualScan,
  };
}
