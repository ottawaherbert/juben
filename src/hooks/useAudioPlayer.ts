import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

export function useAudioPlayer(options?: { onEnded?: () => void }) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setState(prev => ({ ...prev, duration: audio.duration }));
      };

      audio.ontimeupdate = () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      };

      audio.onplay = () => {
        setState(prev => ({ ...prev, isPlaying: true }));
      };

      audio.onpause = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };

      audio.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        if (options?.onEnded) {
          options.onEnded();
        }
      };

      audio.onerror = () => {
        setState(prev => ({ ...prev, error: 'Failed to load audio' }));
      };

      await audio.play();
    } catch (err) {
      console.error('Audio play error:', err);
      setState(prev => ({ ...prev, error: 'Playback failed' }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  }, []);

  const toggle = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    play,
    pause,
    stop,
    toggle,
    seek,
  };
}
