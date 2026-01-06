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
  provider: 'openai' | 'anthropic';
}

// Template-based mock generator
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

This advisory is issued as a non-binding operational recommendation. The OEM retains full routing authority and vehicle control discretion.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context } = await req.json() as { action: string; context: DraftContext };
    
    if (action !== 'draft') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for API keys
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    const hasOpenAI = !!openaiKey && openaiKey.length > 10;
    const hasAnthropic = !!anthropicKey && anthropicKey.length > 10;
    
    // If no keys, return mock
    if (!hasOpenAI && !hasAnthropic) {
      const mockDraft = generateMockDraft(context);
      return new Response(
        JSON.stringify({ draft: mockDraft, mock: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build prompt
    const systemPrompt = `You are OTTO-RESPONSE, an advisory system for autonomous vehicle fleet operations. Generate professional, concise OEM advisory notes. Your response should:
1. Be 2-4 sentences summarizing the situation
2. Reference specific numbers from the context
3. Be professional and operational in tone
4. NOT include recommendations (those are handled separately)
5. Emphasize this is a non-binding advisory`;

    const userPrompt = `Generate an advisory note for the following situation:
- Traffic Severity: ${context.trafficSeverity}
- Zone Type: ${context.zoneType}
- Zone Size: ${context.zoneSize}
- Vehicles Inside Zone: ${context.vehiclesInside}
- Vehicles Near Zone: ${context.vehiclesNear}
- Selected Recommendations: ${Object.entries(context.recommendations).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}
- Safe Harbors: ${context.selectedSafeHarbors.join(', ') || 'None selected'}`;

    let draft: string;
    
    // Try preferred provider first
    if (context.provider === 'anthropic' && hasAnthropic) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          draft = data.content?.[0]?.text || generateMockDraft(context);
        } else {
          throw new Error('Anthropic API error');
        }
      } catch (e) {
        console.error('Anthropic error:', e);
        draft = generateMockDraft(context);
      }
    } else if (hasOpenAI) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 500,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          draft = data.choices?.[0]?.message?.content || generateMockDraft(context);
        } else {
          throw new Error('OpenAI API error');
        }
      } catch (e) {
        console.error('OpenAI error:', e);
        draft = generateMockDraft(context);
      }
    } else {
      draft = generateMockDraft(context);
    }
    
    return new Response(
      JSON.stringify({ draft, mock: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in otto-response-ai:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
