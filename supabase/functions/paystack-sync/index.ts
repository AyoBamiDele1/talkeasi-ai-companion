import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[PAYSTACK-SYNC] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const PACKAGE_CREDITS: Record<string, number> = {
  snack: 60,
  buddy: 200,
  bestie: 500,
  pro: 1000,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY not set");

    log("Listing transactions for user", { email: user.email });

    // Pull recent transactions by customer email
    const listRes = await fetch(
      `https://api.paystack.co/transaction?customer=${encodeURIComponent(user.email ?? "")}&status=success&perPage=20`,
      { headers: { Authorization: `Bearer ${paystackKey}` } }
    );
    const listData = await listRes.json();

    if (!listData.status) {
      log("Paystack list failed", listData);
      return new Response(
        JSON.stringify({ success: false, message: "Could not fetch Paystack transactions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const txs: any[] = listData.data || [];
    log("Transactions fetched", { count: txs.length });

    let creditedTotal = 0;
    let processed = 0;
    let skipped = 0;
    const details: any[] = [];

    for (const tx of txs) {
      if (tx.status !== "success") continue;
      const reference = tx.reference as string;

      // Already processed?
      const { data: existing } = await supabase
        .from("credit_purchases")
        .select("id")
        .eq("stripe_session_id", reference)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      const metadata = tx.metadata || {};
      // Accept tx if metadata user_id matches OR reference matches our format pay_{user.id}_{pkg}_{ts}
      let pkgKey: string | null = metadata.package_key ?? null;
      let credits: number = Number(metadata.credits) || 0;
      const metaUser = metadata.user_id;

      if (!pkgKey && reference?.startsWith("pay_")) {
        const parts = reference.split("_");
        // pay_{uuid-with-hyphens-split}_{pkg}_{ts} — uuid contains 4 hyphens so split by _ won't work well
        // Use regex
        const m = reference.match(/^pay_([0-9a-f-]{36})_([a-z]+)_\d+$/i);
        if (m) {
          if (m[1] !== user.id) continue; // not this user
          pkgKey = m[2];
        }
      }

      if (metaUser && metaUser !== user.id) continue;
      if (!pkgKey) continue;
      if (!credits) credits = PACKAGE_CREDITS[pkgKey] || 0;
      if (!credits) continue;

      // Record purchase
      const amountPaid = (tx.amount || 0) / 100;
      const { error: purchaseError } = await supabase.from("credit_purchases").insert({
        user_id: user.id,
        credits_amount: credits,
        price_paid: amountPaid,
        currency: tx.currency || "NGN",
        stripe_session_id: reference,
      });
      if (purchaseError) {
        log("Purchase insert error", purchaseError);
        continue;
      }

      // Update balance
      const { data: currentCredits } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const newBalance = (currentCredits?.balance || 0) + credits;

      if (currentCredits) {
        await supabase
          .from("user_credits")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_credits")
          .insert({ user_id: user.id, balance: newBalance });
      }

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        type: "purchase",
        amount: credits,
        balance_after: newBalance,
        description: `Recovered ${credits} credits from Paystack (${pkgKey})`,
        metadata: {
          paystack_reference: reference,
          currency: tx.currency || "NGN",
          price_paid: amountPaid,
          package_key: pkgKey,
          recovered: true,
        },
      });

      creditedTotal += credits;
      processed++;
      details.push({ reference, credits, amount: amountPaid });
      log("Credited", { reference, credits, newBalance });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        skipped,
        creditedTotal,
        details,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
