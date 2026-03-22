import React from "react";
import { BookOpen, Target, Layers, Zap, Loader2, Wand2 } from "lucide-react";
import { Project } from "../../types/project";

interface CoreConceptProps {
  currentProject: Project;
  updateProject: (updates: Partial<Project>) => void;
  onRegenerateLogline: () => void;
  onRegenerateConflict: () => void;
  onRegenerateArc: () => void;
  isGeneratingLogline: boolean;
  isGeneratingConflict: boolean;
  isGeneratingArc: boolean;
}

export const CoreConcept: React.FC<CoreConceptProps> = ({
  currentProject,
  updateProject,
  onRegenerateLogline,
  onRegenerateConflict,
  onRegenerateArc,
  isGeneratingLogline,
  isGeneratingConflict,
  isGeneratingArc,
}) => {
  return (
    <>
      {/* Logline */}
      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Logline 一句话故事
            </h2>
          </div>
          <button
            onClick={onRegenerateLogline}
            disabled={isGeneratingLogline}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isGeneratingLogline ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            AI 重写
          </button>
        </div>
        <textarea
          value={currentProject.logline || ""}
          onChange={(e) => updateProject({ logline: e.target.value })}
          placeholder="一个[主角]为了[目标]，必须克服[阻碍]..."
          className="w-full h-32 bg-transparent text-lg md:text-xl text-neutral-300 placeholder-neutral-700 focus:outline-none resize-none leading-relaxed font-serif custom-scrollbar"
        />
      </div>

      {/* Core Conflict */}
      <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Core Conflict 核心冲突
            </h2>
          </div>
          <button
            onClick={onRegenerateConflict}
            disabled={isGeneratingConflict}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isGeneratingConflict ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            AI 重写
          </button>
        </div>
        <textarea
          value={currentProject.coreConflict || ""}
          onChange={(e) => updateProject({ coreConflict: e.target.value })}
          placeholder="主角想要什么？什么阻碍了他？"
          className="w-full h-32 bg-transparent text-base text-neutral-300 placeholder-neutral-700 focus:outline-none resize-none leading-relaxed custom-scrollbar"
        />
      </div>

      {/* Story Arc */}
      {currentProject.type === 'tv-series' && (
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Layers className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Season Arc 剧集主线
              </h2>
            </div>
            <button
              onClick={onRegenerateArc}
              disabled={isGeneratingArc}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isGeneratingArc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI 重写
            </button>
          </div>
          <textarea
            value={currentProject.seasonArc || ""}
            onChange={(e) => updateProject({ seasonArc: e.target.value })}
            placeholder="本季的终极目标或核心弧度..."
            className="w-full h-32 bg-transparent text-base text-neutral-300 placeholder-neutral-700 focus:outline-none resize-none leading-relaxed custom-scrollbar"
          />
        </div>
      )}

      {currentProject.type === 'short-drama' && (
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Drama Arcs 爽点/钩子设计
              </h2>
            </div>
            <button
              onClick={onRegenerateArc}
              disabled={isGeneratingArc}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isGeneratingArc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI 重写
            </button>
          </div>
          <textarea
            value={currentProject.seasonArc || ""}
            onChange={(e) => updateProject({ seasonArc: e.target.value })}
            placeholder="描述短剧的宏观结构、付费点、反转逻辑..."
            className="w-full h-32 bg-transparent text-base text-neutral-300 placeholder-neutral-700 focus:outline-none resize-none leading-relaxed custom-scrollbar"
          />
        </div>
      )}
    </>
  );
};
