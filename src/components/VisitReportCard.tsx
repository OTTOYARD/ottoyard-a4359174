// src/components/VisitReportCard.tsx
// Renders a single VisitReport from the OTTO-Q progression engine.
// Used inside the Vehicle Detail "Visit History" tab and the Progression
// decision-feed drill-in.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Wrench,
  Radio,
} from "lucide-react";
import type {
  VisitReport,
  VisitReportActualStep,
} from "@/hooks/use-orchestra-progression";

interface VisitReportCardProps {
  report: VisitReport;
}

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const minutesBetween = (a: string | null, b: string | null) => {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
};

export function VisitReportCard({ report }: VisitReportCardProps) {
  const inProgress = !report.audit_trail_complete;
  const plannedById = new Map(
    report.planned_sequence.map((p) => [p.sequence_order, p]),
  );

  // Derive deviations client-side
  const deviations = report.actual_sequence
    .map((a) => deriveDeviation(a, plannedById.get(a.original_sequence_order ?? a.sequence_order)))
    .filter((d): d is { step: number; reason: string; note: string } => d !== null);

  // Filter duplicate OEM pending events within 5s
  const oemEvents = dedupeOemEvents(report.oem_interactions);

  const varianceColor =
    report.variance_minutes === null
      ? "text-muted-foreground"
      : Math.abs(report.variance_minutes) <= 5
      ? "text-success"
      : Math.abs(report.variance_minutes) <= 15
      ? "text-warning"
      : "text-destructive";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Depot Visit Report
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schedule {report.schedule_id.slice(0, 8)} ·{" "}
              {formatDateTime(report.visit_started_at)}
              {report.visit_completed_at &&
                ` → ${formatTime(report.visit_completed_at)}`}
            </p>
            {report.depot_name && (
              <p className="text-xs text-muted-foreground">{report.depot_name}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {inProgress && (
              <Badge
                variant="outline"
                className="bg-warning/10 text-warning border-warning/30 text-[10px]"
              >
                In Progress
              </Badge>
            )}
            {report.deviation_count > 0 && (
              <Badge
                variant="outline"
                className="bg-warning/10 text-warning border-warning/30 text-[10px]"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {report.deviation_count} deviation{report.deviation_count !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Planned vs Actual */}
        <Section title="Planned vs Actual">
          <div className="space-y-2">
            {report.actual_sequence.length === 0 ? (
              <p className="text-xs text-muted-foreground">No services recorded yet.</p>
            ) : (
              report.actual_sequence.map((a) => {
                const planned = plannedById.get(
                  a.original_sequence_order ?? a.sequence_order,
                );
                const reordered =
                  a.original_sequence_order !== null &&
                  a.original_sequence_order !== a.sequence_order;
                return (
                  <div
                    key={`${a.sequence_order}-${a.service}`}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 rounded-md bg-muted/30 border border-border/40"
                  >
                    <div className="text-xs">
                      <div className="font-medium flex items-center flex-wrap gap-1">
                        <span>
                          {a.sequence_order}. {formatService(a.service)}
                        </span>
                        {a.actual_stall_id && (
                          <span className="text-muted-foreground">
                            ({a.actual_stall_id.slice(0, 8)})
                          </span>
                        )}
                        {reordered && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/30"
                          >
                            <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
                            reordered (was step {a.original_sequence_order})
                          </Badge>
                        )}
                        {a.abnormality_flagged && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                          >
                            flagged
                          </Badge>
                        )}
                      </div>
                      {planned && (
                        <p className="text-muted-foreground mt-0.5">
                          Planned {formatTime(planned.scheduled_start)} →{" "}
                          {formatTime(planned.scheduled_end)}
                        </p>
                      )}
                    </div>
                    <div className="text-xs md:text-right">
                      <p className="font-medium">
                        Actual {formatTime(a.actual_start)} → {formatTime(a.actual_end)}
                      </p>
                      {a.soc_at_end !== null && (
                        <p className="text-muted-foreground">
                          SOC end: {Math.round(a.soc_at_end * 100)}%
                          {a.actual_end && (
                            <CheckCircle2 className="w-3 h-3 inline ml-1 text-success" />
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Section>

        {/* Deviations */}
        <Section title={`Deviations (${deviations.length})`}>
          {deviations.length === 0 ? (
            <EmptyLine text="None" />
          ) : (
            <ul className="space-y-1">
              {deviations.map((d, i) => (
                <li key={i} className="text-xs flex gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">Step {d.step}:</span> {d.reason}
                    {d.note && (
                      <span className="text-muted-foreground italic"> — "{d.note}"</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Overrides */}
        <Section title={`Overrides Applied (${report.overrides_applied.length})`}>
          {report.overrides_applied.length === 0 ? (
            <EmptyLine text="None" />
          ) : (
            <ul className="space-y-1">
              {report.overrides_applied.map((o, i) => (
                <li key={i} className="text-xs flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-[10px]"
                  >
                    {formatService(o.action)}
                  </Badge>
                  <span className="text-muted-foreground">{timeAgo(o.at)}</span>
                  <span className="text-muted-foreground">by {o.by}</span>
                  {o.audit_note && <span className="italic">"{o.audit_note}"</span>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Abnormalities */}
        <Section title={`Abnormalities (${report.abnormalities.length})`}>
          {report.abnormalities.length === 0 ? (
            <EmptyLine text="None" />
          ) : (
            <ul className="space-y-1.5">
              {report.abnormalities.map((ab, i) => {
                const open = !ab.resolved_at;
                return (
                  <li
                    key={i}
                    className={`text-xs p-1.5 rounded border ${
                      open
                        ? "bg-destructive/5 border-destructive/30"
                        : "bg-muted/30 border-border/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          open
                            ? "bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                            : "bg-success/10 text-success border-success/30 text-[10px]"
                        }
                      >
                        {open ? "OPEN" : "Resolved"}
                      </Badge>
                      <span className="text-muted-foreground">
                        Flagged by {ab.flagged_by_role} · {timeAgo(ab.flagged_at)}
                      </span>
                    </div>
                    {ab.resolved_at && (
                      <p className="text-muted-foreground mt-0.5">
                        Resolved by {ab.resolved_by_role} · {timeAgo(ab.resolved_at)}
                        {ab.resolution_note && ` — "${ab.resolution_note}"`}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* OEM Interactions */}
        <Section title={`OEM Interactions (${oemEvents.length})`}>
          {oemEvents.length === 0 ? (
            <EmptyLine text="None" />
          ) : (
            <ul className="space-y-1">
              {oemEvents.map((e, i) => (
                <li key={i} className="text-xs flex flex-wrap items-center gap-1.5">
                  <Radio className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="font-mono text-muted-foreground">
                    {formatTime(e.at)}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30 text-[10px]"
                  >
                    {formatService(e.event)}
                  </Badge>
                  {e.audit_note && (
                    <span className="text-muted-foreground italic">"{e.audit_note}"</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Summary */}
        {!inProgress && (
          <>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Redeployment</p>
                <p className="font-medium capitalize flex items-center gap-1">
                  {report.redeployment_status === "ready" ? (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  ) : (
                    <Clock className="w-3 h-3 text-warning" />
                  )}
                  {report.redeployment_status.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Variance</p>
                <p className={`font-medium ${varianceColor}`}>
                  {report.variance_minutes === null
                    ? "—"
                    : `${report.variance_minutes >= 0 ? "+" : ""}${report.variance_minutes} min`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Audit Trail</p>
                <p className="font-medium flex items-center gap-1">
                  {report.audit_trail_complete ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      <span className="text-success">Complete</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-destructive" />
                      <span className="text-destructive">Incomplete</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic">{text}</p>;
}

function deriveDeviation(
  actual: VisitReportActualStep,
  planned: { scheduled_start: string; scheduled_end: string } | undefined,
): { step: number; reason: string; note: string } | null {
  const reasons: string[] = [];

  if (actual.original_sequence_order !== null && actual.original_sequence_order !== actual.sequence_order) {
    reasons.push(`reordered from step ${actual.original_sequence_order}`);
  }
  if (actual.tech_override_action) {
    reasons.push(`tech override (${formatService(actual.tech_override_action)})`);
  }
  if (actual.abnormality_flagged) {
    reasons.push("abnormality flagged");
  }
  if (planned && actual.actual_start) {
    const startDelta = minutesBetween(planned.scheduled_start, actual.actual_start);
    if (startDelta !== null && Math.abs(startDelta) > 10) {
      reasons.push(`start ${startDelta >= 0 ? "+" : ""}${startDelta}m vs plan`);
    }
  }
  if (planned && actual.actual_end) {
    const endDelta = minutesBetween(planned.scheduled_end, actual.actual_end);
    if (endDelta !== null && Math.abs(endDelta) > 10) {
      reasons.push(`end ${endDelta >= 0 ? "+" : ""}${endDelta}m vs plan`);
    }
  }

  if (reasons.length === 0) return null;
  return {
    step: actual.sequence_order,
    reason: reasons.join(", "),
    note: actual.tech_override_audit_note || "",
  };
}

function dedupeOemEvents(events: VisitReport["oem_interactions"]): VisitReport["oem_interactions"] {
  const out: VisitReport["oem_interactions"] = [];
  for (const e of events) {
    const last = out[out.length - 1];
    if (
      last &&
      last.event === "oem_gate_pending" &&
      e.event === "oem_gate_pending" &&
      Math.abs(new Date(e.at).getTime() - new Date(last.at).getTime()) < 5000
    ) {
      continue;
    }
    out.push(e);
  }
  return out;
}

function formatService(s: string): string {
  return s
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
