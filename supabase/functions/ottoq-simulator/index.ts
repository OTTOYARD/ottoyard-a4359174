// OTTOQ: Simulator
// Mock simulation with auto-reset every 5-10 minutes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_CONFIG = {
  reservation_interval_seconds: 45,
  reset_interval_seconds: 420,
  utilization_target: 0.5,
  cities: ['Nashville', 'Austin', 'LA'],
  job_durations: {
    CHARGE: { avg: 2400, variance: 600 },
    DETAILING: { avg: 5400, variance: 1800 },
    MAINTENANCE: { avg: 10800, variance: 3600 },
    DOWNTIME_PARK: { avg: 3600, variance: 900 },
  },
};

async function resetSimulator(supabase: any) {
  console.log('Resetting simulator world...');

  // Cancel all active/scheduled jobs
  await supabase
    .from('ottoq_jobs')
    .update({ state: 'CANCELLED', completed_at: new Date().toISOString() })
    .in('state', ['PENDING', 'SCHEDULED', 'ACTIVE']);

  // Free all resources
  await supabase
    .from('ottoq_resources')
    .update({ status: 'AVAILABLE', current_job_id: null })
    .neq('status', 'OUT_OF_SERVICE');

  // Reset vehicles to IDLE with randomized SOC and varied OEM names
  const oems = ['Waymo', 'Zoox', 'Cruise', 'Aurora', 'Argo AI', 'Nuro', 'Motional', 'Tesla', 'Mercedes', 'BMW'];
  const { data: vehicles } = await supabase
    .from('ottoq_vehicles')
    .select('id, city_id, external_ref')
    .limit(1000);

  for (const vehicle of vehicles || []) {
    const newSoc = 0.15 + Math.random() * 0.85;
    const randomOEM = oems[Math.floor(Math.random() * oems.length)];
    
    // Generate alphanumeric serial like "575VX", "839ZD"
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let serial = '';
    for (let i = 0; i < 3; i++) {
      serial += Math.floor(Math.random() * 10);
    }
    for (let i = 0; i < 2; i++) {
      serial += chars.charAt(Math.floor(Math.random() * 26));
    }
    
    await supabase
      .from('ottoq_vehicles')
      .update({
        status: 'IDLE',
        soc: newSoc,
        oem: randomOEM,
        external_ref: `${randomOEM} ${serial}`,
        odometer_km: Math.floor(Math.random() * 50000),
      })
      .eq('id', vehicle.id);
  }

  // Log reset event
  await supabase.from('ottoq_events').insert({
    entity_type: 'SIMULATOR',
    entity_id: null,
    event_type: 'SIMULATOR_RESET',
    payload_jsonb: { timestamp: new Date().toISOString() },
  });

  // Update simulator state
  await supabase
    .from('ottoq_simulator_state')
    .update({ last_reset_at: new Date().toISOString() })
    .eq('mode', 'auto');

  console.log('Simulator reset complete');
}

async function createRandomReservation(supabase: any, cities: string[]) {
  // Pick random city
  const cityName = cities[Math.floor(Math.random() * cities.length)];

  // Get city
  const { data: city } = await supabase
    .from('ottoq_cities')
    .select('id')
    .eq('name', cityName)
    .single();

  if (!city) return;

  // Get idle vehicles in this city
  const { data: vehicles } = await supabase
    .from('ottoq_vehicles')
    .select('id, soc')
    .eq('city_id', city.id)
    .eq('status', 'IDLE')
    .limit(50);

  if (!vehicles || vehicles.length === 0) return;

  // Pick random vehicle
  const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];

  // Weight job types: 60% CHARGE, 25% DETAILING, 15% MAINTENANCE
  const rand = Math.random();
  let job_type;
  if (rand < 0.6) {
    job_type = 'CHARGE';
  } else if (rand < 0.85) {
    job_type = 'DETAILING';
  } else {
    job_type = 'MAINTENANCE';
  }

  // Create job request
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/ottoq-jobs-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          job_type,
          metadata: { simulator_generated: true, city: cityName },
        }),
      }
    );

    if (response.ok) {
      console.log(`Simulator created ${job_type} job for vehicle in ${cityName}`);
    }
  } catch (error) {
    console.error('Simulator job creation error:', error);
  }
}

async function randomlyCompleteJobs(supabase: any) {
  // Get some ACTIVE jobs and randomly complete them early
  const { data: activeJobs } = await supabase
    .from('ottoq_jobs')
    .select('id, started_at, eta_seconds')
    .eq('state', 'ACTIVE')
    .limit(20);

  for (const job of activeJobs || []) {
    // 10% chance to complete early
    if (Math.random() < 0.1) {
      await supabase
        .from('ottoq_jobs')
        .update({
          state: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log(`Simulator force-completed job ${job.id}`);
    }
  }
}

async function simulatorTick(supabase: any, config: any) {
  // Process scheduler transitions
  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ottoq-scheduler`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify({ process_transitions: true }),
  });

  // Create new reservation
  await createRandomReservation(supabase, config.cities);

  // Randomly complete some jobs
  await randomlyCompleteJobs(supabase);
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

    const payload = await req.json().catch(() => ({}));
    const { action, config } = payload;

    // Get simulator state
    const { data: state } = await supabase
      .from('ottoq_simulator_state')
      .select('*')
      .limit(1)
      .single();

    const currentConfig = state?.config_jsonb || DEFAULT_CONFIG;

    if (action === 'start') {
      await supabase
        .from('ottoq_simulator_state')
        .update({ is_running: true })
        .eq('id', state.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Simulator started', is_running: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'stop') {
      await supabase
        .from('ottoq_simulator_state')
        .update({ is_running: false })
        .eq('id', state.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Simulator stopped', is_running: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'reset') {
      await resetSimulator(supabase);
      return new Response(
        JSON.stringify({ success: true, message: 'Simulator reset complete' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'tick') {
      // Single tick
      await simulatorTick(supabase, currentConfig);
      return new Response(
        JSON.stringify({ success: true, message: 'Tick processed' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (action === 'check_reset') {
      // Check if reset is needed
      const lastReset = state?.last_reset_at ? new Date(state.last_reset_at) : new Date();
      const resetInterval = (currentConfig.reset_interval_seconds || 420) * 1000;
      const elapsed = Date.now() - lastReset.getTime();

      if (elapsed >= resetInterval) {
        await resetSimulator(supabase);
        return new Response(
          JSON.stringify({ success: true, message: 'Reset triggered', elapsed_ms: elapsed }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No reset needed',
          elapsed_ms: elapsed,
          next_reset_in_ms: resetInterval - elapsed,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Default: return status
    return new Response(
      JSON.stringify({
        is_running: state?.is_running || false,
        last_reset_at: state?.last_reset_at,
        config: currentConfig,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Simulator error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
