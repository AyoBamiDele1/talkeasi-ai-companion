import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

  const userName = userProfile?.display_name || user?.user_metadata?.display_name || "there";

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 md:p-6 pb-20">
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
          Hello, {userName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          What would you like to do today?
        </p>
      </div>

      {/* Two Mode Cards - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
        
        {/* Card 1: AI Companion Mode */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💞</span>
            </div>
            <h2 className="text-xl font-bold mb-2">AI Companion Mode</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Talk freely — feel heard, supported, and understood.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Chat naturally with your friendly AI companion. Share your thoughts, feelings, or daily experiences.
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate('/lesson/9b25e5bb-3702-448f-aae7-39c0b44fb558')}
            >
              Start Companion Chat
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: English Practice Mode */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎓</span>
            </div>
            <h2 className="text-xl font-bold mb-2">English Practice Mode</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Practice your English with real-time AI feedback.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Improve your fluency, pronunciation, and grammar through fun, natural conversations with your AI tutor.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/lessons')}
            >
              Start English Lesson
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;