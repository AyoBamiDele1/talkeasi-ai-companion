import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Mail, 
  Phone,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface ProfileHelpSupportProps {
  onBack: () => void;
}

const ProfileHelpSupport = ({ onBack }: ProfileHelpSupportProps) => {
  const faqItems = [
    {
      question: "How do I start a conversation with the AI tutor?",
      answer: "Navigate to a lesson and tap the microphone button to start speaking. The AI will respond in real-time."
    },
    {
      question: "Can I practice offline?",
      answer: "Premium users can download lessons for offline practice. Free users need an internet connection."
    },
    {
      question: "How is my progress tracked?",
      answer: "We track your completion rate, accuracy scores, and learning streaks automatically."
    },
    {
      question: "What if I'm not happy with my subscription?",
      answer: "You can cancel your subscription anytime in the app or contact our support team for assistance."
    }
  ];

  const contactOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      action: "support@englishtutor.com",
      available: "24/7"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Start Chat",
      available: "9 AM - 6 PM WAT",
      badge: "Premium"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call our support line",
      action: "+234 800 123 4567",
      available: "Business Hours",
      badge: "Premium"
    }
  ];

  const resourceLinks = [
    {
      title: "User Guide",
      description: "Complete guide to using the app",
      icon: BookOpen
    },
    {
      title: "Video Tutorials",
      description: "Learn with step-by-step videos",
      icon: ExternalLink
    },
    {
      title: "Community Forum",
      description: "Connect with other learners",
      icon: MessageSquare
    },
    {
      title: "Feature Requests",
      description: "Suggest new features",
      icon: HelpCircle
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
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground text-sm">Get help and find answers</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <HelpCircle className="w-6 h-6" />
              <span className="text-sm">FAQ</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm">Contact Us</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <BookOpen className="w-6 h-6" />
              <span className="text-sm">User Guide</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <ExternalLink className="w-6 h-6" />
              <span className="text-sm">Tutorials</span>
            </Button>
          </CardContent>
        </Card>

        {/* Frequently Asked Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="border rounded-lg">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <option.icon className="w-5 h-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.title}</h4>
                      {option.badge && (
                        <Badge variant="default" className="bg-primary text-xs">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    <p className="text-xs text-muted-foreground">Available: {option.available}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resources & Links */}
        <Card>
          <CardHeader>
            <CardTitle>Resources & Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resourceLinks.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{link.title}</h4>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
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
              <span>Sept 22, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span>Web App</span>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200">
                  Emergency Technical Support
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  For critical issues affecting your learning: +234 800 HELP (4357)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileHelpSupport;