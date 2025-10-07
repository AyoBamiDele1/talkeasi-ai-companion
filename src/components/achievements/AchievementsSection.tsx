import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, CheckCircle } from "lucide-react";
import { AchievementCard } from "./AchievementCard";
import { Achievement } from "@/hooks/useAchievements";

interface AchievementsSectionProps {
  achievements: Achievement[];
  totalPoints?: number;
  loading: boolean;
  simplified?: boolean;
}

export const AchievementsSection = ({ achievements, totalPoints, loading, simplified = false }: AchievementsSectionProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simplified version for MVP
  if (simplified) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievements
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {achievements.map((achievement) => (
            <AchievementCard 
              key={achievement.id} 
              achievement={achievement} 
              size="small"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Full version (for future use)
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const categories = [...new Set(achievements.map(a => a.category))];
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'beginner': return Star;
      case 'progress': return Trophy;
      case 'streak': return Target;
      case 'performance': return CheckCircle;
      case 'dedication': return Trophy;
      default: return Star;
    }
  };

  const getCategoryAchievements = (category: string) => 
    achievements.filter(a => a.category === category);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievements
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{unlockedAchievements.length}/{achievements.length} Unlocked</span>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {Math.round((unlockedAchievements.length / achievements.length) * 100)}% Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {categories.slice(0, 4).map(category => (
              <TabsTrigger key={category} value={category} className="text-xs capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="space-y-3">
            {achievements.map((achievement) => (
              <AchievementCard 
                key={achievement.id} 
                achievement={achievement} 
                size="small"
              />
            ))}
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-3">
              {getCategoryAchievements(category).map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  size="small"
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};