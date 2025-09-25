import { Flame, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStreak } from '@/hooks/useStreak';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface StreakDisplayProps {
  showTitle?: boolean;
  compact?: boolean;
}

const StreakDisplay = ({ showTitle = true, compact = false }: StreakDisplayProps) => {
  const { user } = useAuth();
  const { streakData, loading } = useStreak(user?.id);

  if (loading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        {showTitle && !compact && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Your Streak
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? "p-0" : ""}>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!streakData) return null;

  const getStreakMessage = (current: number) => {
    if (current === 0) return "Start your streak today!";
    if (current === 1) return "Great start! Keep it going!";
    if (current < 7) return "Building momentum!";
    if (current < 30) return "Excellent consistency!";
    return "Incredible dedication!";
  };

  const isStreakActive = streakData.currentStreak > 0;
  const lastActivity = streakData.lastActivityDate ? new Date(streakData.lastActivityDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isActivityToday = lastActivity && lastActivity.getTime() === today.getTime();

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Flame className={`w-6 h-6 ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
          <div>
            <div className="font-bold text-lg">{streakData.currentStreak}</div>
            <div className="text-xs text-muted-foreground">day streak</div>
          </div>
        </div>
        {streakData.longestStreak > 0 && (
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="font-semibold">{streakData.longestStreak}</div>
              <div className="text-xs text-muted-foreground">best</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Your Streak
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {streakData.currentStreak}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {streakData.currentStreak === 1 ? 'day streak' : 'day streak'}
            </div>
            <Badge variant={isStreakActive ? "default" : "secondary"} className="mb-2">
              {getStreakMessage(streakData.currentStreak)}
            </Badge>
            {isActivityToday && (
              <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                <Calendar className="w-3 h-3" />
                Active today
              </div>
            )}
          </div>

          {/* Longest Streak */}
          {streakData.longestStreak > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Longest Streak</span>
              </div>
              <span className="font-bold">{streakData.longestStreak} days</span>
            </div>
          )}

          {/* Last Activity */}
          {lastActivity && (
            <div className="text-center text-xs text-muted-foreground">
              Last activity: {lastActivity.toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakDisplay;