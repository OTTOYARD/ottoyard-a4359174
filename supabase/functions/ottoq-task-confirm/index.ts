// OTTOQ: Task Confirmation Edge Function
// Handles task confirmations for depot stall workflows

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskConfirmPayload {
  job_id: string;
  resource_id: string;
  task_key: string;
  confirmed: boolean;
  metadata?: Record<string, unknown>;
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

    const payload: TaskConfirmPayload = await req.json();
    const { job_id, resource_id, task_key, confirmed, metadata } = payload;

    // Validate required fields
    if (!job_id || !resource_id || !task_key) {
      return new Response(
        JSON.stringify({ error: 'job_id, resource_id, and task_key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify job exists and is active
    const { data: job, error: jobError } = await supabase
      .from('ottoq_jobs')
      .select('id, state, vehicle_id')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (job.state === 'COMPLETED' || job.state === 'CANCELLED') {
      return new Response(
        JSON.stringify({ error: 'Cannot modify confirmations for completed/cancelled jobs' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (confirmed) {
      // Upsert confirmation
      const { data: confirmation, error: upsertError } = await supabase
        .from('ottoq_task_confirmations')
        .upsert(
          {
            job_id,
            resource_id,
            task_key,
            confirmed_at: new Date().toISOString(),
            automation_source: 'manual',
            metadata_jsonb: metadata || {},
          },
          {
            onConflict: 'job_id,resource_id,task_key',
          }
        )
        .select()
        .single();

      if (upsertError) {
        console.error('Failed to upsert confirmation:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save confirmation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log event
      await supabase.from('ottoq_events').insert({
        entity_type: 'JOB',
        entity_id: job_id,
        event_type: 'TASK_CONFIRMED',
        payload_jsonb: {
          task_key,
          resource_id,
          confirmed_by: 'manual',
          metadata,
        },
      });

      // Check if this is a deployment confirmation task
      const isDeploymentTask = task_key.includes('deployment') || task_key === 'confirm_exit';
      
      if (isDeploymentTask) {
        // Complete the job and release the resource
        await supabase
          .from('ottoq_jobs')
          .update({
            state: 'COMPLETED',
            completed_at: new Date().toISOString(),
          })
          .eq('id', job_id);

        // Release the resource
        await supabase
          .from('ottoq_resources')
          .update({
            status: 'AVAILABLE',
            current_job_id: null,
          })
          .eq('id', resource_id);

        // Update vehicle status to IDLE (available for ridehail)
        await supabase
          .from('ottoq_vehicles')
          .update({
            status: 'IDLE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.vehicle_id);

        // Log deployment event
        await supabase.from('ottoq_events').insert({
          entity_type: 'VEHICLE',
          entity_id: job.vehicle_id,
          event_type: 'VEHICLE_DEPLOYED',
          payload_jsonb: {
            job_id,
            resource_id,
            deployed_at: new Date().toISOString(),
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          confirmation,
          deployed: isDeploymentTask,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Remove confirmation (uncheck)
      const { error: deleteError } = await supabase
        .from('ottoq_task_confirmations')
        .delete()
        .eq('job_id', job_id)
        .eq('resource_id', resource_id)
        .eq('task_key', task_key);

      if (deleteError) {
        console.error('Failed to delete confirmation:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove confirmation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, removed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Task confirm error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
