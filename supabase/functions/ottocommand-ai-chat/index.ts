import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { executeFunction } from './function-executor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    console.log('🚀 OttoCommand AI Edge Function - Version 3.0 - FRESH DEPLOYMENT');
    console.log('Function deployed at:', new Date().toISOString());
    console.log('🔄 COMPLETE REBUILD - Fresh environment variables');
    
    console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
    const allEnvKeys = Object.keys(Deno.env.toObject());
    console.log('All available env vars:', allEnvKeys);
    console.log('Total env vars count:', allEnvKeys.length);
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'FOUND' : 'NOT FOUND');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'FOUND' : 'NOT FOUND');
    
    // COMPREHENSIVE API KEY DIAGNOSTICS - FRESH BUILD
    const rawKey = Deno.env.get('OPENAI_API_KEY');
    const trimmedKey = rawKey?.trim();
    
    console.log('🔑 FRESH BUILD - API KEY DIAGNOSTICS:');
    console.log('- Raw key exists:', !!rawKey);
    console.log('- Raw key type:', typeof rawKey);
    console.log('- Raw key length:', rawKey?.length || 0);
    console.log('- Trimmed key exists:', !!trimmedKey);
    console.log('- Trimmed key length:', trimmedKey?.length || 0);
    console.log('- Starts with sk-:', trimmedKey?.startsWith('sk-') || false);
    console.log('- First 10 chars:', trimmedKey?.substring(0, 10) || 'NONE');
    console.log('- Last 4 chars:', trimmedKey ? trimmedKey.substring(trimmedKey.length - 4) : 'NONE');
    
    // Use trimmed key
    const openAIApiKey = trimmedKey;
    
    // STRICT VALIDATION with detailed error reporting
    console.log('🔍 VALIDATION CHECKS:');
    console.log('- Key exists check:', !!openAIApiKey);
    console.log('- Length check (>=45):', openAIApiKey ? openAIApiKey.length >= 45 : false);
    console.log('- Starts with sk- check:', openAIApiKey?.startsWith('sk-') || false);
    console.log('- Contains only valid chars:', openAIApiKey ? /^sk-[a-zA-Z0-9]{40,}$/.test(openAIApiKey) : false);
    
    if (!openAIApiKey) {
      console.error('❌ API KEY IS NULL/UNDEFINED');
      return new Response(JSON.stringify({
        success: false,
        response: "❌ OpenAI API key is completely missing from environment variables.",
        model: 'error-key-missing',
        diagnostics: {
          rawKeyExists: !!rawKey,
          rawKeyType: typeof rawKey,
          rawKeyLength: rawKey?.length || 0,
          trimmedKeyExists: !!trimmedKey,
          availableEnvKeys: allEnvKeys,
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (openAIApiKey.length < 45) {
      console.error('❌ API KEY TOO SHORT:', openAIApiKey.length);
      return new Response(JSON.stringify({
        success: false,
        response: `❌ OpenAI API key is too short (${openAIApiKey.length} chars). Valid keys are typically 51+ characters.`,
        model: 'error-key-too-short',
        diagnostics: {
          keyLength: openAIApiKey.length,
          keyPreview: `${openAIApiKey.substring(0, 10)}...`,
          expectedLength: '51+ characters'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!openAIApiKey.startsWith('sk-')) {
      console.error('❌ API KEY INVALID FORMAT');
      return new Response(JSON.stringify({
        success: false,
        response: "❌ OpenAI API key must start with 'sk-'. Please check your key format.",
        model: 'error-key-format',
        diagnostics: {
          keyLength: openAIApiKey.length,
          startsWithSk: openAIApiKey.startsWith('sk-'),
          firstChars: openAIApiKey.substring(0, 4),
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ API KEY PASSED ALL VALIDATION CHECKS');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get real-time fleet data
    const fleetData = await getRealTimeFleetData(supabase);

    // Create comprehensive system prompt with real data
    const systemPrompt = `You are OttoCommand AI, an advanced GPT-5 powered fleet management assistant with access to REAL-TIME fleet data.

CURRENT FLEET STATUS:
${fleetData.fleetSummary}

VEHICLE STATUS:
${fleetData.vehicleStatus}

MAINTENANCE ALERTS:
${fleetData.maintenanceAlerts}

ANALYTICS INSIGHTS:
${fleetData.analyticsInsights}

ROUTE INFORMATION:
${fleetData.routeInfo}

DEPOT STATUS:
${fleetData.depotInfo}

AVAILABLE REAL DATA: You have access to live database information including:
- ${fleetData.rawData?.vehicles?.length || 0} vehicles with real-time status, energy levels, mileage
- ${fleetData.rawData?.maintenance?.length || 0} maintenance records with AI predictions
- ${fleetData.rawData?.analytics?.length || 0} analytics insights with severity levels
- ${fleetData.rawData?.routes?.length || 0} route records with optimization data
- Fleet metrics: ${fleetData.rawData?.metrics?.totalMileage || 0} total miles, ${fleetData.rawData?.metrics?.avgEnergyLevel || 0}% avg energy

INTELLIGENT RESPONSE PROTOCOL:
1. ANALYZE: Parse question against real-time data
2. IDENTIFY: Find specific vehicles/routes/data points relevant to query
3. CALCULATE: Provide exact metrics, costs, timeframes
4. EXECUTE: Use functions for immediate actions when requested
5. RECOMMEND: Offer 1-2 specific next steps based on data

RESPONSE STYLE:
- Lead with specific data points that answer the exact question
- Reference vehicle IDs, routes, percentages, costs, timeframes from REAL DATA
- Execute actions immediately when requested (scheduling, status updates)
- Provide precise recommendations based on current fleet state
- Ask for clarification only if question is truly ambiguous

AVAILABLE ACTIONS: schedule_vehicle_task, update_vehicle_status, web_search, create_optimization_plan

Be the most intelligent, data-driven fleet AI assistant ever created, using REAL fleet data.`;

    // Prepare messages for GPT-5 with proper conversation mapping
    const formattedHistory = (conversationHistory || []).slice(-10).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    // Define available tools for agentic capabilities (GPT-5 format)
    const tools = [
      {
        type: "function",
        function: {
          name: "schedule_vehicle_task",
          description: "Schedule a specific vehicle for a maintenance task or route assignment",
          parameters: {
            type: "object",
            properties: {
              vehicle_id: { type: "string", description: "Vehicle identifier (e.g., BUS-007, VAN-003)" },
              task_type: { type: "string", enum: ["maintenance", "route", "inspection"], description: "Type of task to schedule" },
              description: { type: "string", description: "Detailed description of the task" },
              scheduled_date: { type: "string", description: "When to schedule the task (YYYY-MM-DD format)" },
              priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Task priority level" }
            },
            required: ["vehicle_id", "task_type", "description", "scheduled_date"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_vehicle_status", 
          description: "Update a vehicle's operational status",
          parameters: {
            type: "object",
            properties: {
              vehicle_id: { type: "string", description: "Vehicle identifier" },
              status: { type: "string", enum: ["active", "maintenance", "charging", "idle"], description: "New vehicle status" },
              location: { type: "string", description: "Current location or depot" },
              notes: { type: "string", description: "Additional status notes" }
            },
            required: ["vehicle_id", "status"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for current information, best practices, or industry insights",
          parameters: {
            type: "object", 
            properties: {
              query: { type: "string", description: "Search query for current information" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_optimization_plan",
          description: "Create a detailed fleet optimization plan based on current data",
          parameters: {
            type: "object",
            properties: {
              focus_area: { type: "string", enum: ["routes", "energy", "maintenance", "costs"], description: "Primary optimization focus" },
              timeframe: { type: "string", enum: ["immediate", "weekly", "monthly"], description: "Implementation timeframe" },
              goals: { type: "string", description: "Specific optimization goals" }
            },
            required: ["focus_area", "timeframe"]
          }
        }
      }
    ];

    // Call GPT-5 with tools (new format for GPT-5)
    console.log('🤖 Calling OpenAI GPT-5 with tools...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error (gpt-5):', errorText);

      try {
        const altResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: messages,
            tools: tools,
            tool_choice: 'auto',
            max_completion_tokens: 2000
          }),
        });

        if (altResponse.ok) {
          const altData = await altResponse.json();
          const altMessage = altData.choices[0].message;
          return new Response(JSON.stringify({
            success: true,
            response: altMessage.content,
            model: 'gpt-4.1-2025-04-14',
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const altErrorText = await altResponse.text();
        console.error('OpenAI API error (gpt-4.1):', altErrorText);
        const fallback = generateRobustFallbackResponse(message, conversationHistory);
        return new Response(JSON.stringify({
          success: true,
          response: fallback,
          model: 'fallback-local-generator',
          note: 'AI provider error on both models',
          provider_error: { gpt5: errorText, gpt41: altErrorText },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('OpenAI alt model exception:', e);
        const fallback = generateRobustFallbackResponse(message, conversationHistory);
        return new Response(JSON.stringify({
          success: true,
          response: fallback,
          model: 'fallback-local-generator',
          note: 'AI provider exception on both models',
          provider_error_exception: String(e),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // Check if AI wants to call a tool (GPT-5 format)
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log('Tool calls requested:', aiMessage.tool_calls);
      
      // Execute the first requested tool
      const toolCall = aiMessage.tool_calls[0];
      const functionResult = await executeFunction({
        name: toolCall.function.name,
        arguments: toolCall.function.arguments
      }, supabase);
      
      // Send function result back to AI for final response
      const followUpMessages = [
        ...messages,
        aiMessage,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult)
        }
      ];

      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: followUpMessages,
          max_completion_tokens: 2000
        }),
      });

      const followUpData = await followUpResponse.json();
      const finalResponse = followUpData.choices[0].message.content;

      return new Response(JSON.stringify({
        success: true,
        response: finalResponse,
        action_taken: toolCall.function.name,
        model: 'gpt-5-2025-08-07',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the AI response
    return new Response(JSON.stringify({
      success: true,
      response: aiMessage.content,
      model: 'gpt-5-2025-08-07',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in OttoCommand AI function:', error);
    return new Response(JSON.stringify({
      success: false,
      response: "I'm experiencing technical difficulties. Please try again in a moment.",
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to get real-time fleet data
async function getRealTimeFleetData(supabase: any) {
  try {
    console.log('🔄 Fetching real-time fleet data...');

    // Fetch all data in parallel for better performance
    const [vehiclesResult, maintenanceResult, analyticsResult, routesResult] = await Promise.all([
      supabase.from('vehicles').select('*').limit(50),
      supabase.from('maintenance_records').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('fleet_analytics').select('*').order('created_at', { ascending: false }).limit(15),
      supabase.from('routes').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    const vehicles = vehiclesResult.data || [];
    const maintenance = maintenanceResult.data || [];
    const analytics = analyticsResult.data || [];
    const routes = routesResult.data || [];

    // Calculate fleet metrics
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const chargingVehicles = vehicles.filter(v => v.status === 'charging').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const avgEnergyLevel = totalVehicles > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / totalVehicles) : 0;
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
    const totalEngineHours = vehicles.reduce((sum, v) => sum + (v.engine_hours || 0), 0);

    // Generate intelligent summaries
    const fleetSummary = `Fleet Overview: ${totalVehicles} total vehicles (${activeVehicles} active, ${chargingVehicles} charging, ${maintenanceVehicles} in maintenance). Average energy level: ${avgEnergyLevel}%. Total fleet mileage: ${totalMileage.toLocaleString()} miles.`;

    const vehicleStatus = vehicles.length > 0 
      ? vehicles.slice(0, 5).map(v => `${v.vehicle_number}: ${v.status} - ${v.fuel_level}% energy, ${v.mileage} miles, Location: ${v.location_lat ? `${v.location_lat}, ${v.location_lng}` : 'Unknown'}`).join(' | ')
      : 'No vehicle data available';

    const maintenanceAlerts = maintenance.length > 0
      ? maintenance.slice(0, 3).map(m => `${m.maintenance_type} - ${m.description} (${m.ai_predicted ? 'AI Predicted' : 'Scheduled'}) - Cost: $${m.cost || 'TBD'}`).join(' | ')
      : 'No maintenance alerts';

    const analyticsInsights = analytics.length > 0
      ? analytics.slice(0, 3).map(a => `${a.analysis_type} (${a.severity_level}): ${JSON.stringify(a.insights).substring(0, 100)}...`).join(' | ')
      : 'No analytics data available';

    const routeInfo = routes.length > 0
      ? routes.slice(0, 3).map(r => `${r.route_name}: ${r.start_location} to ${r.end_location} - ${r.estimated_distance} miles, ${r.estimated_duration} min (${r.optimized_by_ai ? 'AI Optimized' : 'Standard'})`).join(' | ')
      : 'No route data available';

    const depotInfo = `Fleet Operations Status: ${totalVehicles} vehicles tracked, ${totalEngineHours.toFixed(1)} total engine hours logged. Energy efficiency: ${avgEnergyLevel}% average charge level across fleet.`;

    return {
      fleetSummary,
      vehicleStatus,
      maintenanceAlerts,
      analyticsInsights,
      routeInfo,
      depotInfo,
      rawData: {
        vehicles,
        maintenance,
        analytics,
        routes,
        metrics: {
          totalVehicles,
          activeVehicles,
          chargingVehicles,
          maintenanceVehicles,
          avgEnergyLevel,
          totalMileage,
          totalEngineHours
        }
      }
    };
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return {
      fleetSummary: 'Unable to fetch current fleet data',
      vehicleStatus: 'Fleet status temporarily unavailable',
      maintenanceAlerts: 'Maintenance data temporarily unavailable',
      analyticsInsights: 'Analytics data temporarily unavailable',
      routeInfo: 'Route data temporarily unavailable',
      depotInfo: 'Depot information temporarily unavailable',
      rawData: { vehicles: [], maintenance: [], analytics: [], routes: [], metrics: {} }
    };
  }
}

// Enhanced fallback response generator
function generateRobustFallbackResponse(userMessage: string, conversationHistory: any[] = []) {
  const message = userMessage.toLowerCase();
  
  const responses = {
    status: "I'm OttoCommand AI, your fleet management assistant. While I'm experiencing connectivity issues with my advanced AI models, I can still help with basic fleet information. Your fleet management system includes vehicle tracking, maintenance scheduling, route optimization, and predictive analytics. What specific aspect would you like to know about?",
    
    fleet: "Your fleet management system is operational. Key features include: real-time vehicle tracking, automated maintenance scheduling, fuel efficiency monitoring, route optimization, and predictive maintenance alerts. All systems are designed to optimize your fleet's performance and reduce operational costs.",
    
    vehicle: "Vehicle management capabilities include: status monitoring (active, maintenance, charging, idle), location tracking, fuel/energy level monitoring, mileage tracking, and maintenance history. Each vehicle can be individually managed through our comprehensive dashboard system.",
    
    maintenance: "Maintenance features include: predictive maintenance alerts using AI analysis, scheduled maintenance tracking, cost monitoring, maintenance history logs, and automated reminders. Our AI system can predict potential issues before they become costly problems.",
    
    route: "Route optimization includes: AI-powered route planning, real-time traffic integration, fuel efficiency optimization, estimated arrival times, and performance analytics. Routes can be optimized for various factors including distance, fuel consumption, and delivery timeframes.",
    
    analytics: "Analytics dashboard provides: fleet performance metrics, cost analysis, efficiency trends, predictive insights, maintenance forecasting, and operational recommendations. All data is processed through advanced AI algorithms for maximum insight value.",
    
    help: "I'm OttoCommand AI, your intelligent fleet management assistant. I can help with vehicle status, maintenance scheduling, route optimization, fleet analytics, cost management, and operational insights. What would you like assistance with today?",
    
    default: "I'm experiencing temporary connectivity issues with my advanced AI models, but I'm still here to help with your fleet management needs. I can assist with vehicle tracking, maintenance scheduling, route planning, and operational analytics. What specific information can I help you with?"
  };
  
  // Determine response based on keywords
  if (message.includes('status') || message.includes('fleet')) return responses.status;
  if (message.includes('vehicle') || message.includes('truck') || message.includes('car')) return responses.vehicle;
  if (message.includes('maintenance') || message.includes('repair') || message.includes('service')) return responses.maintenance;
  if (message.includes('route') || message.includes('navigation') || message.includes('optimize')) return responses.route;
  if (message.includes('analytics') || message.includes('data') || message.includes('report')) return responses.analytics;
  if (message.includes('help') || message.includes('what') || message.includes('how')) return responses.help;
  
  return responses.default;
}