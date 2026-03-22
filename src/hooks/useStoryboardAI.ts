import { useState } from 'react';
import { Type } from "@google/genai";
import toast from "react-hot-toast";
import { useProjectStore } from "../store/useProjectStore";
import { generateAIContent, generateAIImage } from "../services/ai";
import { formatCreativeVision } from "../utils/projectUtils";
import { safeParseAIResponse } from "../utils/aiParser";
import { SCRIPT_BLOCK_TYPES } from "../constants";
import { Shot, AudioTrack, Scene, Project, Episode } from "../types/project";
import { buildVisualPrompt } from '../lib/promptBuilder';

const calculateMinDuration = (text: string) => {
  if (!text) return 0;
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w.length > 0).length;
  return Math.ceil(chineseChars / 4) + Math.ceil(englishWords / 3);
};

export const useStoryboardAI = (
  currentProject: Project | null,
  activeEpisode: Episode | null,
  activeScene: Scene | undefined,
  updateScene: (sceneId: string, updates: Partial<Scene>, episodeId: string) => void,
  setActiveShotId: (id: string | null) => void,
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    templateId: string;
    variables: Record<string, string>;
    onConfirm: (finalPrompt: string) => void;
  }>({
    isOpen: false,
    templateId: '',
    variables: {},
    onConfirm: () => {},
  });

  const handlePrepareGenerateShots = async (estimatedSceneDuration: string, targetDurationMins: number) => {
    if (!activeScene || isGenerating || !currentProject) return;
    if (!activeScene.script) {
      toast.error("该场景还没有剧本，请先在剧本页面生成剧本。");
      return;
    }

    if (!activeScene.scriptBlocks || activeScene.scriptBlocks.length === 0) {
      toast.error("请先在剧本页面将剧本转换为结构化剧本，并关联角色和场地资产。");
      return;
    }

    const unlinkedCharacters = activeScene.scriptBlocks.filter(b => b.type === SCRIPT_BLOCK_TYPES.CHARACTER && !b.linkedAssetId);
    const unlinkedLocations = activeScene.scriptBlocks.filter(b => b.type === SCRIPT_BLOCK_TYPES.SCENE_HEADING && !b.locationId);
    
    if (unlinkedCharacters.length > 0 || unlinkedLocations.length > 0) {
      toast.error("剧本中存在未关联资产的角色或场地，请先在剧本页面完成关联。");
      return;
    }

    const linkedCharacterIds = [...new Set(activeScene.scriptBlocks.filter(b => b.type === SCRIPT_BLOCK_TYPES.CHARACTER && b.linkedAssetId).map(b => b.linkedAssetId!))];
    const linkedLocationIds = [...new Set(activeScene.scriptBlocks.filter(b => b.type === SCRIPT_BLOCK_TYPES.SCENE_HEADING && b.locationId).map(b => b.locationId!))];
    const linkedPropIds = [...new Set(activeScene.scriptBlocks.flatMap(b => b.propIds || []))];

    const creativeVision = currentProject.creativeVision;
    const stylePrompt = creativeVision ? `\n【创作视点 (Creative Vision)】\n${formatCreativeVision(creativeVision)}\n\n请在生成镜头语言（景别、运镜）时，强烈参考上述视觉风格和对标作品。` : "";

    const linkedCharacterAssets = currentProject.characters.filter(c => linkedCharacterIds.includes(c.id));
    const characterPrompt = linkedCharacterAssets.length > 0 ? `
【角色列表 (Character List)】
以下是本场景中出现的角色。请根据剧情判断每个镜头中出现了哪些角色，并将他们的 ID 填入 characterIdsInShot 字段。
${linkedCharacterAssets.map(c => `- ID: ${c.id} | 名字: ${c.name}`).join("\n")}
` : "";

    const linkedLocationAssets = currentProject.assets.filter(a => linkedLocationIds.includes(a.id));
    const locationPrompt = linkedLocationAssets.length > 0 ? `
【场地列表 (Location List)】
以下是本场景发生的场地。请将对应的场地 ID 填入 locationId 字段。
${linkedLocationAssets.map(l => `- ID: ${l.id} | 名字: ${l.name}`).join("\n")}
` : "";

    const linkedPropAssets = currentProject.assets.filter(a => linkedPropIds.includes(a.id));
    const propPrompt = linkedPropAssets.length > 0 ? `
【道具列表 (Prop List)】
以下是本场景中出现的关键道具。请根据剧情判断每个镜头中出现了哪些道具，并将它们的 ID 填入 propIds 字段。
${linkedPropAssets.map(p => `- ID: ${p.id} | 名字: ${p.name}`).join("\n")}
` : "";

    const isVertical = currentProject.aspectRatio === "9:16";
    const framingInstruction = isVertical 
      ? `\n【竖屏构图强制要求】\n由于是竖屏拍摄（9:16），请多使用特写（CU）、中近景（MCU）和过肩镜头（OTS）。`
      : "";

    const expectedShotCount = Math.max(5, Math.ceil(parseInt(estimatedSceneDuration) / 8));
    
    const durationInstruction = estimatedSceneDuration
      ? `\n【时长与镜头数强制要求】\n本场景的目标总时长为 ${estimatedSceneDuration} 秒（约 ${targetDurationMins} 分钟）。生成大约 ${expectedShotCount} 个镜头。`
      : "";

    const scriptContent = activeScene.scriptBlocks && activeScene.scriptBlocks.length > 0
      ? activeScene.scriptBlocks.map(b => `[${b.type.toUpperCase()}] ${b.content}`).join('\n')
      : activeScene.script || "空";

    setPromptModalState({
      isOpen: true,
      templateId: 'generateShots',
      variables: {
        stylePrompt,
        characterPrompt,
        locationPrompt,
        propPrompt,
        framingInstruction,
        durationInstruction,
        scriptContent
      },
      onConfirm: (finalPrompt) => handleGenerateShots(finalPrompt)
    });
  };

  const handleGenerateShots = async (prompt: string) => {
    if (!activeScene || !activeEpisode) return;
    setIsGenerating(true);
    setPromptModalState(prev => ({ ...prev, isOpen: false }));
    try {
      const responseText = await generateAIContent({
        taskType: 'storyboardGen',
        prompt,
        requireJson: true,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              motivation: { type: Type.STRING },
              visualAction: { type: Type.STRING },
              shotSize: { type: Type.STRING },
              cameraAngle: { type: Type.STRING },
              cameraMovement: { type: Type.STRING },
              lightingAtmo: { type: Type.STRING },
              voiceover: { type: Type.STRING },
              characterId: { type: Type.STRING },
              characterIdsInShot: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              locationId: { type: Type.STRING },
              propIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              duration: { type: Type.NUMBER },
            },
            required: ["motivation", "visualAction", "duration", "characterIdsInShot"]
          },
        },
      });

      let generatedShots = safeParseAIResponse(responseText, []);
      
      const shotsWithIds: Shot[] = generatedShots.map(
        (s: any, idx: number) => {
          const textToSpeak = s.voiceover || s.visualAction || "";
          const minDuration = Math.max(3, calculateMinDuration(textToSpeak));
          const recommendedDuration = Math.max(s.duration || 3, minDuration);

          return {
            id: Date.now().toString() + idx,
            duration: recommendedDuration,
            shotSize: s.shotSize,
            cameraAngle: s.cameraAngle,
            cameraMovement: s.cameraMovement,
            visualAction: s.visualAction,
            lightingAtmo: s.lightingAtmo,
            motivation: s.motivation,
            characterIdsInShot: s.characterIdsInShot,
            locationId: s.locationId,
            propIds: s.propIds,
            imagePrompt: "",
            videoPrompt: "",
            visualSummary: "",
          };
        }
      );

      let currentStartTime = 0;
      const audioTracks: AudioTrack[] = [];
      generatedShots.forEach((s: any, idx: number) => {
        if (s.voiceover) {
          audioTracks.push({
            id: 'audio-' + Date.now().toString() + idx,
            type: 'dialogue',
            url: '',
            startTime: currentStartTime,
            duration: s.duration,
            characterId: s.characterId,
            text: s.voiceover,
            shotId: shotsWithIds[idx].id,
          });
        }
        currentStartTime += s.duration;
      });

      updateScene(activeScene.id, { shots: shotsWithIds, audioTracks }, activeEpisode.id);
      if (shotsWithIds.length > 0) {
        setActiveShotId(shotsWithIds[0].id);
      }
      toast.success("分镜生成成功！");
    } catch (error) {
      console.error("Generate Shots Error:", error);
      toast.error("生成分镜失败。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrepareGeneratePrompts = async () => {
    if (!activeScene || !activeScene.shots || activeScene.shots.length === 0 || isGenerating || !currentProject) return;

    const creativeVision = currentProject.creativeVision;
    const stylePrompt = creativeVision ? formatCreativeVision(creativeVision) : "无特定全局风格";

    const shotsData = activeScene.shots.map(s => ({
      id: s.id,
      shotSize: s.shotSize,
      cameraAngle: s.cameraAngle,
      cameraMovement: s.cameraMovement,
      visualAction: s.visualAction,
      lightingAtmo: s.lightingAtmo,
      motivation: s.motivation,
    }));

    // Gather all asset IDs from shots
    const characterIds = new Set<string>();
    const locationIds = new Set<string>();
    const propIds = new Set<string>();

    activeScene.shots.forEach(s => {
      s.characterIdsInShot?.forEach(id => characterIds.add(id));
      if (s.locationId) locationIds.add(s.locationId);
      s.propIds?.forEach(id => propIds.add(id));
    });

    // Build asset descriptions
    const assetDescriptions: string[] = [];

    // Characters
    currentProject.characters?.forEach(c => {
      const desc = c.psychologicalProfile || c.internalDesire;
      if (characterIds.has(c.id) && desc) {
        assetDescriptions.push(`[角色] ${c.name}: ${desc}`);
      }
    });

    // Locations
    currentProject.assets?.filter(a => a.type === 'location').forEach(l => {
      if (locationIds.has(l.id) && l.description) {
        assetDescriptions.push(`[场景] ${l.name}: ${l.description}`);
      }
    });

    // Props
    currentProject.assets?.filter(a => a.type === 'prop').forEach(p => {
      if (propIds.has(p.id) && p.description) {
        assetDescriptions.push(`[道具] ${p.name}: ${p.description}`);
      }
    });

    const assetDescriptionsText = assetDescriptions.length > 0 
      ? assetDescriptions.join('\n') 
      : "无特定资产视觉描述";

    setPromptModalState({
      isOpen: true,
      templateId: 'generatePrompts',
      variables: {
        creativeVision: stylePrompt,
        assetDescriptions: assetDescriptionsText,
        shotsData: JSON.stringify(shotsData, null, 2)
      },
      onConfirm: (finalPrompt) => handleGeneratePrompts(finalPrompt)
    });
  };

  const handleGeneratePrompts = async (prompt: string) => {
    if (!activeScene || !activeEpisode || !currentProject) return;
    setIsGenerating(true);
    setPromptModalState(prev => ({ ...prev, isOpen: false }));
    try {
      const responseText = await generateAIContent({
        taskType: 'storyboardGen',
        prompt,
        requireJson: true,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              visualSummary: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              videoPrompt: { type: Type.STRING },
            },
            required: ["id", "visualSummary", "imagePrompt", "videoPrompt"]
          },
        },
      });

      let generatedPrompts = safeParseAIResponse(responseText, []);
      
      const updatedShots = activeScene.shots!.map(shot => {
        const promptData = generatedPrompts.find((p: any) => p.id === shot.id);
        if (promptData) {
          const tempShot = {
            ...shot,
            imagePrompt: promptData.imagePrompt,
            videoPrompt: promptData.videoPrompt,
          };
          const finalPrompts = buildVisualPrompt(tempShot, currentProject);

          return {
            ...shot,
            visualSummary: promptData.visualSummary,
            imagePrompt: finalPrompts.imagePrompt,
            videoPrompt: finalPrompts.videoPrompt,
          };
        }
        return shot;
      });

      updateScene(activeScene.id, { shots: updatedShots }, activeEpisode.id);
      toast.success("视觉提示词生成成功！");
    } catch (error) {
      console.error("Generate Prompts Error:", error);
      toast.error("生成视觉提示词失败。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRerollShot = async (shotId: string) => {
    const shotToReroll = activeScene?.shots?.find(s => s.id === shotId);
    if (!shotToReroll || !activeScene || !activeEpisode || !currentProject) return;

    if (!shotToReroll.imagePrompt) {
      toast.error("请先生成视觉提示词", { id: `reroll-${shotId}` });
      return;
    }

    toast.loading("正在重新生成该镜头...", { id: `reroll-${shotId}` });

    try {
      const referenceImages: string[] = [];
      if (currentProject) {
        const assetIds = [
          ...(shotToReroll.propIds || []),
          shotToReroll.locationId
        ].filter(Boolean) as string[];

        assetIds.forEach(id => {
          const asset = currentProject.assets.find(a => a.id === id);
          if (asset && asset.imageUrl) {
            referenceImages.push(asset.imageUrl);
          }
        });

        const characterIds = shotToReroll.characterIdsInShot || [];
        characterIds.forEach(id => {
          const char = currentProject.characters.find(c => c.id === id);
          if (char && char.referenceImageUrl) {
            referenceImages.push(char.referenceImageUrl);
          }
        });
      }

      const globalParams = currentProject?.globalGenerationParams;
      const qualityPrompt = globalParams?.qualityPrompt ? `, ${globalParams.qualityPrompt}` : "";
      const negativePrompt = globalParams?.negativePrompt ? ` --no ${globalParams.negativePrompt}` : "";
      const aspectRatioParam = currentProject?.aspectRatio ? ` --ar ${currentProject.aspectRatio.replace(':', ':')}` : " --ar 16:9";

      const finalPrompt = `${shotToReroll.imagePrompt}${qualityPrompt}${negativePrompt}${aspectRatioParam}`;

      const imageUrl = await generateAIImage({
        prompt: finalPrompt,
        aspectRatio: currentProject?.aspectRatio as any || "16:9",
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      });
      
      const newTakeId = `take-${Date.now()}`;
      const newTake = {
        id: newTakeId,
        imageUrl: imageUrl,
        createdAt: Date.now()
      };

      const updatedShots = activeScene.shots!.map(s => {
        if (s.id === shotId) {
          const currentTakes = s.takes || [{
            id: `take-initial-${s.id}`,
            imageUrl: s.imageUrl,
            videoUrl: s.videoUrl,
            createdAt: Date.now() - 10000
          }];
          
          return {
            ...s,
            takes: [...currentTakes, newTake],
            activeTakeId: newTakeId,
            imageUrl: newTake.imageUrl
          };
        }
        return s;
      });

      updateScene(activeScene.id, { shots: updatedShots }, activeEpisode.id);
      toast.success("重新生成完成", { id: `reroll-${shotId}` });
    } catch (error) {
      console.error("Reroll error:", error);
      toast.error("重新生成失败", { id: `reroll-${shotId}` });
    }
  };

  return {
    isGenerating,
    promptModalState,
    setPromptModalState,
    handlePrepareGenerateShots,
    handlePrepareGeneratePrompts,
    handleRerollShot,
  };
};
