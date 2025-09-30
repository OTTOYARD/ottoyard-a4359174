import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeFunction } from "./function-executor.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
  "Content-Type": "application/json",
};

function ok(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, ...(init.headers || {}) },
  });
}
function fail(status: number, error: string, details?: unknown) {
  return ok({ error, details, timestamp: new Date().toISOString() }, { status });
}
function asToolMessage(callId: string, payload: unknown) {
  return { role: "tool" as const, tool_call_id: callId, content: JSON.stringify(payload ?? {}) };
}
function actionBlock(action: "schedule_return" | "create_service_job" | "assign_charger" | "update_status" | "none", reason: string, details: Record<string, unknown> = {}) {
  return { action, reason, details };
}

console.log("🚀 OttoCommand AI Edge Function v6.0 — dual-mode (general + ops)");
console.log("Deployed:", new Date().toISOString());

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method === "GET") {
    const envCheck = {
      hasOpenAI: !!Deno.env.get("OPENAI_API_KEY"),
      model: Deno.env.get("OTTO_MODEL") || "gpt-4o-mini",
      demoMode: Deno.env.get("DEMO_MODE") || "0",
      now: new Date().toISOString(),
    };
    return ok({ status: "healthy", function: "ottocommand-ai-chat", version: "6.0", environment: envCheck });
  }

  if (req.method !== "POST") return fail(405, "Method not allowed", { method: req.method });

  // Parse input
  let payload: any;
  try { payload = await req.json(); } catch (e) { return fail(400, "Invalid JSON body", String(e)); }
  const {
    message,
    mode = "ops",
    conversationHistory = [],
    currentCity = null,
    vehicles = [],
    depots = [],
  } = payload ?? {};
  if (!message || typeof message !== "string") return fail(400, "'message' is required and must be a string");

  // OpenAI auth
  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) return fail(500, "Missing OpenAI API key. Set OPENAI_API_KEY in Supabase secrets.");
  if (!(apiKey.startsWith("sk-") && apiKey.length >= 40)) return fail(500, "Invalid OpenAI API key format (must start with 'sk-').");

  // AI Model Selection - Claude for advanced reasoning, OpenAI for general tasks
  const useClaudeForAnalysis = Deno.env.get("USE_CLAUDE_ANALYSIS") !== "0"; // default true
  const model = Deno.env.get("OTTO_MODEL")?.trim() || "gpt-4o-mini";
  const claudeModel = "claude-3-5-sonnet-20241022"; // Latest Claude for fleet analysis
  const DEMO = Deno.env.get("DEMO_MODE") === "1";
  
  // Get Claude API key for advanced analysis
  const claudeApiKey = Deno.env.get("ANTHROPIC_API_KEY")?.trim();

  // Supabase (optional for ops mode)
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

  // --- Mode A: GENERAL (pure ChatGPT behavior) ---
  if (mode === "general") {
    const messages = [
      { role: "system", content: "You are OttoCommand AI (general assistant). Be helpful, safe, concise by default, and capable across topics." },
      ...conversationHistory.slice(-10).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) })),
      { role: "user", content: message },
    ];
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 1200, temperature: 0.6 }),
    });
    if (!r.ok) {
      const errorText = await r.text().catch(() => "");
      console.error("OpenAI API Error (general mode):", r.status, errorText);
      return fail(502, "OpenAI failed (general mode)", errorText);
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "(no content)";
    return ok({ success: true, mode: "general", content, timestamp: new Date().toISOString() });
  }

  // --- Mode B: OPS (fleet intelligence + tools) ---
  // Optional DB fetch (if supabase configured)
  let realTimeVehicles: any[] = [];
  let realTimeMaintenance: any[] = [];
  let actualDepots: any[] = Array.isArray(depots) ? depots : [];

  if (supabase) {
    try {
      const [vehiclesData, maintenanceData] = await Promise.all([
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
        supabase.from("maintenance_records").select("*, vehicles(vehicle_number, make, model)").order("created_at", { ascending: false }).limit(20),
      ]);

      realTimeVehicles = (vehiclesData.data || []).map((v: any) => ({
        id: v.vehicle_number || v.id || `VEH${Math.floor(Math.random() * 1000)}`,
        name: `${v.make || "Vehicle"} ${v.model || ""} ${v.vehicle_number || ""}`.trim(),
        status: v.status || "unknown",
        battery: typeof v.fuel_level === "number" ? v.fuel_level : (DEMO ? Math.floor(Math.random() * 100) : 0),
        route: `Route ${v.vehicle_number || "N/A"}`,
        location: {
          lat: typeof v.location_lat === "number" ? v.location_lat : (DEMO ? 37.7749 + (Math.random() - 0.5) * 0.1 : 0),
          lng: typeof v.location_lng === "number" ? v.location_lng : (DEMO ? -122.4194 + (Math.random() - 0.5) * 0.1 : 0),
        },
        nextMaintenance: v.next_maintenance_date ? new Date(v.next_maintenance_date).toISOString().slice(0, 10) : (DEMO ? new Date(Date.now() + Math.random() * 30 * 864e5).toISOString().slice(0, 10) : "TBD"),
        vehicleType: v.vehicle_type,
        mileage: v.mileage || 0,
        engineHours: v.engine_hours || 0,
        lastUpdate: v.last_location_update || null,
      }));

      realTimeMaintenance = (maintenanceData.data || []).map((m: any) => ({
        vehicleId: m.vehicles?.vehicle_number || `VEH${Math.floor(Math.random() * 100)}`,
        type: m.maintenance_type || "General",
        description: m.description || "",
        cost: typeof m.cost === "number" ? m.cost : (DEMO ? Math.floor(Math.random() * 500) + 100 : 0),
        dueDate: m.next_due_date ? new Date(m.next_due_date).toISOString().slice(0, 10) : "TBD",
        priority: m.ai_predicted ? "high" : (["low", "medium", "high"][(Math.random() * 3) | 0] as "low" | "medium" | "high"),
        aiPredicted: !!m.ai_predicted,
      }));
    } catch (e) {
      console.warn("Supabase fetch skipped (not configured or error):", e);
    }
  }

  const fallbackVehicles = [
    { id: "BUS07", name: "Waymo BUS07", status: "active", battery: 85, route: "Downtown Delivery", location: { lat: 37.7749, lng: -122.4194 }, nextMaintenance: "2025-10-15" },
    { id: "VAN03", name: "Zoox VAN03", status: "charging", battery: 45, route: "Warehouse Route A", location: { lat: 37.7849, lng: -122.4094 }, nextMaintenance: "2025-11-02" },
    { id: "TRK12", name: "Cruise TRK12", status: "maintenance", battery: 92, route: "Port Transfer", location: { lat: 37.7649, lng: -122.4294 }, nextMaintenance: "In Progress" },
    { id: "BUS15", name: "Aurora BUS15", status: "active", battery: 67, route: "Airport Cargo", location: { lat: 37.7549, lng: -122.4394 }, nextMaintenance: "2025-12-08" },
    { id: "VAN08", name: "Nuro VAN08", status: "idle", battery: 78, route: "City Center Loop", location: { lat: 37.7949, lng: -122.3994 }, nextMaintenance: "2025-10-28" },
  ];
  const actualVehicles = (realTimeVehicles.length ? realTimeVehicles : (Array.isArray(vehicles) && vehicles.length ? vehicles : fallbackVehicles));
  const derived = (() => {
    const total = actualVehicles.length;
    const active = actualVehicles.filter((v: any) => v.status === "active").length;
    const charging = actualVehicles.filter((v: any) => v.status === "charging").length;
    const maint = actualVehicles.filter((v: any) => v.status === "maintenance").length;
    const idle = actualVehicles.filter((v: any) => v.status === "idle").length;
    const avgBatt = total ? Math.round(actualVehicles.reduce((s: number, v: any) => s + (Number(v.battery) || 0), 0) / total) : 0;
    return { total, active, charging, maint, idle, avgBatt };
  })();

  const locationInfo = currentCity ? `${currentCity.name}${currentCity.country ? ", " + currentCity.country : ""}` : "All Regions";
  
  // Enhanced system prompt for fleet intelligence
  const enhancedSystemPrompt = `You are OttoCommand AI — the definitive Autonomous Fleet Operations Intelligence System for OTTOYARD's premium OEM partners.

**TARGET PARTNERS & CONTEXT:**
Primary OEM Partners: Waymo, Zoox, Motional, May Mobility, Uber ATG, Lyft Level 5
Industry Focus: Autonomous vehicle fleet management, L4/L5 robotaxi operations, OEM partnership optimization
Management Audience: Fleet directors, operations VPs, partner relationship managers, C-suite executives

**CURRENT OPERATIONAL STATUS:**
Region: ${locationInfo}
Fleet Overview: ${derived.total} autonomous vehicles | Active: ${derived.active} | Charging: ${derived.charging} | Maintenance: ${derived.maint} | Idle: ${derived.idle}
Average Battery: ${derived.avgBatt}%
Partner Vehicle Status: ${actualVehicles.slice(0, 8).map((v: any) => `${v.id}:${v.battery ?? v.soc * 100 | 0}%`).join(", ")}${actualVehicles.length > 8 ? "..." : ""}

**OTTOW DISPATCH PROTOCOL (HIGHEST PRIORITY):**
When a user mentions "OTTOW", "dispatch", "tow", or uses the OTTOW quick action:
1. **IMMEDIATELY** call the dispatch_ottow_tow tool with just the city parameter (use currentCity if available)
2. The tool will return a list of available vehicles with labels A, B, C, D
3. Present the vehicle options in a clear, concise format:
   "Available vehicles in [City]:
   A) [ID] - [Make] [Model] ([distance] mi, [SOC]% battery)
   B) [ID] - [Make] [Model] ([distance] mi, [SOC]% battery)
   ... etc
   
   Which vehicle would you like to dispatch? (Reply A, B, C, or D)"
4. When user responds with a letter (A/B/C/D), **IMMEDIATELY** call dispatch_ottow_tow again with:
   - city: same city
   - vehicleId: the letter they chose (pass the letter as-is: "A", "B", "C", or "D")
   - type: "malfunction" (or appropriate incident type)
   - summary: brief description based on context
5. Confirm the dispatch with incident details from the tool response

**CRITICAL:** Do NOT provide fleet status analysis when OTTOW is mentioned. Go straight to the dispatch flow.

**MANDATORY RESPONSE FORMAT - FOLLOW EXACTLY:**

EVERY response must follow this exact structure:

Fleet Status:
• Start with a concise overview focused on partner SLAs and KPIs
• Use bullet points (•) for all key insights
• Keep lines short and scannable for executive consumption

Critical Findings:
• List urgent issues requiring immediate escalation to partner management
• Use vehicle IDs in **bold** (e.g., **WM-PAC-07**)
• Include specific autonomous system metrics and safety data
• Reference partner-specific SLA compliance (uptime, response times)

Recommendations:
1. First action item with partner impact assessment
2. Second action item with ROI/efficiency implications
3. Third action item with timeline and resource requirements

Performance Metrics:
• Partner-specific KPIs (disengagement rates, safety scores)
• Operational efficiency compared to industry benchmarks
• Cost optimization opportunities and revenue impact

**AUTONOMOUS FLEET EXPERTISE:**
• L4/L5 Autonomous System Operations & Safety Protocols
• Partner SLA Management & Compliance Monitoring
• Disengagement Analysis & Root Cause Investigation
• Revenue Optimization for Robotaxi/Rideshare Operations
• Predictive Maintenance for High-Utilization AV Fleets
• Charging Infrastructure Strategy for 24/7 Operations
• Regulatory Compliance & Safety Reporting
• Cross-Partner Performance Benchmarking
• OTTOW Incident Response & Tow Dispatch Coordination

**PARTNER-SPECIFIC CONSIDERATIONS:**
• Waymo: Focus on safety metrics, disengagement rates, operational reliability
• Zoox: Emphasize bi-directional vehicle capabilities, urban density operations
• Uber/Lyft: Highlight revenue per vehicle, customer satisfaction, surge pricing optimization
• Motional/May: Address mixed-autonomy fleets, gradual rollout strategies

**CRITICAL SUCCESS METRICS:**
• Miles per disengagement (target: >10K miles for L4, >50K for L5)
• Safety incidents per million miles (target: <0.1)
• Fleet uptime (target: >99% during operational hours)
• Revenue per vehicle per day (varies by partner/market)
• Customer satisfaction scores (target: >4.0/5.0)

**OPERATIONAL CONSTRAINTS:**
• Partner SLA requirements are non-negotiable
• Safety certifications must be maintained at all times  
• Regulatory compliance varies by jurisdiction
• Weather and traffic impact autonomous systems differently
• Charging schedules must account for 24/7 operations

For OTTOW dispatch requests, be conversational and guide users through the selection process naturally. For all other queries, provide executive-level insights with quantified business impact, safety implications, and partner-specific recommendations. ALWAYS follow the mandatory response format above.`;

  // Use Claude for all coding and complex analysis queries
  const shouldUseClaude = useClaudeForAnalysis && claudeApiKey;

  // Prepare messages for AI model
  const messages = [
    { role: "system", content: enhancedSystemPrompt },
    ...conversationHistory.slice(-8).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) })),
    { role: "user", content: message },
  ];

  // Enhanced Claude API call with tool support for OTTOW dispatch and fleet analysis
  if (shouldUseClaude) {
    console.log("Using Claude for advanced fleet analysis with tool support");
    try {
      // Convert tools to Claude format
      const claudeTools = [
        {
          name: "dispatch_ottow_tow",
          description: "Dispatch OTTOW tow service for a vehicle. Call without vehicleId first to get available vehicle options (A, B, C, D) in the city, then call again with the selected vehicleId based on user's choice.",
          input_schema: {
            type: "object",
            properties: {
              city: { type: "string", description: "City where the incident occurred (e.g., Nashville, Austin, LA, San Francisco)" },
              vehicleId: { 
                type: "string", 
                description: "Specific vehicle ID to dispatch for (optional on first call, required after user selects A/B/C/D)" 
              },
              type: { 
                type: "string", 
                enum: ["collision", "malfunction", "interior", "vandalism"], 
                description: "Type of incident" 
              },
              summary: { 
                type: "string", 
                description: "Brief incident description" 
              },
            },
            required: ["city"],
          },
        },
        {
          name: "schedule_vehicle_task",
          description: "Schedule maintenance/ops tasks (maintenance, inspection, route_assignment, charging).",
          input_schema: {
            type: "object",
            properties: {
              vehicle_id: { type: "string" },
              task_type: { type: "string", enum: ["maintenance", "inspection", "route_assignment", "charging"] },
              description: { type: "string" },
              scheduled_date: { type: "string", description: "ISO-8601 date/time" },
              priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
            },
            required: ["vehicle_id", "task_type", "description", "scheduled_date"],
          },
        },
        {
          name: "web_search",
          description: "Search the web for real-time information, latest updates, or specific data.",
          input_schema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              focus_area: { type: "string", description: "Optional: fleet_operations, maintenance, safety, regulations" },
            },
            required: ["query"],
          },
        },
      ];

      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${claudeApiKey}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 2000,
          messages: messages.filter(m => m.role !== "system").map(m => ({
            role: m.role,
            content: m.content
          })),
          system: enhancedSystemPrompt,
          tools: claudeTools,
          temperature: 0.3,
        }),
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        console.log("Claude response:", JSON.stringify(claudeData, null, 2));
        
        // Handle tool use
        const content = claudeData.content;
        let finalText = "";
        const toolResults: any[] = [];

        for (const block of content) {
          if (block.type === "text") {
            finalText += block.text;
          } else if (block.type === "tool_use") {
            console.log("Claude wants to use tool:", block.name, "with args:", block.input);
            
            try {
              const result = await executeFunction(
                { name: block.name, arguments: block.input } as any,
                supabase
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result),
              });
            } catch (err) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify({ success: false, error: String(err) }),
                is_error: true,
              });
            }
          }
        }

        // If tools were used, make a follow-up call to Claude
        if (toolResults.length > 0) {
          const followUpResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${claudeApiKey}`,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: claudeModel,
              max_tokens: 2000,
              messages: [
                ...messages.filter(m => m.role !== "system").map(m => ({
                  role: m.role,
                  content: m.content
                })),
                {
                  role: "assistant",
                  content: content,
                },
                {
                  role: "user",
                  content: toolResults,
                },
              ],
              system: enhancedSystemPrompt,
              tools: claudeTools,
              temperature: 0.3,
            }),
          });

          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            const followUpContent = followUpData.content?.find((c: any) => c.type === "text")?.text ?? finalText;
            
            return ok({
              success: true,
              mode: "ops",
              content: followUpContent,
              timestamp: new Date().toISOString(),
            });
          }
        }

        return ok({
          success: true,
          mode: "ops",
          content: finalText || "(no content)",
          timestamp: new Date().toISOString(),
        });
      } else {
        const errorText = await claudeResponse.text();
        console.error("Claude API failed, falling back to OpenAI:", claudeResponse.status, errorText);
      }
    } catch (claudeError) {
      console.error("Claude API error, falling back to OpenAI:", claudeError);
    }
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "dispatch_ottow_tow",
        description: "Dispatch OTTOW tow service for a vehicle. Call without vehicleId first to get available vehicle options in the city, then call again with the selected vehicleId.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            city: { type: "string", description: "City where the incident occurred (e.g., Nashville, Austin, LA, San Francisco)" },
            vehicleId: { type: "string", description: "Specific vehicle ID to dispatch for (optional on first call)" },
            type: { type: "string", enum: ["collision", "malfunction", "interior", "vandalism"], description: "Type of incident" },
            summary: { type: "string", description: "Brief incident description" },
          },
          required: ["city"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "schedule_vehicle_task",
        description: "Schedule maintenance/ops tasks (maintenance, inspection, route_assignment, charging).",
        parameters: {
          type: "object", additionalProperties: false,
          properties: {
            vehicle_id: { type: "string" },
            task_type: { type: "string", enum: ["maintenance", "inspection", "route_assignment", "charging"] },
            description: { type: "string" },
            scheduled_date: { type: "string", description: "ISO-8601 date/time" },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
          },
          required: ["vehicle_id", "task_type", "description", "scheduled_date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_vehicle_status",
        description: "Update vehicle status (active/idle/charging/maintenance/offline).",
        parameters: {
          type: "object", additionalProperties: false,
          properties: {
            vehicle_id: { type: "string" },
            status: { type: "string", enum: ["active", "idle", "charging", "maintenance", "offline"] },
            location: { type: "string" },
            notes: { type: "string" },
          },
          required: ["vehicle_id", "status"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_optimization_plan",
        description: "Create a plan for routes/energy/maintenance/costs.",
        parameters: {
          type: "object", additionalProperties: false,
          properties: { focus_area: { type: "string", enum: ["routes", "energy", "maintenance", "costs"] }, timeframe: { type: "string", enum: ["immediate", "weekly", "monthly"] }, goals: { type: "string" } },
          required: ["focus_area", "timeframe"],
        },
      },
    },
  ] as const;

  // OpenAI API call with enhanced tools and fleet context
  const basePayload = { 
    model, 
    messages: messages.map(m => ({ role: m.role, content: m.content })), 
    tools, 
    tool_choice: "auto" as const, 
    max_tokens: 1500, 
    temperature: 0.2 
  };
  const r1 = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(basePayload),
  });
  if (!r1.ok) {
    const errorText = await r1.text().catch(() => "");
    console.error("OpenAI API Error (ops r1):", r1.status, errorText);
    return fail(502, "OpenAI failed (ops r1)", errorText);
  }
  const r1Data = await r1.json();
  const r1Choice = r1Data.choices?.[0];
  const toolCalls = r1Choice?.message?.tool_calls ?? [];
  const toolMessages: any[] = [];

  if (toolCalls.length) {
    for (const call of toolCalls) {
      const name = call.function?.name;
      let args = {};
      try { args = call.function?.arguments ? JSON.parse(call.function.arguments) : {}; } catch {}
      try {
        // executeFunction signature: ({ name, arguments }, supabaseClient)
        const result = await executeFunction({ name, arguments: args } as any, supabase);
        toolMessages.push(asToolMessage(call.id, result ?? {}));
      } catch (err) {
        toolMessages.push(asToolMessage(call.id, { success: false, error: String(err) }));
      }
    }
    // Round 2 with tool results
    const r2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...basePayload, messages: [...messages, r1Choice.message, ...toolMessages] }),
    });
    if (!r2.ok) {
      const errorText = await r2.text().catch(() => "");
      console.error("OpenAI API Error (ops r2):", r2.status, errorText);
      return ok({
        success: true, 
        mode: "ops", 
        content: r1Choice?.message?.content ?? "(no content)",
        timestamp: new Date().toISOString()
      });
    }
    const r2Data = await r2.json();
    const final = r2Data.choices?.[0]?.message?.content ?? "(no content)";
    const ran = toolCalls.map((t: any) => t.function?.name);
    const action =
      ran.includes("dispatch_ottow_tow") ? "ottow_dispatched"
      : ran.includes("update_vehicle_status") ? "update_status"
      : ran.includes("schedule_vehicle_task") ? "create_service_job"
      : ran.includes("create_optimization_plan") ? "none"
      : "none";
    
    // Check if OTTOW was dispatched successfully
    const ottowResult = toolMessages.find(tm => {
      try {
        const parsed = JSON.parse(tm.content);
        return parsed.action === 'ottow_dispatched' && parsed.success;
      } catch {
        return false;
      }
    });
    
    const actionBlock = ottowResult ? JSON.parse(ottowResult.content) : null;
    
    return ok({
      success: true,
      mode: "ops",
      content: final,
      timestamp: new Date().toISOString(),
      action_block: actionBlock ? {
        action: 'ottow_dispatched',
        details: actionBlock
      } : undefined,
    });
  }

  // No tools required; return r1 content
  return ok({
    success: true,
    mode: "ops",
    content: r1Choice?.message?.content ?? "(no content)",
    timestamp: new Date().toISOString(),
  });
});