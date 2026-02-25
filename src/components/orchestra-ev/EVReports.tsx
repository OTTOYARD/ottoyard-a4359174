import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Battery, Wrench, CreditCard, Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ServiceRecord } from "@/lib/orchestra-ev/types";

interface EVReportsProps {
  serviceRecords: ServiceRecord[];
}

const reportTypes = [
  { id: "service-history", title: "Service History Report", description: "Complete record of all services performed", icon: Wrench },
  { id: "charging-history", title: "Charging & Energy Report", description: "Charging sessions, energy usage, and efficiency", icon: Battery },
  { id: "maintenance-health", title: "Maintenance & Health Report", description: "Vehicle health trends, diagnostics, and recommendations", icon: FileText },
  { id: "billing-summary", title: "Billing & Subscription Summary", description: "Payment history, subscription details, and invoices", icon: CreditCard },
];

const chargingFrequencyData = [
  { month: "Sep", sessions: 4 },
  { month: "Oct", sessions: 6 },
  { month: "Nov", sessions: 5 },
  { month: "Dec", sessions: 7 },
  { month: "Jan", sessions: 8 },
  { month: "Feb", sessions: 3 },
];

const serviceCostData = [
  { month: "Sep", cost: 0 },
  { month: "Oct", cost: 49.99 },
  { month: "Nov", cost: 0 },
  { month: "Dec", cost: 49.99 },
  { month: "Jan", cost: 89.99 },
  { month: "Feb", cost: 0 },
];

const energyUsageData = [
  { month: "Sep", kWh: 180 },
  { month: "Oct", kWh: 220 },
  { month: "Nov", kWh: 195 },
  { month: "Dec", kWh: 260 },
  { month: "Jan", kWh: 290 },
  { month: "Feb", kWh: 120 },
];

const luxuryTooltipStyle = {
  backgroundColor: "hsl(0 0% 10%)",
  border: "1px solid hsl(0 0% 20%)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  padding: "12px 16px",
  color: "hsl(0 0% 95%)",
};

const luxuryLabelStyle = { color: "hsl(0 0% 60%)", fontSize: 11, marginBottom: 4 };
const luxuryItemStyle = { color: "hsl(0 0% 95%)", fontSize: 13, fontWeight: 600 };
const axisTickStyle = { fill: "hsl(0 0% 55%)", fontSize: 11 };
const axisLineStyle = { stroke: "hsl(0 0% 20%)" };

const totalSessions = chargingFrequencyData.reduce((s, d) => s + d.sessions, 0);
const avgSessions = (totalSessions / chargingFrequencyData.length).toFixed(1);
const totalCost = serviceCostData.reduce((s, d) => s + d.cost, 0);
const avgCost = (totalCost / serviceCostData.length).toFixed(2);
const totalEnergy = energyUsageData.reduce((s, d) => s + d.kWh, 0);
const avgEnergy = Math.round(totalEnergy / energyUsageData.length);

export const EVReports: React.FC<EVReportsProps> = ({ serviceRecords }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setDownloading(null);
  };

  return (
    <div className="space-y-4">
      {/* Report Downloads */}
      <Card className="surface-elevated-luxury rounded-2xl border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-luxury flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Download Reports
          </CardTitle>
          <p className="text-xs text-muted-foreground">Generate and download PDF reports for your records</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloading === report.id;
            return (
              <div key={report.id} className="surface-luxury rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button rounded-lg font-medium hover:shadow-glow-sm transition-all"
                  onClick={() => handleDownload(report.id)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-1.5 animate-shimmer-luxury-bg">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      PDF
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Charging Frequency */}
        <Card className="surface-luxury rounded-2xl border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-luxury flex items-center gap-2">
              <Battery className="h-4 w-4 text-primary" />
              Charging Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargingFrequencyData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="hsl(0 0% 18%)" />
                  <XAxis dataKey="month" tick={axisTickStyle} axisLine={axisLineStyle} tickLine={false} />
                  <YAxis tick={axisTickStyle} axisLine={axisLineStyle} tickLine={false} />
                  <Tooltip contentStyle={luxuryTooltipStyle} labelStyle={luxuryLabelStyle} itemStyle={luxuryItemStyle} />
                  <Bar dataKey="sessions" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-muted/20 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">Avg: {avgSessions} sessions/mo</span>
              <span className="bg-muted/20 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">Total: {totalSessions} sessions</span>
            </div>
          </CardContent>
        </Card>

        {/* Service Costs */}
        <Card className="surface-luxury rounded-2xl border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-luxury flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Service Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serviceCostData}>
                  <defs>
                    <filter id="glowCost">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="hsl(0 0% 18%)" />
                  <XAxis dataKey="month" tick={axisTickStyle} axisLine={axisLineStyle} tickLine={false} />
                  <YAxis tick={axisTickStyle} axisLine={axisLineStyle} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={luxuryTooltipStyle} labelStyle={luxuryLabelStyle} itemStyle={luxuryItemStyle} formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]} />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", stroke: "hsl(0 0% 10%)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(0 0% 10%)", strokeWidth: 2 }}
                    filter="url(#glowCost)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-muted/20 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">Total: ${totalCost.toFixed(2)}</span>
              <span className="bg-muted/20 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">Avg: ${avgCost}/mo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Usage Trend */}
      <Card className="surface-luxury rounded-2xl border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-luxury flex items-center gap-2">
            <Battery className="h-4 w-4 text-primary" />
            Energy Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyUsageData}>
                <defs>
                  <filter id="glowEnergy">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(0 0% 18%)" />
                <XAxis dataKey="month" tick={axisTickStyle} axisLine={axisLineStyle} tickLine={false} />
                <YAxis tick={axisTickStyle} axisLine={axisLineStyle} tickLine={false} />
                <Tooltip contentStyle={luxuryTooltipStyle} labelStyle={luxuryLabelStyle} itemStyle={luxuryItemStyle} formatter={(value: number) => [`${value} kWh`, "Energy"]} />
                <Line
                  type="monotone"
                  dataKey="kWh"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--primary))", stroke: "hsl(0 0% 10%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(0 0% 10%)", strokeWidth: 2 }}
                  filter="url(#glowEnergy)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="bg-muted/20 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">Total: {totalEnergy} kWh</span>
            <span className="bg-muted/20 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">Avg: {avgEnergy} kWh/mo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
