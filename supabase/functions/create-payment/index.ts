import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Rate limiting check (5 requests per minute)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
      .from("payment_rate_limits")
      .select("request_count")
      .eq("user_id", user.id)
      .eq("endpoint", "create-payment")
      .gte("window_start", oneMinuteAgo)
      .single();

    if (rateLimitError && rateLimitError.code !== "PGRST116") {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (rateLimitData && rateLimitData.request_count >= 5) {
      console.warn(`Rate limit exceeded for user ${user.id} on create-payment`);
      return new Response(
        JSON.stringify({ 
          error: "Too many payment requests. Please wait a minute and try again." 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Update or insert rate limit record
    if (rateLimitData) {
      await supabaseAdmin
        .from("payment_rate_limits")
        .update({ request_count: rateLimitData.request_count + 1 })
        .eq("user_id", user.id)
        .eq("endpoint", "create-payment")
        .gte("window_start", oneMinuteAgo);
    } else {
      await supabaseAdmin
        .from("payment_rate_limits")
        .insert({
          user_id: user.id,
          endpoint: "create-payment",
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    const { priceId, currency } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    if (!currency) throw new Error("Currency is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: user.id,
        currency: currency,
      },
    });

    console.log(`Payment session created for user ${user.id} with currency ${currency}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
