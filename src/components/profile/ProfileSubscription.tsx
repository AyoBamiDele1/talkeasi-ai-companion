import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CreditCard, Zap, Clock, Check, Crown, Loader2, Info, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

interface ProfileSubscriptionProps {
  onBack: () => void;
}

// Map price IDs to packages
const CREDIT_PACKAGES: Record<string, { 
  credits: number; 
  priceId: string; 
  priceNGN: number;
  priceUSD: number;
  priceGBP: number;
}> = {
  "40_credits": {
    credits: 40,
    priceId: "price_1SWMK92dz9WA913sD8RjAHqP",
    priceNGN: 1000,
    priceUSD: 1.99,
    priceGBP: 1.60
  },
  "90_credits": {
    credits: 90,
    priceId: "price_1SWMKP2dz9WA913sbt0ftTUf",
    priceNGN: 1800,
    priceUSD: 2.99,
    priceGBP: 2.40
  },
  "170_credits": {
    credits: 170,
    priceId: "price_1SWMKe2dz9WA913sV9VkYNyE",
    priceNGN: 3000,
    priceUSD: 4.99,
    priceGBP: 4.00
  }
};

const PRO_PLAN = {
  priceId: "price_1SWMKu2dz9WA913sJSKAHETl",
  productId: "prod_TTIwjh5O9HkYuf",
  credits: 600,
  priceNGN: 6000,
  priceUSD: 9.99,
  priceGBP: 8.00
};

