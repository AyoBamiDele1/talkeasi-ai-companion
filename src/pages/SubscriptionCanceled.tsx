import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, Crown } from "lucide-react";

const SubscriptionCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-destructive/5 to-background p-6">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Subscription Canceled</CardTitle>
          <CardDescription>
            Your subscription was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              No charges were made to your account. You can subscribe anytime you're ready to unlock Pro benefits.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-medium text-center mb-2">Pro Plan Benefits</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 600 credits per month</li>
              <li>• Priority support</li>
              <li>• Best value for regular users</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/profile")} className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              View Plans
            </Button>
            <Button 
              onClick={() => navigate("/home")} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Questions? Contact our support team for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCanceled;
