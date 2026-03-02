// OTTOQ: Vehicle Telemetry Ingestion
// Accepts real-time vehicle telemetry and triggers auto-scheduling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID v4 regex for validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateTelemetry(payload: unknown): { valid: true; data: { vehicle_id: string; soc?: number; odometer_km?: number; location?: { lat: number; lon: number }; health?: Record<string, unknown>; ts?: string } } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') return { valid: false, error: 'Invalid JSON payload' };
  const p = payload as Record<string, unknown>;

  if (typeof p.vehicle_id !== 'string' || !UUID_RE.test(p.vehicle_id)) {
    return { valid: false, error: 'vehicle_id must be a valid UUID' };
  }
  if (p.soc !== undefined) {
    if (typeof p.soc !== 'number' || p.soc < 0 || p.soc > 1) {
      return { valid: false, error: 'soc must be a number between 0 and 1' };
    }
  }
  if (p.odometer_km !== undefined) {
    if (typeof p.odometer_km !== 'number' || !Number.isInteger(p.odometer_km) || p.odometer_km < 0 || p.odometer_km > 10_000_000) {
      return { valid: false, error: 'odometer_km must be an integer between 0 and 10000000' };
    }
  }
  if (p.location !== undefined) {
    const loc = p.location as Record<string, unknown>;
    if (!loc || typeof loc !== 'object' || typeof loc.lat !== 'number' || typeof loc.lon !== 'number' || loc.lat < -90 || loc.lat > 90 || loc.lon < -180 || loc.lon > 180) {
      return { valid: false, error: 'location must have lat (-90..90) and lon (-180..180)' };
    }
  }
  if (p.health !== undefined && (typeof p.health !== 'object' || p.health === null)) {
    return { valid: false, error: 'health must be a JSON object' };
  }
  if (p.ts !== undefined && typeof p.ts !== 'string') {
    return { valid: false, error: 'ts must be an ISO timestamp string' };
  }

  return { valid: true, data: p as any };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validation = validateTelemetry(rawPayload);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { vehicle_id, soc, odometer_km, location, health, ts } = validation.data;

    // Update vehicle telemetry
    const updateData: any = {
      last_telemetry_at: ts || new Date().toISOString(),
    };
    if (soc !== undefined) updateData.soc = soc;
    if (odometer_km !== undefined) updateData.odometer_km = odometer_km;
    if (health) updateData.health_jsonb = health;

    const { data: vehicle, error: updateError } = await supabase
      .from('ottoq_vehicles')
      .update(updateData)
      .eq('id', vehicle_id)
      .select('*, ottoq_cities(name, tz)')
      .single();

    if (updateError) {
      console.error('Vehicle update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update vehicle' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log telemetry event
    await supabase.from('ottoq_events').insert({
      entity_type: 'VEHICLE',
      entity_id: vehicle_id,
      event_type: 'VEHICLE_TELEMETRY',
      payload_jsonb: { soc, odometer_km, location, health, ts },
    });

    // Check if charging is needed
    let jobTriggered = null;
    if (soc !== undefined) {
      const { data: depot } = await supabase
        .from('ottoq_depots')
        .select('id, config_jsonb')
        .eq('city_id', vehicle.city_id)
        .limit(1)
        .single();

      if (depot) {
        const threshold = depot.config_jsonb?.charge_threshold_soc || 0.20;
        
        if (soc <= threshold) {
          const { data: existingJob } = await supabase
            .from('ottoq_jobs')
            .select('id')
            .eq('vehicle_id', vehicle_id)
            .eq('job_type', 'CHARGE')
            .in('state', ['PENDING', 'SCHEDULED', 'ACTIVE'])
            .maybeSingle();

          if (!existingJob) {
            const scheduleResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/ottoq-jobs-request`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                },
                body: JSON.stringify({
                  vehicle_id,
                  job_type: 'CHARGE',
                  metadata: { auto_triggered: true, trigger_soc: soc },
                }),
              }
            );

            if (scheduleResponse.ok) {
              jobTriggered = await scheduleResponse.json();
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        vehicle: {
          id: vehicle.id,
          soc: vehicle.soc,
          status: vehicle.status,
        },
        job_triggered: jobTriggered,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Telemetry error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
