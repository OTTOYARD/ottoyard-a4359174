import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, AlertTriangle, TrendingUp, Mic, FileText, Wrench, Activity, Zap, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  createdAt: string;
}

interface MaintenancePrediction {
  id: string;
  component: string;
  predictedDate: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
}

const AIDashboard: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const runFleetAnalysis = async (analysisType: string) => {
    setLoading(true);
    setActiveAnalysis(analysisType);
    
    try {
      const mockVehicleData = [
        { id: 'v1', vehicle_number: 'FL-001', fuel_level: 75, mileage: 45000, status: 'active' },
        { id: 'v2', vehicle_number: 'FL-002', fuel_level: 45, mileage: 62000, status: 'active' },
        { id: 'v3', vehicle_number: 'FL-003', fuel_level: 90, mileage: 38000, status: 'maintenance' }
      ];
      
      const mockRouteData = [
        { route_name: 'Downtown Route', distance: 25.5, duration: 45 },
        { route_name: 'Airport Run', distance: 18.2, duration: 32 }
      ];

      const { data, error } = await supabase.functions.invoke('ai-fleet-analyst', {
        body: {
          analysisType,
          vehicleData: mockVehicleData,
          routeData: mockRouteData
        }
      });

      if (error) throw error;

      if (data.success) {
        const newInsight: AIInsight = {
          id: Date.now().toString(),
          type: analysisType,
          title: `${analysisType.replace('_', ' ').toUpperCase()} Analysis Complete`,
          description: data.insights.summary,
          severity: data.insights.score > 80 ? 'low' : data.insights.score > 60 ? 'medium' : 'high',
          actionRequired: data.recommendations.length > 0,
          createdAt: new Date().toISOString()
        };

        setInsights(prev => [newInsight, ...prev.slice(0, 9)]);
        toast.success(`${analysisType.replace('_', ' ')} analysis completed successfully`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setLoading(false);
      setActiveAnalysis(null);
    }
  };

  const runAnomalyDetection = async () => {
    setLoading(true);
    
    try {
      const mockTelemetryData = {
        fuel_consumption: [8.5, 9.2, 12.1, 8.9, 15.2],
        speed_patterns: [45, 52, 38, 65, 72],
        engine_temperature: [195, 198, 205, 192, 210]
      };

      const { data, error } = await supabase.functions.invoke('intelligent-alerts', {
        body: {
          vehicleData: [{ id: 'v1', vehicle_number: 'FL-001' }],
          telemetryData: mockTelemetryData,
          thresholds: { fuel_consumption: 10, speed_limit: 60, engine_temp: 200 }
        }
      });

      if (error) throw error;

      if (data.success) {
        setAlerts(data.alerts);
        toast.success(`${data.total_alerts} alerts detected and analyzed`);
      }
    } catch (error) {
      console.error('Anomaly detection error:', error);
      toast.error('Failed to run anomaly detection');
    } finally {
      setLoading(false);
    }
  };

  const runPredictiveMaintenance = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('predictive-maintenance', {
        body: {
          vehicleId: 'v1',
          telemetryData: { engine_hours: 2450, mileage: 45000 },
          predictDays: 30
        }
      });

      if (error) throw error;

      if (data.success) {
        const formattedPredictions: MaintenancePrediction[] = data.predictions.map((p: any) => ({
          id: p.id,
          component: p.component,
          predictedDate: p.predicted_date,
          confidence: p.confidence,
          priority: p.priority,
          estimatedCost: p.estimated_cost
        }));
        
        setPredictions(formattedPredictions);
        toast.success(`${data.predictions.length} maintenance predictions generated`);
      }
    } catch (error) {
      console.error('Predictive maintenance error:', error);
      toast.error('Failed to run predictive maintenance');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Fleet Command Center
          </CardTitle>
          <CardDescription>
            Advanced AI-powered fleet analytics and predictive insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button
              onClick={() => runFleetAnalysis('route_optimization')}
              disabled={loading}
              variant={activeAnalysis === 'route_optimization' ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-20"
            >
              <TrendingUp className="h-6 w-6" />
              Route Optimizer
            </Button>
            
            <Button
              onClick={() => runFleetAnalysis('performance_insights')}
              disabled={loading}
              variant={activeAnalysis === 'performance_insights' ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Activity className="h-6 w-6" />
              Performance AI
            </Button>
            
            <Button
              onClick={runAnomalyDetection}
              disabled={loading}
              variant="outline"
              className="flex flex-col items-center gap-2 h-20"
            >
              <AlertTriangle className="h-6 w-6" />
              Anomaly Detector
            </Button>
            
            <Button
              onClick={runPredictiveMaintenance}
              disabled={loading}
              variant="outline"
              className="flex flex-col items-center gap-2 h-20"
            >
              <Wrench className="h-6 w-6" />
              Predict Maintenance
            </Button>
            
            <Button
              onClick={() => runFleetAnalysis('cost_analysis')}
              disabled={loading}
              variant={activeAnalysis === 'cost_analysis' ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-20"
            >
              <FileText className="h-6 w-6" />
              Cost Analyzer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
          <TabsTrigger value="maintenance">Predictive Maintenance</TabsTrigger>
          <TabsTrigger value="voice">Voice Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Analysis</CardTitle>
              <CardDescription>Latest insights from AI fleet analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run an AI analysis to see insights here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map(insight => (
                    <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Zap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={getSeverityColor(insight.severity)}>
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(insight.createdAt).toLocaleTimeString()}
                          </span>
                          {insight.actionRequired && (
                            <Badge variant="outline" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Alerts</CardTitle>
              <CardDescription>AI-detected anomalies and safety concerns</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run anomaly detection to see alerts here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      {getPriorityIcon(alert.severity_level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{alert.type}</h4>
                          <Badge variant={getSeverityColor(alert.severity_level)}>
                            {alert.severity_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Maintenance</CardTitle>
              <CardDescription>AI-predicted maintenance needs for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run predictive maintenance analysis to see forecasts here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {predictions.map(prediction => (
                    <div key={prediction.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      {getPriorityIcon(prediction.priority)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{prediction.component}</h4>
                          <Badge variant={getSeverityColor(prediction.priority)}>
                            {prediction.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Predicted maintenance date: {new Date(prediction.predictedDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Est. Cost: ${prediction.estimatedCost}</span>
                          <span>Priority: {prediction.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Command Center</CardTitle>
              <CardDescription>Control your fleet with natural language commands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  Voice commands are integrated with the AI Assistant
                </p>
                <p className="text-sm text-muted-foreground">
                  Try saying: "Show me vehicle status" or "Dispatch truck to downtown"
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIDashboard;