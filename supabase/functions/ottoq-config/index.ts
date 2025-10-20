// OTTOQ: Configuration
// Returns system config and branding

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get cities with depot counts
    const { data: cities } = await supabase
      .from('ottoq_cities')
      .select(`
        *,
        ottoq_depots(id, name, config_jsonb)
      `);

    // Get simulator state
    const { data: simulator } = await supabase
      .from('ottoq_simulator_state')
      .select('*')
      .limit(1)
      .single();

    const config = {
      branding: 'Powered by OTTO-Q Technology',
      cities: cities?.map((city) => ({
        id: city.id,
        name: city.name,
        tz: city.tz,
        depots: city.ottoq_depots?.map((d: any) => ({
          id: d.id,
          name: d.name,
          charge_threshold_soc: d.config_jsonb?.charge_threshold_soc || 0.20,
        })),
      })),
      simulator: simulator ? {
        is_running: simulator.is_running,
        mode: simulator.mode,
        last_reset_at: simulator.last_reset_at,
        config: simulator.config_jsonb,
      } : null,
      version: '1.0.0',
      features: {
        auto_charging: true,
        maintenance_scheduling: true,
        detailing: true,
        realtime_updates: true,
      },
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Config error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
