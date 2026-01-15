import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Send, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface GiftCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCredits: number;
  onGiftSent?: () => void;
}

const GiftCreditsModal: React.FC<GiftCreditsModalProps> = ({
  isOpen,
  onClose,
  userCredits,
  onGiftSent
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [giftCode, setGiftCode] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendGift = async () => {
    if (!recipientEmail || !creditsAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter recipient email and credits amount",
        variant: "destructive"
      });
      return;
    }

    if (creditsAmount > userCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You only have ${userCredits} credits available`,
        variant: "destructive"
      });
      return;
    }

    if (creditsAmount < 5) {
      toast({
        title: "Minimum Gift",
        description: "Minimum gift amount is 5 credits",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gift-credits', {
        body: {
          action: 'send',
          recipient_email: recipientEmail.toLowerCase().trim(),
          credits_amount: creditsAmount,
          message: message.trim() || null
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGiftCode(data.gift_code);
      onGiftSent?.();
      
      toast({
        title: "Gift Sent! 🎁",
        description: `${creditsAmount} credits sent to ${recipientEmail}`
      });

    } catch (error: any) {
      console.error('Error sending gift:', error);
      toast({
        title: "Failed to Send Gift",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecipientEmail('');
    setCreditsAmount(10);
    setMessage('');
    setGiftCode(null);
    onClose();
  };

  const quickAmounts = [5, 10, 25, 50];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Gift Credits to a Friend
          </DialogTitle>
          <DialogDescription>
            Share your Nova credits with friends and family
          </DialogDescription>
        </DialogHeader>

        {giftCode ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Gift Sent Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Your friend will receive an email with this gift code:
            </p>
            <div className="bg-muted rounded-lg px-4 py-3 font-mono text-lg tracking-wider">
              {giftCode}
            </div>
            <p className="text-xs text-muted-foreground">
              The gift will expire in 30 days if not claimed
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Friend's Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Credits to Gift</Label>
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map(amount => (
                  <Button
                    key={amount}
                    variant={creditsAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreditsAmount(amount)}
                    disabled={isLoading || amount > userCredits}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min={5}
                  max={Math.min(500, userCredits)}
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                  className="w-24"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  of {userCredits} available
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hope you enjoy talking with Nova! 💜"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                disabled={isLoading}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {giftCode ? (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendGift} 
                disabled={isLoading || !recipientEmail || creditsAmount < 5 || creditsAmount > userCredits}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send {creditsAmount} Credits
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiftCreditsModal;
