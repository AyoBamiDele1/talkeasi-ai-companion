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
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6">
        <DialogHeader className="text-center space-y-2 px-2">
          <DialogTitle className="text-xl sm:text-2xl text-center">
            ✨ Your free 2 minutes are up!
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Want to keep talking with your AI friend?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 px-2">
          {/* Primary CTA */}
          <Button 
            size="lg" 
            className="w-full h-auto py-3 text-center min-h-[60px]" 
            onClick={() => navigate('/auth?mode=signup')}
          >
            <span className="flex flex-col items-center gap-1 w-full px-2">
              <span className="text-sm sm:text-base font-semibold text-center">👤 Create Free Account</span>
              <span className="text-[10px] sm:text-xs opacity-90 text-center leading-tight">
                Start with 5 free credits
              </span>
            </span>
          </Button>

          {/* Secondary CTA */}
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full text-center text-sm sm:text-base px-2"
            onClick={() => navigate('/auth?mode=login')}
          >
            <span className="truncate">🔑 Already have an account? Login.</span>
          </Button>
        </div>

        <p className="text-[10px] sm:text-xs text-center text-muted-foreground px-4 leading-relaxed">
          Create an account to save progress and continue learning.
        </p>

        {/* Optional: Social proof */}
        <div className="text-center text-[10px] sm:text-xs text-muted-foreground pt-2 border-t px-4">
          Join 1,000+ people with TalkEasi.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialEndedModal;