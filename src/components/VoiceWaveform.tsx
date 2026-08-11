import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAudioLevels, AUDIO_BAR_COUNT, prefersReducedMotion, type VoiceVisualMode } from '@/hooks/useAudioLevels';

interface VoiceWaveformProps {
  mode: VoiceVisualMode;
  className?: string;
}

/**
 * Purely presentational waveform. Reads audio levels via the read-only
 * useAudioLevels sampler and mutates bar heights directly through refs so
 * React never re-renders per frame.
 */
const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ mode, className }) => {
  const levelsRef = useAudioLevels(mode);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (mode === 'idle' || prefersReducedMotion()) {
      barsRef.current.forEach((bar) => {
        if (bar) {
          bar.style.transform = 'scaleY(0.08)';
          bar.style.opacity = '0.35';
        }
      });
      return;
    }

    let raf = 0;
    let cancelled = false;

    const paint = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(paint);
      if (document.hidden) return;

      const { bars } = levelsRef.current;
      for (let i = 0; i < barsRef.current.length; i++) {
        const el = barsRef.current[i];
        if (!el) continue;
        const value = Math.min(1, bars[i] ?? 0);
        el.style.transform = `scaleY(${Math.max(0.08, value)})`;
        el.style.opacity = `${0.4 + value * 0.6}`;
      }
    };

    raf = requestAnimationFrame(paint);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [mode, levelsRef]);

  return (
    <div
      className={cn('flex items-center justify-center gap-[3px] h-8 w-full max-w-[240px]', className)}
      aria-hidden="true"
    >
      {Array.from({ length: AUDIO_BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className={cn(
            'block w-[3px] h-full rounded-full origin-center transition-none',
            mode === 'speaking'
              ? 'bg-gradient-to-b from-primary to-accent'
              : 'bg-primary/60'
          )}
          style={{ transform: 'scaleY(0.08)', opacity: 0.4 }}
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
