import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FEATURES } from "@/config/features";
import { AI_COMPANION_ROUTE } from "@/config/companion";
import { useCompanionProgress } from "@/hooks/useCompanionProgress";
import { useMilestones } from "@/hooks/useMilestones";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import MilestoneCelebrationModal from "@/components/MilestoneCelebrationModal";
import StreakRiskBanner from "@/components/StreakRiskBanner";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import NovaOrb from "@/components/NovaOrb";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
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
            }
            else {
                setUserProfile(data);
            }
        }
        catch (error) {
            console.error('Error fetching profile:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getPersonalizedGreeting = () => {
        const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.display_name;
        let userName = userProfile?.display_name;
        if (!userName || userName === user?.email) {
            userName = metadataName || "there";
        }
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        // First-time user
        if (!stats?.conversationCount || stats.conversationCount === 0) {
            return {
                greeting: `${timeGreeting}, ${userName}! 👋`,
                subtitle: "Nova can't wait to meet you!"
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
                greeting: `${timeGreeting}, ${userName}!`,
                subtitle: `It's been ${daysSinceLastChat} days - Nova missed you!`
            };
        }
        // Active streak
        if (stats.currentStreak >= 3) {
            return {
                greeting: `${timeGreeting}, ${userName}! 🔥`,
                subtitle: `${stats.currentStreak} day streak! Nova loves your consistency!`
            };
        }
        // Regular return
        return {
            greeting: `Welcome back, ${userName}!`,
            subtitle: "Nova is here for you."
        };
    };
    const { greeting, subtitle } = getPersonalizedGreeting();
    return (<div className="flex flex-col min-h-screen bg-background p-4 md:p-6 pb-20">
      {/* Milestone Celebration */}
      <MilestoneCelebrationModal milestone={pendingMilestone} onClose={dismissMilestone} onCelebrated={celebrateMilestone}/>

      {/* Streak Risk Banner */}
      {stats && stats.currentStreak > 0 && (<StreakRiskBanner currentStreak={stats.currentStreak} lastActivityDate={userProfile?.last_activity_date}/>)}

      {/* Notification Permission Prompt */}
      {isSupported && showPrompt && (<div className="mb-4">
          <NotificationPermissionPrompt onEnable={subscribe} onDismiss={dismissPrompt}/>
        </div>)}

      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
          {greeting}
        </h1>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {/* Nova Orb - Main CTA */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <NovaOrb size="sm" onClick={() => navigate(AI_COMPANION_ROUTE)} className="mx-auto mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Talk to Nova</h2>
          <p className="text-muted-foreground mb-4">
            Your AI friend is here to listen, talk, and help.
          </p>
          <Button size="lg" className="px-8" onClick={() => navigate(AI_COMPANION_ROUTE)}>
            Start Talking
          </Button>
        </div>

        {/* English Lessons Card - Secondary */}
        {FEATURES.ENGLISH_LESSONS_ENABLED && (<Card className="hover:shadow-lg transition-shadow max-w-sm w-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎓</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">English Lessons</h3>
                  <p className="text-xs text-muted-foreground">Practice with AI feedback</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/lessons')}>
                  Start
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>);
};
export default Home;
