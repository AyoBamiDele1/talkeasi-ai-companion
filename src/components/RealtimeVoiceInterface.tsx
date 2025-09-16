import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, ArrowLeft } from 'lucide-react';

interface RealtimeVoiceInterfaceProps {
  lessonContext?: string;
  onTranscriptUpdate?: (transcript: string) => void;
  onConversationEnd?: () => void;
  onMessageUpdate?: (messages: ConversationMessage[]) => void;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({ 
  lessonContext, 
  onTranscriptUpdate,
  onConversationEnd,
  onMessageUpdate
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const chatRef = useRef<RealtimeChat | null>(null);
  const messageIdCounter = useRef(0);

  const handleMessage = (event: any) => {
    console.log('Received realtime message:', event.type);
    
    switch (event.type) {
      case 'session.created':
        console.log('Session created successfully');
        break;
        
      case 'session.updated':
        console.log('Session updated:', event.session);
        break;
        
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        break;
        
      case 'response.audio_transcript.delta':
        setCurrentTranscript(prev => prev + event.delta);
        onTranscriptUpdate?.(currentTranscript + event.delta);
        break;
        
      case 'response.audio_transcript.done':
        // Add AI message to conversation
        if (currentTranscript.trim()) {
          const aiMessage: ConversationMessage = {
            id: `ai-${messageIdCounter.current++}`,
            role: 'assistant',
            content: currentTranscript.trim(),
            timestamp: new Date()
          };
          const newMessages = [...messagesRef.current, aiMessage];
          setMessages(newMessages);
          messagesRef.current = newMessages;
          onMessageUpdate?.(newMessages);
          setCurrentTranscript('');
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        // Add user message to conversation
        if (event.transcript?.trim()) {
          const userMessage: ConversationMessage = {
            id: `user-${messageIdCounter.current++}`,
            role: 'user',
            content: event.transcript.trim(),
            timestamp: new Date()
          };
          const newMessages = [...messagesRef.current, userMessage];
          setMessages(newMessages);
          messagesRef.current = newMessages;
          onMessageUpdate?.(newMessages);
        }
        break;
        
      case 'error':
        console.error('Realtime error:', event.error);
        toast({
          title: "Error",
          description: event.error?.message || 'An error occurred',
          variant: "destructive",
        });
        break;
    }
  };

  const startConversation = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.connect();
      setIsConnected(true);
      setMessages([]);
      
      toast({
        title: "Connected",
        description: "Real-time voice conversation is ready",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    if (chatRef.current) {
      chatRef.current.disconnect();
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setCurrentTranscript('');
    onConversationEnd?.();
    
    toast({
      title: "Disconnected",
      description: "Voice conversation ended",
    });
  };

  useEffect(() => {
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
      <div className="max-w-md mx-auto">
        {/* Connection Status */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? "Real-time Connected" : "Real-time Offline"}
            </Badge>
            {isConnected && isSpeaking && (
              <div className="flex items-center gap-1 text-success text-xs">
                <Volume2 className="w-3 h-3" />
                <span>AI Speaking</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {!isConnected 
              ? "Tap to start real-time conversation" 
              : isConnecting
              ? "Connecting..."
              : "Speak naturally - AI will respond instantly"
            }
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/lessons')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {!isConnected ? (
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
              onClick={startConversation}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90"
              onClick={endConversation}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            disabled={!isConnected}
          >
            {isConnected && !isSpeaking ? (
              <Mic className="w-5 h-5 text-success" />
            ) : (
              <MicOff className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RealtimeVoiceInterface;