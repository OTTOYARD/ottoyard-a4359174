import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Target,
  Monitor,
  Lock,
  ShoppingBag,
  ExternalLink,
  Clock,
  Users,
  Wifi,
  Zap as ZapIcon,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import type { AmenityAvailability, AmenityReservation } from "@/lib/orchestra-ev/types";

interface EVAmenitiesProps {
  availability: AmenityAvailability;
  reservations: AmenityReservation[];
}

export const EVAmenities: React.FC<EVAmenitiesProps> = ({ availability, reservations }) => {
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    type: string;
    item: string;
    slot: string;
  }>({ open: false, type: "", item: "", slot: "" });
  const [confirmPulse, setConfirmPulse] = useState(false);

  const handleBook = (type: string, item: string, slot: string) => {
    setBookingDialog({ open: true, type, item, slot });
  };

  const handleConfirm = () => {
    setConfirmPulse(true);
    setTimeout(() => {
      setConfirmPulse(false);
      setBookingDialog({ open: false, type: "", item: "", slot: "" });
    }, 600);
  };

  const iconGradient = (type: string) => {
    if (type === "sim_golf") return "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5";
    if (type === "cowork_table") return "bg-gradient-to-br from-blue-500/20 to-blue-500/5";
    return "bg-gradient-to-br from-purple-500/20 to-purple-500/5";
  };

  const iconFor = (type: string) => {
    if (type === "sim_golf") return <Target className="h-5 w-5 text-emerald-400" />;
    if (type === "cowork_table") return <Monitor className="h-5 w-5 text-blue-400" />;
    return <Lock className="h-5 w-5 text-purple-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Current Reservations */}
      {reservations.length > 0 && (
        <Card
          className="surface-luxury rounded-2xl border-border/30 animate-fade-in-up"
          style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Your Reservations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="surface-luxury rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconGradient(res.type)}`}>
                    {iconFor(res.type)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground capitalize">
                      {res.type.replace(/_/g, " ")}
                      {res.bayNumber && ` — ${res.bayNumber}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(res.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • {res.startTime} – {res.endTime} • {res.depotName}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-success/15 text-success border-success/30 capitalize shadow-[0_0_8px_hsl(var(--success)/0.15)]"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  {res.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sim Golf */}
      <Card
        className="surface-luxury rounded-2xl border-border/30 overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
      >
        {/* Decorative header banner */}
        <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
            Simulation Golf
            <span className="text-base ml-0.5">🏌️</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Reserve a bay while your vehicle is being serviced
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.simGolf.map((bay) => (
            <div key={bay.bayNumber} className="space-y-2">
              <p className="text-label-uppercase">{bay.bayNumber}</p>
              <div className="flex flex-wrap gap-2">
                {bay.slots.map((slot) => (
                  <button
                    key={slot}
                    className="surface-luxury rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 border border-border/30 hover:border-primary/30 hover:shadow-glow-sm hover:-translate-y-px transition-all duration-200"
                    onClick={() => handleBook("Sim Golf", bay.bayNumber, slot)}
                  >
                    <Clock className="h-3 w-3 text-primary/60" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cowork Tables */}
      <Card
        className="surface-luxury rounded-2xl border-border/30 overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
              <Monitor className="h-4 w-4 text-blue-400" />
            </div>
            Cowork Tables
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Productive workspace with power and connectivity
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.coworkTables.map((table) => (
            <div key={table.tableId} className="surface-luxury rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {table.tableId} — {table.type}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {table.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="bg-muted/30 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground flex items-center gap-1"
                    >
                      {amenity === "Wi-Fi" && <Wifi className="h-2.5 w-2.5" />}
                      {amenity === "Power Outlet" && <ZapIcon className="h-2.5 w-2.5" />}
                      {amenity === "Monitor" && <Monitor className="h-2.5 w-2.5" />}
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="glass-button rounded-lg font-medium text-xs"
                onClick={() => handleBook("Cowork Table", table.tableId, "All Day")}
              >
                Reserve
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Pods */}
      <Card
        className="surface-luxury rounded-2xl border-border/30 overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
              <Lock className="h-4 w-4 text-purple-400" />
            </div>
            Privacy Pods & Meeting Rooms
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Private spaces for calls, meetings, and focused work
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.privacyPods.map((pod) => (
            <div key={pod.podId} className="surface-luxury rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">{pod.podId}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Capacity as visual circles */}
                    <span className="bg-muted/30 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      <span className="flex gap-0.5 ml-0.5">
                        {Array.from({ length: pod.capacity }).map((_, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        ))}
                      </span>
                    </span>
                    {pod.equipment.map((eq) => (
                      <span
                        key={eq}
                        className="bg-muted/30 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pod.slots.map((slot) => (
                  <button
                    key={slot}
                    className="surface-luxury rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 border border-border/30 hover:border-primary/30 hover:shadow-glow-sm hover:-translate-y-px transition-all duration-200"
                    onClick={() => handleBook("Privacy Pod", pod.podId, slot)}
                  >
                    <Clock className="h-3 w-3 text-primary/60" />
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shop Link */}
      <Card
        className="surface-elevated-luxury rounded-2xl border-border/30 overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none rounded-2xl" />
        <CardContent className="pt-5 pb-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-luxury">OTTOYARD Shop</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browse merchandise, EV accessories, and more
                </p>
              </div>
            </div>
            <Button
              className="futuristic-button gap-1.5"
              size="sm"
              onClick={() => window.open("https://www.ottoyard.com", "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Shop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Booking Confirmation Dialog */}
      <Dialog
        open={bookingDialog.open}
        onOpenChange={(open) => setBookingDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="glass-modal rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-luxury">Confirm Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="surface-luxury rounded-xl p-6 text-center">
              <p className="text-xl font-bold text-luxury">{bookingDialog.type}</p>
              <p className="text-base text-muted-foreground mt-2">
                {bookingDialog.item} • {bookingDialog.slot}
              </p>
              <p className="text-xs text-muted-foreground mt-1">OTTO Nashville #1</p>
            </div>
            <Button
              className={`w-full futuristic-button rounded-xl py-3 text-base font-semibold gap-2 ${confirmPulse ? "animate-pulse-ring" : ""}`}
              onClick={handleConfirm}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Reservation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
