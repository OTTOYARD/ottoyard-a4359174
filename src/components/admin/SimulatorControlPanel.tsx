import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Play, Square, RotateCcw, Shield, RefreshCw, Loader2 } from "lucide-react";
import {
  getOrCreateSimulatorState,
  simulatorReset,
  simulatorSetMode,
  simulatorStart,
  simulatorStop,
  simulatorUpdateConfig
} from "@/lib/ottoq/ottoqClient";
import type { SimulatorStateRow } from "@/lib/ottoq/ottoqTypes";

const DEFAULT_UNLOCK = "ottoyard-admin";

function safeJsonParse(input: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const v = JSON.parse(input);
    return { ok: true, value: v };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, error: errorMessage };
  }
}

export default function SimulatorControlPanel() {
  const [loading, setLoading] = useState(false);
  const [stateRow, setStateRow] = useState<SimulatorStateRow | null>(null);

  const [unlock, setUnlock] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [mode, setMode] = useState("auto");
  const [configText, setConfigText] = useState("{}");
  const parsedConfig = useMemo(() => safeJsonParse(configText), [configText]);

  const refresh = async () => {
    setLoading(true);
    try {
      const row = await getOrCreateSimulatorState();
      setStateRow(row);
      setMode(row.mode || "auto");
      setConfigText(JSON.stringify(row.config_jsonb || {}, null, 2));
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error("Failed to load simulator state", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onUnlock = () => {
    if ((unlock || "").trim() === DEFAULT_UNLOCK) {
      setIsUnlocked(true);
      toast.success("Admin unlocked");
    } else {
      toast.error("Invalid password");
    }
  };

  const doStart = async () => {
    setLoading(true);
    try {
      await simulatorStart();
      toast.success("Simulator started");
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error("Start failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const doStop = async () => {
    setLoading(true);
    try {
      await simulatorStop();
      toast.success("Simulator stopped");
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error("Stop failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setLoading(true);
    try {
      await simulatorReset();
      toast.success("Simulator reset");
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error("Reset failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const doSaveMode = async () => {
    setLoading(true);
    try {
      await simulatorSetMode(mode);
      toast.success("Mode updated");
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error("Mode update failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const doSaveConfig = async () => {
    if (!parsedConfig.ok) {
      toast.error("Config JSON invalid", { description: (parsedConfig as { ok: false; error: string }).error });
      return;
    }
    setLoading(true);
    try {
      await simulatorUpdateConfig(parsedConfig.value);
      toast.success("Config updated");
      await refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error("Config update failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const running = !!stateRow?.is_running;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Admin Simulator Controls
          </CardTitle>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {running ? (
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Running
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Stopped
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isUnlocked ? (
          <div className="space-y-3">
            <Label htmlFor="admin-unlock">Admin Password</Label>
            <div className="flex gap-2">
              <Input
                id="admin-unlock"
                type="password"
                value={unlock}
                onChange={(e) => setUnlock(e.target.value)}
                placeholder="Enter admin password"
                onKeyDown={(e) => e.key === "Enter" && onUnlock()}
              />
              <Button onClick={onUnlock} disabled={loading}>
                Unlock
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Default: ottoyard-admin (local only). Change later in code.
            </p>
          </div>
        ) : (
          <>
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={doStart} disabled={loading || running} size="sm" className="bg-success hover:bg-success/90">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
              <Button onClick={doStop} disabled={loading || !running} size="sm" variant="destructive">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
              <Button onClick={doReset} disabled={loading} size="sm" variant="outline">
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button onClick={refresh} disabled={loading} size="sm" variant="ghost">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>

            {/* Mode & Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="flex gap-2">
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">auto</SelectItem>
                      <SelectItem value="manual">manual</SelectItem>
                      <SelectItem value="demo">demo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={doSaveMode} disabled={loading} variant="outline" size="sm">
                    Save Mode
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Last Reset</Label>
                  <p className="font-medium">
                    {stateRow?.last_reset_at ? new Date(stateRow.last_reset_at).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Updated</Label>
                  <p className="font-medium">
                    {stateRow?.updated_at ? new Date(stateRow.updated_at).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Config JSON Editor */}
            <div className="space-y-2">
              <Label>config_jsonb (JSON)</Label>
              <Textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                className="min-h-[180px] font-mono text-xs"
              />
              {!parsedConfig.ok ? (
                <p className="text-xs text-destructive">Invalid JSON: {(parsedConfig as { ok: false; error: string }).error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Valid JSON</p>
              )}
              <Button onClick={doSaveConfig} disabled={loading || !parsedConfig.ok} variant="outline">
                Save Config
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
