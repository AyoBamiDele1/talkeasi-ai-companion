// Realtime Audio utilities for Gemini (primary) and OpenAI (fallback)

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      console.log('[AudioRecorder] Requesting microphone with 16kHz, mono...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googNoiseSuppression: true,
          googAutoGainControl: true,
          googHighpassFilter: true,
        } as any
      });
      
      console.log('[AudioRecorder] Microphone access granted');
      
      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });
      console.log('[AudioRecorder] AudioContext created with sample rate:', this.audioContext.sampleRate);
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(8192, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private nextStartTime: number = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 1.0;
    this.gainNode.connect(audioContext.destination);
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.nextStartTime = 0;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming suspended audio context');
        await this.audioContext.resume();
      }

      const wavData = this.createWavFromPCM(audioData);
      const arrayCopy = new ArrayBuffer(wavData.byteLength);
      new Uint8Array(arrayCopy).set(new Uint8Array(wavData.buffer));
      
      const audioBuffer = await this.audioContext.decodeAudioData(arrayCopy);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      
      this.currentSource = source;
      
      const currentTime = this.audioContext.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      this.nextStartTime = startTime + audioBuffer.duration;
      
      console.log(`Scheduling audio playback at ${startTime}, duration: ${audioBuffer.duration}`);
      
      source.onended = () => {
        console.log('Audio chunk finished playing');
        this.currentSource = null;
        this.playNext();
      };
      
      source.start(startTime);
      console.log('Audio playback started');
    } catch (error) {
      console.error('Error playing audio:', error);
      this.currentSource = null;
      this.playNext();
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }

  clear() {
    console.log('Clearing audio queue - stopping all playback');
    if (this.currentSource) {
      try {
        this.currentSource.stop(0);
        this.currentSource.disconnect();
      } catch (e) {
        console.log('Audio source already stopped:', e);
      }
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
    
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend().then(() => {
        console.log('Audio context suspended to stop all playback');
      }).catch(e => {
        console.log('Error suspending audio context:', e);
      });
    }
    console.log('Audio queue cleared');
  }
}

let audioQueueInstance: AudioQueue | null = null;

export const playAudioData = async (audioContext: AudioContext, audioData: Uint8Array) => {
  if (!audioQueueInstance) {
    audioQueueInstance = new AudioQueue(audioContext);
  }
  await audioQueueInstance.addToQueue(audioData);
};

// Provider type for tracking which AI is being used
export type AIProvider = 'gemini' | 'openai';

// Persistent state for connection attempts
let geminiFailCount = 0;
const MAX_GEMINI_FAILURES = 3;

export const resetConnectionAttempts = () => {
  geminiFailCount = 0;
};

export const shouldUseGemini = (): boolean => {
  return geminiFailCount < MAX_GEMINI_FAILURES;
};

