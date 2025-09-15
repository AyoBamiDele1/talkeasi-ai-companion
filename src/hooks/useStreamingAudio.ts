import { useCallback, useRef } from 'react';

interface AudioQueueItem {
  audio: string;
  index: number;
  text: string;
}

export const useStreamingAudio = () => {
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const addToQueue = useCallback((item: AudioQueueItem) => {
    audioQueueRef.current.push(item);
    audioQueueRef.current.sort((a, b) => a.index - b.index);
    
    if (!isPlayingRef.current) {
      playNext();
    }
  }, []);

  const playNext = useCallback(() => {
    const nextItem = audioQueueRef.current.find(item => item.index === currentIndexRef.current);
    
    if (!nextItem) {
      // Check if we should wait for more chunks
      if (audioQueueRef.current.length > 0) {
        // Wait a bit and try again
        setTimeout(playNext, 100);
      } else {
        isPlayingRef.current = false;
      }
      return;
    }

    isPlayingRef.current = true;
    
    try {
      const audio = new Audio(`data:audio/mp3;base64,${nextItem.audio}`);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        currentIndexRef.current++;
        audioQueueRef.current = audioQueueRef.current.filter(item => item.index !== nextItem.index);
        playNext();
      };
      
      audio.onerror = () => {
        console.error('Audio playback error for chunk:', nextItem.index);
        currentIndexRef.current++;
        audioQueueRef.current = audioQueueRef.current.filter(item => item.index !== nextItem.index);
        playNext();
      };
      
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        currentIndexRef.current++;
        audioQueueRef.current = audioQueueRef.current.filter(item => item.index !== nextItem.index);
        playNext();
      });
    } catch (error) {
      console.error('Error creating audio element:', error);
      currentIndexRef.current++;
      audioQueueRef.current = audioQueueRef.current.filter(item => item.index !== nextItem.index);
      playNext();
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    currentIndexRef.current = 0;
    isPlayingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  return {
    addToQueue,
    stopAudio,
    reset,
    isPlaying: () => isPlayingRef.current
  };
};