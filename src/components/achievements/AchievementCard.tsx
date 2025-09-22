import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Achievement } from "@/hooks/useAchievements";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
  size?: 'small' | 'large';
}

export const AchievementCard = ({ achievement, size = 'large' }: AchievementCardProps) => {
  const IconComponent = Icons[achievement.icon as keyof typeof Icons] as any;
  
  const isSmall = size === 'small';
  
  return (
    <Card className={cn(
      "transition-all duration-200",
      achievement.unlocked 
        ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-sm" 
        : "bg-muted/30 border-muted opacity-60",
      isSmall ? "p-2" : "p-4"
    )}>
      <CardContent className={cn("p-0 flex items-center", isSmall ? "gap-2" : "gap-4")}>
        <div className={cn(
          "rounded-full flex items-center justify-center flex-shrink-0",
          achievement.unlocked 
            ? "bg-primary text-primary-foreground shadow-lg" 
            : "bg-muted text-muted-foreground",
          isSmall ? "w-8 h-8" : "w-12 h-12"
        )}>
          {IconComponent && (
            <IconComponent size={isSmall ? 16 : 24} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-semibold truncate",
              isSmall ? "text-sm" : "text-base",
              achievement.unlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {achievement.name}
            </h3>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs flex-shrink-0",
                achievement.unlocked && "bg-primary/10 text-primary"
              )}
            >
              +{achievement.points}
            </Badge>
          </div>
          
          <p className={cn(
            "text-muted-foreground",
            isSmall ? "text-xs" : "text-sm",
            isSmall && "line-clamp-1"
          )}>
            {achievement.description}
          </p>
          
          {achievement.unlocked && achievement.unlocked_at && !isSmall && (
            <p className="text-xs text-primary/70 mt-1">
              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};