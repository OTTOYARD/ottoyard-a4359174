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
  Bot,
  BarChart3,
  List,
  Brain,
} from "lucide-react";
import OttoQStatus from "@/components/OttoQ/OttoQStatus";
import type { ServiceRecord, MaintenancePrediction } from "@/lib/orchestra-ev/types";
import { ServiceCalendar } from "@/components/OttoQ/MemberServices/ServiceCalendar";
import { ServiceTimeline } from "@/components/OttoQ/MemberServices/ServiceTimeline";
import { SmartScheduleAssistant } from "@/components/OttoQ/MemberServices/SmartScheduleAssistant";
import { CostSavingsCard } from "@/components/OttoQ/MemberInsights/CostSavingsCard";
import { UsagePatternChart } from "@/components/OttoQ/MemberInsights/UsagePatternChart";

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
  const [servicesView, setServicesView] = useState("ottoq");
  const [deepInsightsOpen, setDeepInsightsOpen] = useState(false);

  const completedServices = serviceRecords.filter((s) => s.status === "completed");

  return (
    <div className="space-y-4">
      {/* Sub-navigation: OTTO-Q vs Classic */}
      <div className="surface-luxury rounded-2xl p-1 flex">
        {[
          { key: "ottoq", label: "OTTO-Q Smart", icon: Bot },
          { key: "schedule", label: "Schedule", icon: CalendarIcon },
          { key: "history", label: "History", icon: History },
          { key: "insights", label: "Insights", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setServicesView(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium transition-all ${
                servicesView === tab.key
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* OTTO-Q Smart View */}
      {servicesView === "ottoq" && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Deep Insights Button */}
          <button
            onClick={() => setDeepInsightsOpen(true)}
            className="w-full surface-luxury rounded-2xl border border-primary/20 hover:border-primary/40 p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] group"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Deep Insights</p>
              <p className="text-[10px] text-muted-foreground">Operations, energy, predictions & depot intelligence</p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/25">
              Live
            </Badge>
          </button>

          {/* Deep Insights Dialog */}
          <Dialog open={deepInsightsOpen} onOpenChange={setDeepInsightsOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  OTTO-Q Deep Insights
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6">
                <OttoQStatus />
              </div>
            </DialogContent>
          </Dialog>
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{pred.confidence} confidence</span>
                          <div className="h-1 w-16 rounded-full bg-muted/30 overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${confidencePct[pred.confidence] ?? 50}%` }} />
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{pred.reasoning}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Suggested by{" "}
                          <span className="text-foreground font-medium">
                            {new Date(pred.predictedDueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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

          {/* Smart Schedule Assistant */}
          <SmartScheduleAssistant />

          {/* Quick book */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-label-uppercase">Preferred Date</label>
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date()} className="pointer-events-auto" />
                      </div>
                      <Button className="futuristic-button rounded-xl w-full py-3 text-base font-semibold" onClick={() => setScheduleOpen(false)}>
                        Confirm Booking
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="surface-luxury rounded-2xl border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Premium Add-Ons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Ceramic Coating", desc: "Long-lasting paint protection", price: "$299" },
                  { name: "Paint Correction", desc: "Remove swirls and scratches", price: "$199" },
                  { name: "Windshield Treatment", desc: "Hydrophobic rain repellent", price: "$79" },
                ].map((addon) => (
                  <div key={addon.name} className="surface-luxury rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">{addon.name}</p>
                      <p className="text-[10px] text-muted-foreground">{addon.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-primary tabular-nums text-luxury">{addon.price}</p>
                      <Button variant="outline" size="sm" className="glass-button rounded-lg h-7 text-xs font-semibold">Add</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {servicesView === "schedule" && (
        <div className="animate-fade-in-up">
          <ServiceCalendar services={serviceRecords} />
        </div>
      )}

      {/* History view */}
      {servicesView === "history" && (
        <div className="animate-fade-in-up">
          <ServiceTimeline services={serviceRecords} />
        </div>
      )}

      {/* Insights view */}
      {servicesView === "insights" && (
        <div className="space-y-4 animate-fade-in-up">
          <CostSavingsCard />
          <UsagePatternChart />
        </div>
      )}
    </div>
  );
};
