import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ModeStats {
  mode: string;
  sessions: number;
  totalMinutes: number;
  creditsSpent: number;
}

export const useUsageAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['usage-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('amount, metadata, created_at')
        .eq('user_id', user.id)
        .eq('type', 'usage')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate by mode
      const modeMap = new Map<string, ModeStats>();
      
      transactions?.forEach((tx) => {
        const metadata = tx.metadata as Record<string, any> | null;
        const mode = metadata?.mode || 'unknown';
        const minutes = metadata?.duration_minutes || 0;
        
        if (!modeMap.has(mode)) {
          modeMap.set(mode, {
            mode,
            sessions: 0,
            totalMinutes: 0,
            creditsSpent: 0
          });
        }
        
        const stats = modeMap.get(mode)!;
        stats.sessions += 1;
        stats.totalMinutes += minutes;
        stats.creditsSpent += Math.abs(tx.amount);
      });

      const modeStats = Array.from(modeMap.values())
        .sort((a, b) => b.sessions - a.sessions);

      return {
        modeStats,
        totalSessions: transactions?.length || 0,
        recentTransactions: transactions?.slice(0, 5) || []
      };
    },
    enabled: !!user?.id
  });
};
