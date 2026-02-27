// OTTO-Q Booking Service — Handles accept, decline, reschedule, cancel, waitlist
import { supabase } from "@/integrations/supabase/client";
import type { ServiceNotification, TimeSlot } from "./ottoq-notifications";

export interface BookingResult {
  success: boolean;
  message: string;
  serviceId?: string;
}

export class BookingService {
  // ── Accept a recommendation ────────────────────────────────
  async acceptService(
    notification: ServiceNotification,
    slot: TimeSlot
  ): Promise<BookingResult> {
    try {
      // Check stall is still available
      if (slot.stallId) {
        const { data: stall } = await supabase
          .from("ottoq_ps_depot_stalls")
          .select("status")
          .eq("id", slot.stallId)
          .single();

        if (stall && stall.status !== "available") {
          return { success: false, message: "Stall no longer available. Please choose another slot." };
        }

        // Reserve the stall
        await supabase
          .from("ottoq_ps_depot_stalls")
          .update({
            status: "reserved" as any,
            current_vehicle_id: notification.vehicleId,
            current_session_start: slot.start,
            estimated_completion: slot.end,
          })
          .eq("id", slot.stallId);
      }

      // Create or update scheduled_services record
      const { data, error } = await supabase
        .from("ottoq_ps_scheduled_services")
        .insert({
          vehicle_id: notification.vehicleId,
          stall_id: slot.stallId,
          service_type: notification.serviceType as any,
          status: "scheduled" as any,
          predicted_need_date: new Date().toISOString(),
          scheduled_start: slot.start,
          scheduled_end: slot.end,
          priority_score: notification.urgencyScore,
          trigger_reason: notification.reason,
          user_response_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;

      return {
        success: true,
        message: "Booking confirmed! We'll have everything ready for you.",
        serviceId: data?.id,
      };
    } catch (err: any) {
      console.error("[BookingService] Accept error:", err);
      return { success: false, message: err.message || "Failed to confirm booking." };
    }
  }

  // ── Decline a recommendation ───────────────────────────────
  async declineService(
    notification: ServiceNotification,
    reason?: string
  ): Promise<BookingResult> {
    try {
      await supabase.from("ottoq_ps_scheduled_services").insert({
        vehicle_id: notification.vehicleId,
        service_type: notification.serviceType as any,
        status: "declined" as any,
        predicted_need_date: new Date().toISOString(),
        priority_score: notification.urgencyScore,
        trigger_reason: reason || "Member declined",
        user_response_at: new Date().toISOString(),
      });

      return { success: true, message: "Noted. We'll adjust future recommendations." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to log decline." };
    }
  }

  // ── Reschedule ─────────────────────────────────────────────
  async rescheduleService(
    serviceId: string,
    originalSlot: TimeSlot,
    newSlot: TimeSlot
  ): Promise<BookingResult> {
    try {
      // Release original stall
      if (originalSlot.stallId) {
        await supabase
          .from("ottoq_ps_depot_stalls")
          .update({
            status: "available" as any,
            current_vehicle_id: null,
            current_session_start: null,
            estimated_completion: null,
          })
          .eq("id", originalSlot.stallId);
      }

      // Reserve new stall
      if (newSlot.stallId) {
        const { data: stall } = await supabase
          .from("ottoq_ps_depot_stalls")
          .select("status")
          .eq("id", newSlot.stallId)
          .single();

        if (stall && stall.status !== "available") {
          return { success: false, message: "New slot unavailable. Please try another time." };
        }

        await supabase
          .from("ottoq_ps_depot_stalls")
          .update({
            status: "reserved" as any,
            current_session_start: newSlot.start,
            estimated_completion: newSlot.end,
          })
          .eq("id", newSlot.stallId);
      }

      // Update service record
      await supabase
        .from("ottoq_ps_scheduled_services")
        .update({
          stall_id: newSlot.stallId,
          scheduled_start: newSlot.start,
          scheduled_end: newSlot.end,
          status: "scheduled" as any,
        })
        .eq("id", serviceId);

      return { success: true, message: "Rescheduled successfully.", serviceId };
    } catch (err: any) {
      return { success: false, message: err.message || "Reschedule failed." };
    }
  }

  // ── Cancel ─────────────────────────────────────────────────
  async cancelService(
    serviceId: string,
    stallId: string | null,
    scheduledStart: string,
    cancellationWindowHours = 2
  ): Promise<BookingResult> {
    const start = new Date(scheduledStart);
    const hoursUntil = (start.getTime() - Date.now()) / 3_600_000;

    if (hoursUntil < cancellationWindowHours) {
      return {
        success: false,
        message: `Cannot cancel within ${cancellationWindowHours} hours of appointment. Please contact support.`,
      };
    }

    try {
      // Release stall
      if (stallId) {
        await supabase
          .from("ottoq_ps_depot_stalls")
          .update({
            status: "available" as any,
            current_vehicle_id: null,
            current_session_start: null,
            estimated_completion: null,
          })
          .eq("id", stallId);
      }

      await supabase
        .from("ottoq_ps_scheduled_services")
        .update({ status: "cancelled" as any })
        .eq("id", serviceId);

      return { success: true, message: "Booking cancelled." };
    } catch (err: any) {
      return { success: false, message: err.message || "Cancellation failed." };
    }
  }
}
