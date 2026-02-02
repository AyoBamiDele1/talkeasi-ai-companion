import React from 'react';
import { cn } from '@/lib/utils';

interface NovaOrbProps {
  isActive?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const NovaOrb: React.FC<NovaOrbProps> = ({
  isActive = false,
  isListening = false,
  isSpeaking = false,
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
        className={cn(
          "absolute rounded-full transition-all duration-500",
          sizeClasses[size],
          isActive && "animate-pulse",
          isActive 
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
          isActive && "scale-105",
          !isActive && "hover:scale-105"
        )}
        style={{
          animation: isActive 
            ? 'novaBreathing 3s ease-in-out infinite' 
            : 'novaBreathingSlow 4s ease-in-out infinite'
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
