import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePremiumAccess = () => {
  const { user } = useAuth();

  const { data: hasPremiumAccess = false, isLoading } = useQuery({
    queryKey: ['premium-access', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('credit_purchases')
        .select('currency')
        .eq('user_id', user.id)
        .in('currency', ['USD', 'GBP'])
        .limit(1);

      if (error) {
        console.error('Error checking premium access:', error);
        return false;
      }

      return data && data.length > 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasPremiumAccess,
    isLoading,
  };
};
