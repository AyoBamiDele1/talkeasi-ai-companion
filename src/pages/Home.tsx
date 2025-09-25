import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StreakDisplay from "@/components/StreakDisplay";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = userProfile?.display_name || user?.email?.split('@')[0] || "there";
  const topMistake = "Past tense pronunciation";

  const handleStartLesson = () => {
    navigate('/lessons');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Ready to improve your English today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <StreakDisplay compact={true} showTitle={false} />
        
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