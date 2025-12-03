import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MoodSelectorProps {
  onMoodSelect: (mood: number) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

const MOODS = [
  { value: 1, emoji: '😢', label: 'Sad' },
  { value: 2, emoji: '😕', label: 'Down' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const MoodSelector = ({ onMoodSelect, title, subtitle, className }: MoodSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleSelect = (mood: number) => {
    setSelectedMood(mood);
    onMoodSelect(mood);
  };

  return (
    <div className={cn("text-center", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}
      
      <div className="flex justify-center gap-3">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleSelect(mood.value)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all",
              "hover:bg-muted/50",
              selectedMood === mood.value && "bg-primary/10 ring-2 ring-primary"
            )}
          >
            <span className="text-3xl mb-1">{mood.emoji}</span>
            <span className="text-xs text-muted-foreground">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;