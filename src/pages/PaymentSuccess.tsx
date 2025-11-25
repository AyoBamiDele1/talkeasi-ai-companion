import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      navigate("/profile");
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-background p-6">
      <Card className="w-full max-w-md border-primary/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your credits are being added to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Your payment has been processed</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Credits will appear in your account within a few moments. You can refresh your balance in your profile.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/profile")} className="w-full" size="lg">
              View My Balance
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

export default PaymentSuccess;
