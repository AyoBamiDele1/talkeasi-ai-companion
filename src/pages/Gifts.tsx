import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Send, Download } from "lucide-react";
import GiftCreditsModal from "@/components/GiftCreditsModal";
import ClaimGiftModal from "@/components/ClaimGiftModal";
import { useRealtimeCredits } from "@/hooks/useRealtimeCredits";

const Gifts = () => {
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const { credits, refetch: refetchCredits } = useRealtimeCredits();

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-accent to-[hsl(280,70%,50%)] flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Surprise a Friend with Nova Credits
        </h1>
        <p className="text-muted-foreground">
          Share the joy of conversation
        </p>
      </div>

      {/* Gift Options */}
      <div className="space-y-4 max-w-md mx-auto w-full">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
          onClick={() => setShowGiftModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Gift a Friend</h3>
                <p className="text-sm text-muted-foreground">
                  Send credits to someone special
                </p>
              </div>
              <Button variant="outline" size="sm">
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
          onClick={() => setShowClaimModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Claim Gift</h3>
                <p className="text-sm text-muted-foreground">
                  Redeem a gift code you received
                </p>
              </div>
              <Button variant="outline" size="sm">
                Claim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Balance Info */}
      {credits > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your current balance: <span className="font-semibold text-foreground">{credits} credits</span>
          </p>
        </div>
      )}

      {/* Gift Modals */}
      <GiftCreditsModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        userCredits={credits}
        onGiftSent={refetchCredits}
      />
      <ClaimGiftModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onGiftClaimed={refetchCredits}
      />
    </div>
  );
};

export default Gifts;
