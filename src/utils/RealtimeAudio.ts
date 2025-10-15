export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
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

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    // Create gain node for smooth transitions
    this.gainNode = audioContext.createGain();
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
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const wavData = this.createWavFromPCM(audioData);
      // Create a proper copy to avoid SharedArrayBuffer issues
      const arrayCopy = new ArrayBuffer(wavData.byteLength);
      new Uint8Array(arrayCopy).set(new Uint8Array(wavData.buffer));
      
      const audioBuffer = await this.audioContext.decodeAudioData(arrayCopy);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Use gain node for smoother playback
      source.connect(this.gainNode);
      
      // Add small fade in/out to prevent clicks
      const now = this.audioContext.currentTime;
      this.gainNode.gain.setValueAtTime(0.01, now);
      this.gainNode.gain.exponentialRampToValueAtTime(1, now + 0.01);
      
      this.currentSource = source;
      
      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };
      
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.currentSource = null;
      this.playNext(); // Continue with next segment even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header parameters
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // Write WAV header
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

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }

  clear() {
    // Stop current playback
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
  }
}

let audioQueueInstance: AudioQueue | null = null;

export const playAudioData = async (audioContext: AudioContext, audioData: Uint8Array) => {
  if (!audioQueueInstance) {
    audioQueueInstance = new AudioQueue(audioContext);
  }
  await audioQueueInstance.addToQueue(audioData);
};

export class RealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: AudioRecorder | null = null;
  private isConnected = false;

  constructor(private onMessage: (message: any) => void) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use the full WebSocket URL for the edge function
        console.log('Connecting to WebSocket...');
        this.ws = new WebSocket(`wss://qcxjjhgfgyfhwacxppcp.functions.supabase.co/realtime-conversation`);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected successfully');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data.type);

            // Handle errors from the server
            if (data.error) {
              console.error('Server error:', data.error);
              this.onMessage({ type: 'error', error: data.error });
              return;
            }

            if (data.type === 'connection_established') {
              console.log('Connection established, starting audio recording...');
              // Start audio recording
              await this.startAudioRecording();
            } else if (data.type === 'response.audio.delta' || data.type === 'response.output_audio.delta') {
              // Play audio chunk (supports both legacy and new event types)
              if (data.delta) {
                console.log('Received audio delta');
                await this.handleAudioDelta(data.delta);
              }
            } else if (data.type === 'response.audio_transcript.delta' || data.type === 'response.output_audio_transcript.delta') {
              // Handle transcript (supports both legacy and new event types)
              console.log('Transcript delta:', data.delta);
              // Forward transcript events to the UI as well
              this.onMessage(data);
            } else {
              // Forward to message handler
              this.onMessage(data);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('Failed to connect to voice service'));
        };

        this.ws.onclose = (event) => {
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

  private async startAudioRecording() {
    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
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
      // Convert base64 to Uint8Array
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
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (audioQueueInstance) {
      audioQueueInstance.clear();
    }
  }

  disconnect() {
    this.isConnected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }
}

// ============= DeepSeek Realtime Chat with Browser STT =============

import { BrowserSTT, TranscriptResult } from './BrowserSTT';
import { ResponseCache } from './ResponseCache';
import { NetworkMonitor, NetworkQuality } from './NetworkQuality';

