import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Mic2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Lessons = () => {
  const navigate = useNavigate();

  // Mock lesson data
  const lessons = [
    {
      id: 1,
      title: "Basic Greetings",
      duration: "5 mins",
      difficulty: "Beginner",
      completed: true,
      rating: 4.5
    },
    {
      id: 2,
      title: "Ordering Food",
      duration: "10 mins", 
      difficulty: "Intermediate",
      completed: false,
      rating: 4.7
    },
    {
      id: 3,
      title: "Job Interview",
      duration: "15 mins",
      difficulty: "Advanced",
      completed: false,
      rating: 4.8
    },
    {
      id: 4,
      title: "Small Talk",
      duration: "8 mins",
      difficulty: "Beginner",
      completed: true,
      rating: 4.3
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLessonStart = (lessonId: number) => {
    navigate(`/lesson/${lessonId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Practice Lessons
        </h1>
        <p className="text-muted-foreground">
          Choose a conversation topic to practice
        </p>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                {lesson.completed && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{lesson.duration}</span>
                </div>
                
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}
                >
                  {lesson.difficulty}
                </Badge>

                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-muted-foreground">{lesson.rating}</span>
                </div>
              </div>

              <Button 
                variant={lesson.completed ? "secondary" : "default"}
                className="w-full"
                size="sm"
                onClick={() => handleLessonStart(lesson.id)}
              >
                <Mic2 className="w-4 h-4 mr-2" />
                {lesson.completed ? "Practice Again" : "Start Lesson"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Lessons;