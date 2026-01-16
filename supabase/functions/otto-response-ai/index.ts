import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DraftContext {
  trafficSeverity: string;
  zoneType: string;
  zoneSize: string;
  vehiclesInside: number;
  vehiclesNear: number;
  recommendations: {
    pauseDispatches: boolean;
    avoidZoneRouting: boolean;
    waveBasedRecovery: boolean;
    safeHarborStaging: boolean;
    keepClearCorridors: boolean;
  };
  selectedSafeHarbors: string[];
  provider?: 'openai' | 'anthropic';
}

interface PredictiveContext {
  availableHarbors: string[];
}

interface ReportContext {
  advisory: {
    id: string;
    severity: string;
    zoneType: string;
    vehiclesInside: number;
    vehiclesNear: number;
    recommendations: Record<string, boolean | number>;
    selectedSafeHarbors: string[];
    oemNotes: string;
  };
}

// Template-based mock generator for draft
function generateMockDraft(context: DraftContext): string {
  const recs = [];
  if (context.recommendations.pauseDispatches) recs.push('pausing new dispatches in the affected zone');
  if (context.recommendations.avoidZoneRouting) recs.push('implementing avoid-zone routing protocols');
  if (context.recommendations.waveBasedRecovery) recs.push('initiating wave-based vehicle recovery');
  if (context.recommendations.safeHarborStaging) {
    recs.push(`directing vehicles to Safe Harbor locations: ${context.selectedSafeHarbors.join(', ') || 'designated depots'}`);
  }
  if (context.recommendations.keepClearCorridors) recs.push('maintaining keep-clear corridors for emergency access');
  
  const severityDescriptor = {
    'High': 'critical',
    'Medium': 'moderate',
    'Low': 'minor',
  }[context.trafficSeverity] || 'notable';
  
  return `OTTO-RESPONSE Advisory Notice

A ${severityDescriptor}-severity traffic incident has been identified within a ${context.zoneType} zone (approximately ${context.zoneSize}). Our monitoring systems have detected ${context.vehiclesInside} vehicle(s) currently operating inside the designated zone, with an additional ${context.vehiclesNear} vehicle(s) in the immediate vicinity.

Based on current conditions, we recommend ${recs.length ? recs.join('; ') : 'continued standard monitoring'}. ${context.trafficSeverity === 'High' ? 'Given the severity level, prompt implementation of these measures is advised.' : 'These recommendations are provided for operational awareness and coordination.'}

This advisory is issued as a non-binding operational recommendation. The OEM retains full vehicle routing and control discretion.`;
}

// Generate mock predictive scenario
function generateMockPredictiveScenario(context: PredictiveContext): object {
  const scenarios = [
    { name: 'Major Interstate Incident', cause: 'Multi-vehicle collision on I-40 near downtown exit', severity: 'High', radius: 1.5 },
    { name: 'Construction Zone Closure', cause: 'Emergency road repair on main arterial route', severity: 'Medium', radius: 0.75 },
    { name: 'Special Event Traffic', cause: 'Major concert venue event causing congestion', severity: 'Medium', radius: 1.0 },
    { name: 'Weather-Related Hazard', cause: 'Flooding reported on low-lying roads', severity: 'High', radius: 2.0 },
    { name: 'Utility Emergency', cause: 'Gas line rupture requiring area evacuation', severity: 'High', radius: 0.5 },
  ];

  const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
  const harbors = context.availableHarbors?.slice(0, 2) || [];

  return {
    scenarioName: selected.name,
    cause: selected.cause,
    severity: selected.severity,
    zoneType: 'radius',
    zoneCenter: { lat: 36.16 + (Math.random() - 0.5) * 0.05, lng: -86.78 + (Math.random() - 0.5) * 0.05 },
    radiusMiles: selected.radius,
    vehiclesAffected: Math.floor(Math.random() * 5) + 1,
    vehiclesNearby: Math.floor(Math.random() * 8) + 2,
    recommendations: ['pauseDispatches', 'avoidZoneRouting', 'safeHarborStaging'],
    suggestedSafeHarbors: harbors,
    oemNotes: `OTTO-RESPONSE Predictive Advisory: ${selected.cause}. Automated scenario generated based on historical patterns and current fleet positioning. Recommended actions have been pre-selected based on severity level and available safe harbor capacity.`,
  };
}

// Generate mock detailed report
function generateMockReport(context: ReportContext): string {
  const advisory = context.advisory;
  const recs = [];
  if (advisory.recommendations.pauseDispatches) recs.push('pause new dispatches');
  if (advisory.recommendations.avoidZoneRouting) recs.push('avoid-zone routing');
  if (advisory.recommendations.waveBasedRecovery) recs.push('wave-based recovery');
  if (advisory.recommendations.safeHarborStaging) recs.push('safe harbor staging');
  if (advisory.recommendations.keepClearCorridors) recs.push('keep-clear corridors');

  return `DETAILED OEM OPERATIONAL REPORT

Advisory Reference: ${advisory.id}
Classification: ${advisory.severity} Severity Incident

SITUATION ASSESSMENT:
This report documents a ${advisory.severity.toLowerCase()}-severity traffic incident affecting autonomous vehicle operations within a ${advisory.zoneType || 'designated'} zone. Current monitoring indicates ${advisory.vehiclesInside} vehicle(s) directly impacted within the incident zone, with ${advisory.vehiclesNear} additional vehicle(s) operating in the buffer zone.

OPERATIONAL RESPONSE:
The following protocols have been activated: ${recs.join(', ') || 'standard monitoring'}. ${advisory.selectedSafeHarbors.length > 0 ? `Vehicles are being directed to the following Safe Harbor locations: ${advisory.selectedSafeHarbors.join(', ')}.` : ''}

FLEET IMPACT ANALYSIS:
- Direct Zone Impact: ${advisory.vehiclesInside} vehicles requiring immediate attention
- Buffer Zone Vehicles: ${advisory.vehiclesNear} vehicles on standby for potential rerouting
- Estimated Resolution Time: Based on incident severity, standard protocols suggest 30-90 minutes for full operational recovery

RECOMMENDATIONS FOR OEM:
This advisory serves as a coordination notice. OEM partners retain full authority over vehicle routing decisions and operational controls. Continued monitoring is recommended until incident clearance is confirmed.

---
Report generated by OTTO-RESPONSE AI Analytics
This document is for operational coordination purposes only.`;
}

