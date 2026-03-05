import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    const user = userData.user;
    const body = await req.json();
    const { action } = body;

    console.log(`[gift-credits] Action: ${action}, User: ${user.id}`);

    // Handle different actions
    if (action === 'send') {
      const { recipient_email, credits_amount, message } = body;

      if (!recipient_email || !credits_amount) {
        throw new Error("Missing required fields: recipient_email and credits_amount");
      }

      // Input validation
      if (typeof recipient_email !== 'string' || recipient_email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) {
        throw new Error("Invalid email address");
      }

      if (typeof credits_amount !== 'number' || !Number.isInteger(credits_amount) || credits_amount < 5 || credits_amount > 500) {
        throw new Error("Credits must be an integer between 5 and 500");
      }

      if (message && (typeof message !== 'string' || message.length > 500)) {
        throw new Error("Message must be under 500 characters");
      }

      // Check sender's balance
      const { data: senderCredits, error: creditsError } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (creditsError || !senderCredits) {
        throw new Error("Failed to fetch sender credits");
      }

      if (senderCredits.balance < credits_amount) {
        throw new Error(`Insufficient credits. You have ${senderCredits.balance} credits.`);
      }

      // Deduct credits from sender
      const newBalance = senderCredits.balance - credits_amount;
      const { error: deductError } = await supabaseAdmin
        .from('user_credits')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (deductError) {
        throw new Error("Failed to deduct credits from sender");
      }

      // Log the transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'gift_sent',
          amount: -credits_amount,
          balance_after: newBalance,
          description: `Gift sent to ${recipient_email}`,
          metadata: { recipient_email }
        });

      // Check if recipient already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const recipientUser = existingUser?.users?.find(u => u.email === recipient_email);

      // Create the gift record
      const { data: gift, error: giftError } = await supabaseAdmin
        .from('credit_gifts')
        .insert({
          sender_id: user.id,
          recipient_email: recipient_email.toLowerCase(),
          recipient_id: recipientUser?.id || null,
          credits_amount,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single();

      if (giftError) {
        // Refund on failure
        await supabaseAdmin
          .from('user_credits')
          .update({ balance: senderCredits.balance })
          .eq('user_id', user.id);
        throw new Error("Failed to create gift");
      }

      console.log(`[gift-credits] Gift created: ${gift.id}, code: ${gift.gift_code}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          gift_code: gift.gift_code,
          message: `Gift of ${credits_amount} credits sent to ${recipient_email}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'claim') {
      const { gift_code } = body;

      if (!gift_code) {
        throw new Error("Missing gift code");
      }

      // Find the gift
      const { data: gift, error: giftError } = await supabaseAdmin
        .from('credit_gifts')
        .select('*')
        .eq('gift_code', gift_code)
        .single();

      if (giftError || !gift) {
        throw new Error("Gift not found");
      }

      if (gift.status !== 'pending') {
        throw new Error(`Gift has already been ${gift.status}`);
      }

      if (new Date(gift.expires_at) < new Date()) {
        await supabaseAdmin
          .from('credit_gifts')
          .update({ status: 'expired' })
          .eq('id', gift.id);
        throw new Error("Gift has expired");
      }

      // Verify recipient email matches
      if (gift.recipient_email !== user.email?.toLowerCase()) {
        throw new Error("This gift was sent to a different email address");
      }

      // Get recipient's current balance
      const { data: recipientCredits, error: rcError } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (rcError) {
        // User might not have credits yet, create them
        await supabaseAdmin
          .from('user_credits')
          .upsert({ user_id: user.id, balance: 0 });
      }

      const currentBalance = recipientCredits?.balance || 0;
      const newBalance = currentBalance + gift.credits_amount;

      // Add credits to recipient
      const { error: addError } = await supabaseAdmin
        .from('user_credits')
        .upsert({ 
          user_id: user.id, 
          balance: newBalance, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });

      if (addError) {
        throw new Error("Failed to add credits");
      }

      // Log the transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'gift_received',
          amount: gift.credits_amount,
          balance_after: newBalance,
          description: 'Gift received',
          metadata: { gift_id: gift.id, sender_id: gift.sender_id }
        });

      // Mark gift as claimed
      await supabaseAdmin
        .from('credit_gifts')
        .update({ 
          status: 'claimed', 
          claimed_at: new Date().toISOString(),
          recipient_id: user.id
        })
        .eq('id', gift.id);

      console.log(`[gift-credits] Gift claimed: ${gift.id} by ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          credits_received: gift.credits_amount,
          new_balance: newBalance,
          message: gift.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'list_sent') {
      const { data: gifts, error } = await supabaseAdmin
        .from('credit_gifts')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error("Failed to fetch sent gifts");
      }

      return new Response(
        JSON.stringify({ success: true, gifts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'list_received') {
      const { data: gifts, error } = await supabaseAdmin
        .from('credit_gifts')
        .select('*')
        .eq('recipient_email', user.email?.toLowerCase() || '')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error("Failed to fetch received gifts");
      }

      return new Response(
        JSON.stringify({ success: true, gifts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error("Invalid action");
    }

  } catch (error) {
    console.error('[gift-credits] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
