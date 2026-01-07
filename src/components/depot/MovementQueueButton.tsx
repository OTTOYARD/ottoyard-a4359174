import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Zap, Sparkles, Wrench, ParkingCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MovementQueueButtonProps {
  vehicleId: string;
  currentResourceId: string;
  currentResourceType: string;
  depotId: string;
  onQueued?: () => void;
  disabled?: boolean;
}

const MOVEMENT_OPTIONS = [
  { value: "CHARGE_STALL", label: "Charging Stall", icon: Zap },
  { value: "CLEAN_DETAIL_STALL", label: "Cleaning Stall", icon: Sparkles },
  { value: "MAINTENANCE_BAY", label: "Maintenance Bay", icon: Wrench },
  { value: "STAGING_STALL", label: "Staging Area", icon: ParkingCircle },
] as const;

export function MovementQueueButton({
  vehicleId,
  currentResourceId,
  currentResourceType,
  depotId,
  onQueued,
  disabled = false,
}: MovementQueueButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleQueueMovement = async (targetType: string) => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("ottoq-queue-movement", {
        body: {
          vehicle_id: vehicleId,
          current_resource_id: currentResourceId,
          target_resource_type: targetType,
          target_depot_id: depotId,
        },
      });

      if (error) throw error;

      const targetLabel = MOVEMENT_OPTIONS.find((o) => o.value === targetType)?.label || targetType;
      toast.success(`Vehicle queued for ${targetLabel}`);
      onQueued?.();
    } catch (error) {
      console.error("Failed to queue movement:", error);
      toast.error("Failed to queue movement");
    } finally {
      setLoading(false);
    }
  };

  // Filter out current resource type
  const availableOptions = MOVEMENT_OPTIONS.filter(
    (opt) => opt.value !== currentResourceType
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-7"
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <ArrowRight className="w-3 h-3 mr-1.5" />
          )}
          Queue for Service
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Move vehicle to...
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleQueueMovement(option.value)}
              className="text-xs cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 mr-2" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