// Call Lovable AI Gateway
async function callLovableAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!apiKey) {
    console.log('LOVABLE_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (response.status === 429) {
      console.log('Rate limited, falling back to mock');
      return null;
    }

    if (response.status === 402) {
      console.log('Payment required, falling back to mock');
      return null;
    }

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error('AI call error:', e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context } = await req.json();
    
    // Action: Generate draft OEM notes
    if (action === 'draft') {
      const draftContext = context as DraftContext;
      
      const systemPrompt = `You are OTTO-RESPONSE, an advisory system for autonomous vehicle fleet operations. Generate professional, concise OEM advisory notes. Your response should:
1. Be 2-4 sentences summarizing the situation
2. Reference specific numbers from the context
3. Be professional and operational in tone
4. NOT include recommendations (those are handled separately)
5. Emphasize this is a non-binding advisory`;

      const userPrompt = `Generate an advisory note for the following situation:
- Traffic Severity: ${draftContext.trafficSeverity}
- Zone Type: ${draftContext.zoneType}
- Zone Size: ${draftContext.zoneSize}
- Vehicles Inside Zone: ${draftContext.vehiclesInside}
- Vehicles Near Zone: ${draftContext.vehiclesNear}
- Selected Recommendations: ${Object.entries(draftContext.recommendations).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}
- Safe Harbors: ${draftContext.selectedSafeHarbors.join(', ') || 'None selected'}`;

      const aiDraft = await callLovableAI(systemPrompt, userPrompt);
      const draft = aiDraft || generateMockDraft(draftContext);
      
      return new Response(
        JSON.stringify({ draft, mock: !aiDraft }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Generate predictive scenario
    if (action === 'generatePredictiveScenario') {
      const predictiveContext = context as PredictiveContext;
      
      const systemPrompt = `You are OTTO-RESPONSE, an AI system that generates realistic traffic incident scenarios for autonomous vehicle fleet management training and preparedness. Generate a JSON object with the following structure:
{
  "scenarioName": "Short descriptive name",
  "cause": "Detailed description of the incident cause",
  "severity": "High" | "Medium" | "Low",
  "zoneType": "radius",
  "zoneCenter": { "lat": number near 36.16, "lng": number near -86.78 },
  "radiusMiles": number between 0.5 and 2.5,
  "vehiclesAffected": number between 1 and 6,
  "vehiclesNearby": number between 2 and 10,
  "recommendations": ["pauseDispatches", "avoidZoneRouting", "safeHarborStaging"],
  "suggestedSafeHarbors": ["harbor names from available list"],
  "oemNotes": "Professional 2-3 sentence summary for OEM communication"
}`;

      const userPrompt = `Generate a realistic traffic incident scenario. Available Safe Harbors: ${predictiveContext.availableHarbors?.join(', ') || 'None specified'}. Return only valid JSON.`;

      const aiResult = await callLovableAI(systemPrompt, userPrompt);
      
      let scenario;
      if (aiResult) {
        try {
          // Try to extract JSON from the response
          const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            scenario = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse AI scenario:', e);
        }
      }
      
      if (!scenario) {
        scenario = generateMockPredictiveScenario(predictiveContext);
      }
      
      return new Response(
        JSON.stringify({ scenario, mock: !aiResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Generate detailed report for PDF
    if (action === 'generateReport') {
      const reportContext = context as ReportContext;
      
      const systemPrompt = `You are OTTO-RESPONSE, generating a detailed operational report for OEM partners. The report should be professional, comprehensive, and suitable for inclusion in official documentation. Include:
1. Situation assessment
2. Fleet impact analysis
3. Operational response summary
4. Recommendations for OEM
Keep the tone professional and factual.`;

      const advisory = reportContext.advisory;
      const userPrompt = `Generate a detailed OEM operational report for:
- Advisory ID: ${advisory.id}
- Severity: ${advisory.severity}
- Zone Type: ${advisory.zoneType || 'N/A'}
- Vehicles Inside: ${advisory.vehiclesInside}
- Vehicles Near: ${advisory.vehiclesNear}
- Active Recommendations: ${Object.entries(advisory.recommendations).filter(([_, v]) => v).map(([k]) => k).join(', ')}
- Safe Harbors: ${advisory.selectedSafeHarbors.join(', ') || 'None'}
- Original Notes: ${advisory.oemNotes || 'None provided'}`;

      const aiReport = await callLovableAI(systemPrompt, userPrompt);
      const report = aiReport || generateMockReport(reportContext);
      
      return new Response(
        JSON.stringify({ report, mock: !aiReport }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Supported: draft, generatePredictiveScenario, generateReport' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in otto-response-ai:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
