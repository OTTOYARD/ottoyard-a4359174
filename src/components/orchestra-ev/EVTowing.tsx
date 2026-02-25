import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  Loader2,
  Circle,
  History,
  Send,
  User,
} from "lucide-react";
import type { TowRequest, TowIssueType } from "@/lib/orchestra-ev/types";

interface EVTowingProps {
  towRequests: TowRequest[];
}

const issueTypeLabels: Record<TowIssueType, string> = {
  flat_tire: "Flat Tire",
  dead_battery: "Dead Battery",
  accident: "Accident",
  mechanical: "Mechanical Failure",
  other: "Other",
};

const towStages = [
  "Request Submitted",
  "Driver Assigned",
  "En Route to Vehicle",
  "Arrived at Vehicle",
  "Vehicle Loaded",
  "En Route to Depot",
  "Delivered",
  "Completed",
];

// Mock an active tow dispatch for demo
const mockActiveTow = {
  driverName: "Jake Rivera",
  driverVehicle: "Ford F-350 Flatbed",
  driverPhone: "(615) 555-0267",
  etaMinutes: 12,
  currentStage: 2, // En Route to Vehicle
};

export const EVTowing: React.FC<EVTowingProps> = ({ towRequests }) => {
  const [requestOpen, setRequestOpen] = useState(false);
  const [showActiveTow, setShowActiveTow] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmitRequest = () => {
    setRequestOpen(false);
    setShowActiveTow(true);
    setIssueType("");
    setDescription("");
  };

  // ETA as proportion of 30 min max for ring
  const etaPct = Math.min(100, Math.round((mockActiveTow.etaMinutes / 30) * 100));

  return (
    <div className="space-y-4">
      {/* Primary CTA */}
      <Card className="surface-elevated-luxury rounded-2xl overflow-hidden border-border/30">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Truck className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-luxury">OTTOW Assistance</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Request roadside assistance or tow service to the nearest depot
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                className="futuristic-button rounded-xl py-3 px-6 text-base font-semibold gap-2 animate-pulse-ring flex-1 sm:flex-none"
                onClick={() => setShowActiveTow(true)}
              >
                <Navigation className="h-4 w-4" />
                Dispatch to My Location
              </Button>
              <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="glass-button rounded-xl py-3 px-6 text-base font-medium gap-2 flex-1 sm:flex-none">
                    <AlertTriangle className="h-4 w-4" />
                    Request OTTOW
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-modal rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-luxury">Request OTTOW</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-label-uppercase mb-1.5 block">Vehicle Location</label>
                      <Input className="glass-input rounded-xl" defaultValue="412 Broadway, Nashville, TN 37203" />
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                        GPS location auto-detected. Edit if needed.
                      </p>
                    </div>
                    <div>
                      <label className="text-label-uppercase mb-1.5 block">Issue Type</label>
                      <Select value={issueType} onValueChange={setIssueType}>
                        <SelectTrigger className="glass-input rounded-xl">
                          <SelectValue placeholder="Select issue type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(issueTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-label-uppercase mb-1.5 block">Description</label>
                      <Textarea
                        className="glass-input rounded-xl"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-label-uppercase mb-1.5 block">Destination</label>
                      <Select defaultValue="nearest">
                        <SelectTrigger className="glass-input rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nearest">Nearest Depot</SelectItem>
                          <SelectItem value="depot-nash-01">OTTO Nashville #1</SelectItem>
                          <SelectItem value="depot-nash-02">OTTO Nashville #2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="futuristic-button rounded-xl w-full py-3 text-base font-semibold gap-2" onClick={handleSubmitRequest}>
                      <Send className="h-4 w-4" />
                      Submit Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Dispatch Status */}
      {showActiveTow && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dispatch Lifecycle */}
          <Card
            className="surface-luxury rounded-2xl border-border/30 animate-fade-in-up"
            style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-primary" />
                  Dispatch Status
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/20 text-primary border-primary/40 animate-pulse shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                >
                  ACTIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {towStages.map((stage, index) => {
                  const isComplete = index < mockActiveTow.currentStage;
                  const isCurrent = index === mockActiveTow.currentStage;

                  return (
                    <div key={stage} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        {isComplete ? (
                          <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
                            <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center">
                            <Circle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                          </div>
                        )}
                        {index < towStages.length - 1 && (
                          <div
                            className={`w-[3px] h-5 ${
                              isComplete
                                ? "bg-success"
                                : isCurrent
                                ? "bg-gradient-to-b from-primary to-transparent"
                                : "bg-muted-foreground/15"
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`pt-1.5 pb-3 ${
                          isComplete
                            ? "text-xs text-success font-medium"
                            : isCurrent
                            ? "text-sm text-primary font-semibold"
                            : "text-xs text-muted-foreground/40"
                        }`}
                      >
                        {stage}
                        {isCurrent && (
                          <span className="text-[10px] ml-2 text-primary/70 animate-pulse">In Progress</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          <Card
            className="surface-luxury rounded-2xl border-border/30 animate-fade-in-up"
            style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                Driver Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ETA hero with conic ring */}
              <div className="surface-elevated-luxury rounded-2xl p-6 flex flex-col items-center">
                <div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${etaPct}%, hsl(var(--muted)) ${etaPct}%)`,
                  }}
                >
                  <div className="absolute inset-[5px] rounded-full bg-card flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-primary text-luxury leading-none">{mockActiveTow.etaMinutes}</p>
                    <p className="text-[10px] text-muted-foreground">min</p>
                  </div>
                </div>
                <p className="text-label-uppercase mt-3">Estimated Arrival</p>
              </div>

              <div className="space-y-0">
                {[
                  { label: "Driver", value: mockActiveTow.driverName },
                  { label: "Vehicle", value: mockActiveTow.driverVehicle },
                  { label: "Phone", value: mockActiveTow.driverPhone },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3 border-b border-border/20 text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full rounded-xl py-3 text-base font-medium bg-success/15 text-success border-success/30 hover:bg-success/25 gap-2"
              >
                <Phone className="h-4 w-4" />
                Call Driver
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tow History */}
      <Card className="surface-luxury rounded-2xl border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-luxury flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            OTTOW History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {towRequests.length > 0 ? (
            towRequests.map((tow) => (
              <div
                key={tow.id}
                className="surface-luxury rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center shadow-[0_0_8px_hsl(var(--success)/0.15)]">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground capitalize">
                      {tow.issueType.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tow.pickupLocation.address} → {tow.destinationDepot}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tow.requestedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" • "}Driver: {tow.driverName}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-success/15 text-success border-success/30 capitalize shadow-[0_0_8px_hsl(var(--success)/0.15)]"
                >
                  {tow.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No previous tow requests.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
