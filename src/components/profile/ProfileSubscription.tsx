import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ProfileSubscriptionProps {
  onBack: () => void;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_ngn: number;
  bonus_percentage: number;
  display_order: number;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

const convertNgnToUsd = (ngn: number): string => {
  const USD_TO_NGN_RATE = 1500; // Fixed rate: 1 USD = 1500 NGN
  const usd = ngn / USD_TO_NGN_RATE;
  return usd.toFixed(2); // Return with 2 decimal places
};

const ProfileSubscription = ({ onBack }: ProfileSubscriptionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user credits
  const { data: userCredits, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && (error as any).code !== 'PGRST116') throw error;
      return data ?? { balance: 0 } as any;
    },
    enabled: !!user?.id
  });

  // Fetch credit packages
  const { data: packages } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      
      // Map package names to correct display names
      return (data as CreditPackage[]).map(pkg => {
        if (pkg.price_ngn === 1000 && pkg.credits === 50) {
          return { ...pkg, name: 'Standard Mode Pack' };
        }
        if (pkg.price_ngn === 2500 && pkg.credits === 20) {
          return { ...pkg, name: 'Premium Mode Pack' };
        }
        return pkg;
      });
    }
  });

  // Fetch transaction history
  const { data: transactions } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user?.id
  });

  const calculateEstimatedTime = (credits: number) => {
    // Using new rate: 2 credits per minute
    const minutes = Math.floor(credits / 2);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `~${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `~${hours}h ${remainingMinutes}m`;
  };

  const handlePurchase = (packageId: string) => {
    toast({
      title: "Manual Top-Up Required",
      description: "Please contact support@talkeasi.com with your payment proof to top up your account.",
      duration: 8000
    });
  };

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
          <h1 className="text-2xl font-bold text-foreground">Credits</h1>
          <p className="text-muted-foreground text-sm">Manage your practice credits</p>
        </div>
      </div>

      {/* Credit Balance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Your Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary mb-2">
            {userCredits?.balance || 0} credits
          </div>
          <p className="text-muted-foreground text-sm">
            ≈ {calculateEstimatedTime(userCredits?.balance || 0)} of practice time
          </p>
          
          {userCredits && userCredits.balance < 10 && userCredits.balance > 0 && (
            <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Low Credits</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have {userCredits.balance} credits remaining. Top up to continue practicing!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {packages?.map(pkg => (
            <Card key={pkg.id} className={pkg.bonus_percentage > 0 ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.name}</span>
                  {pkg.bonus_percentage > 0 && (
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      +{pkg.bonus_percentage}% Bonus
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2 font-bold">
                  {pkg.price_ngn === 1000 && pkg.credits === 50 && "✨ Enjoy smooth, natural conversations for everyday use."}
                  {pkg.price_ngn === 2500 && pkg.credits === 20 && "✨ Instant response, feels like talking to a friend."}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  ₦{pkg.price_ngn.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    (~${convertNgnToUsd(pkg.price_ngn)})
                  </span>
                </div>
                <p className="text-lg font-semibold mb-1">{pkg.credits} credits</p>
                <p className="text-sm text-muted-foreground mb-4">
                  ≈ {calculateEstimatedTime(pkg.credits)}
                </p>
                <Button onClick={() => handlePurchase(pkg.id)} className="w-full">
                  Buy Credits
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Usage */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Voice Mode Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Standard Mode */}
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold">Standard Mode</p>
                  <p className="text-xs text-muted-foreground mt-1">Smooth, natural conversations. Smooth friendly voice.</p>
                </div>
                <Badge variant="secondary">2 credits/min</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                ₦1,000 (~$0.69) = 50 credits = 25 minutes • $0.026/min
              </div>
            </div>

            {/* Premium Mode */}
            <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    Premium Mode
                    <Badge variant="default" className="text-xs">Best</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ultra-realistic instant voice chat. Feels like talking to a real person.</p>
                </div>
                <Badge variant="default">2 credits/min</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                ₦2,500 (~$1.67) = 20 credits = 10 minutes • $0.167/min
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Standard: 50 credits = 25 mins • Premium: 20 credits = 10 mins
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProfileSubscription;