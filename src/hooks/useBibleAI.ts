import { useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { generateAIContent, generateAIImage } from "../services/ai";
import { Type } from "@google/genai";
import toast from "react-hot-toast";
import { getProjectTypeLabel, formatCreativeVision } from "../utils/projectUtils";
import { safeParseAIResponse } from "../utils/aiParser";
import { ASSET_TYPES } from "../constants";
import { Asset } from "../types/project";

export function useBibleAI() {
  const { currentProject, updateProject } = useProjectStore();
  const [isGeneratingLogline, setIsGeneratingLogline] = useState(false);
  const [isGeneratingConflict, setIsGeneratingConflict] = useState(false);
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
  const [isGeneratingArc, setIsGeneratingArc] = useState(false);
  const [isGeneratingAllAssets, setIsGeneratingAllAssets] = useState(false);
  const [isGeneratingWorldRules, setIsGeneratingWorldRules] = useState(false);
  const [generatingCharId, setGeneratingCharId] = useState<string | null>(null);
  const [generatingAssetId, setGeneratingAssetId] = useState<string | null>(null);
  const [generatingCharImageId, setGeneratingCharImageId] = useState<string | null>(null);
  const [generatingAssetImageId, setGeneratingAssetImageId] = useState<string | null>(null);

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

  const closePromptModal = () => setPromptModalState(prev => ({ ...prev, isOpen: false }));

  const handleRegenerateLogline = () => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject) return;

    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateLogline',
      variables: {
        type: getProjectTypeLabel(latestProject.type),
        coreConflict: latestProject.coreConflict,
        creativeVision: formatCreativeVision(latestProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setIsGeneratingLogline(true);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: { logline: { type: Type.STRING } },
              required: ["logline"]
            }
          });
          const result = safeParseAIResponse(response, { logline: "" });
          if (result.logline) {
            updateProject({ logline: result.logline });
            toast.success("Logline 重写成功！");
          }
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGeneratingLogline(false);
        }
      }
    });
  };

  const handleRegenerateConflict = () => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject) return;

    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateConflict',
      variables: {
        type: getProjectTypeLabel(latestProject.type),
        logline: latestProject.logline,
        creativeVision: formatCreativeVision(latestProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setIsGeneratingConflict(true);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: { coreConflict: { type: Type.STRING } },
              required: ["coreConflict"]
            }
          });
          const result = safeParseAIResponse(response, { coreConflict: "" });
          if (result.coreConflict) {
            updateProject({ coreConflict: result.coreConflict });
            toast.success("核心冲突重写成功！");
          }
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGeneratingConflict(false);
        }
      }
    });
  };

  const handleRegenerateArc = () => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject) return;

    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateArc',
      variables: {
        type: getProjectTypeLabel(latestProject.type),
        logline: latestProject.logline,
        coreConflict: latestProject.coreConflict,
        creativeVision: formatCreativeVision(latestProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setIsGeneratingArc(true);
        try {
          const response = await generateAIContent({ prompt: finalPrompt });
          updateProject({ seasonArc: response });
          toast.success("故事主线/钩子重写成功！");
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGeneratingArc(false);
        }
      }
    });
  };

  const handleGenerateCharacters = () => {
    if (!currentProject) return;
    setPromptModalState({
      isOpen: true,
      templateId: 'generateCharacters',
      variables: {
        type: getProjectTypeLabel(currentProject.type),
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        creativeVision: formatCreativeVision(currentProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setIsGeneratingCharacters(true);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                characters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      psychologicalProfile: { type: Type.STRING },
                      name: { type: Type.STRING },
                      internalDesire: { type: Type.STRING },
                      externalGoal: { type: Type.STRING },
                      flaw: { type: Type.STRING },
                    },
                    required: ["psychologicalProfile", "name", "internalDesire", "externalGoal", "flaw"]
                  }
                },
                relationships: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sourceName: { type: Type.STRING },
                      targetName: { type: Type.STRING },
                      type: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ["sourceName", "targetName", "type", "description"]
                  }
                }
              },
              required: ["characters"]
            }
          });
          const result = safeParseAIResponse(response, { characters: [], relationships: [] });
          if (result.characters && Array.isArray(result.characters)) {
            const charactersWithIds = result.characters.map((c: any) => ({
              ...c,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }));
            
            const relationshipsWithIds = (result.relationships || []).map((r: any) => {
              const sourceChar = charactersWithIds.find(c => c.name === r.sourceName);
              const targetChar = charactersWithIds.find(c => c.name === r.targetName);
              if (sourceChar && targetChar) {
                return {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  sourceId: sourceChar.id,
                  targetId: targetChar.id,
                  type: r.type,
                  description: r.description
                };
              }
              return null;
            }).filter(Boolean);

            const latestProject = useProjectStore.getState().currentProject;
            if (latestProject) {
              updateProject({ 
                characters: [...latestProject.characters, ...charactersWithIds],
                relationships: [...(latestProject.relationships || []), ...relationshipsWithIds]
              });
              toast.success("核心角色及关系生成成功！");
            }
          }
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGeneratingCharacters(false);
        }
      }
    });
  };

  const handleRegenerateCharacter = (charId: string, currentName: string) => {
    if (!currentProject) return;
    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateCharacter',
      variables: {
        characterName: currentName ? `角色名：${currentName}` : '',
        type: getProjectTypeLabel(currentProject.type),
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        creativeVision: formatCreativeVision(currentProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setGeneratingCharId(charId);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                psychologicalProfile: { type: Type.STRING },
                internalDesire: { type: Type.STRING },
                externalGoal: { type: Type.STRING },
                flaw: { type: Type.STRING },
              },
              required: ["name", "psychologicalProfile", "internalDesire", "externalGoal", "flaw"]
            }
          });
          const result = safeParseAIResponse(response, {
            name: "",
            psychologicalProfile: "",
            internalDesire: "",
            externalGoal: "",
            flaw: "",
          });
          
          const latestProject = useProjectStore.getState().currentProject;
          if (!latestProject) return;

          const newChars = latestProject.characters.map(c => {
            if (c.id === charId) {
              return {
                ...c,
                name: result.name || c.name,
                psychologicalProfile: result.psychologicalProfile || c.psychologicalProfile,
                internalDesire: result.internalDesire || c.internalDesire,
                externalGoal: result.externalGoal || c.externalGoal,
                flaw: result.flaw || c.flaw,
              };
            }
            return c;
          });
          updateProject({ characters: newChars });
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setGeneratingCharId(null);
        }
      }
    });
  };

  const handleGenerateAllAssets = () => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject || isGeneratingAllAssets) return;
    
    setPromptModalState({
      isOpen: true,
      templateId: 'generateAllAssets',
      variables: {
        type: getProjectTypeLabel(latestProject.type),
        logline: latestProject.logline,
        coreConflict: latestProject.coreConflict,
        creativeVision: formatCreativeVision(latestProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setIsGeneratingAllAssets(true);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                locations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "description", "prompt", "tags"]
                  }
                },
                props: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "description", "prompt", "tags"]
                  }
                }
              },
              required: ["locations", "props"]
            }
          });

          const result = safeParseAIResponse(response, { locations: [], props: [] });
          const newAssets: Asset[] = [
            ...(result.locations || []).map((l: any) => ({ ...l, id: `loc-${Date.now()}-${Math.random()}`, type: ASSET_TYPES.LOCATION })),
            ...(result.props || []).map((p: any) => ({ ...p, id: `prop-${Date.now()}-${Math.random()}`, type: ASSET_TYPES.PROP }))
          ];

          const currentAssets = useProjectStore.getState().currentProject?.assets || [];
          updateProject({ assets: [...currentAssets, ...newAssets] });
          toast.success("核心场景与关键道具生成成功！");
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGeneratingAllAssets(false);
        }
      }
    });
  };

  const handleGenerateWorldRules = () => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject || isGeneratingWorldRules) return;
    
    setPromptModalState({
      isOpen: true,
      templateId: 'generateWorldRules',
      variables: {
        type: getProjectTypeLabel(latestProject.type),
        logline: latestProject.logline,
        coreConflict: latestProject.coreConflict,
        creativeVision: formatCreativeVision(latestProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setIsGeneratingWorldRules(true);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                rules: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ["category", "content"]
                  }
                }
              },
              required: ["rules"]
            }
          });

          const result = safeParseAIResponse(response, { rules: [] });
          if (result.rules && Array.isArray(result.rules)) {
            const rulesWithIds = result.rules.map((r: any) => ({
              ...r,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }));
            const currentRules = useProjectStore.getState().currentProject?.worldBuildingRules || [];
            updateProject({ worldBuildingRules: [...currentRules, ...rulesWithIds] });
            toast.success("世界观规则生成成功！");
          }
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setIsGeneratingWorldRules(false);
        }
      }
    });
  };

  const handleRegenerateAsset = (assetId: string, currentName: string, type: "location" | "prop") => {
    if (!currentProject) return;
    setPromptModalState({
      isOpen: true,
      templateId: 'regenerateAsset',
      variables: {
        assetName: currentName ? `${type === 'location' ? '场景' : '道具'}名：${currentName}` : '',
        type: getProjectTypeLabel(currentProject.type),
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        creativeVision: formatCreativeVision(currentProject.creativeVision)
      },
      onConfirm: async (finalPrompt) => {
        setGeneratingAssetId(assetId);
        try {
          const response = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                prompt: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["name", "description", "prompt", "tags"]
            }
          });
          const result = safeParseAIResponse(response, {
            name: "",
            description: "",
            prompt: "",
            tags: [],
          });
          
          const latestProject = useProjectStore.getState().currentProject;
          if (!latestProject) return;

          const newAssets = latestProject.assets.map(a => {
            if (a.id === assetId) {
              return {
                ...a,
                name: result.name || a.name,
                description: result.description || a.description,
                prompt: result.prompt || a.prompt,
                tags: result.tags || a.tags,
              };
            }
            return a;
          });
          updateProject({ assets: newAssets });
        } catch (error) {
          console.error(error);
          toast.error("生成失败，请重试");
        } finally {
          setGeneratingAssetId(null);
        }
      }
    });
  };

  const handleGenerateCharacterImage = async (charId: string) => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject) return;
    const char = latestProject.characters.find(c => c.id === charId);
    if (!char) return;

    setGeneratingCharImageId(charId);
    try {
      const prompt = `Character portrait of ${char.name}. ${char.psychologicalProfile || ''}. Visual style: ${latestProject.creativeVision?.visualStyle || ''}. ${latestProject.creativeVision?.globalLookTags || ''}`;
      const imageUrl = await generateAIImage({
        prompt,
        aspectRatio: "3:4"
      });

      if (imageUrl) {
        const currentChars = useProjectStore.getState().currentProject?.characters || [];
        const newChars = currentChars.map(c => 
          c.id === charId ? { ...c, referenceImageUrl: imageUrl } : c
        );
        updateProject({ characters: newChars });
        toast.success(`${char.name} 的参考图生成成功！`);
      }
    } catch (error) {
      console.error(error);
      toast.error("图片生成失败，请重试");
    } finally {
      setGeneratingCharImageId(null);
    }
  };

  const handleGenerateAssetImage = async (assetId: string) => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject) return;
    const asset = latestProject.assets.find(a => a.id === assetId);
    if (!asset) return;

    setGeneratingAssetImageId(assetId);
    try {
      const prompt = `${asset.prompt || asset.description}. Visual style: ${latestProject.creativeVision?.visualStyle || ''}. ${latestProject.creativeVision?.globalLookTags || ''}`;
      const imageUrl = await generateAIImage({
        prompt,
        aspectRatio: asset.type === 'location' ? "16:9" : "1:1"
      });

      if (imageUrl) {
        const currentAssets = useProjectStore.getState().currentProject?.assets || [];
        const newAssets = currentAssets.map(a => 
          a.id === assetId ? { ...a, imageUrl: imageUrl } : a
        );
        updateProject({ assets: newAssets });
        toast.success(`${asset.name} 的概念图生成成功！`);
      }
    } catch (error) {
      console.error(error);
      toast.error("图片生成失败，请重试");
    } finally {
      setGeneratingAssetImageId(null);
    }
  };

  return {
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
  };
}
