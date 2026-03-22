import React, { useRef, useState, useMemo } from 'react';
import { Scene, Shot, AudioTrack } from '../types/project';
import { Play, Pause, Scissors, Plus, Volume2, Image as ImageIcon, Video, Mic, Music, Trash2 } from 'lucide-react';

interface TimelineProps {
  scene: Scene;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onUpdateScene: (updates: Partial<Scene>) => void;
  activeShotId: string | null;
  onSelectShot: (shotId: string | null) => void;
  activeAudioTrackId: string | null;
  onSelectAudioTrack: (trackId: string | null) => void;
}

export default function Timeline({
  scene,
  currentTime,
  isPlaying,
  onSeek,
  onTogglePlay,
  onUpdateScene,
  activeShotId,
  onSelectShot,
  activeAudioTrackId,
  onSelectAudioTrack
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [trimmingShotId, setTrimmingShotId] = useState<string | null>(null);
  const [trimEdge, setTrimEdge] = useState<'left' | 'right' | null>(null);
  const [trimmingAudioId, setTrimmingAudioId] = useState<string | null>(null);
  const [audioTrimEdge, setAudioTrimEdge] = useState<'left' | 'right' | null>(null);

  const shots = scene.shots || [];
  const audioTracks = scene.audioTracks || [];

  const totalDuration = useMemo(() => {
    return shots.reduce((acc, shot) => acc + (shot.duration || 5), 0);
  }, [shots]);

  // Ensure minimum duration for timeline rendering
  const displayDuration = Math.max(totalDuration, 10);
  const pixelsPerSecond = 50;

  // Calculate shot positions
  const shotPositions = useMemo(() => {
    let currentStart = 0;
    return shots.map(shot => {
      const start = currentStart;
      const duration = shot.duration || 5;
      currentStart += duration;
      return { ...shot, start, duration };
    });
  }, [shots]);

  const snapPoints = useMemo(() => {
    const points: number[] = [];
    // Shot boundaries
    shotPositions.forEach(sp => {
      points.push(sp.start);
      points.push(sp.start + sp.duration);
    });
    // Audio tracks boundaries
    audioTracks.forEach(t => {
      if (t.id !== draggingTrackId && t.id !== trimmingAudioId) {
        points.push(t.startTime);
        points.push(t.startTime + (t.duration || 5));
      }
    });
    return Array.from(new Set(points)).sort((a, b) => a - b);
  }, [shotPositions, audioTracks, draggingTrackId, trimmingAudioId]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || draggingTrackId || trimmingShotId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(x / pixelsPerSecond, displayDuration));
    onSeek(newTime);
  };

  const handleTrackDragStart = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    setDraggingTrackId(trackId);
    onSelectAudioTrack(trackId);
  };

  const handleShotTrimStart = (e: React.MouseEvent, shotId: string, edge: 'left' | 'right') => {
    e.stopPropagation();
    setTrimmingShotId(shotId);
    setTrimEdge(edge);
    onSelectShot(shotId);
  };

  const handleAudioTrimStart = (e: React.MouseEvent, trackId: string, edge: 'left' | 'right') => {
    e.stopPropagation();
    setTrimmingAudioId(trackId);
    setAudioTrimEdge(edge);
    onSelectAudioTrack(trackId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    let timeAtCursor = Math.max(0, x / pixelsPerSecond);

    // Snap logic
    const SNAP_THRESHOLD = 0.3; // seconds
    if (e.shiftKey === false) { // Hold shift to disable snapping
      for (const point of snapPoints) {
        if (Math.abs(timeAtCursor - point) < SNAP_THRESHOLD) {
          timeAtCursor = point;
          break;
        }
      }
    }

    if (draggingTrackId) {
      const track = audioTracks.find(t => t.id === draggingTrackId);
      if (track) {
        onUpdateScene({
          audioTracks: audioTracks.map(a => a.id === track.id ? { ...a, startTime: timeAtCursor, shotId: undefined } : a)
        });
      }
    } else if (trimmingShotId && trimEdge) {
      const shotIndex = shots.findIndex(s => s.id === trimmingShotId);
      if (shotIndex === -1) return;
      
      const shot = shots[shotIndex];
      const shotStart = shotPositions[shotIndex].start;
      
      if (trimEdge === 'right') {
        const newDuration = Math.max(1, timeAtCursor - shotStart);
        // Default Ripple Edit: just change duration, subsequent shots shift
        // If holding Alt, do Roll Edit (change duration of this and next shot)
        if (e.altKey && shotIndex < shots.length - 1) {
          const nextShot = shots[shotIndex + 1];
          const totalDuration = shot.duration + (nextShot.duration || 5);
          const newNextDuration = Math.max(1, totalDuration - newDuration);
          const finalNewDuration = totalDuration - newNextDuration;
          
          const newShots = shots.map((s, i) => {
            if (i === shotIndex) return { ...s, duration: finalNewDuration };
            if (i === shotIndex + 1) return { ...s, duration: newNextDuration };
            return s;
          });
          
          // Calculate new shot positions to sync audio tracks
          let currentStart = 0;
          const newShotPositions = newShots.map(s => {
            const start = currentStart;
            currentStart += (s.duration || 5);
            return { id: s.id, start };
          });
          
          onUpdateScene({
            shots: newShots,
            audioTracks: audioTracks.map(t => {
              if (t.shotId) {
                const linkedShot = newShotPositions.find(s => s.id === t.shotId);
                if (linkedShot) {
                  return { ...t, startTime: linkedShot.start };
                }
              }
              return t;
            })
          });
        } else {
          const newShots = shots.map(s => s.id === shot.id ? { ...s, duration: newDuration } : s);
          
          let currentStart = 0;
          const newShotPositions = newShots.map(s => {
            const start = currentStart;
            currentStart += (s.duration || 5);
            return { id: s.id, start };
          });
          
          onUpdateScene({
            shots: newShots,
            audioTracks: audioTracks.map(t => {
              if (t.shotId) {
                const linkedShot = newShotPositions.find(s => s.id === t.shotId);
                if (linkedShot) {
                  return { ...t, startTime: linkedShot.start };
                }
              }
              return t;
            })
          });
        }
      } else if (trimEdge === 'left') {
        if (shotIndex === 0) {
          const newCurrentDuration = Math.max(1, (shotStart + (shot.duration || 5)) - timeAtCursor);
          const newShots = shots.map((s, i) => {
            if (i === shotIndex) return { ...s, duration: newCurrentDuration };
            return s;
          });
          
          let currentStart = 0;
          const newShotPositions = newShots.map(s => {
            const start = currentStart;
            currentStart += (s.duration || 5);
            return { id: s.id, start };
          });
          
          onUpdateScene({
            shots: newShots,
            audioTracks: audioTracks.map(t => {
              if (t.shotId) {
                const linkedShot = newShotPositions.find(s => s.id === t.shotId);
                if (linkedShot) {
                  return { ...t, startTime: linkedShot.start };
                }
              }
              return t;
            })
          });
        } else {
          const prevShot = shots[shotIndex - 1];
          const prevShotStart = shotPositions[shotIndex - 1].start;
          
          const newPrevDuration = Math.max(1, timeAtCursor - prevShotStart);
          const newCurrentDuration = Math.max(1, (shotStart + (shot.duration || 5)) - timeAtCursor);
          
          // Default Roll Edit for left edge
          const newShots = shots.map((s, i) => {
            if (i === shotIndex - 1) return { ...s, duration: newPrevDuration };
            if (i === shotIndex) return { ...s, duration: newCurrentDuration };
            return s;
          });
          
          let currentStart = 0;
          const newShotPositions = newShots.map(s => {
            const start = currentStart;
            currentStart += (s.duration || 5);
            return { id: s.id, start };
          });
          
          onUpdateScene({
            shots: newShots,
            audioTracks: audioTracks.map(t => {
              if (t.shotId) {
                const linkedShot = newShotPositions.find(s => s.id === t.shotId);
                if (linkedShot) {
                  return { ...t, startTime: linkedShot.start };
                }
              }
              return t;
            })
          });
        }
      }
    } else if (trimmingAudioId && audioTrimEdge) {
      const track = audioTracks.find(t => t.id === trimmingAudioId);
      if (track) {
        if (audioTrimEdge === 'right') {
          const newDuration = Math.max(0.5, timeAtCursor - track.startTime);
          onUpdateScene({
            audioTracks: audioTracks.map(t => t.id === track.id ? { ...t, duration: newDuration } : t)
          });
        } else if (audioTrimEdge === 'left') {
          const endTime = track.startTime + (track.duration || 5);
          const newStartTime = Math.min(timeAtCursor, endTime - 0.5);
          const newDuration = endTime - newStartTime;
          onUpdateScene({
            audioTracks: audioTracks.map(t => t.id === track.id ? { ...t, startTime: newStartTime, duration: newDuration } : t)
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingTrackId(null);
    setTrimmingShotId(null);
    setTrimEdge(null);
    setTrimmingAudioId(null);
    setAudioTrimEdge(null);
  };

  const activeShot = shotPositions.find(s => s.id === activeShotId);

  return (
    <div 
      className="h-64 bg-neutral-950 border-t border-neutral-800 flex flex-col select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="text-xs font-mono text-emerald-500 w-24">
            {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </span>
        </div>
        <div className="flex items-center gap-4">
          {activeShot && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">转场:</span>
              <select
                value={activeShot.transition || 'none'}
                onChange={(e) => onUpdateScene({
                  shots: shots.map(s => s.id === activeShot.id ? { ...s, transition: e.target.value as any } : s)
                })}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded px-2 py-1 outline-none focus:border-emerald-500"
              >
                <option value="none">无</option>
                <option value="fade">淡入淡出</option>
                <option value="black">黑场过渡</option>
              </select>
            </div>
          )}
          <div className="h-4 w-px bg-neutral-700 mx-2"></div>
          <button 
            onClick={() => {
              const newShot: Shot = {
                id: `shot-${Date.now()}`,
                imagePrompt: '',
                videoPrompt: '',
                duration: 5,
              };
              onUpdateScene({ shots: [...shots, newShot] });
              onSelectShot(newShot.id);
            }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-800 rounded text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            镜头
          </button>
          <button 
            onClick={() => {
              const newTrack: AudioTrack = {
                id: `audio-${Date.now()}`,
                type: 'dialogue',
                url: '',
                startTime: currentTime,
                duration: 5,
                text: '',
              };
              onUpdateScene({ audioTracks: [...audioTracks, newTrack] });
              onSelectAudioTrack(newTrack.id);
            }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-800 rounded text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            配音
          </button>
          <button 
            onClick={() => {
              const newTrack: AudioTrack = {
                id: `audio-${Date.now()}`,
                type: 'bgm',
                url: '',
                startTime: currentTime,
                duration: 10,
              };
              onUpdateScene({ audioTracks: [...audioTracks, newTrack] });
              onSelectAudioTrack(newTrack.id);
            }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-800 rounded text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            BGM
          </button>
          <button 
            onClick={() => {
              const newTrack: AudioTrack = {
                id: `audio-${Date.now()}`,
                type: 'sfx',
                url: '',
                startTime: currentTime,
                duration: 2,
              };
              onUpdateScene({ audioTracks: [...audioTracks, newTrack] });
              onSelectAudioTrack(newTrack.id);
            }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-800 rounded text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            音效
          </button>
          <div className="h-4 w-px bg-neutral-700 mx-2"></div>
          <button 
            onClick={() => {
              if (activeShotId) {
                // Split shot logic
                const shotIndex = shots.findIndex(s => s.id === activeShotId);
                if (shotIndex === -1) return;
                const shot = shots[shotIndex];
                const shotStart = shotPositions[shotIndex].start;
                if (currentTime > shotStart && currentTime < shotStart + (shot.duration || 5)) {
                  const duration1 = currentTime - shotStart;
                  const duration2 = (shot.duration || 5) - duration1;
                  const newShot1 = { ...shot, duration: duration1 };
                  const newShot2 = { ...shot, id: `shot-${Date.now()}`, duration: duration2 };
                  const newShots = [...shots];
                  newShots.splice(shotIndex, 1, newShot1, newShot2);
                  
                  let currentStart = 0;
                  const newShotPositions = newShots.map(s => {
                    const start = currentStart;
                    currentStart += (s.duration || 5);
                    return { id: s.id, start };
                  });
                  
                  onUpdateScene({ 
                    shots: newShots,
                    audioTracks: audioTracks.map(t => {
                      if (t.shotId) {
                        const linkedShot = newShotPositions.find(s => s.id === t.shotId);
                        if (linkedShot) {
                          return { ...t, startTime: linkedShot.start };
                        }
                      }
                      return t;
                    })
                  });
                }
              } else if (activeAudioTrackId) {
                // Split audio track logic
                const trackIndex = audioTracks.findIndex(t => t.id === activeAudioTrackId);
                if (trackIndex === -1) return;
                const track = audioTracks[trackIndex];
                if (currentTime > track.startTime && currentTime < track.startTime + (track.duration || 5)) {
                  const duration1 = currentTime - track.startTime;
                  const duration2 = (track.duration || 5) - duration1;
                  const newTrack1 = { ...track, duration: duration1 };
                  const newTrack2 = { ...track, id: `audio-${Date.now()}`, startTime: currentTime, duration: duration2 };
                  const newTracks = [...audioTracks];
                  newTracks.splice(trackIndex, 1, newTrack1, newTrack2);
                  onUpdateScene({ audioTracks: newTracks });
                }
              }
            }}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors disabled:opacity-50" 
            title="分割 (Split)"
            disabled={!activeShotId && !activeAudioTrackId}
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              if (activeShotId) {
                onUpdateScene({ 
                  shots: shots.filter(s => s.id !== activeShotId),
                  audioTracks: audioTracks.filter(t => t.shotId !== activeShotId)
                });
                onSelectShot(null);
              } else if (activeAudioTrackId) {
                onUpdateScene({ audioTracks: audioTracks.filter(t => t.id !== activeAudioTrackId) });
                onSelectAudioTrack(null);
              }
            }}
            className="p-2 hover:bg-red-900/50 rounded-lg text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50" 
            title="删除 (Delete)"
            disabled={!activeShotId && !activeAudioTrackId}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracks Container */}
      <div 
        className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative"
        ref={containerRef}
        onClick={handleTimelineClick}
      >
        <div 
          className="relative min-w-full"
          style={{ width: `${Math.max(displayDuration * pixelsPerSecond, 800)}px`, height: '100%' }}
        >
          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-50 pointer-events-none"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="absolute -top-0 -left-1.5 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>

          {/* Time Ruler */}
          <div className="h-6 border-b border-neutral-800 relative bg-neutral-900/50 sticky top-0 z-40">
            {Array.from({ length: Math.ceil(displayDuration) + 1 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-0 bottom-0 border-l border-neutral-700"
                style={{ left: `${i * pixelsPerSecond}px` }}
              >
                <span className="text-[10px] text-neutral-500 ml-1">{i}s</span>
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div className="py-2 space-y-1">
            {/* Video Track (V1) */}
            <div className="flex relative h-16 bg-neutral-900/30 border-y border-neutral-800/50 group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-neutral-900 border-r border-neutral-800 z-30 flex items-center justify-center sticky left-0">
                <span className="text-[10px] font-bold text-blue-500">V1</span>
              </div>
              <div className="ml-16 relative w-full h-full">
                {shotPositions.map((shot, index) => (
                  <div
                    key={shot.id}
                    className={`absolute top-1 bottom-1 rounded-md overflow-hidden transition-colors ${
                      activeShotId === shot.id 
                        ? 'bg-blue-500/30 border-2 border-blue-400 z-10' 
                        : 'bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30'
                    }`}
                    style={{
                      left: `${shot.start * pixelsPerSecond}px`,
                      width: `${shot.duration * pixelsPerSecond}px`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShot(shot.id);
                    }}
                  >
                    {shot.imageUrl && (
                      <img src={shot.imageUrl} alt="" className="h-full w-full object-cover opacity-50 pointer-events-none" />
                    )}
                    <div className="absolute inset-0 p-1 flex flex-col justify-between pointer-events-none">
                      <div className="text-[10px] text-blue-300 font-bold drop-shadow-md">
                        S{index + 1}
                      </div>
                      <div className="flex gap-1">
                        {shot.videoUrl ? <Video className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white/50" />}
                      </div>
                    </div>
                    {/* Trim Handles */}
                    {activeShotId === shot.id && (
                      <>
                        {index > 0 && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400 cursor-col-resize hover:bg-blue-300 z-20"
                            onMouseDown={(e) => handleShotTrimStart(e, shot.id, 'left')}
                          />
                        )}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-2 bg-blue-400 cursor-col-resize hover:bg-blue-300 z-20"
                          onMouseDown={(e) => handleShotTrimStart(e, shot.id, 'right')}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track 1 (Dialogue) */}
            <div className="flex relative h-12 bg-neutral-900/30 border-y border-neutral-800/50 group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-neutral-900 border-r border-neutral-800 z-30 flex items-center justify-center sticky left-0">
                <span className="text-[10px] font-bold text-emerald-500">A1 (配音)</span>
              </div>
              <div className="ml-16 relative w-full h-full">
                {audioTracks.filter(t => t.type === 'dialogue').map(track => (
                  <div
                    key={track.id}
                    className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-ew-resize transition-colors ${
                      activeAudioTrackId === track.id
                        ? 'bg-emerald-500/40 border-2 border-emerald-400 z-10'
                        : 'bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                    style={{
                      left: `${track.startTime * pixelsPerSecond}px`,
                      width: `${(track.duration || 5) * pixelsPerSecond}px`
                    }}
                    onMouseDown={(e) => handleTrackDragStart(e, track.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAudioTrack(track.id);
                    }}
                  >
                    <div className="absolute inset-0 p-1 flex items-center gap-1 text-[10px] text-emerald-300 truncate pointer-events-none">
                      <Mic className="w-3 h-3 shrink-0" />
                      <span className="truncate">{track.text || '空台词'}</span>
                    </div>
                    {/* Trim Handles */}
                    {activeAudioTrackId === track.id && (
                      <>
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-400 cursor-col-resize hover:bg-emerald-300 z-20"
                          onMouseDown={(e) => handleAudioTrimStart(e, track.id, 'left')}
                        />
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-2 bg-emerald-400 cursor-col-resize hover:bg-emerald-300 z-20"
                          onMouseDown={(e) => handleAudioTrimStart(e, track.id, 'right')}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track 2 (BGM) */}
            <div className="flex relative h-10 bg-neutral-900/30 border-y border-neutral-800/50 group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-neutral-900 border-r border-neutral-800 z-30 flex items-center justify-center sticky left-0">
                <span className="text-[10px] font-bold text-purple-500">A2 (BGM)</span>
              </div>
              <div className="ml-16 relative w-full h-full">
                {audioTracks.filter(t => t.type === 'bgm').map(track => (
                  <div
                    key={track.id}
                    className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-ew-resize transition-colors ${
                      activeAudioTrackId === track.id
                        ? 'bg-purple-500/40 border-2 border-purple-400 z-10'
                        : 'bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30'
                    }`}
                    style={{
                      left: `${track.startTime * pixelsPerSecond}px`,
                      width: `${(track.duration || 10) * pixelsPerSecond}px`
                    }}
                    onMouseDown={(e) => handleTrackDragStart(e, track.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAudioTrack(track.id);
                    }}
                  >
                    <div className="absolute inset-0 p-1 flex items-center gap-1 text-[10px] text-purple-300 truncate pointer-events-none">
                      <Music className="w-3 h-3 shrink-0" />
                      <span>背景音乐</span>
                    </div>
                    {/* Trim Handles */}
                    {activeAudioTrackId === track.id && (
                      <>
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-2 bg-purple-400 cursor-col-resize hover:bg-purple-300 z-20"
                          onMouseDown={(e) => handleAudioTrimStart(e, track.id, 'left')}
                        />
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-2 bg-purple-400 cursor-col-resize hover:bg-purple-300 z-20"
                          onMouseDown={(e) => handleAudioTrimStart(e, track.id, 'right')}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track 3 (SFX) */}
            <div className="flex relative h-10 bg-neutral-900/30 border-y border-neutral-800/50 group">
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-neutral-900 border-r border-neutral-800 z-30 flex items-center justify-center sticky left-0">
                <span className="text-[10px] font-bold text-amber-500">A3 (音效)</span>
              </div>
              <div className="ml-16 relative w-full h-full">
                {audioTracks.filter(t => t.type === 'sfx').map(track => (
                  <div
                    key={track.id}
                    className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-ew-resize transition-colors ${
                      activeAudioTrackId === track.id
                        ? 'bg-amber-500/40 border-2 border-amber-400 z-10'
                        : 'bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                    style={{
                      left: `${track.startTime * pixelsPerSecond}px`,
                      width: `${(track.duration || 2) * pixelsPerSecond}px`
                    }}
                    onMouseDown={(e) => handleTrackDragStart(e, track.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAudioTrack(track.id);
                    }}
                  >
                    <div className="absolute inset-0 p-1 flex items-center gap-1 text-[10px] text-amber-300 truncate pointer-events-none">
                      <Volume2 className="w-3 h-3 shrink-0" />
                      <span>音效</span>
                    </div>
                    {/* Trim Handles */}
                    {activeAudioTrackId === track.id && (
                      <>
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-2 bg-amber-400 cursor-col-resize hover:bg-amber-300 z-20"
                          onMouseDown={(e) => handleAudioTrimStart(e, track.id, 'left')}
                        />
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-2 bg-amber-400 cursor-col-resize hover:bg-amber-300 z-20"
                          onMouseDown={(e) => handleAudioTrimStart(e, track.id, 'right')}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