const ProfileSubscription = ({ onBack }: ProfileSubscriptionProps) => {
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const { isSubscribed, productId, subscriptionEnd, refetch: refetchSubscription } = useSubscription();
  const { 
    formatPrice, 
    loading: locationLoading,
    currency
  } = useUserLocation();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingSubscription, setProcessingSubscription] = useState(false);

  // Check for payment/subscription status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const subscriptionStatus = params.get('subscription');

    if (paymentStatus === 'success') {
      toast({
        title: "Payment successful!",
        description: "Your credits will be added to your account shortly.",
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh data
      setTimeout(() => {
        refetchCredits();
      }, 2000);
    } else if (paymentStatus === 'canceled') {
      toast({
        title: "Payment canceled",
        description: "Your payment was canceled.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (subscriptionStatus === 'success') {
      toast({
        title: "Subscription activated!",
        description: "Welcome to Pro! Your monthly credits will be available shortly.",
      });
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        refetchSubscription();
        refetchCredits();
      }, 2000);
    } else if (subscriptionStatus === 'canceled') {
      toast({
        title: "Subscription canceled",
        description: "Your subscription was not completed.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: creditBalance, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!user
  });

  const calculateEstimatedTime = (credits: number, mode: 'standard' | 'premium') => {
    const creditsPerMinute = mode === 'standard' ? 4 : 10;
    const minutes = credits / creditsPerMinute;
    
    if (minutes < 60) {
      return `${Math.floor(minutes)} mins`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handlePurchaseCredits = async (packageKey: string) => {
    if (!user || processingPayment) return;

    const pkg = CREDIT_PACKAGES[packageKey];
    if (!pkg) {
      toast({
        title: "Error",
        description: "Invalid package selected",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          priceId: pkg.priceId,
          currency: currency
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || processingSubscription) return;

    setProcessingSubscription(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: PRO_PLAN.priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingSubscription(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshStatus = async () => {
    await Promise.all([
      refetchSubscription(),
      refetchCredits()
    ]);
    refreshSubscription();
    toast({
      title: "Status refreshed",
      description: "Your subscription and credit balance have been updated."
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Credits & Subscription</h1>
            <p className="text-sm text-muted-foreground">Manage your credits and subscription</p>
          </div>
        </div>

        {/* Subscription Status */}
        {isSubscribed && (
          <Card className="mb-6 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Pro Subscriber</CardTitle>
                </div>
                <Badge variant="default" className="bg-primary">Active</Badge>
              </div>
              <CardDescription>
                {subscriptionEnd && `Renews on ${new Date(subscriptionEnd).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You get {PRO_PLAN.credits} credits every month as part of your Pro plan
              </p>
              <Button onClick={handleManageSubscription} variant="outline" size="sm">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Balance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Credit Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold text-foreground">{creditBalance || 0}</p>
                <p className="text-sm text-muted-foreground">Available Credits</p>
              </div>
              
              <div className={`grid gap-4 ${currency === 'NGN' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-xs font-medium">Standard Mode</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ~{calculateEstimatedTime(creditBalance || 0, 'standard')}
                  </p>
                </div>
                {currency !== 'NGN' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-primary" />
                      <p className="text-xs font-medium">Premium Mode</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ~{calculateEstimatedTime(creditBalance || 0, 'premium')}
                    </p>
                  </div>
                )}
              </div>

              <Button onClick={handleRefreshStatus} variant="outline" size="sm" className="w-full">
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro Subscription */}
        {!isSubscribed && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-4">Pro Subscription</h2>
            <Card className="mb-6 border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <CardTitle>Pro Plan</CardTitle>
                  </div>
                  <Badge variant="secondary">Most Popular</Badge>
                </div>
                <CardDescription>Best value for regular learners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatPrice(PRO_PLAN.priceNGN, PRO_PLAN.priceUSD, PRO_PLAN.priceGBP)}
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{PRO_PLAN.credits} Credits per Month</p>
                      <p className="text-sm text-muted-foreground">
                        {currency === 'NGN' 
                          ? `~${calculateEstimatedTime(PRO_PLAN.credits, 'standard')} of conversation`
                          : `~${calculateEstimatedTime(PRO_PLAN.credits, 'standard')} standard or ~${calculateEstimatedTime(PRO_PLAN.credits, 'premium')} premium`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <p className="text-sm">Priority support</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <p className="text-sm">Cancel anytime</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSubscribe} 
                  className="w-full" 
                  size="lg"
                  disabled={processingSubscription}
                >
                  {processingSubscription ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <Separator className="my-6" />

        {/* Buy Credits */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Buy Credits</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">40 Credits</CardTitle>
              <CardDescription>
                {formatPrice(
                  CREDIT_PACKAGES["40_credits"].priceNGN,
                  CREDIT_PACKAGES["40_credits"].priceUSD,
                  CREDIT_PACKAGES["40_credits"].priceGBP
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  ~{calculateEstimatedTime(40, 'standard')} standard
                </p>
                {currency !== 'NGN' && (
                  <p className="text-muted-foreground">
                    ~{calculateEstimatedTime(40, 'premium')} premium
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handlePurchaseCredits('40_credits')} 
                className="w-full"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">90 Credits</CardTitle>
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              </div>
              <CardDescription>
                {formatPrice(
                  CREDIT_PACKAGES["90_credits"].priceNGN,
                  CREDIT_PACKAGES["90_credits"].priceUSD,
                  CREDIT_PACKAGES["90_credits"].priceGBP
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  ~{calculateEstimatedTime(90, 'standard')} standard
                </p>
                {currency !== 'NGN' && (
                  <p className="text-muted-foreground">
                    ~{calculateEstimatedTime(90, 'premium')} premium
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handlePurchaseCredits('90_credits')} 
                className="w-full"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">170 Credits</CardTitle>
              <CardDescription>
                {formatPrice(
                  CREDIT_PACKAGES["170_credits"].priceNGN,
                  CREDIT_PACKAGES["170_credits"].priceUSD,
                  CREDIT_PACKAGES["170_credits"].priceGBP
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  ~{calculateEstimatedTime(170, 'standard')} standard
                </p>
                {currency !== 'NGN' && (
                  <p className="text-muted-foreground">
                    ~{calculateEstimatedTime(170, 'premium')} premium
                  </p>
                )}
              </div>
              <Button 
                onClick={() => handlePurchaseCredits('170_credits')} 
                className="w-full"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Voice Modes & Features */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Voice Modes & Features
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Credits are deducted based on your conversation time. Choose the mode that best fits your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Mode Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Standard Mode
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">4 credits/min</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Simple and reliable tap-to-talk conversations
                </CardDescription>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Tap-to-talk interface</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Great voice quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Reliable performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Perfect for practice conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">More affordable option</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Available worldwide</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Mode Card - Hidden for Nigerian users */}
            {currency !== 'NGN' && (
              <Card className="border-2 border-primary/50 bg-gradient-to-br from-background to-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    Premium Mode
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">10 credits/min</Badge>
                    <Badge variant="secondary">Premium</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    Ultra-realistic instant voice chat experience
                  </CardDescription>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Ultra-realistic AI voice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Instant real-time responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Natural conversation flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Professional-grade voice quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Best for immersive practice</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSubscription;
