import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Coins, TrendingUp } from "lucide-react";
import { useCompanionProgress } from "@/hooks/useCompanionProgress";
import { useMoodTracking } from "@/hooks/useMoodTracking";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import StreakCalendar from "@/components/StreakCalendar";
import NovaOrb from "@/components/NovaOrb";
import NovaIcon from "@/components/NovaIcon";

const Progress = () => {
  const { data: stats, isLoading } = useCompanionProgress();
  const { getMoodStats } = useMoodTracking();
  const [moodStats, setMoodStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMoodStats();
  }, []);

  const loadMoodStats = async () => {
    const data = await getMoodStats();
    setMoodStats(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats || stats.conversationCount === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Your Journey</h1>
          <p className="text-muted-foreground">
            Track your conversations with Nova
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-4"><NovaOrb size="lg" /></div>
          <p className="text-muted-foreground mb-6">
            Have your first conversation to see your progress here!
          </p>
          <Button onClick={() => navigate('/home')} size="lg">
            Talk to Nova
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Journey
        </h1>
        <p className="text-muted-foreground">
          Track your conversations with Nova
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {formatDuration(stats.totalTalkTimeMinutes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <NovaIcon size="sm" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {stats.conversationCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </div>
            {stats.longestStreak > stats.currentStreak && (
              <p className="text-xs text-muted-foreground mt-1">
                Best: {stats.longestStreak} days
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {stats.creditsUsedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">credits used</p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Calendar */}
      <div className="mb-6">
        <StreakCalendar
          weeklyActivity={stats.weeklyActivity}
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />
      </div>

      {/* Mood Impact - Only show if user has mood data */}
      {moodStats && moodStats.totalConversations >= 3 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Mood Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {moodStats.improvementPercentage > 0 ? '+' : ''}{moodStats.improvementPercentage}%
              </div>
              <p className="text-sm text-muted-foreground">
                average mood improvement after talking with Nova
              </p>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Before: </span>
                  <span className="font-medium">{moodStats.avgMoodBefore}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">After: </span>
                  <span className="font-medium">{moodStats.avgMoodAfter}/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Activity Bar Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end gap-2">
            {stats.weeklyActivity.map((day, index) => {
              const dayName = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index];
              const height = day.minutes > 0 ? Math.min(100, (day.minutes / 30) * 100) : 8;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${height}px`,
                      backgroundColor: day.hadConversation 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(var(--muted) / 0.3)',
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{dayName}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentSessions.map((session, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-3 rounded-lg bg-muted/20"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(session.durationMinutes)} min · {session.creditsUsed} credits
                  </p>
                </div>
                <NovaIcon size="sm" className="opacity-60" />
              </div>
            ))}
            {stats.recentSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent conversations
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;
