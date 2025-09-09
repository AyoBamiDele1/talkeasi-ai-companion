import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  Crown,
  Target,
  Globe
} from "lucide-react";

const Profile = () => {
  // Mock user data
  const user = {
    name: "Adaeze Okoro",
    email: "adaeze@email.com",
    level: "Intermediate",
    subscription: "Premium",
    joinedDate: "March 2024",
    nativeLanguage: "Igbo",
    goals: ["Business English", "Pronunciation", "Fluency"]
  };

  const menuItems = [
    { icon: Settings, label: "Settings", action: () => {} },
    { icon: CreditCard, label: "Subscription", badge: "Premium", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => {} },
    { icon: Target, label: "Learning Goals", action: () => {} },
    { icon: Globe, label: "Language Settings", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
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
              <AvatarFallback className="text-lg font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{user.level}</Badge>
                <Badge variant="default" className="bg-primary">
                  <Crown className="w-3 h-3 mr-1" />
                  {user.subscription}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">12</div>
              <div className="text-xs text-muted-foreground">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">7</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">78%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Learning Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.goals.map((goal, index) => (
              <Badge key={index} variant="outline">
                {goal}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2 mb-6">
        {menuItems.map((item, index) => (
          <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant="default" className="bg-primary">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logout Button */}
      <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

export default Profile;