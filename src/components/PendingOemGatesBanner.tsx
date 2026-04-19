// src/components/PendingOemGatesBanner.tsx
// Amber callout shown at top of Fleet tab when vehicles are awaiting OEM acceptance.
// Hidden entirely when there are no pending gates.

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight } from "lucide-react";
import {
  usePendingOemGates,
  type PendingOemGate,
} from "@/hooks/use-orchestra-progression";
import { OemAcceptanceDialog } from "./OemAcceptanceDialog";

interface PendingOemGatesBannerProps {
  depotId?: string;
}

export function PendingOemGatesBanner({ depotId }: PendingOemGatesBannerProps) {
  const { data, isLoading } = usePendingOemGates(depotId);
  const [selectedGate, setSelectedGate] = useState<PendingOemGate | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Tick every second to update countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Filter to only those still pending (not expired by long pause)
  const activeGates = useMemo(() => {
    if (!data?.decisions) return [];
    return data.decisions.filter(
      (g): g is PendingOemGate => Boolean(g.task_id && g.expires_at),
    );
  }, [data]);

  if (isLoading || activeGates.length === 0) return null;

  const visible = showAll ? activeGates : activeGates.slice(0, 3);

  return (
    <>
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold">
                {activeGates.length} vehicle{activeGates.length !== 1 ? "s" : ""} awaiting OEM acceptance
              </span>
            </div>
            {activeGates.length > 3 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll ? "Show top 3" : `View all (${activeGates.length})`}
              </Button>
            )}
          </div>

          <div className="space-y-1">
            {visible.map((gate) => (
              <GateRow
                key={gate.id}
                gate={gate}
                onClick={() => setSelectedGate(gate)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <OemAcceptanceDialog
        gate={selectedGate}
        open={!!selectedGate}
        onOpenChange={(o) => !o && setSelectedGate(null)}
      />
    </>
  );
}

function GateRow({ gate, onClick }: { gate: PendingOemGate; onClick: () => void }) {
  const ms = new Date(gate.expires_at).getTime() - Date.now();
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const flashing = seconds > 0 && seconds < 30;
  const expired = seconds <= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-xs hover:bg-warning/10 transition-colors ${
        flashing ? "animate-pulse" : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate">
          {gate.vehicle_external_ref ?? gate.vehicle_id?.slice(0, 8) ?? "Vehicle"}
        </span>
        {gate.vehicle_oem && (
          <span className="text-muted-foreground truncate">{gate.vehicle_oem}</span>
        )}
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 h-4"
        >
          Final redeploy
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`font-mono tabular-nums ${
            expired ? "text-destructive" : flashing ? "text-warning font-semibold" : "text-muted-foreground"
          }`}
        >
          {expired ? "expired" : `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`}
        </span>
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </div>
    </button>
  );
}
