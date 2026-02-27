import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Droplets, Wrench, ParkingSquare, ArrowUp, Clock } from "lucide-react";
import type { StallType } from "@/types/ottoq";

export interface QueueEntry {
  id: string;
  vehicleId: string;
  vehicleMakeModel: string;
  stallTypeNeeded: StallType;
  requestedAt: string;
  position: number;
  priority: number;
  isFastTracked: boolean;
}

// Demo mock queue
const MOCK_QUEUE: QueueEntry[] = [
  { id: "q1", vehicleId: "v1", vehicleMakeModel: "Tesla Model 3", stallTypeNeeded: "charge_standard", requestedAt: new Date(Date.now() - 420_000).toISOString(), position: 1, priority: 85, isFastTracked: false },
  { id: "q2", vehicleId: "v2", vehicleMakeModel: "Rivian R1T", stallTypeNeeded: "charge_fast", requestedAt: new Date(Date.now() - 300_000).toISOString(), position: 2, priority: 72, isFastTracked: false },
  { id: "q3", vehicleId: "v3", vehicleMakeModel: "BMW iX", stallTypeNeeded: "clean_detail", requestedAt: new Date(Date.now() - 180_000).toISOString(), position: 1, priority: 55, isFastTracked: false },
  { id: "q4", vehicleId: "v4", vehicleMakeModel: "Mercedes EQS", stallTypeNeeded: "charge_standard", requestedAt: new Date(Date.now() - 90_000).toISOString(), position: 3, priority: 40, isFastTracked: false },
  { id: "q5", vehicleId: "v5", vehicleMakeModel: "Hyundai Ioniq 5", stallTypeNeeded: "service_bay", requestedAt: new Date(Date.now() - 60_000).toISOString(), position: 1, priority: 90, isFastTracked: false },
];

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  charge_standard: { label: "Charge (Standard)", icon: <Zap className="h-3.5 w-3.5" />, color: "#00D4AA" },
  charge_fast: { label: "Charge (Fast)", icon: <Zap className="h-3.5 w-3.5" />, color: "#00D4AA" },
  clean_detail: { label: "Clean / Detail", icon: <Droplets className="h-3.5 w-3.5" />, color: "#3B82F6" },
  service_bay: { label: "Service Bay", icon: <Wrench className="h-3.5 w-3.5" />, color: "#FFD700" },
  staging: { label: "Staging", icon: <ParkingSquare className="h-3.5 w-3.5" />, color: "#6B7280" },
};

export default function QueueManager() {
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [, setTick] = useState(0);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, QueueEntry[]> = {};
    for (const entry of queue) {
      const key = entry.stallTypeNeeded;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    // Sort each group by position
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.position - b.position);
    }
    return groups;
  }, [queue]);

  const fastTrack = (id: string) => {
    setQueue((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const entry = { ...updated[idx], isFastTracked: true, position: 0, priority: 100 };
      updated.splice(idx, 1);
      updated.unshift(entry);
      return updated.map((e, i) => ({ ...e, position: i + 1 }));
    });
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0A0A0A] to-[#0D0D1A] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-white/90">Vehicle Queue</h3>
        <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
          {queue.length} waiting
        </Badge>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([type, entries]) => {
          const meta = TYPE_META[type] ?? { label: type, icon: null, color: "#888" };
          const depth = entries.length;
          const depthColor = depth > 6 ? "#EF4444" : depth > 3 ? "#FFD700" : "#00D4AA";

          return (
            <div key={type}>
              {/* Group header with depth bar */}
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <span className="text-[11px] text-white/60 font-medium">{meta.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden ml-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (depth / 8) * 100)}%`,
                      background: depthColor,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono tabular-nums" style={{ color: depthColor }}>
                  {depth}
                </span>
              </div>

              {/* Queue entries */}
              <div className="space-y-1.5 pl-5">
                {entries.map((entry) => (
                  <QueueRow key={entry.id} entry={entry} onFastTrack={fastTrack} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {queue.length === 0 && (
        <div className="text-center py-8">
          <div className="text-white/20 text-sm">No vehicles waiting</div>
          <div className="text-white/10 text-[10px] mt-1">All stalls available</div>
        </div>
      )}
    </div>
  );
}

function QueueRow({
  entry,
  onFastTrack,
}: {
  entry: QueueEntry;
  onFastTrack: (id: string) => void;
}) {
  const waitSec = Math.round((Date.now() - new Date(entry.requestedAt).getTime()) / 1000);
  const waitMin = Math.floor(waitSec / 60);
  const waitSecRem = waitSec % 60;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
        entry.isFastTracked
          ? "bg-[#00D4AA]/[0.08] border border-[#00D4AA]/20"
          : "bg-white/[0.02] border border-white/[0.04]"
      }`}
    >
      {/* Position */}
      <span className="text-[11px] font-mono tabular-nums text-white/30 w-4 text-center">
        #{entry.position}
      </span>

      {/* Vehicle info */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-white/80 truncate">{entry.vehicleMakeModel}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="h-2.5 w-2.5 text-white/30" />
          <span className="text-[10px] font-mono tabular-nums text-white/40">
            {waitMin}:{String(waitSecRem).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Priority badge */}
      <span
        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
        style={{
          background: entry.priority >= 80 ? "rgba(239,68,68,0.15)" : entry.priority >= 50 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
          color: entry.priority >= 80 ? "#EF4444" : entry.priority >= 50 ? "#FFD700" : "rgba(255,255,255,0.4)",
        }}
      >
        P{entry.priority}
      </span>

      {/* Fast track */}
      {!entry.isFastTracked && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white/20 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10"
          onClick={() => onFastTrack(entry.id)}
          title="Fast Track"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
      )}
      {entry.isFastTracked && (
        <span className="text-[9px] text-[#00D4AA]">⚡ Fast</span>
      )}
    </div>
  );
}
