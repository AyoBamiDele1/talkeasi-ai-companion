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
        .single();
      
      if (error) throw error;
      return data;
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
      return data as CreditPackage[];
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
    // Assuming 1 credit per minute for tap-to-talk mode
    const minutes = credits;
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `~${hours} hour${hours > 1 ? 's' : ''}`;
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
          
          {userCredits && userCredits.balance < 20 && userCredits.balance > 0 && (
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
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">₦{pkg.price_ngn.toLocaleString()}</div>
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

      {/* Credit Rates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Credit Usage Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm font-medium">Tap to Talk</span>
              <span className="text-sm text-muted-foreground">5 credits per 5 min</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm font-medium">Hands-Free Enhanced</span>
              <span className="text-sm text-muted-foreground">7 credits per 5 min</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm font-medium">Hands-Free Premium</span>
              <span className="text-sm text-muted-foreground">50 credits per 5 min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map(txn => (
                <div key={txn.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${
                      txn.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {txn.amount > 0 ? '+' : ''}{txn.amount}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Balance: {txn.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your transaction history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSubscription;