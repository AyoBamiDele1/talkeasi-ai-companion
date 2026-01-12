import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRealtimeCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchCredits = async () => {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setCredits(data.balance);
      }
      setLoading(false);
    };

    fetchCredits();

    // Set up realtime subscription
    const channel = supabase
      .channel('user-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Realtime] Credits updated:', payload);
          if (payload.new && 'balance' in payload.new) {
            setCredits(payload.new.balance as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setCredits(data.balance);
    }
  };

  // Calculate estimated time (1 credit = 1 minute)
  const estimatedMinutes = credits;
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const remainingMinutes = estimatedMinutes % 60;

  const formattedTime = estimatedHours > 0 
    ? `${estimatedHours}h ${remainingMinutes}m`
    : `${estimatedMinutes} min`;

  return {
    credits,
    loading,
    refetch,
    estimatedMinutes,
    estimatedHours,
    remainingMinutes,
    formattedTime
  };
};
