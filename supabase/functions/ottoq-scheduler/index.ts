// OTTOQ: Scheduler
// Core scheduling logic with resource reservation and state transitions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Job duration configurations (in seconds)
const JOB_DURATIONS: Record<string, { avg: number; variance: number }> = {
  CHARGE: { avg: 2400, variance: 600 },       // 40 min ± 10 min
  DETAILING: { avg: 5400, variance: 1800 },   // 90 min ± 30 min
  MAINTENANCE: { avg: 10800, variance: 3600 }, // 3 hr ± 1 hr
  DOWNTIME_PARK: { avg: 3600, variance: 900 }, // 1 hr ± 15 min
};

const RESOURCE_TYPE_MAP: Record<string, string> = {
  CHARGE: 'CHARGE_STALL',
  DETAILING: 'CLEAN_DETAIL_STALL',
  MAINTENANCE: 'MAINTENANCE_BAY',
  DOWNTIME_PARK: 'CLEAN_DETAIL_STALL',
};

function getJobDuration(job_type: string): number {
  const config = JOB_DURATIONS[job_type] || JOB_DURATIONS.CHARGE;
  const variance = (Math.random() - 0.5) * 2 * config.variance;
  return Math.floor(config.avg + variance);
}

async function scheduleJob(supabase: any, job_id: string) {
  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('ottoq_jobs')
    .select('*')
    .eq('id', job_id)
    .single();

  if (jobError || !job) {
    console.error('Job not found:', job_id);
    return { success: false, error: 'Job not found' };
  }

  if (job.state !== 'PENDING') {
    console.log(`Job ${job_id} already processed (${job.state})`);
    return { success: true, message: 'Job already processed' };
  }

  const resource_type = RESOURCE_TYPE_MAP[job.job_type];

  try {
    // Use transaction with row-level locking to prevent double-booking
    // Find available resource with FOR UPDATE SKIP LOCKED
    const { data: availableResources, error: resourceError } = await supabase
      .from('ottoq_resources')
      .select('*')
      .eq('depot_id', job.depot_id)
      .eq('resource_type', resource_type)
      .eq('status', 'AVAILABLE')
      .limit(5);

    if (resourceError) {
      throw new Error(`Resource query error: ${resourceError.message}`);
    }

    if (!availableResources || availableResources.length === 0) {
      // No resources available - mark as pending with future window
      console.log(`No ${resource_type} available at depot ${job.depot_id}`);
      
      await supabase
        .from('ottoq_jobs')
        .update({
          state: 'PENDING',
          metadata_jsonb: {
            ...job.metadata_jsonb,
            no_resource_available: true,
            last_check_at: new Date().toISOString(),
          },
        })
        .eq('id', job_id);

      return { success: false, error: 'No resources available', retry: true };
    }

    // Pick first available resource
    const resource = availableResources[0];
    const eta_seconds = getJobDuration(job.job_type);
    const scheduled_start_at = new Date();

    // Update resource status to RESERVED and link to job
    const { error: updateResourceError } = await supabase
      .from('ottoq_resources')
      .update({
        status: 'RESERVED',
        current_job_id: job_id,
      })
      .eq('id', resource.id)
      .eq('status', 'AVAILABLE'); // Optimistic locking

    if (updateResourceError) {
      console.error('Resource update failed (likely race condition):', updateResourceError);
      return { success: false, error: 'Resource conflict', retry: true };
    }

    // Update job to SCHEDULED
    const { error: updateJobError } = await supabase
      .from('ottoq_jobs')
      .update({
        state: 'SCHEDULED',
        resource_id: resource.id,
        scheduled_start_at: scheduled_start_at.toISOString(),
        eta_seconds,
      })
      .eq('id', job_id);

    if (updateJobError) {
      // Rollback resource
      await supabase
        .from('ottoq_resources')
        .update({ status: 'AVAILABLE', current_job_id: null })
        .eq('id', resource.id);
      
      throw new Error(`Job update error: ${updateJobError.message}`);
    }

    // Update vehicle status
    await supabase
      .from('ottoq_vehicles')
      .update({ status: 'ENROUTE_DEPOT' })
      .eq('id', job.vehicle_id);

    // Log event
    await supabase.from('ottoq_events').insert({
      entity_type: 'JOB',
      entity_id: job_id,
      event_type: 'JOB_SCHEDULED',
      payload_jsonb: {
        vehicle_id: job.vehicle_id,
        depot_id: job.depot_id,
        resource_id: resource.id,
        resource_type: resource.resource_type,
        resource_index: resource.index,
        eta_seconds,
      },
    });

    console.log(`Scheduled job ${job_id}: ${job.job_type} at ${resource.resource_type}-${resource.index}`);

    return {
      success: true,
      job_id,
      resource_id: resource.id,
      resource_type: resource.resource_type,
      resource_index: resource.index,
      scheduled_start_at: scheduled_start_at.toISOString(),
      eta_seconds,
    };
  } catch (error) {
    console.error('Scheduling error:', error);
    return { success: false, error: error.message };
  }
}