export const recordGeminiFailure = () => {
  geminiFailCount++;
  console.log(`Gemini failure recorded. Count: ${geminiFailCount}/${MAX_GEMINI_FAILURES}`);
};

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: AudioRecorder | null = null;
  private isConnected = false;
  private lessonContextToSend: any = null;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  private currentProvider: AIProvider = 'gemini';
  private onProviderChange?: (provider: AIProvider) => void;

  constructor(
    private onMessage: (message: any) => void,
    lessonContext?: { 
      lessonTitle?: string; 
      lessonContent?: any; 
      coveredScenarios?: string[];
      model?: string;
      userMemories?: Array<{ content: string; memory_type: string; importance: number }>;
      userCountry?: string;
      isNigerian?: boolean;
    },
    onProviderChange?: (provider: AIProvider) => void
  ) {
    if (lessonContext) {
      this.lessonContextToSend = lessonContext;
    }
    this.onProviderChange = onProviderChange;
  }

  private startKeepalive() {
    this.keepaliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[Keepalive] Sending ping to maintain connection');
        this.ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
      }
    }, 25000);
  }

  private stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  getProvider(): AIProvider {
    return this.currentProvider;
  }

  async connect(): Promise<void> {
    // Determine which provider to use
    const useGemini = shouldUseGemini();
    this.currentProvider = useGemini ? 'gemini' : 'openai';
    
    console.log(`[RealtimeChat] Connecting to ${this.currentProvider} realtime API...`);
    this.onProviderChange?.(this.currentProvider);

    return new Promise((resolve, reject) => {
      try {
        const endpoint = useGemini
          ? `wss://qcxjjhgfgyfhwacxppcp.functions.supabase.co/gemini-realtime`
          : `wss://qcxjjhgfgyfhwacxppcp.functions.supabase.co/realtime-conversation`;
        
        console.log('[RealtimeChat] Connecting to WebSocket:', endpoint);
        this.ws = new WebSocket(endpoint);
        
        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.log('[RealtimeChat] Connection timeout, closing socket');
            this.ws.close();
            
            if (useGemini) {
              recordGeminiFailure();
              // Retry with OpenAI
              this.currentProvider = 'openai';
              this.onProviderChange?.('openai');
              this.connectToOpenAI().then(resolve).catch(reject);
            } else {
              reject(new Error('Failed to connect to voice service'));
            }
          }
        }, 10000);
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log(`[RealtimeChat] ${this.currentProvider} WebSocket OPEN`);
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[RealtimeChat] onmessage:', data.type, JSON.stringify(data).substring(0, 200));

            // Handle errors - check for fallback signal from Gemini
            if (data.error) {
              console.error('[RealtimeChat] Server error:', data.error);
              
              // If Gemini signals fallback, switch to OpenAI
              if (data.fallback && this.currentProvider === 'gemini') {
                console.log('[RealtimeChat] Gemini requested fallback to OpenAI');
                recordGeminiFailure();
                this.disconnect();
                await this.connectToOpenAI();
                return;
              }
              
              this.onMessage({ type: 'error', error: data.error });
              return;
            }

            if (data.type === 'connection_established') {
              console.log(`Connection established with ${data.provider || this.currentProvider}`);
              
              this.startKeepalive();
              
              if (this.lessonContextToSend && this.ws) {
                console.log('Sending lesson context:', this.lessonContextToSend.lessonTitle);
                this.ws.send(JSON.stringify({
                  type: 'lesson_init',
                  payload: this.lessonContextToSend
                }));
              }
              
              await this.startAudioRecording();
            } else if (data.type === 'response.audio.delta' || data.type === 'response.output_audio.delta') {
              if (data.delta) {
                console.log('Received audio delta');
                await this.handleAudioDelta(data.delta);
              }
            } else if (data.type === 'response.audio_transcript.delta' || data.type === 'response.output_audio_transcript.delta') {
              console.log('Transcript delta:', data.delta);
              this.onMessage(data);
            } else {
              this.onMessage(data);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('[RealtimeChat] WebSocket onerror:', error);
          
          if (useGemini && !this.isConnected) {
            recordGeminiFailure();
            this.connectToOpenAI().then(resolve).catch(reject);
          } else {
            reject(new Error('Failed to connect to voice service'));
          }
        };

        this.ws.onclose = (event) => {
          console.log('[RealtimeChat] WebSocket onclose:', event.code, event.reason);
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.cleanup();
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private async connectToOpenAI(): Promise<void> {
    console.log('Falling back to OpenAI realtime API...');
    this.currentProvider = 'openai';
    this.onProviderChange?.('openai');
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`wss://qcxjjhgfgyfhwacxppcp.functions.supabase.co/realtime-conversation`);
        
        this.ws.onopen = () => {
          console.log('OpenAI WebSocket connected successfully (fallback)');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message (OpenAI):', data.type);

            if (data.error) {
              console.error('Server error:', data.error);
              this.onMessage({ type: 'error', error: data.error });
              return;
            }

            if (data.type === 'connection_established') {
              console.log('Connection established with OpenAI');
              
              this.startKeepalive();
              
              if (this.lessonContextToSend && this.ws) {
                console.log('Sending lesson context:', this.lessonContextToSend.lessonTitle);
                this.ws.send(JSON.stringify({
                  type: 'lesson_init',
                  payload: this.lessonContextToSend
                }));
              }
              
              await this.startAudioRecording();
            } else if (data.type === 'response.audio.delta' || data.type === 'response.output_audio.delta') {
              if (data.delta) {
                await this.handleAudioDelta(data.delta);
              }
            } else if (data.type === 'response.audio_transcript.delta' || data.type === 'response.output_audio_transcript.delta') {
              this.onMessage(data);
            } else {
              this.onMessage(data);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('OpenAI WebSocket error:', error);
          reject(new Error('Failed to connect to OpenAI voice service'));
        };

        this.ws.onclose = (event) => {
          console.log('OpenAI WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.cleanup();
        };
      } catch (error) {
        console.error('Error creating OpenAI WebSocket:', error);
        reject(error);
      }
    });
  }

  private async startAudioRecording() {
    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      }
      
      console.log('Audio context state:', this.audioContext.state);
      console.log('Audio context created with sample rate:', this.audioContext.sampleRate);
      
      this.recorder = new AudioRecorder((audioData) => {
        if (this.ws && this.isConnected) {
          const encodedAudio = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await this.recorder.start();
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  private async handleAudioDelta(delta: string) {
    if (!this.audioContext) {
      console.error('Audio context not initialized');
      return;
    }

    try {
      const binaryString = atob(delta);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('Playing audio chunk, size:', bytes.length);
      await playAudioData(this.audioContext, bytes);
    } catch (error) {
      console.error('Error handling audio delta:', error);
    }
  }

  sendMessage(text: string) {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to realtime chat');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(event));
    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  private cleanup() {
    console.log('Running cleanup - stopping all audio and closing context');
    this.stopKeepalive();
    
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    if (audioQueueInstance) {
      audioQueueInstance.clear();
      audioQueueInstance = null;
    }
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log('Audio context closed');
      }).catch(e => {
        console.log('Error closing audio context:', e);
      });
      this.audioContext = null;
    }
  }

  disconnect() {
    console.log('Disconnecting RealtimeChat and clearing audio queue');
    this.isConnected = false;
    
    this.stopKeepalive();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.cleanup();
  }
}
