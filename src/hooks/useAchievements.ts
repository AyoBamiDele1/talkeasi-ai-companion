import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: unlockedAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select(`
          unlocked_at,
          achievement_id,
          achievements (*)
        `)
        .eq('user_id', user.id);

      if (userError) throw userError;

      // Combine data
      const unlockedIds = new Set(unlockedAchievements?.map(ua => ua.achievement_id) || []);
      const combinedAchievements = allAchievements?.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        unlocked_at: unlockedAchievements?.find(ua => ua.achievement_id === achievement.id)?.unlocked_at
      })) || [];

      const unlocked = combinedAchievements.filter(a => a.unlocked);
      const points = unlocked.reduce((sum, a) => sum + a.points, 0);

      setAchievements(combinedAchievements);
      setUserAchievements(unlocked);
      setTotalPoints(points);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockAchievements = async () => {
    if (!user) return;

    try {
      await supabase.rpc('check_user_achievements', {
        check_user_id: user.id
      });
      
      // Refresh achievements after checking
      await fetchAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  return {
    achievements,
    userAchievements,
    totalPoints,
    loading,
    refetch: fetchAchievements,
    checkAndUnlockAchievements
  };
};