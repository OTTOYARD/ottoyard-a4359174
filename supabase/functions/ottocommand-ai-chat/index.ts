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
    const { message, conversationHistory = [], currentCity, vehicles = [], depots = [] } = await req.json();
    
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

    console.log("📊 Using city-specific fleet data...");
    console.log("🏙️ Current city:", currentCity?.name || "All Cities");
    console.log("🚛 Vehicles count:", vehicles?.length || 0);
    console.log("🏭 Depots count:", depots?.length || 0);

    // Use actual vehicle data from the UI or fallback to mock data
    const actualVehicles = Array.isArray(vehicles) && vehicles.length > 0 ? vehicles : [
      { id: 'BUS07', name: 'Waymo BUS07', status: 'active', battery: 85, route: 'Downtown Delivery', location: { lat: 37.7749, lng: -122.4194 }, nextMaintenance: '2025-10-15' },
      { id: 'VAN03', name: 'Zoox VAN03', status: 'charging', battery: 45, route: 'Warehouse Route A', location: { lat: 37.7849, lng: -122.4094 }, nextMaintenance: '2025-11-02' },
      { id: 'TRK12', name: 'Cruise TRK12', status: 'maintenance', battery: 92, route: 'Port Transfer', location: { lat: 37.7649, lng: -122.4294 }, nextMaintenance: 'In Progress' },
      { id: 'BUS15', name: 'Aurora BUS15', status: 'active', battery: 67, route: 'Airport Cargo', location: { lat: 37.7549, lng: -122.4394 }, nextMaintenance: '2025-12-08' },
      { id: 'VAN08', name: 'Nuro VAN08', status: 'idle', battery: 78, route: 'City Center Loop', location: { lat: 37.7949, lng: -122.3994 }, nextMaintenance: '2025-10-28' },
      { id: 'TRK05', name: 'Tensor TRK05', status: 'active', battery: 91, route: 'Industrial Zone B', location: { lat: 37.7449, lng: -122.4494 }, nextMaintenance: '2025-11-18' },
      { id: 'BUS22', name: 'Motional BUS22', status: 'charging', battery: 23, route: 'Highway Distribution', location: { lat: 37.7349, lng: -122.4594 }, nextMaintenance: '2025-12-01' },
      { id: 'VAN19', name: 'Mobileye VAN19', status: 'active', battery: 88, route: 'Tech Park Circuit', location: { lat: 37.8049, lng: -122.3894 }, nextMaintenance: '2025-11-12' }
    ];

    const actualDepots = Array.isArray(depots) && depots.length > 0 ? depots : [
      { id: 'depot-1', name: 'OTTOYARD Central', energyGenerated: 2400, energyReturned: 1200, vehiclesCharging: 8, totalStalls: 42, availableStalls: 34, status: 'optimal' },
      { id: 'depot-2', name: 'OTTOYARD North', energyGenerated: 1800, energyReturned: 950, vehiclesCharging: 6, totalStalls: 35, availableStalls: 29, status: 'optimal' },
      { id: 'depot-3', name: 'OTTOYARD East', energyGenerated: 2100, energyReturned: 1100, vehiclesCharging: 12, totalStalls: 38, availableStalls: 26, status: 'optimal' },
      { id: 'depot-4', name: 'OTTOYARD West', energyGenerated: 1900, energyReturned: 850, vehiclesCharging: 4, totalStalls: 30, availableStalls: 26, status: 'maintenance' },
      { id: 'depot-5', name: 'OTTOYARD South', energyGenerated: 2200, energyReturned: 1150, vehiclesCharging: 9, totalStalls: 40, availableStalls: 31, status: 'optimal' }
    ];

    const mockMaintenance = [
      { vehicleId: 'TRK12', type: 'Brake Inspection', description: 'Routine brake system check', cost: 450, dueDate: 'In Progress', priority: 'high' },
      { vehicleId: 'BUS07', type: 'Battery Service', description: 'Battery health check and calibration', cost: 320, dueDate: '2025-10-15', priority: 'medium' },
      { vehicleId: 'VAN03', type: 'Tire Rotation', description: 'Rotate tires and check alignment', cost: 180, dueDate: '2025-11-02', priority: 'low' },
      { vehicleId: 'BUS15', type: 'Oil Change', description: 'Engine oil and filter replacement', cost: 95, dueDate: '2025-12-08', priority: 'medium' },
      { vehicleId: 'VAN08', type: 'AC Service', description: 'Air conditioning system maintenance', cost: 275, dueDate: '2025-10-28', priority: 'low' }
    ];

    // Calculate fleet metrics from actual city data
    const totalVehicles = actualVehicles.length;
    const activeVehicles = actualVehicles.filter(v => v.status === 'active').length;
    const chargingVehicles = actualVehicles.filter(v => v.status === 'charging').length;
    const maintenanceVehicles = actualVehicles.filter(v => v.status === 'maintenance').length;
    const idleVehicles = actualVehicles.filter(v => v.status === 'idle').length;
    const avgBattery = totalVehicles > 0 ? Math.round(actualVehicles.reduce((sum, v) => sum + (v.battery || 0), 0) / totalVehicles) : 0;
    const totalDepotCapacity = actualDepots.reduce((sum, d) => sum + (d.totalStalls || 0), 0);
    const totalDepotAvailable = actualDepots.reduce((sum, d) => sum + (d.availableStalls || 0), 0);
    const totalEnergyGenerated = actualDepots.reduce((sum, d) => sum + (d.energyGenerated || 0), 0);

    // Generate comprehensive fleet summary from actual city data
    const locationInfo = currentCity ? `${currentCity.name}, ${currentCity.country}` : "All Cities Combined";
    const fleetSummary = `🚛 LIVE FLEET STATUS - ${locationInfo} Operations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FLEET OVERVIEW (${totalVehicles} vehicles):
   • ${activeVehicles} ACTIVE (${Math.round(activeVehicles/totalVehicles*100)}%) - Currently on routes
   • ${chargingVehicles} CHARGING (${Math.round(chargingVehicles/totalVehicles*100)}%) - At depot stalls  
   • ${maintenanceVehicles} MAINTENANCE (${Math.round(maintenanceVehicles/totalVehicles*100)}%) - Service in progress
   • ${idleVehicles} IDLE (${Math.round(idleVehicles/totalVehicles*100)}%) - Available for dispatch

⚡ ENERGY STATUS:
   • Fleet Average Battery: ${avgBattery}%
   • Total Energy Generated: ${totalEnergyGenerated.toLocaleString()} kWh
   • Vehicles Below 30%: ${mockVehicles.filter(v => v.battery < 30).length}
   • Critical (Below 25%): ${mockVehicles.filter(v => v.battery < 25).length}

🏭 DEPOT NETWORK (5 locations):
   • Total Charging Stalls: ${totalDepotCapacity}
   • Available Stalls: ${totalDepotAvailable}
   • Utilization Rate: ${Math.round((totalDepotCapacity-totalDepotAvailable)/totalDepotCapacity*100)}%
   • OTTOYARD West: MAINTENANCE STATUS ⚠️

🚛 ACTIVE VEHICLES ON ROUTES:
${actualVehicles.filter(v => v?.status === 'active').map(v => 
  `   • ${v?.id || 'Unknown'} (${v?.name || 'Unknown Vehicle'}): ${v?.route || 'No route'} - ${v?.battery || 0}% battery`
).join('\n') || '   • No active vehicles currently'}

🔌 VEHICLES CHARGING:
${actualVehicles.filter(v => v?.status === 'charging').map(v => 
  `   • ${v?.id || 'Unknown'} (${v?.name || 'Unknown Vehicle'}): ${v?.battery || 0}% battery - ${v?.route || 'No route'} route`
).join('\n') || '   • No vehicles currently charging'}

🔧 MAINTENANCE SCHEDULE:
${mockMaintenance.map(m => 
  `   • ${m.vehicleId}: ${m.type} - $${m.cost} - Due: ${m.dueDate} [${m.priority.toUpperCase()} PRIORITY]`
).join('\n')}

🏢 DEPOT STATUS:
${actualDepots.map(d => 
  `   • ${d?.name || 'Unknown Depot'}: ${d?.availableStalls || 0}/${d?.totalStalls || 0} stalls available - ${d?.energyGenerated || 0} kWh - ${(d?.status || 'unknown').toUpperCase()}`
).join('\n') || '   • No depot information available'}

🎯 KEY ALERTS:
${actualVehicles.filter(v => v?.status === 'maintenance').map(v => `   • ${v?.id || 'Unknown'} currently in maintenance bay`).join('\n')}
${actualVehicles.filter(v => v?.battery && v.battery < 50).map(v => `   • ${v?.id || 'Unknown'} battery at ${v?.battery || 0}% - charging ${v.battery < 25 ? 'CRITICAL' : 'recommended'}`).join('\n')}
${actualDepots.filter(d => d?.status === 'maintenance').map(d => `   • ${d?.name || 'Unknown Depot'} depot offline for maintenance`).join('\n')}
   • Fleet operational in ${locationInfo}
   • Real-time data from ${totalVehicles} vehicles and ${actualDepots.length} depots`;

    // Build data-driven system prompt with city-specific data
    const systemPrompt = `You are OttoCommand AI, an advanced fleet management assistant with REAL-TIME ACCESS to ${locationInfo} fleet operations.

${fleetSummary}

🎯 RESPONSE INSTRUCTIONS:
You have complete visibility into our fleet operations. When answering:

📋 ALWAYS REFERENCE SPECIFIC DATA:
- Use exact vehicle IDs (${actualVehicles.map(v => v?.id).filter(Boolean).join(', ') || 'No vehicles available'})
- Quote actual battery percentages and routes from current city data
- Mention specific depot names and capacity from ${locationInfo}
- Reference real maintenance costs and due dates
- When asked about cities not currently selected, explain data is for ${locationInfo} and suggest switching cities

🚛 FOR FLEET STATUS QUESTIONS:
- Give precise counts: "${activeVehicles} active, ${chargingVehicles} charging, ${maintenanceVehicles} in maintenance"
- Highlight critical vehicles with low battery levels
- Reference depot utilization rates for ${locationInfo}

⚡ FOR ENERGY/BATTERY QUESTIONS:
- Fleet average is ${avgBattery}%
- Identify specific low-battery vehicles
- Recommend charging priorities
- Reference depot availability

🔧 FOR MAINTENANCE QUESTIONS:
- TRK12 is currently in maintenance (brake inspection, $450)
- Show upcoming maintenance with exact dates and costs
- Prioritize by urgency (high/medium/low)

🏭 FOR DEPOT QUESTIONS:
- Reference specific OTTOYARD locations
- Show exact stall availability
- Note OTTOYARD West is in maintenance
- Provide energy generation data

📊 FOR ANALYTICS QUESTIONS:
- Use real utilization percentages
- Reference energy consumption patterns  
- Show performance trends by vehicle type

Always be specific, actionable, and reference the exact data shown above. Provide recommendations with vehicle IDs, costs, and timeframes.`;

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