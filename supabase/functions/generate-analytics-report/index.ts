import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FleetAnalyticsData {
  totalVehicles: number;
  statusDistribution: {
    active: number;
    charging: number;
    maintenance: number;
    idle: number;
  };
  efficiencyTrends: {
    period: string;
    efficiency: number;
  }[];
  cityName: string;
  reportDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyticsData }: { analyticsData: FleetAnalyticsData } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
      throw new Error('No AI API key configured');
    }

    // Build context for the AI
    const analyticsContext = `
FLEET ANALYTICS REPORT DATA:
- Report Date: ${analyticsData.reportDate}
- City: ${analyticsData.cityName}
- Total Vehicles: ${analyticsData.totalVehicles}

FLEET STATUS DISTRIBUTION:
- Active: ${analyticsData.statusDistribution.active} vehicles (${((analyticsData.statusDistribution.active / analyticsData.totalVehicles) * 100).toFixed(1)}%)
- Charging: ${analyticsData.statusDistribution.charging} vehicles (${((analyticsData.statusDistribution.charging / analyticsData.totalVehicles) * 100).toFixed(1)}%)
- Maintenance: ${analyticsData.statusDistribution.maintenance} vehicles (${((analyticsData.statusDistribution.maintenance / analyticsData.totalVehicles) * 100).toFixed(1)}%)
- Idle: ${analyticsData.statusDistribution.idle} vehicles (${((analyticsData.statusDistribution.idle / analyticsData.totalVehicles) * 100).toFixed(1)}%)

EFFICIENCY TRENDS:
${analyticsData.efficiencyTrends.map(t => `- ${t.period}: ${t.efficiency}%`).join('\n')}

Average Efficiency: ${(analyticsData.efficiencyTrends.reduce((sum, t) => sum + t.efficiency, 0) / analyticsData.efficiencyTrends.length).toFixed(1)}%
`;

    const systemPrompt = `You are a professional fleet analytics report writer for OTTOYARD, an autonomous vehicle fleet management company. Your task is to generate a comprehensive executive summary and analysis for fleet performance reports.

Your report should be:
- Professional and data-driven in tone
- Include actionable insights and recommendations
- Well-structured with clear sections
- Comprehensive but concise (300-400 words)
- Suitable for executive stakeholders and operational managers

Structure the report as:
1. Executive Summary (2-3 sentences overview)
2. Fleet Status Analysis (key observations about vehicle distribution)
3. Efficiency Performance (trends and patterns observed)
4. Recommendations (2-3 actionable items for improvement)
5. Outlook (brief forward-looking statement)

Do NOT use markdown formatting. Write in plain prose paragraphs with clear section headers.`;

    let narrative = '';

    // Try OpenAI first
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Generate a professional fleet analytics report based on the following data:\n\n${analyticsContext}` }
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          narrative = data.choices[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('OpenAI error:', e);
      }
    }

    // Fallback to Anthropic if OpenAI fails
    if (!narrative && ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 800,
            system: systemPrompt,
            messages: [
              { role: 'user', content: `Generate a professional fleet analytics report based on the following data:\n\n${analyticsContext}` }
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          narrative = data.content[0]?.text || '';
        }
      } catch (e) {
        console.error('Anthropic error:', e);
      }
    }

    // Fallback if both fail
    if (!narrative) {
      narrative = generateFallbackNarrative(analyticsData);
    }

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      narrative: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackNarrative(data: FleetAnalyticsData): string {
  const totalVehicles = data.totalVehicles;
  const avgEfficiency = data.efficiencyTrends.reduce((sum, t) => sum + t.efficiency, 0) / data.efficiencyTrends.length;
  
  return `EXECUTIVE SUMMARY

This fleet analytics report provides a comprehensive overview of OTTOYARD's autonomous vehicle fleet operations in ${data.cityName} as of ${data.reportDate}. The fleet currently comprises ${totalVehicles} vehicles with an average operational efficiency of ${avgEfficiency.toFixed(1)}%.

FLEET STATUS ANALYSIS

The current fleet distribution shows ${data.statusDistribution.active} vehicles (${((data.statusDistribution.active / totalVehicles) * 100).toFixed(1)}%) in active service, ${data.statusDistribution.charging} vehicles (${((data.statusDistribution.charging / totalVehicles) * 100).toFixed(1)}%) undergoing charging operations, ${data.statusDistribution.maintenance} vehicles (${((data.statusDistribution.maintenance / totalVehicles) * 100).toFixed(1)}%) in maintenance, and ${data.statusDistribution.idle} vehicles (${((data.statusDistribution.idle / totalVehicles) * 100).toFixed(1)}%) in idle status.

EFFICIENCY PERFORMANCE

Fleet efficiency has demonstrated consistent performance across the reporting period, maintaining an average of ${avgEfficiency.toFixed(1)}%. This indicates stable operational processes and effective fleet management protocols.

RECOMMENDATIONS

1. Monitor charging infrastructure capacity to optimize vehicle availability during peak demand periods.
2. Review maintenance scheduling to minimize vehicle downtime while ensuring safety standards.
3. Consider implementing predictive analytics to anticipate demand fluctuations.

OUTLOOK

The fleet continues to demonstrate strong operational performance. Continued focus on efficiency optimization and proactive maintenance will support sustained growth and service excellence.`;
}
