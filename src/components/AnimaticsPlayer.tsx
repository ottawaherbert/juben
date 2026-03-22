import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, X, SkipBack, SkipForward } from 'lucide-react';
import { Shot, Scene } from '../types/project';

interface AnimaticsPlayerProps {
  scene: Scene;
  onClose: () => void;
}

export default function AnimaticsPlayer({ scene, onClose }: AnimaticsPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const shots = scene.shots || [];

  useEffect(() => {
    if (isPlaying && shots.length > 0) {
      const currentShot = shots[currentShotIndex];
      const duration = (currentShot.duration || 5) * 1000; // default 5 seconds
      
      startTimeRef.current = performance.now();
      
      const updateProgress = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress < 100) {
          timerRef.current = requestAnimationFrame(updateProgress);
        } else {
          // Move to next shot
          if (currentShotIndex < shots.length - 1) {
            setCurrentShotIndex(prev => prev + 1);
            setProgress(0);
          } else {
            setIsPlaying(false);
            setProgress(100);
          }
        }
      };

      timerRef.current = requestAnimationFrame(updateProgress);

      // Handle TTS
      // Find overlapping audio track for this shot
      let currentStartTime = 0;
      for (let i = 0; i < currentShotIndex; i++) {
        currentStartTime += shots[i].duration || 0;
      }
      const shotEndTime = currentStartTime + (currentShot.duration || 0);
      const overlappingAudio = scene.audioTracks?.find(a => 
        a.type === 'dialogue' && a.startTime >= currentStartTime && a.startTime < shotEndTime
      );

      if (overlappingAudio && overlappingAudio.text) {
        const utterance = new SpeechSynthesisUtterance(overlappingAudio.text);
        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const chineseVoice = voices.find(v => v.lang.includes('zh'));
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
        window.speechSynthesis.speak(utterance);
      }

      return () => {
        if (timerRef.current) {
          cancelAnimationFrame(timerRef.current);
        }
        window.speechSynthesis.cancel();
      };
    }
  }, [isPlaying, currentShotIndex, shots]);

  const togglePlay = () => {
    if (!isPlaying && progress === 100) {
      setCurrentShotIndex(0);
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const nextShot = () => {
    if (currentShotIndex < shots.length - 1) {
      setCurrentShotIndex(prev => prev + 1);
      setProgress(0);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  const prevShot = () => {
    if (currentShotIndex > 0) {
      setCurrentShotIndex(prev => prev - 1);
      setProgress(0);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  if (shots.length === 0) {
    return null;
  }

  const currentShot = shots[currentShotIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-neutral-800/50 hover:bg-neutral-700 text-white rounded-full transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-5xl flex flex-col items-center p-6">
        {/* Main Viewer */}
        <div className="w-full aspect-video bg-neutral-900 rounded-3xl overflow-hidden relative shadow-2xl border border-neutral-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentShot.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentShot.imageUrl ? (
                <img
                  src={currentShot.imageUrl}
                  alt="shot preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-neutral-600 font-mono text-2xl">
                  SHOT {currentShotIndex + 1}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Subtitles / Voiceover */}
          {(() => {
            let currentStartTime = 0;
            for (let i = 0; i < currentShotIndex; i++) {
              currentStartTime += shots[i].duration || 0;
            }
            const shotEndTime = currentStartTime + (currentShot.duration || 0);
            const overlappingAudio = scene.audioTracks?.find(a => 
              a.type === 'dialogue' && a.startTime >= currentStartTime && a.startTime < shotEndTime
            );

            if (overlappingAudio && overlappingAudio.text) {
              return (
                <div className="absolute bottom-12 left-0 right-0 flex justify-center px-12">
                  <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl text-white text-lg md:text-xl text-center max-w-3xl shadow-lg border border-white/10">
                    {overlappingAudio.text}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
            <div 
              className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-6">
          <button
            onClick={prevShot}
            disabled={currentShotIndex === 0}
            className="p-3 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>

          <button
            onClick={nextShot}
            disabled={currentShotIndex === shots.length - 1}
            className="p-3 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Shot Info */}
        <div className="mt-8 text-center max-w-2xl">
          <div className="text-emerald-500 font-mono text-sm mb-2">
            SHOT {currentShotIndex + 1} / {shots.length} • {currentShot.duration || 5}s
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {currentShot.imagePrompt}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
