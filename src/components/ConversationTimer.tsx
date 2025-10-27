import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConversationTimerProps {
  isActive: boolean;
  label?: string;
}

const ConversationTimer: React.FC<ConversationTimerProps> = ({ 
  isActive, 
  label
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-background/95 rounded-lg backdrop-blur-md border border-border">
      <Clock className="w-4 h-4 text-primary" />
      <div className="text-sm font-medium text-foreground">
        Speaking time: {formatTime(seconds)}
      </div>
    </div>
  );
};

export default ConversationTimer;
