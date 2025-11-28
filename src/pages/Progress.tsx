import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { TrendingUp, Award } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import { useUserLocation } from "@/hooks/useUserLocation";

const Progress = () => {
  const { stats, loading } = useProgress();
  const { isNigerian, loading: locationLoading } = useUserLocation();

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
          <p className="text-muted-foreground">
            {(locationLoading || isNigerian) 
              ? "Complete some lessons to see your progress!" 
              : "Start conversations to see your progress!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          {(locationLoading || isNigerian) 
            ? "Track your English improvement journey" 
            : "Track your conversation history"}
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
    </div>
  );
};

export default Progress;