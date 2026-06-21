import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, CreditCard, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type VerifyState = "verifying" | "success" | "error" | "idle";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [state, setState] = useState<VerifyState>("idle");
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;

    const reference = params.get("reference") || params.get("trxref");

    const verifyPaystack = async (ref: string) => {
      setState("verifying");
      for (let attempt = 1; attempt <= 6; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("paystack-verify", {
            body: { reference: ref },
          });
          if (error) throw error;
          if (data?.success) {
            setCreditsAdded(data.credits ?? null);
            setNewBalance(data.newBalance ?? null);
            setState("success");
            toast({
              title: "Credits added!",
              description: data.credits
                ? `${data.credits} credits are now in your account.`
                : "Your payment was verified.",
            });
            return;
          }
        } catch (e: any) {
          console.error("[PaymentSuccess] Verify attempt failed:", e);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      // Fallback: try sync by email
      try {
        const { data } = await supabase.functions.invoke("paystack-sync", { body: {} });
        if (data?.success && data?.creditedTotal > 0) {
          setCreditsAdded(data.creditedTotal);
          setState("success");
          toast({ title: "Credits added!", description: `${data.creditedTotal} credits recovered.` });
          return;
        }
      } catch (e) {
        console.error("[PaymentSuccess] Sync fallback failed:", e);
      }
      setErrorMsg(
        "We couldn't confirm your payment yet. If your bank confirmed it, please refresh in a minute or contact support."
      );
      setState("error");
    };

    const fetchBalance = async (userId: string): Promise<number | null> => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !data) return null;
      return data.balance as number;
    };

    // Stripe returns to /payment-success with no reference. The credits are added
    // asynchronously by the Stripe webhook, so poll the balance until it increases.
    const verifyStripe = async (userId: string) => {
      setState("verifying");
      const baseline = (await fetchBalance(userId)) ?? 0;
      for (let attempt = 1; attempt <= 10; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        const current = await fetchBalance(userId);
        if (current !== null && current > baseline) {
          setCreditsAdded(current - baseline);
          setNewBalance(current);
          setState("success");
          toast({
            title: "Credits added!",
            description: `${current - baseline} credits are now in your account.`,
          });
          return;
        }
      }
      // Webhook may still be processing — show success but advise a refresh if needed.
      setState("success");
    };

    // Paystack sometimes strips our query params and only returns ?reference= or ?trxref=
    if (reference) {
      ranRef.current = true;
      verifyPaystack(reference);
    } else if (user) {
      ranRef.current = true;
      verifyStripe(user.id);
    }
    // If no reference and user not loaded yet, wait for the next effect run.
  }, [params, navigate, toast, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-background p-6">
      <Card className="w-full max-w-md border-primary/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              {state === "verifying" ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : state === "error" ? (
                <AlertCircle className="w-12 h-12 text-destructive" />
              ) : (
                <CheckCircle2 className="w-12 h-12 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {state === "verifying"
              ? "Confirming your payment…"
              : state === "error"
              ? "Verification pending"
              : "Payment successful!"}
          </CardTitle>
          <CardDescription>
            {state === "verifying"
              ? "Hang tight — we're syncing your credits with Paystack."
              : state === "error"
              ? errorMsg
              : creditsAdded
              ? `${creditsAdded} credits added${newBalance !== null ? ` — new balance: ${newBalance}` : ""}.`
              : "Your credits are being added to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                {state === "verifying"
                  ? "Verifying with the payment provider…"
                  : "Your payment has been processed"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate("/profile")} className="w-full" size="lg">
              View My Balance
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => navigate("/home")} variant="outline" className="w-full">
              Start Talking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
