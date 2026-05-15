// Realtime Audio utilities for Gemini ONLY

// Audio constraints for Gemini: 16-bit PCM Mono at 16,000Hz, little-endian
const GEMINI_SAMPLE_RATE = 16000;
const AUDIO_CHUNK_TARGET_MS = 40; // Target 40ms chunks to avoid disconnection
const MAX_CHUNK_BYTES = Math.floor((GEMINI_SAMPLE_RATE * AUDIO_CHUNK_TARGET_MS / 1000) * 2); // ~1280 bytes

/**
 * Resample audio from the browser's native sample rate to Gemini's required 16kHz.
 * Uses linear interpolation for quality resampling.
 */
function resampleTo16kHz(inputData: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === GEMINI_SAMPLE_RATE) {
    return inputData; // No resampling needed
  }

  const ratio = inputSampleRate / GEMINI_SAMPLE_RATE;
  const outputLength = Math.floor(inputData.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    // Linear interpolation between two nearest samples
    output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
  }

  return output;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      console.log(`[AudioRecorder] Requesting microphone (target ${GEMINI_SAMPLE_RATE}Hz, mono, 16-bit PCM)...`);
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      console.log('[AudioRecorder] Microphone access granted');
      
      // Use the browser's default sample rate — we'll resample in software
      this.audioContext = new AudioContext();
      const nativeSampleRate = this.audioContext.sampleRate;
      console.log('[AudioRecorder] AudioContext created with native sample rate:', nativeSampleRate);
      
      if (nativeSampleRate !== GEMINI_SAMPLE_RATE) {
        console.log(`[AudioRecorder] Will resample from ${nativeSampleRate}Hz → ${GEMINI_SAMPLE_RATE}Hz`);
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      // Use smaller buffer size (512 samples) for lower latency
      this.processor = this.audioContext.createScriptProcessor(512, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Resample from native rate to 16kHz before sending
        const resampled = resampleTo16kHz(new Float32Array(inputData), nativeSampleRate);
        this.onAudioData(resampled);
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

// Encode audio for Gemini API with explicit little-endian 16-bit PCM
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  // Convert Float32 (-1 to 1) to Int16 (-32768 to 32767) with explicit little-endian byte order
  const byteLength = float32Array.length * 2;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    const int16Value = s < 0 ? Math.floor(s * 0x8000) : Math.floor(s * 0x7FFF);
    // Explicitly write as little-endian
    view.setInt16(i * 2, int16Value, true); // true = little-endian
  }
  
  const uint8Array = new Uint8Array(buffer);
  
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

// Provider type - Gemini only now
export type AIProvider = 'gemini';

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: AudioRecorder | null = null;
  private isConnected = false;
  private isSessionReady = false;
  private lessonContextToSend: any = null;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  private onProviderChange?: (provider: AIProvider) => void;
  private onConnectionStateChange?: (isConnected: boolean) => void;

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
    onProviderChange?: (provider: AIProvider) => void,
    onConnectionStateChange?: (isConnected: boolean) => void
  ) {
    if (lessonContext) {
      this.lessonContextToSend = lessonContext;
    }
    this.onProviderChange = onProviderChange;
    this.onConnectionStateChange = onConnectionStateChange;
  }

  // Expose connection state for UI feedback
  getIsConnected(): boolean {
    return this.isConnected;
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
    return 'gemini';
  }

  async connect(): Promise<void> {
    console.log('[RealtimeChat] Connecting to Gemini realtime API...');
    this.onProviderChange?.('gemini');

    return new Promise((resolve, reject) => {
      try {
        const endpoint = `wss://qcxjjhgfgyfhwacxppcp.functions.supabase.co/gemini-realtime`;
        
        console.log('[RealtimeChat] Connecting to WebSocket:', endpoint);
        this.ws = new WebSocket(endpoint);
        
        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.log('[RealtimeChat] Connection timeout, closing socket');
            this.ws.close();
            reject(new Error('Failed to connect to Gemini voice service'));
          }
        }, 15000);
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('[RealtimeChat] Gemini WebSocket OPEN');
          this.isConnected = true;
          this.onConnectionStateChange?.(true);
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[RealtimeChat] onmessage:', data.type, JSON.stringify(data).substring(0, 200));

            if (data.error) {
              console.error('[RealtimeChat] Server error:', data.error);
              this.onMessage({ type: 'error', error: data.error });
              return;
            }

            if (data.type === 'connection_established') {
              console.log('Connection established with Gemini');
              
              this.startKeepalive();
              
              if (this.lessonContextToSend && this.ws) {
                console.log('Sending lesson context:', this.lessonContextToSend.lessonTitle);
                this.ws.send(JSON.stringify({
                  type: 'lesson_init',
                  payload: this.lessonContextToSend
                }));
              }
              
            } else if (data.type === 'session.created') {
              this.isSessionReady = true;
              this.onMessage(data);
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
          reject(new Error('Failed to connect to Gemini voice service'));
        };

        this.ws.onclose = (event) => {
          console.log('[RealtimeChat] WebSocket onclose:', event.code, event.reason);
          this.isConnected = false;
          this.onConnectionStateChange?.(false);
          this.cleanup();
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
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
        if (this.ws && this.isConnected && this.isSessionReady) {
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
