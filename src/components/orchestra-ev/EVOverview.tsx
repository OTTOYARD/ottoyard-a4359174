import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Calendar,
  Wrench,
  Truck,
  Target,
  Bell,
  BellDot,
  Crown,
  User,
  CalendarDays,
  Zap,
  MapPin,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { EVVehicleHero } from "./EVVehicleHero";
import { EVAmenities } from "./EVAmenities";
import type {
  Subscriber,
  SubscriberVehicle,
  ServiceRecord,
  EVNotification,
  EVEvent,
  MaintenancePrediction,
  AmenityAvailability,
  AmenityReservation,
} from "@/lib/orchestra-ev/types";

interface EVOverviewProps {
  subscriber: Subscriber;
  vehicle: SubscriberVehicle;
  serviceRecords: ServiceRecord[];
  notifications: EVNotification[];
  events: EVEvent[];
  predictions: MaintenancePrediction[];
  amenityAvailability: AmenityAvailability;
  amenityReservations: AmenityReservation[];
  onTabChange: (tab: string) => void;
}

const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground border-muted",
  premium: "bg-warning/15 text-warning border-warning/30",
  enterprise: "bg-primary/15 text-primary border-primary/30",
};

export const EVOverview: React.FC<EVOverviewProps> = ({
  subscriber,
  vehicle,
  serviceRecords,
  notifications,
  events,
  predictions,
  amenityAvailability,
  amenityReservations,
  onTabChange,
}) => {
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const upcomingServices = serviceRecords.filter(
    (s) => s.status === "scheduled" || s.status === "in_progress"
  );
  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleOpenAmenities = () => {
    setAmenitiesOpen(true);
    setTimeout(() => {
      amenitiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <div className="space-y-4">
      {/* My Vehicle — Primary / Hero Section */}
      <EVVehicleHero vehicle={vehicle} />

      {/* Subscriber Profile + Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscriber Card */}
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {subscriber.firstName} {subscriber.lastName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] ${tierColors[subscriber.membershipTier]}`}>
                    <Crown className="h-2.5 w-2.5 mr-1" />
                    {subscriber.membershipTier}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Since {new Date(subscriber.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs justify-start gap-1.5"
                onClick={() => onTabChange("services")}
              >
                <Wrench className="h-3.5 w-3.5" />
                Schedule Service
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs justify-start gap-1.5"
                onClick={() => onTabChange("towing")}
              >
                <Truck className="h-3.5 w-3.5" />
                Request OTTOW
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs justify-start gap-1.5"
                onClick={handleOpenAmenities}
              >
                <Target className="h-3.5 w-3.5" />
                Reserve Amenity
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs justify-start gap-1.5"
                onClick={() => onTabChange("depot-q")}
              >
                <MapPin className="h-3.5 w-3.5" />
                Track at Depot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Services + Predictive Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Services */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingServices.length > 0 ? (
              upcomingServices.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-foreground capitalize">
                      {svc.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {svc.depotName} •{" "}
                      {new Date(svc.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {svc.status === "in_progress" ? "In Progress" : "Scheduled"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No upcoming services scheduled.</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-primary h-7 mt-1"
              onClick={() => onTabChange("services")}
            >
              View All Services →
            </Button>
          </CardContent>
        </Card>

        {/* Predictive Maintenance Highlights */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Maintenance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {predictions.slice(0, 2).map((pred) => {
              const urgencyColor =
                pred.urgency === "urgent"
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : pred.urgency === "soon"
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-success/15 text-success border-success/30";
              return (
                <div key={pred.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-foreground">{pred.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Suggested by{" "}
                      {new Date(pred.predictedDueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${urgencyColor}`}>
                    {pred.urgency}
                  </Badge>
                </div>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-primary h-7 mt-1"
              onClick={() => onTabChange("services")}
            >
              View All Recommendations →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Amenities — Collapsible Tile */}
      <div ref={amenitiesRef}>
        <Collapsible open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
          <Card className="glass-panel border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer select-none">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary" />
                    Amenities
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${amenitiesOpen ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <EVAmenities availability={amenityAvailability} reservations={amenityReservations} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Notifications + Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notifications */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              {unreadNotifications.length > 0 ? (
                <BellDot className="h-4 w-4 text-primary" />
              ) : (
                <Bell className="h-4 w-4 text-primary" />
              )}
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1">
                  {unreadNotifications.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                <div>
                  <p className="text-xs text-foreground">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground">{notif.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Events */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((evt) => (
              <div key={evt.id} className="space-y-1 py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{evt.title}</p>
                  {evt.rsvpd ? (
                    <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/30">
                      RSVP'd
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="h-5 text-[10px] px-2">
                      RSVP
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(evt.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  at {evt.time} • {evt.location}
                </p>
                <p className="text-[10px] text-muted-foreground">{evt.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
