import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Zap,
  Calendar as CalendarIcon,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Sparkles,
  Shield,
  History,
} from "lucide-react";
import type { ServiceRecord, MaintenancePrediction } from "@/lib/orchestra-ev/types";

interface EVServicesProps {
  serviceRecords: ServiceRecord[];
  predictions: MaintenancePrediction[];
}

const serviceTypeLabels: Record<string, string> = {
  charging: "Charging Session",
  detailing: "Full Detail",
  interior_clean: "Interior Clean",
  exterior_wash: "Exterior Wash",
  tire_rotation: "Tire Rotation",
  brake_inspection: "Brake Inspection",
  battery_diagnostic: "Battery Diagnostic",
  oil_change: "Oil Change",
  full_maintenance: "Full Maintenance Package",
  cabin_air_filter: "Cabin Air Filter",
};

const confidencePct: Record<string, number> = { high: 90, medium: 70, low: 40 };

export const EVServices: React.FC<EVServicesProps> = ({ serviceRecords, predictions }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const completedServices = serviceRecords.filter((s) => s.status === "completed");

  return (
    <div className="space-y-4">
      {/* Predictive Maintenance */}
      <Card className="surface-elevated-luxury rounded-2xl border-border/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Predictive Maintenance
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30 animate-shimmer-luxury-bg">
              AI-Powered
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Recommendations based on your vehicle's data and driving patterns
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {predictions.map((pred) => {
            const urgencyConfig = {
              urgent: { color: "bg-destructive/15 text-destructive border-destructive/30", border: "border-l-[3px] border-l-destructive/60", icon: AlertTriangle },
              soon: { color: "bg-warning/15 text-warning border-warning/30", border: "border-l-[3px] border-l-warning/60", icon: Clock },
              routine: { color: "bg-success/15 text-success border-success/30", border: "border-l-[3px] border-l-success/60", icon: CheckCircle2 },
            };
            const config = urgencyConfig[pred.urgency];
            const UrgencyIcon = config.icon;

            return (
              <div
                key={pred.id}
                className={`surface-luxury rounded-xl p-4 space-y-2.5 ${config.border} hover:shadow-md hover:border-l-[4px] hover:translate-x-1 transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-foreground">{pred.label}</p>
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        <UrgencyIcon className="h-2.5 w-2.5 mr-1" />
                        {pred.urgency}
                      </Badge>
                    </div>
                    {/* Confidence bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{pred.confidence} confidence</span>
                      <div className="h-1 w-16 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${confidencePct[pred.confidence] ?? 50}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{pred.reasoning}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Suggested by{" "}
                      <span className="text-foreground font-medium">
                        {new Date(pred.predictedDueDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="futuristic-button rounded-lg h-8 text-xs gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Schedule Now
                  </Button>
                  <Button variant="outline" size="sm" className="glass-button rounded-lg h-8 text-xs">
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Schedule New Service + Add-On Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule New Service */}
        <Card className="surface-luxury rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Schedule Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <button className="surface-luxury rounded-xl p-4 w-full border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-200 flex flex-col items-center justify-center gap-2">
                  <Plus className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Book a Service</span>
                </button>
              </DialogTrigger>
              <DialogContent className="glass-modal rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-luxury">Schedule Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-uppercase">Service Type</label>
                    <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                      <SelectTrigger className="glass-input rounded-xl">
                        <SelectValue placeholder="Choose a service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(serviceTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-uppercase">Preferred Date</label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-uppercase">Depot</label>
                    <Select defaultValue="nash-01">
                      <SelectTrigger className="glass-input rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nash-01">OTTO Nashville #1</SelectItem>
                        <SelectItem value="nash-02">OTTO Nashville #2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="futuristic-button rounded-xl w-full py-3 text-base font-semibold" onClick={() => setScheduleOpen(false)}>
                    Confirm Booking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-1">
              <p className="text-label-uppercase mb-2">Popular Services</p>
              {["charging", "detailing", "tire_rotation", "full_maintenance"].map((type) => (
                <button
                  key={type}
                  className="w-full flex items-center justify-between h-9 text-xs px-2 -mx-0 rounded-lg hover:bg-muted/20 transition-colors group"
                  onClick={() => {
                    setSelectedServiceType(type);
                    setScheduleOpen(true);
                  }}
                >
                  <span className="text-foreground font-medium">{serviceTypeLabels[type]}</span>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:rotate-90 transition-transform duration-200" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add-On Features */}
        <Card className="surface-luxury rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Premium Add-Ons
              </CardTitle>
              <span className="text-label-uppercase text-primary/30">PREMIUM</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Ceramic Coating", desc: "Long-lasting paint protection", price: "$299" },
              { name: "Paint Correction", desc: "Remove swirls and scratches", price: "$199" },
              { name: "Windshield Treatment", desc: "Hydrophobic rain repellent", price: "$79" },
              { name: "Seasonal Package", desc: "Winterize or summerize your EV", price: "$149" },
            ].map((addon) => (
              <div key={addon.name} className="surface-luxury rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">{addon.name}</p>
                  <p className="text-[10px] text-muted-foreground">{addon.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-primary tabular-nums text-luxury">{addon.price}</p>
                  <Button variant="outline" size="sm" className="glass-button rounded-lg h-7 text-xs font-semibold hover:shadow-glow-sm transition-all">
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Service History */}
      <Card className="surface-luxury rounded-2xl border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            Service History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {completedServices.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-border/30" />
              <div className="space-y-2 relative">
                {completedServices.map((svc) => (
                  <div key={svc.id} className="surface-luxury rounded-xl p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_hsl(var(--success)/0.15)] relative z-10">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground capitalize">{svc.type.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {svc.depotName} •{" "}
                          {new Date(svc.scheduledAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {svc.technicianName && ` • ${svc.technicianName}`}
                        </p>
                        {svc.notes && (
                          <p className="text-[10px] text-muted-foreground/70 italic">{svc.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {svc.cost > 0 ? (
                        <p className="text-base font-bold text-primary tabular-nums text-luxury">${svc.cost.toFixed(2)}</p>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/30">
                          Included
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No service history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
