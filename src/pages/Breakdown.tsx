import { useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { motion } from "motion/react";
import { ListChecks, User, MapPin, Box, Music, Video, Wand2, Loader2 } from "lucide-react";
import { generateAIContent } from "../services/ai";
import toast from "react-hot-toast";
import PromptEditorModal from "../components/PromptEditorModal";

export default function Breakdown() {
  const { currentProject, activeEpisode, updateScene } = useProjectStore();
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    activeEpisode?.scenes[0]?.id || null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    templateId: string;
    variables: Record<string, string>;
    onConfirm: (prompt: string) => void;
  }>({
    isOpen: false,
    templateId: '',
    variables: {},
    onConfirm: () => {},
  });

  if (!currentProject || !activeEpisode) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        请先选择一个项目和剧集
      </div>
    );
  }

  const activeScene = activeEpisode.scenes.find((s) => s.id === activeSceneId);

  const handleAnalyzeClick = () => {
    if (!activeScene || !activeScene.script) return;
    
    setPromptModalState({
      isOpen: true,
      templateId: 'breakdown',
      variables: {
        scriptContent: activeScene.script
      },
      onConfirm: async (finalPrompt) => {
        setIsAnalyzing(true);
        try {
          const result = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
          });
          
          if (result) {
            const breakdown = JSON.parse(result);
            
            // Process breakdown to link IDs
            const processedBreakdown = { ...breakdown };
            if (currentProject) {
              if (processedBreakdown.characters) {
                processedBreakdown.characterIds = processedBreakdown.characters
                  .map((name: string) => currentProject.characters.find(c => c.name === name)?.id)
                  .filter(Boolean);
              }
              if (processedBreakdown.props) {
                processedBreakdown.propIds = processedBreakdown.props
                  .map((name: string) => currentProject.assets.find(a => a.type === 'prop' && a.name === name)?.id)
                  .filter(Boolean);
              }
              if (processedBreakdown.location) {
                const loc = currentProject.assets.find(a => a.type === 'location' && processedBreakdown.location.includes(a.name));
                if (loc) processedBreakdown.locationId = loc.id;
              }
            }

            updateScene(activeScene.id, { breakdown: processedBreakdown }, activeEpisode.id);
            toast.success("剧本拆解完成");
          }
        } catch (error) {
          console.error("Failed to analyze script:", error);
          toast.error("拆解失败，请重试");
        } finally {
          setIsAnalyzing(false);
        }
      }
    });
  };

  const handleSyncToAssets = () => {
    if (!activeScene?.breakdown || !currentProject) return;

    const { characters, location, props } = activeScene.breakdown;
    let addedCount = 0;

    // Sync Characters
    const newCharacters = [...currentProject.characters];
    const newCharacterIds: string[] = [];
    characters?.forEach(charName => {
      let char = newCharacters.find(c => c.name === charName);
      if (!char) {
        char = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: charName,
          internalDesire: "",
          externalGoal: "",
          flaw: ""
        };
        newCharacters.push(char);
        addedCount++;
      }
      newCharacterIds.push(char.id);
    });

    // Sync Location and Props
    const newAssets = [...currentProject.assets];
    let newLocationId = activeScene.breakdown.locationId;
    if (location) {
      let loc = newAssets.find(a => a.name === location && a.type === 'location');
      if (!loc) {
        loc = {
          id: `loc-${Date.now()}-${Math.random()}`,
          type: 'location',
          name: location,
          description: "",
          prompt: "",
          tags: []
        };
        newAssets.push(loc);
        addedCount++;
      }
      newLocationId = loc.id;
    }

    const newPropIds: string[] = [];
    props?.forEach(propName => {
      let prop = newAssets.find(a => a.name === propName && a.type === 'prop');
      if (!prop) {
        prop = {
          id: `prop-${Date.now()}-${Math.random()}`,
          type: 'prop',
          name: propName,
          description: "",
          prompt: "",
          tags: []
        };
        newAssets.push(prop);
        addedCount++;
      }
      newPropIds.push(prop.id);
    });

    const updatedBreakdown = {
      ...activeScene.breakdown,
      characterIds: newCharacterIds,
      locationId: newLocationId,
      propIds: newPropIds
    };

    useProjectStore.getState().updateProject({ characters: newCharacters, assets: newAssets });
    updateScene(activeScene.id, { breakdown: updatedBreakdown }, activeEpisode.id);

    if (addedCount > 0) {
      toast.success(`成功同步 ${addedCount} 个新资产！请前往“项目圣经”查看和编辑提示词。`);
    } else {
      toast.success("所有资产已在库中，已更新关联。");
    }
  };

  const renderBreakdownSection = (title: string, icon: React.ReactNode, items: string[] = [], colorClass: string) => (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
      <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${colorClass}`}>
        {icon}
        {title}
      </h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-xs text-neutral-600 italic">暂无数据</div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row h-full overflow-hidden"
    >
      {/* Scene List Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0 md:shrink">
        <div className="p-4 md:p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            场景列表
          </h2>
          <p className="text-xs text-neutral-500 mt-1">统筹拆解</p>
        </div>
        <div className="flex-1 overflow-y-auto md:overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 flex md:flex-col gap-2 custom-scrollbar">
          {activeEpisode.scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setActiveSceneId(scene.id)}
              className={`w-48 md:w-full shrink-0 text-left px-4 py-3 rounded-xl transition-colors ${
                activeSceneId === scene.id
                  ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-400"
                  : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-neutral-700"
              }`}
            >
              <div className="font-bold text-sm mb-1 flex items-center justify-between">
                <span>{scene.title}</span>
                {scene.breakdown && (
                  <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    已拆解
                  </span>
                )}
              </div>
              <div className="text-xs opacity-70 truncate">
                {scene.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown Content */}
      <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden">
        {activeScene ? (
          <div className="flex-1 flex flex-col p-6 md:p-12 max-w-5xl mx-auto w-full overflow-y-auto custom-scrollbar">
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white mb-2 font-serif">
                  {activeScene.title} - 剧本拆解
                </h1>
                <p className="text-neutral-400 text-xs md:text-sm">
                  提取服化道、场景、角色等制片要素
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {activeScene.breakdown && (
                  <button
                    onClick={handleSyncToAssets}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
                  >
                    同步至资产库
                  </button>
                )}
                <button
                  onClick={handleAnalyzeClick}
                  disabled={isAnalyzing || !activeScene.script}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  AI 智能拆解
                </button>
              </div>
            </div>

            {!activeScene.script ? (
              <div className="flex-1 flex items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-3xl">
                请先在剧本编辑器中完成剧本创作
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderBreakdownSection(
                  "角色 & 群演", 
                  <User className="w-4 h-4" />, 
                  activeScene.breakdown?.characterIds 
                    ? activeScene.breakdown.characterIds.map(id => currentProject?.characters.find(c => c.id === id)?.name || id)
                    : activeScene.breakdown?.characters, 
                  "text-blue-400"
                )}
                {renderBreakdownSection(
                  "场景 & 地点", 
                  <MapPin className="w-4 h-4" />, 
                  activeScene.breakdown?.locationId
                    ? [currentProject?.assets.find(a => a.id === activeScene.breakdown!.locationId)?.name || activeScene.breakdown.location]
                    : activeScene.breakdown?.location ? [activeScene.breakdown.location] : [], 
                  "text-emerald-400"
                )}
                {renderBreakdownSection("环境 & 时间", <MapPin className="w-4 h-4" />, activeScene.breakdown?.setting && activeScene.breakdown?.time ? [`${activeScene.breakdown.setting} - ${activeScene.breakdown.time}`] : [], "text-emerald-400")}
                {renderBreakdownSection(
                  "道具 & 陈设", 
                  <Box className="w-4 h-4" />, 
                  activeScene.breakdown?.propIds
                    ? activeScene.breakdown.propIds.map(id => currentProject?.assets.find(a => a.id === id)?.name || id)
                    : activeScene.breakdown?.props, 
                  "text-amber-400"
                )}
                {renderBreakdownSection("视觉特效 (VFX)", <Video className="w-4 h-4" />, activeScene.breakdown?.vfx, "text-purple-400")}
                {renderBreakdownSection("声音 & 音乐", <Music className="w-4 h-4" />, activeScene.breakdown?.sfx, "text-cyan-400")}
              </div>
            )}
            
            {activeScene.script && (
              <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-neutral-400 mb-4">参考剧本</h3>
                <div className="text-[12pt] font-script text-neutral-300 whitespace-pre-wrap opacity-70">
                  {activeScene.script}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            请选择一个场景
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
    </motion.div>
  );
}
