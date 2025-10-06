// OTTOQ: Schedule Upsert
// Define periodic maintenance rules

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulePayload {
  vehicle_id: string;
  rule_type: string;
  rule_jsonb: Record<string, any>;
  next_due_at?: string;
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

    const payload: SchedulePayload = await req.json();
    const { vehicle_id, rule_type, rule_jsonb, next_due_at } = payload;

    if (!vehicle_id || !rule_type || !rule_jsonb) {
      return new Response(
        JSON.stringify({ error: 'vehicle_id, rule_type, and rule_jsonb required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if schedule exists for this vehicle and rule type
    const { data: existing } = await supabase
      .from('ottoq_schedules')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .eq('rule_type', rule_type)
      .maybeSingle();

    let schedule;
    if (existing) {
      // Update existing
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
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      schedule = data;
      console.log(`Updated schedule ${schedule.id} for vehicle ${vehicle_id}`);
    } else {
      // Create new
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
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      schedule = data;
      console.log(`Created schedule ${schedule.id} for vehicle ${vehicle_id}`);
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
