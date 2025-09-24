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

  const model = Deno.env.get("OTTO_MODEL")?.trim() || "gpt-4o-mini";
  const DEMO = Deno.env.get("DEMO_MODE") === "1";

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
  const systemPrompt = `You are OttoCommand AI — Fleet Intelligence.\nRegion: ${locationInfo}\nFLEET(${derived.total}): ACTIVE ${derived.active}, CHARGING ${derived.charging}, MAINT ${derived.maint}, IDLE ${derived.idle} | AvgBatt ${derived.avgBatt}%\nVehicles: ${actualVehicles.map((v: any) => v.id + ":" + (v.battery ?? "?") + "%").join(", ")}\nRules:\n1) Do not invent telemetry; state what's missing and propose next step.\n2) Optimize for low idle + energy cost while meeting SLAs.\n3) If tools run, return ≤6 bullets + Action Block JSON {action,reason,details}.\n4) Be crisp and ops-focused with specific IDs.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-8).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) })),
    { role: "user", content: message },
  ];

  const tools = [
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

  // Round 1 (tools if needed)
  const basePayload = { model, messages, tools, tool_choice: "auto" as const, max_tokens: 1200, temperature: 0.2 };
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
        success: true, mode: "ops", content: r1Choice?.message?.content ?? "(no content)",
        function_calls: toolMessages.map((m) => m.content), timestamp: new Date().toISOString()
      });
    }
    const r2Data = await r2.json();
    const final = r2Data.choices?.[0]?.message?.content ?? "(no content)";
    const ran = toolCalls.map((t: any) => t.function?.name);
    const action =
      ran.includes("update_vehicle_status") ? "update_status"
      : ran.includes("schedule_vehicle_task") ? "create_service_job"
      : ran.includes("create_optimization_plan") ? "none"
      : "none";
    return ok({
      success: true,
      mode: "ops",
      content: final,
      action_block: actionBlock(action as any, "Executed tool calls based on plan.", {
        ran,
        results: toolMessages.map((m) => { try { return JSON.parse(m.content); } catch { return m.content; } }),
      }),
      function_calls: toolMessages.map((m) => { try { return JSON.parse(m.content); } catch { return m.content; } }),
      timestamp: new Date().toISOString(),
    });
  }

  // No tools required; return r1 content
  return ok({
    success: true,
    mode: "ops",
    content: r1Choice?.message?.content ?? "(no content)",
    action_block: actionBlock("none", "No tools executed this turn."),
    timestamp: new Date().toISOString(),
  });
});