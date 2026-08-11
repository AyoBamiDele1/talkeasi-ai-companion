import { useEffect, useRef } from 'react';
import { getMicLevel, getNovaOutputLevel, getNovaOutputAnalyser } from '@/utils/RealtimeAudio';

export type VoiceVisualMode = 'idle' | 'listening' | 'speaking';

interface AudioLevels {
  /** 0..1 overall amplitude driving the orb pulse */
  level: number;
  /** normalised frequency bars (0..1) driving the waveform */
  bars: number[];
}

const BAR_COUNT = 40;
const FRAME_INTERVAL_MS = 1000 / 30; // cap at ~30fps

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Read-only audio level sampler.
 *
 * Reads levels that the voice pipeline already produces (mic RMS) and a
 * parallel analyser tapped off Nova's playback graph. It never mutates the
 * audio graph, so conversation logic and playback are untouched.
 *
 * Values are written into a ref (not state) so animation never re-renders React.
 */
export const useAudioLevels = (mode: VoiceVisualMode) => {
  const levelsRef = useRef<AudioLevels>({ level: 0, bars: new Array(BAR_COUNT).fill(0) });
  const modeRef = useRef<VoiceVisualMode>(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (mode === 'idle' || prefersReducedMotion()) {
      levelsRef.current = { level: 0, bars: new Array(BAR_COUNT).fill(0) };
      return;
    }

    let raf = 0;
    let last = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);

      if (document.hidden) return;
      if (now - last < FRAME_INTERVAL_MS) return;
      last = now;

      const prev = levelsRef.current;

      // Detect Nova's actual output energy directly from the analyser, so the
      // visuals react even if the UI "speaking" flag lags behind the audio.
      const analyser = getNovaOutputAnalyser();
      const novaLevel = getNovaOutputLevel();
      let novaEnergy = 0;
      let freq: Uint8Array | null = null;
      if (analyser) {
        freq = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq);
        for (let i = 0; i < freq.length; i++) novaEnergy += freq[i];
        novaEnergy = novaEnergy / freq.length / 255;
      }

      const speaking = modeRef.current === 'speaking' || novaEnergy > 0.01 || novaLevel > 0.02;

      if (speaking) {
        const bars = new Array(BAR_COUNT).fill(0);
        if (freq) {
          // Use the lower ~70% of bins (speech energy) spread across the bars.
          const usable = Math.floor(freq.length * 0.7);
          const step = Math.max(1, Math.floor(usable / BAR_COUNT));
          for (let i = 0; i < BAR_COUNT; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) sum += freq[i * step + j] ?? 0;
            const value = Math.min(1, (sum / step / 255) * 1.8);
            // smooth against the previous frame for a fluid, non-jittery motion
            bars[i] = prev.bars[i] * 0.5 + value * 0.5;
          }
        }
        const level = prev.level * 0.5 + Math.max(novaLevel, novaEnergy * 2) * 0.5;
        levelsRef.current = { level, bars };
      } else {
        // Listening: soft, calm response to the user's own voice.
        const mic = getMicLevel();
        const level = prev.level * 0.85 + mic * 0.15;
        const bars = prev.bars.map((b, i) => {
          const wave = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 + i * 0.35));
          return b * 0.7 + level * wave * 0.3;
        });
        levelsRef.current = { level, bars };
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  return levelsRef;
};

export const AUDIO_BAR_COUNT = BAR_COUNT;
