import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 12 seconds
    const timer = setTimeout(() => {
      navigate("/profile");
    }, 12000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-background p-6">
      <Card className="w-full max-w-md border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/20 rounded-full">
              <Crown className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            Welcome to Pro!
            <Sparkles className="w-5 h-5 text-primary" />
          </CardTitle>
          <CardDescription>
            Your subscription is now active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-background/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-medium">600 credits per month</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-medium">Priority support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-medium">Cancel anytime</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              Your monthly credits will be available in your account within a few moments.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/profile")} className="w-full" size="lg">
              View My Subscription
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate("/home")} 
              variant="outline" 
              className="w-full"
            >
              Start Talking
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Redirecting to your profile in a few seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
