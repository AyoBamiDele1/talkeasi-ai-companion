import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, Clock, Trophy, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileNotificationsProps {
  onBack: () => void;
}

const ProfileNotifications = ({ onBack }: ProfileNotificationsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    dailyReminders: true,
    lessonCompleted: true,
    streakMilestones: true,
    weeklyProgress: false,
    newFeatures: true,
    emailDigest: false,
    pushNotifications: true,
    soundAlerts: true
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const notificationSections = [
    {
      title: "Learning Reminders",
      icon: Clock,
      items: [
        {
          key: "dailyReminders",
          label: "Daily Practice Reminders",
          description: "Get reminded to practice every day at your preferred time"
        },
        {
          key: "weeklyProgress",
          label: "Weekly Progress Summary",
          description: "Receive a weekly summary of your learning progress"
        }
      ]
    },
    {
      title: "Achievement Notifications",
      icon: Trophy,
      items: [
        {
          key: "lessonCompleted",
          label: "Lesson Completion",
          description: "Get notified when you complete a lesson"
        },
        {
          key: "streakMilestones",
          label: "Streak Milestones",
          description: "Celebrate your learning streaks and milestones"
        }
      ]
    },
    {
      title: "Communication",
      icon: MessageSquare,
      items: [
        {
          key: "newFeatures",
          label: "New Features & Updates",
          description: "Stay informed about new app features and improvements"
        },
        {
          key: "emailDigest",
          label: "Email Digest",
          description: "Receive weekly learning insights via email"
        }
      ]
    },
    {
      title: "App Preferences",
      icon: Bell,
      items: [
        {
          key: "pushNotifications",
          label: "Push Notifications",
          description: "Enable push notifications on your device"
        },
        {
          key: "soundAlerts",
          label: "Sound Alerts",
          description: "Play sounds for notifications and achievements"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm">Customize your notification preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {notificationSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="w-5 h-5 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-base font-medium">{item.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable notifications during specific hours
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 opacity-50">
                <div>
                  <Label className="text-sm">From</Label>
                  <div className="mt-1 p-2 border rounded text-sm">10:00 PM</div>
                </div>
                <div>
                  <Label className="text-sm">To</Label>
                  <div className="mt-1 p-2 border rounded text-sm">8:00 AM</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
          ) : (
            <Bell className="w-4 h-4 mr-2" />
          )}
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
};

export default ProfileNotifications;