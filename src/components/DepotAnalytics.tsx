import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, Battery, Zap, Activity, Radio } from "lucide-react";
import { DepotStallInfo } from "./DepotStallInfo";

interface Depot {
  id: string;
  name: string;
  energyGenerated: number;
  energyReturned: number;
  vehiclesCharging: number;
  totalStalls?: number;
  availableStalls?: number;
  status: string;
}

interface DepotAnalyticsProps {
  depot: Depot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepotAnalytics = ({ depot, open, onOpenChange }: DepotAnalyticsProps) => {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Generate depot-specific data based on depot characteristics
  const generateDepotData = () => {
    const baseGeneration = depot.energyGenerated / 1000; // Convert to MWh for consistency
    const baseReturn = depot.energyReturned / 1000;
    
    return {
      weeklyData: [
        { period: 'Mon', generated: baseGeneration * 0.8, returned: baseReturn * 0.8, efficiency: 85 },
        { period: 'Tue', generated: baseGeneration * 1.1, returned: baseReturn * 1.1, efficiency: 88 },
        { period: 'Wed', generated: baseGeneration * 0.9, returned: baseReturn * 0.9, efficiency: 82 },
        { period: 'Thu', generated: baseGeneration * 1.2, returned: baseReturn * 1.2, efficiency: 92 },
        { period: 'Fri', generated: baseGeneration * 1.0, returned: baseReturn * 1.0, efficiency: 87 },
        { period: 'Sat', generated: baseGeneration * 0.7, returned: baseReturn * 0.7, efficiency: 79 },
        { period: 'Sun', generated: baseGeneration * 0.6, returned: baseReturn * 0.6, efficiency: 76 }
      ],
      monthlyData: [
        { period: 'W1', generated: baseGeneration * 6.5, returned: baseReturn * 6.5, efficiency: 85 },
        { period: 'W2', generated: baseGeneration * 7.2, returned: baseReturn * 7.2, efficiency: 89 },
        { period: 'W3', generated: baseGeneration * 6.8, returned: baseReturn * 6.8, efficiency: 83 },
        { period: 'W4', generated: baseGeneration * 7.5, returned: baseReturn * 7.5, efficiency: 91 }
      ],
      yearlyData: [
        { period: 'Q1', generated: baseGeneration * 85, returned: baseReturn * 85, efficiency: 82 },
        { period: 'Q2', generated: baseGeneration * 92, returned: baseReturn * 92, efficiency: 88 },
        { period: 'Q3', generated: baseGeneration * 98, returned: baseReturn * 98, efficiency: 91 },
        { period: 'Q4', generated: baseGeneration * 105, returned: baseReturn * 105, efficiency: 89 }
      ],
      vehicleStatusData: [
        { name: 'Charging', value: depot.vehiclesCharging, fill: 'hsl(var(--primary))' },
        { name: 'Available Stalls', value: depot.availableStalls || 0, fill: 'hsl(var(--success))' },
        { name: 'Maintenance Stalls', value: 2, fill: 'hsl(var(--warning))' }
      ],
      energyDistribution: [
        { time: '00:00', usage: 45 },
        { time: '04:00', usage: 32 },
        { time: '08:00', usage: 78 },
        { time: '12:00', usage: 89 },
        { time: '16:00', usage: 95 },
        { time: '20:00', usage: 67 }
      ]
    };
  };

  const data = generateDepotData();
  const currentData = chartPeriod === 'week' ? data.weeklyData : chartPeriod === 'month' ? data.monthlyData : data.yearlyData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            {depot.name} - Analytics Dashboard
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="analytics" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">
              <Activity className="h-4 w-4 mr-2" />
              Energy Analytics
            </TabsTrigger>
            <TabsTrigger value="stalls">
              <Radio className="h-4 w-4 mr-2" />
              OTTOQ Stall Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Energy Generation Chart */}
          <Card className="shadow-fleet-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Energy Performance</CardTitle>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant={chartPeriod === 'week' ? 'default' : 'outline'} 
                    onClick={() => setChartPeriod('week')}
                    className="text-xs px-2 py-1"
                  >
                    Week
                  </Button>
                  <Button 
                    size="sm" 
                    variant={chartPeriod === 'month' ? 'default' : 'outline'} 
                    onClick={() => setChartPeriod('month')}
                    className="text-xs px-2 py-1"
                  >
                    Month
                  </Button>
                  <Button 
                    size="sm" 
                    variant={chartPeriod === 'year' ? 'default' : 'outline'} 
                    onClick={() => setChartPeriod('year')}
                    className="text-xs px-2 py-1"
                  >
                    Year
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis 
                      label={{ 
                        value: 'Energy (MWh)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value} MWh`, name === 'generated' ? 'Generated' : 'Returned to Grid']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="generated" 
                      stackId="1" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6} 
                      name="Energy Generated" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="returned" 
                      stackId="2" 
                      stroke="hsl(var(--success))" 
                      fill="hsl(var(--success))" 
                      fillOpacity={0.6} 
                      name="Returned to Grid" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stall Usage Distribution */}
          <Card className="shadow-fleet-md">
            <CardHeader>
              <CardTitle className="text-lg">Stall Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={data.vehicleStatusData}
                      cx="50%" 
                      cy="50%" 
                      labelLine={false}
                      label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80} 
                      fill="#8884d8" 
                      dataKey="value"
                    >
                      {data.vehicleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} stalls`, name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--destructive))'
                      }}
                      labelStyle={{ color: 'hsl(var(--destructive))' }}
                      itemStyle={{ color: 'hsl(var(--destructive))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Trend */}
          <Card className="shadow-fleet-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-accent" />
                Efficiency Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis 
                      label={{ 
                        value: 'Efficiency (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Efficiency']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent))' }}
                      name="Efficiency"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Energy Usage Pattern */}
          <Card className="shadow-fleet-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Zap className="h-4 w-4 mr-2 text-energy-grid" />
                Daily Usage Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.energyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis 
                      label={{ 
                        value: 'Usage (%)', 
                        angle: -90, 
                        position: 'insideLeft' 
                      }} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Capacity Usage']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="usage" 
                      fill="hsl(var(--primary))" 
                      name="Capacity Usage"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="stalls">
            <div className="mt-4">
              <DepotStallInfo depotId={depot.id} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepotAnalytics;