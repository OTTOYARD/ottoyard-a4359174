// src/components/OemAcceptanceDialog.tsx
// Dialog for accepting/rejecting an OEM gate request from the progression engine.

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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useOemAccept, type PendingOemGate } from "@/hooks/use-orchestra-progression";

interface OemAcceptanceDialogProps {
  gate: PendingOemGate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OPERATOR_ID = "orchestra_operator"; // Demo: replace with auth.uid() when role gating lands

export function OemAcceptanceDialog({ gate, open, onOpenChange }: OemAcceptanceDialogProps) {
  const [mode, setMode] = useState<"none" | "reject">("none");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const accept = useOemAccept();

  // Live countdown
  useEffect(() => {
    if (!gate?.expires_at || !open) return;
    const tick = () => {
      const ms = new Date(gate.expires_at!).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gate, open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMode("none");
      setReason("");
      setError(null);
    }
  }, [open]);

  if (!gate) return null;

  const expired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const flashing = secondsLeft > 0 && secondsLeft < 30;

  const onSubmit = async (accepted: boolean) => {
    setError(null);
    if (!accepted && reason.trim().length < 3) {
      setError("Rejection reason must be at least 3 characters.");
      return;
    }
    try {
      await accept.mutateAsync({
        taskId: gate.task_id,
        accepted,
        accepted_by: OPERATOR_ID,
        reason: accepted ? undefined : reason.trim(),
      });
      toast.success(
        accepted
          ? `${gate.vehicle_external_ref ?? "Vehicle"} released for redeployment`
          : `${gate.vehicle_external_ref ?? "Vehicle"} rejected. Vehicle held in emergency staging.`,
      );
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message ?? "Request failed";
      // Standard error envelope handling
      if (msg.includes("CONFLICT") || msg.includes("409")) {
        toast.info("Gate already resolved by another operator.");
        onOpenChange(false);
      } else if (msg.includes("NOT_FOUND") || msg.includes("404")) {
        toast.info("Gate no longer exists.");
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
          <DialogTitle>OEM Acceptance — Final Redeploy</DialogTitle>
          <DialogDescription>
            {gate.vehicle_external_ref ?? gate.vehicle_id?.slice(0, 8)}
            {gate.vehicle_oem && ` · ${gate.vehicle_oem}`}
            {gate.depot_name && ` · ${gate.depot_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Countdown */}
          <div
            className={`flex items-center justify-between p-3 rounded-md border ${
              expired
                ? "bg-destructive/10 border-destructive/30"
                : flashing
                ? "bg-warning/10 border-warning/30 animate-pulse"
                : "bg-muted/40 border-border/40"
            }`}
            aria-live="polite"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {expired ? "Expired" : "Expires in"}
            </span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                expired ? "text-destructive" : flashing ? "text-warning" : "text-foreground"
              }`}
            >
              {expired ? "—" : `${minutes}m ${String(seconds).padStart(2, "0")}s`}
            </span>
          </div>

          {gate.on_timeout && (
            <div className="text-xs text-muted-foreground">
              On timeout: <span className="font-medium">{gate.on_timeout}</span>
            </div>
          )}

          {gate.audit_note && (
            <div className="text-xs italic text-muted-foreground">
              "{gate.audit_note}"
            </div>
          )}

          {mode === "reject" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Rejection reason (required)</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this vehicle being rejected?"
                rows={3}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {mode === "none" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("reject")}
                disabled={accept.isPending || expired}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onSubmit(true)}
                disabled={accept.isPending || expired}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Accept & Release
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("none")}
                disabled={accept.isPending}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onSubmit(false)}
                disabled={accept.isPending || reason.trim().length < 3}
              >
                Submit Rejection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
