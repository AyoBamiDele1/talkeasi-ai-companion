import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`Received webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const currency = session.metadata?.currency;

      if (!userId || !currency) {
        console.error("Missing user_id or currency in session metadata");
        return new Response("Missing required metadata", { status: 400 });
      }

      // Get line items to determine credits purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      
      if (!priceId) {
        console.error("No price ID found in line items");
        return new Response("No price ID found", { status: 400 });
      }

      // Map actual Stripe price IDs to credit amounts
      const priceToCredits: Record<string, number> = {
        // Credit packages
        "price_1SWMK92dz9WA913sD8RjAHqP": 50,   // 50 credits
        "price_1SWMKP2dz9WA913sbt0ftTUf": 100,  // 100 credits
        "price_1SWMKe2dz9WA913sV9VkYNyE": 200,  // 200 credits
        // Pro subscription (600 credits/month)
        "price_1SWMKu2dz9WA913sJSKAHETl": 600,  // Pro Plan
      };

      const credits = priceToCredits[priceId] || 0;
      const amountPaid = (session.amount_total || 0) / 100; // Convert from cents

      // Initialize Supabase with service role key
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Insert purchase record
      const { error: purchaseError } = await supabaseAdmin
        .from("credit_purchases")
        .insert({
          user_id: userId,
          credits_amount: credits,
          price_paid: amountPaid,
          currency: currency,
          stripe_session_id: session.id,
        });

      if (purchaseError) {
        console.error("Error inserting purchase record:", purchaseError);
        return new Response(JSON.stringify({ error: purchaseError.message }), {
          status: 500,
        });
      }

      // Update user credits
      const { data: currentCredits, error: fetchError } = await supabaseAdmin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching current credits:", fetchError);
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
        });
      }

      const newBalance = (currentCredits?.balance || 0) + credits;

      const { error: updateError } = await supabaseAdmin
        .from("user_credits")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
        });
      }

      // Log transaction
      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        type: "purchase",
        amount: credits,
        balance_after: newBalance,
        description: `Purchased ${credits} credits (${currency})`,
        metadata: {
          stripe_session_id: session.id,
          currency: currency,
          price_paid: amountPaid,
        },
      });

      console.log(
        `Successfully processed payment for user ${userId}: ${credits} credits (${currency})`
      );
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
