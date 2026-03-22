import { useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PromptEditorModal from '../components/PromptEditorModal';
import AnimaticsPlayer from '../components/AnimaticsPlayer';
import { SceneSidebar } from "../components/storyboard/SceneSidebar";
import { StoryboardHeader } from "../components/storyboard/StoryboardHeader";
import { ShotCard } from "../components/storyboard/ShotCard";
import { useStoryboardAI } from "../hooks/useStoryboardAI";

export default function Storyboard() {
  const { currentProject, activeEpisodeId, activeEpisode, updateScene } = useProjectStore();
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    activeEpisode?.scenes[0]?.id || null,
  );
  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const [isAnimaticsPlaying, setIsAnimaticsPlaying] = useState(false);
  
  const activeScene = activeEpisode?.scenes.find((s) => s.id === activeSceneId);
  
  const {
    isGenerating,
    promptModalState,
    setPromptModalState,
    handlePrepareGenerateShots,
    handlePrepareGeneratePrompts,
    handleRerollShot,
  } = useStoryboardAI(
    currentProject,
    activeEpisode,
    activeScene,
    updateScene,
    setActiveShotId
  );

  const navigate = useNavigate();

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在起点注入灵感并立项。
      </div>
    );
  }

  if (!activeEpisode) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在“{currentProject.type === "movie" ? "段落" : "分集"}”页面创建并选择一个{currentProject.type === "movie" ? "段落" : "分集"}。
      </div>
    );
  }

  const sceneCount = activeEpisode?.scenes.length || 1;
  const targetDurationMins = activeScene?.targetDuration || (activeEpisode?.targetDuration ? (activeEpisode.targetDuration / sceneCount) : 1);
  const estimatedSceneDuration = (targetDurationMins * 60).toFixed(0); // in seconds

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row h-full overflow-hidden"
    >
      <SceneSidebar 
        scenes={activeEpisode.scenes}
        activeSceneId={activeSceneId}
        onSelectScene={(id) => {
          setActiveSceneId(id);
          const scene = activeEpisode.scenes.find(s => s.id === id);
          setActiveShotId(scene?.shots?.[0]?.id || null);
        }}
        projectType={currentProject.type}
      />

      <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden">
        {activeScene ? (
          <div className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
            <StoryboardHeader 
              activeScene={activeScene}
              isGenerating={isGenerating}
              onPrepareGenerateShots={() => handlePrepareGenerateShots(estimatedSceneDuration, targetDurationMins)}
              onPrepareGeneratePrompts={handlePrepareGeneratePrompts}
              onExportProject={() => toast.success("时间线已导出为 .xml 格式 (演示)")}
              onPlayAnimatics={() => setIsAnimaticsPlaying(true)}
              estimatedSceneDuration={estimatedSceneDuration}
            />

            {activeScene.shots && activeScene.shots.length > 0 ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeScene.shots.map((shot, index) => (
                    <ShotCard 
                      key={shot.id}
                      shot={shot}
                      index={index}
                      activeScene={activeScene}
                      activeEpisodeId={activeEpisode.id}
                      updateScene={updateScene}
                      onReroll={handleRerollShot}
                    />
                  ))}

                  <div className="bg-neutral-900/50 border-2 border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center min-h-[240px] cursor-pointer hover:border-emerald-500/50 hover:bg-neutral-900 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-neutral-500 group-hover:text-emerald-500 transition-colors">
                      添加新镜头
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
                <Camera className="w-12 h-12 mb-4 opacity-20" />
                <p>该场景尚未生成分镜</p>
                <p className="text-sm mt-2">
                  点击右上角「AI 生成分镜」开始切分镜头
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            选择左侧场景开始制作分镜
          </div>
        )}
      </div>

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState(prev => ({ ...prev, isOpen: false }))}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={promptModalState.onConfirm}
      />

      <AnimatePresence>
        {isAnimaticsPlaying && activeScene && (
          <AnimaticsPlayer
            scene={activeScene}
            onClose={() => setIsAnimaticsPlaying(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
