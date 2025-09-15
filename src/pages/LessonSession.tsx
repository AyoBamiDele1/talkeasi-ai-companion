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
import { supabase } from '@/integrations/supabase/client';
import { useStreamingAudio } from '@/hooks/useStreamingAudio';
import ProcessingIndicator from '@/components/ProcessingIndicator';

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
  const [processingStage, setProcessingStage] = useState<'transcribing' | 'thinking' | 'generating' | 'speaking' | null>(null);
  const [currentStreamText, setCurrentStreamText] = useState('');
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
  const streamingAudio = useStreamingAudio();

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
      setProcessingStage('transcribing');
      
      // Convert audio blob to base64
      const fileReader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        fileReader.onloadend = () => {
          const base64 = (fileReader.result as string).split(',')[1];
          resolve(base64);
        };
        fileReader.readAsDataURL(audioBlob);
      });

      // Transcribe audio using speech-to-text edge function
      const transcriptionResponse = await supabase.functions.invoke('speech-to-text', {
        body: { audio: audioBase64 }
      });

      if (transcriptionResponse.error) {
        throw new Error('Transcription failed: ' + transcriptionResponse.error.message);
      }

      const transcribedText = transcriptionResponse.data?.text || "Could not transcribe audio";
      
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: transcribedText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      setProcessingStage('thinking');
      
      // Get AI response using conversation edge function (revert to working method)
      const conversationResponse = await supabase.functions.invoke('ai-conversation', {
        body: { 
          userText: transcribedText, 
          lessonContext: lessonTitle,
          difficulty: difficulty
        }
      });

      if (conversationResponse.error) {
        throw new Error('AI response failed: ' + conversationResponse.error.message);
      }

      const aiData = conversationResponse.data;
      console.log('AI conversation response:', aiData);
      const fullAiResponse = aiData?.response || "I didn't quite catch that. Could you try again?";

      // Add AI message with corrections and feedback
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: fullAiResponse,
        timestamp: new Date()
      };

      // Update user message with corrections and feedback then add AI message
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, corrections: aiData?.corrections || [], feedback: aiData?.feedback }
          : msg
      ).concat([aiMessage]));

      setProcessingStage('generating');
      setIsAISpeaking(true);
      
      // Generate optimized TTS for the response
      await speakTextOptimized(fullAiResponse);

      setCurrentStreamText('');
      setProcessingStage(null);
      setIsAISpeaking(false);

    } catch (error) {
      console.error('Error processing audio:', error);
      setProcessingStage(null);
      setCurrentStreamText('');
      setIsAISpeaking(false);
      streamingAudio.reset();
      
      toast({
        title: "Processing error",
        description: "Could not process your speech. Please try again.",
        variant: "destructive"
      });
    }
  };

  const speakTextOptimized = async (text: string) => {
    try {
      setProcessingStage('speaking');
      
      // Split text into sentences for faster TTS generation
      const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;

        // Generate TTS for this sentence
        const ttsResponse = await supabase.functions.invoke('text-to-speech', {
          body: { text: sentence, voice: 'alloy' }
        });

        if (ttsResponse.error) {
          console.error('TTS failed for sentence:', sentence);
          continue;
        }

        const audioContent = ttsResponse.data?.audioContent;
        if (audioContent) {
          streamingAudio.addToQueue({
            audio: audioContent,
            index: i,
            text: sentence
          });
        }
      }
    } catch (error) {
      console.error('Optimized speech synthesis error:', error);
      // Fallback to browser TTS
      fallbackToSpeechSynthesis(text);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsAISpeaking(true);
      
      // Generate speech using text-to-speech edge function
      const ttsResponse = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' }
      });

      if (ttsResponse.error) {
        throw new Error('Speech generation failed');
      }

      // Play the generated audio
      const audioContent = ttsResponse.data?.audioContent;
      if (audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.onended = () => setIsAISpeaking(false);
        audio.onerror = () => {
          setIsAISpeaking(false);
          // Fallback to browser TTS
          fallbackToSpeechSynthesis(text);
        };
        await audio.play();
      } else {
        fallbackToSpeechSynthesis(text);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      fallbackToSpeechSynthesis(text);
    }
  };

  const fallbackToSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsAISpeaking(false);
      utterance.onerror = () => setIsAISpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      setIsAISpeaking(false);
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
          <ProcessingIndicator stage={processingStage} currentText={currentStreamText} />
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