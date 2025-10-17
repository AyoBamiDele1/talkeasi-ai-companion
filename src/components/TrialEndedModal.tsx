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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            ✨ Your free minute is up!
          </DialogTitle>
          <DialogDescription className="text-center">
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
                Get 5 bonus credits to continue
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
          Save your progress, unlock full lessons, and chat longer with your AI Coach.
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