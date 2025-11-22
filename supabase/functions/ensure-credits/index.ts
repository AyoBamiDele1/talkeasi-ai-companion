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

    // Authenticate user from JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if email is verified - required to prevent abuse
    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: 'Email verification required', email_not_verified: true }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Optional initial balance (defaults to 8 welcome credits)
    const body = await req.json().catch(() => ({}));
    const startBalance = typeof body?.initial_balance === 'number' && body.initial_balance >= 0
      ? Math.floor(body.initial_balance)
      : 8;

    // Check if user already has a credits row
    const { data, error } = await supabase
      .from('user_credits')
      .select('id, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && (error as any).code !== 'PGRST116') {
      console.error('Failed checking user_credits:', error);
      return new Response(JSON.stringify({ error: 'Failed to check credits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (data) {
      // Already initialized
      return new Response(JSON.stringify({ created: false, balance: data.balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize credits row
    const { data: inserted, error: insertError } = await supabase
      .from('user_credits')
      .insert({ user_id: user.id, balance: startBalance })
      .select('balance')
      .single();

    if (insertError) {
      console.error('Failed inserting user_credits:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to initialize credits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log a grant transaction if we added a positive balance
    if (startBalance > 0) {
      const { error: txnError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'grant',
          amount: startBalance,
          balance_after: startBalance,
          description: 'Starter credits',
          metadata: { source: 'ensure-credits' }
        });
      if (txnError) {
        console.warn('Failed to log grant transaction:', txnError);
      }
    }

    return new Response(JSON.stringify({ created: true, balance: inserted.balance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('ensure-credits error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});