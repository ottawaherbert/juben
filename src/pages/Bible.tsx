import { useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { motion } from "motion/react";
import { Users, Plus, Loader2, Wand2, MapPin, Box, Link as LinkIcon, Globe } from "lucide-react";
import PromptEditorModal from "../components/PromptEditorModal";
import { ASSET_TYPES } from "../constants";

import { CoreConcept } from "../components/bible/CoreConcept";
import { CreativeVisionEditor } from "../components/bible/CreativeVisionEditor";
import { CharacterList } from "../components/bible/CharacterList";
import { AssetList } from "../components/bible/AssetList";
import { RelationshipEditor } from "../components/bible/RelationshipEditor";
import { WorldBuildingRuleList } from "../components/bible/WorldBuildingRuleList";
import { useBibleAI } from "../hooks/useBibleAI";

export default function Bible() {
  const { currentProject, updateProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<"characters" | "locations" | "props" | "relationships" | "worldRules">("characters");

  const {
    isGeneratingLogline,
    isGeneratingConflict,
    isGeneratingCharacters,
    isGeneratingArc,
    isGeneratingAllAssets,
    isGeneratingWorldRules,
    generatingCharId,
    generatingAssetId,
    generatingCharImageId,
    generatingAssetImageId,
    promptModalState,
    closePromptModal,
    handleRegenerateLogline,
    handleRegenerateConflict,
    handleRegenerateArc,
    handleGenerateCharacters,
    handleRegenerateCharacter,
    handleGenerateAllAssets,
    handleGenerateWorldRules,
    handleRegenerateAsset,
    handleGenerateCharacterImage,
    handleGenerateAssetImage,
  } = useBibleAI();

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在起点注入灵感并立项。
      </div>
    );
  }

  const handleDeleteCharacter = (id: string) => {
    updateProject({
      characters: currentProject.characters.filter((c) => c.id !== id),
    });
  };

  const handleDeleteAsset = (id: string) => {
    updateProject({
      assets: currentProject.assets.filter((a) => a.id !== id),
    });
  };

  const updateCreativeVision = (key: keyof NonNullable<typeof currentProject.creativeVision>, value: any) => {
    updateProject({
      creativeVision: {
        ...(currentProject.creativeVision || { genre: [], visualStyle: "", narrativeStyle: "", referenceWorks: "" }),
        [key]: value
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-12 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar"
    >
      <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white mb-2 uppercase">
            项目圣经 <span className="text-emerald-500 font-light">Bible</span>
          </h1>
          <p className="text-neutral-400 font-mono text-sm tracking-widest uppercase">
            统筹 Agent 1 // 核心设定与人物档案
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm font-mono text-neutral-500 bg-neutral-900/50 px-4 py-2 rounded-full border border-neutral-800">
            <span>TYPE: {currentProject.type.toUpperCase()}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-700" />
            <span>AR: {currentProject.aspectRatio}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Core Concept & Creative Vision */}
        <div className="xl:col-span-5 space-y-6 md:space-y-8">
          <CoreConcept
            currentProject={currentProject}
            updateProject={updateProject}
            onRegenerateLogline={handleRegenerateLogline}
            onRegenerateConflict={handleRegenerateConflict}
            onRegenerateArc={handleRegenerateArc}
            isGeneratingLogline={isGeneratingLogline}
            isGeneratingConflict={isGeneratingConflict}
            isGeneratingArc={isGeneratingArc}
          />

          <CreativeVisionEditor
            creativeVision={currentProject.creativeVision}
            updateCreativeVision={updateCreativeVision}
          />
        </div>

        {/* Right Column: Characters, Locations, Props */}
        <div className="xl:col-span-7 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-[800px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 shrink-0 gap-4">
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 flex-wrap gap-1">
              <button
                onClick={() => setActiveTab("characters")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === "characters" ? "bg-purple-500/20 text-purple-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Users className="w-4 h-4" />
                角色档案
              </button>
              <button
                onClick={() => setActiveTab("relationships")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === "relationships" ? "bg-purple-500/20 text-purple-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                人物关系
              </button>
              <button
                onClick={() => setActiveTab("locations")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === "locations" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <MapPin className="w-4 h-4" />
                核心场景
              </button>
              <button
                onClick={() => setActiveTab("props")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === "props" ? "bg-blue-500/20 text-blue-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Box className="w-4 h-4" />
                关键道具
              </button>
              <button
                onClick={() => setActiveTab("worldRules")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeTab === "worldRules" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Globe className="w-4 h-4" />
                世界观规则
              </button>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === "characters" && (
                <button
                  onClick={handleGenerateCharacters}
                  disabled={isGeneratingCharacters}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl border border-purple-500/30 transition-colors text-sm font-bold disabled:opacity-50"
                >
                  {isGeneratingCharacters ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  AI 生成核心角色
                </button>
              )}
              {(activeTab === "locations" || activeTab === "props") && (
                <button
                  onClick={handleGenerateAllAssets}
                  disabled={isGeneratingAllAssets}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 rounded-xl border border-emerald-500/30 transition-colors text-sm font-bold disabled:opacity-50"
                >
                  {isGeneratingAllAssets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  AI 生成场景与道具
                </button>
              )}
              {activeTab === "worldRules" && (
                <button
                  onClick={handleGenerateWorldRules}
                  disabled={isGeneratingWorldRules}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 rounded-xl border border-emerald-500/30 transition-colors text-sm font-bold disabled:opacity-50"
                >
                  {isGeneratingWorldRules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  AI 生成世界观规则
                </button>
              )}
              {(activeTab === "characters" || activeTab === "locations" || activeTab === "props") && (
                <button
                  onClick={() => {
                    if (activeTab === "characters") {
                      const newChar = {
                        id: Date.now().toString(),
                        name: "新角色",
                        internalDesire: "",
                        externalGoal: "",
                        flaw: "",
                      };
                      updateProject({
                        characters: [...currentProject.characters, newChar],
                      });
                    } else {
                      const newAsset = {
                        id: `asset-${Date.now()}`,
                        type: activeTab === "locations" ? "location" : "prop" as "location" | "prop",
                        name: activeTab === "locations" ? "新场景" : "新道具",
                        description: "",
                        prompt: "",
                        tags: [],
                      };
                      updateProject({
                        assets: [...(currentProject.assets || []), newAsset],
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加{activeTab === "characters" ? "角色" : activeTab === "locations" ? "场景" : "道具"}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {activeTab === "characters" && (
              <CharacterList
                characters={currentProject.characters}
                onUpdate={(index, updates) => {
                  const newChars = [...currentProject.characters];
                  newChars[index] = { ...newChars[index], ...updates };
                  updateProject({ characters: newChars });
                }}
                onDelete={handleDeleteCharacter}
                onGenerateImage={handleGenerateCharacterImage}
                onRegenerate={handleRegenerateCharacter}
                generatingImageId={generatingCharImageId}
                regeneratingId={generatingCharId}
              />
            )}

            {(activeTab === "locations" || activeTab === "props") && (
              <AssetList
                assets={currentProject.assets || []}
                activeTab={activeTab as "locations" | "props"}
                onUpdate={(id, updates) => {
                  const newAssets = [...(currentProject.assets || [])];
                  const assetIndex = newAssets.findIndex(a => a.id === id);
                  if (assetIndex !== -1) {
                    newAssets[assetIndex] = { ...newAssets[assetIndex], ...updates };
                    updateProject({ assets: newAssets });
                  }
                }}
                onDelete={handleDeleteAsset}
                onGenerateImage={handleGenerateAssetImage}
                onRegenerate={handleRegenerateAsset}
                generatingImageId={generatingAssetImageId}
                regeneratingId={generatingAssetId}
              />
            )}

            {activeTab === "relationships" && (
              <RelationshipEditor
                characters={currentProject.characters}
                relationships={currentProject.relationships || []}
                onChange={(relationships) => updateProject({ relationships })}
              />
            )}

            {activeTab === "worldRules" && (
              <WorldBuildingRuleList
                rules={currentProject.worldBuildingRules || []}
                onChange={(worldBuildingRules) => updateProject({ worldBuildingRules })}
              />
            )}
          </div>
        </div>
      </div>
      {/* Prompt Modal */}
      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={closePromptModal}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={promptModalState.onConfirm}
      />
    </motion.div>
  );
}
