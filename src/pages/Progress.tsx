import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Calendar, TrendingUp, Award, AlertCircle } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementsSection } from "@/components/achievements/AchievementsSection";
import StreakDisplay from "@/components/StreakDisplay";

const Progress = () => {
  const { stats, loading } = useProgress();
  const { achievements, totalPoints, loading: achievementsLoading, checkAndUnlockAchievements } = useAchievements();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Your Progress</h1>
          <p className="text-muted-foreground">Complete some lessons to see your progress!</p>
        </div>
      </div>
    );
  }

  const weeklyProgress = stats.recentActivity.map((activity, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    completed: activity.completed
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track your English improvement journey
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Lessons
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {stats.completedLessons}/{stats.totalLessons}
            </div>
            <ProgressBar value={(stats.completedLessons / stats.totalLessons) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {stats.accuracyScore}%
            </div>
            <ProgressBar value={stats.accuracyScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Weekly Streak */}
      <div className="mb-6">
        <StreakDisplay />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-2xl font-bold text-primary">{weeklyProgress.filter(day => day.completed).length}</div>
              <div className="text-sm text-muted-foreground">This week</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-muted-foreground">{Math.round((stats.accuracyScore + stats.fluencyScore) / 2)}%</div>
              <div className="text-sm text-muted-foreground">Avg score</div>
            </div>
          </div>
          
          <div className="flex justify-between">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-2">{day.day}</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  day.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {day.completed && <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div className="mb-6">
        <AchievementsSection 
          achievements={achievements}
          totalPoints={totalPoints}
          loading={achievementsLoading}
        />
      </div>

      {/* Common Mistakes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.commonMistakes.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.mistake}</div>
                  <div className="text-xs text-muted-foreground">{item.count} times</div>
                </div>
                <Badge 
                  variant={item.improving ? "default" : "secondary"}
                  className={item.improving ? "bg-green-100 text-green-800" : ""}
                >
                  {item.improving ? "Improving" : "Practice more"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;