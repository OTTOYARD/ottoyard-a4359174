import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Nashville: { lat: 36.1627, lng: -86.7816 },
  Austin: { lat: 30.2672, lng: -97.7431 },
  LA: { lat: 34.0522, lng: -118.2437 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
};

function mapNwsSeverity(s: string): string {
  switch (s) {
    case "Extreme": return "critical";
    case "Severe": return "high";
    case "Moderate": return "medium";
    case "Minor": return "low";
    default: return "info";
  }
}

function estimateRadius(eventTitle: string): number {
  const t = eventTitle.toLowerCase();
  if (t.includes("tornado")) return 2;
  if (t.includes("flash flood")) return 3;
  if (t.includes("thunderstorm")) return 5;
  if (t.includes("winter storm") || t.includes("blizzard")) return 10;
  if (t.includes("heat")) return 15;
  if (t.includes("wind")) return 5;
  return 3;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: { cities?: string[] } = {};
  try { body = await req.json(); } catch { /* use defaults */ }
  const cities = body.cities ?? Object.keys(CITY_COORDS);

  const results: Array<{ city: string; alerts: number; error?: string }> = [];

  for (const city of cities) {
    const coords = CITY_COORDS[city];
    if (!coords) { results.push({ city, alerts: 0, error: "unknown city" }); continue; }

    try {
      const url = `https://api.weather.gov/alerts/active?point=${coords.lat},${coords.lng}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "(OTTOYARD Fleet Management, contact@ottoyard.com)",
          Accept: "application/geo+json",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        results.push({ city, alerts: 0, error: `NWS ${res.status}: ${errText.slice(0, 200)}` });
        continue;
      }

      const data = await res.json();
      const features = data.features ?? [];
      let upserted = 0;

      for (const feature of features) {
        const props = feature.properties ?? {};
        const eventTitle = props.event ?? "Unknown Weather Alert";
        const severity = mapNwsSeverity(props.severity ?? "Unknown");

        const row = {
          source: "nws_weather",
          source_id: props.id ?? `nws-${Date.now()}-${Math.random()}`,
          event_type: "severe_weather",
          severity,
          title: eventTitle,
          description: (props.description ?? "").slice(0, 2000),
          location_lat: coords.lat,
          location_lng: coords.lng,
          radius_miles: estimateRadius(eventTitle),
          geojson: feature.geometry ?? null,
          city,
          raw_data: props,
          starts_at: props.onset ?? null,
          expires_at: props.expires ?? null,
          is_active: true,
          threat_score: Math.min(100, severity === "critical" ? 90 : severity === "high" ? 70 : severity === "medium" ? 45 : severity === "low" ? 20 : 10),
          auto_recommendations: severity === "critical" || severity === "high"
            ? ["pauseDispatches", "avoidZoneRouting"]
            : [],
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("intelligence_events")
          .upsert(row, { onConflict: "source,source_id" });

        if (!error) upserted++;
      }

      results.push({ city, alerts: upserted });
    } catch (e) {
      results.push({ city, alerts: 0, error: String(e) });
    }
  }

  // Update scanner_config
  const hasError = results.some((r) => r.error);
  await supabase
    .from("scanner_config")
    .update({
      weather_last_scan_at: new Date().toISOString(),
      weather_last_status: hasError ? "error" : "success",
      weather_last_error: hasError ? results.find((r) => r.error)?.error?.slice(0, 500) : null,
    })
    .eq("id", "default");

  return new Response(JSON.stringify({ source: "nws_weather", results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
