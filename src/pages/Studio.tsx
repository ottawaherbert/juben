import React, { useState, useEffect, useRef, useMemo } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { motion } from "motion/react";
import {
  SlidersHorizontal,
  Settings2
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import Timeline from "../components/Timeline";
import GlobalGenerationParamsModal from "../components/GlobalGenerationParamsModal";
import { Asset } from "../types/project";
import { useStudioAI } from "../hooks/useStudioAI";
import { StudioAssetList } from "../components/StudioAssetList";
import { StudioPreview } from "../components/StudioPreview";
import { StudioShotControls } from "../components/StudioShotControls";
import { StudioAudioControls } from "../components/StudioAudioControls";
import { StudioMultiGridControls } from "../components/StudioMultiGridControls";
import PromptEditorModal from "../components/PromptEditorModal";

import { usePlayback } from "../hooks/usePlayback";

export default function Studio() {
  const { currentProject, activeEpisodeId, activeEpisode, updateScene } = useProjectStore();
  const [searchParams] = useSearchParams();
  const urlSceneId = searchParams.get("sceneId");
  const urlShotId = searchParams.get("shotId");

  const initialScene =
    activeEpisode?.scenes.find((s) => s.id === urlSceneId) ||
    activeEpisode?.scenes.find((s) => s.shots && s.shots.length > 0) ||
    activeEpisode?.scenes[0];

  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    urlSceneId || activeEpisode?.scenes[0]?.id || null,
  );
  const [selectedShotId, setSelectedShotId] = useState<string | null>(
    urlShotId || null,
  );
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null);

  const [isMultiGridMode, setIsMultiGridMode] = useState(false);
  const [selectedMultiShotIds, setSelectedMultiShotIds] = useState<string[]>([]);

  const [previewMode, setPreviewMode] = useState<"video" | "image">("video");
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const activeScene = activeEpisode?.scenes.find((s) => s.id === activeSceneId);
  const selectedShot = activeScene?.shots?.find((s) => s.id === selectedShotId);
  const selectedAudioTrack = activeScene?.audioTracks?.find((a) => a.id === selectedAudioTrackId);

  const {
    isGeneratingImage,
    isGeneratingVideo,
    isGeneratingVoice,
    isSynthesizing,
    promptModalState,
    setPromptModalState,
    handlePrepareGenerateImage: aiPrepareGenerateImage,
    handlePrepareGenerateVideo: aiPrepareGenerateVideo,
    handleGenerateVoice: aiGenerateVoice,
    handleSynthesize: aiSynthesize
  } = useStudioAI();

  const handleGenerateImage = () => {
    if (!selectedShot || !activeSceneId || !activeEpisode || !currentProject) return;
    aiPrepareGenerateImage(selectedShot, activeSceneId, activeEpisode, currentProject);
  };

  const handleGenerateVideo = () => {
    if (!selectedShot || !activeSceneId || !activeEpisode || !currentProject) return;
    aiPrepareGenerateVideo(selectedShot, activeSceneId, activeEpisode, currentProject);
  };

  const handleGenerateVoice = async () => {
    if (!selectedAudioTrack || !activeSceneId || !activeEpisode || !currentProject) return;
    await aiGenerateVoice(selectedAudioTrack, activeSceneId, activeEpisode, currentProject);
  };

  const handleSynthesize = async () => {
    if (!activeScene) return;
    await aiSynthesize(activeScene);
  };

  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [localAudioText, setLocalAudioText] = useState("");

  useEffect(() => {
    if (selectedAudioTrack) {
      setLocalAudioText(selectedAudioTrack.text || "");
    }
  }, [selectedAudioTrack]);

  const handleAudioTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalAudioText(e.target.value);
    if (selectedAudioTrack && activeSceneId && activeEpisode) {
      const updatedTracks = activeScene.audioTracks?.map(t => 
        t.id === selectedAudioTrack.id ? { ...t, text: e.target.value } : t
      );
      updateScene(activeSceneId, { audioTracks: updatedTracks }, activeEpisode.id);
    }
  };

  const handleUpdateCharacter = (characterId: string) => {
    if (selectedAudioTrack && activeSceneId && activeEpisode) {
      const updatedTracks = activeScene.audioTracks?.map(t => 
        t.id === selectedAudioTrack.id ? { ...t, characterId } : t
      );
      updateScene(activeSceneId, { audioTracks: updatedTracks }, activeEpisode.id);
    }
  };

  const boundAssets = useMemo(() => {
    if (!selectedShot || !currentProject) return [];
    const assetIds = [
      ...(selectedShot.propIds || []),
      selectedShot.locationId
    ].filter(Boolean) as string[];
    
    const characterIds = selectedShot.characterIdsInShot || [];
    
    return [
      ...currentProject.assets.filter(a => assetIds.includes(a.id)),
      ...currentProject.characters.filter(c => characterIds.includes(c.id))
    ];
  }, [selectedShot, currentProject]);

  // Calculate shot positions and total duration
  const { shotPositions, totalDuration } = useMemo(() => {
    if (!activeScene || !activeScene.shots) return { shotPositions: [], totalDuration: 0 };
    let currentStart = 0;
    const positions = activeScene.shots.map(shot => {
      const start = currentStart;
      const duration = shot.duration || 5;
      currentStart += duration;
      return { ...shot, start, duration };
    });
    return { shotPositions: positions, totalDuration: currentStart };
  }, [activeScene]);

  const {
    isPlaying,
    currentTime,
    toggle: togglePlay,
    setCurrentTime,
    stop: stopPlayback,
  } = usePlayback({
    totalDuration,
    onEnded: () => {
      if (videoRef.current) videoRef.current.pause();
      Object.values(audioRefs.current).forEach(audio => audio && audio.pause());
    }
  });

  // Determine which shot is currently playing based on currentTime
  const playingShot = useMemo(() => {
    if (shotPositions.length === 0) return null;
    return shotPositions.find(s => currentTime >= s.start && currentTime < s.start + s.duration) || shotPositions[shotPositions.length - 1];
  }, [currentTime, shotPositions]);

  useEffect(() => {
    if (urlSceneId) setActiveSceneId(urlSceneId);
    if (urlShotId) setSelectedShotId(urlShotId);
  }, [urlSceneId, urlShotId]);

  useEffect(() => {
    if (!videoRef.current || !playingShot) return;
    
    const localTime = currentTime - (playingShot as any).start;
    
    if (videoRef.current.src !== playingShot.videoUrl && playingShot.videoUrl) {
      videoRef.current.src = playingShot.videoUrl;
    }
    
    if (playingShot.videoUrl) {
      if (Math.abs(videoRef.current.currentTime - localTime) > 0.5) {
        videoRef.current.currentTime = localTime;
      }
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error("Video play error:", e));
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }

    if (activeScene?.audioTracks) {
      activeScene.audioTracks.forEach(track => {
        const audioEl = audioRefs.current[track.id];
        if (!audioEl || !track.url) return;

        const trackLocalTime = currentTime - track.startTime;
        const isWithinTrack = currentTime >= track.startTime && currentTime < track.startTime + (track.duration || 5);

        if (isWithinTrack) {
          if (Math.abs(audioEl.currentTime - trackLocalTime) > 0.5) {
            audioEl.currentTime = trackLocalTime;
          }
          if (isPlaying && audioEl.paused) {
            audioEl.play().catch(e => console.error("Audio play error:", e));
          } else if (!isPlaying && !audioEl.paused) {
            audioEl.pause();
          }
        } else {
          if (!audioEl.paused) {
            audioEl.pause();
          }
        }
      });
    }
  }, [currentTime, playingShot, isPlaying, activeScene?.audioTracks]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  if (!currentProject || !activeEpisode || !activeScene) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在起点注入灵感并选择一个{currentProject?.type === "movie" ? "段落" : "分集"}。
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Top Half */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Column: Media Pool */}
        <StudioAssetList
          shotPositions={shotPositions}
          audioTracks={activeScene?.audioTracks}
          selectedShotId={selectedShotId}
          selectedAudioTrackId={selectedAudioTrackId}
          onSelectShot={(id, start) => {
            setSelectedShotId(id);
            setCurrentTime(start);
          }}
          onSelectAudioTrack={(id, start) => {
            setSelectedAudioTrackId(id);
            setCurrentTime(start);
          }}
          isMultiGridMode={isMultiGridMode}
          onToggleMultiGridMode={() => {
            setIsMultiGridMode(!isMultiGridMode);
            if (!isMultiGridMode && selectedShotId) {
              setSelectedMultiShotIds([selectedShotId]);
            }
          }}
          selectedMultiShotIds={selectedMultiShotIds}
          onToggleMultiShot={(id) => {
            setSelectedMultiShotIds(prev => 
              prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
            );
          }}
          onSelectAllShots={() => setSelectedMultiShotIds(shotPositions.map(s => s.id))}
          onClearAllShots={() => setSelectedMultiShotIds([])}
        />

        {/* Center Column: Viewer */}
        <StudioPreview
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          isMuted={isMuted}
          playingShot={playingShot}
          audioTracks={activeScene?.audioTracks}
          videoRef={videoRef}
          audioRefs={audioRefs}
          onSynthesize={handleSynthesize}
          isSynthesizing={isSynthesizing}
        />

        {/* Right Column: Inspector */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-500 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              检查器 (Inspector)
            </h2>
            <button
              onClick={() => setIsParamsModalOpen(true)}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors"
              title="全局生成参数"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {isMultiGridMode ? (
              <StudioMultiGridControls
                selectedShots={activeScene.shots?.filter(s => selectedMultiShotIds.includes(s.id)) || []}
                activeScene={activeScene}
                currentProject={currentProject}
                activeEpisodeId={activeEpisode.id}
                onUpdateGlobalParams={(params) => {
                  useProjectStore.getState().updateProject({
                    globalGenerationParams: {
                      ...currentProject.globalGenerationParams,
                      ...params
                    }
                  });
                }}
              />
            ) : selectedShot ? (
              <StudioShotControls
                selectedShot={selectedShot}
                currentProject={currentProject}
                boundAssets={boundAssets}
                isGeneratingImage={isGeneratingImage}
                isGeneratingVideo={isGeneratingVideo}
                onGenerateImage={handleGenerateImage}
                onGenerateVideo={handleGenerateVideo}
                onUpdateGlobalParams={(params) => {
                  useProjectStore.getState().updateProject({
                    globalGenerationParams: {
                      ...currentProject.globalGenerationParams,
                      ...params
                    }
                  });
                }}
              />
            ) : selectedAudioTrack ? (
              <StudioAudioControls
                selectedAudioTrack={selectedAudioTrack}
                localAudioText={localAudioText}
                onAudioTextChange={handleAudioTextChange}
                currentProject={currentProject}
                isGeneratingVoice={isGeneratingVoice}
                onGenerateVoice={handleGenerateVoice}
                onUpdateCharacter={handleUpdateCharacter}
              />
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings2 className="w-6 h-6" />
                </div>
                <p className="text-sm">选择一个镜头或音频轨道进行编辑</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Half: Timeline */}
      <div className="h-64 shrink-0 border-t border-neutral-800 bg-neutral-950">
        <Timeline
          scene={activeScene}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          onTogglePlay={togglePlay}
          onUpdateScene={(updates) => {
            updateScene(activeSceneId, updates, activeEpisode.id);
          }}
          activeShotId={selectedShotId}
          onSelectShot={(id) => {
            setSelectedShotId(id);
            setSelectedAudioTrackId(null);
          }}
          activeAudioTrackId={selectedAudioTrackId}
          onSelectAudioTrack={(id) => {
            setSelectedAudioTrackId(id);
            setSelectedShotId(null);
          }}
        />
      </div>

      <GlobalGenerationParamsModal
        isOpen={isParamsModalOpen}
        onClose={() => setIsParamsModalOpen(false)}
      />

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState(prev => ({ ...prev, isOpen: false }))}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={promptModalState.onConfirm}
      />
    </motion.div>
  );
}
