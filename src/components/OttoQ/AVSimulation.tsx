import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Play, Pause, SkipForward, Truck, Zap, RotateCcw, AlertTriangle } from "lucide-react";
import { useAVOrchestrator } from "@/hooks/useAVOrchestrator";
import { AVPipelineView, DemandForecast, AVFleetTable, EnergyArbitrageCard } from "@/components/OttoQ/AVCommand";

export function AVSimulation() {
  const [showPanel, setShowPanel] = useState(false);
  const {
    pipelines, events, demandForecast, energyResult,
    isSurge, isRunning,
    triggerArrival, fastForward, toggleSurge, resetSim, setIsRunning,
    stagedCount, inServiceCount, deployedCount,
  } = useAVOrchestrator();

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="flex items-center gap-4 flex-wrap">
        <StatChip label="Total AVs" value={pipelines.length} />
        <StatChip label="In Service" value={inServiceCount} accent />
        <StatChip label="Staged" value={stagedCount} success />
        <StatChip label="Deployed" value={deployedCount} />
        {isSurge && <Badge className="bg-destructive/20 text-destructive text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />SURGE</Badge>}
      </div>

      {/* Sim controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={triggerArrival} className="text-xs gap-1.5">
          <Truck className="w-3.5 h-3.5" /> AV Arrival
        </Button>
        <Button size="sm" variant="outline" onClick={fastForward} className="text-xs gap-1.5">
          <SkipForward className="w-3.5 h-3.5" /> Fast Forward
        </Button>
        <Button
          size="sm"
          variant={isRunning ? "default" : "outline"}
          onClick={() => setIsRunning(!isRunning)}
          className="text-xs gap-1.5"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? "Pause" : "Auto-Run"}
        </Button>
        <Button
          size="sm"
          variant={isSurge ? "destructive" : "outline"}
          onClick={toggleSurge}
          className="text-xs gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" /> {isSurge ? "Normal Mode" : "Surge Mode"}
        </Button>
        <Button size="sm" variant="ghost" onClick={resetSim} className="text-xs gap-1.5 text-muted-foreground">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AVPipelineView pipelines={pipelines} />
        <DemandForecast forecast={demandForecast} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AVFleetTable pipelines={pipelines} />
        </div>
        <EnergyArbitrageCard result={energyResult} />
      </div>

      {/* Event log */}
      {events.length > 0 && (
        <div className="glass-card rounded-lg border border-border/20 p-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recent Events</h4>
          <div className="space-y-1 max-h-[160px] overflow-y-auto">
            {events.slice(0, 20).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="text-[9px] text-muted-foreground/60 w-14 shrink-0">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className="font-medium text-foreground">{e.vehicleId.slice(0, 10)}</span>
                <span>{e.fromState} → {e.toState}</span>
                <span className="ml-auto truncate max-w-[200px]">{e.stepLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, accent, success }: { label: string; value: number; accent?: boolean; success?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-bold ${accent ? "text-accent" : success ? "text-success" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
