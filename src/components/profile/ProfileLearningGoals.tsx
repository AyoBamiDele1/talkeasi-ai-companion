import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Target, Save, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface ProfileLearningGoalsProps {
  onBack: () => void;
}
const ProfileLearningGoals = ({
  onBack
}: ProfileLearningGoalsProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const availableGoals = ["Business Communication", "Fluency", "Pronunciation", "Grammar Mastery", "Vocabulary Building", "Conversation Skills", "Academic English", "Travel English", "Job Interview Prep", "Public Speaking", "Writing Skills", "Listening Comprehension", "Cultural Understanding", "Accent Reduction", "Technical English"];
  useEffect(() => {
    fetchCurrentGoals();
  }, [user]);
  const fetchCurrentGoals = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('learning_goals').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching goals:', error);
        return;
      }
      if (data?.learning_goals) {
        setSelectedGoals(data.learning_goals);
      } else {
        // Default goals if none exist
        setSelectedGoals(['Business Communication', 'Fluency']);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };
  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      } else {
        return [...prev, goal];
      }
    });
  };
  const handleSave = async () => {
    if (!user) return;
    if (selectedGoals.length === 0) {
      toast({
        title: "Select at least one goal",
        description: "Please choose at least one learning goal to continue.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        user_id: user.id,
        learning_goals: selectedGoals
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Goals updated",
        description: "Your learning goals have been saved successfully."
      });
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Error",
        description: "Failed to save goals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Goals</h1>
          <p className="text-muted-foreground text-sm">Choose what you want to achieve</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Selected Goals ({selectedGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGoals.length > 0 ? <div className="flex flex-wrap gap-2">
                {selectedGoals.map(goal => <Badge key={goal} variant="default" className="bg-primary cursor-pointer hover:bg-primary/80" onClick={() => toggleGoal(goal)}>
                    {goal} ×
                  </Badge>)}
              </div> : <p className="text-muted-foreground text-sm">
                No goals selected. Choose from the options below.
              </p>}
          </CardContent>
        </Card>

        {/* Available Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Available Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availableGoals.map(goal => <div key={goal} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleGoal(goal)}>
                  <Checkbox checked={selectedGoals.includes(goal)} onChange={() => toggleGoal(goal)} className="pointer-events-none" />
                  <label className="text-sm font-medium cursor-pointer flex-1">
                    {goal}
                  </label>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="border-primary/20 bg-primary/5">
          
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading || selectedGoals.length === 0} className="w-full">
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
          Save Learning Goals
        </Button>
      </div>
    </div>;
};
export default ProfileLearningGoals;