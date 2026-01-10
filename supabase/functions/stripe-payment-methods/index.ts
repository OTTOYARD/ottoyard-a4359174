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
        JSON.stringify({ error: "Please sign in" }),
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
        JSON.stringify({ error: "Please sign in" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer from billing_customers
    const { data: billingCustomer, error: selectError } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id, default_payment_method_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Error fetching billing customer:", selectError);
    }
    
    console.log(`User ${user.id} billing customer:`, billingCustomer);

    // Handle different HTTP methods and actions
    if (req.method === "GET") {
      // List payment methods
      if (!billingCustomer?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ payment_methods: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: billingCustomer.stripe_customer_id,
        type: "card",
      });

      // Get customer to check default payment method
      const customer = await stripe.customers.retrieve(billingCustomer.stripe_customer_id) as Stripe.Customer;
      const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method as string || billingCustomer.default_payment_method_id;

      const formattedMethods = paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand || "unknown",
        last4: pm.card?.last4 || "0000",
        exp_month: pm.card?.exp_month || 0,
        exp_year: pm.card?.exp_year || 0,
        is_default: pm.id === defaultPaymentMethodId,
      }));

      return new Response(
        JSON.stringify({ payment_methods: formattedMethods }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST requests for actions
    const body = await req.json();
    const { action, payment_method_id } = body;

    if (!billingCustomer?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No billing account found. Please make a purchase first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "set_default") {
      // Set as default payment method
      await stripe.customers.update(billingCustomer.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });

      // Also save in our database
      await supabase
        .from("billing_customers")
        .update({ default_payment_method_id: payment_method_id })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      // Detach payment method from customer
      await stripe.paymentMethods.detach(payment_method_id);

      // If this was the default, clear it from our database
      if (billingCustomer.default_payment_method_id === payment_method_id) {
        await supabase
          .from("billing_customers")
          .update({ default_payment_method_id: null })
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment methods error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
