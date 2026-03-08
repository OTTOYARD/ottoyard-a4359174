import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScannerConfig {
  weather_enabled: boolean;
  weather_interval_minutes: number;
  weather_last_scan_at: string | null;
  traffic_enabled: boolean;
  traffic_interval_minutes: number;
  traffic_last_scan_at: string | null;
  news_enabled: boolean;
  news_interval_minutes: number;
  news_last_scan_at: string | null;
  emergency_enabled: boolean;
  emergency_interval_minutes: number;
  emergency_last_scan_at: string | null;
  cities: string[];
  auto_expire_hours: number;
}

function isDue(lastScan: string | null, intervalMinutes: number): boolean {
  if (!lastScan) return true;
  const elapsed = Date.now() - new Date(lastScan).getTime();
  return elapsed >= intervalMinutes * 60 * 1000;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Read scanner config
  const { data: configRow, error: configErr } = await supabase
    .from("scanner_config")
    .select("*")
    .eq("id", "default")
    .single();

  if (configErr || !configRow) {
    return new Response(JSON.stringify({ error: "Failed to read scanner_config", details: configErr }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const config = configRow as ScannerConfig;
  const scanned: string[] = [];
  const skipped: string[] = [];
  const invocations: Array<{ source: string; promise: Promise<{ data: unknown; error: unknown }> }> = [];

  // 2. Determine which sources are due
  const sources = [
    { name: "weather", enabled: config.weather_enabled, interval: config.weather_interval_minutes, lastScan: config.weather_last_scan_at, fn: "intelligence-weather" },
    { name: "traffic", enabled: config.traffic_enabled, interval: config.traffic_interval_minutes, lastScan: config.traffic_last_scan_at, fn: "intelligence-traffic" },
    { name: "news", enabled: config.news_enabled, interval: config.news_interval_minutes, lastScan: config.news_last_scan_at, fn: "intelligence-news" },
  ];

  for (const src of sources) {
    if (!src.enabled) {
      skipped.push(`${src.name} (disabled)`);
      continue;
    }
    if (!isDue(src.lastScan, src.interval)) {
      skipped.push(`${src.name} (not due)`);
      continue;
    }
    scanned.push(src.name);
    invocations.push({
      source: src.name,
      promise: supabase.functions.invoke(src.fn, {
        body: { cities: config.cities },
      }),
    });
  }

  // 3. Run scans in parallel
  const settledResults = await Promise.allSettled(invocations.map((inv) => inv.promise));

  const results = settledResults.map((result, i) => ({
    source: invocations[i].source,
    status: result.status,
    data: result.status === "fulfilled" ? result.value.data : null,
    error: result.status === "rejected" ? String(result.reason) : result.status === "fulfilled" && result.value.error ? String(result.value.error) : null,
  }));

  // 4. Expire old events
  const now = new Date().toISOString();

  // Expire events past their expires_at
  const { count: expiredByTime } = await supabase
    .from("intelligence_events")
    .update({ is_active: false, updated_at: now })
    .eq("is_active", true)
    .lt("expires_at", now)
    .select("id", { count: "exact", head: true });

  // Expire events without expires_at that are older than auto_expire_hours
  const expireCutoff = new Date(Date.now() - config.auto_expire_hours * 60 * 60 * 1000).toISOString();
  const { count: expiredByAge } = await supabase
    .from("intelligence_events")
    .update({ is_active: false, updated_at: now })
    .eq("is_active", true)
    .is("expires_at", null)
    .lt("created_at", expireCutoff)
    .select("id", { count: "exact", head: true });

  const digest = {
    scanned,
    skipped,
    results,
    expired: {
      by_expiry: expiredByTime ?? 0,
      by_age: expiredByAge ?? 0,
      age_threshold_hours: config.auto_expire_hours,
    },
    timestamp: now,
  };

  return new Response(JSON.stringify(digest), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
