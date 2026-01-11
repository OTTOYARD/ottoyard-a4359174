import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccountSummary {
  profile: {
    name: string | null;
    email: string;
    company: string | null;
    memberSince: string;
  };
  billing: {
    hasAccount: boolean;
    customerId: string | null;
  };
  orders: {
    total: number;
    completed: number;
    lifetimeSpend: number;
    lastOrderAt: string | null;
  };
  vehicles: {
    count: number;
    activeCount: number;
  };
  statements: {
    availableMonths: string[];
  };
  insights: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all user data in parallel
    const [profileResult, billingResult, ordersResult, vehiclesResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin.from('service_orders').select('id, status, total_amount, created_at').eq('user_id', user.id),
      supabaseAdmin.from('user_fleet_vehicles').select('id, status').eq('user_id', user.id),
    ]);

    const profile = profileResult.data;
    const billing = billingResult.data;
    const orders = ordersResult.data || [];
    const vehicles = vehiclesResult.data || [];

    // Calculate stats
    const completedOrders = orders.filter(o => o.status === 'completed');
    const lifetimeSpend = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const lastOrder = completedOrders.length > 0 
      ? completedOrders.reduce((latest, o) => 
          new Date(o.created_at) > new Date(latest.created_at) ? o : latest
        )
      : null;

    // Get available statement months
    const monthSet = new Set<string>();
    completedOrders.forEach(o => {
      const date = new Date(o.created_at);
      monthSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    const availableMonths = Array.from(monthSet).sort().reverse();

    // Generate AI insights
    const insights: string[] = [];
    
    // Spending insights
    if (lifetimeSpend > 100000) { // $1000+
      insights.push(`You're a valued customer with $${(lifetimeSpend / 100).toLocaleString()} in lifetime purchases.`);
    }
    
    // Order frequency insights
    if (completedOrders.length >= 10) {
      insights.push(`You've completed ${completedOrders.length} orders - consider our loyalty program for additional savings.`);
    }

    // Vehicle insights
    const activeVehicles = vehicles.filter(v => v.status === 'active');
    if (activeVehicles.length > 5) {
      insights.push(`Managing ${activeVehicles.length} active vehicles? Our fleet plans may offer better value.`);
    }

    // Recent activity insights
    if (lastOrder) {
      const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastOrder > 30) {
        insights.push(`It's been ${daysSinceLastOrder} days since your last order. Schedule a service today!`);
      }
    }

    // Build summary
    const summary: AccountSummary = {
      profile: {
        name: profile?.full_name || null,
        email: user.email || '',
        company: profile?.company_name || null,
        memberSince: user.created_at || new Date().toISOString(),
      },
      billing: {
        hasAccount: !!billing?.stripe_customer_id,
        customerId: billing?.stripe_customer_id || null,
      },
      orders: {
        total: orders.length,
        completed: completedOrders.length,
        lifetimeSpend,
        lastOrderAt: lastOrder?.created_at || null,
      },
      vehicles: {
        count: vehicles.length,
        activeCount: activeVehicles.length,
      },
      statements: {
        availableMonths,
      },
      insights,
    };

    // Update profile with account summary
    await supabaseAdmin
      .from('profiles')
      .update({
        account_summary_jsonb: {
          lifetime_spend: lifetimeSpend,
          total_orders: orders.length,
          completed_orders: completedOrders.length,
          member_since: user.created_at,
          last_order_at: lastOrder?.created_at || null,
          vehicle_count: vehicles.length,
          last_summary_update: new Date().toISOString(),
        },
      })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating account summary:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
