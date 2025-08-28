import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("🚀 OttoCommand AI Edge Function - Version 4.0 - Complete ChatGPT Integration");
console.log("Deployment time:", new Date().toISOString());

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (req.method === "GET") {
    const envCheck = {
      hasOpenAI: !!Deno.env.get("OPENAI_API_KEY"),
      hasOpenAINew: !!Deno.env.get("OPENAI_API_KEY_NEW"),
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify({ 
      status: "healthy", 
      function: "ottocommand-ai-chat",
      version: "4.0",
      environment: envCheck
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    console.log("📨 Request received:", { 
      messageLength: message?.length || 0, 
      historyLength: conversationHistory?.length || 0 
    });

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "'message' is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OpenAI API key with comprehensive diagnostics
    const openaiKey1 = Deno.env.get("OPENAI_API_KEY")?.trim();
    const openaiKey2 = Deno.env.get("OPENAI_API_KEY_NEW")?.trim();
    const apiKey = openaiKey1 || openaiKey2;
    const keySource = openaiKey1 ? "OPENAI_API_KEY" : (openaiKey2 ? "OPENAI_API_KEY_NEW" : "NONE");
    
    console.log("🔑 API Key Check:", {
      source: keySource,
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      startsWithSk: apiKey?.startsWith("sk-") || false,
      last4: apiKey ? apiKey.slice(-4) : "NONE"
    });

    if (!apiKey) {
      console.error("❌ No OpenAI API key found in environment");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not found. Please add OPENAI_API_KEY in Supabase Edge Functions secrets.",
          details: "Key missing from environment variables"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKey.startsWith("sk-") || apiKey.length < 40) {
      console.error("❌ Invalid OpenAI API key format");
      return new Response(
        JSON.stringify({
          error: "Invalid OpenAI API key format. Key must start with 'sk-' and be at least 40 characters.",
          details: `Key length: ${apiKey.length}, starts with sk-: ${apiKey.startsWith("sk-")}`
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client to fetch real fleet data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🗄️ Fetching real-time fleet data...");

    // Fetch all fleet data in parallel
    const [vehiclesResult, maintenanceResult, routesResult, analyticsResult] = await Promise.all([
      supabase.from('vehicles').select('*').limit(50),
      supabase.from('maintenance_records').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('routes').select('*').order('created_at', { ascending: false }).limit(15),
      supabase.from('fleet_analytics').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    const vehicles = vehiclesResult.data || [];
    const maintenance = maintenanceResult.data || [];
    const routes = routesResult.data || [];
    const analytics = analyticsResult.data || [];

    console.log("📊 Fleet data fetched:", {
      vehicles: vehicles.length,
      maintenance: maintenance.length,
      routes: routes.length,
      analytics: analytics.length
    });

    // Calculate fleet metrics
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const chargingVehicles = vehicles.filter(v => v.status === 'charging').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const idleVehicles = vehicles.filter(v => v.status === 'idle').length;
    const avgFuelLevel = totalVehicles > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / totalVehicles) : 0;
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);

    // Generate real fleet data summary
    const fleetSummary = `CURRENT FLEET STATUS (${new Date().toISOString()}):
📊 FLEET OVERVIEW: ${totalVehicles} total vehicles
   • ${activeVehicles} active (${Math.round(activeVehicles/totalVehicles*100)}%)
   • ${chargingVehicles} charging (${Math.round(chargingVehicles/totalVehicles*100)}%)
   • ${maintenanceVehicles} in maintenance (${Math.round(maintenanceVehicles/totalVehicles*100)}%)
   • ${idleVehicles} idle (${Math.round(idleVehicles/totalVehicles*100)}%)
⛽ ENERGY STATS: Average fuel level ${avgFuelLevel}%
🛣️ FLEET MILEAGE: ${totalMileage.toLocaleString()} total miles

SPECIFIC VEHICLES:
${vehicles.slice(0, 8).map(v => 
  `• ${v.vehicle_number} (${v.make} ${v.model}): ${v.status.toUpperCase()} - ${v.fuel_level}% fuel, ${v.mileage} miles${v.location_lat ? ` @ ${v.location_lat.toFixed(4)}, ${v.location_lng.toFixed(4)}` : ''}`
).join('\n')}

MAINTENANCE ALERTS:
${maintenance.slice(0, 5).map(m => 
  `• ${m.maintenance_type}: ${m.description} - Cost: $${m.cost || 'TBD'}${m.next_due_date ? ` (Due: ${new Date(m.next_due_date).toLocaleDateString()})` : ''}${m.ai_predicted ? ' [AI PREDICTED]' : ''}`
).join('\n')}

ROUTE INFORMATION:
${routes.slice(0, 5).map(r => 
  `• ${r.route_name}: ${r.start_location} → ${r.end_location}${r.estimated_distance ? ` (${r.estimated_distance} miles)` : ''}${r.optimized_by_ai ? ' [AI OPTIMIZED]' : ''}`
).join('\n')}

ANALYTICS INSIGHTS:
${analytics.slice(0, 3).map(a => 
  `• ${a.analysis_type.toUpperCase()} (${a.severity_level}): ${JSON.stringify(a.insights).slice(0, 100)}...`
).join('\n')}`;

    // Build data-driven system prompt
    const systemPrompt = `You are OttoCommand AI, an advanced fleet management assistant with REAL-TIME ACCESS to live fleet data.

${fleetSummary}

CAPABILITIES & INSTRUCTIONS:
🎯 You have access to LIVE DATA from ${totalVehicles} vehicles, ${maintenance.length} maintenance records, ${routes.length} routes, and ${analytics.length} analytics insights.

📋 WHEN ANSWERING:
- Reference SPECIFIC vehicle numbers (e.g., ${vehicles[0]?.vehicle_number || 'BUS-001'})
- Use EXACT fuel levels, mileage, and status from the data above
- Mention SPECIFIC maintenance items with costs and due dates
- Reference ACTUAL route names and locations
- Cite REAL analytics insights and severity levels

🔧 FOR MAINTENANCE QUESTIONS:
- Show vehicles needing attention with exact due dates
- Provide cost estimates from historical data
- Prioritize by severity and AI predictions

⚡ FOR ENERGY/FUEL QUESTIONS:
- Give specific fuel percentages per vehicle
- Identify vehicles below optimal levels
- Calculate range estimates based on current levels

🗺️ FOR ROUTE QUESTIONS:
- Reference actual route names and endpoints
- Show optimization opportunities
- Provide distance and duration estimates

📊 FOR STATUS REQUESTS:
- Give exact counts and percentages
- Highlight critical issues requiring immediate attention
- Provide actionable next steps with specific vehicle IDs

Always be specific, data-driven, and actionable. Reference actual vehicle numbers, costs, dates, and locations from the live data.`;

    // Format conversation history
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add conversation history (last 10 messages to stay within token limits)
    if (Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg?.role && msg?.content) {
          messages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: String(msg.content)
          });
        }
      }
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    console.log("🤖 Calling OpenAI ChatGPT API...");
    console.log("Messages count:", messages.length);

    // Call OpenAI ChatGPT API (using standard chat completions)
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", // Reliable ChatGPT model
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    });

    console.log("📡 OpenAI Response Status:", openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("❌ OpenAI API Error:", errorText);
      
      // Try with GPT-3.5-turbo as fallback
      try {
        console.log("🔄 Trying fallback model...");
        const fallbackResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 800,
            temperature: 0.7
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const aiResponse = fallbackData.choices[0].message.content;
          
          return new Response(JSON.stringify({
            success: true,
            content: aiResponse,
            reply: aiResponse, // Legacy compatibility
            message: aiResponse, // Legacy compatibility
            role: "assistant",
            model_used: "gpt-3.5-turbo",
            key_source: keySource,
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }

      return new Response(
        JSON.stringify({
          error: "OpenAI API request failed",
          details: errorText,
          status: openaiResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openaiResponse.json();
    console.log("✅ OpenAI API Success");

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Unexpected OpenAI response format:", data);
      return new Response(
        JSON.stringify({
          error: "Unexpected response format from OpenAI",
          details: "Missing choices or message in response"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = data.choices[0].message.content;
    
    // Return response in multiple formats for compatibility
    const responsePayload = {
      success: true,
      content: aiResponse,
      reply: aiResponse, // For existing clients expecting 'reply'
      message: aiResponse, // For existing clients expecting 'message'
      role: "assistant",
      model_used: data.model || "gpt-4o",
      key_source: keySource,
      usage: data.usage,
      timestamp: new Date().toISOString()
    };

    console.log("📤 Sending response, length:", aiResponse?.length || 0);

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("💥 Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || String(error),
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});