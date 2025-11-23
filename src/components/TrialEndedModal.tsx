import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TrialEndedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrialEndedModal = ({ open, onOpenChange }: TrialEndedModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] md:max-w-md">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl">
            ✨ Your free 2 minutes are up!
          </DialogTitle>
          <DialogDescription>
            Want to keep improving your English?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Primary CTA */}
          <Button 
            size="lg" 
            className="w-full h-auto py-3" 
            onClick={() => navigate('/auth?mode=signup')}
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold">👤 Create Free Account</span>
              <span className="text-xs opacity-90">
                Get 5 free credits • 1.25 min Standard OR 0.5 min Premium
              </span>
            </span>
          </Button>

          {/* Secondary CTA */}
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/auth?mode=login')}
          >
            🔑 Already have an account? Login.
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Create an account to save progress, access full lessons, and continue learning.
        </p>

        {/* Optional: Social proof */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          Join 1,000+ learners improving their English daily
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialEndedModal;