import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYSTACK-PAYMENT] ${step}${detailsStr}`);
};

// Credit packages with relationship-based naming (NGN)
const CREDIT_PACKAGES: Record<string, { credits: number; amountKobo: number; name: string }> = {
  "snack": { credits: 60, amountKobo: 70000, name: "Snack Pack - 60 Credits (1 Hour)" },      // ₦700
  "buddy": { credits: 200, amountKobo: 195000, name: "Buddy Pack - 200 Credits (3.3 Hours)" }, // ₦1,950
  "bestie": { credits: 500, amountKobo: 450000, name: "Bestie Pack - 500 Credits (8.3 Hours)" } // ₦4,500
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
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
      .from("payment_rate_limits")
      .select("request_count")
      .eq("user_id", user.id)
      .eq("endpoint", "paystack-payment")
      .gte("window_start", oneMinuteAgo)
      .single();

    if (rateLimitError && rateLimitError.code !== "PGRST116") {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (rateLimitData && rateLimitData.request_count >= 5) {
      logStep("Rate limit exceeded");
      return new Response(
        JSON.stringify({ error: "Too many payment requests. Please wait a minute." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    if (rateLimitData) {
      await supabaseAdmin
        .from("payment_rate_limits")
        .update({ request_count: rateLimitData.request_count + 1 })
        .eq("user_id", user.id)
        .eq("endpoint", "paystack-payment")
        .gte("window_start", oneMinuteAgo);
    } else {
      await supabaseAdmin
        .from("payment_rate_limits")
        .insert({
          user_id: user.id,
          endpoint: "paystack-payment",
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    const { packageKey } = await req.json();
    if (!packageKey) throw new Error("Package key is required");

    const pkg = CREDIT_PACKAGES[packageKey];
    if (!pkg) throw new Error("Invalid package selected");
    logStep("Package selected", { packageKey, pkg });

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    const origin = req.headers.get("origin") || "https://your-app.lovable.app";
    const reference = `pay_${user.id}_${packageKey}_${Date.now()}`;

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: user.email,
        amount: pkg.amountKobo,
        currency: "NGN",
        reference,
        callback_url: `${origin}/payment-success?provider=paystack&reference=${reference}`,
        metadata: {
          user_id: user.id,
          package_key: packageKey,
          credits: pkg.credits,
          custom_fields: [
            { display_name: "Package", variable_name: "package", value: pkg.name },
            { display_name: "Credits", variable_name: "credits", value: pkg.credits.toString() }
          ]
        }
      })
    });

    const paystackData = await response.json();
    logStep("Paystack response", { status: paystackData.status, message: paystackData.message });

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Failed to initialize Paystack transaction");
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
