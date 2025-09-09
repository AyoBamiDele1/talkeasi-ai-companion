import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  RotateCcw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  type: 'ai' | 'user';
  text: string;
  timestamp: Date;
  corrections?: string[];
  feedback?: string;
}

const LessonSession = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      text: "Hello! I'm your AI English tutor. Let's practice ordering food at a restaurant. I'll be the waiter. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Mock lesson data
  const lessonTitle = "Ordering Food at a Restaurant";
  const difficulty = "Intermediate";

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleAudioSubmission(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak your response clearly"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleAudioSubmission = async (audioBlob: Blob) => {
    try {
      // TODO: Implement actual speech-to-text with OpenAI Whisper via Supabase Edge Function
      // For now, we'll simulate the process
      
      toast({
        title: "Processing speech...",
        description: "Converting your speech to text"
      });

      // Simulate API processing delay
      setTimeout(() => {
        // Mock transcription and AI response
        const mockUserText = "I'd like to order a chicken burger with fries, please.";
        const mockCorrections = ["'I would like' is more formal than 'I'd like'"];
        const mockAIResponse = "Great choice! Would you like anything to drink with that? Also, I noticed you could say 'I would like to order' instead of 'I'd like' for more formal speech.";

        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          text: mockUserText,
          timestamp: new Date(),
          corrections: mockCorrections,
          feedback: "Good pronunciation! Keep practicing formal expressions."
        };

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: mockAIResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);
        
        // Simulate text-to-speech for AI response
        speakText(mockAIResponse);
        
        toast({
          title: "Response processed!",
          description: "AI has responded with feedback"
        });
      }, 2000);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing error",
        description: "Could not process your speech. Please try again.",
        variant: "destructive"
      });
    }
  };

  const speakText = (text: string) => {
    // TODO: Implement ElevenLabs TTS via Supabase Edge Function
    // For now, use browser's speech synthesis
    setIsAISpeaking(true);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsAISpeaking(false);
      utterance.onerror = () => setIsAISpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsAISpeaking(false), 3000);
    }
  };

  const replayLastAI = () => {
    const lastAIMessage = [...messages].reverse().find(m => m.type === 'ai');
    if (lastAIMessage) {
      speakText(lastAIMessage.text);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/lessons')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <h1 className="font-semibold text-sm">{lessonTitle}</h1>
          <Badge variant="secondary" className="text-xs mt-1">
            {difficulty}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={replayLastAI}
          disabled={isAISpeaking}
        >
          {isAISpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Conversation */}
      <div className="flex-1 p-4 pb-32 overflow-y-auto">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card'
              }`}>
                <CardContent className="p-3">
                  <p className="text-sm">{message.text}</p>
                  
                  {message.corrections && message.corrections.length > 0 && (
                    <div className="mt-2 p-2 bg-warning/10 rounded border-l-2 border-warning">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3 text-warning" />
                        <span className="text-xs font-medium text-warning">Correction</span>
                      </div>
                      {message.corrections.map((correction, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          {correction}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {message.feedback && (
                    <div className="mt-2 p-2 bg-success/10 rounded border-l-2 border-success">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-xs font-medium text-success">Feedback</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{message.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              {isRecording ? "Recording... Tap to stop" : "Tap to speak"}
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={replayLastAI}
              disabled={isAISpeaking || isRecording}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              className={`w-16 h-16 rounded-full ${
                isRecording 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
              onMouseDown={isRecording ? stopRecording : startRecording}
              onTouchStart={isRecording ? stopRecording : startRecording}
              disabled={isAISpeaking}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/lessons')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonSession;