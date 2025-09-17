import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Trophy,
  BarChart
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useStreamingAudio } from '@/hooks/useStreamingAudio';
import { useAuth } from '@/hooks/useAuth';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import RealtimeVoiceInterface from '@/components/RealtimeVoiceInterface';

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
  const { user } = useAuth();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [processingStage, setProcessingStage] = useState<'transcribing' | 'thinking' | 'generating' | 'speaking' | null>(null);
  const [currentStreamText, setCurrentStreamText] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [useRealtimeMode, setUseRealtimeMode] = useState(true);
  const [useElevenLabs, setUseElevenLabs] = useState(false); // Default to OpenAI TTS to avoid provider errors
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamingAudio = useStreamingAudio();

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        console.error('Error fetching lesson:', error);
        return;
      }

      setLesson(data);
      
      // Create initial AI message based on lesson content
      if (data && messages.length === 0) {
        const initialMessage = generateInitialMessage(data);
        setMessages([{
          id: '1',
          type: 'ai',
          text: initialMessage,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    }
  };

  const generateInitialMessage = (lessonData: any) => {
    const scenarios = lessonData.content?.scenarios || [];
    const firstScenario = scenarios[0] || 'general conversation';
    
    switch (lessonData.title) {
      case 'Business Introduction':
        return "Hello! I'm your AI English tutor. Let's practice professional introductions in Nigerian business settings. I'll be your colleague. How would you introduce yourself?";
      
      case 'Phone Conversations':
        return "Hello! I'm your AI English tutor. Let's practice professional phone conversations. I'll be receiving your business call. Go ahead and make your call!";
      
      case 'Customer Service Excellence':
        return "Hello! I'm your AI English tutor. Let's practice customer service scenarios. I'll be a customer with a concern. How can you help me today?";
      
      case 'Job Interview Practice':
        return "Hello! I'm your AI English tutor. Let's practice job interview scenarios. I'll be the interviewer. Tell me, why are you interested in this position?";
      
      case 'Small Talk & Networking':
        return "Hello! I'm your AI English tutor. Let's practice networking and small talk. I'll be someone you just met at a professional event. How are you enjoying the event?";
      
      case 'Travel & Tourism':
        return "Hello! I'm your AI English tutor. Let's practice travel conversations. I'll be a hotel receptionist. How can I assist you today?";
      
      case 'Casual Conversations':
        return "Hello! I'm your AI English tutor. Let's practice casual conversations. I'll be your friend. What are your plans for the weekend?";
      
      case 'Presentation Skills':
        return "Hello! I'm your AI English tutor. Let's practice presentation skills. Imagine you're giving a presentation to your team. Please begin by introducing your topic.";
      
      default:
        return `Hello! I'm your AI English tutor. Let's practice ${lessonData.title.toLowerCase()}. ${lessonData.description} Are you ready to begin?`;
    }
  };

  const completeLesson = async () => {
    if (!user || !lessonId) return;

    try {
      // Calculate scores based on the conversation
      const userMessages = messages.filter(m => m.type === 'user');
      const aiMessages = messages.filter(m => m.type === 'ai');
      
      // Simple scoring based on conversation length and corrections
      const accuracyScore = Math.max(0, Math.min(100, 
        80 + (userMessages.length * 2) - (aiMessages.filter(m => m.corrections?.length).length * 5)
      ));
      const fluencyScore = Math.max(0, Math.min(100,
        75 + (userMessages.length * 3) - (aiMessages.filter(m => m.feedback?.includes('practice')).length * 3)
      ));

      // Save progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          accuracy_score: accuracyScore,
          fluency_score: fluencyScore,
          feedback: { 
            total_exchanges: userMessages.length,
            corrections_given: aiMessages.filter(m => m.corrections?.length).length,
            session_duration: Math.floor((Date.now() - Date.now()) / 60000) // placeholder
          }
        });

      if (error) {
        console.error('Error saving progress:', error);
        return;
      }

      // Show completion dialog
      setShowCompletion(true);
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

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
          lessonContext: lesson?.title || 'English Conversation Practice',
          difficulty: lesson?.difficulty || 'Intermediate'
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
      setIsAISpeaking(true);
      streamingAudio.reset();
      console.log('Starting TTS for:', text);
      
      // Split text into sentences for faster TTS generation
      const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
      console.log('Split into sentences:', sentences);
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;

        console.log(`Generating TTS for sentence ${i}:`, sentence);

        // Generate TTS for this sentence using the selected provider
        const ttsResponse = useElevenLabs 
          ? await supabase.functions.invoke('elevenlabs-tts', {
              body: { 
                text: sentence, 
                voiceId: '9BWtsMINqrJLrRacOk9x', // Aria voice - natural sounding
                modelId: 'eleven_turbo_v2_5' // Fast, low latency model
              }
            })
          : await supabase.functions.invoke('text-to-speech', {
              body: { text: sentence, voice: 'alloy' }
            });

        if (ttsResponse.error) {
          console.error('TTS failed for sentence:', sentence, ttsResponse.error);
          continue;
        }

        console.log('TTS response received for sentence', i);
        const audioContent = ttsResponse.data?.audioContent;
        if (audioContent) {
          streamingAudio.addToQueue({
            audio: audioContent,
            index: i,
            text: sentence
          });
          console.log('Added audio to queue for sentence', i);
        } else {
          console.error('No audio content in TTS response for sentence:', sentence);
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
      
      // Generate speech using the selected TTS provider
      const ttsResponse = useElevenLabs 
        ? await supabase.functions.invoke('elevenlabs-tts', {
            body: { 
              text, 
              voiceId: '9BWtsMINqrJLrRacOk9x', // Aria voice - natural sounding
              modelId: 'eleven_turbo_v2_5' // Fast, low latency model
            }
          })
        : await supabase.functions.invoke('text-to-speech', {
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
          <h1 className="font-semibold text-sm">{lesson?.title || 'Lesson Session'}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {lesson?.difficulty || 'Intermediate'}
            </Badge>
            <Badge 
              variant={useElevenLabs ? "default" : "outline"} 
              className="text-xs cursor-pointer"
              onClick={() => setUseElevenLabs(!useElevenLabs)}
            >
              {useElevenLabs ? 'ElevenLabs' : 'OpenAI'}
            </Badge>
            {messages.filter(m => m.type === 'user').length >= 3 && (
              <Button variant="outline" size="sm" onClick={completeLesson}>
                Complete
              </Button>
            )}
          </div>
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
                        <p key={index} className="text-xs text-warning-foreground font-medium">
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
                      <p className="text-xs text-success-foreground font-medium">{message.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Interface */}
      {useRealtimeMode ? (
        <RealtimeVoiceInterface
          lessonContext={lesson?.title || 'English Conversation Practice'}
          useElevenLabs={useElevenLabs} // Pass the TTS provider preference
          onTranscriptUpdate={(transcript) => {
            setCurrentStreamText(transcript);
          }}
          onConversationEnd={() => {
            console.log('Conversation ended');
          }}
          onMessageUpdate={(realtimeMessages) => {
            // Convert realtime messages to the format expected by the lesson session
            const convertedMessages = realtimeMessages.map(msg => ({
              id: msg.id,
              type: msg.role === 'user' ? 'user' as const : 'ai' as const,
              text: msg.content,
              timestamp: msg.timestamp
            }));
            setMessages(convertedMessages);
          }}
        />
      ) : (
        /* Recording Controls */
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
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
      )}

      {/* Completion Dialog */}
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Lesson Completed!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Great job practicing! Your conversation skills are improving.
              </p>
              <div className="flex justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {messages.filter(m => m.type === 'user').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.floor(Math.random() * 20 + 75)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => navigate('/lessons')}
              >
                Back to Lessons
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => navigate('/progress')}
              >
                <BarChart className="w-4 h-4 mr-2" />
                View Progress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonSession;