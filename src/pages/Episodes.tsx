import React, { useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { usePromptStore } from "../store/usePromptStore";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  FileText,
  Wand2,
  Loader2,
  AlertTriangle,
  GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { Type } from "@google/genai";
import { generateAIContent } from "../services/ai";
import toast from "react-hot-toast";
import PromptEditorModal from "../components/PromptEditorModal";
import EpisodeTemplateModal from "../components/EpisodeTemplateModal";
import { FORMAT_ROUTING } from "../config/templates";
import { getProjectTypeLabel, formatCreativeVision } from "../utils/projectUtils";
import { safeParseAIResponse } from "../utils/aiParser";
import { PROJECT_TYPES } from "../constants";
import { EpisodeSidebar } from "../components/episodes/EpisodeSidebar";
import { EpisodeDetailEditor } from "../components/episodes/EpisodeDetailEditor";
import { GenerateEpisodesModal } from "../components/episodes/GenerateEpisodesModal";
import { EpisodeOptionsModal } from "../components/episodes/EpisodeOptionsModal";
import { DeleteEpisodeModal } from "../components/episodes/DeleteEpisodeModal";
import { Episode } from "../types/project";

export default function Episodes() {
  const {
    currentProject,
    activeEpisodeId,
    activeEpisode,
    setActiveEpisodeId,
    addEpisode,
    updateEpisode,
    deleteEpisode,
    updateProject,
    reorderEpisodes,
  } = useProjectStore();

  const { handleDragEnd } = useDragAndDrop({
    onReorder: (sourceIndex, destinationIndex, droppableId) => {
      if (droppableId === 'episodes') {
        reorderEpisodes(sourceIndex, destinationIndex);
      }
    }
  });
  const { templates } = usePromptStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<string | null>(null);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在起点注入灵感并立项。
      </div>
    );
  }

  const handleAddEpisode = () => {
    const isMovie = currentProject.type === PROJECT_TYPES.MOVIE;
    const newEpisode: Episode = {
      id: Date.now().toString(),
      title: isMovie 
        ? `新篇章 ${currentProject.episodes.length + 1}` 
        : `第 ${currentProject.episodes.length + 1} 集`,
      inspiration: "",
      scenes: [],
    };
    addEpisode(newEpisode);
  };

  const handleDeleteEpisode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEpisodeToDelete(id);
  };

  const confirmDelete = () => {
    if (episodeToDelete) {
      deleteEpisode(episodeToDelete);
      setEpisodeToDelete(null);
    }
  };

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedSkeletonId, setSelectedSkeletonId] = useState<string>('');
  const [selectedBeatId, setSelectedBeatId] = useState<string>('');
  const [genCount, setGenCount] = useState(currentProject?.type === 'movie' ? 10 : currentProject?.type === 'tv-series' ? 5 : 10);
  const [genDuration, setGenDuration] = useState(currentProject?.type === 'movie' ? 10 : currentProject?.type === 'tv-series' ? 45 : 2);

  const [recommendation, setRecommendation] = useState<{
    recommendedSkeleton: string;
    recommendedBeats: string;
    reasoning: string;
  } | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  const [diagnosis, setDiagnosis] = useState<{
    matchScore: number;
    reasoning: string;
    pros: string[];
    cons: string[];
  } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const [debugPrompt, setDebugPrompt] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  React.useEffect(() => {
    if (!isGenerateModalOpen) {
      setRecommendation(null);
      setDiagnosis(null);
      setDebugPrompt('');
      setShowDebug(false);
      setSelectedSkeletonId('');
      setSelectedBeatId('');
    }
  }, [isGenerateModalOpen]);

  const getAvailableSkeletons = (type?: string, customTemplates?: any[]) => {
    const customSkeletons = (customTemplates || []).filter(t => t.id.startsWith('custom-skel-'));
    let baseSkeletons = FORMAT_ROUTING[type || 'movie']?.skeletons || [];
    if (!baseSkeletons.length) {
      baseSkeletons = Object.values(FORMAT_ROUTING).flatMap(f => f.skeletons);
    }
    return [...baseSkeletons, ...customSkeletons].map(t => t.name).join('、');
  };

  const getAvailableBeats = (type?: string, customTemplates?: any[]) => {
    const customBeats = (customTemplates || []).filter(t => t.id.startsWith('custom-beat-'));
    let baseBeats = FORMAT_ROUTING[type || 'movie']?.beats || [];
    if (!baseBeats.length) {
      baseBeats = Object.values(FORMAT_ROUTING).flatMap(f => f.beats);
    }
    return [...baseBeats, ...customBeats].map(t => t.name).join('、');
  };

  const getAllSkeletons = () => {
    const customSkeletons = (currentProject?.customTemplates || []).filter(t => t.id.startsWith('custom-skel-'));
    return [...Object.values(FORMAT_ROUTING).flatMap(f => f.skeletons), ...customSkeletons];
  };

  const getAllBeats = () => {
    const customBeats = (currentProject?.customTemplates || []).filter(t => t.id.startsWith('custom-beat-'));
    return [...Object.values(FORMAT_ROUTING).flatMap(f => f.beats), ...customBeats];
  };

  const handleRecommend = () => {
    if (!currentProject) return;
    
    setPromptModalState({
      isOpen: true,
      templateId: 'recommendStructure',
      variables: {
        projectType: getProjectTypeLabel(currentProject.type),
        logline: currentProject.logline || '',
        coreConflict: currentProject.coreConflict || '',
        creativeVision: formatCreativeVision(currentProject.creativeVision),
        availableSkeletons: getAvailableSkeletons(currentProject.type, currentProject.customTemplates),
        availableBeats: getAvailableBeats(currentProject.type, currentProject.customTemplates),
      },
      onConfirm: async (finalPrompt) => {
        setPromptModalState(prev => ({ ...prev, isOpen: false }));
        setIsRecommending(true);
        setDiagnosis(null); // Clear diagnosis when getting new recommendation
        setDebugPrompt(finalPrompt);
        
        try {
          const responseText = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                reasoning: { type: Type.STRING },
                recommendedSkeleton: { type: Type.STRING },
                recommendedBeats: { type: Type.STRING },
              },
              required: ["reasoning", "recommendedSkeleton", "recommendedBeats"]
            }
          });

          if (responseText) {
            const data = safeParseAIResponse(responseText, {
              reasoning: "",
              recommendedSkeleton: "",
              recommendedBeats: "",
            });
            setRecommendation(data);
          }
        } catch (e) {
          console.error("Recommendation failed", e);
          toast.error("获取推荐失败，请重试");
        } finally {
          setIsRecommending(false);
        }
      }
    });
  };

  const handleDiagnose = () => {
    if (!currentProject || !selectedSkeletonId || !selectedBeatId) {
      toast.error("请先选择骨架和节拍");
      return;
    }
    
    const allSkeletons = getAllSkeletons();
    const allBeats = getAllBeats();
    
    const skelName = allSkeletons.find(t => t.id === selectedSkeletonId)?.name || '';
    const beatName = allBeats.find(t => t.id === selectedBeatId)?.name || '';

    setPromptModalState({
      isOpen: true,
      templateId: 'diagnoseStructure',
      variables: {
        projectType: getProjectTypeLabel(currentProject.type),
        logline: currentProject.logline || '',
        coreConflict: currentProject.coreConflict || '',
        creativeVision: formatCreativeVision(currentProject.creativeVision),
        selectedSkeleton: skelName,
        selectedBeats: beatName,
      },
      onConfirm: async (finalPrompt) => {
        setPromptModalState(prev => ({ ...prev, isOpen: false }));
        setIsDiagnosing(true);
        setRecommendation(null); // Clear recommendation when diagnosing specific combo
        setDebugPrompt(finalPrompt);
        
        try {
          const responseText = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                reasoning: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["reasoning", "matchScore", "pros", "cons"]
            }
          });

          if (responseText) {
            const data = safeParseAIResponse(responseText, {
              reasoning: "",
              matchScore: 0,
              pros: [],
              cons: [],
            });
            setDiagnosis(data);
          }
        } catch (e) {
          console.error("Diagnosis failed", e);
          toast.error("诊断失败，请重试");
        } finally {
          setIsDiagnosing(false);
        }
      }
    });
  };

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

  const handlePrepareGenerate = (count: number, duration: number) => {
    if (!currentProject || isGenerating) return;
    setIsGenerateModalOpen(false);

    const isShortDrama = currentProject.type === "short-drama";
    const isTvSeries = currentProject.type === "tv-series";

    let shortDramaInstruction = "";
    if (currentProject.type === "movie") {
      shortDramaInstruction = `【体裁要求：电影】请将整个电影划分为 ${count} 个 Sequence (段落，如“训练蒙太奇”、“追车戏”、“低谷期”)。每个段落代表一个完整的小叙事单元。`;
    } else if (isTvSeries) {
      shortDramaInstruction = `【体裁要求：剧集】请划分为 ${count} 集的梗概。整季主线参考：${currentProject.seasonArc || '未设置'}。请注意：如果创作者指令中提到“单元剧”，请确保每集故事独立；如果提到“连续剧”，请确保集与集之间有连贯性和悬念。`;
    } else if (isShortDrama) {
      const startIndex = currentProject.episodes.length + 1;
      shortDramaInstruction = `【体裁要求：微短剧】请生成接下来的 ${count} 集梗概（从第 ${startIndex} 集到第 ${startIndex + count - 1} 集）。请根据创作者的指令，合理安排情绪起伏、反转或悬念。
【重要格式要求】
请返回 JSON 数组，每个对象必须包含：
1. title: 必须非常简短，仅包含篇章名称（例如："第一幕：余温渐冷" 或 "第1集：初遇"），绝对不要包含剧情描述。
2. inspiration: 详细的剧情梗概、核心内容或灵感描述。
3. chapter: 所属卷名或篇章名（例如："卷一：初入职场"）。
4. chapterDescription: 该卷/篇章的宏观目标或主线剧情。`;
    }

    const allSkeletons = getAllSkeletons();
    const allBeats = getAllBeats();

    const skeleton = allSkeletons.find(t => t.id === selectedSkeletonId);
    const beat = allBeats.find(t => t.id === selectedBeatId);
    
    const actualCount = skeleton?.fixedCount || count;

    let structureInstruction = "";
    if (currentProject.type === "movie") {
      let mappingInstruction = "";
      if (skeleton?.id === 'movie-3-act') {
        mappingInstruction = "（注：由于是三幕剧，请按照 1:2:1 的比例切分物理容器，即第一幕约2个Sequence，第二幕约4-5个Sequence，第三幕约2个Sequence）";
      } else if (skeleton?.id === 'movie-5-act') {
        mappingInstruction = "（注：由于是五幕剧，请将五幕自然拆解为 8-10 个 Sequence，确保每一幕都有 1-2 个物理容器来承载）";
      }

      structureInstruction = `【结构与输出指令】

宏观逻辑骨架： 请严格遵循用户选择的【${skeleton?.name || '指定骨架'}】作为全片的叙事指导原则。

物理切分要求（极其重要）： 为了保证细节密度，请不要把一整幕作为单个块输出。请将整部电影切分为 8 到 10 个物理段落 (Sequence)。每个 Sequence 代表约 10-15 分钟的银幕时间。${mappingInstruction}

内部节拍融合： 请将用户选择的【${beat?.name || '指定节拍'}】作为情绪转折点，合理分配到这 8-10 个物理段落中。

【JSON 格式要求】
输出的 episodes 数组必须包含 8 到 10 个元素。
每个元素包含：
- parentAct: 所属的宏观层级（如："第一幕：建置"）
- title: 本段落标题 (Sequence Title)
- beatsIncluded: 本段落包含的微观节拍（如："触发事件"）
- inspiration: 本段落 10-15 分钟的具体梗概

骨架补充说明：${skeleton?.instruction || ""}
节拍补充说明：${beat?.instruction || ""}`;
    } else if (isTvSeries) {
      structureInstruction = `【体裁要求】：剧集 (TV Series)。
【结构骨架】：请严格按照 ${skeleton?.name || '指定骨架'} 为骨架来规划。请划分为精确的 ${actualCount} 集的梗概。整季主线参考：${currentProject.seasonArc || '未设置'}。

【连续剧 vs 单元剧 核心切分逻辑】（极其重要）：
请仔细分析创作者的指令，判断本剧是“连续剧 (Serialized)”还是“单元剧/情景喜剧 (Episodic/Procedural)”：
1. 如果是单元剧（如《恶搞之家》、《绝命毒师》中的某些独立集、《黑镜》）：
   - 每一集必须是一个独立完整的故事！
   - 请将【${beat?.name || '指定节拍'}】的完整结构（从建置到高潮、结局）压缩并应用到**每一集**的内部。
   - 每一集都应该有自己清晰的 A-Story（主线）和 B-Story（副线）。
2. 如果是连续剧（如《权力的游戏》、《怪奇物语》）：
   - 请将【${beat?.name || '指定节拍'}】作为整季的宏观情绪转折点，合理分配到这 ${actualCount} 集中（例如第1集是触发事件，第5集是中点）。

【JSON 格式要求】
输出的 episodes 数组必须包含 ${actualCount} 个元素。
每个元素包含：
- title: 本集标题
- inspiration: 本集的具体梗概。如果是单元剧，请明确写出本集的 A-Story 和 B-Story；如果是连续剧，请写出本集在整季中的推进作用。

骨架补充说明：${skeleton?.instruction || ""}
节拍补充说明：${beat?.instruction || ""}`;
    } else if (isShortDrama) {
      const startIndex = currentProject.episodes.length + 1;
      structureInstruction = `【体裁要求】：微短剧 (Short Drama)。
【结构骨架】：请严格按照 ${skeleton?.name || '指定骨架'} 为骨架来规划。请生成接下来的 ${actualCount} 集梗概（从第 ${startIndex} 集到第 ${startIndex + actualCount - 1} 集）。
【内部节拍映射】：请将 ${beat?.name || '指定节拍'} 的各个关键节点，作为每集内部的情感与叙事特征进行映射。

骨架补充说明：${skeleton?.instruction || ""}
节拍补充说明：${beat?.instruction || ""}

【重要格式要求】
请返回 JSON 数组，每个对象必须包含：
1. title: 必须非常简短，仅包含篇章名称（例如："第一幕：余温渐冷" 或 "第1集：初遇"），绝对不要包含剧情描述。
2. inspiration: 详细的剧情梗概、核心内容或灵感描述。
3. chapter: 所属卷名或篇章名（例如："卷一：初入职场"）。
4. chapterDescription: 该卷/篇章的宏观目标或主线剧情。`;
    }

    setPromptModalState({
      isOpen: true,
      templateId: 'generateEpisodes',
      variables: {
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        creativeVision: formatCreativeVision(currentProject.creativeVision),
        characters: currentProject.characters.map(c => `${c.name}: ${c.internalDesire} / ${c.externalGoal}`).join('\n'),
        structureInstruction
      },
      onConfirm: (finalPrompt) => handleAIGenerate(finalPrompt, duration, isShortDrama, currentProject.type === "movie")
    });
  };

  const [generatedOptions, setGeneratedOptions] = useState<any[] | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [pendingIsShortDrama, setPendingIsShortDrama] = useState<boolean>(false);
  const [pendingIsMovie, setPendingIsMovie] = useState<boolean>(false);

  const handleAIGenerate = async (finalPrompt: string, duration: number, isShortDrama: boolean, isMovie: boolean) => {
    setIsGenerating(true);

    try {
      const schemaProperties: any = {
        inspiration: { type: Type.STRING },
        title: { type: Type.STRING },
      };
      const requiredFields = ["inspiration", "title"];
      if (isShortDrama) {
        schemaProperties.chapter = { type: Type.STRING };
        schemaProperties.chapterDescription = { type: Type.STRING };
        requiredFields.push("chapter", "chapterDescription");
      }
      if (isMovie) {
        schemaProperties.parentAct = { type: Type.STRING };
        schemaProperties.beatsIncluded = { type: Type.STRING };
        // We don't make them strictly required to avoid breaking if AI forgets, but we define them
      }

      const responseText = await generateAIContent({
        prompt: finalPrompt,
        requireJson: true,
        schema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  optionId: { type: Type.STRING },
                  optionDescription: { type: Type.STRING },
                  episodes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: schemaProperties,
                      required: requiredFields
                    }
                  }
                },
                required: ["optionId", "optionDescription", "episodes"]
              }
            }
          },
          required: ["options"]
        },
      });

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText || "{}");
      } catch (e) {
        console.error("JSON Parse Error:", e, "Raw Text:", responseText);
        toast.error("AI 返回的数据格式有误，请重试或切换模型。");
        setIsGenerating(false);
        return;
      }
      
      if (parsedData.options && parsedData.options.length > 0) {
        setPendingDuration(duration);
        setPendingIsShortDrama(isShortDrama);
        setPendingIsMovie(isMovie);
        setGeneratedOptions(parsedData.options);
      } else {
        toast.error("未能生成有效的选项");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = async (selectedEpisodes: any[]) => {
    setGeneratedOptions(null);
    const latestState = useProjectStore.getState();
    const latestProject = latestState.currentProject;
    const latestActiveEpisode = latestState.activeEpisode;
    
    if (!latestProject) return;

    const newArcs = [...(latestProject.arcs || [])];
    
    const episodesWithIds = selectedEpisodes.map((ep: any, idx: number) => {
      let arcId = undefined;
      if (pendingIsShortDrama && ep.chapter) {
        let existingArc = newArcs.find(a => a.name === ep.chapter);
        if (!existingArc) {
          existingArc = {
            id: 'arc-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            name: ep.chapter,
            description: ep.chapterDescription || '',
          };
          newArcs.push(existingArc);
        }
        arcId = existingArc.id;
      }

      let finalTitle = ep.title;
      let finalInspiration = ep.inspiration;

      if (pendingIsMovie) {
        if (ep.parentAct) {
          finalTitle = `[${ep.parentAct}] ${ep.title}`;
        }
        if (ep.beatsIncluded) {
          finalInspiration = `【包含节拍】${ep.beatsIncluded}\n\n${ep.inspiration}`;
        }
      }

      return {
        id: Date.now().toString() + idx,
        title: finalTitle,
        inspiration: finalInspiration,
        arcId,
        targetDuration: pendingDuration,
        scenes: [],
      };
    });

    // Save full episodes to localforage
    const localforage = (await import("localforage")).default;
    const { setItemNow } = await import("../store/useProjectStore");
    
    // Remove old episodes from localforage
    for (const ep of latestProject.episodes) {
      await localforage.removeItem(`project_${latestProject.id}_episode_${ep.id}`);
    }

    for (const ep of episodesWithIds) {
      await setItemNow(`project_${latestProject.id}_episode_${ep.id}`, ep);
    }

    const episodeMetas = episodesWithIds.map(ep => ({
      id: ep.id,
      title: ep.title,
      inspiration: ep.inspiration,
      arcId: ep.arcId,
      targetDuration: ep.targetDuration
    }));

    updateProject({
      episodes: episodeMetas,
      arcs: newArcs,
    });
    
    if (episodeMetas.length > 0) {
      setActiveEpisodeId(episodeMetas[0].id);
    }
    toast.success(`成功生成 ${episodesWithIds.length} 个篇章/分集`);
  };

  const handleRegenerateEpisode = () => {
    if (!activeEpisode) return;

    const activeIndex = currentProject.episodes.findIndex(ep => ep.id === activeEpisode.id);
    const previousEpisode = activeIndex > 0 ? currentProject.episodes[activeIndex - 1] : null;
    const nextEpisode = activeIndex < currentProject.episodes.length - 1 ? currentProject.episodes[activeIndex + 1] : null;

    const previousContext = previousEpisode ? `标题: ${previousEpisode.title}\n梗概: ${previousEpisode.inspiration}` : "无前文";
    const nextContext = nextEpisode ? `标题: ${nextEpisode.title}\n梗概: ${nextEpisode.inspiration}` : "无后文";

    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateEpisode',
      variables: {
        unitName: currentProject.type === "movie" ? "段落 (Sequence)" : "集 (Episode)",
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        creativeVision: formatCreativeVision(currentProject.creativeVision),
        characters: currentProject.characters.map(c => `${c.name}: ${c.internalDesire} / ${c.externalGoal}`).join('\n'),
        episodeTitle: activeEpisode.title,
        episodeInspiration: activeEpisode.inspiration,
        previousContext,
        nextContext
      },
      onConfirm: async (finalPrompt) => {
        setIsGenerating(true);
        try {
          const responseText = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                inspiration: { type: Type.STRING },
                title: { type: Type.STRING },
              },
              required: ["inspiration", "title"]
            }
          });

          let result;
          try {
            result = JSON.parse(responseText || "{}");
          } catch (e) {
            console.error("JSON Parse Error:", e, "Raw Text:", responseText);
            toast.error("AI 返回的数据格式有误，请重试或切换模型。");
            setIsGenerating(false);
            return;
          }

          updateEpisode(activeEpisode.id, {
            title: result.title,
            inspiration: result.inspiration
          });
          toast.success("重写成功！");
        } catch (error) {
          console.error("Regeneration error:", error);
          toast.error("重写失败，请重试");
        } finally {
          setIsGenerating(false);
        }
      }
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row h-full overflow-hidden bg-neutral-950"
      >
        {/* Sidebar - Episode List */}
        <EpisodeSidebar
          currentProject={currentProject}
          activeEpisodeId={activeEpisodeId}
          onSelectEpisode={setActiveEpisodeId}
          onAddEpisode={handleAddEpisode}
          onDeleteEpisode={handleDeleteEpisode}
          onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
          isGenerating={isGenerating}
        />

        {/* Episode Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeEpisode ? (
            <EpisodeDetailEditor
              activeEpisode={activeEpisode}
              currentProject={currentProject}
              onUpdateEpisode={updateEpisode}
              onRegenerateEpisode={handleRegenerateEpisode}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 bg-neutral-950">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
                <FileText className="w-8 h-8 text-neutral-700" />
              </div>
              <p>选择左侧{currentProject.type === "movie" ? "段落" : "篇章"}开始编辑</p>
            </div>
          )}
        </div>

        <DeleteEpisodeModal
          isOpen={!!episodeToDelete}
          onClose={() => setEpisodeToDelete(null)}
          onConfirm={confirmDelete}
          title={currentProject.episodes.find(e => e.id === episodeToDelete)?.title || ''}
          itemType={currentProject.type === "movie" ? "段落" : "篇章"}
        />

        <GenerateEpisodesModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          currentProject={currentProject}
          selectedSkeletonId={selectedSkeletonId}
          selectedBeatId={selectedBeatId}
          genCount={genCount}
          genDuration={genDuration}
          isGenerating={isGenerating}
          isRecommending={isRecommending}
          isDiagnosing={isDiagnosing}
          recommendation={recommendation}
          diagnosis={diagnosis}
          debugPrompt={debugPrompt}
          showDebug={showDebug}
          onSetGenCount={setGenCount}
          onSetGenDuration={setGenDuration}
          onOpenTemplateModal={() => {
            setIsGenerateModalOpen(false);
            setIsTemplateModalOpen(true);
          }}
          onPrepareGenerate={handlePrepareGenerate}
          onRecommend={handleRecommend}
          onDiagnose={handleDiagnose}
          onApplyRecommendation={(skelId, beatId) => {
            setSelectedSkeletonId(skelId);
            setSelectedBeatId(beatId);
          }}
          onToggleDebug={() => setShowDebug(!showDebug)}
          getAllSkeletons={getAllSkeletons}
          getAllBeats={getAllBeats}
        />

        <EpisodeTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelect={(skeletonId, beatId) => {
            setSelectedSkeletonId(skeletonId);
            setSelectedBeatId(beatId);
            setIsTemplateModalOpen(false);
            setIsGenerateModalOpen(true);
          }}
        />

        <EpisodeOptionsModal
          generatedOptions={generatedOptions}
          onSelectOption={handleSelectOption}
          onClose={() => setGeneratedOptions(null)}
        />
      {/* Prompt Modal */}
      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState(prev => ({ ...prev, isOpen: false }))}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={promptModalState.onConfirm}
      />
    </motion.div>
    </DragDropContext>
  );
}
