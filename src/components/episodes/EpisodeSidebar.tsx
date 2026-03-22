import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, FileText, Trash2, Loader2 } from "lucide-react";
import { Episode, Project } from "../../types/project";

interface EpisodeSidebarProps {
  currentProject: Project;
  activeEpisodeId: string | null;
  onSelectEpisode: (id: string) => void;
  onAddEpisode: () => void;
  onDeleteEpisode: (e: React.MouseEvent, id: string) => void;
  onOpenGenerateModal: () => void;
  isGenerating?: boolean;
}

export const EpisodeSidebar: React.FC<EpisodeSidebarProps> = ({
  currentProject,
  activeEpisodeId,
  onSelectEpisode,
  onAddEpisode,
  onDeleteEpisode,
  onOpenGenerateModal,
  isGenerating = false
}) => {
  const isMovie = currentProject.type === 'movie';

  return (
    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0 md:shrink">
      <div className="p-4 md:p-6 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isMovie ? "剧本结构" : "分集管理"}
          </h2>
          <button
            onClick={onAddEpisode}
            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
            title={`添加${isMovie ? "段落" : "集"}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={onOpenGenerateModal}
          disabled={isGenerating}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          AI 智能划分{isMovie ? "结构" : "分集"}
        </button>
      </div>

      <Droppable droppableId="episodes">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex-1 overflow-y-auto md:overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 flex md:flex-col gap-2 custom-scrollbar"
          >
            {currentProject.episodes.map((episode, index) => (
              <Draggable key={episode.id} draggableId={episode.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`w-64 md:w-full shrink-0 group relative ${snapshot.isDragging ? 'z-50' : ''}`}
                  >
                    <button
                      onClick={() => onSelectEpisode(episode.id)}
                      className={`w-full text-left px-4 py-4 rounded-2xl transition-all border ${
                        activeEpisodeId === episode.id
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/5"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          {...provided.dragHandleProps}
                          className="p-1 hover:bg-neutral-800 rounded cursor-grab active:cursor-grabbing text-neutral-600 group-hover:text-neutral-400 transition-colors"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm mb-1 truncate flex items-center gap-2">
                            <span className="text-[10px] font-mono opacity-50">
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                            {episode.title}
                          </div>
                          <div className="text-xs opacity-60 truncate">
                            {episode.sceneCount || 0} 个场景 · {episode.inspiration || "暂无灵感"}
                          </div>
                        </div>
                        <button
                          onClick={(e) => onDeleteEpisode(e, episode.id)}
                          className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {currentProject.episodes.length === 0 && (
              <div className="text-center py-12 text-neutral-600">
                <div className="w-12 h-12 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm">暂无内容，点击上方按钮开始</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};
