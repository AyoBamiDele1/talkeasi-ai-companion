import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakUpdatedAt: string;
}

export const useStreak = (userId?: string) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStreakData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_activity_date, streak_updated_at')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setStreakData({
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        lastActivityDate: data.last_activity_date,
        streakUpdatedAt: data.streak_updated_at
      });
    } catch (error) {
      console.error('Error fetching streak data:', error);
      toast({
        title: "Error",
        description: "Failed to load streak data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStreaks = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc('update_user_streaks', {
        target_user_id: userId
      });

      if (error) throw error;

      // Refresh streak data after update
      await fetchStreakData();
    } catch (error) {
      console.error('Error updating streaks:', error);
      toast({
        title: "Error",
        description: "Failed to update streak data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStreakData();
  }, [userId]);

  return {
    streakData,
    loading,
    refetch: fetchStreakData,
    updateStreaks
  };
};