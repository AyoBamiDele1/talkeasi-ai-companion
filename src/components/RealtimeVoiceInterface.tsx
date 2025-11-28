import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, MessageSquare, Phone, PhoneOff, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FEATURES } from '@/config/features';
import { useUserLocation } from '@/hooks/useUserLocation';
import ProcessingIndicator from './ProcessingIndicator';
import { RealtimeChat } from '@/utils/RealtimeAudio';

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
  lessonTitle?: string;
  lessonContent?: any;
  coveredScenarios?: string[];
  voice?: string;
  onTranscriptUpdate?: (transcript: string) => void;
  onConversationEnd?: () => void;
  onMessageUpdate?: (messages: ConversationMessage[]) => void;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  isTrialMode?: boolean;
  forceEnd?: boolean;
}

// Audio recording class with VAD support
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceCheckInterval: number | null = null;
  private onSilenceDetected?: () => void;

  async start(onSilenceDetected?: () => void): Promise<MediaStream> {
    this.onSilenceDetected = onSilenceDetected;
    
    try {
      this.audioChunks = [];

      // Request microphone access with aggressive echo cancellation
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googNoiseSuppression: true,
          googAutoGainControl: true,
          googHighpassFilter: true
        } as any
      });

      // Set up VAD if needed
      if (onSilenceDetected) {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);
        
        this.startSilenceDetection();
      }

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
            mimeType = '';
          }
        }
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      
      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      console.log('MediaRecorder started successfully');
      
      return this.stream;
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  private startSilenceDetection() {
    if (!this.analyser || !this.onSilenceDetected) return;
    
    let silenceStart: number | null = null;
    const SILENCE_THRESHOLD = 0.01;
    const SILENCE_DURATION = 1500;
    
    this.silenceCheckInterval = window.setInterval(() => {
      if (!this.analyser) return;
      
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteTimeDomainData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      
      const now = Date.now();
      
      if (rms < SILENCE_THRESHOLD) {
        if (silenceStart === null) {
          silenceStart = now;
        } else if (now - silenceStart >= SILENCE_DURATION) {
          console.log('[VAD] Silence detected, triggering processing');
          this.onSilenceDetected?.();
          silenceStart = null;
        }
      } else {
        silenceStart = null;
      }
    }, 100);
  }

  async stop(): Promise<Blob> {
    // Clear silence detection
    if (this.silenceCheckInterval !== null) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
    
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
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };
      
      try { 
        this.mediaRecorder.requestData?.(); 
      } catch (_) { /* no-op */ }
      
      this.mediaRecorder.stop();
    });
  }

  cleanup() {
    if (this.silenceCheckInterval !== null) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.analyser = null;
    this.onSilenceDetected = undefined;
  }
}

