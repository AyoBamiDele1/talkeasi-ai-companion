import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYSTACK-VERIFY] ${step}${detailsStr}`);
};

// Credit package mappings (1 credit = 1 minute)
const PACKAGE_CREDITS: Record<string, number> = {
  "snack": 60,
  "buddy": 200,
  "bestie": 500,
  "pro": 1000  // Super Fan
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { reference } = await req.json();
    if (!reference) throw new Error("Reference is required");
    logStep("Verifying reference", { reference });

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackKey}`,
        "Content-Type": "application/json"
      }
    });

    const verifyData = await response.json();
    logStep("Paystack verification response", { status: verifyData.status, txStatus: verifyData.data?.status });

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not verified" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const txData = verifyData.data;
    const metadata = txData.metadata || {};
    const userId = metadata.user_id;
    const packageKey = metadata.package_key || (metadata.is_subscription ? "pro" : null);
    const credits = metadata.credits || PACKAGE_CREDITS[packageKey] || 0;
    const isSubscription = metadata.is_subscription || false;

    if (!userId) {
      throw new Error("User ID not found in transaction metadata");
    }

    logStep("Transaction verified", { userId, packageKey, credits, isSubscription });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this transaction was already processed
    const { data: existingPurchase } = await supabaseAdmin
      .from("credit_purchases")
      .select("id")
      .eq("stripe_session_id", reference)
      .single();

    if (existingPurchase) {
      logStep("Transaction already processed", { reference });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment already processed",
        credits 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Insert purchase record (using stripe_session_id field for paystack reference)
    const amountPaid = txData.amount / 100; // Convert from kobo to Naira
    const { error: purchaseError } = await supabaseAdmin
      .from("credit_purchases")
      .insert({
        user_id: userId,
        credits_amount: credits,
        price_paid: amountPaid,
        currency: "NGN",
        stripe_session_id: reference // Reusing field for Paystack reference
      });

    if (purchaseError) {
      logStep("Error inserting purchase", { error: purchaseError });
      throw new Error("Failed to record purchase");
    }

    // Get current credit balance
    const { data: currentCredits } = await supabaseAdmin
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const newBalance = (currentCredits?.balance || 0) + credits;

    // Update user credits
    const { error: updateError } = await supabaseAdmin
      .from("user_credits")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) {
      logStep("Error updating credits", { error: updateError });
      throw new Error("Failed to update credits");
    }

    // Log transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: credits,
      balance_after: newBalance,
      description: `Purchased ${credits} credits via Paystack (NGN)`,
      metadata: {
        paystack_reference: reference,
        currency: "NGN",
        price_paid: amountPaid,
        is_subscription: isSubscription,
        package_key: packageKey
      }
    });

    logStep("Credits added successfully", { userId, credits, newBalance });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Payment verified and credits added",
      credits,
      newBalance
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
