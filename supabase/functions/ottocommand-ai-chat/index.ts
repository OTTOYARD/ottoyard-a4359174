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

    const { message, conversationHistory } = await req.json();
    console.log('OttoCommand AI Chat request:', { message });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare system prompt for OttoCommand AI
    const systemPrompt = `You are OttoCommand AI, an advanced fleet management assistant powered by GPT-5. You help manage OTTOYARD's electric and hybrid vehicle fleet operations.

Key capabilities and context:
- Fleet size: 45 vehicles (electric and hybrid buses, trucks, vans)
- Main depots: OTTOYARD Central, Airport, East, North
- Services: Vehicle scheduling, maintenance, energy optimization, route planning
- Real-time monitoring: GPS tracking, battery status, charging management
- AI-powered features: Predictive maintenance, intelligent alerts, performance analytics

Communication style:
- Professional yet friendly and conversational
- Provide specific, actionable information
- Use relevant emojis for clarity and engagement
- Offer concrete next steps and solutions
- Reference specific OTTOYARD systems and capabilities

Current fleet status context:
- 12 vehicles active on routes
- 8 vehicles available for dispatch  
- 3 vehicles in maintenance
- 22 vehicles idle/charging
- Fleet efficiency: 94.2% (+3.1% improvement)
- Energy generated: 4.2 MWh this week
- Cost savings: $1,247 this week

Always provide helpful, accurate responses about fleet operations, maintenance scheduling, energy optimization, route planning, and operational analytics.`;

    // Prepare messages for GPT-5
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call GPT-5
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: messages,
        max_completion_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('GPT-5 response generated:', aiResponse.substring(0, 100) + '...');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse,
      model: 'gpt-5-2025-08-07',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in OttoCommand AI Chat:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});