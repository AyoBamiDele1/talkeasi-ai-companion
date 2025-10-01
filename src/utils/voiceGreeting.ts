import { supabase } from '@/integrations/supabase/client';

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Hello';
  }
};

export const speakGreeting = async (userName: string): Promise<void> => {
  try {
    const greeting = getTimeBasedGreeting();
    const message = `${greeting}, ${userName}! Welcome back to TalkEasi.`;
    
    console.log('Speaking greeting:', message);
    
    // Use text-to-speech edge function
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { 
        text: message,
        voice: 'alloy'
      }
    });

    if (error) {
      console.error('TTS greeting error:', error);
      return;
    }

    if (data?.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      await audio.play();
    }
  } catch (error) {
    console.error('Error playing greeting:', error);
  }
};

export const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    // First, try to get from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profileError && profileData?.display_name) {
      return profileData.display_name;
    }

    // Fallback to user metadata if profile doesn't have display_name
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    
    // Final fallback - use email first name or "friend"
    if (user?.email) {
      const firstName = user.email.split('@')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }

    return 'friend';
  } catch (error) {
    console.error('Error fetching display name:', error);
    return 'friend';
  }
};

