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

  return (
    <div className="space-y-4">
      {/* Primary CTA — Request OTTOW */}
      <Card className="glass-panel border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">OTTOW Assistance</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Request roadside assistance or tow service to the nearest depot
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button size="sm" className="flex-1 sm:flex-none gap-1.5" onClick={() => setShowActiveTow(true)}>
                <Navigation className="h-3.5 w-3.5" />
                Dispatch to My Location
              </Button>
              <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Request OTTOW
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request OTTOW</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Vehicle Location</label>
                      <Input defaultValue="412 Broadway, Nashville, TN 37203" />
                      <p className="text-[10px] text-muted-foreground mt-1">GPS location auto-detected. Edit if needed.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Issue Type</label>
                      <Select value={issueType} onValueChange={setIssueType}>
                        <SelectTrigger>
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
                      <label className="text-sm font-medium mb-1.5 block">Description</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Destination</label>
                      <Select defaultValue="nearest">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nearest">Nearest Depot</SelectItem>
                          <SelectItem value="depot-nash-01">OTTO Nashville #1</SelectItem>
                          <SelectItem value="depot-nash-02">OTTO Nashville #2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleSubmitRequest}>
                      <Send className="h-4 w-4 mr-2" />
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
          <Card className="glass-panel border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-primary" />
                  Dispatch Status
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30 animate-pulse">
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
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 flex-shrink-0" />
                        )}
                        {index < towStages.length - 1 && (
                          <div
                            className={`w-0.5 h-6 ${
                              isComplete ? "bg-success" : "bg-muted-foreground/15"
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`text-xs pb-4 ${
                          isComplete
                            ? "text-success"
                            : isCurrent
                            ? "text-primary font-semibold"
                            : "text-muted-foreground/40"
                        }`}
                      >
                        {stage}
                        {isCurrent && (
                          <span className="text-[10px] ml-2 text-primary/70">In Progress</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          <Card className="glass-panel border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                Driver Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-3xl font-bold text-primary">{mockActiveTow.etaMinutes} min</p>
                <p className="text-xs text-muted-foreground mt-1">Estimated Arrival</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-medium text-foreground">{mockActiveTow.driverName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium text-foreground">{mockActiveTow.driverVehicle}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">{mockActiveTow.driverPhone}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full text-xs">
                <Phone className="h-3.5 w-3.5 mr-2" />
                Call Driver
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tow History */}
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            OTTOW History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {towRequests.length > 0 ? (
            towRequests.map((tow) => (
              <div
                key={tow.id}
                className="flex items-center justify-between p-3 rounded-lg glass-panel border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center">
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
                  className="text-[10px] bg-success/15 text-success border-success/30 capitalize"
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
