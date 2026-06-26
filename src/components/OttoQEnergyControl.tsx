import { useState } from "react";
import { Gauge, ShieldCheck, BatteryCharging, Activity, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useStatusBrief,
  useEnergyAggressiveness,
  useSetEnergyAggressiveness,
} from "@/hooks/use-ottoq-frontier";

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div>
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="font-mono text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

/**
 * OTTO-Q Energy Control — manager-side peak-shave dial + live confidence read.
 * Drives the real otto-q-core energy policy (ottoq_policy_set), clamped to the safe range.
 */
export function OttoQEnergyControl() {
  const { data: brief } = useStatusBrief();
  const { data: aggr } = useEnergyAggressiveness();
  const setAggr = useSetEnergyAggressiveness();
  const [local, setLocal] = useState<number | null>(null);
  const value = local ?? aggr?.aggressiveness ?? 0.5;

  const apply = (a: number) =>
    setAggr.mutate(a, {
      onSuccess: (r) =>
        toast.success("OTTO-Q energy target updated", {
          description: `Now shaving the peak ~${Math.round(a * 100)}% aggressively${
            r?.clamped ? " (clamped to the safe range)" : ""
          }.`,
        }),
      onError: (e) => toast.error("Could not update setting", { description: e.message }),
    });

  const peak = brief?.recent_grid_peak_kw;
  const confidence = brief?.active_run
    ? Math.round((1 - (brief.forecast_uncertainty_0to1 ?? 0)) * 100)
    : null;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-display">
          <Gauge className="h-4 w-4 text-primary" />
          OTTO-Q Energy Control
        </CardTitle>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          peak-shave
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Demand-charge aggressiveness</span>
            <span className="font-mono text-sm font-bold text-primary">{Math.round(value * 100)}%</span>
          </div>
          <Slider
            value={[value * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => setLocal(v[0] / 100)}
            onValueCommit={(v) => apply(v[0] / 100)}
            disabled={setAggr.isPending}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Gentle · charge fast</span>
            <span>Max shave · lowest bill</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Higher = OTTO-Q holds the depot&rsquo;s peak grid power lower, leaning on the battery instead of
          delaying vehicles. Every ~100&nbsp;kW shaved ≈{" "}
          <span className="text-foreground font-medium">$1,000–1,500/mo</span> in demand charges. The 52-rule
          safety shield gates every action.
        </p>

        {brief?.active_run ? (
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <Stat label="Confidence" value={`${confidence}%`} icon={ShieldCheck} />
            <Stat label="Battery" value={`${brief.battery_soc_pct ?? "—"}%`} icon={BatteryCharging} />
            <Stat label="Billed peak" value={`${peak ?? "—"} kW`} icon={Activity} />
            <Stat label="Charging" value={`${brief.charging_now ?? 0}`} icon={Zap} />
            <Stat label="Ready" value={`${brief.ready_to_deploy ?? 0}`} icon={Sparkles} />
            <Stat label="Unsafe" value={`${brief.unsafe_so_far ?? 0}`} icon={ShieldCheck} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 p-3">
            No live operation running — your setting is saved and applies the moment OTTO-Q is orchestrating.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
