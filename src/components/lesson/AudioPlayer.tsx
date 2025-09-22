import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AudioPlayerProps {
  src: string;
  title?: string;
  description?: string;
  type?: 'pronunciation' | 'dialogue' | 'example';
  transcription?: string;
}

export const AudioPlayer = ({ 
  src, 
  title, 
  description, 
  type = 'example',
  transcription 
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscription, setShowTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTypeColor = () => {
    switch (type) {
      case 'pronunciation': return 'bg-accent/20 text-accent-foreground';
      case 'dialogue': return 'bg-primary/20 text-primary-foreground';
      case 'example': return 'bg-success/20 text-success-foreground';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'pronunciation': return 'Pronunciation';
      case 'dialogue': return 'Dialogue';
      case 'example': return 'Example';
      default: return 'Audio';
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            {title && <h4 className="font-medium text-sm mb-1">{title}</h4>}
            {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
            <Badge variant="secondary" className={`text-xs ${getTypeColor()}`}>
              <Volume2 className="w-3 h-3 mr-1" />
              {getTypeLabel()}
            </Badge>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlay}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>

          <div className="flex-1">
            {/* Progress Bar */}
            <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Transcription */}
        {transcription && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscription(!showTranscription)}
              className="text-xs p-1 h-6"
            >
              {showTranscription ? 'Hide' : 'Show'} Transcription
            </Button>
            
            {showTranscription && (
              <div className="mt-2 p-3 bg-muted/10 rounded-md border-l-2 border-primary/50">
                <p className="text-sm italic text-muted-foreground">{transcription}</p>
              </div>
            )}
          </div>
        )}

        <audio ref={audioRef} src={src} preload="metadata" />
      </CardContent>
    </Card>
  );
};