import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      return data as SubscriptionData;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Auto-refresh on mount and when user changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  const isSubscribed = data?.subscribed ?? false;
  const productId = data?.product_id;
  const subscriptionEnd = data?.subscription_end;

  return {
    isSubscribed,
    productId,
    subscriptionEnd,
    isLoading,
    error,
    refetch,
  };
};
