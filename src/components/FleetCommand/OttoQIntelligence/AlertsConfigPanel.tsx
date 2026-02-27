import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, MessageSquare, Settings, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type AlertRule = { id: string; label: string; enabled: boolean; threshold: number; unit: string; min: number; max: number; step: number };

const defaultRules: AlertRule[] = [
  { id: "charge_queue", label: "Charge stall queue exceeds", enabled: true, threshold: 5, unit: "vehicles", min: 1, max: 15, step: 1 },
  { id: "stall_overtime", label: "Stall occupied past estimate by", enabled: true, threshold: 200, unit: "%", min: 100, max: 400, step: 25 },
  { id: "daily_energy_cost", label: "Daily energy cost exceeds", enabled: false, threshold: 200, unit: "$", min: 50, max: 500, step: 25 },
  { id: "acceptance_rate", label: "Prediction acceptance rate below", enabled: true, threshold: 70, unit: "%", min: 40, max: 95, step: 5 },
  { id: "utilization_high", label: "Any stall type utilization above", enabled: true, threshold: 85, unit: "%", min: 60, max: 100, step: 5 },
];

type ThresholdTuning = { id: string; label: string; value: number; unit: string; min: number; max: number; step: number };

const defaultThresholds: ThresholdTuning[] = [
  { id: "charge_soc", label: "Charge trigger SOC", value: 30, unit: "%", min: 15, max: 50, step: 5 },
  { id: "detail_days", label: "Detail clean interval", value: 7, unit: "days", min: 3, max: 14, step: 1 },
  { id: "tire_miles", label: "Tire rotation interval", value: 7500, unit: "miles", min: 5000, max: 10000, step: 500 },
  { id: "battery_check", label: "Battery health check", value: 90, unit: "days", min: 30, max: 180, step: 15 },
];

export const AlertsConfigPanel = () => {
  const [rules, setRules] = useState(defaultRules);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [delivery, setDelivery] = useState({ inApp: true, email: true, slack: false });
  const [slackUrl, setSlackUrl] = useState("");

  const updateRule = (id: string, updates: Partial<AlertRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const updateThreshold = (id: string, value: number) => {
    setThresholds(prev => prev.map(t => t.id === id ? { ...t, value } : t));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">OTTO-Q Settings</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setRules(defaultRules); setThresholds(defaultThresholds); toast.info("Reset to defaults"); }}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={() => toast.success("Settings saved")}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alert Rules */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Alert Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {rules.map(r => (
              <div key={r.id} className="space-y-2 p-3 rounded-lg bg-muted/10">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{r.label}</Label>
                  <Switch checked={r.enabled} onCheckedChange={(v) => updateRule(r.id, { enabled: v })} />
                </div>
                {r.enabled && (
                  <div className="flex items-center gap-3">
                    <Slider value={[r.threshold]} min={r.min} max={r.max} step={r.step}
                      onValueChange={([v]) => updateRule(r.id, { threshold: v })} className="flex-1" />
                    <Badge variant="outline" className="text-xs shrink-0 w-20 justify-center">
                      {r.unit === "$" ? `$${r.threshold}` : `${r.threshold}${r.unit}`}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery Config */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> Alert Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">In-App Notifications</Label>
              </div>
              <Switch checked={delivery.inApp} onCheckedChange={(v) => setDelivery(prev => ({ ...prev, inApp: v }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">Email Digest</Label>
              </div>
              <Switch checked={delivery.email} onCheckedChange={(v) => setDelivery(prev => ({ ...prev, email: v }))} />
            </div>
            <div className="space-y-2 p-3 rounded-lg bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs">Slack Webhook</Label>
                </div>
                <Switch checked={delivery.slack} onCheckedChange={(v) => setDelivery(prev => ({ ...prev, slack: v }))} />
              </div>
              {delivery.slack && (
                <Input placeholder="https://hooks.slack.com/services/..." value={slackUrl} onChange={e => setSlackUrl(e.target.value)} className="text-xs h-8" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Threshold Tuning */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Service Threshold Tuning</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thresholds.map(t => (
                <div key={t.id} className="space-y-2 p-3 rounded-lg bg-muted/10">
                  <div className="flex justify-between">
                    <Label className="text-xs">{t.label}</Label>
                    <Badge variant="outline" className="text-xs">{t.value} {t.unit}</Badge>
                  </div>
                  <Slider value={[t.value]} min={t.min} max={t.max} step={t.step}
                    onValueChange={([v]) => updateThreshold(t.id, v)} />
                  <p className="text-[10px] text-muted-foreground">
                    Est. impact: ~{Math.round(t.value * 0.8)} services/month
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
