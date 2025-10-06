import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("ottoq_depots")
        .select("id, name, address")
        .eq("city_id", cityId)
        .order("name");

      if (error) throw error;

      setDepots(data || []);
      if (data && data.length > 0) {
        setSelectedDepot(data[0].id);
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

      const { data, error } = await supabase.functions.invoke(
        "ottoq-jobs-request",
        {
          body: {
            vehicle_id: vehicle.id,
            job_type: jobType,
            preferred_depot_id: selectedDepot,
            earliest_start_at,
            metadata: {
              requested_via: "fleet_ui",
              timing_preference: timing,
            },
          },
        }
      );

      if (error) throw error;

      toast.success(
        `Job scheduled for ${vehicle.external_ref || vehicle.id.slice(0, 8)}`
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule OTTOYARD Service</DialogTitle>
          <DialogDescription>
            Send {vehicle.external_ref || vehicle.id.slice(0, 8)} in{" "}
            {vehicle.city} to an OTTOYARD depot
          </DialogDescription>
        </DialogHeader>

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
                <SelectContent>
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

        <div className="flex gap-3 pt-4 border-t">
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
