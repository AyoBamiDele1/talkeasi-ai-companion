import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, MessageSquare, Phone, PhoneOff, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ProcessingIndicator from './ProcessingIndicator';
import { RealtimeChat, DeepSeekRealtimeChat } from '@/utils/RealtimeAudio';
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  corrections?: string[];
  feedback?: string;
}
interface RealtimeVoiceInterfaceProps {
  lessonContext?: string;
  onTranscriptUpdate?: (transcript: string) => void;
  onConversationEnd?: () => void;
  onMessageUpdate?: (messages: ConversationMessage[]) => void;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  isTrialMode?: boolean;
}

// Audio recording class
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  async start() {
    try {
      this.audioChunks = [];

      // Request microphone access with aggressive echo cancellation
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true, // Critical for preventing feedback
          noiseSuppression: true,
          autoGainControl: true,
          // Additional constraints to reduce echo
          googEchoCancellation: true,
          googNoiseSuppression: true,
          googAutoGainControl: true,
          googHighpassFilter: true,
        } as any // Cast to any to allow browser-specific properties
      });

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      // Create MediaRecorder with fallback mime types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use default
          }
        }
      }
      this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? {
        mimeType
      } : undefined);
      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.start();
      console.log('MediaRecorder started successfully');
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.cleanup();
        reject(new Error('No media recorder available'));
        return;
      }
      if (this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        reject(new Error('MediaRecorder is already stopped'));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: 'audio/webm'
        });
        this.cleanup();
        resolve(audioBlob);
      };
      this.mediaRecorder.stop();
    });
  }
  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({
  lessonContext,
  onTranscriptUpdate,
  onConversationEnd,
  onMessageUpdate,
  onSessionStart,
  onSessionEnd,
  isTrialMode = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecorderReady, setIsRecorderReady] = useState(false);
  const [isDeepSeekMode, setIsDeepSeekMode] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<'tap' | 'enhanced' | 'premium'>('tap');
  const [userCredits, setUserCredits] = useState<number>(0);

  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const deepSeekChatRef = useRef<DeepSeekRealtimeChat | null>(null);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const messageIdCounter = useRef(0);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Longer timeout for free-form conversations, shorter for structured lessons
  const IDLE_TIMEOUT_MS = lessonContext?.includes('Friendly Chat') || lessonContext?.includes('free_form') 
    ? 600000 // 10 minutes for free-form chats
    : 180000; // 3 minutes for structured lessons

  // Defensive effect: Prevent hands-free state in trial mode
  useEffect(() => {
    if (isTrialMode && isHandsFreeMode) {
      setIsHandsFreeMode(false);
    }
  }, [isTrialMode, isHandsFreeMode]);

  // Fetch user credits on mount
  useEffect(() => {
    if (!isTrialMode && user) {
      fetchUserCredits();
    }
  }, [user, isTrialMode]);
  const fetchUserCredits = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('user_credits').select('balance').eq('user_id', user.id).maybeSingle();
    if (error && (error as any).code !== 'PGRST116') {
      console.error('Error fetching credits:', error);
      return;
    }
    if (!data) {
      // Initialize credits so first-time users aren't blocked
      const {
        data: ensureData,
        error: ensureError
      } = await supabase.functions.invoke('ensure-credits', {
        body: {
          initial_balance: 2
        }
      });
      if (ensureError) {
        console.error('Failed to initialize credits:', ensureError);
        setUserCredits(0);
        return;
      }
      setUserCredits((ensureData as any)?.balance ?? 0);
      return;
    }
    setUserCredits(data.balance || 0);
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Play audio from base64 with callback
  const playAudio = async (base64Audio: string, onEnd?: () => void) => {
    try {
      setIsSpeaking(true);
      const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))], {
        type: 'audio/mp3'
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
      onEnd?.();
    }
  };

  // Stop current audio
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  // Start recording - unified for all modes
  const recordingStartTimeRef = useRef<number>(0);
  const startRecording = async () => {
    try {
      setIsRecorderReady(false);
      
      // Use AudioRecorder for all modes (trial and paid)
      await audioRecorderRef.current.start();
      setIsRecording(true);
      setIsRecorderReady(true);
      recordingStartTimeRef.current = Date.now();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setIsRecorderReady(false);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  // Stop recording and process - unified for all modes
  const stopRecording = async () => {
    if (!isRecorderReady) {
      console.log('Recorder not ready, ignoring stop request');
      setIsRecording(false);
      return;
    }
    
    try {
      setIsRecording(false);
      setIsRecorderReady(false);
      setIsProcessing(true);

      // Stop recording and get audio blob
      const audioBlob = await audioRecorderRef.current.stop();
      console.log(`Recording stopped. Audio blob size: ${audioBlob.size} bytes`);

      // Check if audio blob is valid
      if (audioBlob.size < 1000) {
        setIsProcessing(false);
        toast({
          title: "Recording Too Short",
          description: "Please speak for a bit longer and try again.",
          variant: "destructive"
        });
        return;
      }

      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob);

      // Step 1: Speech to text using OpenAI Whisper
      console.log('Converting speech to text with Whisper...');
      const sttResponse = await supabase.functions.invoke('speech-to-text', {
        body: {
          audio: base64Audio
        }
      });
      
      if (sttResponse.error) {
        throw new Error(sttResponse.error.message);
      }
      
      const userText = sttResponse.data?.text;
      if (!userText || userText.trim().length === 0) {
        throw new Error('No speech detected. Please try again.');
      }
      
      console.log('Transcribed text:', userText);
      onTranscriptUpdate?.(userText);

      // Process the transcript
      await processTranscript(userText);
    } catch (error) {
      console.error('Voice processing error:', error);
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process voice input",
        variant: "destructive"
      });
    }
  };

  // Process transcript - unified for all modes
  const processTranscript = async (userText: string) => {
    try {
      setIsProcessing(true);
      onTranscriptUpdate?.(userText);

      // Add user message
      const userMessage: ConversationMessage = {
        id: `user-${messageIdCounter.current++}`,
        role: 'user',
        content: userText,
        timestamp: new Date()
      };
      const newMessagesWithUser = [...messages, userMessage];
      setMessages(newMessagesWithUser);
      onMessageUpdate?.(newMessagesWithUser);

      // Step 2: Get AI response using GPT-4o-mini
      console.log('Getting AI response with GPT-4o-mini...');
      const aiResponse = await supabase.functions.invoke('deepseek-conversation', {
        body: {
          text: userText,
          lessonContext: lessonContext || 'General English conversation practice'
        }
      });
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error.message);
      }
      
      const aiData = aiResponse.data;
      console.log('AI response:', aiData);

      // Check if API returned an error
      if (aiData?.error) {
        throw new Error(aiData.error);
      }
      if (!aiData?.response) {
        throw new Error('No response from AI');
      }

      // Add assistant message
      const assistantMessage: ConversationMessage = {
        id: `assistant-${messageIdCounter.current++}`,
        role: 'assistant',
        content: aiData.response,
        timestamp: new Date()
      };
      const finalMessages = [...messages, userMessage, assistantMessage];
      setMessages(finalMessages);
      onMessageUpdate?.(finalMessages);

      // Step 3: Convert AI response to speech using OpenAI TTS
      console.log('Converting text to speech with OpenAI TTS...');
      const ttsResponse = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: aiData.response,
          voice: 'nova' // Warm, natural female voice
        }
      });
      
      if (ttsResponse.error) {
        throw new Error(ttsResponse.error.message);
      }
      
      if (ttsResponse.data?.audioContent) {
        await playAudio(ttsResponse.data.audioContent);
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process voice input",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsRecorderReady(false);
    }
  };

  // Handle realtime messages
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [pendingUserMessageId, setPendingUserMessageId] = useState<string | null>(null);

  // Reset idle timer on any activity
  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (isSessionActive && isHandsFreeMode) {
      idleTimeoutRef.current = setTimeout(() => {
        console.log('Session auto-ended due to inactivity');
        toast({
          title: "Session Ended",
          description: "Auto-ended due to inactivity to save costs"
        });
        endSession();
      }, IDLE_TIMEOUT_MS);
    }
  };
  const handleRealtimeMessage = async (message: any) => {
    console.log('Realtime message:', message);

    // Reset idle timer on any activity
    resetIdleTimer();

    // Surface errors from the voice service
    if (message.type === 'error') {
      console.error('Realtime API error:', message);
      const errorMsg = typeof message.error === 'string' ? message.error : message.error?.message || 'Unknown error from voice service';
      toast({
        title: 'Voice service error',
        description: errorMsg,
        variant: 'destructive'
      });

      // If it's a critical error, end the session
      if (errorMsg.includes('API key') || errorMsg.includes('connection')) {
        endSession();
      }
      return;
    }

    // Handle user speech transcript
    if (message.type === 'conversation.item.input_audio_transcription.completed') {
      const userText = message.transcript || '';
      setCurrentUserTranscript(userText);

      // Add user message immediately
      const userMsgId = `user-${Date.now()}`;
      setPendingUserMessageId(userMsgId);
      setMessages(prev => [...prev, {
        id: userMsgId,
        role: 'user',
        content: userText,
        timestamp: new Date()
      }]);

      // Get corrections in background
      try {
        const aiResponse = await supabase.functions.invoke('ai-conversation', {
          body: {
            userText,
            lessonContext: lessonContext || 'General English conversation practice',
            difficulty: 'Intermediate'
          }
        });
        if (!aiResponse.error && aiResponse.data) {
          const aiData = aiResponse.data;
          // Update user message with corrections
          setMessages(prev => prev.map(msg => msg.id === userMsgId ? {
            ...msg,
            corrections: aiData.corrections || [],
            feedback: aiData.feedback
          } : msg));
        }
      } catch (error) {
        console.error('Failed to get corrections:', error);
      }
    } else if (message.type === 'response.output_audio_transcript.delta') {
      // Handle AI speech transcript
      setCurrentTranscript(prev => prev + (message.delta || ''));
    } else if (message.type === 'response.output_audio_transcript.done') {
      // AI finished speaking
      if (currentTranscript.trim()) {
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: currentTranscript,
          timestamp: new Date()
        }]);
        setCurrentTranscript('');
      }
      setPendingUserMessageId(null);
    } else if (message.type === 'response.output_audio.done') {
      // AI finished speaking audio - reset to listening state
      setIsAISpeaking(false);
      setIsProcessing(false);
      // Don't automatically start recording - wait for server VAD to detect speech
    } else if (message.type === 'response.done') {
      // Response completely finished - ensure we're in listening state
      setIsAISpeaking(false);
      setIsProcessing(false);
      setIsRecording(false);
    } else if (message.type === 'response.created') {
      // AI started responding
      setIsAISpeaking(true);
      setIsProcessing(false);
      setIsRecording(false); // Stop any recording state when AI responds
    } else if (message.type === 'input_audio_buffer.speech_started') {
      // User started speaking - only now show recording
      console.log('User speech detected - starting to record');
      setIsRecording(true);
      setIsProcessing(false);
      setIsAISpeaking(false);
    } else if (message.type === 'input_audio_buffer.speech_stopped') {
      // User stopped speaking - show processing
      console.log('User speech ended - processing');
      setIsRecording(false);
      setIsProcessing(true);
    }
  };


  // Start DeepSeek hands-free session
  const startDeepSeekHandsFreeSession = async () => {
    console.log('[Trial Debug] startDeepSeekHandsFreeSession called, isTrialMode:', isTrialMode);
    // Safety guard: Trial mode should never use hands-free
    if (isTrialMode) {
      console.log('[Trial Debug] BLOCKED: Trial mode cannot use hands-free!');
      toast({
        title: "Trial uses Tap to Talk",
        description: "Sign up to unlock hands-free mode.",
        variant: "default"
      });
      return;
    }
    
    // Check credits for non-trial users (Enhanced mode needs 3+ credits for 5 min)
    if (!isTrialMode && userCredits < 3) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 3 credits to start a session.",
        variant: "destructive",
        action: <Button onClick={() => navigate('/profile')}>Buy Credits</Button>
      });
      return;
    }
    try {
      setCurrentMode('enhanced');
      setSessionStartTime(Date.now());
      setIsConnecting(true);
      setIsDeepSeekMode(true);
      setIsSessionActive(true); // Set session active
      setIsHandsFreeMode(true);
      onSessionStart?.(); // Notify parent

      // Show different message for trial vs regular users
      const initialToast = isTrialMode ? {
        title: "Trial Started",
        description: "Free 1-minute trial with AI voice coach"
      } : {
        title: "DeepSeek Hands-Free Active",
        description: "Enhanced mode with low latency"
      };
      toast(initialToast);
      deepSeekChatRef.current = new DeepSeekRealtimeChat(message => {
        console.log('[DeepSeek UI] Message:', message.type);
        if (message.type === 'response.text.delta') {
          // Update assistant message with streaming text
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastMsg,
                content: message.fullText
              };
              return updated;
            } else {
              return [...prev, {
                id: `msg-${messageIdCounter.current++}`,
                role: 'assistant',
                content: message.fullText,
                timestamp: new Date()
              }];
            }
          });
        } else if (message.type === 'response.text.done') {
          // Pause STT to prevent audio feedback loop
          if (deepSeekChatRef.current) {
            deepSeekChatRef.current.pauseListening();
          }

          // Speak the response using OpenAI TTS
          (async () => {
            try {
              const ttsResponse = await supabase.functions.invoke('text-to-speech', {
                body: { text: message.text, voice: 'nova' }
              });
              if (!ttsResponse.error && ttsResponse.data?.audioContent) {
                await playAudio(ttsResponse.data.audioContent, () => {
                  if (deepSeekChatRef.current) {
                    deepSeekChatRef.current.resumeListening();
                  }
                  setIsProcessing(false);
                });
              }
            } catch (error) {
              console.error('TTS error:', error);
              if (deepSeekChatRef.current) {
                deepSeekChatRef.current.resumeListening();
              }
              setIsProcessing(false);
            }
          })();

          setIsProcessing(false);
          resetIdleTimer();
        } else if (message.type === 'error') {
          toast({
            title: "Error",
            description: message.error,
            variant: "destructive"
          });
          setIsProcessing(false);
        }
      }, (text, isFinal) => {
        // Handle transcript updates
        setCurrentTranscript(text);
        onTranscriptUpdate?.(text);
        
        // Reset idle timer when user is speaking
        resetIdleTimer();
        
        if (isFinal) {
          console.log('[DeepSeek UI] Final transcript:', text);

          // Add user message
          const userMessage: ConversationMessage = {
            id: `msg-${messageIdCounter.current++}`,
            role: 'user',
            content: text,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          onMessageUpdate?.(messages);
          setCurrentTranscript('');
          setIsProcessing(true);
        }
      });
      await deepSeekChatRef.current.connect(lessonContext || 'General English conversation practice');
      setIsSessionActive(true);
      setIsHandsFreeMode(true);
      setMessages([]);

      // Start idle timer
      resetIdleTimer();
      const welcomeMessage: ConversationMessage = {
        id: 'welcome',
        role: 'assistant',
        content: isTrialMode ? "Welcome to your free trial! I can hear you now. Just start speaking naturally." : "Connected! I'm listening with DeepSeek. Just speak naturally - I'll respond in 600-1200ms.",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      onMessageUpdate?.([welcomeMessage]);
    } catch (error) {
      console.error('Failed to start DeepSeek session:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to DeepSeek service",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Start push-to-talk session (tap to talk mode)
  // Trial mode uses free Browser STT + DeepSeek + Browser TTS
  const startTapToTalkSession = () => {
    console.log('[Trial Debug] Starting Tap to Talk session, isTrialMode:', isTrialMode);
    setCurrentMode('tap');
    setIsSessionActive(true);
    setIsHandsFreeMode(false);
    setIsDeepSeekMode(false);
    setMessages([]);
    onSessionStart?.();
    
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      role: 'assistant',
      content: isTrialMode 
        ? "Free trial started! Using browser voice recognition. Hold the button to speak." 
        : "Session started! Hold the microphone button to speak.",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    onMessageUpdate?.([welcomeMessage]);
    console.log('[Trial Debug] Tap to Talk session started successfully');
  };

  // Start session for trial mode (tap-to-talk)
  const startSession = () => {
    console.log('[Trial Debug] startSession called, isTrialMode:', isTrialMode);
    startTapToTalkSession();
  };

  // End session
  const endSession = async () => {
    stopAudio();

    // Deduct credits for non-trial users
    if (!isTrialMode && sessionStartTime && user) {
      const durationMs = Date.now() - sessionStartTime;
      const durationMinutes = durationMs / 60000;
      const creditRates = {
        tap: 3,
        // 0.6 credits per minute (Browser STT + DeepSeek)
        enhanced: 3,
        // 0.6 credits per minute (Browser STT + DeepSeek)
        premium: 300 // 60 credits per minute (OpenAI Realtime API)
      };
      const creditsPerMinute = creditRates[currentMode] / 5;
      const creditsToDeduct = Math.ceil(durationMinutes * creditsPerMinute);
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('deduct-credits', {
          body: {
            amount: creditsToDeduct,
            description: `${durationMinutes.toFixed(1)} min ${currentMode} session`,
            metadata: {
              mode: currentMode,
              duration_minutes: durationMinutes,
              lesson_id: lessonContext
            }
          }
        });
        if (error) throw error;
        await fetchUserCredits();
        toast({
          title: "Session Ended",
          description: `${creditsToDeduct} credits used. Balance: ${data.new_balance}`
        });
      } catch (error) {
        console.error('Credit deduction failed:', error);
        toast({
          title: "Error",
          description: "Failed to process credits. Contact support.",
          variant: "destructive"
        });
      }
    }

    // Clear idle timer
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }

    // Disconnect realtime chat if active
    if (realtimeChatRef.current) {
      realtimeChatRef.current.disconnect();
      realtimeChatRef.current = null;
    }

    // Disconnect DeepSeek chat if active
    if (deepSeekChatRef.current) {
      deepSeekChatRef.current.disconnect();
      deepSeekChatRef.current = null;
    }
    setSessionStartTime(null);
    setIsSessionActive(false);
    setIsHandsFreeMode(false);
    setIsDeepSeekMode(false);
    setIsRecording(false);
    setIsProcessing(false);
    setMessages([]);
    setCurrentTranscript('');
    onSessionEnd?.(); // Notify parent
    onConversationEnd?.();
    if (isTrialMode) {
      toast({
        title: "Trial Session Ended",
        description: "Thanks for trying TalkEasi!"
      });
    }
  };
  return <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
      <div className="max-w-md mx-auto">
        {/* Credit Balance Badge (only for authenticated users) */}
        {!isTrialMode && <div className="fixed top-4 right-4 z-50">
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <Coins className="w-3.5 h-3.5 mr-1.5" />
              {userCredits} credits
            </Badge>
          </div>}

        {/* Low Balance Warning */}
        {!isTrialMode && userCredits < 10 && userCredits > 0 && <Alert className="mb-4 bg-warning/10 border-warning/20">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>Low Credits</AlertTitle>
            <AlertDescription>
              You have {userCredits} credits remaining.
              <Button variant="link" onClick={() => navigate('/profile')} className="ml-2 p-0 h-auto">
                Top Up Now
              </Button>
            </AlertDescription>
          </Alert>}

        {/* Status */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant={isSessionActive ? "default" : "secondary"} className="text-xs">
              {isConnecting ? "Connecting..." : isSessionActive ? "Session Active" : "Session Inactive"}
            </Badge>
            
            {!isTrialMode && isHandsFreeMode && <Badge variant="outline" className={`text-xs ${isDeepSeekMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                <Phone className="w-3 h-3 mr-1" />
                {isDeepSeekMode ? 'DeepSeek' : 'OpenAI'} Hands-Free
              </Badge>}
            
            {(isSpeaking || isAISpeaking) && <div className="flex items-center gap-1 text-success text-xs">
                <Volume2 className="w-3 h-3" />
                <span>AI Speaking</span>
              </div>}
            
            {isRecording && <div className="flex items-center gap-1 text-primary text-xs">
                <Mic className="w-3 h-3" />
                <span>Recording...</span>
              </div>}
            
            {isProcessing && <div className="flex items-center gap-1 text-warning text-xs">
                <ProcessingIndicator stage="transcribing" />
                <span>Processing...</span>
              </div>}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {!isSessionActive 
              ? (isTrialMode ? "Tap to start your free 1-minute trial" : "💡 Tap below to start practicing with Enhanced Mode") 
              : isHandsFreeMode && currentTranscript 
                ? `Listening: "${currentTranscript}"` 
                : isHandsFreeMode 
                  ? "Just speak naturally - I'm listening" 
                  : "Hold microphone button to speak (trial mode)"
            }
          </p>
        </div>

        {/* Mode Selection (when not active) */}
        {!isSessionActive && !isTrialMode && <div className="mb-4">
            <Button size="lg" variant="outline" className="w-full h-auto py-3 flex-col items-start hover:bg-primary hover:text-primary-foreground" onClick={startDeepSeekHandsFreeSession} disabled={isConnecting}>
              <div className="flex items-center w-full">
                <Phone className="w-5 h-5 mr-2" />
                <span className="font-semibold text-lg">Hands-Free (Enhanced)</span>
                <Badge variant="secondary" className="ml-auto">0.6 credits/min</Badge>
              </div>
            </Button>
          </div>}
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isTrialMode && <Button variant="ghost" size="icon" onClick={() => navigate('/lessons')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>}

          {/* Trial Mode: Show microphone button to start session */}
          {isTrialMode && !isSessionActive && <Button size="lg" className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90" onClick={startSession}>
              <Mic className="w-8 h-8" />
            </Button>}

          {isSessionActive && !isHandsFreeMode && <Button size="lg" className={`w-16 h-16 rounded-full ${isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} disabled={isProcessing || isSpeaking || isAISpeaking}>
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>}

          {isSessionActive && isHandsFreeMode && <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
            </div>}

          {isSessionActive && <Button variant="ghost" size="icon" onClick={endSession}>
              {isHandsFreeMode ? <PhoneOff className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </Button>}
        </div>
        
        {/* Quick Actions */}
        {(isSpeaking || isAISpeaking) && <div className="flex justify-center mt-2">
            <Button variant="outline" size="sm" onClick={stopAudio}>
              <VolumeX className="w-4 h-4 mr-1" />
              Stop Audio
            </Button>
          </div>}
      </div>
    </div>;
};
export default RealtimeVoiceInterface;