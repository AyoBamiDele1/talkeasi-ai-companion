import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

interface ProfileNotificationSettingsProps {
  onBack: () => void;
}

interface NotificationPreferences {
  streak_reminders: boolean;
  mia_checkins: boolean;
  milestone_celebrations: boolean;
  preferred_time: string;
}

const ProfileNotificationSettings = ({ onBack }: ProfileNotificationSettingsProps) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    streak_reminders: true,
    mia_checkins: true,
    milestone_celebrations: true,
    preferred_time: '19:00'
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
      checkSubscription();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          streak_reminders: data.streak_reminders,
          mia_checkins: data.mia_checkins,
          milestone_celebrations: data.milestone_celebrations,
          preferred_time: data.preferred_time
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved."
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support push notifications.",
        variant: "destructive"
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive"
      });
      return;
    }

    // Register service worker and get push subscription
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // Using a placeholder VAPID key - in production, this should come from your backend
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });

      const subscriptionJson = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user?.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Notifications enabled",
        description: "You'll now receive updates from Nova!"
      });
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive"
      });
    }
  };

  const disableNotifications = async () => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsSubscribed(false);
      toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications anymore."
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
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
      <Button
        variant="ghost"
        className="w-fit mb-4"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Notifications</h1>

      {/* Enable/Disable Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  Push Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <Button
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              onClick={isSubscribed ? disableNotifications : enableNotifications}
            >
              {isSubscribed ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Streak Reminders</p>
              <p className="text-xs text-muted-foreground">Don't let your streak break</p>
            </div>
            <Switch
              checked={preferences.streak_reminders}
              onCheckedChange={(checked) => updatePreference('streak_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Nova's Check-ins</p>
              <p className="text-xs text-muted-foreground">When Nova is thinking about you</p>
            </div>
            <Switch
              checked={preferences.mia_checkins}
              onCheckedChange={(checked) => updatePreference('mia_checkins', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Milestone Celebrations</p>
              <p className="text-xs text-muted-foreground">When you unlock achievements</p>
            </div>
            <Switch
              checked={preferences.milestone_celebrations}
              onCheckedChange={(checked) => updatePreference('milestone_celebrations', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default ProfileNotificationSettings;