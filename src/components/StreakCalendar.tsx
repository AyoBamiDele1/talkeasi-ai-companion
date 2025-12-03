import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DayActivity {
  date: string;
  hadConversation: boolean;
  minutes: number;
}

interface StreakCalendarProps {
  weeklyActivity: DayActivity[];
  currentStreak: number;
  longestStreak: number;
}

const StreakCalendar = ({ weeklyActivity, currentStreak, longestStreak }: StreakCalendarProps) => {
  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  // Create activity map from weekly activity
  const activityMap = new Map(
    weeklyActivity.map(day => [day.date, day])
  );

  const getActivityLevel = (date: string) => {
    const activity = activityMap.get(date);
    if (!activity?.hadConversation) return 0;
    if (activity.minutes >= 15) return 3;
    if (activity.minutes >= 5) return 2;
    return 1;
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-xl">🔥</span>
          Streak Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Streak Stats */}
        <div className="flex justify-between mb-4 text-sm">
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-bold text-primary">{currentStreak} days</span>
          </div>
          <div>
            <span className="text-muted-foreground">Best: </span>
            <span className="font-bold">{longestStreak} days</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-10 gap-1">
          {last30Days.map((date, index) => {
            const level = getActivityLevel(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={date}
                className={cn(
                  "aspect-square rounded-sm flex items-center justify-center text-[10px]",
                  "transition-colors",
                  level === 0 && "bg-muted/30",
                  level === 1 && "bg-primary/30",
                  level === 2 && "bg-primary/60",
                  level === 3 && "bg-primary",
                  isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
                title={`${date}: ${activityMap.get(date)?.minutes || 0} minutes`}
              >
                {index >= 23 && (
                  <span className={cn(
                    level >= 2 ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {getDayLabel(date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;