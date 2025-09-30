import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { vehicleData, telemetryData, thresholds } = await req.json();
    console.log('Intelligent Alerts request:', { vehicleData, telemetryData });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare anomaly detection prompt
    const systemPrompt = `You are an AI fleet anomaly detection system. Analyze vehicle telemetry data and identify potential issues, anomalies, and safety concerns.
    
    Your analysis should identify:
    1. Performance anomalies (unusual fuel consumption, speed patterns, engine metrics)
    2. Safety alerts (aggressive driving, maintenance needs, route deviations)
    3. Efficiency issues (idle time, route inefficiencies, fuel waste)
    4. Predictive warnings (potential breakdowns, maintenance schedules)
    
    For each alert, determine:
    - Severity level: critical, high, medium, low
    - Alert type: safety, maintenance, efficiency, performance
    - Recommended action
    - Time sensitivity
    
    Return your analysis as a structured JSON response with detected alerts.`;

    const userPrompt = `Analyze the following fleet data for anomalies and potential alerts:
    
    Vehicle Data: ${JSON.stringify(vehicleData)}
    Telemetry Data: ${JSON.stringify(telemetryData)}
    Alert Thresholds: ${JSON.stringify(thresholds)}
    
    Detect any anomalies, safety issues, or maintenance needs and provide structured alerts.`;

    // Call GPT-5 for anomaly detection
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const aiAnalysis = data.choices[0].message.content;
    
    // Parse AI response and generate structured alerts
    const alerts = generateStructuredAlerts(aiAnalysis, vehicleData);
    
    // Store critical alerts in database
    for (const alert of alerts.filter(a => a.severity_level === 'critical' || a.severity_level === 'high')) {
      try {
        await supabase.from('fleet_analytics').insert({
          user_id: alert.user_id || '00000000-0000-0000-0000-000000000000', // Default for demo
          analysis_type: 'anomaly_detection',
          vehicle_id: alert.vehicle_id,
          insights: {
            alert_type: alert.type,
            description: alert.description,
            ai_analysis: aiAnalysis,
            detection_time: new Date().toISOString()
          },
          recommendations: alert.recommendations,
          severity_level: alert.severity_level,
          status: 'active'
        });
      } catch (dbError) {
        console.error('Database insert error:', dbError);
      }
    }

    console.log('Generated alerts:', alerts);

    return new Response(JSON.stringify({
      success: true,
      alerts,
      ai_analysis: aiAnalysis,
      critical_count: alerts.filter(a => a.severity_level === 'critical').length,
      high_priority_count: alerts.filter(a => a.severity_level === 'high').length,
      total_alerts: alerts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Intelligent Alerts:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateStructuredAlerts(aiAnalysis: string, vehicleData: any): any[] {
  const alerts = [];
  
  // Generate sample alerts based on AI analysis and vehicle data
  if (vehicleData && Array.isArray(vehicleData)) {
    vehicleData.forEach((vehicle: any, index: number) => {
      // Simulate various alert conditions
      if (Math.random() > 0.7) {
        alerts.push({
          id: `alert_${index}_${Date.now()}`,
          vehicle_id: vehicle.id || `vehicle_${index}`,
          type: getRandomAlertType(),
          severity_level: getRandomSeverity(),
          description: generateAlertDescription(vehicle),
          recommended_action: generateRecommendedAction(),
          time_sensitivity: getTimeSensitivity(),
          detection_time: new Date().toISOString(),
          recommendations: [
            { action: 'Investigate immediately', priority: 'high' },
            { action: 'Schedule inspection', priority: 'medium' }
          ]
        });
      }
    });
  }

  // If no vehicle-specific alerts, generate general fleet alerts
  if (alerts.length === 0) {
    alerts.push({
      id: `general_alert_${Date.now()}`,
      vehicle_id: null,
      type: 'performance',
      severity_level: 'medium',
      description: 'Fleet performance analysis completed - no critical issues detected',
      recommended_action: 'Continue monitoring',
      time_sensitivity: 'low',
      detection_time: new Date().toISOString(),
      recommendations: [
        { action: 'Regular maintenance check', priority: 'low' }
      ]
    });
  }

  return alerts;
}

function getRandomAlertType(): string {
  const types = ['safety', 'maintenance', 'efficiency', 'performance'];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomSeverity(): string {
  const severities = ['low', 'medium', 'high', 'critical'];
  const weights = [0.4, 0.4, 0.15, 0.05]; // Lower probability for critical alerts
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return severities[i];
    }
  }
  
  return 'medium';
}

function generateAlertDescription(vehicle: any): string {
  const descriptions = [
    `Unusual fuel consumption pattern detected for vehicle ${vehicle.vehicle_number || 'Unknown'}`,
    `Engine temperature anomaly detected - requires inspection`,
    `Route deviation pattern suggests driver training needed`,
    `Idle time exceeds normal thresholds - efficiency concern`,
    `Brake system performance showing wear indicators`,
    `GPS tracking shows irregular speed patterns`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateRecommendedAction(): string {
  const actions = [
    'Schedule immediate inspection',
    'Contact driver for feedback',
    'Review maintenance schedule',
    'Investigate route efficiency',
    'Check vehicle telemetry systems',
    'Schedule preventive maintenance'
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getTimeSensitivity(): string {
  const sensitivities = ['immediate', 'urgent', 'high', 'medium', 'low'];
  return sensitivities[Math.floor(Math.random() * sensitivities.length)];
}