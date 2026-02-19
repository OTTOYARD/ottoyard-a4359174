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

export const EVServices: React.FC<EVServicesProps> = ({ serviceRecords, predictions }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const completedServices = serviceRecords.filter((s) => s.status === "completed");

  return (
    <div className="space-y-4">
      {/* Predictive Maintenance — Primary Section */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Predictive Maintenance
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30">
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
              urgent: { color: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
              soon: { color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
              routine: { color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
            };
            const config = urgencyConfig[pred.urgency];
            const UrgencyIcon = config.icon;

            return (
              <div key={pred.id} className="glass-panel rounded-lg border border-border/30 p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-foreground">{pred.label}</p>
                      <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                        <UrgencyIcon className="h-2.5 w-2.5 mr-1" />
                        {pred.urgency}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {pred.confidence} confidence
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{pred.reasoning}</p>
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
                  <Button size="sm" className="h-7 text-xs gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Schedule Now
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
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
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Schedule Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" />
                  Book a Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Service Type</label>
                    <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                      <SelectTrigger>
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
                    <label className="text-xs font-medium text-foreground">Preferred Date</label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Depot</label>
                    <Select defaultValue="nash-01">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nash-01">OTTO Nashville #1</SelectItem>
                        <SelectItem value="nash-02">OTTO Nashville #2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={() => setScheduleOpen(false)}>
                    Confirm Booking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">Popular Services</p>
              {["charging", "detailing", "tire_rotation", "full_maintenance"].map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 text-xs"
                  onClick={() => {
                    setSelectedServiceType(type);
                    setScheduleOpen(true);
                  }}
                >
                  {serviceTypeLabels[type]}
                  <Plus className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add-On Features */}
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Premium Add-Ons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Ceramic Coating", desc: "Long-lasting paint protection", price: "$299" },
              { name: "Paint Correction", desc: "Remove swirls and scratches", price: "$199" },
              { name: "Windshield Treatment", desc: "Hydrophobic rain repellent", price: "$79" },
              { name: "Seasonal Package", desc: "Winterize or summerize your EV", price: "$149" },
            ].map((addon) => (
              <div key={addon.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground">{addon.name}</p>
                  <p className="text-[10px] text-muted-foreground">{addon.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-foreground">{addon.price}</p>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Service History */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            Service History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedServices.length > 0 ? (
            completedServices.map((svc) => (
              <div key={svc.id} className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                    <p className="text-xs font-bold text-foreground">${svc.cost.toFixed(2)}</p>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Included
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No service history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
