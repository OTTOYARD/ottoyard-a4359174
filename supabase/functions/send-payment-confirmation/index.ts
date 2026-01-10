import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderTotal: number;
  items: any[];
}

function formatOrderId(id: string): string {
  return `ORD-${id.slice(0, 8).toUpperCase()}`;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // If no Resend API key, log and return success (email is optional)
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no API key configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const { orderId, customerEmail, customerName, orderTotal, items }: PaymentConfirmationRequest = await req.json();

    if (!customerEmail) {
      console.log("No customer email provided, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no email provided" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build items HTML
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.serviceName}</strong><br>
          <span style="color: #666; font-size: 14px;">${item.vehicleName}${item.depot ? ` at ${item.depot}` : ''}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          $${item.price?.toLocaleString() || '0'}
        </td>
      </tr>
    `).join('');

    const subtotal = orderTotal;
    const tax = Math.round(orderTotal * 0.0825);
    const total = orderTotal + tax;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">✓</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Successful!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Thank you for your order</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
              Hi ${customerName || 'Valued Customer'},
            </p>
            <p style="font-size: 16px; color: #666; margin: 0 0 25px;">
              Your payment has been processed successfully. Here are your order details:
            </p>
            
            <!-- Order Info -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #666;">Order Number:</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: bold; font-family: monospace;">${formatOrderId(orderId)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;">Date:</td>
                  <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
              </table>
            </div>
            
            <!-- Items -->
            <h3 style="font-size: 16px; margin: 0 0 15px; color: #333;">Services Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              ${itemsHtml}
            </table>
            
            <!-- Totals -->
            <div style="border-top: 2px solid #eee; padding-top: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #666;">Subtotal:</td>
                  <td style="padding: 5px 0; text-align: right;">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666;">Tax (8.25%):</td>
                  <td style="padding: 5px 0; text-align: right;">${formatCurrency(tax)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; font-size: 18px;">Total Paid:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px; color: #22c55e;">${formatCurrency(total)}</td>
                </tr>
              </table>
            </div>
            
            <!-- What's Next -->
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-top: 25px;">
              <h3 style="font-size: 16px; margin: 0 0 10px; color: #166534;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #166534;">
                <li style="margin-bottom: 8px;">Your services have been scheduled</li>
                <li style="margin-bottom: 8px;">You'll receive reminders before each appointment</li>
                <li>View your orders anytime in the Billing section</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
              Questions? Contact us at support@ottoyard.com
            </p>
            <p style="margin: 0; color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} OTTOYARD Fleet Services. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "OTTOYARD <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Payment Confirmed - Order ${formatOrderId(orderId)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending payment confirmation:", error);
    // Return success even on error - email is non-critical
    return new Response(
      JSON.stringify({ success: true, message: "Email failed but order processed", error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
