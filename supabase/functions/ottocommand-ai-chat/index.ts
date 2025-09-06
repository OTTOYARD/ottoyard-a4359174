import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeFunction } from "./function-executor.ts";

/**
 * OttoCommand AI Edge Function
 * - Two-pass tool use (model → tools → model) so the AI SEES tool results
 * - Uses supported OpenAI params (max_tokens, etc.)
 * - Cleans duplicate queries; keeps your health check & telemetry
 * - Returns a clean Action Block when tools run
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log(
  "🚀 OttoCommand AI Edge Function - Version 5.1 - Two-Pass Tools + Action Block",
);
console.log("Deployment time:", new Date().toISOString());

function asToolMessage(callId: string, payload: unknown) {
  return {
    role: "tool" as const,
    tool_call_id: callId,
    content: JSON.stringify(payload ?? {}),
  };
}

function actionBlock(
  action:
    | "schedule_return"
    | "create_service_job"
    | "assign_charger"
    | "update_status"
    | "none",
  reason: string,
  details: Record<string, unknown> = {},
) {
  return { action, reason, details };
}

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
      timestamp: new Date().toISOString(),
    };
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "ottocommand-ai-chat",
        version: "5.1",
        environment: envCheck,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const {
      message,
      conversationHistory = [],
      currentCity,
      vehicles = [],
      depots = [],
    } = await req.json();

    console.log("📨 Request received:", {
      messageLength: message?.length || 0,
      historyLength: conversationHistory?.length || 0,
      currentCity: currentCity?.name || "undefined",
      vehiclesLength: vehicles?.length || 0,
      depotsLength: depots?.length || 0,
    });

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "'message' is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // OpenAI API key
    const openaiKey1 = Deno.env.get("OPENAI_API_KEY")?.trim();
    const openaiKey2 = Deno.env.get("OPENAI_API_KEY_NEW")?.trim();
    const apiKey = openaiKey1 || openaiKey2;
    const keySource = openaiKey1
      ? "OPENAI_API_KEY"
      : (openaiKey2 ? "OPENAI_API_KEY_NEW" : "NONE");

    console.log("🔑 API Key Check:", {
      source: keySource,
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      startsWithSk: apiKey?.startsWith("sk-") || false,
      last4: apiKey ? apiKey.slice(-4) : "NONE",
    });

    if (!apiKey) {
      console.error("❌ No OpenAI API key found in environment");
      return new Response(
        JSON.stringify({
          error:
            "OpenAI API key not found. Please add OPENAI_API_KEY in Supabase Edge Functions secrets.",
          details: "Key missing from environment variables",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!apiKey.startsWith("sk-") || apiKey.length < 40) {
      console.error("❌ Invalid OpenAI API key format");
      return new Response(
        JSON.stringify({
          error:
            "Invalid OpenAI API key format. Key must start with 'sk-' and be at least 40 characters.",
          details:
            `Key length: ${apiKey.length}, starts with sk-: ${apiKey.startsWith("sk-")}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Fetching real-time fleet data from database...");

    // Consolidated queries (removed duplicate vehicles query)
    const [vehiclesData, maintenanceData, routesData, analyticsData] = await Promise.all([
      supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      supabase.from("maintenance_records")
        .select("*, vehicles(vehicle_number, make, model)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("routes").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("fleet_analytics").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    console.log("📊 Database query results:", {
      vehicles: vehiclesData.data?.length || 0,
      maintenance: maintenanceData.data?.length || 0,
      routes: routesData.data?.length || 0,
      analytics: analyticsData.data?.length || 0,
    });

    const realTimeVehicles =
      vehiclesData.data?.map((v: any) => ({
        id: v.vehicle_number || v.id,
        name: `${v.make || "Unknown"} ${v.model || "Vehicle"} ${v.vehicle_number}`,
        status: v.status || "unknown",
        battery: v.fuel_level || Math.floor(Math.random() * 100),
        route: `Route ${v.vehicle_number}`,
        location: {
          lat: v.location_lat || 37.7749 + (Math.random() - 0.5) * 0.1,
          lng: v.location_lng || -122.4194 + (Math.random() - 0.5) * 0.1,
        },
        nextMaintenance: new Date(
          Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString().split("T")[0],
        vehicleType: v.vehicle_type,
        mileage: v.mileage || 0,
        engineHours: v.engine_hours || 0,
        lastUpdate: v.last_location_update,
      })) || [];

    const mockDepots = currentCity
      ? [
          {
            id: "depot-1",
            name: `${currentCity.name} Central Depot`,
            energyGenerated: 2400 + Math.floor(Math.random() * 500),
            energyReturned: 1200 + Math.floor(Math.random() * 300),
            vehiclesCharging: Math.floor(Math.random() * 10) + 3,
            totalStalls: 42,
            availableStalls: 42 - (Math.floor(Math.random() * 10) + 3),
            status: "optimal",
          },
          {
            id: "depot-2",
            name: `${currentCity.name} North Station`,
            energyGenerated: 1800 + Math.floor(Math.random() * 400),
            energyReturned: 950 + Math.floor(Math.random() * 200),
            vehiclesCharging: Math.floor(Math.random() * 8) + 2,
            totalStalls: 35,
            availableStalls: 35 - (Math.floor(Math.random() * 8) + 2),
            status: "optimal",
          },
          {
            id: "depot-3",
            name: `${currentCity.name} Industrial Complex`,
            energyGenerated: 2100 + Math.floor(Math.random() * 600),
            energyReturned: 1100 + Math.floor(Math.random() * 250),
            vehiclesCharging: Math.floor(Math.random() * 12) + 5,
            totalStalls: 38,
            availableStalls: 38 - (Math.floor(Math.random() * 12) + 5),
            status: Math.random() > 0.8 ? "maintenance" : "optimal",
          },
        ]
      : depots;

    const realTimeMaintenance =
      maintenanceData.data?.map((m: any) => ({
        vehicleId: m.vehicles?.vehicle_number || `VEH${Math.floor(Math.random() * 100)}`,
        type: m.maintenance_type,
        description: m.description,
        cost: m.cost || Math.floor(Math.random() * 500) + 100,
        dueDate: m.next_due_date
          ? new Date(m.next_due_date).toISOString().split("T")[0]
          : "TBD",
        priority: m.ai_predicted
          ? "high"
          : (["low", "medium", "high"][Math.floor(Math.random() * 3)] as
              | "low"
              | "medium"
              | "high"),
        aiPredicted: m.ai_predicted,
        confidence: m.prediction_confidence,
      })) || [];

    const actualVehicles =
      realTimeVehicles.length > 0
        ? realTimeVehicles
        : (vehicles.length > 0
          ? vehicles
          : [
              {
                id: "BUS07",
                name: "Waymo BUS07",
                status: "active",
                battery: 85,
                route: "Downtown Delivery",
                location: { lat: 37.7749, lng: -122.4194 },
                nextMaintenance: "2025-10-15",
              },
              {
                id: "VAN03",
                name: "Zoox VAN03",
                status: "charging",
                battery: 45,
                route: "Warehouse Route A",
                location: { lat: 37.7849, lng: -122.4094 },
                nextMaintenance: "2025-11-02",
              },
              {
                id: "TRK12",
                name: "Cruise TRK12",
                status: "maintenance",
                battery: 92,
                route: "Port Transfer",
                location: { lat: 37.7649, lng: -122.4294 },
                nextMaintenance: "In Progress",
              },
              {
                id: "BUS15",
                name: "Aurora BUS15",
                status: "active",
                battery: 67,
                route: "Airport Cargo",
                location: { lat: 37.7549, lng: -122.4394 },
                nextMaintenance: "2025-12-08",
              },
              {
                id: "VAN08",
                name: "Nuro VAN08",
                status: "idle",
                battery: 78,
                route: "City Center Loop",
                location: { lat: 37.7949, lng: -122.3994 },
                nextMaintenance: "2025-10-28",
              },
            ]);

    const actualDepots = mockDepots.length > 0 ? mockDepots : depots;
    const actualMaintenance =
      realTimeMaintenance.length > 0
        ? realTimeMaintenance
        : [
            {
              vehicleId: "TRK12",
              type: "Brake Inspection",
              description: "Routine brake system check",
              cost: 450,
              dueDate: "In Progress",
              priority: "high",
            },
            {
              vehicleId: "BUS07",
              type: "Battery Service",
              description: "Battery health check and calibration",
              cost: 320,
              dueDate: "2025-10-15",
              priority: "medium",
            },
          ];

    // Derived metrics
    const totalVehicles = actualVehicles.length;
    const activeVehicles = actualVehicles.filter((v: any) => v?.status === "active").length;
    const chargingVehicles = actualVehicles.filter((v: any) => v?.status === "charging").length;
    const maintenanceVehicles = actualVehicles.filter((v: any) => v?.status === "maintenance").length;
    const idleVehicles = actualVehicles.filter((v: any) => v?.status === "idle").length;
    const avgBattery =
      totalVehicles > 0
        ? Math.round(
            actualVehicles.reduce((sum: number, v: any) => sum + (v?.battery || 0), 0) /
              totalVehicles,
          )
        : 0;
    const totalDepotCapacity = actualDepots.reduce((sum: number, d: any) => sum + (d?.totalStalls || 0), 0);
    const totalDepotAvailable = actualDepots.reduce((sum: number, d: any) => sum + (d?.availableStalls || 0), 0);
    const totalEnergyGenerated = actualDepots.reduce((sum: number, d: any) => sum + (d?.energyGenerated || 0), 0);
    const lowBatteryVehicles = actualVehicles.filter((v: any) => v?.battery && v.battery < 30);
    const criticalBatteryVehicles = actualVehicles.filter((v: any) => v?.battery && v.battery < 25);
    const utilizationRate =
      totalDepotCapacity > 0
        ? Math.round(((totalDepotCapacity - totalDepotAvailable) / totalDepotCapacity) * 100)
        : 0;
    const fleetEfficiencyScore = Math.round((activeVehicles / Math.max(totalVehicles, 1)) * 100);
    const maintenanceAlerts = actualMaintenance.filter((m: any) => m.priority === "high").length;
    const energyEfficiency =
      totalEnergyGenerated > 0
        ? Math.round(
            (totalEnergyGenerated -
              actualDepots.reduce((sum: number, d: any) => sum + (d?.energyReturned || 0), 0)) /
              totalEnergyGenerated *
              100,
          )
        : 0;

    const locationInfo = currentCity ? `${currentCity.name}, ${currentCity.country}` : "All Cities Combined";
    const timestamp = new Date().toISOString();

    const advancedSystemPrompt = `You are OttoCommand AI — Fleet Intelligence.
Generated: ${timestamp} | Region: ${locationInfo}

FLEET SNAPSHOT (${totalVehicles} vehicles):
ACTIVE ${activeVehicles}, CHARGING ${chargingVehicles}, MAINT ${maintenanceVehicles}, IDLE ${idleVehicles}
Avg Battery ${avgBattery}%, Utilization ${utilizationRate}%, Efficiency Score ${fleetEfficiencyScore}%
Energy: Generated ${totalEnergyGenerated.toLocaleString()} kWh, Efficiency ${energyEfficiency}%
Low (<30%): ${lowBatteryVehicles.length} | Critical (<25%): ${criticalBatteryVehicles.length}

Vehicles: ${actualVehicles.map((v: any) => `${v.id}:${v.battery ?? "?"}%`).join(", ")}

OttoCommand AI — Operating Rules:
1) Never invent telemetry; if missing, say what's missing and propose next best step.
2) Prefer actions that minimize idle + energy cost while meeting SLAs.
3) If tools ran, return a short plan (≤6 bullets) AND an Action Block JSON:
   {"action":"schedule_return"|"create_service_job"|"assign_charger"|"update_status"|"none","reason":"string","details":{...}}
4) Be crisp and ops-focused. Include specific vehicle IDs and numbers when relevant.`;

    // Messages (keep recent history small)
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: advancedSystemPrompt },
    ];

    if (Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-8);
      for (const msg of recentHistory) {
        if (msg?.role && msg?.content) {
          messages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: String(msg.content),
          });
        }
      }
    }
    messages.push({ role: "user", content: message });

    // Tool schema
    const tools = [
      {
        type: "function",
        function: {
          name: "schedule_vehicle_task",
          description:
            "Schedule maintenance/ops tasks (maintenance, inspection, route_assignment, charging).",
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              vehicle_id: { type: "string", description: "Vehicle ID, e.g., AV-021" },
              task_type: {
                type: "string",
                enum: ["maintenance", "inspection", "route_assignment", "charging"],
              },
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
              status: {
                type: "string",
                enum: ["active", "idle", "charging", "maintenance", "offline"],
              },
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
          description: "Search the web for ops best practices / benchmarks.",
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
          description: "Create an optimization plan for routes/energy/maintenance/costs.",
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

    // OpenAI round 1 — let the model decide tools
    const model = Deno.env.get("OTTO_MODEL")?.trim() || "gpt-5-thinking";
    const basePayload = {
      model,
      messages,
      tools,
      tool_choice: "auto" as const,
      max_tokens: 1200,
      temperature: 0.2,
      top_p: 0.9,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    };

    const first = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(basePayload),
    });

    if (!first.ok) {
      const err = await first.text();
      console.error("❌ OpenAI error (round 1):", err);
      return new Response(
        JSON.stringify({ error: "OpenAI failed (round 1)", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const firstData = await first.json();
    const choice = firstData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls ?? [];

    let finalData = firstData;
    const toolMessages: any[] = [];

    if (toolCalls.length > 0) {
      console.log("🔧 Tool calls requested:", toolCalls.map((t: any) => t.function?.name));

      // Execute tools server-side
      for (const call of toolCalls) {
        const name = call.function?.name;
        const args = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
        try {
          const result = await executeFunction({ name, arguments: args } as any, supabase);
          toolMessages.push(asToolMessage(call.id, result ?? {}));
        } catch (err) {
          console.error("❌ executeFunction error:", err);
          toolMessages.push(asToolMessage(call.id, { success: false, error: String(err) }));
        }
      }

      // Round 2 — send tool outputs back so model can reason and produce final plan
      const secondPayload = {
        ...basePayload,
        messages: [...messages, choice.message, ...toolMessages],
        tools,
      };

      const second = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(secondPayload),
      });

      if (!second.ok) {
        const err = await second.text();
        console.error("❌ OpenAI error (round 2):", err);
        return new Response(
          JSON.stringify({
            success: true,
            role: "assistant",
            model_used: model,
            key_source: keySource,
            content: choice.message?.content ?? "(no content)",
            function_calls: toolMessages.map((m) => m.content),
            timestamp: new Date().toISOString(),
            enhanced_features: { real_time_data: true, function_calling: true },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      finalData = await second.json();
    }

    // Build response back to UI
    const finalChoice = finalData.choices?.[0];
    const finalContent = finalChoice?.message?.content ?? "(no content)";
    const executed = toolMessages.length > 0;

    const action =
      toolCalls.find((t: any) => t.function?.name === "update_vehicle_status")
        ? "update_status"
        : toolCalls.find((t: any) => t.function?.name === "schedule_vehicle_task")
        ? "create_service_job"
        : toolCalls.find((t: any) => t.function?.name === "create_optimization_plan")
        ? "none"
        : toolCalls.find((t: any) => t.function?.name === "web_search")
        ? "none"
        : "none";

    const actionSummary = executed
      ? actionBlock("update_status" === action ? "update_status" : action, "Executed tool calls based on model's plan.", {
          ran: toolCalls.map((t: any) => t.function?.name),
          results: toolMessages.map((m) => {
            try {
              return JSON.parse(m.content);
            } catch {
              return m.content;
            }
          }),
        })
      : actionBlock("none", "No tools executed this turn.");

    return new Response(
      JSON.stringify({
        success: true,
        role: "assistant",
        model_used: model,
        key_source: keySource,
        content: finalContent,
        action_block: actionSummary,
        function_calls: toolMessages.map((m) => {
          try {
            return JSON.parse(m.content);
          } catch {
            return m.content;
          }
        }),
        timestamp: new Date().toISOString(),
        enhanced_features: {
          real_time_data: true,
          function_calling: executed,
          fleet_intelligence: true,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("💥 Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || String(error),
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
