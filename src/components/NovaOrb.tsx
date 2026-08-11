import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAudioLevels, prefersReducedMotion, type VoiceVisualMode } from '@/hooks/useAudioLevels';

interface NovaOrbProps {
  isActive?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  isConnected?: boolean; // WebSocket OPEN state
  /**
   * When set to 'listening' or 'speaking', the orb reacts to live audio levels
   * (read-only sampling — it never touches the audio pipeline).
   */
  reactiveMode?: VoiceVisualMode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const NovaOrb: React.FC<NovaOrbProps> = ({
  isActive = false,
  isListening = false,
  isSpeaking = false,
  // Default to false so the orb only animates when a realtime WebSocket is actually OPEN.
  isConnected = false,
  reactiveMode = 'idle',
  size = 'lg',
  onClick,
  className
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  const levelsRef = useAudioLevels(reactiveMode);
  const orbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const reactive = reactiveMode !== 'idle' && !prefersReducedMotion();

  useEffect(() => {
    if (!reactive) {
      if (orbRef.current) orbRef.current.style.transform = '';
      if (glowRef.current) glowRef.current.style.opacity = '';
      return;
    }

    let raf = 0;
    let cancelled = false;
    let smoothed = 0;

    const paint = (now: number) => {
      if (cancelled) return;
      raf = requestAnimationFrame(paint);
      if (document.hidden) return;

      const level = levelsRef.current.level;

      if (reactiveMode === 'speaking') {
        // Expand/contract with Nova's actual voice amplitude.
        smoothed = smoothed * 0.75 + level * 0.25;
        const scale = 1 + smoothed * 0.16;
        if (orbRef.current) orbRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        if (glowRef.current) glowRef.current.style.opacity = `${(0.45 + smoothed * 0.55).toFixed(3)}`;
      } else {
        // Listening: soft, slow pulse with a very subtle glow bloom.
        const breath = 0.5 + 0.5 * Math.sin(now / 1500);
        smoothed = smoothed * 0.9 + level * 0.1;
        const scale = 1 + breath * 0.02 + smoothed * 0.03;
        if (orbRef.current) orbRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        if (glowRef.current) glowRef.current.style.opacity = `${(0.3 + breath * 0.15 + smoothed * 0.2).toFixed(3)}`;
      }
    };

    raf = requestAnimationFrame(paint);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [reactive, reactiveMode, levelsRef]);


  return (
    <div 
      className={cn(
        "relative flex items-center justify-center cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Outer glow ring - pulses when active */}
      <div 
        ref={glowRef}
        className={cn(
          "absolute rounded-full transition-all duration-500",
          sizeClasses[size],
          isActive && !reactive && "animate-pulse",
          isActive || reactive
            ? "bg-gradient-to-r from-primary/30 to-accent/30 blur-xl scale-150" 
            : "bg-primary/10 blur-lg scale-125"
        )}
      />

      
      {/* Ping effect when listening */}
      {isListening && (
        <>
          <div className={cn(
            "absolute rounded-full bg-primary/40 animate-ping",
            size === 'lg' ? 'w-36 h-36' : size === 'md' ? 'w-20 h-20' : size === 'sm' ? 'w-16 h-16' : 'w-10 h-10'
          )} />
          <div className={cn(
            "absolute rounded-full bg-accent/30 animate-ping animation-delay-200",
            size === 'lg' ? 'w-40 h-40' : size === 'md' ? 'w-24 h-24' : size === 'sm' ? 'w-18 h-18' : 'w-12 h-12'
          )} style={{ animationDelay: '0.2s' }} />
        </>
      )}
      
      {/* Speaking wave effect */}
      {isSpeaking && (
        <div className={cn(
          "absolute rounded-full border-2 border-accent/50 animate-[ping_1.5s_ease-in-out_infinite]",
          size === 'lg' ? 'w-40 h-40' : size === 'md' ? 'w-24 h-24' : size === 'sm' ? 'w-18 h-18' : 'w-12 h-12'
        )} />
      )}
      
      {/* Main orb */}
      <div 
        className={cn(
          "relative rounded-full transition-all duration-300 flex items-center justify-center",
          "bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(280,70%,50%)]",
          "shadow-[0_0_40px_rgba(236,72,153,0.4),0_0_80px_rgba(139,92,246,0.3)]",
          sizeClasses[size],
          isConnected && isActive && "scale-105",
          !isConnected && "opacity-70",
          isConnected && !isActive && "hover:scale-105"
        )}
        style={{
          // Only animate when WebSocket is OPEN (connected)
          animation: isConnected 
            ? (isActive 
                ? 'novaBreathing 3s ease-in-out infinite' 
                : 'novaBreathingSlow 4s ease-in-out infinite')
            : 'none'
        }}
      >
        {/* Inner glow */}
        <div className={cn(
          "absolute inset-2 rounded-full",
          "bg-gradient-to-tr from-white/30 via-white/10 to-transparent",
          "backdrop-blur-sm"
        )} />
        
        {/* Center highlight */}
        <div className={cn(
          "absolute rounded-full bg-white/40 blur-sm",
          size === 'lg' ? 'w-8 h-8 top-4 left-6' : size === 'md' ? 'w-4 h-4 top-2 left-4' : size === 'sm' ? 'w-3 h-3 top-1.5 left-3' : 'w-2 h-2 top-1 left-2'
        )} />
        
        {/* Nova text or icon */}
        <span className={cn(
          "relative z-10 font-bold text-white/90 select-none",
          size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : size === 'sm' ? 'text-sm' : 'text-xs'
        )}>
          ✦
        </span>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes novaBreathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes novaBreathingSlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
};

export default NovaOrb;
