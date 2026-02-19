import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Battery, Wrench, CreditCard } from "lucide-react";
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

const tooltipStyle = {
  backgroundColor: "hsl(0 0% 12%)",
  border: "1px solid hsl(0 0% 20%)",
  borderRadius: "8px",
  color: "hsl(0 0% 95%)",
};

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
      <Card className="futuristic-card hover-neon">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center neon-text">
            <FileText className="h-4 w-4 mr-2 text-primary" />
            Download Reports
          </CardTitle>
          <p className="text-xs text-muted-foreground">Generate and download PDF reports for your records</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloading === report.id;
            return (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(report.id)} disabled={isDownloading}>
                  {isDownloading ? (
                    <>Generating...</>
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
        <Card className="futuristic-card hover-neon">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center neon-text">
              <Battery className="h-4 w-4 mr-2 text-primary" />
              Charging Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chargingFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="month" stroke="hsl(0 0% 50%)" fontSize={12} />
                  <YAxis stroke="hsl(0 0% 50%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Costs */}
        <Card className="futuristic-card hover-neon">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center neon-text">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Service Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serviceCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="month" stroke="hsl(0 0% 50%)" fontSize={12} />
                  <YAxis stroke="hsl(0 0% 50%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]} />
                  <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Usage Trend */}
      <Card className="futuristic-card hover-neon">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center neon-text">
            <Battery className="h-4 w-4 mr-2 text-primary" />
            Energy Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="month" stroke="hsl(0 0% 50%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 50%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} kWh`, "Energy"]} />
                <Line type="monotone" dataKey="kWh" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
