import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, CreditCard, HelpCircle, LogOut, Crown, Globe, BarChart3 } from "lucide-react";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ProfileSubscription from "@/components/profile/ProfileSubscription";
import ProfileLanguageSettings from "@/components/profile/ProfileLanguageSettings";
import ProfileHelpSupport from "@/components/profile/ProfileHelpSupport";
import ProfileAnalytics from "@/components/profile/ProfileAnalytics";
import { FEATURES } from "@/config/features";
interface UserProfile {
  display_name: string;
  native_language: string;
  learning_goals: string[];
  level: string;
  avatar_url?: string;
}
interface UserStats {
  completed_lessons: number;
  accuracy: number;
}
type ProfileView = 'main' | 'settings' | 'subscription' | 'goals' | 'language' | 'help' | 'analytics';
const Profile = () => {
  const [searchParams] = useSearchParams();
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    completed_lessons: 0,
    accuracy: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ProfileView>('main');
  
  useEffect(() => {
    const viewParam = searchParams.get('view') as ProfileView;
    if (viewParam && ['settings', 'subscription', 'goals', 'language', 'help', 'analytics'].includes(viewParam)) {
      setCurrentView(viewParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);
  const fetchProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user?.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchStats = async () => {
    try {
      // Fetch completed lessons count
      const {
        count: completedCount,
        error: progressError
      } = await supabase.from('user_progress').select('*', {
        count: 'exact',
        head: true
      }).eq('user_id', user?.id).not('completed_at', 'is', null);
      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Calculate average accuracy from completed lessons
      const {
        data: progressData,
        error: accuracyError
      } = await supabase.from('user_progress').select('accuracy_score, fluency_score').eq('user_id', user?.id).not('completed_at', 'is', null);
      if (accuracyError) {
        console.error('Error fetching accuracy:', accuracyError);
      }
      let averageAccuracy = 0;
      if (progressData && progressData.length > 0) {
        const totalAccuracy = progressData.reduce((sum, item) => sum + ((item.accuracy_score || 0) + (item.fluency_score || 0)) / 2, 0);
        averageAccuracy = Math.round(totalAccuracy / progressData.length);
      }
      setStats({
        completed_lessons: completedCount || 0,
        accuracy: averageAccuracy
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  const menuItems = [{
    icon: Settings,
    label: "Settings",
    action: () => setCurrentView('settings')
  }, {
    icon: CreditCard,
    label: "Subscription",
    badge: "Premium",
    action: () => setCurrentView('subscription')
  }, {
    icon: BarChart3,
    label: "Usage Analytics",
    action: () => setCurrentView('analytics')
  }, {
    icon: Globe,
    label: "Language Settings",
    action: () => setCurrentView('language')
  }, {
    icon: HelpCircle,
    label: "Help & Support",
    action: () => setCurrentView('help')
  }];

  // Render different views based on current selection
  if (currentView !== 'main') {
    switch (currentView) {
      case 'settings':
        return <ProfileSettings onBack={() => setCurrentView('main')} />;
      case 'subscription':
        return <ProfileSubscription onBack={() => setCurrentView('main')} />;
      case 'analytics':
        return <ProfileAnalytics onBack={() => setCurrentView('main')} />;
      case 'language':
        return <ProfileLanguageSettings onBack={() => setCurrentView('main')} />;
      case 'help':
        return <ProfileHelpSupport onBack={() => setCurrentView('main')} />;
      default:
        return null;
    }
  }
  return <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-16 h-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile picture" />}
              <AvatarFallback className="text-lg font-semibold">
                {profile?.display_name ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </h3>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                
                
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2 mb-6">
        {menuItems.map((item, index) => <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={item.action}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Logout Button */}
      <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleSignOut}>
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>;
};
export default Profile;