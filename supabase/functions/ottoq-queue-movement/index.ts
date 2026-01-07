// OTTOQ: Queue Movement Edge Function
// Handles inter-site vehicle movement requests

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueMovementPayload {
  vehicle_id: string;
  current_resource_id?: string;
  target_resource_type: string;
  target_depot_id: string;
  priority?: number;
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

    const payload: QueueMovementPayload = await req.json();
    const { vehicle_id, current_resource_id, target_resource_type, target_depot_id, priority = 0 } = payload;

    // Validate required fields
    if (!vehicle_id || !target_resource_type || !target_depot_id) {
      return new Response(
        JSON.stringify({ error: 'vehicle_id, target_resource_type, and target_depot_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate target resource type
    const validTypes = ['CHARGE_STALL', 'CLEAN_DETAIL_STALL', 'MAINTENANCE_BAY', 'STAGING_STALL'];
    if (!validTypes.includes(target_resource_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid target_resource_type. Must be one of: ${validTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      // Update existing queue entry instead of creating new one
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
        JSON.stringify({
          success: true,
          updated: true,
          queue_entry: updated,
        }),
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
      JSON.stringify({
        success: true,
        queue_entry: queueEntry,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Queue movement error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
