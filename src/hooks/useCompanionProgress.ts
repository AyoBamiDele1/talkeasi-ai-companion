import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CompanionStats {
  totalTalkTimeMinutes: number;
  conversationCount: number;
  currentStreak: number;
  longestStreak: number;
  creditsUsedThisMonth: number;
  recentSessions: Array<{
    date: string;
    durationMinutes: number;
    creditsUsed: number;
  }>;
  weeklyActivity: Array<{
    date: string;
    hadConversation: boolean;
    minutes: number;
  }>;
}

export const useCompanionProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['companion-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Fetch all usage transactions
      const { data: transactions, error: txError } = await supabase
        .from('credit_transactions')
        .select('amount, metadata, created_at')
        .eq('user_id', user.id)
        .eq('type', 'usage')
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      // Fetch streak data from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Calculate total talk time and conversation count
      let totalMinutes = 0;
      let conversationCount = 0;

      transactions?.forEach((tx) => {
        const metadata = tx.metadata as Record<string, any> | null;
        const minutes = metadata?.duration_minutes || 0;
        totalMinutes += minutes;
        conversationCount += 1;
      });

      // Calculate credits used this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const creditsThisMonth = transactions
        ?.filter((tx) => new Date(tx.created_at) >= startOfMonth)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

      // Build recent sessions (last 10)
      const recentSessions = (transactions || []).slice(0, 10).map((tx) => {
        const metadata = tx.metadata as Record<string, any> | null;
        return {
          date: tx.created_at,
          durationMinutes: metadata?.duration_minutes || 0,
          creditsUsed: Math.abs(tx.amount),
        };
      });

      // Build weekly activity (last 7 days)
      const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];

        const dayTransactions = transactions?.filter((tx) => {
          const txDate = new Date(tx.created_at).toISOString().split('T')[0];
          return txDate === dateStr;
        }) || [];

        const dayMinutes = dayTransactions.reduce((sum, tx) => {
          const metadata = tx.metadata as Record<string, any> | null;
          return sum + (metadata?.duration_minutes || 0);
        }, 0);

        return {
          date: dateStr,
          hadConversation: dayTransactions.length > 0,
          minutes: dayMinutes,
        };
      });

      const stats: CompanionStats = {
        totalTalkTimeMinutes: Math.round(totalMinutes),
        conversationCount,
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        creditsUsedThisMonth: creditsThisMonth,
        recentSessions,
        weeklyActivity,
      };

      return stats;
    },
    enabled: !!user?.id,
  });
};
