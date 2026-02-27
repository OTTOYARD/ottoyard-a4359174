import React, { useMemo } from "react";
import type { SubscriberVehicle } from "@/lib/orchestra-ev/types";

interface VehicleHealthRingProps {
  vehicle: SubscriberVehicle;
  onViewServices?: () => void;
}

const RADIUS = 48;
const STROKE = 8;
const CENTER = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4;

interface Segment {
  label: string;
  color: string;
  glow: string;
  value: number; // 0-1 fill
}

export const VehicleHealthRing: React.FC<VehicleHealthRingProps> = ({ vehicle, onViewServices }) => {
  const segments = useMemo<Segment[]>(() => [
    {
      label: "Battery",
      color: "hsl(var(--primary))",
      glow: "hsl(var(--primary) / 0.35)",
      value: vehicle.currentSoc,
    },
    {
      label: "Cleanliness",
      color: "#3B82F6",
      glow: "rgba(59,130,246,0.3)",
      value: 0.72, // mock — would come from last detail days ago
    },
    {
      label: "Tires",
      color: "#F59E0B",
      glow: "rgba(245,158,11,0.3)",
      value: 0.65,
    },
    {
      label: "Battery Health",
      color: "#A855F7",
      glow: "rgba(168,85,247,0.3)",
      value: vehicle.batteryHealthPct / 100,
    },
  ], [vehicle]);

  const score = vehicle.healthScore;
  const qualLabel = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention";
  const qualColor = score >= 80 ? "text-success" : score >= 60 ? "text-primary" : score >= 40 ? "text-warning" : "text-destructive";

  // Build arc segments — evenly split
  const segCount = segments.length;
  const usableCirc = CIRCUMFERENCE - segCount * GAP;
  const segLen = usableCirc / segCount;

  return (
    <div className="surface-elevated-luxury rounded-2xl p-5">
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={CENTER * 2} height={CENTER * 2} viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}>
            {/* BG ring */}
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="hsl(var(--muted) / 0.15)" strokeWidth={STROKE} />
            {/* Segments */}
            {segments.map((seg, i) => {
              const offset = i * (segLen + GAP);
              const filled = segLen * seg.value;
              return (
                <React.Fragment key={seg.label}>
                  {/* Track */}
                  <circle
                    cx={CENTER} cy={CENTER} r={RADIUS} fill="none"
                    stroke={seg.color} strokeWidth={STROKE} opacity={0.15}
                    strokeDasharray={`${segLen} ${CIRCUMFERENCE - segLen}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: `${CENTER}px ${CENTER}px` }}
                  />
                  {/* Fill */}
                  <circle
                    cx={CENTER} cy={CENTER} r={RADIUS} fill="none"
                    stroke={seg.color} strokeWidth={STROKE} opacity={0.9}
                    strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: `${CENTER}px ${CENTER}px`,
                      filter: seg.value > 0.5 ? `drop-shadow(0 0 4px ${seg.glow})` : undefined,
                      transition: "stroke-dasharray 0.8s ease",
                    }}
                  />
                </React.Fragment>
              );
            })}
          </svg>
          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">{score}</span>
            <span className={`text-[10px] font-semibold ${qualColor}`}>{qualLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-[11px] text-muted-foreground">{seg.label}</span>
              </div>
              <span className="text-xs font-semibold text-foreground tabular-nums">{Math.round(seg.value * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next service preview */}
      {onViewServices && (
        <button
          onClick={onViewServices}
          className="mt-4 w-full surface-luxury rounded-xl px-4 py-2.5 flex items-center justify-between group hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs text-muted-foreground">
              Next: <span className="text-foreground font-medium">Detail Clean — Recommended Thursday</span>
            </span>
          </div>
          <span className="text-xs text-primary group-hover:translate-x-1 transition-transform">→</span>
        </button>
      )}
    </div>
  );
};
