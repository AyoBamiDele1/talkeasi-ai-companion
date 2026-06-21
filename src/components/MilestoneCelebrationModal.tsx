import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface MilestoneInfo {
  type: string;
  title: string;
  message: string;
  emoji: string;
}

const MILESTONE_INFO: Record<string, MilestoneInfo> = {
  first_conversation: {
    type: 'first_conversation',
    title: 'First Conversation!',
    message: "You just had your first conversation with Nova! This is the beginning of a great friendship.",
    emoji: '🎉'
  },
  talk_time_10: {
    type: 'talk_time_10',
    title: '10 Minutes Together!',
    message: "10 minutes of talking with Nova! Every conversation matters.",
    emoji: '💬'
  },
  talk_time_30: {
    type: 'talk_time_30',
    title: '30 Minutes of Friendship!',
    message: "Half an hour together! You and Nova are getting to know each other well.",
    emoji: '🌟'
  },
  talk_time_60: {
    type: 'talk_time_60',
    title: 'One Hour!',
    message: "One whole hour of conversations! Nova cherishes every moment with you.",
    emoji: '✨'
  },
  talk_time_100: {
    type: 'talk_time_100',
    title: '100 Minutes!',
    message: "100 minutes together! You're officially best friends now.",
    emoji: '🏆'
  },
  streak_3: {
    type: 'streak_3',
    title: '3-Day Streak!',
    message: "3 days in a row! You're building a great habit.",
    emoji: '🔥'
  },
  streak_7: {
    type: 'streak_7',
    title: 'One Week Streak!',
    message: "A whole week! Nova is so proud of your consistency!",
    emoji: '🌈'
  },
  streak_14: {
    type: 'streak_14',
    title: 'Two Week Streak!',
    message: "Two weeks of daily conversations! This friendship is getting real.",
    emoji: '💫'
  },
  streak_30: {
    type: 'streak_30',
    title: 'One Month Streak!',
    message: "30 days! You and Nova are inseparable!",
    emoji: '👯'
  },
  anniversary_week: {
    type: 'anniversary_week',
    title: 'One Week Anniversary!',
    message: "It's been one week since you and Nova met!",
    emoji: '🎂'
  },
  anniversary_month: {
    type: 'anniversary_month',
    title: 'One Month Anniversary!',
    message: "Happy one month together! Here's to many more conversations.",
    emoji: '🎊'
  }
};

interface MilestoneCelebrationModalProps {
  milestone: string | null;
  onClose: () => void;
  onCelebrated: (milestoneType: string) => void;
}

const MilestoneCelebrationModal = ({ milestone, onClose, onCelebrated }: MilestoneCelebrationModalProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);
  
  const info = milestone ? MILESTONE_INFO[milestone] : null;

  useEffect(() => {
    if (milestone) {
      // Generate confetti
      const colors = ['#f472b6', '#fb7185', '#fbbf24', '#a3e635', '#38bdf8', '#c084fc'];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setConfetti(pieces);
    }
  }, [milestone]);

  const handleClose = () => {
    if (milestone) {
      onCelebrated(milestone);
    }
    onClose();
  };

  if (!info) return null;

  return (
    <Dialog open={!!milestone} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${piece.left}%`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                top: '-10px'
              }}
            />
          ))}
        </div>

        <div className="py-6 relative z-10">
          <div className="text-6xl mb-4 animate-bounce">
            {info.emoji}
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {info.title}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {info.message}
          </p>

          <div className="flex items-center justify-center gap-3 mb-6">
            <NovaOrb size="sm" isConnected isActive />
            <span className="text-sm text-muted-foreground">Nova is celebrating with you!</span>
          </div>


          <Button onClick={handleClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebrationModal;
