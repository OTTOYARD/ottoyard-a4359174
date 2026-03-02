// OTTOQ: Schedule Upsert
// Define periodic maintenance rules

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RULE_TYPE_LEN = 100;

function validateSchedulePayload(payload: unknown): { valid: true; data: { vehicle_id: string; rule_type: string; rule_jsonb: Record<string, unknown>; next_due_at?: string } } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') return { valid: false, error: 'Invalid JSON payload' };
  const p = payload as Record<string, unknown>;

  if (typeof p.vehicle_id !== 'string' || !UUID_RE.test(p.vehicle_id)) {
    return { valid: false, error: 'vehicle_id must be a valid UUID' };
  }
  if (typeof p.rule_type !== 'string' || p.rule_type.length === 0 || p.rule_type.length > MAX_RULE_TYPE_LEN) {
    return { valid: false, error: `rule_type must be a non-empty string (max ${MAX_RULE_TYPE_LEN} chars)` };
  }
  if (!p.rule_jsonb || typeof p.rule_jsonb !== 'object' || Array.isArray(p.rule_jsonb)) {
    return { valid: false, error: 'rule_jsonb must be a JSON object' };
  }
  // Limit rule_jsonb size to prevent oversized payloads
  if (JSON.stringify(p.rule_jsonb).length > 10_000) {
    return { valid: false, error: 'rule_jsonb exceeds maximum size (10KB)' };
  }
  if (p.next_due_at !== undefined && typeof p.next_due_at !== 'string') {
    return { valid: false, error: 'next_due_at must be an ISO timestamp string' };
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

    const validation = validateSchedulePayload(rawPayload);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { vehicle_id, rule_type, rule_jsonb, next_due_at } = validation.data;

    // Check if schedule exists for this vehicle and rule type
    const { data: existing } = await supabase
      .from('ottoq_schedules')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .eq('rule_type', rule_type)
      .maybeSingle();

    let schedule;
    if (existing) {
      const { data, error } = await supabase
        .from('ottoq_schedules')
        .update({
          rule_jsonb,
          next_due_at: next_due_at || existing.next_due_at,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to update schedule' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      schedule = data;
    } else {
      const { data, error } = await supabase
        .from('ottoq_schedules')
        .insert({
          vehicle_id,
          rule_type,
          rule_jsonb,
          next_due_at: next_due_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to create schedule' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      schedule = data;
    }

    // Log event
    await supabase.from('ottoq_events').insert({
      entity_type: 'SCHEDULE',
      entity_id: schedule.id,
      event_type: existing ? 'SCHEDULE_UPDATED' : 'SCHEDULE_CREATED',
      payload_jsonb: { vehicle_id, rule_type },
    });

    return new Response(
      JSON.stringify({
        success: true,
        schedule,
      }),
      {
        status: existing ? 200 : 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Schedule upsert error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
