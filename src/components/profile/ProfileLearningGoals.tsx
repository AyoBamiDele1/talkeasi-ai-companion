import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileLearningGoalsProps {
  onBack: () => void;
}

const ProfileLearningGoals = ({ onBack }: ProfileLearningGoalsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('learning_goals')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setGoals(data?.learning_goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeGoal = async (goalToRemove: string) => {
    if (!user) return;

    const updatedGoals = goals.filter(goal => goal !== goalToRemove);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ learning_goals: updatedGoals })
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(updatedGoals);
      toast({
        title: "Goal removed",
        description: `"${goalToRemove}" has been removed from your learning goals.`,
      });
    } catch (error) {
      console.error('Error removing goal:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Goals</h1>
          <p className="text-muted-foreground text-sm">Your current learning focus</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Your Learning Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Click the × icon to remove a goal from your learning focus
            </p>
            {goals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => 
                  <Badge key={goal} variant="default" className="bg-primary pr-1 flex items-center gap-1">
                    {goal}
                    <button
                      onClick={() => removeGoal(goal)}
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      aria-label={`Remove ${goal}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No learning goals set yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileLearningGoals;
