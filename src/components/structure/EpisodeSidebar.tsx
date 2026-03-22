import React from "react";
import { FileText } from "lucide-react";
import { Project, Episode } from "../../types/project";

interface EpisodeSidebarProps {
  currentProject: Project;
  activeEpisodeId: string | null;
  setActiveEpisodeId: (id: string | null) => void;
}

export const EpisodeSidebar: React.FC<EpisodeSidebarProps> = ({
  currentProject,
  activeEpisodeId,
  setActiveEpisodeId,
}) => {
  return (
    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0 md:shrink">
      <div className="p-4 md:p-6 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {currentProject.type === "movie" ? "段落 (Sequences)" : "篇章 / 分集"}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">选择要编辑的区块</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto md:overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 flex md:flex-col gap-2 custom-scrollbar">
        {currentProject.episodes.map((episode) => (
          <div
            key={episode.id}
            onClick={() => setActiveEpisodeId(episode.id)}
            className={`w-48 md:w-full shrink-0 text-left px-4 py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between group ${
              activeEpisodeId === episode.id
                ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-400"
                : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="font-bold text-sm truncate pr-2">
                {episode.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
