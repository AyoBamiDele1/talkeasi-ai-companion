import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Flame, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  
  // Mock data - will be replaced with real data later
  const currentStreak = 7;
  const topMistake = "Past tense pronunciation";
  const userName = "Adaeze";

  const handleStartLesson = () => {
    navigate('/lessons');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Good morning, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Ready to improve your English today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-primary">{currentStreak}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              Focus Area
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="secondary" className="text-xs">
              {topMistake}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Work on this</p>
          </CardContent>
        </Card>
      </div>

      {/* Start Lesson Button */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Mic className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Start Your Practice
          </h2>
          <p className="text-muted-foreground text-sm">
            Have a conversation with your AI tutor
          </p>
        </div>

        <Button size="lg" className="w-full max-w-xs" onClick={handleStartLesson}>
          Start Lesson
        </Button>
      </div>
    </div>
  );
};

export default Home;