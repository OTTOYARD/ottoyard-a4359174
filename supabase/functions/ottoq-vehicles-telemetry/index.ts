// OTTOQ: Vehicle Telemetry Ingestion
// Accepts real-time vehicle telemetry and triggers auto-scheduling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelemetryPayload {
  vehicle_id: string;
  soc?: number;
  odometer_km?: number;
  location?: { lat: number; lon: number };
  health?: Record<string, any>;
  ts?: string;
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

    const payload: TelemetryPayload = await req.json();
    const { vehicle_id, soc, odometer_km, location, health, ts } = payload;

    if (!vehicle_id) {
      return new Response(JSON.stringify({ error: 'vehicle_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      return new Response(JSON.stringify({ error: updateError.message }), {
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
          // Check if there's already an active/pending charge job
          const { data: existingJob } = await supabase
            .from('ottoq_jobs')
            .select('id')
            .eq('vehicle_id', vehicle_id)
            .eq('job_type', 'CHARGE')
            .in('state', ['PENDING', 'SCHEDULED', 'ACTIVE'])
            .maybeSingle();

          if (!existingJob) {
            // Trigger charge job via scheduler
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
              console.log(`Auto-triggered charge job for vehicle ${vehicle_id} at ${soc * 100}% SOC`);
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
