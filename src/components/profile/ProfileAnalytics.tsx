import { ArrowLeft, TrendingUp, Clock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsageAnalytics } from "@/hooks/useUsageAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileAnalyticsProps {
  onBack: () => void;
}

const ProfileAnalytics = ({ onBack }: ProfileAnalyticsProps) => {
  const { data: analytics, isLoading } = useUsageAnalytics();

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'trial': return 'Trial Mode';
      case 'enhanced': return 'Standard Mode';
      case 'premium': return 'Premium Mode';
      default: return mode;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usage Analytics</h1>
          <p className="text-muted-foreground text-sm">Your practice patterns</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* Overview Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{analytics?.totalSessions || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modes Used</p>
                  <p className="text-2xl font-bold">{analytics?.modeStats.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Mode Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics?.modeStats.map((stat) => (
                <div key={stat.mode} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{getModeLabel(stat.mode)}</h3>
                    <span className="text-sm text-muted-foreground">{stat.sessions} sessions</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Practice Time</p>
                        <p className="font-medium">{stat.totalMinutes.toFixed(1)} min</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Credits Used</p>
                        <p className="font-medium">{stat.creditsSpent}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(!analytics?.modeStats || analytics.modeStats.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No usage data yet. Start practicing to see your analytics!
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProfileAnalytics;
