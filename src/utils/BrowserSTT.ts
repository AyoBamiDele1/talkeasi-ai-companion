export interface BrowserSTTConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export class BrowserSTT {
  private recognition: any;
  private isListening = false;
  private onResultCallback: (result: TranscriptResult) => void;
  private onErrorCallback: (error: Error) => void;
  private onEndCallback: () => void;

  constructor(
    onResult: (result: TranscriptResult) => void,
    onError: (error: Error) => void,
    onEnd: () => void,
    config: BrowserSTTConfig = {}
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    // Check if Web Speech API is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Web Speech API is not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = config.continuous ?? true;
    this.recognition.interimResults = config.interimResults ?? true;
    this.recognition.lang = config.language ?? 'en-US';
    this.recognition.maxAlternatives = config.maxAlternatives ?? 1;

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      console.log('[BrowserSTT] Result:', { transcript, isFinal, confidence });

      this.onResultCallback({
        text: transcript,
        isFinal,
        confidence: confidence || 0.95 // Some browsers don't provide confidence
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('[BrowserSTT] Error:', event.error);
      
      // Don't treat "no-speech" as a critical error
      if (event.error === 'no-speech') {
        console.log('[BrowserSTT] No speech detected, continuing...');
        return;
      }

      // Restart on certain errors
      if (event.error === 'network' || event.error === 'aborted') {
        console.log('[BrowserSTT] Attempting to restart after error...');
        if (this.isListening) {
          setTimeout(() => this.restart(), 100);
        }
        return;
      }

      this.onErrorCallback(new Error(event.error));
    };

    this.recognition.onend = () => {
      console.log('[BrowserSTT] Recognition ended');
      if (this.isListening) {
        // Auto-restart if we're supposed to be listening
        console.log('[BrowserSTT] Auto-restarting...');
        setTimeout(() => this.restart(), 100);
      } else {
        this.onEndCallback();
      }
    };

    this.recognition.onstart = () => {
      console.log('[BrowserSTT] Recognition started');
    };
  }

  start() {
    if (this.isListening) {
      console.log('[BrowserSTT] Already listening');
      return;
    }

    console.log('[BrowserSTT] Starting recognition...');
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (error) {
      console.error('[BrowserSTT] Error starting recognition:', error);
      // If already started, just continue
      if ((error as Error).message.includes('already started')) {
        console.log('[BrowserSTT] Recognition already started, continuing...');
      } else {
        this.isListening = false;
        throw error;
      }
    }
  }

  stop() {
    if (!this.isListening) {
      return;
    }

    console.log('[BrowserSTT] Stopping recognition...');
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('[BrowserSTT] Error stopping recognition:', error);
    }
  }

  private restart() {
    if (!this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
      setTimeout(() => {
        if (this.isListening) {
          this.recognition.start();
        }
      }, 100);
    } catch (error) {
      console.error('[BrowserSTT] Error restarting recognition:', error);
    }
  }

  isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}
