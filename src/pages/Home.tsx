import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = userProfile?.display_name || user?.email?.split('@')[0] || "there";

  const handleStartLesson = () => {
    navigate('/lessons');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Ready to improve your English today?
        </p>
      </div>

      {/* Start Lesson Button */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-4 md:mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-3 mx-auto">
            <Mic className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">
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