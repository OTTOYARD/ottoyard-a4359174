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

  const handleBook = (type: string, item: string, slot: string) => {
    setBookingDialog({ open: true, type, item, slot });
  };

  const handleConfirm = () => {
    setBookingDialog({ open: false, type: "", item: "", slot: "" });
  };

  return (
    <div className="space-y-4">
      {/* Current Reservations */}
      {reservations.length > 0 && (
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Your Reservations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reservations.map((res) => (
              <div key={res.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    {res.type === "sim_golf" ? (
                      <Target className="h-4 w-4 text-primary" />
                    ) : res.type === "cowork_table" ? (
                      <Monitor className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-primary" />
                    )}
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
                <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/30 capitalize">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  {res.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sim Golf */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            Simulation Golf
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Reserve a bay while your vehicle is being serviced
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.simGolf.map((bay) => (
            <div key={bay.bayNumber} className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{bay.bayNumber}</p>
              <div className="flex flex-wrap gap-1.5">
                {bay.slots.map((slot) => (
                  <Button
                    key={slot}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2 gap-1"
                    onClick={() => handleBook("Sim Golf", bay.bayNumber, slot)}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cowork Tables */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Monitor className="h-4 w-4 text-primary" />
            Cowork Tables
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Productive workspace with power and connectivity
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.coworkTables.map((table) => (
            <div key={table.tableId} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {table.tableId} — {table.type}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {table.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                      {amenity === "Wi-Fi" ? <Wifi className="h-2.5 w-2.5" /> : null}
                      {amenity === "Power Outlet" ? <ZapIcon className="h-2.5 w-2.5" /> : null}
                      {amenity === "Monitor" ? <Monitor className="h-2.5 w-2.5" /> : null}
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => handleBook("Cowork Table", table.tableId, "All Day")}
              >
                Reserve
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Pods */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-primary" />
            Privacy Pods & Meeting Rooms
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Private spaces for calls, meetings, and focused work
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.privacyPods.map((pod) => (
            <div key={pod.podId} className="space-y-2 py-2 border-b border-border/30 last:border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">{pod.podId}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                      <Users className="h-2.5 w-2.5" />
                      {pod.capacity} person{pod.capacity > 1 ? "s" : ""}
                    </Badge>
                    {pod.equipment.map((eq) => (
                      <Badge key={eq} variant="outline" className="text-[10px] px-1.5 py-0">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pod.slots.map((slot) => (
                  <Button
                    key={slot}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2 gap-1"
                    onClick={() => handleBook("Privacy Pod", pod.podId, slot)}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shop Link */}
      <Card className="glass-panel border-border/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">OTTOYARD Shop</p>
                <p className="text-[10px] text-muted-foreground">
                  Browse merchandise, EV accessories, and more
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4 glass-panel rounded-lg border border-border/30">
              <p className="text-lg font-bold text-foreground">{bookingDialog.type}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {bookingDialog.item} • {bookingDialog.slot}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">OTTO Nashville #1</p>
            </div>
            <Button className="w-full gap-1.5" onClick={handleConfirm}>
              <CheckCircle2 className="h-4 w-4" />
              Confirm Reservation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
