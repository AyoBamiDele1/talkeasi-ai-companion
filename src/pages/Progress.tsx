import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Calendar, TrendingUp, Award, AlertCircle } from "lucide-react";

const Progress = () => {
  // Mock progress data
  const stats = {
    totalLessons: 12,
    completedLessons: 8,
    currentStreak: 7,
    bestStreak: 15,
    accuracyScore: 78,
    commonMistakes: [
      { mistake: "Past tense pronunciation", count: 12, improving: true },
      { mistake: "Article usage (a, an, the)", count: 8, improving: false },
      { mistake: "Sentence stress", count: 6, improving: true },
      { mistake: "Word order", count: 4, improving: true }
    ]
  };

  const weeklyProgress = [
    { day: "Mon", completed: true },
    { day: "Tue", completed: true },
    { day: "Wed", completed: true },
    { day: "Thu", completed: false },
    { day: "Fri", completed: true },
    { day: "Sat", completed: true },
    { day: "Sun", completed: true }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track your English improvement journey
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

      {/* Weekly Streak */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            This Week's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-2xl font-bold text-primary">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current streak</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-muted-foreground">{stats.bestStreak}</div>
              <div className="text-sm text-muted-foreground">Best streak</div>
            </div>
          </div>
          
          <div className="flex justify-between">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-2">{day.day}</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  day.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {day.completed && <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.commonMistakes.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.mistake}</div>
                  <div className="text-xs text-muted-foreground">{item.count} times</div>
                </div>
                <Badge 
                  variant={item.improving ? "default" : "secondary"}
                  className={item.improving ? "bg-green-100 text-green-800" : ""}
                >
                  {item.improving ? "Improving" : "Practice more"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;