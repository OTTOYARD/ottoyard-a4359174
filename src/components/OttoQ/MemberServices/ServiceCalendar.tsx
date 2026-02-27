import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, List, Download, Zap } from "lucide-react";
import type { ServiceRecord } from "@/lib/orchestra-ev/types";

interface ServiceCalendarProps {
  services: ServiceRecord[];
  onServiceClick?: (service: ServiceRecord) => void;
}

type ViewMode = "week" | "month" | "list";

const typeColors: Record<string, string> = {
  charging: "bg-primary/80 border-primary/40",
  detailing: "bg-blue-500/80 border-blue-500/40",
  interior_clean: "bg-blue-400/80 border-blue-400/40",
  exterior_wash: "bg-blue-400/80 border-blue-400/40",
  tire_rotation: "bg-amber-500/80 border-amber-500/40",
  battery_diagnostic: "bg-purple-500/80 border-purple-500/40",
  brake_inspection: "bg-orange-500/80 border-orange-500/40",
  full_maintenance: "bg-rose-500/80 border-rose-500/40",
  cabin_air_filter: "bg-gray-400/80 border-gray-400/40",
};

export const ServiceCalendar: React.FC<ServiceCalendarProps> = ({ services, onServiceClick }) => {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Week navigation
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const getServicesForDate = (date: Date) => {
    return services.filter((s) => {
      const sd = new Date(s.scheduledAt);
      return sd.toDateString() === date.toDateString();
    });
  };

  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm

  const exportICS = () => {
    const confirmed = services.filter((s) => s.status === "scheduled" || s.status === "in_progress");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//OTTOYARD//OTTO-Q//EN",
    ];
    confirmed.forEach((svc) => {
      const start = new Date(svc.scheduledAt);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      lines.push(
        "BEGIN:VEVENT",
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${svc.type.replace(/_/g, " ")} at ${svc.depotName}`,
        `LOCATION:${svc.depotName}`,
        "END:VEVENT"
      );
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "otto-q-services.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="surface-luxury rounded-lg p-2 hover:bg-muted/20 transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
            {view === "week"
              ? `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => navigate(1)} className="surface-luxury rounded-lg p-2 hover:bg-muted/20 transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="surface-luxury rounded-lg p-0.5 flex">
            {(["week", "month", "list"] as ViewMode[]).map((v) => {
              const Icon = v === "list" ? List : CalendarDays;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium capitalize transition-all ${
                    view === v ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={exportICS} className="glass-button rounded-lg h-8 text-[11px] gap-1">
            <Download className="h-3 w-3" />
            .ics
          </Button>
        </div>
      </div>

      {/* Week view */}
      {view === "week" && (
        <div className="surface-luxury rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-border/20">
            <div className="p-2" /> {/* time column */}
            {weekDays.map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={day.toISOString()} className={`p-2 text-center border-l border-border/10 ${isToday ? "bg-primary/5" : ""}`}>
                  <p className="text-[10px] text-muted-foreground">{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
                  <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</p>
                </div>
              );
            })}
          </div>
          {/* Time grid */}
          <div className="max-h-[400px] overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border/10 min-h-[40px]">
                <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 pt-0">
                  {hour > 12 ? `${hour - 12}PM` : hour === 12 ? "12PM" : `${hour}AM`}
                </div>
                {weekDays.map((day) => {
                  const daySvcs = getServicesForDate(day).filter((s) => {
                    const h = new Date(s.scheduledAt).getHours();
                    return h === hour;
                  });
                  return (
                    <div key={day.toISOString()} className="border-l border-border/10 p-0.5 relative">
                      {daySvcs.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => onServiceClick?.(svc)}
                          className={`w-full rounded px-1 py-0.5 text-[9px] font-medium text-white truncate border ${
                            svc.status === "completed"
                              ? "bg-muted/40 border-muted/30 text-muted-foreground"
                              : svc.status === "scheduled"
                              ? "border-dashed " + (typeColors[svc.type] || "bg-primary/60 border-primary/30")
                              : typeColors[svc.type] || "bg-primary/80 border-primary/40"
                          }`}
                        >
                          {svc.type.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month view */}
      {view === "month" && (
        <div className="surface-luxury rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground text-center py-1">{d}</div>
            ))}
            {(() => {
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              const cells = [];
              for (let i = 0; i < firstDay.getDay(); i++) cells.push(<div key={`pad-${i}`} />);
              for (let d = 1; d <= lastDay.getDate(); d++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                const daySvcs = getServicesForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                cells.push(
                  <div
                    key={d}
                    className={`rounded-lg p-1.5 min-h-[36px] text-center cursor-pointer hover:bg-muted/20 transition-colors ${
                      isToday ? "bg-primary/10 ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <p className={`text-[11px] ${isToday ? "text-primary font-bold" : "text-foreground"}`}>{d}</p>
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {daySvcs.slice(0, 3).map((svc) => (
                        <span key={svc.id} className={`h-1.5 w-1.5 rounded-full ${
                          svc.status === "completed" ? "bg-muted-foreground/40" : "bg-primary"
                        }`} />
                      ))}
                    </div>
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* List view — reuse ServiceTimeline concepts inline */}
      {view === "list" && (
        <div className="space-y-2">
          {services
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
            .map((svc) => (
              <button
                key={svc.id}
                onClick={() => onServiceClick?.(svc)}
                className="w-full surface-luxury rounded-xl p-3 flex items-center gap-3 text-left hover:shadow-md transition-all"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  svc.status === "completed" ? "bg-success/15" : "bg-primary/15"
                }`}>
                  <Zap className={`h-3.5 w-3.5 ${svc.status === "completed" ? "text-success" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground capitalize">{svc.type.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(svc.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">{svc.status}</Badge>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
