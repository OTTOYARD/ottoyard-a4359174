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

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `gdelt-${Math.abs(hash).toString(36)}`;
}

function classifyEventType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("fire") || t.includes("wildfire") || t.includes("arson")) return "fire";
  if (t.includes("hazmat") || t.includes("gas leak") || t.includes("chemical")) return "hazmat";
  if (t.includes("road closure") || t.includes("road closed")) return "road_closure";
  if (t.includes("flood")) return "severe_weather";
  if (t.includes("evacuation") || t.includes("emergency")) return "emergency";
  if (t.includes("construction")) return "construction";
  if (t.includes("accident") || t.includes("crash") || t.includes("collision")) return "traffic_incident";
  return "news";
}

function classifySeverity(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("evacuation") || t.includes("explosion") || t.includes("mass")) return "high";
  if (t.includes("fire") || t.includes("flood") || t.includes("hazmat") || t.includes("blackout") || t.includes("power outage")) return "medium";
  return "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: { cities?: string[] } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const cities = body.cities ?? Object.keys(CITY_COORDS);

  const results: Array<{ city: string; articles: number; source: string; error?: string }> = [];

  // GDELT scan
  for (const city of cities) {
    const coords = CITY_COORDS[city];
    if (!coords) { results.push({ city, articles: 0, source: "gdelt", error: "unknown city" }); continue; }

    try {
      const query = encodeURIComponent(`${city} (accident OR fire OR emergency OR evacuation OR road closure OR gas leak OR flooding OR power outage)`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=10&timespan=4h`;

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        results.push({ city, articles: 0, source: "gdelt", error: `GDELT ${res.status}: ${errText.slice(0, 200)}` });
        continue;
      }

      const data = await res.json();
      const articles = data.articles ?? [];
      let upserted = 0;

      for (const article of articles) {
        const articleUrl = article.url ?? "";
        const title = article.title ?? "News article";
        const sourceId = hashString(articleUrl || title);
        const eventType = classifyEventType(title);
        const severity = classifySeverity(title);

        const row = {
          source: "gdelt_news",
          source_id: sourceId,
          event_type: eventType,
          severity,
          title: title.slice(0, 500),
          description: (article.seendate ? `Published: ${article.seendate}. ` : "") + (article.domain ? `Source: ${article.domain}` : ""),
          location_lat: coords.lat,
          location_lng: coords.lng,
          radius_miles: 5,
          city,
          raw_data: { url: articleUrl, domain: article.domain, seendate: article.seendate, language: article.language },
          is_active: true,
          threat_score: Math.min(100, severity === "high" ? 55 : severity === "medium" ? 35 : 15),
          auto_recommendations: severity === "high" ? ["avoidZoneRouting"] : [],
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("intelligence_events")
          .upsert(row, { onConflict: "source,source_id" });

        if (!error) upserted++;
      }

      results.push({ city, articles: upserted, source: "gdelt" });
    } catch (e) {
      results.push({ city, articles: 0, source: "gdelt", error: String(e) });
    }
  }

  // Optional NewsAPI supplement
  const newsApiKey = Deno.env.get("NEWSAPI_KEY");
  if (newsApiKey) {
    for (const city of cities) {
      const coords = CITY_COORDS[city];
      if (!coords) continue;

      try {
        const query = encodeURIComponent(`${city} emergency OR accident OR fire OR road closure`);
        const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&apiKey=${newsApiKey}`;
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          let upserted = 0;

          for (const article of data.articles ?? []) {
            const title = article.title ?? "News";
            const sourceId = hashString(article.url ?? title);

            const row = {
              source: "newsapi" as const,
              source_id: sourceId,
              event_type: classifyEventType(title),
              severity: classifySeverity(title),
              title: title.slice(0, 500),
              description: (article.description ?? "").slice(0, 2000),
              location_lat: coords.lat,
              location_lng: coords.lng,
              radius_miles: 5,
              city,
              raw_data: { url: article.url, source: article.source?.name, publishedAt: article.publishedAt },
              is_active: true,
              threat_score: Math.min(100, classifySeverity(title) === "high" ? 50 : 20),
              auto_recommendations: [],
              updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
              .from("intelligence_events")
              .upsert(row, { onConflict: "source,source_id" });

            if (!error) upserted++;
          }
          results.push({ city, articles: upserted, source: "newsapi" });
        } else {
          await res.text();
        }
      } catch { /* newsapi is optional */ }
    }
  }

  // Update scanner_config
  const hasError = results.some((r) => r.error);
  await supabase.from("scanner_config").update({
    news_last_scan_at: new Date().toISOString(),
    news_last_status: hasError ? "error" : "success",
    news_last_error: hasError ? results.find((r) => r.error)?.error?.slice(0, 500) : null,
  }).eq("id", "default");

  return new Response(JSON.stringify({ source: "news", results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
