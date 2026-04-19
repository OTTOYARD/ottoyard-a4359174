// src/components/OemMidFlowFlagDialog.tsx
// Dialog for OEM to flag a vehicle mid-flow and sequester it in place.

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Flag } from "lucide-react";
import { toast } from "sonner";
import { useOemMidFlowFlag } from "@/hooks/use-orchestra-progression";

interface OemMidFlowFlagDialogProps {
  vehicleId: string | null;
  vehicleLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OPERATOR_ID = "orchestra_operator"; // Demo

export function OemMidFlowFlagDialog({
  vehicleId,
  vehicleLabel,
  open,
  onOpenChange,
}: OemMidFlowFlagDialogProps) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("high");
  const [sequester, setSequester] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flag = useOemMidFlowFlag();

  useEffect(() => {
    if (!open) {
      setReason("");
      setSeverity("high");
      setSequester(true);
      setError(null);
    }
  }, [open]);

  const onSubmit = async () => {
    setError(null);
    if (reason.trim().length < 3) {
      setError("Reason must be at least 3 characters.");
      return;
    }
    if (!vehicleId) return;
    try {
      await flag.mutateAsync({
        vehicleId,
        flagged_by: OPERATOR_ID,
        reason: reason.trim(),
        severity,
        sequester,
      });
      toast.success(`Vehicle flagged for inspection`);
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message ?? "Request failed";
      if (msg.includes("FORBIDDEN") || msg.includes("403")) {
        setError("You don't have permission to flag this vehicle.");
      } else if (msg.includes("CONFLICT") || msg.includes("409")) {
        toast.info("Vehicle is already flagged.");
        onOpenChange(false);
      } else {
        setError(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Flag className="w-4 h-4 text-destructive" />
            <span>Flag Vehicle for Inspection</span>
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-medium border-destructive/30 bg-destructive/5 text-destructive"
              title="Action restricted to OEM Admin role in production"
            >
              OEM Admin
            </Badge>
          </DialogTitle>
          <DialogDescription>{vehicleLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            This will sequester the vehicle wherever it is currently in the depot and
            block progression until the flag is cleared.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Reason * (min 3 chars)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this vehicle being flagged?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Severity *</label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sequester"
              checked={sequester}
              onCheckedChange={(v) => setSequester(v === true)}
            />
            <label htmlFor="sequester" className="text-xs cursor-pointer">
              Sequester in place (recommended)
            </label>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={flag.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onSubmit}
            disabled={flag.isPending || reason.trim().length < 3}
          >
            <Flag className="w-4 h-4 mr-1.5" />
            Flag {sequester ? "& Sequester" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
