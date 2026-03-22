import { useProjectStore } from "../store/useProjectStore";
import { Scene } from "../types/project";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useState } from "react";
import TemplateModal from "../components/TemplateModal";
import PromptEditorModal from "../components/PromptEditorModal";
import EmotionalPacingMonitor from "../components/EmotionalPacingMonitor";
import StoryGrid from "../components/StoryGrid";
import { getProjectTypeLabel } from "../utils/projectUtils";
import { useStructureAI } from "../hooks/useStructureAI";
import { EpisodeSidebar } from "../components/structure/EpisodeSidebar";
import { StructureHeader } from "../components/structure/StructureHeader";
import { SceneCard } from "../components/structure/SceneCard";

import { useDragAndDrop } from "../hooks/useDragAndDrop";

export default function Structure() {
  const { 
    currentProject, 
    activeEpisodeId, 
    activeEpisode, 
    updateScene, 
    updateEpisode, 
    setActiveEpisodeId,
    reorderScenes 
  } = useProjectStore();
  
  const projectTypeName = currentProject ? getProjectTypeLabel(currentProject.type) : '';
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null);

  const {
    isGenerating,
    generatedOptions,
    setGeneratedOptions,
    promptModalState,
    setPromptModalState,
    handlePrepareGenerate,
    handleSelectOption,
    handleRegenerateScene,
  } = useStructureAI(
    currentProject,
    activeEpisode,
    updateEpisode,
    updateScene
  );

  const { handleDragEnd } = useDragAndDrop({
    onReorder: (sourceIndex, destinationIndex) => {
      if (activeEpisode) {
        reorderScenes(activeEpisode.id, sourceIndex, destinationIndex);
      }
    }
  });

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

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      title: `场景 ${activeEpisode.scenes.length + 1}`,
      description: "",
      valueCharge: "neutral",
    };
    const newScenes = [...activeEpisode.scenes, newScene];
    updateEpisode(activeEpisode.id, { scenes: newScenes });
  };

  const handleDeleteScene = (sceneId: string) => {
    const newScenes = activeEpisode.scenes.filter((s) => s.id !== sceneId);
    updateEpisode(activeEpisode.id, { scenes: newScenes });
    setDeletingSceneId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row h-full overflow-hidden"
    >
      <EpisodeSidebar 
        currentProject={currentProject}
        activeEpisodeId={activeEpisodeId}
        setActiveEpisodeId={setActiveEpisodeId}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex flex-col h-full overflow-hidden p-6 md:p-12">
          <StructureHeader 
            activeEpisode={activeEpisode}
            isGenerating={isGenerating}
            onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            onAddScene={handleAddScene}
          />

          {currentProject.type === 'short-drama' && (
            <EmotionalPacingMonitor scenes={activeEpisode.scenes} />
          )}

          {currentProject.type === 'tv-series' && (
            <StoryGrid />
          )}

          <Droppable droppableId="scenes-list" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-1 overflow-y-auto pb-8 custom-scrollbar"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {activeEpisode.scenes.map((scene, index) => (
                    <SceneCard 
                      key={scene.id}
                      scene={scene}
                      index={index}
                      activeEpisodeId={activeEpisode.id}
                      isGenerating={isGenerating}
                      onUpdateScene={updateScene}
                      onRegenerateScene={(s) => handleRegenerateScene(s, projectTypeName)}
                      onDeleteScene={setDeletingSceneId}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={(templateId) => {
          setIsTemplateModalOpen(false);
          handlePrepareGenerate(templateId, projectTypeName);
        }}
        setPromptModalState={setPromptModalState}
      />

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState(prev => ({ ...prev, isOpen: false }))}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={promptModalState.onConfirm}
        contextOptions={promptModalState.contextOptions}
        defaultSelectedContextIds={promptModalState.defaultSelectedContextIds}
      />

      <AnimatePresence>
        {generatedOptions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">选择生成的节拍方案</h2>
                  <p className="text-neutral-400 text-sm mt-1">AI 为您提供了多个叙事方向，请选择最符合创意的一个</p>
                </div>
                <button
                  onClick={() => setGeneratedOptions(null)}
                  className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {generatedOptions.map((option, idx) => (
                    <div
                      key={option.optionId}
                      className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col hover:border-emerald-500/50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                          方案 {idx + 1}
                        </span>
                        <button
                          onClick={() => handleSelectOption(option.scenes)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                        >
                          应用此方案
                        </button>
                      </div>
                      <p className="text-sm text-neutral-300 mb-6 leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50">
                        {option.optionDescription}
                      </p>
                      <div className="space-y-3">
                        {option.scenes.map((s: any, sIdx: number) => (
                          <div key={sIdx} className="flex gap-3 p-3 bg-neutral-900/30 rounded-xl border border-neutral-800/30">
                            <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center text-[10px] font-bold text-neutral-500 shrink-0">
                              {sIdx + 1}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-emerald-400 truncate">{s.title}</h4>
                              <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5">{s.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {deletingSceneId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">确认删除场景？</h3>
              <p className="text-neutral-400 text-sm mb-8">
                此操作将永久删除该场景及其所有关联数据，且无法撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingSceneId(null)}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteScene(deletingSceneId)}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
