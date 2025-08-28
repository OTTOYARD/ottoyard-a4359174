import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// OttoCommand AI — clean rebuild
// - Uses OPENAI_API_KEY (fallback: OPENAI_API_KEY_NEW)
// - Simple chat: { message: string, conversationHistory?: { role, content }[] }
// - GPT-5 (Responses API) with GPT-4.1 fallback
// - CORS, healthcheck, and robust logging (no secret exposure)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getOpenAIKey() {
  const k1 = (Deno.env.get("OPENAI_API_KEY") || "").trim();
  const k2 = (Deno.env.get("OPENAI_API_KEY_NEW") || "").trim();
  const key = k1 || k2;
  const source = k1 ? "OPENAI_API_KEY" : (k2 ? "OPENAI_API_KEY_NEW" : "NONE");
  const last4 = key ? key.slice(-4) : "NONE";
  console.log(`OpenAI key source: ${source}; present: ${!!key}; last4: ${last4 !== "NONE" ? last4 : "NONE"}`);
  return { key, source };
}

function buildMessages(systemPrompt: string, userMessage: string, history: any[] = []) {
  const cleanedHistory = Array.isArray(history)
    ? history
        .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
        .map((m) => ({ role: m.role, content: m.content }))
    : [];
  return [
    { role: "system", content: systemPrompt },
    ...cleanedHistory,
    { role: "user", content: userMessage },
  ];
}

async function callGpt5Responses(apiKey: string, messages: any[]) {
  // GPT-5 via Responses API (uses max_completion_tokens, no temperature)
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-2025-08-07",
      input: messages,
      max_completion_tokens: 700,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("GPT-5 Responses API error:", data);
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }

  const text =
    (data && (data.output_text || data.text)) ||
    (data?.choices?.[0]?.message?.content) ||
    (Array.isArray(data?.output) &&
      data.output
        .flatMap((o: any) => o?.content || [])
        .map((c: any) => (typeof c?.text === "string" ? c.text : c?.content || ""))
        .join("\n")) ||
    "";

  return { text, model: "gpt-5-2025-08-07" };
}

async function callGpt41Chat(apiKey: string, messages: any[]) {
  // Reliable fallback using Chat Completions
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-2025-04-14",
      messages,
      max_tokens: 700,
      temperature: 0.7,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("GPT-4.1 Chat API error:", data);
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }

  const text = data?.choices?.[0]?.message?.content || "";
  return { text, model: "gpt-4.1-2025-04-14" };
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Simple healthcheck
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, function: "ottocommand-ai-chat", version: 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "'message' is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { key, source } = getOpenAIKey();
    if (!key) {
      console.error("OpenAI API key missing in Edge Function secrets.");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key missing. Add OPENAI_API_KEY in Supabase Edge Functions secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      "You are OttoCommand AI, a concise, expert fleet assistant. Answer clearly and helpfully.";
    const messages = buildMessages(systemPrompt, message, conversationHistory);

    let result;
    try {
      result = await callGpt5Responses(key, messages);
    } catch (e) {
      console.warn("Falling back to GPT-4.1 due to GPT-5 error.", e?.message || e);
      result = await callGpt41Chat(key, messages);
    }

    const payload = {
      content: result.text,
      role: "assistant",
      model_used: result.model,
      key_source: source,
      // Keep response shape flexible for existing clients
      reply: result.text,
      message: result.text,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Unhandled error in ottocommand-ai-chat:", error?.message || error);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
