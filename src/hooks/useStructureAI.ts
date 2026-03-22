import { useState } from "react";
import { Type } from "@google/genai";
import toast from "react-hot-toast";
import { generateAIContent } from "../services/ai";
import { Project, Episode, Scene } from "../types/project";
import { FORMAT_ROUTING } from "../config/templates";

export function useStructureAI(
  currentProject: Project | null,
  activeEpisode: Episode | null,
  updateEpisode: (episodeId: string, updates: Partial<Episode>) => Promise<void>,
  updateScene: (sceneId: string, updates: Partial<Scene>, episodeId?: string) => Promise<void>
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<any[] | null>(null);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    templateId: string;
    variables: Record<string, string>;
    onConfirm: (prompt: string) => void;
    contextOptions?: { id: string; label: string; value: string }[];
    defaultSelectedContextIds?: string[];
  }>({
    isOpen: false,
    templateId: '',
    variables: {},
    onConfirm: () => {},
  });

  const handlePrepareGenerate = (templateId: string, projectTypeName: string) => {
    if (!currentProject || !activeEpisode || isGenerating) return;

    const customTemplates = currentProject.customTemplates || [];
    const allTemplates = [
      ...Object.values(FORMAT_ROUTING).flatMap(f => f.sceneTemplates),
      ...customTemplates
    ];

    const template = allTemplates.find(t => t.id === templateId);
    const templateInstruction = template?.instruction || "";

    const episodeIndex = currentProject.episodes.findIndex(ep => ep.id === activeEpisode.id);
    const prevEpisode = episodeIndex > 0 ? currentProject.episodes[episodeIndex - 1] : null;
    const nextEpisode = episodeIndex < currentProject.episodes.length - 1 ? currentProject.episodes[episodeIndex + 1] : null;

    const shortDramaInstruction = currentProject.type === 'short-drama' 
      ? "\n【微短剧特殊要求】\n节奏必须极快，避免冗长的铺垫。每集结尾必须有一个强烈的“钩子（Hook）”或悬念，吸引观众看下一集。请在最后一个场景的 cliffhanger 字段中明确写出这个悬念。" 
      : "";

    const tvSeriesInstruction = currentProject.type === 'tv-series' && currentProject.seasonArc
      ? `\n【电视剧季主线】\n整季主线目标：${currentProject.seasonArc}\n请确保本集的剧情发展能够推动整季主线。`
      : "";

    let durationInstruction = "";
    if (activeEpisode.targetDuration) {
      if (currentProject.type === 'movie') {
        const minScenes = Math.max(2, Math.floor(activeEpisode.targetDuration / 3));
        const maxScenes = Math.max(4, Math.floor(activeEpisode.targetDuration / 1.5));
        durationInstruction = `\n【时长与节奏控制】\n注意：这只是整部${projectTypeName}中的一个 ${activeEpisode.targetDuration} 分钟的段落。\n请为这个段落生成 ${minScenes}-${maxScenes} 个核心场景（Scene）。让场景数量自适应叙事逻辑。每个场景的 targetDuration（预计时长）通常在 1 到 5 分钟之间。所有场景的 targetDuration 累加起来必须接近 ${activeEpisode.targetDuration} 分钟！`;
      } else {
        const minScenes = Math.max(5, Math.floor(activeEpisode.targetDuration * 0.8));
        const maxScenes = Math.floor(activeEpisode.targetDuration * 1.5);
        durationInstruction = `\n【时长与节奏控制】\n注意：这只是整部${projectTypeName}中的一个 ${activeEpisode.targetDuration} 分钟的集/篇章。\n影视行业标准：1页剧本 ≈ 1分钟 ≈ 1个中等长度场景。\n请你务必生成 ${minScenes}-${maxScenes} 个独立的场景，以支撑起这个时长。不要只写几个大段落，必须拆分到具体的物理空间和时间连续的“场景（Scene）”级别。\n每个场景的 targetDuration（预计时长）通常在 0.5 到 3 分钟之间。所有场景的 targetDuration 累加起来必须接近 ${activeEpisode.targetDuration} 分钟！`;
      }
    } else {
      durationInstruction = `\n【时长与节奏控制】\n注意：这只是整部${projectTypeName}中的一个局部段落/集。请根据叙事逻辑合理分配场景数量和时长。`;
    }

    const contextOptions = currentProject.episodes.map((ep, idx) => ({
      id: ep.id,
      label: `第 ${idx + 1} 集: ${ep.title}`,
      value: `[作为上下文参考的相邻段落] 【第 ${idx + 1} 集: ${ep.title}】\n梗概: ${ep.inspiration}`
    }));

    const defaultSelectedContextIds = [];
    if (prevEpisode) defaultSelectedContextIds.push(prevEpisode.id);
    if (nextEpisode) defaultSelectedContextIds.push(nextEpisode.id);

    setPromptModalState({
      isOpen: true,
      templateId: 'generateScenes',
      variables: {
        unitName: currentProject.type === "movie" ? "段落" : "集",
        projectTypeName,
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        episodeTitle: activeEpisode.title,
        episodeInspiration: activeEpisode.inspiration,
        templateInstruction,
        shortDramaInstruction: shortDramaInstruction + tvSeriesInstruction + durationInstruction,
      },
      contextOptions,
      defaultSelectedContextIds,
      onConfirm: (finalPrompt) => handleAIGenerate(finalPrompt)
    });
  };

  const handleAIGenerate = async (finalPrompt: string) => {
    setIsGenerating(true);
    try {
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
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        sceneGoal: { type: Type.STRING },
                        sceneAssets: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        valueCharge: { type: Type.STRING },
                        targetDuration: { type: Type.NUMBER },
                        hook: { type: Type.STRING },
                        cliffhanger: { type: Type.STRING },
                        storyLine: { type: Type.STRING },
                      },
                      required: ["sceneGoal", "sceneAssets", "title", "description", "valueCharge", "targetDuration"]
                    }
                  }
                },
                required: ["optionId", "optionDescription", "scenes"]
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

  const handleSelectOption = async (selectedScenes: any[]) => {
    setGeneratedOptions(null);
    if (!currentProject || !activeEpisode) return;

    const scenesWithIds = selectedScenes.map((s: any, idx: number) => ({
      ...s,
      id: Date.now().toString() + idx,
      script: "",
    }));

    await updateEpisode(activeEpisode.id, { scenes: scenesWithIds });
    toast.success(`成功生成 ${scenesWithIds.length} 个场景`);
  };

  const handleRegenerateScene = async (scene: Scene, projectTypeName: string) => {
    if (!currentProject || !activeEpisode || isGenerating) return;

    const activeIndex = activeEpisode.scenes.findIndex(s => s.id === scene.id);
    const previousScene = activeIndex > 0 ? activeEpisode.scenes[activeIndex - 1] : null;
    const nextScene = activeIndex < activeEpisode.scenes.length - 1 ? activeEpisode.scenes[activeIndex + 1] : null;

    const previousContext = previousScene ? `标题: ${previousScene.title}\n描述: ${previousScene.description}` : "无前文";
    const nextContext = nextScene ? `标题: ${nextScene.title}\n描述: ${nextScene.description}` : "无后文";

    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateScene',
      variables: {
        unitName: currentProject.type === "movie" ? "段落 (Sequence)" : "集 (Episode)",
        projectTypeName,
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        episodeTitle: activeEpisode.title,
        episodeInspiration: activeEpisode.inspiration,
        sceneTitle: scene.title,
        sceneDescription: scene.description,
        previousContext,
        nextContext
      },
      contextOptions: activeEpisode.scenes.map((s, i) => ({
        id: s.id,
        label: `场景 ${i + 1}: ${s.title}`,
        value: `【场景 ${i + 1}: ${s.title}】\n描述: ${s.description}\n价值转换: ${s.valueCharge}`
      })),
      defaultSelectedContextIds: activeEpisode.scenes.map(s => s.id),
      onConfirm: async (finalPrompt) => {
        setIsGenerating(true);
        try {
          const responseText = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                valueCharge: { type: Type.STRING },
                targetDuration: { type: Type.NUMBER },
                sceneGoal: { type: Type.STRING },
                sceneAssets: { type: Type.STRING },
                hook: { type: Type.STRING },
                cliffhanger: { type: Type.STRING },
              },
              required: ["title", "description", "valueCharge", "targetDuration"]
            }
          });

          let parsedData: any = {};
          try {
            parsedData = JSON.parse(responseText || "{}");
          } catch (e) {
            console.error("JSON Parse Error:", e, "Raw Text:", responseText);
            toast.error("AI 返回的数据格式有误，请重试。");
            return;
          }

          if (parsedData.title) {
            await updateScene(scene.id, parsedData, activeEpisode.id);
            toast.success("场景已重新生成");
          }
        } catch (error) {
          console.error("Regeneration error:", error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGenerating(false);
        }
      }
    });
  };

  return {
    isGenerating,
    generatedOptions,
    setGeneratedOptions,
    promptModalState,
    setPromptModalState,
    handlePrepareGenerate,
    handleSelectOption,
    handleRegenerateScene,
  };
}
