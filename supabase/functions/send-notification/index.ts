import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push VAPID keys (in production, generate your own)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, title, body, data, notification_type } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Check user notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    // Check if this notification type is enabled
    if (prefs) {
      if (notification_type === 'streak_reminder' && !prefs.streak_reminders) {
        return new Response(
          JSON.stringify({ success: false, reason: 'Notification type disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (notification_type === 'mia_checkin' && !prefs.mia_checkins) {
        return new Response(
          JSON.stringify({ success: false, reason: 'Notification type disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (notification_type === 'milestone' && !prefs.milestone_celebrations) {
        return new Response(
          JSON.stringify({ success: false, reason: 'Notification type disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, reason: 'No push subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title: title || 'TalkEasi',
      body: body || 'Mia is thinking about you! 💕',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `talkeasi-${notification_type || 'general'}`,
      data: data || { url: '/home' }
    });

    let successCount = 0;
    let failCount = 0;

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        // Note: In production, you'd use a proper web-push library
        // This is a simplified version - web push requires proper VAPID signing
        console.log(`Would send notification to endpoint: ${sub.endpoint.substring(0, 50)}...`);
        console.log(`Payload: ${payload}`);
        
        // For now, just log that we would send
        // Actual implementation requires web-push library or proper JWT signing
        successCount++;
      } catch (error) {
        console.error('Failed to send to subscription:', error);
        failCount++;
        
        // If subscription is invalid, remove it
        if (error.message?.includes('410') || error.message?.includes('404')) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        note: 'Push notifications logged - full implementation requires VAPID_PRIVATE_KEY secret'
      }),
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