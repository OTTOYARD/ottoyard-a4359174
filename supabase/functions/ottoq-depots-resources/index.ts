// OTTOQ: Depot Resources Grid
// Returns the full 50-cell grid + 2 maintenance bays with live status

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
    const depot_id = url.pathname.split('/').pop();

    if (!depot_id || depot_id === 'ottoq-depots-resources') {
      return new Response(JSON.stringify({ error: 'depot_id required in path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get depot info
    const { data: depot, error: depotError } = await supabase
      .from('ottoq_depots')
      .select('*, ottoq_cities(name)')
      .eq('id', depot_id)
      .single();

    if (depotError || !depot) {
      return new Response(JSON.stringify({ error: 'Depot not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all resources for this depot
    const { data: resources, error: resourcesError } = await supabase
      .from('ottoq_resources')
      .select('*')
      .eq('depot_id', depot_id)
      .order('resource_type')
      .order('index');

    if (resourcesError) {
      console.error('Resources query error:', resourcesError);
      return new Response(JSON.stringify({ error: resourcesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get job IDs from resources
    const jobIds = resources
      .filter(r => r.current_job_id)
      .map(r => r.current_job_id);

    // Fetch jobs separately if there are any
    let jobsMap = new Map();
    if (jobIds.length > 0) {
      const { data: jobs, error: jobsError } = await supabase
        .from('ottoq_jobs')
        .select(`
          id,
          vehicle_id,
          job_type,
          state,
          scheduled_start_at,
          started_at,
          eta_seconds,
          metadata_jsonb,
          ottoq_vehicles(external_ref)
        `)
        .in('id', jobIds);

      if (!jobsError && jobs) {
        jobs.forEach(job => jobsMap.set(job.id, job));
      }
    }

    // Format resources with labels
    const formattedResources = resources.map((r) => {
      let label = '';
      
      if (r.status === 'AVAILABLE') {
        label = 'Available';
      } else if (r.status === 'OUT_OF_SERVICE') {
        label = 'Out of Service';
      } else if (r.current_job_id && jobsMap.has(r.current_job_id)) {
        const job = jobsMap.get(r.current_job_id);
        const vehicleRef = job.ottoq_vehicles?.external_ref || job.vehicle_id.substring(0, 8);
        
        let jobLabel = '';
        switch (job.job_type) {
          case 'CHARGE':
            jobLabel = 'Charging';
            break;
          case 'MAINTENANCE':
            jobLabel = job.metadata_jsonb?.task || 'Maintenance';
            break;
          case 'DETAILING':
            jobLabel = 'Detailing';
            break;
          case 'DOWNTIME_PARK':
            jobLabel = 'Parked';
            break;
        }

        // Calculate time remaining
        let timeRemaining = '';
        if (job.state === 'ACTIVE' && job.eta_seconds && job.started_at) {
          const elapsedMs = Date.now() - new Date(job.started_at).getTime();
          const remainingSeconds = Math.max(0, job.eta_seconds - Math.floor(elapsedMs / 1000));
          const mins = Math.floor(remainingSeconds / 60);
          const hours = Math.floor(mins / 60);
          
          if (hours > 0) {
            timeRemaining = `${hours}h ${mins % 60}m left`;
          } else {
            timeRemaining = `${mins}m left`;
          }
        } else if (job.state === 'SCHEDULED' && job.scheduled_start_at) {
          const untilStart = new Date(job.scheduled_start_at).getTime() - Date.now();
          if (untilStart > 0) {
            const mins = Math.floor(untilStart / 60000);
            timeRemaining = `starts in ${mins}m`;
          } else {
            timeRemaining = 'starting soon';
          }
        }

        label = `Vehicle ${vehicleRef} — ${jobLabel}${timeRemaining ? ' — ' + timeRemaining : ''}`;
      }

      return {
        type: r.resource_type,
        index: r.index,
        status: r.status,
        label,
        job_id: r.current_job_id,
      };
    });

    // Generate mock energy analytics based on depot activity
    const occupiedCount = formattedResources.filter(r => r.status === 'OCCUPIED').length;
    const totalResources = formattedResources.length;
    const utilizationRate = totalResources > 0 ? occupiedCount / totalResources : 0;
    
    // Base values scaled by depot size and current utilization
    const baseConsumption = 8500 + (totalResources * 45);
    const energyConsumed = Math.round(baseConsumption * (0.7 + utilizationRate * 0.6));
    const energyRegenerated = Math.round(energyConsumed * (0.35 + Math.random() * 0.15));
    const efficiency = Math.round(75 + Math.random() * 15);
    const peakDemand = Math.round((energyConsumed / 24) * (1.4 + Math.random() * 0.3));
    const carbonOffset = Math.round(energyConsumed * 0.42);

    const energyAnalytics = {
      energyConsumed,
      energyRegenerated,
      efficiency,
      peakDemand,
      carbonOffset,
    };

    return new Response(
      JSON.stringify({
        depot_id: depot.id,
        depot_name: depot.name,
        city: depot.ottoq_cities?.name,
        branding: depot.config_jsonb?.ottoq_branding || 'Powered by OTTOQ Technology',
        resources: formattedResources,
        energyAnalytics,
        updated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Depot resources error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
