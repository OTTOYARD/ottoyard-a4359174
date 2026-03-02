// OTTOQ: Task Confirmation Edge Function
// Handles task confirmations for depot stall workflows

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TASK_KEY_LEN = 200;

function validateTaskConfirm(payload: unknown): { valid: true; data: { job_id: string; resource_id: string; task_key: string; confirmed: boolean; metadata?: Record<string, unknown> } } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') return { valid: false, error: 'Invalid JSON payload' };
  const p = payload as Record<string, unknown>;

  if (typeof p.job_id !== 'string' || !UUID_RE.test(p.job_id)) {
    return { valid: false, error: 'job_id must be a valid UUID' };
  }
  if (typeof p.resource_id !== 'string' || !UUID_RE.test(p.resource_id)) {
    return { valid: false, error: 'resource_id must be a valid UUID' };
  }
  if (typeof p.task_key !== 'string' || p.task_key.length === 0 || p.task_key.length > MAX_TASK_KEY_LEN) {
    return { valid: false, error: `task_key must be a non-empty string (max ${MAX_TASK_KEY_LEN} chars)` };
  }
  if (typeof p.confirmed !== 'boolean') {
    return { valid: false, error: 'confirmed must be a boolean' };
  }
  if (p.metadata !== undefined && (typeof p.metadata !== 'object' || p.metadata === null)) {
    return { valid: false, error: 'metadata must be a JSON object' };
  }
  if (p.metadata !== undefined && JSON.stringify(p.metadata).length > 10_000) {
    return { valid: false, error: 'metadata exceeds maximum size (10KB)' };
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

    const validation = validateTaskConfirm(rawPayload);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { job_id, resource_id, task_key, confirmed, metadata } = validation.data;

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

      await supabase.from('ottoq_events').insert({
        entity_type: 'JOB',
        entity_id: job_id,
        event_type: 'TASK_CONFIRMED',
        payload_jsonb: { task_key, resource_id, confirmed_by: 'manual', metadata },
      });

      const isDeploymentTask = task_key.includes('deployment') || task_key === 'confirm_exit';

      if (isDeploymentTask) {
        await supabase
          .from('ottoq_jobs')
          .update({ state: 'COMPLETED', completed_at: new Date().toISOString() })
          .eq('id', job_id);

        await supabase
          .from('ottoq_resources')
          .update({ status: 'AVAILABLE', current_job_id: null })
          .eq('id', resource_id);

        await supabase
          .from('ottoq_vehicles')
          .update({ status: 'IDLE', updated_at: new Date().toISOString() })
          .eq('id', job.vehicle_id);

        await supabase.from('ottoq_events').insert({
          entity_type: 'VEHICLE',
          entity_id: job.vehicle_id,
          event_type: 'VEHICLE_DEPLOYED',
          payload_jsonb: { job_id, resource_id, deployed_at: new Date().toISOString() },
        });
      }

      return new Response(
        JSON.stringify({ success: true, confirmation, deployed: isDeploymentTask }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
