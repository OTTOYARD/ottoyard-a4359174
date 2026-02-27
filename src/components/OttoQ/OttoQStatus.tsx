import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StallUtilizationSummary } from "@/types/ottoq";

// Segmented ring constants
const RADIUS = 52;
const STROKE = 10;
const CENTER = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SegmentDef {
  key: keyof StallUtilizationSummary;
  label: string;
  color: string;
  glow: string;
}

const SEGMENTS: SegmentDef[] = [
  { key: "charge", label: "Charge", color: "#00D4AA", glow: "rgba(0,212,170,0.35)" },
  { key: "clean_detail", label: "Clean", color: "#3B82F6", glow: "rgba(59,130,246,0.3)" },
  { key: "service_bay", label: "Service", color: "#FFD700", glow: "rgba(255,215,0,0.3)" },
  { key: "staging", label: "Staging", color: "#6B7280", glow: "rgba(107,114,128,0.25)" },
];

export default function OttoQStatus() {
  const [stalls, setStalls] = useState<Array<{ stall_type: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("ottoq_ps_depot_stalls")
        .select("stall_type, status");
      if (!error && data) setStalls(data);
      setLoading(false);
    })();
  }, []);

  const summary = useMemo<StallUtilizationSummary>(() => {
    const buckets = {
      charge: { total: 0, occupied: 0, available: 0 },
      clean_detail: { total: 0, occupied: 0, available: 0 },
      service_bay: { total: 0, occupied: 0, available: 0 },
      staging: { total: 0, occupied: 0, available: 0 },
    };

    for (const s of stalls) {
      const type = s.stall_type.startsWith("charge") ? "charge" : (s.stall_type as keyof typeof buckets);
      if (!buckets[type]) continue;
      buckets[type].total += 1;
      if (s.status === "occupied" || s.status === "reserved") {
        buckets[type].occupied += 1;
      } else if (s.status === "available") {
        buckets[type].available += 1;
      }
    }

    const totalAll = Object.values(buckets).reduce((s, b) => s + b.total, 0);
    const occupiedAll = Object.values(buckets).reduce((s, b) => s + b.occupied, 0);

    return {
      ...buckets,
      overall_occupancy_pct: totalAll > 0 ? Math.round((occupiedAll / totalAll) * 100) : 0,
    };
  }, [stalls]);

  // Build ring segments
  const ringSegments = useMemo(() => {
    const totalStalls = Object.values(summary)
      .filter((v): v is { total: number; occupied: number; available: number } => typeof v === "object" && v !== null && "total" in v)
      .reduce((s, b) => s + b.total, 0);

    if (totalStalls === 0) return [];

    let offset = 0;
    return SEGMENTS.map((seg) => {
      const bucket = summary[seg.key];
      if (typeof bucket !== "object" || !("total" in bucket)) return null;
      const fraction = bucket.total / totalStalls;
      const segLen = CIRCUMFERENCE * fraction;
      const occupiedFraction = bucket.total > 0 ? bucket.occupied / bucket.total : 0;
      const result = { ...seg, offset, segLen, occupiedFraction, bucket };
      offset += segLen;
      return result;
    }).filter(Boolean);
  }, [summary]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E]/80 backdrop-blur-xl p-6 animate-pulse h-[280px]" />
    );
  }

  const totalAll = stalls.length;
  const occupiedAll = stalls.filter((s) => s.status === "occupied" || s.status === "reserved").length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E]/80 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white/90">OTTO-Q Depot Status</h3>
          <p className="text-[11px] text-white/40 mt-0.5">Nashville Pilot · Real-time</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D4AA]" />
          <span className="text-[10px] font-medium text-[#00D4AA]">LIVE</span>
        </span>
      </div>

      {/* Ring + stats */}
      <div className="flex items-center gap-5">
        {/* Segmented ring */}
        <div className="relative flex-shrink-0">
          <svg width={CENTER * 2} height={CENTER * 2} viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
            {/* Background ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={STROKE}
            />
            {/* Segments */}
            {ringSegments.map((seg) => {
              if (!seg) return null;
              return (
                <circle
                  key={seg.key}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${seg.segLen} ${CIRCUMFERENCE - seg.segLen}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="butt"
                  opacity={0.25 + seg.occupiedFraction * 0.75}
                  style={{
                    filter: seg.occupiedFraction > 0.5 ? `drop-shadow(0 0 4px ${seg.glow})` : undefined,
                    transform: "rotate(-90deg)",
                    transformOrigin: `${CENTER}px ${CENTER}px`,
                  }}
                />
              );
            })}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tabular-nums">{occupiedAll}</span>
            <span className="text-[10px] text-white/40">/ {totalAll}</span>
          </div>
        </div>

        {/* Legend + counts */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {SEGMENTS.map((seg) => {
            const bucket = summary[seg.key];
            if (typeof bucket !== "object" || !("total" in bucket)) return null;
            return (
              <div key={seg.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                  <span className="text-[11px] text-white/60 truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white tabular-nums">{bucket.occupied}</span>
                  <span className="text-[10px] text-white/30">/ {bucket.total}</span>
                </div>
              </div>
            );
          })}
          <div className="mt-1 pt-2 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Occupancy</span>
            <span className="text-sm font-bold text-[#00D4AA] tabular-nums">{summary.overall_occupancy_pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
