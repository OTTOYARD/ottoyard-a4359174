import { useAIFleetSummary } from "@/hooks/use-otto-q-strategic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OttoQIntelligenceCard() {
  const { data, isLoading } = useAIFleetSummary();

  if (isLoading) {
    return (
      <Card className="p-3 w-[320px] surface-luxury border-border/50 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { model_accuracy, active_risks, autonomous_actions_today, recent_actions } = data;
  const accuracyPct =
    model_accuracy.overall !== null ? Math.round(model_accuracy.overall * 100) : null;

  return (
    <Card className="p-3 w-[320px] max-w-[90vw] surface-luxury border-border/50 backdrop-blur-md bg-card/85">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10 text-primary">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">OTTO-Q Intelligence</div>
            <div className="text-[10px] text-muted-foreground">Fleet-wide AI Brain</div>
          </div>
        </div>
        {accuracyPct !== null ? (
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Accuracy
            </div>
            <div className="text-base font-bold tabular-nums leading-tight text-primary">
              {accuracyPct}%
            </div>
            <div className="text-[9px] text-muted-foreground">7d weighted</div>
          </div>
        ) : (
          <Badge variant="outline" className="text-[9px]">Warming up</Badge>
        )}
      </div>

      {/* Active risks strip */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <RiskChip label="Critical" count={active_risks.critical} color="red" />
        <RiskChip label="Warning" count={active_risks.warning} color="amber" />
        <RiskChip label="Info" count={active_risks.info} color="slate" />
      </div>

      {/* Autonomous actions today */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Autonomous Actions (24h)
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <ActionStat icon={<CheckCircle2 className="h-3 w-3 text-success" />} label="Done" value={autonomous_actions_today.executed} />
          <ActionStat icon={<Clock className="h-3 w-3 text-primary" />} label="Pending" value={autonomous_actions_today.pending} />
          <ActionStat icon={<XCircle className="h-3 w-3 text-destructive" />} label="Failed" value={autonomous_actions_today.failed} />
          <ActionStat icon={<RotateCcw className="h-3 w-3 text-warning" />} label="Reverted" value={autonomous_actions_today.rolled_back} />
        </div>
      </div>

      {/* Recent actions */}
      {recent_actions.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Recent Decisions
          </div>
          <div className="space-y-1">
            {recent_actions.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-1.5 text-[10px]">
                <ActionStatusDot status={a.status} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground/90">
                    {a.summary || formatAction(a.action_type)}
                  </div>
                  <div className="text-muted-foreground text-[9px]">
                    {formatAction(a.action_type)} · {timeAgo(a.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA footer */}
      <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">View full AI Brain</span>
        <a
          href="https://field-ops.ottoyard.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          Open Field Ops →
        </a>
      </div>
    </Card>
  );
}

function RiskChip({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "red" | "amber" | "slate";
}) {
  const colorMap: Record<string, string> = {
    red: "bg-destructive/10 text-destructive border-destructive/20",
    amber: "bg-warning/10 text-warning border-warning/20",
    slate: "bg-muted/40 text-muted-foreground border-border/40",
  };
  return (
    <div className={cn("rounded border px-2 py-1.5 text-center", colorMap[color])}>
      <div className="text-base font-bold tabular-nums leading-tight">{count}</div>
      <div className="text-[9px] uppercase tracking-wider opacity-80">{label}</div>
    </div>
  );
}

function ActionStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded border border-border/40 px-1.5 py-1 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-xs font-semibold tabular-nums">{value}</span>
      </div>
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ActionStatusDot({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "bg-success"
      : status === "pending" || status === "executing"
      ? "bg-primary"
      : status === "failed" || status === "skipped"
      ? "bg-destructive"
      : status === "rolled_back"
      ? "bg-warning"
      : "bg-muted-foreground";
  return <div className={cn("h-1.5 w-1.5 rounded-full mt-1 shrink-0", color)} />;
}

function formatAction(type: string): string {
  return type
    .split("_")
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
