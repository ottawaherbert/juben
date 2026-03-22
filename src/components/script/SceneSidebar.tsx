import React from 'react';
import { Episode, Project } from "../../types/project";
import EmotionalPacingMonitor from "../EmotionalPacingMonitor";
import { FileText } from "lucide-react";

interface SceneSidebarProps {
  activeEpisode: Episode;
  activeSceneId: string | null;
  currentProject: Project;
  isAnalyzingPacing: boolean;
  onSelectScene: (id: string) => void;
  onAnalyzePacing: () => void;
}

export const SceneSidebar: React.FC<SceneSidebarProps> = ({
  activeEpisode,
  activeSceneId,
  currentProject,
  isAnalyzingPacing,
  onSelectScene,
  onAnalyzePacing
}) => {
  return (
    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0 md:shrink">
      <div className="p-4 md:p-6 border-b border-neutral-800">
        <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          场景列表
        </h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4">金牌编导 Agent 3</p>
        <div className="hidden md:block">
          <EmotionalPacingMonitor 
            scenes={activeEpisode.scenes} 
            onAnalyze={onAnalyzePacing}
            isAnalyzing={isAnalyzingPacing}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto md:overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 flex md:flex-col gap-2 custom-scrollbar">
        {activeEpisode.scenes.map((scene, index) => (
          <button
            key={scene.id}
            onClick={() => onSelectScene(scene.id)}
            className={`w-48 md:w-full shrink-0 text-left px-4 py-3 rounded-xl transition-colors ${
              activeSceneId === scene.id
                ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-400"
                : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <div className="font-bold text-sm mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {scene.sceneNumber && (
                  <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {scene.sceneNumber}
                  </span>
                )}
                <span className="truncate">{scene.title}</span>
              </div>
              {scene.targetDuration && (
                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 ml-2">
                  {scene.targetDuration}m
                </span>
              )}
            </div>
            <div className="text-xs opacity-70 truncate">
              {scene.description}
            </div>
          </button>
        ))}
        {activeEpisode.scenes.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            请先在节拍大纲添加场景
          </div>
        )}
      </div>
    </div>
  );
};
