import { Sparkles, CheckCircle2, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCilAdoptions } from "@/hooks/use-ottoq-frontier";

function rel(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * OTTO-Q Self-Improvement Log — the CIL audit trail: what OTTO-Q A/B-tested in the twin
 * and adopted (or kept) on a zero-unsafe basis, with its reasoning.
 */
export function OttoQSelfImprovement() {
  const { data: adoptions = [] } = useCilAdoptions(6);

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-display">
          <Sparkles className="h-4 w-4 text-primary" />
          Self-Improvement Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-[11px] text-muted-foreground mb-3">
          OTTO-Q A/B-tests tweaks to its own settings in the digital twin and adopts only the ones that
          do strictly better with zero safety loss.
        </p>
        {adoptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No self-tuning decisions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {adoptions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-2.5">
                {a.adopted ? (
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                ) : (
                  <MinusCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">
                      {a.adopted ? a.plan_label : "kept current setting"}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{rel(a.decided_at)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
