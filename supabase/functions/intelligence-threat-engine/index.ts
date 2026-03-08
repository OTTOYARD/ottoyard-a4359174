import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Haversine distance in miles
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface VehiclePos {
  id: string;
  lat: number;
  lng: number;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Nashville: { lat: 36.1627, lng: -86.7816 },
  Austin: { lat: 30.2672, lng: -97.7431 },
  LA: { lat: 34.0522, lng: -118.2437 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
};

function generateMockVehicles(city?: string): VehiclePos[] {
  const cities = city ? [city] : Object.keys(CITY_COORDS);
  const vehicles: VehiclePos[] = [];
  let idx = 0;
  for (const c of cities) {
    const center = CITY_COORDS[c];
    if (!center) continue;
    for (let i = 0; i < 15; i++) {
      vehicles.push({
        id: `mock-${c}-${idx++}`,
        lat: center.lat + (Math.random() - 0.5) * 0.1,
        lng: center.lng + (Math.random() - 0.5) * 0.1,
      });
    }
  }
  return vehicles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: { city?: string; vehicle_positions?: VehiclePos[] } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const vehiclePositions = body.vehicle_positions?.length
    ? body.vehicle_positions
    : generateMockVehicles(body.city);

  // Load active events
  let query = supabase.from("intelligence_events").select("*").eq("is_active", true);
  if (body.city) query = query.eq("city", body.city);
  const { data: events, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!events?.length) {
    return new Response(JSON.stringify({ threats: [], summary: { total: 0, critical: 0, high: 0 } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = Date.now();
  const assessments = [];

  for (const event of events) {
    const eLat = event.location_lat;
    const eLng = event.location_lng;
    if (eLat == null || eLng == null) continue;

    const radius = event.radius_miles ?? 3;

    // 1. Severity weight (max 40)
    const sevMap: Record<string, number> = { critical: 40, high: 30, medium: 20, low: 10, info: 5 };
    const severityScore = sevMap[event.severity] ?? 5;

    // 2. Vehicle exposure (max 30)
    let vehiclesInRadius = 0;
    let vehiclesInBuffer = 0;
    for (const v of vehiclePositions) {
      const dist = haversine(eLat, eLng, v.lat, v.lng);
      if (dist <= radius) vehiclesInRadius++;
      else if (dist <= radius + 1) vehiclesInBuffer++;
    }
    const exposureScore = Math.min(24, vehiclesInRadius * 6) + Math.min(6, vehiclesInBuffer * 2);

    // 3. Multi-source correlation (max 15)
    let correlatedEvents = 0;
    for (const other of events) {
      if (other.id === event.id) continue;
      if (other.location_lat == null || other.location_lng == null) continue;
      if (haversine(eLat, eLng, other.location_lat, other.location_lng) <= 2) {
        correlatedEvents++;
      }
    }
    const correlationScore = Math.min(15, correlatedEvents * 5);

    // 4. Time freshness (max 10)
    const createdMs = new Date(event.created_at).getTime();
    const ageMinutes = (now - createdMs) / 60000;
    const freshnessScore = ageMinutes < 30 ? 10 : ageMinutes < 60 ? 7 : ageMinutes < 180 ? 4 : ageMinutes < 360 ? 2 : 0;

    // 5. Event type boost (max 5)
    const typeBoost: Record<string, number> = {
      severe_weather: 5, emergency: 5, fire: 5, hazmat: 5,
      road_closure: 4, traffic_incident: 3, construction: 1, news: 0,
    };
    const typeScore = typeBoost[event.event_type] ?? 0;

    const threatScore = Math.min(100, severityScore + exposureScore + correlationScore + freshnessScore + typeScore);

    // Generate recommendations
    let recs: string[] = [];
    if (threatScore >= 80) recs = ["pauseDispatches", "avoidZoneRouting", "safeHarborStaging", "keepClearCorridors"];
    else if (threatScore >= 60) recs = ["avoidZoneRouting", "safeHarborStaging"];
    else if (threatScore >= 40) recs = ["avoidZoneRouting"];

    // Update event row
    await supabase
      .from("intelligence_events")
      .update({
        threat_score: threatScore,
        vehicles_affected: vehiclesInRadius,
        vehicles_nearby: vehiclesInBuffer,
        auto_recommendations: recs,
      })
      .eq("id", event.id);

    assessments.push({
      eventId: event.id,
      title: event.title,
      city: event.city,
      severity: event.severity,
      eventType: event.event_type,
      threatScore,
      vehiclesAffected: vehiclesInRadius,
      vehiclesNearby: vehiclesInBuffer,
      autoRecommendations: recs,
      breakdown: { severityScore, exposureScore, correlationScore, freshnessScore, typeScore },
    });
  }

  assessments.sort((a, b) => b.threatScore - a.threatScore);

  const summary = {
    total: assessments.length,
    critical: assessments.filter((a) => a.threatScore >= 80).length,
    high: assessments.filter((a) => a.threatScore >= 60).length,
    medium: assessments.filter((a) => a.threatScore >= 40).length,
    maxThreat: assessments[0]?.threatScore ?? 0,
  };

  return new Response(JSON.stringify({ threats: assessments, summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
