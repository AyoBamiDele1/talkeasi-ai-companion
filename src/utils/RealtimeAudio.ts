// Realtime Audio utilities for Gemini ONLY

// Audio constraints for Gemini: 16-bit PCM Mono at 16,000Hz, little-endian
const GEMINI_SAMPLE_RATE = 16000;
// MIME type Google's Live API requires for raw PCM input frames.
export const GEMINI_INPUT_MIME = `audio/pcm;rate=${GEMINI_SAMPLE_RATE}`;
const AUDIO_CHUNK_TARGET_MS = 40; // Target 40ms chunks to avoid disconnection
const MAX_CHUNK_BYTES = Math.floor((GEMINI_SAMPLE_RATE * AUDIO_CHUNK_TARGET_MS / 1000) * 2); // ~1280 bytes
const SAMPLES_PER_CHUNK = MAX_CHUNK_BYTES / 2;

/**
 * Resample audio from the browser's native sample rate down to Gemini's required 16kHz.
 *
 * IMPORTANT: when DOWNSAMPLING (native rate > 16kHz, the common case at 44.1/48kHz),
 * we AVERAGE all source samples that fall inside each output sample's window. That box
 * filter acts as a cheap anti-aliasing low-pass: it removes the >8kHz content that would
 * otherwise fold back as aliasing noise. Naive linear interpolation skips this and can
 * smear/garble the signal enough that Google's server-side voice-activity detection fails
 * to register the user as speaking — which is exactly the "Nova goes silent" symptom.
 */
