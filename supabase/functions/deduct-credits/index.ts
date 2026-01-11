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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { amount, description, metadata, mode, duration_minutes } = await req.json();

    // Calculate credits: 1 credit = 1 minute (simplified pricing)
    let creditsToDeduct = amount;
    if (duration_minutes) {
      creditsToDeduct = Math.ceil(duration_minutes);
      console.log(`Deducting credits: ${duration_minutes} min = ${creditsToDeduct} credits (1 credit/min)`);
    }

    if (!creditsToDeduct || creditsToDeduct <= 0) {
      throw new Error('Invalid amount');
    }

    // Get current balance
    const { data: creditData, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      throw new Error('Failed to fetch credits');
    }

    const currentBalance = creditData.balance;
    const newBalance = currentBalance - creditsToDeduct;

    if (newBalance < 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits', current_balance: currentBalance }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to update balance');
    }

    // Log transaction with enhanced metadata (1 credit = 1 minute)
    const enrichedMetadata = {
      ...metadata,
      duration_minutes: duration_minutes || 0,
      credits_per_minute: 1,
      calculated_at: new Date().toISOString()
    };

    const { error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'usage',
        amount: -creditsToDeduct,
        balance_after: newBalance,
        description,
        metadata: enrichedMetadata
      });

    if (txnError) {
      console.error('Failed to log transaction:', txnError);
    }

    // Update streak tracking and first conversation
    try {
      // Update last activity date
      const today = new Date().toISOString().split('T')[0];
      
      // Check if this is first conversation
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_conversation_at')
        .eq('user_id', user.id)
        .single();

      const updates: any = { last_activity_date: today };
      if (!profile?.first_conversation_at) {
        updates.first_conversation_at = new Date().toISOString();
      }

      await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      // Call the streak calculation function
      await supabase.rpc('update_user_streaks', { target_user_id: user.id });
      console.log('Streak tracking updated for user:', user.id);

      // Check milestones
      await supabase.rpc('check_milestones', { target_user_id: user.id });
      console.log('Milestones checked for user:', user.id);
    } catch (streakError) {
      console.error('Failed to update streak/milestones:', streakError);
      // Don't fail the entire request if streak update fails
    }

    return new Response(
      JSON.stringify({ success: true, new_balance: newBalance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});