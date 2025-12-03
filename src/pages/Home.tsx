import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FEATURES } from "@/config/features";
import { useCompanionProgress } from "@/hooks/useCompanionProgress";
import { useMilestones } from "@/hooks/useMilestones";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import MilestoneCelebrationModal from "@/components/MilestoneCelebrationModal";
import StreakRiskBanner from "@/components/StreakRiskBanner";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: stats } = useCompanionProgress();
  const { pendingMilestone, checkMilestones, celebrateMilestone, dismissMilestone } = useMilestones();
  const { showPrompt, subscribe, dismissPrompt, isSupported } = usePushNotifications();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      checkMilestones();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, last_activity_date, first_conversation_at')
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

  const getPersonalizedGreeting = () => {
    const userName = userProfile?.display_name || user?.user_metadata?.display_name || "there";
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // First-time user
    if (!stats?.conversationCount || stats.conversationCount === 0) {
      return {
        greeting: `${timeGreeting}, ${userName}! 👋`,
        subtitle: "Mia can't wait to meet you!"
      };
    }

    // Calculate days since last chat
    const lastActivity = userProfile?.last_activity_date;
    let daysSinceLastChat = 0;
    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const today = new Date();
      daysSinceLastChat = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Returning after gap (2+ days)
    if (daysSinceLastChat >= 2) {
      return {
        greeting: `${timeGreeting}, ${userName}! 💕`,
        subtitle: `It's been ${daysSinceLastChat} days - Mia missed you!`
      };
    }

    // Active streak
    if (stats.currentStreak >= 3) {
      return {
        greeting: `${timeGreeting}, ${userName}! 🔥`,
        subtitle: `${stats.currentStreak} day streak! Mia loves your consistency!`
      };
    }

    // Regular return
    return {
      greeting: `Welcome back, ${userName}! 💞`,
      subtitle: "Mia is here for you."
    };
  };

  const { greeting, subtitle } = getPersonalizedGreeting();

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 md:p-6 pb-20">
      {/* Milestone Celebration */}
      <MilestoneCelebrationModal
        milestone={pendingMilestone}
        onClose={dismissMilestone}
        onCelebrated={celebrateMilestone}
      />

      {/* Streak Risk Banner */}
      {stats && stats.currentStreak > 0 && (
        <StreakRiskBanner
          currentStreak={stats.currentStreak}
          lastActivityDate={userProfile?.last_activity_date}
        />
      )}

      {/* Notification Permission Prompt */}
      {isSupported && showPrompt && (
        <div className="mb-4">
          <NotificationPermissionPrompt
            onEnable={subscribe}
            onDismiss={dismissPrompt}
          />
        </div>
      )}

      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
          {greeting}
        </h1>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {/* Cards Container - Centered in remaining space */}
      <div className="flex-1 flex items-center">
        {/* Two Mode Cards - Stack on mobile, side-by-side on desktop */}
        <div className={`grid grid-cols-1 ${FEATURES.ENGLISH_LESSONS_ENABLED ? 'md:grid-cols-2' : ''} gap-4 max-w-4xl mx-auto w-full`}>
        
        {/* Card 1: AI Companion Mode */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💞</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Talk to Mia</h2>
            <p className="text-sm text-muted-foreground mb-1">Your AI friend Mia is here to listen and talk.</p>
            
            <Button className="w-full mt-4" onClick={() => navigate('/lesson/9b25e5bb-3702-448f-aae7-39c0b44fb558')}>
              Start Talking
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: English Practice Mode */}
        {FEATURES.ENGLISH_LESSONS_ENABLED && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎓</span>
              </div>
              <h2 className="text-xl font-bold mb-2">English Lessons</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Practice your English with real-time AI feedback.
              </p>
              
              <Button className="w-full mt-4" onClick={() => navigate('/home')}>
                Start Practicing
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default Home;