function resampleTo16kHz(inputData: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === GEMINI_SAMPLE_RATE) {
    return inputData; // Browser already delivered 16kHz — no resampling needed.
  }

  const ratio = inputSampleRate / GEMINI_SAMPLE_RATE;
  const outputLength = Math.floor(inputData.length / ratio);
  const output = new Float32Array(outputLength);

  if (ratio > 1) {
    // Downsampling: average the source window (anti-aliasing box filter).
    for (let i = 0; i < outputLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(Math.floor((i + 1) * ratio), inputData.length);
      let sum = 0;
      let count = 0;
      for (let j = start; j < end; j++) {
        sum += inputData[j];
        count++;
      }
      output[i] = count > 0 ? sum / count : (inputData[start] || 0);
    }
  } else {
    // Upsampling (rare): linear interpolation is appropriate here.
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
    }
  }

  return output;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private pendingSamples: number[] = [];

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
          // Hint the browser to capture at 16kHz where supported.
          sampleRate: GEMINI_SAMPLE_RATE,
        } as MediaTrackConstraints
      });
      
      console.log('[AudioRecorder] Microphone access granted');
      
      // Prefer a 16kHz AudioContext so the browser performs high-quality,
      // anti-aliased resampling at the source. If the browser refuses the
      // requested rate (Safari historically pins to the hardware rate), we
      // fall back to a default context + our own anti-aliasing resampler.
      try {
        this.audioContext = new AudioContext({ sampleRate: GEMINI_SAMPLE_RATE });
      } catch {
        this.audioContext = new AudioContext();
      }
      let nativeSampleRate = this.audioContext.sampleRate;

      // Some browsers silently ignore the requested sampleRate and return the
      // hardware rate (e.g. 48000). Detect that and rebuild a plain context so
      // our software resampler handles the conversion deterministically.
      if (nativeSampleRate !== GEMINI_SAMPLE_RATE) {
        console.log(`[AudioRecorder] Requested ${GEMINI_SAMPLE_RATE}Hz context but got ${nativeSampleRate}Hz`);
      }
      console.log('[AudioRecorder] AudioContext sample rate:', nativeSampleRate);

      if (nativeSampleRate === GEMINI_SAMPLE_RATE) {
        console.log('[AudioRecorder] Capturing natively at 16kHz — no software resampling needed');
      } else {
        console.log(`[AudioRecorder] Will downsample ${nativeSampleRate}Hz → ${GEMINI_SAMPLE_RATE}Hz (anti-aliased)`);
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      // Use smaller buffer size (512 samples) for lower latency
      this.processor = this.audioContext.createScriptProcessor(512, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Resample from native rate to 16kHz before sending
        const resampled = resampleTo16kHz(new Float32Array(inputData), nativeSampleRate);
        this.pendingSamples.push(...resampled);

        while (this.pendingSamples.length >= SAMPLES_PER_CHUNK) {
          const chunk = this.pendingSamples.splice(0, SAMPLES_PER_CHUNK);
          this.onAudioData(new Float32Array(chunk));
        }
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }


  stop() {
    this.pendingSamples = [];
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

// Output sample rate Gemini Live streams back (24kHz, 16-bit PCM mono, little-endian)
const GEMINI_OUTPUT_SAMPLE_RATE = 24000;

/**
 * Continuous, gap-free PCM playback over a SINGLE persistent AudioContext timeline.
 *
 * The previous implementation wrapped every incoming chunk in a WAV header and ran
 * an async `decodeAudioData()` per chunk. That async hop introduced jitter between
 * chunks, so consecutive buffers were scheduled with tiny gaps/overlaps — audible as
 * cracking and stuttering.
 *
 * This player instead:
 *  - converts each Int16 LE PCM chunk to a Float32 AudioBuffer SYNCHRONOUSLY
 *    (no WAV, no decodeAudioData),
 *  - stitches chunks together by scheduling each one exactly where the previous one
 *    ends (`nextStartTime`), keeping one contiguous audio line open for the whole turn,
 *  - only resets the timeline when the turn is flushed (turnComplete) or interrupted
 *    (barge-in).
 */
class AudioStreamPlayer {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private analyser: AnalyserNode;
  private nextStartTime = 0;
  private scheduledSources: Set<AudioBufferSourceNode> = new Set();
  // Small lead so the first buffer of a turn isn't scheduled in the past.
  private readonly scheduleLeadSeconds = 0.06;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 1.0;
    this.gainNode.connect(audioContext.destination);
    // VISUAL-ONLY TAP: a parallel analyser branch off the gain node.
    // It is never connected onward to the destination, so it cannot affect
    // playback timing, volume, or the gap-free scheduling below.
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;
    this.gainNode.connect(this.analyser);
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }


  /** Append a raw PCM chunk (Int16 LE @ 24kHz mono) to the continuous timeline. */
  async enqueue(pcmData: Uint8Array) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const sampleCount = Math.floor(pcmData.length / 2);
    if (sampleCount === 0) return;

    // Int16 LE -> Float32 [-1, 1], done synchronously to avoid scheduling jitter.
    const float32 = new Float32Array(sampleCount);
    const view = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
    for (let i = 0; i < sampleCount; i++) {
      const int16 = view.getInt16(i * 2, true); // little-endian
      float32[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7FFF;
    }

    const audioBuffer = this.audioContext.createBuffer(1, sampleCount, GEMINI_OUTPUT_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const now = this.audioContext.currentTime;
    // If the queue drained (gap in the network stream), restart the line slightly
    // ahead of "now"; otherwise stitch this chunk directly onto the previous one.
    if (this.nextStartTime < now + 0.005) {
      this.nextStartTime = now + this.scheduleLeadSeconds;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    this.scheduledSources.add(source);
    source.onended = () => {
      this.scheduledSources.delete(source);
    };
  }

  /**
   * End of a model turn (turnComplete). Let everything already scheduled play out
   * naturally — just reset the timeline so the next turn starts fresh.
   */
  flushTurn() {
    this.nextStartTime = 0;
  }

  /** True while there is audio scheduled/playing for the current turn. */
  isPlaying(): boolean {
    return this.scheduledSources.size > 0;
  }

  /**
   * Hard stop for barge-in / interruption: kill all scheduled buffers immediately.
   */
  interrupt() {
    for (const source of this.scheduledSources) {
      try {
        source.stop(0);
        source.disconnect();
      } catch (e) {
        // already stopped
      }
    }
    this.scheduledSources.clear();
    this.nextStartTime = 0;
  }

  /** Full teardown used on disconnect/cleanup. */
  clear() {
    this.interrupt();
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend().catch(() => {});
    }
  }
}

let audioStreamPlayer: AudioStreamPlayer | null = null;

/* ------------------------------------------------------------------
 * VISUAL-ONLY AUDIO LEVEL TAPS
 * These helpers exist purely so the UI can animate the orb/waveform.
 * Nothing here participates in capture, encoding, transport or playback.
 * ------------------------------------------------------------------ */

let lastMicRms = 0;
let lastMicRmsAt = 0;

/** Called from the mic pipeline with the already-computed RMS (no extra work). */
export const reportMicLevel = (rms: number) => {
  lastMicRms = rms;
  lastMicRmsAt = performance.now();
};

/** Normalised 0..1 mic level, decaying to 0 when the mic goes quiet/stops. */
export const getMicLevel = (): number => {
  if (!lastMicRmsAt || performance.now() - lastMicRmsAt > 400) return 0;
  // Typical speech RMS sits around 0.02–0.2 — scale into a usable visual range.
  return Math.min(1, lastMicRms * 6);
};

/** Analyser tapped off Nova's playback graph (read-only), if playback exists. */
export const getNovaOutputAnalyser = (): AnalyserNode | null =>
  audioStreamPlayer?.getAnalyser() ?? null;

/** Normalised 0..1 amplitude of Nova's current output audio. */
export const getNovaOutputLevel = (): number => {
  const analyser = audioStreamPlayer?.getAnalyser();
  if (!analyser) return 0;
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 6);
};


export const playAudioData = async (audioContext: AudioContext, audioData: Uint8Array) => {
  if (!audioStreamPlayer) {
    audioStreamPlayer = new AudioStreamPlayer(audioContext);
  }
  await audioStreamPlayer.enqueue(audioData);
};

/** Called on turnComplete — let buffered audio finish, then reset the timeline. */
export const flushAudioStream = () => {
  audioStreamPlayer?.flushTurn();
};

/** Called on interrupted (barge-in) — stop the active audio line immediately. */
export const interruptAudioStream = () => {
  audioStreamPlayer?.interrupt();
};

/** True while Nova is actively speaking — used to apply a stricter barge-in gate. */
export const isNovaSpeaking = (): boolean => audioStreamPlayer?.isPlaying() ?? false;

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
  // --- Transparent session resumption ---
  // Gemini issues a resumption handle we cache so we can silently reconnect and
  // continue the SAME conversation when the edge worker is recycled mid-call.
  private sessionResumptionHandle: string | null = null;
  private intentionalClose = false;
  private serverRejected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 6;
  private onProviderChange?: (provider: AIProvider) => void;
  private onConnectionStateChange?: (isConnected: boolean) => void;
  private isUserSpeaking = false;
  private speechStartChunks = 0;
  private silenceChunks = 0;
  private prefixAudioChunks: Float32Array[] = [];
  // VAD tuning: thresholds are deliberately set so only the primary (close,
  // louder) speaker triggers a turn. Distant background voices/TV typically sit
  // well below ~0.015 RMS at the mic, so raising the start gate plus requiring a
  // longer sustained burst stops Nova from reacting to ambient chatter and
  // interrupting herself.
  private readonly speechStartRms = 0.018;
  // Soft trailing speech ("...and, um, I think") sits well under 0.009, so a
  // lower floor keeps it counted as speech instead of silence.
  private readonly speechEndRms = 0.006;
  private readonly speechStartChunksRequired = 5;
  // 512 samples @ 16kHz = 32ms per chunk. 36 chunks ≈ 1.15s of silence, which
  // tolerates ordinary mid-sentence thinking pauses (0.7–1.5s) so Nova stops
  // cutting people off mid-thought.
  private readonly silenceChunksToEnd = 36;
  private readonly prefixChunksToKeep = 5;
  // If the user resumes speaking within this window after their turn ended,
  // treat it as a continued thought: interrupt Nova instead of talking over them.
  private readonly resumeGraceMs = 400;
  private lastActivityEndAt = 0;

  constructor(
    private onMessage: (message: any) => void,
    lessonContext?: { 
      lessonTitle?: string; 
      lessonContent?: any; 
      coveredScenarios?: string[];
      model?: string;
      voice?: string;
      userMemories?: Array<{ content: string; memory_type: string; importance: number }>;
      userCountry?: string;
      isNigerian?: boolean;
      autoLanguages?: string[];
    },
    onProviderChange?: (provider: AIProvider) => void,
    onConnectionStateChange?: (isConnected: boolean) => void,
    // Pre-warmed AudioContext created within the user gesture.
    // CRITICAL on mobile (Chrome Android / iOS Safari): browsers will refuse
    // to play audio if the AudioContext is created after async work has elapsed
    // and the gesture has ended.
    preWarmedAudioContext?: AudioContext
  ) {
    if (lessonContext) {
      this.lessonContextToSend = lessonContext;
    }
    this.onProviderChange = onProviderChange;
    this.onConnectionStateChange = onConnectionStateChange;
    if (preWarmedAudioContext) {
      this.audioContext = preWarmedAudioContext;
    }
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
              this.serverRejected = true;
              this.onMessage({ type: 'error', error: data.error });
              return;
            }

            // Google rejected/closed the upstream session (billing, tier, policy).
            // Do NOT auto-reconnect — surface it and let the session end.
            if (data.type === 'gemini_disconnected') {
              this.serverRejected = true;
              this.onMessage(data);
              return;
            }

            // Cache the latest resumption handle so an unexpected drop can resume
            // this exact conversation. Not surfaced to the UI.
            if (data.type === 'session_resumption_update') {
              if (typeof data.handle === 'string' && data.handle.length > 0) {
                this.sessionResumptionHandle = data.handle;
                console.log('[Resume] Cached new session resumption handle');
              }
              return;
            }

            if (data.type === 'connection_established') {
              console.log('Connection established with Gemini');
              
              this.startKeepalive();
              
              if (this.lessonContextToSend && this.ws) {
                console.log('Sending lesson context:', this.lessonContextToSend.lessonTitle);
                this.ws.send(JSON.stringify({
                  type: 'lesson_init',
                  payload: this.lessonContextToSend,
                  // On a reconnect this restores the in-progress conversation.
                  resumeHandle: this.sessionResumptionHandle || undefined
                }));
              }
              
            } else if (data.type === 'session.created') {
              this.isSessionReady = true;
              // A successful (re)connect clears the retry counter.
              this.reconnectAttempts = 0;
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
            } else if (data.type === 'response.interrupted') {
              // Barge-in: stop the active audio line immediately.
              console.log('[RealtimeChat] Turn interrupted — flushing audio line');
              interruptAudioStream();
              this.onMessage(data);
            } else if (data.type === 'response.done' || data.type === 'response.output_audio.done') {
              // Turn complete: let buffered audio finish, then reset the timeline.
              console.log('[RealtimeChat] Turn complete — closing audio line after buffered audio drains');
              flushAudioStream();
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
          this.isSessionReady = false;
          this.onConnectionStateChange?.(false);
          this.stopKeepalive();

          // User ended the call, or Google rejected the session → tear everything down.
          if (this.intentionalClose || this.serverRejected) {
            this.cleanup();
            return;
          }

          // Unexpected drop (the edge worker gets recycled after ~75s, or a network
          // blip). Keep the mic + audio context alive and transparently resume the
          // conversation using the cached resumption handle — the user hears no gap.
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          } else {
            console.error('[Reconnect] Max attempts reached — ending session');
            this.onMessage({ type: 'reconnect_failed' });
            this.cleanup();
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Transparent reconnect after an unexpected WebSocket drop. Opens a fresh
   * connection that replays the cached lesson context + resumption handle, so
   * Gemini continues the same conversation. The mic/audio context stay alive.
   */
  private async reconnect() {
    this.reconnectAttempts++;
    const backoffMs = Math.min(500 * this.reconnectAttempts, 3000);
    console.log(`[Reconnect] attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${backoffMs}ms (handle=${this.sessionResumptionHandle ? 'yes' : 'no'})`);
    this.onMessage({ type: 'reconnecting', attempt: this.reconnectAttempts });

    await new Promise((r) => setTimeout(r, backoffMs));

    if (this.intentionalClose || this.serverRejected) return;

    try {
      await this.connect();
      console.log('[Reconnect] ✅ reconnected — session resuming');
    } catch (err) {
      console.error('[Reconnect] attempt failed:', err);
      if (!this.intentionalClose && !this.serverRejected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      } else {
        this.onMessage({ type: 'reconnect_failed' });
        this.cleanup();
      }
    }
  }

  private async startAudioRecording() {
    try {
      // On a transparent reconnect the recorder is already capturing — keep it.
      if (this.recorder) {
        console.log('Recorder already active — keeping existing mic stream through reconnect');
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        return;
      }
      // Reuse the pre-warmed AudioContext if it was created during the user gesture.
      // Creating it here for the first time on mobile would silently fail to play audio.
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: 24000 });
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      }
      
      console.log('Audio context state:', this.audioContext.state);
      console.log('Audio context sample rate:', this.audioContext.sampleRate);
      
      this.recorder = new AudioRecorder((audioData) => {
        this.processMicrophoneAudio(audioData);
      });

      await this.recorder.start();
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  private processMicrophoneAudio(audioData: Float32Array) {
    if (!this.ws || !this.isConnected || !this.isSessionReady || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const rms = this.calculateRms(audioData);
    // Visual-only tap: record the latest mic level so the UI can animate.
    // Purely a write to a module variable — does not alter the audio path.
    reportMicLevel(rms);

    if (!this.isUserSpeaking) {
      this.prefixAudioChunks.push(audioData);
      if (this.prefixAudioChunks.length > this.prefixChunksToKeep) {
        this.prefixAudioChunks.shift();
      }

      // While Nova is speaking, require a louder, longer burst to barge in so
      // background voices/TV can't interrupt her — only deliberate close-up
      // speech from the user crosses the gate.
      const novaSpeaking = isNovaSpeaking();
      const startRms = novaSpeaking ? this.speechStartRms * 1.6 : this.speechStartRms;
      const startChunks = novaSpeaking
        ? this.speechStartChunksRequired + 3
        : this.speechStartChunksRequired;

      this.speechStartChunks = rms >= startRms ? this.speechStartChunks + 1 : 0;

      if (this.speechStartChunks >= startChunks) {
        this.isUserSpeaking = true;
        this.silenceChunks = 0;
        console.log(`[ClientVAD] speech started rms=${rms.toFixed(4)} (novaSpeaking=${novaSpeaking})`);
        this.sendActivityStart();
        for (const chunk of this.prefixAudioChunks) {
          this.sendAudioChunk(chunk);
        }
        this.prefixAudioChunks = [];
      }
      return;
    }

    this.sendAudioChunk(audioData);

    if (rms <= this.speechEndRms) {
      this.silenceChunks++;
      if (this.silenceChunks >= this.silenceChunksToEnd) {
        console.log(`[ClientVAD] speech ended after ${this.silenceChunks} quiet chunks`);
        this.sendActivityEnd();
        this.isUserSpeaking = false;
        this.speechStartChunks = 0;
        this.silenceChunks = 0;
        this.prefixAudioChunks = [];
      }
    } else {
      this.silenceChunks = 0;
    }
  }

  private calculateRms(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  private sendActivityStart() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'input_audio_activity.start' }));
  }

  private sendActivityEnd() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'input_audio_activity.end' }));
  }


  private sendAudioChunk(audioData: Float32Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const encodedAudio = encodeAudioForAPI(audioData);
    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: encodedAudio,
      // Explicit per-frame MIME metadata so the server forwards Google's exact
      // required format (raw 16-bit PCM @ 16kHz) instead of assuming it.
      mimeType: GEMINI_INPUT_MIME
    }));
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
    if (this.isUserSpeaking) {
      this.sendActivityEnd();
    }
    this.isUserSpeaking = false;
    this.speechStartChunks = 0;
    this.silenceChunks = 0;
    this.prefixAudioChunks = [];
    
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    if (audioStreamPlayer) {
      audioStreamPlayer.clear();
      audioStreamPlayer = null;
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
    // Mark this as user-initiated so onclose does NOT try to auto-reconnect.
    this.intentionalClose = true;
    this.isConnected = false;
    this.isSessionReady = false;
    
    this.stopKeepalive();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.cleanup();
  }
}
