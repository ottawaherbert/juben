import React from 'react';
import { Episode, Project } from "../../types/project";
import { Edit3, Wand2 } from "lucide-react";

interface EpisodeDetailEditorProps {
  activeEpisode: Episode;
  currentProject: Project;
  onUpdateEpisode: (id: string, updates: Partial<Episode>) => void;
  onRegenerateEpisode: () => void;
}

export const EpisodeDetailEditor: React.FC<EpisodeDetailEditorProps> = ({
  activeEpisode,
  currentProject,
  onUpdateEpisode,
  onRegenerateEpisode,
}) => {
  const isMovie = currentProject.type === 'movie';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-8 custom-scrollbar">
      <div className="flex-1 flex flex-col space-y-6">
        {/* Episode Header */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl flex-1 flex flex-col">
          <div className="flex flex-col gap-6 flex-1">
            <div className="space-y-4 flex flex-col flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5 text-emerald-500" />
                </div>
                <input
                  type="text"
                  value={activeEpisode.title}
                  onChange={(e) => onUpdateEpisode(activeEpisode.id, { title: e.target.value })}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-2xl font-bold text-white placeholder-neutral-700"
                  placeholder={`${isMovie ? "段落" : "集"}标题`}
                />
              </div>
              <div className="relative flex-1 flex flex-col">
                <textarea
                  value={activeEpisode.inspiration}
                  onChange={(e) => onUpdateEpisode(activeEpisode.id, { inspiration: e.target.value })}
                  className="w-full flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-5 text-neutral-300 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none text-lg leading-relaxed"
                  placeholder={`输入本${isMovie ? "段落" : "集"}的核心灵感、冲突或目标...`}
                />
                <button
                  onClick={onRegenerateEpisode}
                  className="absolute right-4 bottom-4 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20 group"
                  title="AI 智能重写"
                >
                  <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-bold">AI 重写</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
