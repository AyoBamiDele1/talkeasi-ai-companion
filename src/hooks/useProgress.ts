import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  accuracyScore: number;
  fluencyScore: number;
  currentStreak: number;
  recentActivity: Array<{
    date: string;
    completed: boolean;
  }>;
  commonMistakes: Array<{
    mistake: string;
    count: number;
    improving: boolean;
  }>;
}

export const useProgress = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressStats();
    }
  }, [user]);

  const fetchProgressStats = async () => {
    if (!user) return;

    try {
      // Fetch total MVP lessons (3 core lessons)
    const mvpLessonTitles = [
      'Friendly Chat',
      'Phone Conversation',
      'Job Interview Practice'
    ];
      
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .in('title', mvpLessonTitles);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const completedLessons = progressData?.length || 0;
      
      // Calculate average scores
      const avgAccuracy = progressData?.length 
        ? Math.round(progressData.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / progressData.length)
        : 0;
      
      const avgFluency = progressData?.length
        ? Math.round(progressData.reduce((sum, p) => sum + (p.fluency_score || 0), 0) / progressData.length)
        : 0;

      // Calculate streak (simplified - based on recent completions)
      const recentCompletions = progressData
        ?.filter(p => {
          const completedDate = new Date(p.completed_at || '');
          const daysDiff = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        }) || [];

      // Generate recent activity (last 7 days)
      const recentActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const hasCompletion = recentCompletions.some(p => {
          const completionDate = new Date(p.completed_at || '').toISOString().split('T')[0];
          return completionDate === dateStr;
        });

        return {
          date: dateStr,
          completed: hasCompletion
        };
      });

      // Mock common mistakes for now (would need more complex analysis)
      const commonMistakes = [
        { mistake: "Pronunciation clarity", count: Math.floor(Math.random() * 10 + 3), improving: true },
        { mistake: "Conversation flow", count: Math.floor(Math.random() * 8 + 2), improving: Math.random() > 0.5 },
        { mistake: "Grammar usage", count: Math.floor(Math.random() * 6 + 1), improving: true }
      ];

      setStats({
        totalLessons: totalLessons || 0,
        completedLessons,
        accuracyScore: avgAccuracy,
        fluencyScore: avgFluency,
        currentStreak: recentCompletions.length,
        recentActivity,
        commonMistakes
      });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchProgressStats };
};