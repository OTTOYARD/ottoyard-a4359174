import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import type { StallRecord } from "@/services/ottoq-resource-manager";

interface Props {
  stalls: StallRecord[];
}

// Generate mock 24h utilization data for each stall
function generateHeatmapData(stalls: StallRecord[]) {
  return stalls.map((s) => {
    const hourly = Array.from({ length: 24 }, (_, h) => {
      // Simulate patterns: charge busy overnight, clean busy midday, staging evening
      let base = 0.3;
      if (s.stall_type === "charge_standard" || s.stall_type === "charge_fast") {
        base = h >= 22 || h < 6 ? 0.85 : h >= 6 && h < 10 ? 0.6 : 0.35;
      } else if (s.stall_type === "clean_detail") {
        base = h >= 10 && h < 16 ? 0.75 : 0.2;
      } else if (s.stall_type === "service_bay") {
        base = h >= 8 && h < 18 ? 0.7 : 0.1;
      } else {
        base = h >= 16 && h < 22 ? 0.8 : 0.4;
      }
      return Math.min(1, base + (Math.random() * 0.2 - 0.1));
    });
    return { stallNumber: s.stall_number, stallType: s.stall_type, hourly };
  });
}

function intensityToColor(value: number): string {
  if (value < 0.3) return "rgba(59, 130, 246, 0.3)";
  if (value < 0.5) return "rgba(59, 130, 246, 0.6)";
  if (value < 0.7) return "rgba(255, 215, 0, 0.5)";
  if (value < 0.85) return "rgba(255, 165, 0, 0.6)";
  return "rgba(239, 68, 68, 0.7)";
}

export default function DepotHeatmap({ stalls }: Props) {
  const [hour, setHour] = useState([new Date().getHours()]);
  const data = useMemo(() => generateHeatmapData(stalls), [stalls]);

  const currentHour = hour[0];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0A0A0A] to-[#0D0D1A] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">Utilization Heatmap</h3>
        <span className="text-xs font-mono text-white/50 tabular-nums">
          {String(currentHour).padStart(2, "0")}:00
        </span>
      </div>

      {/* Time scrubber */}
      <div className="mb-4 px-1">
        <Slider
          value={hour}
          onValueChange={setHour}
          min={0}
          max={23}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-white/20">00:00</span>
          <span className="text-[9px] text-white/20">06:00</span>
          <span className="text-[9px] text-white/20">12:00</span>
          <span className="text-[9px] text-white/20">18:00</span>
          <span className="text-[9px] text-white/20">23:00</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-10 gap-1">
        {data.map((cell) => {
          const intensity = cell.hourly[currentHour];
          return (
            <div
              key={cell.stallNumber}
              className="aspect-square rounded-md flex items-center justify-center transition-colors duration-300"
              style={{ background: intensityToColor(intensity) }}
              title={`Stall #${cell.stallNumber} — ${Math.round(intensity * 100)}% util at ${currentHour}:00`}
            >
              <span className="text-[8px] font-mono text-white/50 tabular-nums">{cell.stallNumber}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-center">
        <span className="text-[9px] text-white/30">Low</span>
        {[0.15, 0.4, 0.6, 0.75, 0.9].map((v) => (
          <div
            key={v}
            className="h-3 w-6 rounded-sm"
            style={{ background: intensityToColor(v) }}
          />
        ))}
        <span className="text-[9px] text-white/30">High</span>
      </div>
    </div>
  );
}
