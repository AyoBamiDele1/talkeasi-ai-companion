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

    const { amount, description, metadata } = await req.json();

    if (!amount || amount <= 0) {
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
    const newBalance = currentBalance - amount;

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

    // Log transaction
    const { error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'usage',
        amount: -amount,
        balance_after: newBalance,
        description,
        metadata
      });

    if (txnError) {
      console.error('Failed to log transaction:', txnError);
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