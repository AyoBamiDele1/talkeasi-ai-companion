import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConversationTimerProps {
  isActive: boolean;
  maxMinutes: number;
  onTimeUp?: () => void;
}

const ConversationTimer: React.FC<ConversationTimerProps> = ({ 
  isActive, 
  maxMinutes,
  onTimeUp 
}) => {
  const [seconds, setSeconds] = useState(0);
  const maxSeconds = maxMinutes * 60;

  useEffect(() => {
    if (!isActive) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;
        if (newSeconds >= maxSeconds && onTimeUp) {
          onTimeUp();
          return maxSeconds;
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, maxSeconds, onTimeUp]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = maxSeconds - seconds;
  const progress = (seconds / maxSeconds) * 100;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-background/95 rounded-lg backdrop-blur-md border border-border">
      <Clock className="w-4 h-4 text-primary" />
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-foreground">
          Speaking time: {formatTime(seconds)}
        </div>
        <div className="text-xs text-foreground/70">
          {formatTime(remainingSeconds)} left (Free Plan)
        </div>
      </div>
      <div className="ml-2 w-32 h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ConversationTimer;
