import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';

interface RealtimeVoiceInterfaceProps {
  lessonContext?: string;
  onTranscriptUpdate?: (transcript: string) => void;
  onConversationEnd?: () => void;
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
  onConversationEnd 
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
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
          setMessages(prev => [...prev, aiMessage]);
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
          setMessages(prev => [...prev, userMessage]);
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
    <div className="flex flex-col gap-4 h-full">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Real-time Voice Chat</CardTitle>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!isConnected ? (
              <Button 
                onClick={startConversation}
                disabled={isConnecting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Start Conversation"}
              </Button>
            ) : (
              <Button 
                onClick={endConversation}
                variant="destructive"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Conversation
              </Button>
            )}
            
            {isConnected && (
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <div className="flex items-center gap-2 text-success">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">AI Speaking</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Listening</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Transcript */}
      {currentTranscript && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground mb-2">AI is saying:</div>
            <div className="text-foreground">{currentTranscript}</div>
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      {messages.length > 0 && (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!isConnected && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">
              Click "Start Conversation" to begin a real-time voice chat with your AI tutor. 
              The conversation will be fully interactive - just speak naturally and the AI will respond in real-time.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealtimeVoiceInterface;