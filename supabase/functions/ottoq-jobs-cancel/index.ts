// OTTOQ: Cancel Job
// Cancels a job and frees the reserved resource

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const job_id = url.pathname.split('/').pop();

    if (!job_id || job_id === 'ottoq-jobs-cancel' || !UUID_RE.test(job_id)) {
      return new Response(JSON.stringify({ error: 'Valid job_id (UUID) required in path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('ottoq_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (job.state === 'COMPLETED' || job.state === 'CANCELLED') {
      return new Response(
        JSON.stringify({ message: 'Job already completed or cancelled', job }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update job to cancelled
    await supabase
      .from('ottoq_jobs')
      .update({ state: 'CANCELLED', completed_at: new Date().toISOString() })
      .eq('id', job_id);

    // Free resource if assigned
    if (job.resource_id) {
      await supabase
        .from('ottoq_resources')
        .update({ status: 'AVAILABLE', current_job_id: null })
        .eq('id', job.resource_id);
    }

    // Log event
    await supabase.from('ottoq_events').insert({
      entity_type: 'JOB',
      entity_id: job_id,
      event_type: 'JOB_CANCELLED',
      payload_jsonb: { vehicle_id: job.vehicle_id, reason: 'manual_cancellation' },
    });

    // Update vehicle status
    await supabase
      .from('ottoq_vehicles')
      .update({ status: 'IDLE' })
      .eq('id', job.vehicle_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job cancelled successfully',
        job_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Job cancel error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
