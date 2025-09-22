import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Target, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_lessons: number;
  avg_accuracy: number;
  total_points: number;
  streak_days: number;
  rank: number;
}

const Leaderboards = () => {
  const { user } = useAuth();
  const [leaderboards, setLeaderboards] = useState({
    lessons: [] as LeaderboardUser[],
    accuracy: [] as LeaderboardUser[],
    points: [] as LeaderboardUser[],
    streak: [] as LeaderboardUser[]
  });
  const [loading, setLoading] = useState(true);
  const [userRankings, setUserRankings] = useState({
    lessons: 0,
    accuracy: 0,
    points: 0,
    streak: 0
  });

  const fetchLeaderboards = async () => {
    try {
      // Fetch lessons completed leaderboard
      const { data: lessonsData } = await supabase
        .from('user_progress')
        .select('user_id')
        .not('completed_at', 'is', null);

      // Fetch achievements for points leaderboard
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select(`
          user_id,
          achievement_id
        `);

      // Fetch achievement points
      const { data: achievementPoints } = await supabase
        .from('achievements')
        .select('id, points');

      // Process lessons data
      const lessonsMap = new Map();
      lessonsData?.forEach(record => {
        const userId = record.user_id;
        if (!lessonsMap.has(userId)) {
          lessonsMap.set(userId, {
            user_id: userId,
            display_name: 'Anonymous',
            avatar_url: undefined,
            total_lessons: 0,
            avg_accuracy: 0,
            total_points: 0,
            streak_days: 0
          });
        }
        lessonsMap.get(userId).total_lessons++;
      });

      // Process achievements data for points
      const pointsMap = new Map();
      achievementsData?.forEach(record => {
        const userId = record.user_id;
        if (!pointsMap.has(userId)) {
          pointsMap.set(userId, {
            user_id: userId,
            display_name: 'Anonymous',
            avatar_url: undefined,
            total_lessons: 0,
            avg_accuracy: 0,
            total_points: 0,
            streak_days: 0
          });
        }
        const achievementData = achievementPoints?.find(a => a.id === record.achievement_id);
        if (achievementData?.points) {
          pointsMap.get(userId).total_points += achievementData.points;
        }
      });

      // Get user profiles for both leaderboards
      const allUserIds = [...new Set([
        ...Array.from(lessonsMap.keys()),
        ...Array.from(pointsMap.keys())
      ])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', allUserIds);

      // Update with profile data
      profilesData?.forEach(profile => {
        if (lessonsMap.has(profile.user_id)) {
          const user = lessonsMap.get(profile.user_id);
          user.display_name = profile.display_name || 'Anonymous';
          user.avatar_url = profile.avatar_url;
        }
        if (pointsMap.has(profile.user_id)) {
          const user = pointsMap.get(profile.user_id);
          user.display_name = profile.display_name || 'Anonymous';
          user.avatar_url = profile.avatar_url;
        }
      });

      // Convert to arrays and add rankings
      const lessonsLeaderboard = Array.from(lessonsMap.values())
        .sort((a, b) => b.total_lessons - a.total_lessons)
        .slice(0, 50)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      const pointsLeaderboard = Array.from(pointsMap.values())
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 50)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setLeaderboards({
        lessons: lessonsLeaderboard,
        accuracy: [], // Placeholder
        points: pointsLeaderboard,
        streak: [] // Placeholder
      });

      // Calculate user rankings
      if (user) {
        const userLessonsRank = lessonsLeaderboard.findIndex(u => u.user_id === user.id) + 1;
        const userPointsRank = pointsLeaderboard.findIndex(u => u.user_id === user.id) + 1;
        
        setUserRankings({
          lessons: userLessonsRank || 0,
          accuracy: 0,
          points: userPointsRank || 0,
          streak: 0
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-gray-400";
    if (rank === 3) return "bg-amber-600";
    return "bg-muted";
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl mb-20">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Leaderboards</h1>
      </div>

      {/* User's Current Rankings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Lessons</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {userRankings.lessons || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                {userRankings.accuracy || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Points</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">
                {userRankings.points || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-500">
                {userRankings.streak || '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Most Lessons Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboards.lessons.map((userEntry) => (
                <div
                  key={userEntry.user_id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    userEntry.user_id === user?.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                    getRankBadgeColor(userEntry.rank)
                  )}>
                    {userEntry.rank <= 3 ? getRankIcon(userEntry.rank) : userEntry.rank}
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={userEntry.avatar_url} />
                    <AvatarFallback>
                      {userEntry.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">{userEntry.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {userEntry.total_lessons} lessons completed
                    </p>
                  </div>
                  
                  <Badge variant="secondary">
                    {userEntry.total_lessons}
                  </Badge>
                </div>
              ))}
              
              {leaderboards.lessons.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No data available yet. Complete some lessons to appear on the leaderboard!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Highest Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Accuracy leaderboard coming soon! Keep practicing to improve your scores.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Most Points Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboards.points.map((userEntry) => (
                <div
                  key={userEntry.user_id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    userEntry.user_id === user?.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                    getRankBadgeColor(userEntry.rank)
                  )}>
                    {userEntry.rank <= 3 ? getRankIcon(userEntry.rank) : userEntry.rank}
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={userEntry.avatar_url} />
                    <AvatarFallback>
                      {userEntry.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">{userEntry.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {userEntry.total_points} points earned
                    </p>
                  </div>
                  
                  <Badge variant="secondary">
                    {userEntry.total_points}
                  </Badge>
                </div>
              ))}
              
              {leaderboards.points.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No data available yet. Earn achievements to appear on the leaderboard!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streak">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Longest Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Streak leaderboard coming soon! Build daily learning habits to compete.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboards;