// OTTOQ: Vehicle Status
// Returns current vehicle status, reservation, and depot assignment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const vehicle_id = url.pathname.split('/').pop();

    if (!vehicle_id || vehicle_id === 'ottoq-vehicles-status') {
      return new Response(JSON.stringify({ error: 'vehicle_id required in path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get vehicle with active job
    const { data: vehicle, error: vehicleError } = await supabase
      .from('ottoq_vehicles')
      .select(`
        *,
        ottoq_cities(name, tz)
      `)
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active/scheduled job
    const { data: jobs } = await supabase
      .from('ottoq_jobs')
      .select(`
        *,
        ottoq_depots(id, name, address),
        ottoq_resources(id, resource_type, index)
      `)
      .eq('vehicle_id', vehicle_id)
      .in('state', ['PENDING', 'SCHEDULED', 'ACTIVE'])
      .order('created_at', { ascending: false })
      .limit(1);

    const currentJob = jobs && jobs.length > 0 ? jobs[0] : null;

    let assignment = null;
    if (currentJob) {
      const depot = currentJob.ottoq_depots;
      const resource = currentJob.ottoq_resources;

      let resourceLabel = '';
      if (resource) {
        if (resource.resource_type === 'CHARGE_STALL') {
          resourceLabel = `Stall ${resource.index}`;
        } else if (resource.resource_type === 'MAINTENANCE_BAY') {
          resourceLabel = `Bay ${resource.index}`;
        } else {
          resourceLabel = `Stall ${resource.index}`;
        }
      }

      // Calculate ETA/time remaining
      let timeInfo = null;
      if (currentJob.state === 'ACTIVE' && currentJob.eta_seconds && currentJob.started_at) {
        const elapsedMs = Date.now() - new Date(currentJob.started_at).getTime();
        const remainingSeconds = Math.max(0, currentJob.eta_seconds - Math.floor(elapsedMs / 1000));
        timeInfo = {
          eta_seconds: remainingSeconds,
          completion_at: new Date(Date.now() + remainingSeconds * 1000).toISOString(),
        };
      } else if (currentJob.state === 'SCHEDULED' && currentJob.scheduled_start_at) {
        timeInfo = {
          scheduled_start_at: currentJob.scheduled_start_at,
          eta_seconds: currentJob.eta_seconds,
        };
      }

      assignment = {
        job_id: currentJob.id,
        job_type: currentJob.job_type,
        state: currentJob.state,
        depot: {
          id: depot.id,
          name: depot.name,
          address: depot.address,
        },
        resource: resource ? {
          type: resource.resource_type,
          index: resource.index,
          label: resourceLabel,
        } : null,
        ...timeInfo,
      };
    }

    return new Response(
      JSON.stringify({
        vehicle: {
          id: vehicle.id,
          external_ref: vehicle.external_ref,
          oem: vehicle.oem,
          vin: vehicle.vin,
          plate: vehicle.plate,
          soc: vehicle.soc,
          odometer_km: vehicle.odometer_km,
          status: vehicle.status,
          city: vehicle.ottoq_cities?.name,
          last_telemetry_at: vehicle.last_telemetry_at,
        },
        assignment,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Vehicle status error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
