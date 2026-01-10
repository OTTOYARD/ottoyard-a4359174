import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Use service role for webhook (no user context)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // For development, parse without verification
      event = JSON.parse(body);
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update service order status
        const { data: orderData } = await supabase
          .from("service_orders")
          .update({
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
            customer_email: session.customer_email || session.customer_details?.email,
            customer_name: session.customer_details?.name,
          })
          .eq("stripe_checkout_session_id", session.id)
          .select("id, user_id, total_amount, items_jsonb, customer_email, customer_name")
          .single();

        // Send payment confirmation email (non-blocking)
        if (orderData) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-payment-confirmation`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                orderId: orderData.id,
                customerEmail: orderData.customer_email || session.customer_details?.email,
                customerName: orderData.customer_name || session.customer_details?.name || "Valued Customer",
                orderTotal: orderData.total_amount,
                items: orderData.items_jsonb || [],
              }),
            });
            console.log("Payment confirmation email triggered");
          } catch (emailError) {
            console.error("Failed to trigger confirmation email:", emailError);
            // Don't fail the webhook for email errors
          }

          // Log activity
          await supabase.from("activity_logs").insert({
            user_id: orderData.user_id,
            action: "payment_completed",
            details_jsonb: {
              order_id: orderData.id,
              amount: orderData.total_amount,
              session_id: session.id,
            },
          });
        }

        console.log(`Checkout completed: ${session.id}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        await supabase
          .from("service_orders")
          .update({ status: "expired" })
          .eq("stripe_checkout_session_id", session.id);

        console.log(`Checkout expired: ${session.id}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Get user from customer
        const { data: billingCustomer } = await supabase
          .from("billing_customers")
          .select("user_id")
          .eq("stripe_customer_id", invoice.customer as string)
          .maybeSingle();

        if (billingCustomer) {
          await supabase.from("invoices").insert({
            user_id: billingCustomer.user_id,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: invoice.subscription as string,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            invoice_date: new Date(invoice.created * 1000).toISOString(),
            pdf_url: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
          });
        }

        console.log(`Invoice paid: ${invoice.id}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { data: billingCustomer } = await supabase
          .from("billing_customers")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer as string)
          .maybeSingle();

        if (billingCustomer) {
          await supabase
            .from("subscriptions")
            .upsert({
              user_id: billingCustomer.user_id,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "stripe_subscription_id",
            });
        }

        console.log(`Subscription ${event.type}: ${subscription.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`Subscription cancelled: ${subscription.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
