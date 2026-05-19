import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CreditCard, Zap, Clock, Check, Crown, Loader2, Info, Lightbulb, Banknote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { FEATURES } from "@/config/features";
import { useSearchParams } from "react-router-dom";

type PaymentProvider = 'stripe' | 'paystack';

interface ProfileSubscriptionProps {
  onBack: () => void;
}

// Credit packages with relationship-based naming
const CREDIT_PACKAGES: Record<string, { 
  credits: number; 
  priceId: string; 
  priceNGN: number;
  priceUSD: number;
  priceGBP: number;
  name: string;
  talkTime: string;
  badge?: string;
}> = {
  "snack": {
    name: "Snack Pack",
    credits: 60,
    talkTime: "1 Hour",
    priceId: "price_1SWMK92dz9WA913sD8RjAHqP",
    priceNGN: 700,
    priceUSD: 1.99,
    priceGBP: 1.60,
    badge: "Best Value"
  },
  "buddy": {
    name: "Buddy Pack",
    credits: 200,
    talkTime: "3.3 Hours",
    priceId: "price_1SWMKP2dz9WA913sbt0ftTUf",
    priceNGN: 1950,
    priceUSD: 4.99,
    priceGBP: 4.00,
    badge: "Popular"
  },
  "bestie": {
    name: "Bestie Pack",
    credits: 500,
    talkTime: "8.3 Hours",
    priceId: "price_1SWMKe2dz9WA913sV9VkYNyE",
    priceNGN: 4500,
    priceUSD: 8.99,
    priceGBP: 7.00
  }
};

