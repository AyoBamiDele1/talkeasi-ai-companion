import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NotificationPermissionPromptProps {
  onEnable: () => Promise<boolean | void>;
  onDismiss: () => void;
}

const NotificationPermissionPrompt = ({ onEnable, onDismiss }: NotificationPermissionPromptProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await onEnable();
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Never miss Nova 💬
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Get gentle reminders to protect your streak and hear when Nova is thinking about you.
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleEnable}
                disabled={isLoading}
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          
          <button 
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPermissionPrompt;