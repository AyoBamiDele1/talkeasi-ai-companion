import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, CheckCircle, Star } from "lucide-react";

interface ProfileSubscriptionProps {
  onBack: () => void;
}

const ProfileSubscription = ({ onBack }: ProfileSubscriptionProps) => {
  const currentPlan = "Free";

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for quick daily practice",
      features: [
        "1 short lesson per day",
        "1 minute of conversation with AI Tutor",
        "Basic progress tracking"
      ],
      current: true
    },
    {
      name: "Daily Access Pass",
      price: "$0.34",
      period: "/day",
      description: "Practice freely for 24 hours",
      features: [
        "Unlimited access to all lessons",
        "Up to 10 minutes of AI Tutor talk time",
        "Add more minutes anytime with Voice Top-Ups"
      ],
      note: "Voice interactions use AI resources, so fair use limits apply. You can always top up for longer sessions.",
      current: false
    },
    {
      name: "Premium",
      price: "$2",
      period: "/month (~₦3,000/month)",
      description: "Best for consistent learners who want full access",
      features: [
        "Unlimited lessons & AI conversations",
        "Full progress tracking and reports",
        "All topics unlocked (Beginner → Advanced)",
        "Personalized learning path"
      ],
      current: false,
      popular: true
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
          <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
          <p className="text-muted-foreground text-sm">Manage your subscription plan</p>
        </div>
      </div>

      {/* Current Plan Status */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <p className="text-muted-foreground text-sm">You're currently on the {currentPlan} plan</p>
            </div>
            <Badge variant="default" className="bg-primary">
              <Crown className="w-3 h-3 mr-1" />
              {currentPlan}
            </Badge>
          </div>
          
          {currentPlan === "Free" && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium for unlimited access to all features and personalized AI tutoring.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Available Plans</h2>
        
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {plan.current && <Badge variant="secondary">Current</Badge>}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {plan.note && (
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {plan.note}
                </p>
              )}
              
              <Button
                className="w-full"
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No billing history available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Billing information will appear here once you upgrade to a paid plan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSubscription;