import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ClaimGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGiftClaimed?: () => void;
}

const ClaimGiftModal: React.FC<ClaimGiftModalProps> = ({
  isOpen,
  onClose,
  onGiftClaimed
}) => {
  const [giftCode, setGiftCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [claimed, setClaimed] = useState<{ credits: number; message?: string } | null>(null);
  const { toast } = useToast();

  const handleClaimGift = async () => {
    if (!giftCode.trim()) {
      toast({
        title: "Enter Gift Code",
        description: "Please enter the gift code you received",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gift-credits', {
        body: {
          action: 'claim',
          gift_code: giftCode.trim()
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setClaimed({
        credits: data.credits_received,
        message: data.message
      });

      onGiftClaimed?.();
      
      toast({
        title: "Gift Claimed! 🎉",
        description: `You received ${data.credits_received} credits!`
      });

    } catch (error: any) {
      console.error('Error claiming gift:', error);
      toast({
        title: "Failed to Claim Gift",
        description: error.message || "Please check your gift code and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGiftCode('');
    setClaimed(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Claim Gift Credits
          </DialogTitle>
          <DialogDescription>
            Enter the gift code you received to claim your credits
          </DialogDescription>
        </DialogHeader>

        {claimed ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">
              +{claimed.credits} Credits Added!
            </h3>
            {claimed.message && (
              <div className="bg-muted rounded-lg px-4 py-3 text-sm italic">
                "{claimed.message}"
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Your credits are ready to use
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Gift Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 12-character code"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toLowerCase())}
                disabled={isLoading}
                className="font-mono text-center tracking-widest"
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground text-center">
                Check your email for the gift code
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {claimed ? (
            <Button onClick={handleClose} className="w-full">
              Start Chatting with Nova
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleClaimGift} 
                disabled={isLoading || !giftCode.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Claim Gift
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

export default ClaimGiftModal;
