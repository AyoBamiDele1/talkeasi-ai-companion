import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ConversationTimer from '@/components/ConversationTimer';
import RealtimeVoiceInterface from '@/components/RealtimeVoiceInterface';
import TrialEndedModal from '@/components/TrialEndedModal';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Trial = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(60);

  useEffect(() => {
    // Check if trial already used
    const trialUsed = localStorage.getItem('talkeasi_trial_used');
    if (trialUsed) {
      toast({
        title: "Trial Already Used",
        description: "You've already used your free trial. Please create an account to continue.",
        variant: "destructive",
      });
      navigate('/auth?mode=signup');
    }
  }, [navigate, toast]);

  const handleSessionStart = () => {
    setIsSessionActive(true);
  };

  const handleTrialEnd = () => {
    localStorage.setItem('talkeasi_trial_used', 'true');
    setShowModal(true);
    setIsSessionActive(false);
  };

  const handleConversationEnd = () => {
    setIsSessionActive(false);
  };

  const handleMessageUpdate = (newMessages: ConversationMessage[]) => {
    setMessages(newMessages);
  };

  // Show toast at 15 seconds remaining
  useEffect(() => {
    if (isSessionActive && timeRemaining === 15) {
      toast({
        title: "Enjoying this?",
        description: "Create your free account to continue your conversation!",
      });
    }
  }, [timeRemaining, isSessionActive, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      {/* Top Timer Bar */}
      {isSessionActive && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-b">
          <ConversationTimer 
            isActive={isSessionActive} 
            maxMinutes={1}
            onTimeUp={handleTrialEnd}
            label="Free Trial"
          />
        </div>
      )}

      {/* Center Voice Interface */}
      <div className={`${isSessionActive ? 'pt-24' : 'pt-8'} pb-32 px-4`}>
        <div className="max-w-2xl mx-auto text-center mb-6">
          {!isSessionActive && (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Try TalkEasi Free!
              </h1>
              <p className="text-muted-foreground mb-4">
                Practice with our AI coach for 1 minute — no signup needed
              </p>
            </>
          )}
          <p className="text-muted-foreground">💡 Say hello to your AI Coach!</p>
        </div>
        
        <RealtimeVoiceInterface 
          isTrialMode={true}
          onMessageUpdate={handleMessageUpdate}
          onSessionStart={handleSessionStart}
          onSessionEnd={handleConversationEnd}
        />
        
        {/* Show last 3 messages */}
        {messages.length > 0 && (
          <div className="mt-6 max-w-lg mx-auto space-y-2">
            {messages.slice(-3).map(msg => (
              <div 
                key={msg.id} 
                className={`p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary/10 ml-8' 
                    : 'bg-secondary/10 mr-8'
                }`}
              >
                <span className="font-semibold">
                  {msg.role === 'user' ? '💬 You: ' : '🤖 AI: '}
                </span>
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trial Ended Modal */}
      <TrialEndedModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
};

export default Trial;