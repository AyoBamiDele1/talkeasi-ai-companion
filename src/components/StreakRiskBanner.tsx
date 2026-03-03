import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AI_COMPANION_ROUTE } from "@/config/companion";

interface StreakRiskBannerProps {
  currentStreak: number;
  lastActivityDate: string | null;
}

const StreakRiskBanner = ({ currentStreak, lastActivityDate }: StreakRiskBannerProps) => {
  const navigate = useNavigate();
  
  // Check if user has an active streak that might break
  const today = new Date().toISOString().split('T')[0];
  const isAtRisk = currentStreak > 0 && lastActivityDate !== today;

  if (!isAtRisk) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            🔥 Your {currentStreak}-day streak is at risk!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Talk to Nova today to keep it going
          </p>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(AI_COMPANION_ROUTE)}
          className="flex-shrink-0"
        >
          Talk Now
        </Button>
      </div>
    </div>
  );
};

export default StreakRiskBanner;