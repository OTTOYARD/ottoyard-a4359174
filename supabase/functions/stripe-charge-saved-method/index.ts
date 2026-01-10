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
        JSON.stringify({ error: "Please sign in to checkout" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Please sign in to checkout" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { items, payment_method_id } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    if (!payment_method_id) {
      throw new Error("No payment method selected");
    }

    // Get customer from billing_customers
    const { data: billingCustomer } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!billingCustomer?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No billing account found. Please add a payment method first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total in cents
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price, 0);
    const tax = Math.round(subtotal * 0.0825);
    const total = subtotal + tax;
    const totalCents = total * 100;

    // Get payment method details for display
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
    const paymentMethodLast4 = paymentMethod.card?.last4 || "0000";
    const paymentMethodBrand = paymentMethod.card?.brand || "card";

    // Create PaymentIntent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: billingCustomer.stripe_customer_id,
      payment_method: payment_method_id,
      off_session: true,
      confirm: true,
      description: `OTTOYARD Services - ${items.length} item(s)`,
      metadata: {
        user_id: user.id,
        items_count: items.length.toString(),
      },
    });

    if (paymentIntent.status === "succeeded") {
      // Create service order record
      const { data: orderData, error: orderError } = await supabase
        .from("service_orders")
        .insert({
          user_id: user.id,
          stripe_payment_intent_id: paymentIntent.id,
          status: "completed",
          items_jsonb: items,
          subtotal: subtotal * 100,
          tax: tax * 100,
          total_amount: totalCents,
          completed_at: new Date().toISOString(),
          customer_email: user.email,
          payment_method_last4: paymentMethodLast4,
          payment_method_brand: paymentMethodBrand,
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "payment_completed",
        resource_type: "service_order",
        resource_id: orderData?.id,
        details_jsonb: {
          amount: totalCents,
          items_count: items.length,
          payment_method: `${paymentMethodBrand} ****${paymentMethodLast4}`,
        },
      });

      // Trigger email notification (non-blocking)
      supabase.functions.invoke("send-payment-confirmation", {
        body: {
          orderId: orderData?.id,
          customerEmail: user.email,
          customerName: user.user_metadata?.full_name || user.email?.split("@")[0],
          totalAmount: totalCents,
          items: items,
        },
      }).catch(console.error);

      console.log(`Payment succeeded: ${paymentIntent.id} for user ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          order_id: orderData?.id,
          payment_intent_id: paymentIntent.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }
  } catch (error) {
    console.error("Charge error:", error);
    
    // Handle specific Stripe errors
    if (error.type === "StripeCardError") {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
