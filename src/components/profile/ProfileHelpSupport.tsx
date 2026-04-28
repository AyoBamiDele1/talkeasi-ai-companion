import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, HelpCircle, BookOpen, Mail, Phone, ExternalLink, ChevronRight, MessageCircle } from "lucide-react";
import NovaIcon from "@/components/NovaIcon";
interface ProfileHelpSupportProps {
  onBack: () => void;
}
const ProfileHelpSupport = ({
  onBack
}: ProfileHelpSupportProps) => {
  const faqItems = [{
    question: "How do I start a conversation with the AI tutor?",
    answer: "Navigate to a lesson and tap the microphone button to start speaking. The AI will respond in real-time."
  }, {
    question: "Can I practice offline?",
    answer: "Premium users can download lessons for offline practice. Free users need an internet connection."
  }, {
    question: "How is my progress tracked?",
    answer: "We track your completion rate, accuracy scores, and learning streaks automatically."
  }, {
    question: "What if I'm not happy with my subscription?",
    answer: "You can cancel your subscription anytime in the app or contact our support team for assistance."
  }];
  const contactOptions = [{
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    action: "novadelatech1@gmail.com",
    available: "24/7",
    onClick: () => window.location.href = "mailto:novadelatech1@gmail.com"
  }, {
    icon: MessageCircle,
    title: "Live Chat (WhatsApp)",
    description: "Chat with us instantly",
    action: "Start conversation",
    available: "9 AM - 6 PM WAT",
    badge: "Premium",
    onClick: () => window.open("https://wa.me/2349088976724", "_blank")
  }];
  const resourceLinks = [{
    title: "User Guide",
    description: "Complete guide to using the app",
    icon: BookOpen
  }, {
    title: "Video Tutorials",
    description: "Learn with step-by-step videos",
    icon: ExternalLink
  }, {
    title: "Community Forum",
    description: "Connect with other learners",
    icon: MessageCircle
  }, {
    title: "Feature Requests",
    description: "Suggest new features",
    icon: HelpCircle
  }];
  return <div className="min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground text-sm">Get help and find answers</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Actions */}
        

        {/* Frequently Asked Questions */}
        <Card>
          
          
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactOptions.map((option, index) => <div 
                key={index} 
                onClick={option.onClick}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                  <div className="flex items-center gap-3">
                  <option.icon className="w-5 h-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.title}</h4>
                      {option.badge && <MessageCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    <p className="text-xs text-muted-foreground">Available: {option.available}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>)}
          </CardContent>
        </Card>

        {/* Resources & Links */}
        <Card>
          
          
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>April 28, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span>Web App</span>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        
      </div>
    </div>;
};
export default ProfileHelpSupport;