import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Mic2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  duration_minutes: number;
  is_premium: boolean;
  completed?: boolean;
  rating?: number;
  content?: {
    scenarios?: string[];
    key_phrases?: string[];
  };
}

const Lessons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, [user]);

  const fetchLessons = async () => {
    try {
      // Fetch all lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: true });

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        return;
      }

      // Fetch user progress to determine completed lessons
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, completed_at, accuracy_score, fluency_score')
        .eq('user_id', user?.id)
        .not('completed_at', 'is', null);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Combine lessons with progress data
      const lessonsWithProgress = lessonsData?.map(lesson => {
        const progress = progressData?.find(p => p.lesson_id === lesson.id);
        const rating = progress ? 
          Math.round(((progress.accuracy_score || 0) + (progress.fluency_score || 0)) / 20) : 
          undefined;
        
        return {
          ...lesson,
          completed: !!progress,
          rating: rating && rating > 0 ? rating : undefined,
          content: lesson.content as any // Type assertion for JSON content
        };
      }) || [];

      setLessons(lessonsWithProgress);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLessonStart = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Practice Lessons
        </h1>
        <p className="text-muted-foreground">
          Choose a conversation topic to practice your English skills
        </p>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {lesson.description}
                    </p>
                  )}
                </div>
                {lesson.completed && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{lesson.duration_minutes} min</span>
                </div>
                
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getDifficultyColor(lesson.difficulty)}`}
                >
                  {lesson.difficulty}
                </Badge>

                <Badge variant="outline" className="text-xs">
                  {lesson.category}
                </Badge>

                {lesson.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-muted-foreground">{lesson.rating}</span>
                  </div>
                )}
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