const PRO_PLAN = {
  name: "Super Fan",
  priceId: "price_1SWMKu2dz9WA913sJSKAHETl",
  productId: "prod_TTIwjh5O9HkYuf",
  credits: 1000,
  talkTime: "16.6 Hours",
  priceNGN: 9500,
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
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'credits' | 'subscription'>('credits');
  const [searchParams] = useSearchParams();

  // Handle Paystack callback verification
  useEffect(() => {
    const provider = searchParams.get('provider');
    const reference = searchParams.get('reference');
    
    if (provider === 'paystack' && reference) {
      verifyPaystackPayment(reference);
    }
  }, [searchParams]);

  const verifyPaystackPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Payment Successful!",
          description: `${data.credits} credits have been added to your account.`
        });
        refetchCredits();
        refetchSubscription();
      }
    } catch (error) {
      console.error('Error verifying Paystack payment:', error);
    }
  };

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

  // 1 credit = 1 minute (simplified)
  const calculateEstimatedTime = (credits: number) => {
    const minutes = credits;
    
    if (minutes < 60) {
      return `${Math.floor(minutes)} mins`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const openPaymentDialog = (packageKey: string, type: 'credits' | 'subscription') => {
    setPendingPackage(packageKey);
    setPendingType(type);
    setShowPaymentDialog(true);
  };

  const handlePaymentWithProvider = async (provider: PaymentProvider) => {
    setShowPaymentDialog(false);
    
    if (pendingType === 'credits' && pendingPackage) {
      await handlePurchaseCredits(pendingPackage, provider);
    } else if (pendingType === 'subscription') {
      await handleSubscribe(provider);
    }
  };

  const handlePurchaseCredits = async (packageKey: string, provider: PaymentProvider = 'stripe') => {
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

    setProcessingPayment(packageKey);

    try {
      if (provider === 'paystack') {
        const { data, error } = await supabase.functions.invoke('paystack-payment', {
          body: { packageKey }
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
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
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleSubscribe = async (provider: PaymentProvider = 'stripe') => {
    if (!user || processingSubscription) return;

    setProcessingSubscription(true);

    try {
      if (provider === 'paystack') {
        const { data, error } = await supabase.functions.invoke('paystack-subscription', {
          body: {}
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { 
            priceId: PRO_PLAN.priceId,
            currency: currency
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
        }
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
    // Try to recover any unrecorded successful Paystack payments first
    let recovered = 0;
    try {
      const { data } = await supabase.functions.invoke('paystack-sync', { body: {} });
      if (data?.success) recovered = data.creditedTotal || 0;
    } catch (e) {
      console.error('paystack-sync failed', e);
    }

    await Promise.all([
      refetchSubscription(),
      refetchCredits()
    ]);
    refreshSubscription();
    toast({
      title: recovered > 0 ? `Recovered ${recovered} credits!` : "Status refreshed",
      description: recovered > 0
        ? "We found a Paystack payment and added your credits."
        : "Your subscription and credit balance have been updated."
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
                  <CardTitle className="text-lg">Super Fan Subscriber</CardTitle>
                </div>
                <Badge variant="default" className="bg-primary">Active</Badge>
              </div>
              <CardDescription>
                {subscriptionEnd && `Renews on ${new Date(subscriptionEnd).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You get {PRO_PLAN.credits} credits ({PRO_PLAN.talkTime}) every month as a Super Fan
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
              
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <p className="text-xs font-medium">Talk Time Remaining</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  ~{calculateEstimatedTime(creditBalance || 0)}
                </p>
                <p className="text-xs text-muted-foreground/70">1 credit = 1 minute</p>
              </div>

              <Button onClick={handleRefreshStatus} variant="outline" size="sm" className="w-full">
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Buy Credits */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Buy Credits</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Snack Pack */}
          <Card className="border-primary/50 relative overflow-hidden">
            {CREDIT_PACKAGES.snack.badge && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg font-medium">
                {CREDIT_PACKAGES.snack.badge}
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{CREDIT_PACKAGES.snack.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mb-2">
                {CREDIT_PACKAGES.snack.credits} Credits • {CREDIT_PACKAGES.snack.talkTime}
              </CardDescription>
              <CardDescription className="text-lg font-semibold">
                {formatPrice(
                  CREDIT_PACKAGES.snack.priceNGN,
                  CREDIT_PACKAGES.snack.priceUSD,
                  CREDIT_PACKAGES.snack.priceGBP
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => openPaymentDialog('snack', 'credits')} 
                className="w-full"
                disabled={processingPayment !== null}
              >
                {processingPayment === 'snack' ? (
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

          {/* Buddy Pack */}
          <Card className="relative overflow-hidden">
            {CREDIT_PACKAGES.buddy.badge && (
              <Badge variant="secondary" className="absolute top-3 right-3 text-xs">
                {CREDIT_PACKAGES.buddy.badge}
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{CREDIT_PACKAGES.buddy.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mb-2">
                {CREDIT_PACKAGES.buddy.credits} Credits • {CREDIT_PACKAGES.buddy.talkTime}
              </CardDescription>
              <CardDescription className="text-lg font-semibold">
                {formatPrice(
                  CREDIT_PACKAGES.buddy.priceNGN,
                  CREDIT_PACKAGES.buddy.priceUSD,
                  CREDIT_PACKAGES.buddy.priceGBP
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => openPaymentDialog('buddy', 'credits')} 
                className="w-full"
                disabled={processingPayment !== null}
              >
                {processingPayment === 'buddy' ? (
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

          {/* Bestie Pack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{CREDIT_PACKAGES.bestie.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mb-2">
                {CREDIT_PACKAGES.bestie.credits} Credits • {CREDIT_PACKAGES.bestie.talkTime}
              </CardDescription>
              <CardDescription className="text-lg font-semibold">
                {formatPrice(
                  CREDIT_PACKAGES.bestie.priceNGN,
                  CREDIT_PACKAGES.bestie.priceUSD,
                  CREDIT_PACKAGES.bestie.priceGBP
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => openPaymentDialog('bestie', 'credits')} 
                className="w-full"
                disabled={processingPayment !== null}
              >
                {processingPayment === 'bestie' ? (
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

        {/* Super Fan Subscription */}
        {!isSubscribed && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-4">Monthly Subscription</h2>
            <Card className="mb-6 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <CardTitle>{PRO_PLAN.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">Best Value</Badge>
                </div>
                <CardDescription>Perfect for daily conversations</CardDescription>
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
                        {PRO_PLAN.talkTime} of conversation time
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
                  onClick={() => openPaymentDialog('pro', 'subscription')} 
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
                    "Become a Super Fan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <Separator className="my-6" />

        {/* Credit Usage Info */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              How Credits Work
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Simple pricing: 1 credit = 1 minute of talk time
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Nova Live Mode Card */}
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Nova Live
                  </CardTitle>
                  <Badge variant="default" className="text-xs whitespace-nowrap bg-primary">1 credit/min</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Real-time AI voice conversations with Nova
                </CardDescription>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Natural conversation flow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Great voice quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Remembers your conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Perfect for practice & fun chats</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Payment Method Selection Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Payment Method</DialogTitle>
              <DialogDescription>
                Select how you'd like to pay for your {pendingType === 'subscription' ? 'subscription' : 'credits'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handlePaymentWithProvider('paystack')}
              >
                <Banknote className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <p className="font-semibold">Paystack</p>
                  <p className="text-xs text-muted-foreground">Pay in Naira (₦) - Bank Transfer, Card, USSD</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handlePaymentWithProvider('stripe')}
              >
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div className="text-center">
                  <p className="font-semibold">Stripe</p>
                  <p className="text-xs text-muted-foreground">Pay in USD/GBP - International Cards</p>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfileSubscription;
