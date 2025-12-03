import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface MoodLog {
  id: string;
  mood_before: number | null;
  mood_after: number | null;
  conversation_id: string | null;
  created_at: string;
}

export const useMoodTracking = () => {
  const { user } = useAuth();
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  const logMoodBefore = useCallback(async (mood: number, conversationId?: string) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .insert({
          user_id: user.id,
          mood_before: mood,
          conversation_id: conversationId || null
        })
        .select('id')
        .single();

      if (error) throw error;

      setCurrentLogId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error logging mood before:', error);
      return null;
    }
  }, [user?.id]);

  const logMoodAfter = useCallback(async (mood: number, logId?: string) => {
    const targetId = logId || currentLogId;
    if (!user?.id || !targetId) return;

    try {
      const { error } = await supabase
        .from('mood_logs')
        .update({ mood_after: mood })
        .eq('id', targetId)
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentLogId(null);
    } catch (error) {
      console.error('Error logging mood after:', error);
    }
  }, [user?.id, currentLogId]);

  const getMoodStats = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('mood_before, mood_after, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const logsWithBoth = data.filter(log => log.mood_before && log.mood_after);
      
      if (logsWithBoth.length === 0) return null;

      const totalImprovement = logsWithBoth.reduce((sum, log) => {
        return sum + ((log.mood_after || 0) - (log.mood_before || 0));
      }, 0);

      const avgImprovement = totalImprovement / logsWithBoth.length;
      const improvementPercentage = Math.round((avgImprovement / 5) * 100);

      const avgMoodBefore = logsWithBoth.reduce((sum, log) => sum + (log.mood_before || 0), 0) / logsWithBoth.length;
      const avgMoodAfter = logsWithBoth.reduce((sum, log) => sum + (log.mood_after || 0), 0) / logsWithBoth.length;

      return {
        totalConversations: logsWithBoth.length,
        avgMoodBefore: Math.round(avgMoodBefore * 10) / 10,
        avgMoodAfter: Math.round(avgMoodAfter * 10) / 10,
        avgImprovement: Math.round(avgImprovement * 10) / 10,
        improvementPercentage,
        recentLogs: data.slice(0, 7)
      };
    } catch (error) {
      console.error('Error getting mood stats:', error);
      return null;
    }
  }, [user?.id]);

  return {
    currentLogId,
    logMoodBefore,
    logMoodAfter,
    getMoodStats
  };
};