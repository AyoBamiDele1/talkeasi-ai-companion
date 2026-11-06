import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntroOffer } from "@/hooks/useIntroOffer";
import { INTRO_OFFER, formatIntroPrices } from "@/config/introOffer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IntroOfferModal = ({ open, onOpenChange }: Props) => {
  const { isNigeria, startCheckout } = useIntroOffer();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { price, regular } = formatIntroPrices(isNigeria);

  const handleBuy = async () => {
    setLoading(true);
    try {
      await startCheckout();
    } catch (e) {
      toast({
        title: "Couldn't start payment",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            First-time welcome offer
          </span>
          <DialogTitle className="text-2xl">Your free minutes are up</DialogTitle>
          <DialogDescription>
            Keep talking with Nova — get your first hour for less.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-foreground">{price}</span>
            <span className="text-lg text-muted-foreground line-through">{regular}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {INTRO_OFFER.credits} credits • {INTRO_OFFER.talkTime} of talk time • one-time only
          </p>
        </div>

        <Button onClick={handleBuy} disabled={loading} size="lg" className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Get my hour for {price}
        </Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default IntroOfferModal;
