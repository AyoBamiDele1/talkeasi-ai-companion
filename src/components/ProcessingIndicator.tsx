import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mic, MessageSquare, Volume2 } from 'lucide-react';

interface ProcessingIndicatorProps {
  stage: 'transcribing' | 'thinking' | 'generating' | 'speaking' | null;
  currentText?: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ stage, currentText }) => {
  if (!stage) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'transcribing':
        return {
          icon: <Mic className="w-4 h-4 text-primary" />,
          text: 'Converting speech to text...',
          color: 'border-primary/20 bg-primary/5'
        };
      case 'thinking':
        return {
          icon: <MessageSquare className="w-4 h-4 text-accent" />,
          text: 'AI is thinking...',
          color: 'border-accent/20 bg-accent/5'
        };
      case 'generating':
        return {
          icon: <Volume2 className="w-4 h-4 text-success" />,
          text: 'Generating response...',
          color: 'border-success/20 bg-success/5'
        };
      case 'speaking':
        return {
          icon: <Volume2 className="w-4 h-4 text-success" />,
          text: 'Speaking...',
          color: 'border-success/20 bg-success/5'
        };
      default:
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Processing...',
          color: 'border-muted bg-muted/50'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Card className={`mb-4 ${stageInfo.color} border-2`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {stageInfo.icon}
          <span className="text-sm font-medium">{stageInfo.text}</span>
        </div>
        {currentText && (
          <div className="mt-2 p-2 bg-background/50 rounded text-xs">
            <p className="text-muted-foreground">{currentText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingIndicator;