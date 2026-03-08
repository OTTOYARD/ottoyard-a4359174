import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Bounding boxes: [west, south, east, north]
const CITY_BBOX: Record<string, { bbox: [number, number, number, number]; lat: number; lng: number }> = {
  Nashville: { bbox: [-87.0, 36.05, -86.55, 36.30], lat: 36.1627, lng: -86.7816 },
  Austin: { bbox: [-97.90, 30.15, -97.55, 30.45], lat: 30.2672, lng: -97.7431 },
  LA: { bbox: [-118.50, 33.85, -118.05, 34.20], lat: 34.0522, lng: -118.2437 },
  "San Francisco": { bbox: [-122.55, 37.65, -122.30, 37.85], lat: 37.7749, lng: -122.4194 },
};

function mapCategory(cat: number): string {
  if (cat === 7 || cat === 8) return "road_closure";
  if (cat === 9) return "construction";
  return "traffic_incident";
}

function mapMagnitude(mag: number): string {
  if (mag >= 3) return "high";
  if (mag >= 2) return "medium";
  return "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("TOMTOM_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!apiKey) {
    await supabase.from("scanner_config").update({
      traffic_last_scan_at: new Date().toISOString(),
      traffic_last_status: "disabled",
      traffic_last_error: "TOMTOM_API_KEY not set",
    }).eq("id", "default");

    return new Response(JSON.stringify({ source: "tomtom_traffic", status: "disabled", reason: "no API key" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { cities?: string[] } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const cities = body.cities ?? Object.keys(CITY_BBOX);

  const results: Array<{ city: string; incidents: number; error?: string }> = [];

  for (const city of cities) {
    const info = CITY_BBOX[city];
    if (!info) { results.push({ city, incidents: 0, error: "unknown city" }); continue; }

    try {
      const [west, south, east, north] = info.bbox;
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${west},${south},${east},${north}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},from,to,length,delay}}}&language=en-US&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14`;

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        results.push({ city, incidents: 0, error: `TomTom ${res.status}: ${errText.slice(0, 200)}` });
        continue;
      }

      const data = await res.json();
      const incidents = data.incidents ?? [];
      let upserted = 0;

      for (const inc of incidents) {
        const props = inc.properties ?? {};
        const magnitude = props.magnitudeOfDelay ?? 0;
        if (magnitude < 2) continue; // skip minor

        const category = props.iconCategory ?? 0;
        const eventType = mapCategory(category);
        const severity = mapMagnitude(magnitude);
        const description = (props.events ?? []).map((e: { description?: string }) => e.description).filter(Boolean).join("; ");
        const title = props.from ? `${eventType === "road_closure" ? "Road Closure" : eventType === "construction" ? "Construction" : "Traffic Incident"}: ${props.from}${props.to ? ` → ${props.to}` : ""}` : `Traffic incident in ${city}`;

        // Extract coordinates from geometry
        let lat = info.lat;
        let lng = info.lng;
        if (inc.geometry?.coordinates?.length) {
          const coords = inc.geometry.coordinates;
          if (Array.isArray(coords[0])) {
            lng = coords[0][0]; lat = coords[0][1];
          } else {
            lng = coords[0]; lat = coords[1];
          }
        }

        const row = {
          source: "tomtom_traffic",
          source_id: props.id ?? `tt-${Date.now()}-${Math.random()}`,
          event_type: eventType,
          severity,
          title: title.slice(0, 500),
          description: description.slice(0, 2000) || null,
          location_lat: lat,
          location_lng: lng,
          radius_miles: (props.length ?? 500) / 1609.34, // meters to miles
          geojson: inc.geometry ?? null,
          city,
          raw_data: props,
          is_active: true,
          threat_score: Math.min(100, severity === "high" ? 65 : severity === "medium" ? 40 : 20),
          auto_recommendations: eventType === "road_closure" ? ["avoidZoneRouting"] : [],
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("intelligence_events")
          .upsert(row, { onConflict: "source,source_id" });

        if (!error) upserted++;
      }

      results.push({ city, incidents: upserted });
    } catch (e) {
      results.push({ city, incidents: 0, error: String(e) });
    }
  }

  const hasError = results.some((r) => r.error);
  await supabase.from("scanner_config").update({
    traffic_last_scan_at: new Date().toISOString(),
    traffic_last_status: hasError ? "error" : "success",
    traffic_last_error: hasError ? results.find((r) => r.error)?.error?.slice(0, 500) : null,
  }).eq("id", "default");

  return new Response(JSON.stringify({ source: "tomtom_traffic", results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
