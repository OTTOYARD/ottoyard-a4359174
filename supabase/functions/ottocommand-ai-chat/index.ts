// Deno + Supabase Edge Function (Deno runtime)
// Endpoint: supabase/functions/ottocommand-ai-chat/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeFunction } from "./function-executor.ts";

// ---------- CORS ----------
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
  "Content-Type": "application/json",
};

// ---------- Helpers ----------
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
  return {
    role: "tool" as const,
    tool_call_id: callId,
    content: JSON.stringify(payload ?? {}),
  };
}

function actionBlock(
  action: "schedule_return" | "create_service_job" | "assign_charger" | "update_status" | "none",
  reason: string,
  details: Record<string, unknown> = {},
) {
  return { action, reason, details };
}

console.log("🚀 OttoCommand AI Edge Function v5.2 — two-pass tools, hardened");
console.log("Deployed:", new Date().toISOString());

// ---------- Server ----------
serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Health check
  if (req.method === "GET") {
    const envCheck = {
      hasOpenAI: !!Deno.env.get("OPENAI_API_KEY"),
      hasOpenAINew: !!Deno.env.get("OPENAI_API_KEY_NEW"),
      hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      model: Deno.env.get("OTTO_MODEL") || "gpt-5-2025-08-07",
      now: new Date().toISOString(),
    };
    return ok({ status: "healthy", function: "ottocommand-ai-chat", version: "5.2", environment: envCheck });
  }

  if (req.method !== "POST") return fail(405, "Method not allowed", { method: req.method });

  // ---------- Parse input safely ----------
  let payload: any;
  try {
    payload = await req.json();
  } catch (e) {
    console.error("JSON parse error:", e);
    return fail(400, "Invalid JSON body", String(e));
  }

  const {
    message,
    conversationHistory = [],
    currentCity = null,
    vehicles = [],
    depots = [],
  } = payload ?? {};

  if (!message || typeof message !== "string") {
    return fail(400, "'message' is required and must be a string");
  }

  // ---------- OpenAI key ----------
  const openaiKey1 = Deno.env.get("OPENAI_API_KEY")?.trim();
  const openaiKey2 = Deno.env.get("OPENAI_API_KEY_NEW")?.trim();
  const apiKey = openaiKey1 || openaiKey2;
  const keySource = openaiKey1 ? "OPENAI_API_KEY" : (openaiKey2 ? "OPENAI_API_KEY_NEW" : "NONE");

  console.log("🔑 Key:", { source: keySource, present: !!apiKey });

  if (!apiKey) return fail(500, "Missing OpenAI API key. Set OPENAI_API_KEY in Supabase secrets.");
  if (!(apiKey.startsWith("sk-") && apiKey.length >= 40)) {
    return fail(500, "Invalid OpenAI API key format (must start with 'sk-').");
  }

  // ---------- Supabase ----------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return fail(500, "Missing Supabase env vars", { SUPABASE_URL: !!supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ---------- Fetch data (consolidated, with guards) ----------
  console.log("🔄 DB fetch…");
  const [vehiclesData, maintenanceData, routesData, analyticsData] = await Promise.all([
    supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
    supabase.from("maintenance_records")
      .select("*, vehicles(vehicle_number, make, model)")
      .order("created_at", { ascending: false }).limit(20),
    supabase.from("routes").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("fleet_analytics").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  console.log("📊 Counts:", {
    vehicles: vehiclesData.data?.length || 0,
    maintenance: maintenanceData.data?.length || 0,
    routes: routesData.data?.length || 0,
    analytics: analyticsData.data?.length || 0,
  });

  const DEMO = Deno.env.get("DEMO_MODE") === "1";

  const realTimeVehicles =
    (vehiclesData.data || []).map((v: any) => ({
      id: v.vehicle_number || v.id || `VEH${Math.floor(Math.random() * 1000)}`,
      name: `${v.make || "Vehicle"} ${v.model || ""} ${v.vehicle_number || ""}`.trim(),
      status: v.status || "unknown",
      battery: typeof v.fuel_level === "number" ? v.fuel_level : (DEMO ? Math.floor(Math.random() * 100) : 0),
      route: `Route ${v.vehicle_number || "N/A"}`,
      location: {
        lat: typeof v.location_lat === "number" ? v.location_lat : (DEMO ? 37.7749 + (Math.random() - 0.5) * 0.1 : 0),
        lng: typeof v.location_lng === "number" ? v.location_lng : (DEMO ? -122.4194 + (Math.random() - 0.5) * 0.1 : 0),
      },
      nextMaintenance: v.next_maintenance_date
        ? new Date(v.next_maintenance_date).toISOString().slice(0, 10)
        : (DEMO ? new Date(Date.now() + Math.random() * 30 * 864e5).toISOString().slice(0, 10) : "TBD"),
      vehicleType: v.vehicle_type,
      mileage: v.mileage || 0,
      engineHours: v.engine_hours || 0,
      lastUpdate: v.last_location_update || null,
    }));

  const fallbackVehicles = [
    { id: "BUS07", name: "Waymo BUS07", status: "active", battery: 85, route: "Downtown Delivery", location: { lat: 37.7749, lng: -122.4194 }, nextMaintenance: "2025-10-15" },
    { id: "VAN03", name: "Zoox VAN03", status: "charging", battery: 45, route: "Warehouse Route A", location: { lat: 37.7849, lng: -122.4094 }, nextMaintenance: "2025-11-02" },
    { id: "TRK12", name: "Cruise TRK12", status: "maintenance", battery: 92, route: "Port Transfer", location: { lat: 37.7649, lng: -122.4294 }, nextMaintenance: "In Progress" },
    { id: "BUS15", name: "Aurora BUS15", status: "active", battery: 67, route: "Airport Cargo", location: { lat: 37.7549, lng: -122.4394 }, nextMaintenance: "2025-12-08" },
    { id: "VAN08", name: "Nuro VAN08", status: "idle", battery: 78, route: "City Center Loop", location: { lat: 37.7949, lng: -122.3994 }, nextMaintenance: "2025-10-28" },
  ];

  const actualVehicles = realTimeVehicles.length ? realTimeVehicles : (vehicles.length ? vehicles : fallbackVehicles);

  const mockDepots = currentCity ? [
    { id: "depot-1", name: `${currentCity.name} Central Depot`, energyGenerated: 2400, energyReturned: 1200, vehiclesCharging: 5, totalStalls: 42, availableStalls: 37, status: "optimal" },
    { id: "depot-2", name: `${currentCity.name} North Station`, energyGenerated: 1800, energyReturned: 950, vehiclesCharging: 3, totalStalls: 35, availableStalls: 30, status: "optimal" },
    { id: "depot-3", name: `${currentCity.name} Industrial Complex`, energyGenerated: 2100, energyReturned: 1100, vehiclesCharging: 7, totalStalls: 38, availableStalls: 29, status: "optimal" },
  ] : [];

  const actualDepots = (Array.isArray(depots) && depots.length) ? depots : mockDepots;

  const realTimeMaintenance =
    (maintenanceData.data || []).map((m: any) => ({
      vehicleId: m.vehicles?.vehicle_number || `VEH${Math.floor(Math.random() * 100)}`,
      type: m.maintenance_type || "General",
      description: m.description || "",
      cost: typeof m.cost === "number" ? m.cost : (DEMO ? Math.floor(Math.random() * 500) + 100 : 0),
      dueDate: m.next_due_date ? new Date(m.next_due_date).toISOString().slice(0, 10) : "TBD",
      priority: m.ai_predicted ? "high" : (["low", "medium", "high"][(Math.random() * 3) | 0] as "low" | "medium" | "high"),
      aiPredicted: !!m.ai_predicted,
      confidence: m.prediction_confidence ?? null,
    }));

  const actualMaintenance = realTimeMaintenance.length
    ? realTimeMaintenance
    : [
        { vehicleId: "TRK12", type: "Brake Inspection", description: "Routine check", cost: 450, dueDate: "In Progress", priority: "high" as const },
        { vehicleId: "BUS07", type: "Battery Service", description: "Calibration", cost: 320, dueDate: "2025-10-15", priority: "medium" as const },
      ];

  // ---------- Derived metrics ----------
  const totalVehicles = actualVehicles.length;
  const activeVehicles = actualVehicles.filter((v: any) => v.status === "active").length;
  const chargingVehicles = actualVehicles.filter((v: any) => v.status === "charging").length;
  const maintenanceVehicles = actualVehicles.filter((v: any) => v.status === "maintenance").length;
  const idleVehicles = actualVehicles.filter((v: any) => v.status === "idle").length;

  const avgBattery = totalVehicles
    ? Math.round(actualVehicles.reduce((s: number, v: any) => s + (Number(v.battery) || 0), 0) / totalVehicles)
    : 0;

  const totalDepotCapacity = actualDepots.reduce((s: number, d: any) => s + (Number(d.totalStalls) || 0), 0);
  const totalDepotAvailable = actualDepots.reduce((s: number, d: any) => s + (Number(d.availableStalls) || 0), 0);
  const totalEnergyGenerated = actualDepots.reduce((s: number, d: any) => s + (Number(d.energyGenerated) || 0), 0);
  const totalEnergyReturned = actualDepots.reduce((s: number, d: any) => s + (Number(d.energyReturned) || 0), 0);

  const lowBatteryVehicles = actualVehicles.filter((v: any) => Number(v.battery) < 30);
  const criticalBatteryVehicles = actualVehicles.filter((v: any) => Number(v.battery) < 25);

  const utilizationRate = totalDepotCapacity
    ? Math.round(((totalDepotCapacity - totalDepotAvailable) / totalDepotCapacity) * 100)
    : 0;

  const fleetEfficiencyScore = Math.round((activeVehicles / Math.max(totalVehicles, 1)) * 100);
  const maintenanceAlerts = actualMaintenance.filter((m) => m.priority === "high").length;

  const energyEfficiency = totalEnergyGenerated
    ? Math.round(((totalEnergyGenerated - totalEnergyReturned) / totalEnergyGenerated) * 100)
    : 0;

  const locationInfo = currentCity ? `${currentCity.name}${currentCity.country ? ", " + currentCity.country : ""}` : "All Regions";
  const timestamp = new Date().toISOString();

  // ---------- System prompt (tight) ----------
  const systemPrompt = `You are OttoCommand AI — Fleet Intelligence.
Generated: ${timestamp} | Region: ${locationInfo}

FLEET (${totalVehicles}): ACTIVE ${activeVehicles}, CHARGING ${chargingVehicles}, MAINT ${maintenanceVehicles}, IDLE ${idleVehicles}
Avg Battery ${avgBattery}%, Util ${utilizationRate}%, EffScore ${fleetEfficiencyScore}%
Energy: Gen ${totalEnergyGenerated} kWh / Return ${totalEnergyReturned} kWh, Efficiency ${energyEfficiency}%
Low(<30%): ${lowBatteryVehicles.length}, Critical(<25%): ${criticalBatteryVehicles.length}

Vehicles: ${actualVehicles.map((v: any) => `${v.id}:${v.battery ?? "?"}%`).join(", ")}

Rules:
1) Do not invent telemetry; state what's missing and propose next step.
2) Optimize for low idle + energy cost while meeting SLAs.
3) If tools run, return ≤6 bullets + an Action Block JSON:
{"action":"schedule_return"|"create_service_job"|"assign_charger"|"update_status"|"none","reason":"string","details":{...}}
4) Be crisp and ops-focused with specific IDs.`;

  // ---------- Build messages ----------
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (Array.isArray(conversationHistory)) {
    for (const m of conversationHistory.slice(-8)) {
      if (!m?.role || !m?.content) continue;
      messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) });
    }
  }
  messages.push({ role: "user", content: message });

  // ---------- Tools schema ----------
  const tools = [
    {
      type: "function",
      function: {
        name: "schedule_vehicle_task",
        description: "Schedule maintenance/ops tasks (maintenance, inspection, route_assignment, charging).",
        parameters: {
          type: "object",
          additionalProperties: false,
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
        description: "Update vehicle operational status and optional notes/location.",
        parameters: {
          type: "object",
          additionalProperties: false,
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
        name: "web_search",
        description: "Search web for ops benchmarks (placeholder tool).",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_optimization_plan",
        description: "Create a plan for routes/energy/maintenance/costs.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            focus_area: { type: "string", enum: ["routes", "energy", "maintenance", "costs"] },
            timeframe: { type: "string", enum: ["immediate", "weekly", "monthly"] },
            goals: { type: "string" },
          },
          required: ["focus_area", "timeframe"],
        },
      },
    },
  ] as const;

  // ---------- OpenAI: two-pass tool loop ----------
  const model = Deno.env.get("OTTO_MODEL")?.trim() || "gpt-5-2025-08-07";
  
  // Helper to check if model is new-gen (GPT-5, O3, O4)
  function isNewGenModel(modelName: string): boolean {
    return modelName.startsWith("gpt-5") || modelName.startsWith("o3") || modelName.startsWith("o4");
  }
  
  // Build model-aware payload
  const basePayload: any = {
    model,
    messages,
    tools,
    tool_choice: "auto" as const,
  };
  
  if (isNewGenModel(model)) {
    // New-gen models: use max_completion_tokens, no temperature/top_p/penalties
    basePayload.max_completion_tokens = 1200;
    console.log(`🤖 Using new-gen model: ${model} with max_completion_tokens`);
  } else {
    // Legacy models: use max_tokens, allow temperature/top_p
    basePayload.max_tokens = 1200;
    basePayload.temperature = 0.2;
    basePayload.top_p = 0.9;
    console.log(`🤖 Using legacy model: ${model} with max_tokens and temperature`);
  }

  // Round 1
  console.log(`🚀 R1 payload keys: [${Object.keys(basePayload).join(", ")}]`);
  const r1 = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(basePayload),
  });

  if (!r1.ok) {
    const text = await r1.text().catch(() => "");
    console.error(`OpenAI R1 error (${model}):`, text);
    return fail(502, "OpenAI failed (round 1)", { model, error: text });
  }

  const r1Data = await r1.json();
  const r1Choice = r1Data.choices?.[0];
  const toolCalls = r1Choice?.message?.tool_calls ?? [];

  let finalData = r1Data;
  const toolMessages: any[] = [];

  if (toolCalls.length) {
    console.log("🔧 Tool calls:", toolCalls.map((t: any) => t.function?.name));

    for (const call of toolCalls) {
      const name = call.function?.name;
      const argsRaw = call.function?.arguments || "{}";
      let args: any = {};
      try { args = JSON.parse(argsRaw); } catch {}
      try {
        const result = await executeFunction({ name, arguments: args } as any, supabase);
        toolMessages.push(asToolMessage(call.id, result ?? {}));
      } catch (err) {
        console.error("executeFunction error:", err);
        toolMessages.push(asToolMessage(call.id, { success: false, error: String(err) }));
      }
    }

    // Round 2 (send tool outputs back)
    const r2Payload = { ...basePayload, messages: [...messages, r1Choice.message, ...toolMessages] };
    console.log(`🚀 R2 payload keys: [${Object.keys(r2Payload).join(", ")}]`);
    const r2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(r2Payload),
    });

    if (!r2.ok) {
      const text = await r2.text().catch(() => "");
      console.error(`OpenAI R2 error (${model}):`, text);
      // Return R1 content + tool results if R2 fails
      return ok({
        success: true,
        role: "assistant",
        model_used: model,
        key_source: keySource,
        content: r1Choice?.message?.content ?? "(no content)",
        function_calls: toolMessages.map((m) => m.content),
        timestamp: new Date().toISOString(),
        enhanced_features: { real_time_data: true, function_calling: true },
      });
    }

    finalData = await r2.json();
  }

  // ---------- Build final response ----------
  const finalChoice = finalData.choices?.[0];
  const finalContent = finalChoice?.message?.content ?? "(no content)";
  const executed = toolMessages.length > 0;

  const ran = toolCalls.map((t: any) => t.function?.name);
  const action =
    ran.includes("update_vehicle_status") ? "update_status"
      : ran.includes("schedule_vehicle_task") ? "create_service_job"
      : ran.includes("create_optimization_plan") ? "none"
      : ran.includes("web_search") ? "none"
      : "none";

  const actionSummary = executed
    ? actionBlock(action as any, "Executed tool calls based on model plan.", {
        ran,
        results: toolMessages.map((m) => { try { return JSON.parse(m.content); } catch { return m.content; } }),
      })
    : actionBlock("none", "No tools executed this turn.");

  return ok({
    success: true,
    role: "assistant",
    model_used: model,
    key_source: keySource,
    content: finalContent,
    action_block: actionSummary,
    function_calls: toolMessages.map((m) => { try { return JSON.parse(m.content); } catch { return m.content; } }),
    timestamp: new Date().toISOString(),
    enhanced_features: {
      real_time_data: true,
      function_calling: executed,
      fleet_intelligence: true,
    },
  });
});