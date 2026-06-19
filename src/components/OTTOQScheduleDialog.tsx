import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ottoqInvoke, ottoQFetch } from "@/lib/otto-q-api";
import { toast } from "sonner";
import { Loader2, Calendar, MapPin, Wrench } from "lucide-react";

interface Vehicle {
  id: string;
  external_ref: string;
  oem: string;
  city: string;
}

interface Depot {
  id: string;
  name: string;
  address: string;
}

interface OTTOQScheduleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityId: string;
  onSuccess?: () => void;
}

export const OTTOQScheduleDialog = ({
  vehicle,
  open,
  onOpenChange,
  cityId,
  onSuccess,
}: OTTOQScheduleDialogProps) => {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>("");
  const [jobType, setJobType] = useState<string>("CHARGE");
  const [timing, setTiming] = useState<string>("ASAP");
  const [loading, setLoading] = useState(false);
  const [fetchingDepots, setFetchingDepots] = useState(false);

  useEffect(() => {
    if (open && cityId) {
      fetchDepots();
    }
  }, [open, cityId]);

  const fetchDepots = async () => {
    setFetchingDepots(true);
    try {
      // Depots from the shared OTTO-Q brain fleet summary (the same depots OTTO-PULSE
      // and the depot views see) — no longer the legacy ycsisvozz ottoq_depots table.
      const summary: any = await ottoQFetch("/fleet/summary");
      const all: any[] = summary?.depots ?? [];
      const byCity = all.filter(
        (d: any) => !cityId || String(d.city || "").toLowerCase() === String(cityId).toLowerCase()
      );
      const list = (byCity.length ? byCity : all).map((d: any) => ({
        id: d.id,
        name: d.name,
        address: d.city || d.address || "",
      }));
      setDepots(list);
      if (list.length > 0) {
        setSelectedDepot(list[0].id);
      }
    } catch (error) {
      console.error("Error fetching depots:", error);
      toast.error("Failed to load depots");
    } finally {
      setFetchingDepots(false);
    }
  };

  const handleSchedule = async () => {
    if (!vehicle || !selectedDepot) {
      toast.error("Please select a depot");
      return;
    }

    setLoading(true);
    try {
      let earliest_start_at: string | undefined;
      const now = new Date();

      if (timing === "TODAY") {
        // Set to end of today
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        earliest_start_at = endOfDay.toISOString();
      } else if (timing === "NEXT_AVAILABLE") {
        // Set to tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        earliest_start_at = tomorrow.toISOString();
      }
      // ASAP = no earliest_start_at (immediate)

      // Owner REQUEST into the shared OTTO-Q brain (ottoq-jobs-request on otto-q-core):
      // ensures the schedule + service task, dispatches the vehicle inbound, and OTTO-Q
      // returns the coded sequence. The technician (OTTO-PULSE) confirms/executes on arrival.
      const data: any = await ottoqInvoke("ottoq-jobs-request", {
        vehicle_id: vehicle.id,
        job_type: jobType,
        preferred_depot_id: selectedDepot,
        earliest_start_at,
        requested_by: "fleet_manager",
        metadata: { requested_via: "orchestra_fleet_ui", timing_preference: timing },
      });

      toast.success(
        data?.message ||
          `Requested ${jobType.toLowerCase()} for ${vehicle.external_ref || vehicle.id.slice(0, 8)}`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error scheduling job:", error);
      toast.error(error.message || "Failed to schedule job");
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) return null;

  const jobTypeOptions = [
    { value: "CHARGE", label: "Charging", icon: "⚡" },
    { value: "MAINTENANCE", label: "Maintenance", icon: "🔧" },
    { value: "DETAILING", label: "Detailing", icon: "✨" },
  ];

  const timingOptions = [
    { value: "ASAP", label: "ASAP", description: "Schedule immediately" },
    { value: "TODAY", label: "Today", description: "Within today" },
    {
      value: "NEXT_AVAILABLE",
      label: "Next Available",
      description: "Tomorrow or later",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 gap-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>Schedule OTTOYARD Service</DialogTitle>
            <DialogDescription>
              Send {vehicle.external_ref || vehicle.id.slice(0, 8)} in{" "}
              {vehicle.city} to an OTTOYARD depot
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6 py-4">
            {/* Vehicle Info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vehicle</p>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.oem} • {vehicle.external_ref}
                  </p>
                </div>
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Depot Selection */}
            <div className="space-y-2">
              <Label>Select Depot</Label>
              {fetchingDepots ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <Select value={selectedDepot} onValueChange={setSelectedDepot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a depot" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={depot.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{depot.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {depot.address}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label>Service Type</Label>
              <RadioGroup value={jobType} onValueChange={setJobType}>
                {jobTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span>{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Timing */}
            <div className="space-y-2">
              <Label>Timing Preference</Label>
              <RadioGroup value={timing} onValueChange={setTiming}>
                {timingOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t bg-background shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            className="flex-1"
            disabled={loading || !selectedDepot}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Service
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
