import React, { useState, useRef } from "react";
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
  ChevronDown,
} from "lucide-react";
import { EVVehicleHero } from "./EVVehicleHero";
import { EVAmenities } from "./EVAmenities";
import { VehicleHealthRing } from "@/components/OttoQ/MemberDashboard/VehicleHealthRing";
import { UpcomingServicePreview } from "@/components/OttoQ/MemberDashboard/UpcomingServicePreview";
import { VehicleHealthTrend } from "@/components/OttoQ/MemberInsights/VehicleHealthTrend";
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

const tierBadgeStyle: Record<string, string> = {
  basic: "bg-muted/50 text-muted-foreground border-muted-foreground/20",
  premium: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30",
  enterprise: "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30",
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

  const quickActions = [
    { icon: Wrench, label: "Service", onClick: () => onTabChange("services") },
    { icon: Truck, label: "OTTOW", onClick: () => onTabChange("towing") },
    { icon: Target, label: "Amenity", onClick: handleOpenAmenities },
    { icon: MapPin, label: "Depot", onClick: () => onTabChange("depot-q") },
  ];

  return (
    <div className="space-y-4">
      {/* My Vehicle — Primary / Hero Section — stagger 0ms */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
        <EVVehicleHero vehicle={vehicle} />
      </div>

      {/* Vehicle Health Ring + Health Trend — stagger 50ms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
        <VehicleHealthRing vehicle={vehicle} onViewServices={() => onTabChange("services")} />
        <div className="space-y-4">
          <UpcomingServicePreview services={serviceRecords} onViewAll={() => onTabChange("services")} />
          <VehicleHealthTrend currentScore={vehicle.healthScore} />
        </div>
      </div>

      {/* Subscriber Profile + Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        {/* Subscriber Card */}
        <div className="surface-elevated-luxury rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-luxury">
                {subscriber.firstName} {subscriber.lastName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${tierBadgeStyle[subscriber.membershipTier]} ${
                    subscriber.membershipTier === "premium" ? "animate-shimmer-luxury-bg" : ""
                  }`}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {subscriber.membershipTier}
                </Badge>
                <span className="text-label-uppercase">
                  Since {new Date(subscriber.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="surface-elevated-luxury rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-label-uppercase">Quick Actions</span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="surface-luxury rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow-sm"
                >
                  <Icon className="h-5 w-5 text-primary mb-1.5" />
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Services + Predictive Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
        {/* Upcoming Services */}
        <div className="surface-luxury rounded-2xl p-5">
          <p className="text-sm font-semibold text-luxury flex items-center gap-1.5 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Services
          </p>
          <div className="space-y-1">
            {upcomingServices.length > 0 ? (
              upcomingServices.map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between py-2 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors"
                >
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
            <button
              className="w-full text-xs text-primary hover:text-primary/80 font-medium h-7 mt-2 flex items-center justify-center gap-1 group transition-colors"
              onClick={() => onTabChange("services")}
            >
              View All Services
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        {/* Predictive Maintenance Highlights */}
        <div className="surface-luxury rounded-2xl p-5">
          <p className="text-sm font-semibold text-luxury flex items-center gap-1.5 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            Maintenance Insights
          </p>
          <div className="space-y-1">
            {predictions.slice(0, 2).map((pred) => {
              const urgencyColor =
                pred.urgency === "urgent"
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : pred.urgency === "soon"
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-success/15 text-success border-success/30";
              return (
                <div
                  key={pred.id}
                  className="flex items-center justify-between py-2 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors"
                >
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
            <button
              className="w-full text-xs text-primary hover:text-primary/80 font-medium h-7 mt-2 flex items-center justify-center gap-1 group transition-colors"
              onClick={() => onTabChange("services")}
            >
              View All Recommendations
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Amenities — Collapsible Tile */}
      <div ref={amenitiesRef} className="animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        <Collapsible open={amenitiesOpen} onOpenChange={setAmenitiesOpen}>
          <div className="surface-luxury rounded-2xl overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="px-5 py-4 cursor-pointer select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-luxury">Amenities</span>
                    </span>
                    {!amenitiesOpen && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        Golf · Cowork · Pods
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ease-out ${
                      amenitiesOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-0">
                <EVAmenities availability={amenityAvailability} reservations={amenityReservations} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Notifications + Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
        {/* Notifications */}
        <div className="surface-luxury rounded-2xl p-5">
          <p className="text-sm font-semibold text-luxury flex items-center gap-1.5 mb-3">
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
          </p>
          <div className="space-y-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-2 py-2 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    notif.read ? "bg-muted-foreground/30" : "bg-primary animate-pulse-ring"
                  }`}
                />
                <div>
                  <p className="text-xs text-foreground">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="surface-luxury rounded-2xl p-5">
          <p className="text-sm font-semibold text-luxury flex items-center gap-1.5 mb-3">
            <CalendarDays className="h-4 w-4 text-primary" />
            Upcoming Events
          </p>
          <div className="space-y-2">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="py-2 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{evt.title}</p>
                  {evt.rsvpd ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-success/15 text-success border-success/30"
                      style={{ boxShadow: "0 0 8px hsl(var(--success) / 0.2)" }}
                    >
                      RSVP'd
                    </Badge>
                  ) : (
                    <button className="glass-button rounded-lg text-[10px] px-2.5 py-1 font-medium text-foreground">
                      RSVP
                    </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};
