import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useUserLocation } from "@/hooks/useUserLocation";

interface ProfileSubscriptionProps {
  onBack: () => void;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_ngn: number;
  price_usd: number;
  price_gbp: number;
  package_type: string;
  billing_interval?: string;
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
  const { location, loading: locationLoading, formatPrice, getSecondaryPrices } = useUserLocation();

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

  const calculateEstimatedTime = (credits: number, mode: 'standard' | 'premium' = 'standard') => {
    const creditsPerMinute = mode === 'premium' ? 10 : 4;
    const minutes = Math.floor(credits / creditsPerMinute);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p>≈ {calculateEstimatedTime(userCredits?.balance || 0, 'standard')} Standard Mode</p>
            <p>≈ {calculateEstimatedTime(userCredits?.balance || 0, 'premium')} Premium Mode</p>
          </div>
          
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
        {locationLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {packages?.map(pkg => (
              <Card key={pkg.id} className={pkg.package_type === 'monthly' ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge variant={pkg.package_type === 'monthly' ? 'default' : 'secondary'}>
                      {pkg.package_type === 'monthly' ? 'Monthly' : 'One-Time'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-3xl font-bold mb-1">
                      {formatPrice(pkg.price_ngn, pkg.price_usd, pkg.price_gbp)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getSecondaryPrices(pkg.price_ngn, pkg.price_usd, pkg.price_gbp)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-lg font-semibold">{pkg.credits} credits</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>🎯 Standard: {calculateEstimatedTime(pkg.credits, 'standard')}</p>
                      <p>⚡ Premium: {calculateEstimatedTime(pkg.credits, 'premium')}</p>
                    </div>
                  </div>
                  
                  <Button onClick={() => handlePurchase(pkg.id)} className="w-full">
                    {pkg.package_type === 'monthly' ? 'Subscribe' : 'Buy Credits'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Voice Mode Pricing */}
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
                  <p className="text-sm font-semibold">🎯 Standard Mode</p>
                  <p className="text-xs text-muted-foreground mt-1">Smooth, natural conversations with friendly voice</p>
                </div>
                <Badge variant="secondary">4 credits/min</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Example: 90 credits = 22.5 minutes
              </div>
            </div>

            {/* Premium Mode */}
            <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    ⚡ Premium Mode
                    <Badge variant="default" className="text-xs">Fastest</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ultra-realistic instant response, feels like a real person</p>
                </div>
                <Badge variant="default">10 credits/min</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Example: 90 credits = 9 minutes
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Choose Standard for longer practice sessions, Premium for natural instant conversations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProfileSubscription;