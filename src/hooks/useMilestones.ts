import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useMilestones = () => {
  const { user } = useAuth();
  const [pendingMilestone, setPendingMilestone] = useState<string | null>(null);

  const checkMilestones = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Call the check_milestones function
      const { data, error } = await supabase
        .rpc('check_milestones', { target_user_id: user.id });

      if (error) {
        console.error('Error checking milestones:', error);
        return;
      }

      // Find the first uncelebrated milestone
      // Use Math.round() on any numeric values to prevent Supabase integer errors
      const uncelebrated = data?.find((m: { milestone_type: string; is_new: boolean }) => m.is_new);
      if (uncelebrated) {
        setPendingMilestone(uncelebrated.milestone_type);
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  }, [user?.id]);

  const celebrateMilestone = useCallback(async (milestoneType: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_milestones')
        .update({ celebrated: true })
        .eq('user_id', user.id)
        .eq('milestone_type', milestoneType);

      if (error) {
        console.error('Error marking milestone as celebrated:', error);
      }

      setPendingMilestone(null);
      
      // Check for more milestones
      await checkMilestones();
    } catch (error) {
      console.error('Error celebrating milestone:', error);
    }
  }, [user?.id, checkMilestones]);

  const dismissMilestone = useCallback(() => {
    setPendingMilestone(null);
  }, []);

  return {
    pendingMilestone,
    checkMilestones,
    celebrateMilestone,
    dismissMilestone
  };
};