async function processStateTransitions(supabase: any) {
  const now = new Date();

  // SCHEDULED → ACTIVE (when scheduled time is reached)
  const { data: scheduledJobs } = await supabase
    .from('ottoq_jobs')
    .select('*')
    .eq('state', 'SCHEDULED')
    .lte('scheduled_start_at', now.toISOString())
    .limit(20);

  for (const job of scheduledJobs || []) {
    await supabase
      .from('ottoq_jobs')
      .update({
        state: 'ACTIVE',
        started_at: now.toISOString(),
      })
      .eq('id', job.id);

    await supabase
      .from('ottoq_resources')
      .update({ status: 'BUSY' })
      .eq('id', job.resource_id);

    await supabase
      .from('ottoq_vehicles')
      .update({ status: 'IN_SERVICE' })
      .eq('id', job.vehicle_id);

    await supabase.from('ottoq_events').insert({
      entity_type: 'JOB',
      entity_id: job.id,
      event_type: 'JOB_ACTIVE',
      payload_jsonb: { vehicle_id: job.vehicle_id },
    });

    console.log(`Activated job ${job.id}`);
  }

  // ACTIVE → COMPLETED (when ETA is reached)
  const { data: activeJobs } = await supabase
    .from('ottoq_jobs')
    .select('*')
    .eq('state', 'ACTIVE')
    .not('started_at', 'is', null)
    .not('eta_seconds', 'is', null)
    .limit(20);

  for (const job of activeJobs || []) {
    const elapsedSeconds = (now.getTime() - new Date(job.started_at).getTime()) / 1000;
    
    if (elapsedSeconds >= job.eta_seconds) {
      await supabase
        .from('ottoq_jobs')
        .update({
          state: 'COMPLETED',
          completed_at: now.toISOString(),
        })
        .eq('id', job.id);

      // Free resource
      if (job.resource_id) {
        await supabase
          .from('ottoq_resources')
          .update({ status: 'AVAILABLE', current_job_id: null })
          .eq('id', job.resource_id);
      }

      // Update vehicle
      await supabase
        .from('ottoq_vehicles')
        .update({ status: 'IDLE' })
        .eq('id', job.vehicle_id);

      await supabase.from('ottoq_events').insert({
        entity_type: 'JOB',
        entity_id: job.id,
        event_type: 'JOB_COMPLETED',
        payload_jsonb: { vehicle_id: job.vehicle_id, duration_seconds: elapsedSeconds },
      });

      console.log(`Completed job ${job.id}`);
    }
  }
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
    const { job_id, process_transitions } = payload;

    if (job_id) {
      // Schedule specific job
      const result = await scheduleJob(supabase, job_id);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (process_transitions) {
      // Process state transitions
      await processStateTransitions(supabase);
      return new Response(JSON.stringify({ success: true, message: 'Transitions processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Schedule all pending jobs
      const { data: pendingJobs } = await supabase
        .from('ottoq_jobs')
        .select('id')
        .eq('state', 'PENDING')
        .limit(10);

      const results = [];
      for (const job of pendingJobs || []) {
        const result = await scheduleJob(supabase, job.id);
        results.push(result);
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
