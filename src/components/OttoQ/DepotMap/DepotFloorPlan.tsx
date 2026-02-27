import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, Droplets, Wrench, ParkingSquare, AlertTriangle } from "lucide-react";
import type { StallRecord } from "@/services/ottoq-resource-manager";

const STATUS_COLORS: Record<string, string> = {
  available: "#00D4AA",
  occupied: "#FFFFFF",
  reserved: "#3B82F6",
  maintenance: "#EF4444",
};

const TYPE_COLORS: Record<string, string> = {
  charge_standard: "#00D4AA",
  charge_fast: "#00D4AA",
  clean_detail: "#3B82F6",
  service_bay: "#FFD700",
  staging: "#6B7280",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  charge_standard: <Zap className="h-3 w-3" />,
  charge_fast: <Zap className="h-3 w-3" />,
  clean_detail: <Droplets className="h-3 w-3" />,
  service_bay: <Wrench className="h-3 w-3" />,
  staging: <ParkingSquare className="h-3 w-3" />,
};

interface Props {
  depotId: string;
}

export default function DepotFloorPlan({ depotId }: Props) {
  const [stalls, setStalls] = useState<StallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ottoq_ps_depot_stalls")
        .select("*")
        .eq("depot_id", depotId)
        .order("stall_number", { ascending: true });
      if (data) setStalls(data as unknown as StallRecord[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("depot-stalls-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ottoq_ps_depot_stalls", filter: `depot_id=eq.${depotId}` }, (payload) => {
        setStalls((prev) => {
          const updated = payload.new as StallRecord;
          return prev.map((s) => (s.id === updated.id ? updated : s));
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [depotId]);

  const sections = useMemo(() => {
    const charge = stalls.filter((s) => s.stall_type === "charge_standard" || s.stall_type === "charge_fast");
    const clean = stalls.filter((s) => s.stall_type === "clean_detail");
    const service = stalls.filter((s) => s.stall_type === "service_bay");
    const staging = stalls.filter((s) => s.stall_type === "staging");
    return { charge, clean, service, staging };
  }, [stalls]);

  const utilByType = useMemo(() => {
    const calc = (arr: StallRecord[]) => {
      const total = arr.length || 1;
      const occ = arr.filter((s) => s.status === "occupied" || s.status === "reserved").length;
      return Math.round((occ / total) * 100);
    };
    return {
      charge: calc(sections.charge),
      clean: calc(sections.clean),
      service: calc(sections.service),
      staging: calc(sections.staging),
    };
  }, [sections]);

  if (loading) {
    return <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-8 animate-pulse h-[500px]" />;
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0A0A0A] to-[#0D0D1A] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">Depot Floor Plan</h3>
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Real-time</span>
      </div>

      {/* Floor layout */}
      <div className="grid grid-cols-12 gap-3 mb-5">
        {/* Charge section - left 5 cols */}
        <div className="col-span-5 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3 w-3 text-[#00D4AA]" />
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Charge ({sections.charge.length})</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {sections.charge.map((s) => (
              <StallCell key={s.id} stall={s} />
            ))}
          </div>
          <UtilBar pct={utilByType.charge} color="#00D4AA" />
        </div>

        {/* Clean section - center 3 cols */}
        <div className="col-span-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets className="h-3 w-3 text-[#3B82F6]" />
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Clean ({sections.clean.length})</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {sections.clean.map((s) => (
              <StallCell key={s.id} stall={s} />
            ))}
          </div>
          <UtilBar pct={utilByType.clean} color="#3B82F6" />

          {/* Service bay */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wrench className="h-3 w-3 text-[#FFD700]" />
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Service</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {sections.service.map((s) => (
                <StallCell key={s.id} stall={s} wide />
              ))}
            </div>
            <UtilBar pct={utilByType.service} color="#FFD700" />
          </div>
        </div>

        {/* Staging section - right 4 cols */}
        <div className="col-span-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ParkingSquare className="h-3 w-3 text-white/40" />
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Staging ({sections.staging.length})</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {sections.staging.map((s) => (
              <StallCell key={s.id} stall={s} />
            ))}
          </div>
          <UtilBar pct={utilByType.staging} color="#6B7280" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-white/[0.06]">
        {[
          { label: "Available", color: "#00D4AA" },
          { label: "Charging", color: "#FFFFFF" },
          { label: "Cleaning", color: "#3B82F6" },
          { label: "Service", color: "#FFD700" },
          { label: "Staging", color: "#6B7280" },
          { label: "Maintenance", color: "#EF4444" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
            <span className="text-[10px] text-white/40">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stall Cell ─────────────────────────────────────────────────
function StallCell({ stall, wide }: { stall: StallRecord; wide?: boolean }) {
  const color = stall.status === "maintenance"
    ? STATUS_COLORS.maintenance
    : stall.status === "available"
    ? STATUS_COLORS.available
    : TYPE_COLORS[stall.stall_type] ?? "#FFFFFF";

  const isOccupied = stall.status === "occupied" || stall.status === "reserved";

  const sessionMinutes = stall.current_session_start
    ? Math.round((Date.now() - new Date(stall.current_session_start).getTime()) / 60_000)
    : 0;

  const estRemainingMin = stall.estimated_completion
    ? Math.max(0, Math.round((new Date(stall.estimated_completion).getTime() - Date.now()) / 60_000))
    : null;

  const progressPct = estRemainingMin !== null && stall.current_session_start
    ? Math.min(100, Math.round((sessionMinutes / (sessionMinutes + estRemainingMin || 1)) * 100))
    : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`relative flex flex-col items-center justify-center rounded-md border transition-all duration-200 hover:scale-105 hover:shadow-lg ${
            wide ? "h-10" : "h-9"
          } ${
            stall.status === "maintenance"
              ? "border-red-500/30 bg-red-500/10"
              : isOccupied
              ? "border-white/10 bg-white/[0.04]"
              : "border-[#00D4AA]/20 bg-[#00D4AA]/[0.06]"
          }`}
          style={{
            boxShadow: isOccupied ? `0 0 8px ${color}20` : undefined,
          }}
        >
          <span className="text-[9px] font-mono tabular-nums" style={{ color }}>
            {stall.stall_number}
          </span>
          {isOccupied && (
            <span className="absolute bottom-0.5 left-0 right-0 h-0.5 rounded-full mx-1" style={{ background: color, opacity: 0.5 }} />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-[#111] border-white/10 p-3" side="top">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Stall #{stall.stall_number}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
              {stall.status}
            </span>
          </div>
          <div className="text-[10px] text-white/40">
            Type: {stall.stall_type.replace("_", " ")}
            {stall.charger_power_kw ? ` · ${stall.charger_power_kw}kW` : ""}
          </div>
          {isOccupied && (
            <>
              <div className="text-[10px] text-white/50">Session: {sessionMinutes}m elapsed</div>
              {estRemainingMin !== null && (
                <div className="space-y-1">
                  <div className="text-[10px] text-white/50">Est. remaining: {estRemainingMin}m</div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Utilization Bar ────────────────────────────────────────────
function UtilBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, opacity: 0.6 }}
      />
    </div>
  );
}