interface TextBatchItem {
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export class DeepSeekRealtimeChat {
  private ws: WebSocket | null = null;
  private browserSTT: BrowserSTT | null = null;
  private responseCache: ResponseCache;
  private networkMonitor: NetworkMonitor;
  private isConnected = false;
  private textBuffer: TextBatchItem[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private currentNetworkQuality: NetworkQuality = 'good';
  private lessonContext: string = '';
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    private onMessage: (message: any) => void,
    private onTranscript: (text: string, isFinal: boolean) => void
  ) {
    this.responseCache = new ResponseCache();
    this.networkMonitor = new NetworkMonitor();
  }

  async connect(lessonContext: string): Promise<void> {
    this.lessonContext = lessonContext;

    return new Promise((resolve, reject) => {
      try {
        console.log('[DeepSeek Realtime] Connecting...');
        
        // Start network monitoring
        this.networkMonitor.startMonitoring((metrics) => {
          this.currentNetworkQuality = metrics.quality;
          console.log('[DeepSeek Realtime] Network quality:', metrics.quality, 'latency:', metrics.latency.toFixed(0), 'ms');
        });

        // Connect to WebSocket
        this.ws = new WebSocket(`wss://qcxjjhgfgyfhwacxppcp.functions.supabase.co/deepseek-realtime`);

        this.ws.onopen = () => {
          console.log('[DeepSeek Realtime] WebSocket connected');
          this.isConnected = true;
          this.startBrowserSTT();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[DeepSeek Realtime] Message:', data.type);

            if (data.type === 'response.text.delta') {
              // Forward streaming text to UI
              this.onMessage(data);
            } else if (data.type === 'response.text.done') {
              // Cache the response
              const lastUserMessage = this.conversationHistory[this.conversationHistory.length - 1];
              if (lastUserMessage && lastUserMessage.role === 'user') {
                this.responseCache.set(lastUserMessage.content, data.text);
              }
              
              // Add to conversation history
              this.conversationHistory.push({
                role: 'assistant',
                content: data.text
              });

              this.onMessage(data);
            } else if (data.type === 'error') {
              console.error('[DeepSeek Realtime] Error:', data.error);
              this.onMessage(data);
            } else {
              this.onMessage(data);
            }
          } catch (error) {
            console.error('[DeepSeek Realtime] Error processing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[DeepSeek Realtime] WebSocket error:', error);
          reject(new Error('Failed to connect to DeepSeek realtime service'));
        };

        this.ws.onclose = () => {
          console.log('[DeepSeek Realtime] WebSocket closed');
          this.isConnected = false;
          this.cleanup();
        };
      } catch (error) {
        console.error('[DeepSeek Realtime] Error connecting:', error);
        reject(error);
      }
    });
  }

  private startBrowserSTT() {
    try {
      console.log('[DeepSeek Realtime] Starting Browser STT...');

      this.browserSTT = new BrowserSTT(
        (result: TranscriptResult) => this.handleTranscriptResult(result),
        (error: Error) => {
          console.error('[DeepSeek Realtime] STT error:', error);
          this.onMessage({ type: 'error', error: error.message });
        },
        () => {
          console.log('[DeepSeek Realtime] STT ended');
        },
        {
          continuous: true,
          interimResults: true,
          language: 'en-US'
        }
      );

      this.browserSTT.start();
      console.log('[DeepSeek Realtime] Browser STT started');
    } catch (error) {
      console.error('[DeepSeek Realtime] Error starting STT:', error);
      throw error;
    }
  }

  private handleTranscriptResult(result: TranscriptResult) {
    // Forward transcript to UI immediately
    this.onTranscript(result.text, result.isFinal);

    // Add to buffer
    this.textBuffer.push({
      text: result.text,
      timestamp: Date.now(),
      isFinal: result.isFinal
    });

    // Get adaptive batching parameters
    const batchSize = this.networkMonitor.getRecommendedBatchSize(this.currentNetworkQuality);
    const silenceMs = this.networkMonitor.getRecommendedSilenceMs(this.currentNetworkQuality);

    // Check if we should send immediately
    if (result.isFinal && this.textBuffer.length >= batchSize) {
      this.flushTextBuffer();
    } else {
      // Set timer to flush after silence
      this.resetBatchTimer(silenceMs);
    }
  }

  private resetBatchTimer(silenceMs: number) {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      if (this.textBuffer.length > 0) {
        this.flushTextBuffer();
      }
    }, silenceMs);
  }

  private flushTextBuffer() {
    if (this.textBuffer.length === 0 || !this.ws || !this.isConnected) {
      return;
    }

    // Combine text from buffer
    const fullText = this.textBuffer
      .map(item => item.text)
      .join(' ')
      .trim();

    if (!fullText) {
      this.textBuffer = [];
      return;
    }

    console.log('[DeepSeek Realtime] Flushing buffer:', fullText);

    // Check cache first
    const cachedResponse = this.responseCache.get(fullText);
    if (cachedResponse) {
      console.log('[DeepSeek Realtime] Using cached response');
      this.onMessage({
        type: 'response.text.done',
        text: cachedResponse,
        cached: true
      });
      this.textBuffer = [];
      return;
    }

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: fullText
    });

    // Send to DeepSeek
    this.ws.send(JSON.stringify({
      type: 'text_message',
      text: fullText,
      lessonContext: this.lessonContext,
      conversationHistory: this.conversationHistory.slice(-10) // Last 10 messages
    }));

    this.textBuffer = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private cleanup() {
    if (this.browserSTT) {
      this.browserSTT.stop();
      this.browserSTT = null;
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.networkMonitor.stopMonitoring();
    this.textBuffer = [];
  }

  disconnect() {
    this.isConnected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }

  getCacheStats() {
    return this.responseCache.getStats();
  }

  clearCache() {
    this.responseCache.clear();
  }
}