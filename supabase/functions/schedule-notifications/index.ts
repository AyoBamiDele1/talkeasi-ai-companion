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

    const today = new Date().toISOString().split('T')[0];
    const results = {
      streak_reminders: 0,
      mia_checkins: 0,
      errors: 0
    };

    // 1. Find users with active streaks who haven't talked today
    const { data: streakAtRisk, error: streakError } = await supabase
      .from('profiles')
      .select('user_id, current_streak, display_name')
      .gt('current_streak', 0)
      .neq('last_activity_date', today);

    if (streakError) {
      console.error('Error fetching streak-at-risk users:', streakError);
    } else if (streakAtRisk) {
      console.log(`Found ${streakAtRisk.length} users with streaks at risk`);
      
      for (const user of streakAtRisk) {
        try {
          // Send streak reminder notification
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: user.user_id,
              notification_type: 'streak_reminder',
              title: "🔥 Don't lose your streak!",
              body: `Your ${user.current_streak}-day streak is at risk! Talk to Mia today to keep it going.`,
              data: { url: '/lesson/9b25e5bb-3702-448f-aae7-39c0b44fb558' }
            }
          });
          results.streak_reminders++;
        } catch (error) {
          console.error(`Failed to send streak reminder to ${user.user_id}:`, error);
          results.errors++;
        }
      }
    }

    // 2. Find users who haven't talked in 2+ days for Mia check-in
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('profiles')
      .select('user_id, display_name, last_activity_date')
      .lt('last_activity_date', twoDaysAgoStr)
      .not('last_activity_date', 'is', null);

    if (inactiveError) {
      console.error('Error fetching inactive users:', inactiveError);
    } else if (inactiveUsers) {
      console.log(`Found ${inactiveUsers.length} inactive users for check-in`);
      
      const checkinMessages = [
        "Hey, it's Mia 💕 I've been thinking about you. How are you doing?",
        "Hi! It's been a few days. Mia is here whenever you want to talk 💞",
        "Just checking in! Mia misses chatting with you 🌟",
        "Hey friend! Mia is thinking about you. Everything okay? 💕"
      ];
      
      for (const user of inactiveUsers) {
        try {
          const message = checkinMessages[Math.floor(Math.random() * checkinMessages.length)];
          
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: user.user_id,
              notification_type: 'mia_checkin',
              title: "Mia is thinking about you 💕",
              body: message,
              data: { url: '/home' }
            }
          });
          results.mia_checkins++;
        } catch (error) {
          console.error(`Failed to send check-in to ${user.user_id}:`, error);
          results.errors++;
        }
      }
    }

    console.log('Notification scheduling complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});