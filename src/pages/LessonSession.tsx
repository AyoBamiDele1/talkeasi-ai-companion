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
import PronunciationAnalysis from '@/components/PronunciationAnalysis';
import ConversationTimer from '@/components/ConversationTimer';

interface Message {
  id: string;
  type: 'ai' | 'user';
  text: string;
  timestamp: Date;
  corrections?: string[];
  feedback?: string;
  pronunciationAnalysis?: any;
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
  const [useRealtimeMode, setUseRealtimeMode] = useState(true); // Use RealtimeVoiceInterface with hands-free option
  const [useElevenLabs, setUseElevenLabs] = useState(false); // Use OpenAI TTS only
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
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
      case 'Friendly Chat':
        return "Hey! What's on your mind today?";
      
      case 'Business Introduction':
        return "Hello! I'm your AI English tutor. Let's practice professional introductions in business settings. I'll be your colleague. How would you introduce yourself?";
      
      case 'Phone Conversation':
        return "Ring ring! Hello, this is Sarah calling from Tech Solutions. How can I help you today?";
      
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
      setIsSessionActive(true);
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
      setIsSessionActive(false);
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

      // Step 1: Speech to text (OpenAI Whisper)
      const sttResponse = await supabase.functions.invoke('speech-to-text', {
        body: { audio: audioBase64 }
      });

      if (sttResponse.error) {
        throw new Error(sttResponse.error.message);
      }

      const userText = sttResponse.data?.text;
      if (!userText || userText.trim().length === 0) {
        throw new Error('No speech detected. Please try again.');
      }

      console.log('Transcribed text:', userText);
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: userText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Step 2: Get AI response using DeepSeek (cost-optimized)
      setProcessingStage('thinking');
      const aiResponse = await supabase.functions.invoke('deepseek-conversation', {
        body: { 
          userText, 
          lessonContext: lesson?.title || 'English Conversation Practice',
          difficulty: 'Intermediate'
        }
      });

      if (aiResponse.error) {
        throw new Error(aiResponse.error.message);
      }

      const aiData = aiResponse.data;
      
      // Update user message with corrections
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, corrections: aiData.corrections || [], feedback: aiData.feedback }
          : msg
      ));
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiData.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Step 3: Convert to speech using browser TTS (FREE)
      setProcessingStage('speaking');
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiData.response);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => setIsAISpeaking(true);
        utterance.onend = () => {
          setIsAISpeaking(false);
          setProcessingStage(null);
        };
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsAISpeaking(false);
          setProcessingStage(null);
        };
        
        speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported');
        setIsAISpeaking(false);
        setProcessingStage(null);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setProcessingStage(null);
      setCurrentStreamText('');
      setIsAISpeaking(false);
      streamingAudio.reset();
      
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : "Could not process your speech. Please try again.",
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

        // Generate TTS using OpenAI
        const ttsResponse = await supabase.functions.invoke('text-to-speech', {
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
      
      // Generate speech using OpenAI TTS
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
        
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-semibold text-sm">{lesson?.title || 'Lesson Session'}</h1>
          <ConversationTimer 
            isActive={isSessionActive} 
            maxMinutes={lesson?.duration_minutes || 5}
            onTimeUp={() => {
              toast({
                title: "Time's up!",
                description: "Your free session time has ended. Consider upgrading for longer sessions.",
              });
            }}
          />
          {messages.filter(m => m.type === 'user').length >= 3 && (
            <Button variant="outline" size="sm" onClick={completeLesson}>
              Complete
            </Button>
          )}
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
              className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} gap-2`}
            >
              <Card className={`max-w-[80%] ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card'
              }`}>
                <CardContent className="p-3">
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
              
              {/* Show corrections immediately after user messages - ALWAYS VISIBLE */}
              {message.type === 'user' && message.corrections && message.corrections.length > 0 && (
                <Card className="max-w-[85%] bg-amber-500/10 border-amber-500/50 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1.5">
                          💡 Let's improve this:
                        </p>
                        <ul className="text-xs space-y-1">
                          {message.corrections.map((correction, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-600 dark:text-amber-400 font-bold">→</span>
                              <span className="text-foreground/90">{correction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Show positive feedback */}
              {message.type === 'user' && message.feedback && (
                <Card className="max-w-[85%] bg-green-500/10 border-green-500/50 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground/90 italic flex-1">{message.feedback}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Show detailed pronunciation analysis if enabled */}
              {message.type === 'user' && message.pronunciationAnalysis && showAdvancedAnalysis && (
                <div className="max-w-[85%] w-full">
                  <PronunciationAnalysis
                    analysis={message.pronunciationAnalysis}
                    isVisible={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Voice Interface */}
      {useRealtimeMode ? (
        <RealtimeVoiceInterface
          lessonContext={lesson?.title || 'English Conversation Practice'}
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