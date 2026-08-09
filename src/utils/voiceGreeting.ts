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
    const message = `${greeting}, ${userName}! It's Nova. Welcome back!`;
    
    console.log('Speaking greeting:', message);
    
    // Use browser speech synthesis (FREE)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95; // Slightly slower for more natural speech
      utterance.pitch = 1.1; // Slightly higher pitch for warm voice
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      // Select a warm voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('victoria') ||
         voice.name.toLowerCase().includes('karen') ||
         voice.name.toLowerCase().includes('moira') ||
         voice.name.toLowerCase().includes('susan'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
      }
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
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
    const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.display_name;
    
    if (metadataName) {
      return metadataName;
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
