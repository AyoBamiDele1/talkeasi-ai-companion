import React from 'react';
import { cn } from '@/lib/utils';

interface NovaIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

/**
 * A small, static Nova icon for use in lists, cards, and UI elements.
 * For the full animated orb, use NovaOrb component instead.
 */
const NovaIcon: React.FC<NovaIconProps> = ({ className, size = 'sm' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6'
  };

  const starSize = {
    xs: 'text-[6px]',
    sm: 'text-[8px]',
    md: 'text-xs'
  };

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(280,70%,50%)]",
        "shadow-[0_0_8px_rgba(236,72,153,0.4)]",
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("text-white/90 font-bold", starSize[size])}>✦</span>
    </div>
  );
};

export default NovaIcon;
