import React from "react";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { Episode } from "../../types/project";

interface StructureHeaderProps {
  activeEpisode: Episode;
  isGenerating: boolean;
  onOpenTemplateModal: () => void;
  onAddScene: () => void;
}

export const StructureHeader: React.FC<StructureHeaderProps> = ({
  activeEpisode,
  isGenerating,
  onOpenTemplateModal,
  onAddScene,
}) => {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
      <div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white mb-2">
          节拍大纲 (Beat Sheet)
        </h1>
        <p className="text-neutral-400 text-sm">
          {activeEpisode.title} | 结构大师 Agent 2 - 价值转换校验
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        <button
          onClick={onOpenTemplateModal}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl font-bold transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {isGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <BookOpen className="w-5 h-5" />
          )}
          选择模板并生成节拍
        </button>
        <button
          onClick={onAddScene}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          添加场景卡片
        </button>
      </div>
    </div>
  );
};
