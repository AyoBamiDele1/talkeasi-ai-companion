import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYSTACK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Super Fan: ₦9,500/month = 950000 kobo
const PRO_PLAN = {
  amountKobo: 950000,
  credits: 1000,
  name: "Super Fan - 1,000 Credits/month (16.6 Hours)"
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: rateLimitData } = await supabaseAdmin
      .from("payment_rate_limits")
      .select("request_count")
      .eq("user_id", user.id)
      .eq("endpoint", "paystack-subscription")
      .gte("window_start", oneMinuteAgo)
      .single();

    if (rateLimitData && rateLimitData.request_count >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a minute." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    if (rateLimitData) {
      await supabaseAdmin
        .from("payment_rate_limits")
        .update({ request_count: rateLimitData.request_count + 1 })
        .eq("user_id", user.id)
        .eq("endpoint", "paystack-subscription");
    } else {
      await supabaseAdmin
        .from("payment_rate_limits")
        .insert({
          user_id: user.id,
          endpoint: "paystack-subscription",
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    const origin = req.headers.get("origin") || "https://your-app.lovable.app";
    const reference = `sub_${user.id}_pro_${Date.now()}`;

    // For Paystack subscriptions, we create a plan first or use an existing one
    // Then initialize a transaction with the plan code
    // For simplicity, we'll create a one-time payment that will be recurring via webhook setup
    
    // Initialize Paystack transaction for subscription
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email,
        amount: PRO_PLAN.amountKobo,
        currency: "NGN",
        reference,
        callback_url: `${origin}/subscription-success?provider=paystack&reference=${reference}`,
        channels: ["card"],
        metadata: {
          user_id: user.id,
          plan_type: "pro",
          credits: PRO_PLAN.credits,
          is_subscription: true,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: PRO_PLAN.name },
            { display_name: "Credits", variable_name: "credits", value: PRO_PLAN.credits.toString() }
          ]
        }
      })
    });

    const paystackData = await response.json();
    logStep("Paystack response", { status: paystackData.status });

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Failed to initialize Paystack subscription");
    }

    return new Response(JSON.stringify({ 
      url: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
