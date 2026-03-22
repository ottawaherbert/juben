import React from 'react';
import { 
  Download, 
  Play, 
  Wand2, 
  Loader2 
} from 'lucide-react';
import { Scene } from '../../types/project';

interface StoryboardHeaderProps {
  activeScene: Scene;
  isGenerating: boolean;
  onPrepareGenerateShots: () => void;
  onPrepareGeneratePrompts: () => void;
  onExportProject: () => void;
  onPlayAnimatics: () => void;
  estimatedSceneDuration: string;
}

export const StoryboardHeader: React.FC<StoryboardHeaderProps> = ({
  activeScene,
  isGenerating,
  onPrepareGenerateShots,
  onPrepareGeneratePrompts,
  onExportProject,
  onPlayAnimatics,
  estimatedSceneDuration,
}) => {
  const totalDuration = activeScene.shots?.reduce((acc, shot) => acc + (shot.duration || 0), 0) || 0;

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          视觉分镜室 (Storyboard)
          {activeScene.shots && activeScene.shots.length > 0 && (
            <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2 py-1 rounded-md border border-neutral-700">
              总时长: {totalDuration}s
              {estimatedSceneDuration ? ` / 预计: ${estimatedSceneDuration}s` : ''}
            </span>
          )}
        </h1>
        <p className="text-neutral-400 text-xs md:text-sm">
          {activeScene.title} | 摄影指导 Agent 4 - 自动提取关键帧与镜头切分
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {activeScene.shots && activeScene.shots.length > 0 && (
          <>
            <button
              onClick={onExportProject}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              导出工程
            </button>
            <button
              onClick={onPlayAnimatics}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              <Play className="w-4 h-4" />
              播放预演
            </button>
          </>
        )}
        <button
          onClick={onPrepareGenerateShots}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          AI 生成分镜
        </button>
        {activeScene.shots && activeScene.shots.length > 0 && (
          <button
            onClick={onPrepareGeneratePrompts}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            AI 生成视觉提示词
          </button>
        )}
      </div>
    </div>
  );
};
