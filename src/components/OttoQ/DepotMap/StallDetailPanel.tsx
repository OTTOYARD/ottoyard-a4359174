import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { StallRecord } from "@/services/ottoq-resource-manager";

interface Props {
  stall: StallRecord | null;
  open: boolean;
  onClose: () => void;
}

// Mock charge curve data
function generateChargeCurve(sessionMinutes: number) {
  const points = [];
  for (let m = 0; m <= Math.min(sessionMinutes, 120); m += 5) {
    // Typical EV charge curve: fast at start, tapers off
    const soc = Math.min(100, 20 + 60 * (1 - Math.exp(-m / 40)));
    points.push({ min: m, soc: Math.round(soc) });
  }
  return points;
}

// Mock session history
const mockHistory = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  vehicleRef: `AV-${String(100 + i).padStart(3, "0")}`,
  duration: Math.round(25 + Math.random() * 90),
  completedAt: new Date(Date.now() - (i + 1) * 3_600_000 * (2 + Math.random() * 4)).toISOString(),
}));

export default function StallDetailPanel({ stall, open, onClose }: Props) {
  if (!stall) return null;

  const isOccupied = stall.status === "occupied" || stall.status === "reserved";
  const sessionMinutes = stall.current_session_start
    ? Math.round((Date.now() - new Date(stall.current_session_start).getTime()) / 60_000)
    : 0;
  const isChargeStall = stall.stall_type === "charge_standard" || stall.stall_type === "charge_fast";
  const chargeCurve = isChargeStall && isOccupied ? generateChargeCurve(sessionMinutes) : [];

  const avgTurnover = Math.round(mockHistory.reduce((s, h) => s + h.duration, 0) / mockHistory.length);

  const statusColor =
    stall.status === "maintenance" ? "#EF4444" :
    stall.status === "available" ? "#00D4AA" :
    "#FFFFFF";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-[#0A0A0A] border-white/[0.06] w-[360px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            Stall #{stall.stall_number}
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${statusColor}40`, color: statusColor }}>
              {stall.status}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-5">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCell label="Type" value={stall.stall_type.replace(/_/g, " ")} />
            <InfoCell label="Power" value={stall.charger_power_kw ? `${stall.charger_power_kw} kW` : "N/A"} />
            <InfoCell label="Avg Turnover" value={`${avgTurnover} min`} />
            <InfoCell label="Sessions Today" value="7" />
          </div>

          {/* Current session */}
          {isOccupied && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">Current Session</div>
              <div className="text-xs text-white/80">{sessionMinutes} min elapsed</div>
              {stall.estimated_completion && (
                <div className="space-y-1">
                  <div className="text-[10px] text-white/40">
                    Est. done: {new Date(stall.estimated_completion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <Progress value={Math.min(100, (sessionMinutes / (sessionMinutes + 30)) * 100)} className="h-1.5" />
                </div>
              )}
            </div>
          )}

          {/* Charge curve */}
          {chargeCurve.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Charge Curve</div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chargeCurve}>
                  <XAxis dataKey="min" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} labelFormatter={(v) => `${v} min`} />
                  <Line type="monotone" dataKey="soc" stroke="#00D4AA" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History */}
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Recent Sessions</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {mockHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className="text-[11px] text-white/70">{h.vehicleRef}</span>
                  <span className="text-[10px] text-white/40">{h.duration}m</span>
                  <span className="text-[10px] text-white/30">
                    {new Date(h.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
      <div className="text-[9px] text-white/30 uppercase tracking-wider">{label}</div>
      <div className="text-xs text-white/80 font-medium mt-0.5">{value}</div>
    </div>
  );
}
