import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, MessageSquare, Phone, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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
}

// Audio recording class
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    try {
      this.audioChunks = [];
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
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
      
      this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
      
      this.mediaRecorder.ondataavailable = (event) => {
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
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
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
  onSessionEnd
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
  
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const deepSeekChatRef = useRef<DeepSeekRealtimeChat | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const messageIdCounter = useRef(0);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT_MS = 180000; // 3 minutes of inactivity

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

  // Play audio from base64
  const playAudio = async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      const audioBlob = new Blob([
        Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
      ], { type: 'audio/mp3' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
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

  // Start recording
  const recordingStartTimeRef = useRef<number>(0);
  
  const startRecording = async () => {
    try {
      setIsRecorderReady(false);
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
        variant: "destructive",
      });
    }
  };

  // Stop recording and process
  const stopRecording = async () => {
    // Prevent stopping if recorder isn't ready
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
          variant: "destructive",
        });
        return;
      }
      
      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob);
      
      // Step 1: Speech to text
      console.log('Converting speech to text...');
      const sttResponse = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
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

      // Step 2: Get AI response using DeepSeek (cost-optimized)
      console.log('Getting AI response...');
      const aiResponse = await supabase.functions.invoke('deepseek-conversation', {
        body: { 
          userText, 
          lessonContext: lessonContext || 'General English conversation practice',
          difficulty: 'Intermediate'
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

      // Update user message with corrections and feedback
      const updatedUserMessage: ConversationMessage = {
        ...userMessage,
        corrections: aiData.corrections || [],
        feedback: aiData.feedback
      };

      // Add assistant message
      const assistantMessage: ConversationMessage = {
        id: `assistant-${messageIdCounter.current++}`,
        role: 'assistant',
        content: aiData.response,
        timestamp: new Date()
      };
      
      const finalMessages = [
        ...messages, 
        updatedUserMessage, 
        assistantMessage
      ];
      setMessages(finalMessages);
      onMessageUpdate?.(finalMessages);

      // Step 3: Convert AI response to speech using browser TTS (FREE)
      console.log('Converting text to speech...');
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiData.response);
        utterance.rate = 0.95; // Slightly slower for more natural speech
        utterance.pitch = 1.1; // Slightly higher pitch for female voice
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        // Select a female voice if available
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('samantha') ||
           voice.name.toLowerCase().includes('victoria') ||
           voice.name.toLowerCase().includes('karen') ||
           voice.name.toLowerCase().includes('moira') ||
           voice.name.toLowerCase().includes('susan'))
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('Using voice:', femaleVoice.name);
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
        };
        
        speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported');
        setIsSpeaking(false);
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process voice input",
        variant: "destructive",
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
          description: "Auto-ended due to inactivity to save costs",
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
      const errorMsg = typeof message.error === 'string' 
        ? message.error 
        : message.error?.message || 'Unknown error from voice service';
      
      toast({
        title: 'Voice service error',
        description: errorMsg,
        variant: 'destructive',
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
          setMessages(prev => prev.map(msg => 
            msg.id === userMsgId 
              ? { ...msg, corrections: aiData.corrections || [], feedback: aiData.feedback }
              : msg
          ));
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

  // Start OpenAI hands-free session
  const startHandsFreeSession = async () => {
    try {
      setIsConnecting(true);
      setIsDeepSeekMode(false);
      realtimeChatRef.current = new RealtimeChat(handleRealtimeMessage);
      await realtimeChatRef.current.connect();
      
      setIsSessionActive(true);
      setIsHandsFreeMode(true);
      setMessages([]);
      onSessionStart?.(); // Notify parent
      
      // Start idle timer
      resetIdleTimer();
      
      const welcomeMessage: ConversationMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Connected! I can hear you now. Just start speaking naturally - no need to hold any buttons.",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      onMessageUpdate?.([welcomeMessage]);
      
      toast({
        title: "OpenAI Hands-Free Active",
        description: "Premium mode with ~300ms latency",
      });
    } catch (error) {
      console.error('Failed to start hands-free session:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to voice service",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Start DeepSeek hands-free session
  const startDeepSeekHandsFreeSession = async () => {
    try {
      setIsConnecting(true);
      setIsDeepSeekMode(true);
      setIsSessionActive(true); // Set session active
      setIsHandsFreeMode(true);
      onSessionStart?.(); // Notify parent
      
      deepSeekChatRef.current = new DeepSeekRealtimeChat(
        (message) => {
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
            
            // Speak the response using browser TTS
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(message.text);
              utterance.rate = 0.95;
              utterance.pitch = 1.1;
              utterance.volume = 1.0;
              utterance.lang = 'en-US';
              
              const voices = speechSynthesis.getVoices();
              const femaleVoice = voices.find(voice => 
                voice.lang.startsWith('en') && 
                (voice.name.toLowerCase().includes('female') || 
                 voice.name.toLowerCase().includes('samantha') ||
                 voice.name.toLowerCase().includes('victoria') ||
                 voice.name.toLowerCase().includes('karen') ||
                 voice.name.toLowerCase().includes('moira') ||
                 voice.name.toLowerCase().includes('susan'))
              );
              
              if (femaleVoice) {
                utterance.voice = femaleVoice;
              }
              
              utterance.onstart = () => setIsSpeaking(true);
              utterance.onend = () => {
                setIsSpeaking(false);
                setIsProcessing(false);
                
                // Resume STT after AI finishes speaking
                if (deepSeekChatRef.current) {
                  deepSeekChatRef.current.resumeListening();
                }
              };
              
              speechSynthesis.speak(utterance);
            }
            
            setIsProcessing(false);
            resetIdleTimer();
            
            if (message.cached) {
              toast({
                title: "Instant Response",
                description: "Used cached response for instant reply!",
              });
            }
          } else if (message.type === 'error') {
            toast({
              title: "Error",
              description: message.error,
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        },
        (text, isFinal) => {
          // Handle transcript updates
          setCurrentTranscript(text);
          onTranscriptUpdate?.(text);
          
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
        }
      );
      
      await deepSeekChatRef.current.connect(lessonContext || 'General English conversation practice');
      
      setIsSessionActive(true);
      setIsHandsFreeMode(true);
      setMessages([]);
      
      // Start idle timer
      resetIdleTimer();
      
      const welcomeMessage: ConversationMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Connected! I'm listening with DeepSeek. Just speak naturally - I'll respond in 600-1200ms.",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      onMessageUpdate?.([welcomeMessage]);
      
      toast({
        title: "DeepSeek Hands-Free Active",
        description: "Enhanced mode with 85% cost savings",
      });
    } catch (error) {
      console.error('Failed to start DeepSeek session:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to DeepSeek service",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Start push-to-talk session
  const startSession = () => {
    setIsSessionActive(true);
    setIsHandsFreeMode(false);
    setMessages([]);
    onSessionStart?.(); // Notify parent
    
    // Add welcome message
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome! I'm ready to help you practice. Press and hold the microphone to start speaking.",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    onMessageUpdate?.([welcomeMessage]);
    
    toast({
      title: "Session Started",
      description: "Voice practice session is now active",
    });
  };

  // End session
  const endSession = () => {
    stopAudio();
    
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
    
    setIsSessionActive(false);
    setIsHandsFreeMode(false);
    setIsDeepSeekMode(false);
    setIsRecording(false);
    setIsProcessing(false);
    setMessages([]);
    setCurrentTranscript('');
    onSessionEnd?.(); // Notify parent
    onConversationEnd?.();
    
    toast({
      title: "Session Ended",
      description: "Voice practice session has ended",
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
      <div className="max-w-md mx-auto">
        {/* Status */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant={isSessionActive ? "default" : "secondary"} className="text-xs">
              {isConnecting ? "Connecting..." : isSessionActive ? "Session Active" : "Session Inactive"}
            </Badge>
            
            {isHandsFreeMode && (
              <Badge variant="outline" className={`text-xs ${isDeepSeekMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                <Phone className="w-3 h-3 mr-1" />
                {isDeepSeekMode ? 'DeepSeek' : 'OpenAI'} Hands-Free
              </Badge>
            )}
            
            {(isSpeaking || isAISpeaking) && (
              <div className="flex items-center gap-1 text-success text-xs">
                <Volume2 className="w-3 h-3" />
                <span>AI Speaking</span>
              </div>
            )}
            
            {isRecording && (
              <div className="flex items-center gap-1 text-primary text-xs">
                <Mic className="w-3 h-3" />
                <span>Recording...</span>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-1 text-warning text-xs">
                <ProcessingIndicator stage="transcribing" />
                <span>Processing...</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {!isSessionActive 
              ? "Choose your interaction mode - Budget, Enhanced, or Premium" 
              : isHandsFreeMode && currentTranscript
              ? `Listening: "${currentTranscript}"`
              : isHandsFreeMode
              ? "Just speak naturally - I'm listening"
              : isRecording
              ? "Release to stop recording"
              : isProcessing
              ? "Processing your speech..."
              : (isSpeaking || isAISpeaking)
              ? "AI is responding..."
              : "Hold microphone button to speak"
            }
          </p>
        </div>

        {/* Mode Selection (when not active) */}
        {!isSessionActive && (
          <div className="space-y-3 mb-4">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-auto py-2 flex-col items-start hover:bg-green-700"
              onClick={startSession}
            >
              <div className="flex items-center w-full">
                <Mic className="w-4 h-4 mr-2" />
                <span className="font-semibold">Tap to Talk</span>
                <Badge variant="secondary" className="ml-auto">$0.031/5min</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Press and hold to speak</p>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full h-auto py-2 flex-col items-start hover:bg-green-700"
              onClick={startDeepSeekHandsFreeSession}
              disabled={isConnecting}
            >
              <div className="flex items-center w-full">
                <Phone className="w-4 h-4 mr-2 text-white" />
                <span className="font-semibold text-white">Hands-Free (Enhanced)</span>
                <Badge variant="secondary" className="ml-auto bg-white text-blue-700">$0.04/5min</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Speak naturally — no tapping needed.</p>
            </Button>
            
            <Button
              size="lg"
              className="w-full h-auto py-2 flex-col items-start bg-green-600 hover:bg-green-700"
              onClick={startHandsFreeSession}
              disabled={isConnecting}
            >
              <div className="flex items-center w-full">
                <Phone className="w-4 h-4 mr-2" />
                <span className="font-semibold">{isConnecting ? "Connecting..." : "Hands-Free (Premium)"}</span>
                <Badge variant="secondary" className="ml-auto bg-white text-green-700">$0.30/5min</Badge>
              </div>
              <p className="text-xs text-white/80 mt-1">Fastest and most natural conversation.</p>
            </Button>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/lessons')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {isSessionActive && !isHandsFreeMode && (
            <Button
              size="lg"
              className={`w-16 h-16 rounded-full ${
                isRecording 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isProcessing || isSpeaking || isAISpeaking}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          )}

          {isSessionActive && isHandsFreeMode && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
            </div>
          )}

          {isSessionActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={endSession}
            >
              {isHandsFreeMode ? (
                <PhoneOff className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </Button>
          )}
        </div>
        
        {/* Quick Actions */}
        {(isSpeaking || isAISpeaking) && (
          <div className="flex justify-center mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={stopAudio}
            >
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