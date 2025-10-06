import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target } from "lucide-react";

interface ProfileLearningGoalsProps {
  onBack: () => void;
}

const ProfileLearningGoals = ({ onBack }: ProfileLearningGoalsProps) => {
  const [selectedGoals] = useState<string[]>(["Fluency", "Conversation Skills"]);

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
            <p className="text-foreground mb-4">
              Your current learning focus: <strong>Fluency & Conversation Skills</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.map(goal => 
                <Badge key={goal} variant="default" className="bg-primary">
                  {goal}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileLearningGoals;
