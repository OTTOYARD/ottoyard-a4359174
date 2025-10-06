// One-time utility to update all vehicle OEMs to Waymo, Zoox, or Motional

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

    const oems = ['Waymo', 'Zoox', 'Motional'];
    const { data: vehicles } = await supabase
      .from('ottoq_vehicles')
      .select('id')
      .limit(1000);

    let updateCount = 0;
    for (const vehicle of vehicles || []) {
      const randomOEM = oems[Math.floor(Math.random() * oems.length)];
      
      // Generate alphanumeric serial like "575VX", "839ZD"
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let serial = '';
      for (let i = 0; i < 3; i++) {
        serial += Math.floor(Math.random() * 10);
      }
      for (let i = 0; i < 2; i++) {
        serial += chars.charAt(Math.floor(Math.random() * 26));
      }
      
      await supabase
        .from('ottoq_vehicles')
        .update({
          oem: randomOEM,
          external_ref: `${randomOEM} ${serial}`,
        })
        .eq('id', vehicle.id);
      
      updateCount++;
    }

    console.log(`Updated ${updateCount} vehicles with new OEM names`);

    return new Response(
      JSON.stringify({ success: true, message: `Updated ${updateCount} vehicles`, oems_used: oems }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating vehicles:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