const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({
  lessonContext,
  lessonTitle,
  lessonContent,
  coveredScenarios = [],
  voice = 'alloy',
  onTranscriptUpdate,
  onConversationEnd,
  onMessageUpdate,
  onSessionStart,
  onSessionEnd,
  isTrialMode = false,
  forceEnd = false
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
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentMode, setCurrentMode] = useState<'tap' | 'standard' | 'premium'>('tap');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency } = useUserLocation();
  const messageIdCounter = useRef(0);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const IDLE_TIMEOUT_MS = lessonContext?.includes('Friendly Chat') || lessonContext?.includes('free_form') ? 600000 : 180000;

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

  // Force end session when parent signals - CRITICAL for trial mode
  useEffect(() => {
    if (forceEnd && isSessionActive) {
      console.log('[DEBUG] FORCE END TRIGGERED - Immediately disconnecting everything');
      
      // Force disconnect realtime chat IMMEDIATELY
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
        realtimeChatRef.current = null;
      }
      
      // Stop any audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      // Reset all state
      setIsSessionActive(false);
      setIsHandsFreeMode(false);
      setIsRecording(false);
      setIsProcessing(false);
      setIsAISpeaking(false);
      setIsSpeaking(false);
      setCurrentAudio(null);
      
      console.log('[DEBUG] Force end complete');
    }
  }, [forceEnd, isSessionActive, currentAudio]);

  // CRITICAL: Cleanup on unmount - force stop everything
  useEffect(() => {
    return () => {
      console.log('[DEBUG] Component unmounting - forcing cleanup');
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
        realtimeChatRef.current = null;
      }
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, []);

  const fetchUserCredits = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    
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
        // Check if it's an email verification error
        if ((ensureError as any).email_not_verified) {
          toast({
            title: "Email Verification Required",
            description: "Please verify your email to receive your 8 free credits. Check your inbox for the verification link.",
            variant: "destructive",
          });
        }
        setUserCredits(0);
        return;
      }
      setUserCredits((ensureData as any)?.balance ?? 0);
      return;
    }
    setUserCredits(data.balance || 0);
  };

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

  const playAudio = async (base64Audio: string, onEnd?: () => void) => {
    try {
      setIsSpeaking(true);
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
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

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  const recordingStartTimeRef = useRef<number>(0);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const startRecording = async () => {
    try {
      console.log('[DEBUG] Starting recording...');
      setIsRecording(true);
      
      // No VAD - manual control only
      await audioRecorderRef.current.start();
      console.log('[DEBUG] Recording started successfully');
    } catch (error) {
      console.error('[DEBUG] Error starting recording:', error);
      setIsRecording(false);
      
      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        // Don't show error toast for permission denial - user will see browser prompt
        console.log('[DEBUG] Microphone permission not granted yet');
      } else {
        toast({
          title: "Recording Error",
          description: "Failed to start recording. Please check your microphone permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const stopRecording = async () => {
    console.log('[DEBUG] stopRecording called');
    
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    
    // If recording state is already false, it means recording never started
    // (likely due to permission denial), so just return without showing error
    if (!isRecording) {
      console.log('[DEBUG] Recording was never started, skipping stop');
      setIsProcessing(false);
      return;
    }
    
    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      const audioBlob = await audioRecorderRef.current.stop();
      console.log(`[DEBUG] Recording stopped. Audio blob size: ${audioBlob.size} bytes`);

      if (audioBlob.size < 300) {
        console.log('[DEBUG] Audio blob too small');
        setIsProcessing(false);
        return;
      }

      const base64Audio = await blobToBase64(audioBlob);
      console.log('[DEBUG] Audio converted to base64');

      await processTranscript(base64Audio);
    } catch (error) {
      console.error('[DEBUG] Error in stopRecording:', error);
      setIsProcessing(false);
      
      // Only show error if it's not a "no media recorder" error (which happens after permission denial)
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('No media recorder available')) {
        toast({
          title: "Processing Error",
          description: "Failed to process audio. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const processTranscript = async (base64Audio: string) => {
    try {
      console.log('[DEBUG] Processing transcript...');
      
      const { data: sttData, error: sttError } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (sttError) {
        console.error('[DEBUG] STT error:', sttError);
        throw sttError;
      }

      const userTranscript = sttData.text || '';
      console.log('[DEBUG] Transcript received:', userTranscript);

      if (!userTranscript.trim()) {
        console.log('[DEBUG] Empty transcript, skipping processing');
        setIsProcessing(false);
        return;
      }

      const userMessage: ConversationMessage = {
        id: `msg-${messageIdCounter.current++}`,
        role: 'user',
        content: userTranscript,
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, userMessage];
        onMessageUpdate?.(updated);
        return updated;
      });
      onTranscriptUpdate?.(userTranscript);

      console.log('[DEBUG] Getting AI response...');
      
      // Get user's country for crisis support
      const { location } = await (async () => {
        try {
          const { data } = await supabase.functions.invoke('get-user-location');
          return { location: data };
        } catch {
          return { location: null };
        }
      })();
      
      const { data: aiData, error: aiError } = await supabase.functions.invoke('openai-conversation', {
        body: {
          text: userTranscript,
          conversationHistory: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          lessonContext: lessonContext,
          userCountry: location?.country_code || 'default'
        }
      });

      if (aiError) {
        console.error('[DEBUG] AI error:', aiError);
        throw aiError;
      }

      const aiResponse = aiData.response || '';
      console.log('[DEBUG] AI response received:', aiResponse);

      const aiMessage: ConversationMessage = {
        id: `msg-${messageIdCounter.current++}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, aiMessage];
        onMessageUpdate?.(updated);
        return updated;
      });

      // Use configured voice for Standard Mode
      console.log(`[DEBUG] Generating speech with ${voice} voice...`);
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: aiResponse,
          voice: voice
        }
      });

      if (ttsError) {
        console.error('[DEBUG] TTS error:', ttsError);
        throw ttsError;
      }

      console.log('[DEBUG] Playing AI response audio');
      await playAudio(ttsData.audioContent);

      setIsProcessing(false);
      console.log('[DEBUG] Processing complete');
    } catch (error) {
      console.error('[DEBUG] Error in processTranscript:', error);
      setIsProcessing(false);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startHandsFreeSession = async () => {
    console.log('[DEBUG] Starting Standard Mode session with gpt-4o-mini-realtime-preview');
    
    if (userCredits < 3) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 3 credits to start a Standard Mode session (1 min).",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setCurrentMode('standard');
    setIsHandsFreeMode(true);
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    onSessionStart?.();

    try {
      // Pre-request microphone permission immediately for faster UX
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const chat = new RealtimeChat(
        (message) => {
          handleRealtimeMessage(message);
        },
        // Pass lesson context with mini model for Standard Mode
        {
          lessonTitle: lessonTitle,
          lessonContent: lessonContent,
          coveredScenarios: coveredScenarios,
          model: 'gpt-4o-mini-realtime-preview'
        }
      );

      await chat.connect();
      realtimeChatRef.current = chat;
      setIsConnecting(false);
      
      toast({
        title: "Connected",
        description: "Standard Mode conversation started!",
      });
    } catch (error) {
      console.error('[DEBUG] Error starting Standard Mode:', error);
      setIsConnecting(false);
      setIsSessionActive(false);
      setIsHandsFreeMode(false);
      
      toast({
        title: "Connection Error",
        description: error.name === 'NotAllowedError' 
          ? "Microphone access denied. Please allow microphone access to continue."
          : "Failed to start Standard Mode. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startPremiumSession = async () => {
    console.log('[DEBUG] Starting Premium Mode session with gpt-4o-realtime-preview-2024-12-17');
    
    if (userCredits < 20) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 20 credits to start a Premium Mode session (1 min).",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setCurrentMode('premium');
    setIsHandsFreeMode(true);
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    onSessionStart?.();

    try {
      // Pre-request microphone permission immediately for faster UX
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const chat = new RealtimeChat(
        (message) => {
          handleRealtimeMessage(message);
        },
        // Pass lesson context with full model for Premium Mode
        {
          lessonTitle: lessonTitle,
          lessonContent: lessonContent,
          coveredScenarios: coveredScenarios,
          model: 'gpt-4o-realtime-preview-2024-12-17'
        }
      );

      await chat.connect();
      realtimeChatRef.current = chat;
      setIsConnecting(false);
      
      toast({
        title: "Connected",
        description: "Premium real-time conversation started!",
      });
    } catch (error) {
      console.error('[DEBUG] Error starting Premium Mode:', error);
      setIsConnecting(false);
      setIsSessionActive(false);
      setIsHandsFreeMode(false);
      
      toast({
        title: "Connection Error",
        description: error.name === 'NotAllowedError' 
          ? "Microphone access denied. Please allow microphone access to continue."
          : "Failed to start Premium Mode. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startTapToTalkSession = async () => {
    console.log('[DEBUG] Starting Trial Mode session with gpt-4o-mini-realtime-preview');
    
    setIsConnecting(true);
    setCurrentMode('tap');
    setIsHandsFreeMode(true); // Now hands-free for Trial Mode too!
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    onSessionStart?.();

    try {
      // Pre-request microphone permission immediately for faster UX
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const chat = new RealtimeChat(
        (message) => {
          handleRealtimeMessage(message);
        },
        // Pass lesson context with mini model for Trial Mode
        {
          lessonTitle: 'AI Companion',
          lessonContent: lessonContent,
          coveredScenarios: coveredScenarios,
          model: 'gpt-4o-mini-realtime-preview'
        }
      );

      await chat.connect();
      realtimeChatRef.current = chat;
      setIsConnecting(false);
    } catch (error) {
      console.error('[DEBUG] Error starting Trial Mode:', error);
      setIsConnecting(false);
      setIsSessionActive(false);
      setIsHandsFreeMode(false);
      
      toast({
        title: "Connection Error",
        description: error.name === 'NotAllowedError' 
          ? "Microphone access denied. Please allow microphone access to continue."
          : "Failed to start trial. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startSession = async () => {
    if (isTrialMode) {
      await startTapToTalkSession();
    } else {
      await startHandsFreeSession();
    }
  };

  const endSession = async () => {
    console.log('[DEBUG] Ending session');
    
    try {
      if (isRecording) {
        await audioRecorderRef.current.stop();
      }
    } catch (error) {
      console.error('[DEBUG] Error stopping recorder:', error);
    }

    if (realtimeChatRef.current) {
      realtimeChatRef.current.disconnect();
      realtimeChatRef.current = null;
    }

    stopAudio();

    if (sessionStartTime && !isTrialMode) {
      const durationMs = Date.now() - sessionStartTime;
      const durationMinutes = durationMs / 60000; // Keep decimals for accurate calculation

      try {
        const { error } = await supabase.functions.invoke('deduct-credits', {
          body: {
            mode: currentMode === 'premium' ? 'premium' : 'standard',
            duration_minutes: durationMinutes,
            description: `${currentMode === 'premium' ? 'Premium' : 'Standard'} Mode session - ${Math.ceil(durationMinutes)} min`,
            metadata: {
              sessionDuration: durationMinutes,
              mode: currentMode,
              sessionId: sessionStartTime.toString()
            }
          }
        });

        if (error) {
          console.error('[DEBUG] Error deducting credits:', error);
        } else {
          await fetchUserCredits();
        }
      } catch (error) {
        console.error('[DEBUG] Error in credit deduction:', error);
      }
    }

    setIsSessionActive(false);
    setIsHandsFreeMode(false);
    setIsRecording(false);
    setIsProcessing(false);
    setSessionStartTime(null);
    setMessages([]);
    onSessionEnd?.();
    onConversationEnd?.();
  };

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
      setCurrentTranscript(userText);

      // Add user message immediately
      const userMsgId = `user-${Date.now()}`;
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
      <div className="max-w-md mx-auto">

        {/* Low Balance Warning */}
        {!isTrialMode && userCredits < 20 && userCredits > 0 && <Alert className="mb-4 bg-warning/10 border-warning/20">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>Low Credits</AlertTitle>
            <AlertDescription>
              You have {userCredits} credits remaining.
              <Button variant="link" onClick={() => navigate('/profile?view=subscription')} className="ml-2 p-0 h-auto">
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
            
            {!isTrialMode && isHandsFreeMode}
            
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
              ? (isTrialMode ? "Tap to start your free 2-minute trial" : currency === 'NGN' ? "💡 Tap the button below to start talking" : "Tap the button below to start talking")
              : isHandsFreeMode && currentTranscript
                ? `Listening: "${currentTranscript}"`
                : isHandsFreeMode
                  ? (currentMode === 'premium' 
                    ? "Premium Mode: Highest quality AI" 
                    : currentMode === 'tap'
                      ? "Trial Mode: Just speak naturally!"
                      : "Standard Mode: Natural conversation flow")
                  : "Connected to AI... Start Talking!"}
          </p>
        </div>

        {/* Mode Selection */}
        {!isSessionActive && !isTrialMode && (
          <div className="mb-4 space-y-3">
            <Button
              size="lg"
              variant="default"
              className="w-full h-auto py-3 flex-col items-start"
              onClick={startHandsFreeSession}
              disabled={isConnecting}
            >
              <div className="flex items-center w-full mb-1">
                <Phone className="w-5 h-5 mr-2" />
                <span className="font-semibold text-lg">Standard Mode</span>
                <Badge variant="secondary" className="ml-auto bg-background/20">3 credits/min</Badge>
              </div>
              <p className="text-xs opacity-90 text-left">Natural conversation flow with instant responses</p>
            </Button>

            {FEATURES.PREMIUM_MODE_ENABLED && (
              <Button
                size="lg"
                variant="default"
                className="w-full h-auto py-3 flex-col items-start"
                onClick={startPremiumSession}
                disabled={isConnecting}
              >
                <div className="flex items-center w-full mb-1">
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="font-semibold text-lg">Premium Mode</span>
                  <Badge variant="secondary" className="ml-auto bg-background/20">20 credits/min</Badge>
                </div>
                <p className="text-xs opacity-90 text-left">Highest quality AI responses</p>
              </Button>
            )}
          </div>
        )}
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isTrialMode && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {isTrialMode && !isSessionActive && (
            <Button
              size="lg"
              className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90"
              onClick={startSession}
            >
              <Mic className="w-8 h-8" />
            </Button>
          )}

          {/* All modes now use hands-free realtime, no manual controls needed */}

          {isSessionActive && (
            <Button variant="ghost" size="icon" onClick={endSession}>
              <PhoneOff className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {/* Quick Actions */}
        {(isSpeaking || isAISpeaking) && (
          <div className="flex justify-center mt-2">
            <Button variant="outline" size="sm" onClick={stopAudio}>
              <VolumeX className="w-4 h-4 mr-1" />
              Stop Audio
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeVoiceInterface;

