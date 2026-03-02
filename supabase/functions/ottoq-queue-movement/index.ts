// OTTOQ: Queue Movement Edge Function
// Handles inter-site vehicle movement requests

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_RESOURCE_TYPES = ['CHARGE_STALL', 'CLEAN_DETAIL_STALL', 'MAINTENANCE_BAY', 'STAGING_STALL'] as const;

function validateMovementPayload(payload: unknown): { valid: true; data: { vehicle_id: string; current_resource_id?: string; target_resource_type: string; target_depot_id: string; priority: number } } | { valid: false; error: string } {
  if (!payload || typeof payload !== 'object') return { valid: false, error: 'Invalid JSON payload' };
  const p = payload as Record<string, unknown>;

  if (typeof p.vehicle_id !== 'string' || !UUID_RE.test(p.vehicle_id)) {
    return { valid: false, error: 'vehicle_id must be a valid UUID' };
  }
  if (typeof p.target_depot_id !== 'string' || !UUID_RE.test(p.target_depot_id)) {
    return { valid: false, error: 'target_depot_id must be a valid UUID' };
  }
  if (typeof p.target_resource_type !== 'string' || !(VALID_RESOURCE_TYPES as readonly string[]).includes(p.target_resource_type)) {
    return { valid: false, error: `target_resource_type must be one of: ${VALID_RESOURCE_TYPES.join(', ')}` };
  }
  if (p.current_resource_id !== undefined && p.current_resource_id !== null) {
    if (typeof p.current_resource_id !== 'string' || !UUID_RE.test(p.current_resource_id)) {
      return { valid: false, error: 'current_resource_id must be a valid UUID' };
    }
  }
  const priority = p.priority !== undefined ? Number(p.priority) : 0;
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
    return { valid: false, error: 'priority must be an integer between 0 and 100' };
  }

  return { valid: true, data: { vehicle_id: p.vehicle_id as string, current_resource_id: p.current_resource_id as string | undefined, target_resource_type: p.target_resource_type as string, target_depot_id: p.target_depot_id as string, priority } };
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

    const validation = validateMovementPayload(rawPayload);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { vehicle_id, current_resource_id, target_resource_type, target_depot_id, priority } = validation.data;

    // Verify vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from('ottoq_vehicles')
      .select('id, status, city_id')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return new Response(
        JSON.stringify({ error: 'Vehicle not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify depot exists
    const { data: depot, error: depotError } = await supabase
      .from('ottoq_depots')
      .select('id, name')
      .eq('id', target_depot_id)
      .single();

    if (depotError || !depot) {
      return new Response(
        JSON.stringify({ error: 'Target depot not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing queued movement for this vehicle
    const { data: existingQueue } = await supabase
      .from('ottoq_movement_queue')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .eq('status', 'QUEUED')
      .single();

    if (existingQueue) {
      const { data: updated, error: updateError } = await supabase
        .from('ottoq_movement_queue')
        .update({
          target_resource_type,
          target_depot_id,
          current_resource_id: current_resource_id || null,
          priority,
          requested_at: new Date().toISOString(),
        })
        .eq('id', existingQueue.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update movement queue:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update movement queue' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, updated: true, queue_entry: updated }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new queue entry
    const { data: queueEntry, error: insertError } = await supabase
      .from('ottoq_movement_queue')
      .insert({
        vehicle_id,
        current_resource_id: current_resource_id || null,
        target_resource_type,
        target_depot_id,
        priority,
        status: 'QUEUED',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create movement queue entry:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to queue movement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log event
    await supabase.from('ottoq_events').insert({
      entity_type: 'VEHICLE',
      entity_id: vehicle_id,
      event_type: 'MOVEMENT_QUEUED',
      payload_jsonb: {
        queue_id: queueEntry.id,
        target_resource_type,
        target_depot_id,
        depot_name: depot.name,
        current_resource_id,
      },
    });

    return new Response(
      JSON.stringify({ success: true, queue_entry: queueEntry }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Queue movement error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
