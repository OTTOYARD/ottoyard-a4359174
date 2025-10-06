// OTTOQ: Job Request & Scheduling
// Creates reservation requests and triggers the scheduler

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

interface JobRequestPayload {
  vehicle_id: string;
  job_type: 'CHARGE' | 'MAINTENANCE' | 'DETAILING' | 'DOWNTIME_PARK';
  preferred_depot_id?: string;
  earliest_start_at?: string;
  metadata?: Record<string, any>;
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

    const payload: JobRequestPayload = await req.json();
    const { vehicle_id, job_type, preferred_depot_id, earliest_start_at, metadata } = payload;
    const idempotencyKey = req.headers.get('idempotency-key');

    if (!vehicle_id || !job_type) {
      return new Response(JSON.stringify({ error: 'vehicle_id and job_type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check idempotency
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('ottoq_jobs')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existing) {
        console.log(`Idempotent request: returning existing job ${existing.id}`);
        return new Response(JSON.stringify({ job: existing, idempotent: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get vehicle info
    const { data: vehicle, error: vehicleError } = await supabase
      .from('ottoq_vehicles')
      .select('*, ottoq_cities(name)')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine depot
    let depot_id = preferred_depot_id;
    if (!depot_id) {
      const { data: depots } = await supabase
        .from('ottoq_depots')
        .select('id')
        .eq('city_id', vehicle.city_id)
        .limit(1);

      if (depots && depots.length > 0) {
        depot_id = depots[0].id;
      } else {
        return new Response(JSON.stringify({ error: 'No depot available in vehicle city' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create pending job
    const { data: job, error: jobError } = await supabase
      .from('ottoq_jobs')
      .insert({
        vehicle_id,
        depot_id,
        job_type,
        state: 'PENDING',
        requested_start_at: earliest_start_at || new Date().toISOString(),
        metadata_jsonb: metadata || {},
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return new Response(JSON.stringify({ error: jobError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Created job ${job.id} for vehicle ${vehicle_id}, type ${job_type}`);

    // Log event
    await supabase.from('ottoq_events').insert({
      entity_type: 'JOB',
      entity_id: job.id,
      event_type: 'JOB_CREATED',
      payload_jsonb: { vehicle_id, job_type, depot_id },
    });

    // Trigger scheduler
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ottoq-scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ job_id: job.id }),
      });
    } catch (schedError) {
      console.error('Scheduler trigger error:', schedError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        job: {
          id: job.id,
          vehicle_id: job.vehicle_id,
          depot_id: job.depot_id,
          job_type: job.job_type,
          state: job.state,
          created_at: job.created_at,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Job request error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
