import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Please sign in to add a payment method" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create Supabase client WITH user's auth header for RLS to work
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Please sign in to add a payment method" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if customer exists
    const { data: billingCustomer, error: selectError } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Error fetching billing customer:", selectError);
    }

    let stripeCustomerId: string;

    if (billingCustomer?.stripe_customer_id) {
      stripeCustomerId = billingCustomer.stripe_customer_id;
      console.log(`Existing Stripe customer found: ${stripeCustomerId}`);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log(`Created new Stripe customer: ${stripeCustomerId}`);

      // Save to database using upsert to handle race conditions
      const { error: insertError } = await supabase.from("billing_customers").upsert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
      }, { onConflict: 'user_id' });

      if (insertError) {
        console.error("Error saving billing customer:", insertError);
        // Don't fail - the Stripe customer was created, we can still proceed
      } else {
        console.log(`Saved billing customer for user ${user.id}`);
      }
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create a Checkout Session in setup mode
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${origin}/?setup=success`,
      cancel_url: `${origin}/?setup=cancelled`,
      metadata: {
        user_id: user.id,
      },
    });

    console.log(`Setup session created: ${session.id} for user ${user.id}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Setup intent error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
