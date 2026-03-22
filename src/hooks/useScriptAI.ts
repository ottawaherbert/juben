import { useState, useCallback } from "react";
import { generateAIContent, generateAIVoice } from "../services/ai";
import { Type } from "@google/genai";
import toast from "react-hot-toast";
import { SCRIPT_BLOCK_TYPES, VALUE_CHARGES } from "../constants";
import { safeParseAIResponse } from "../utils/aiParser";
import { formatCreativeVision } from "../utils/projectUtils";
import { usePromptStore } from "../store/usePromptStore";
import { useAudioPlayer } from "./useAudioPlayer";

export function useScriptAI(
  currentProject: any,
  activeEpisode: any,
  updateScene: (sceneId: string, data: any, episodeId: string) => void,
  activeSceneId: string | null
) {
  const { templates } = usePromptStore();
  const [isRewriting, setIsRewriting] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isAnalyzingPacing, setIsAnalyzingPacing] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState<string | null>(null);
  const [rewritingBlockId, setRewritingBlockId] = useState<string | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<any[] | null>(null);
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);
  const { isPlaying, play, pause } = useAudioPlayer({
    onEnded: () => setPlayingBlockId(null)
  });

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

  const activeScene = activeEpisode?.scenes.find((s: any) => s.id === activeSceneId);

  const handleAnalyzePacing = async () => {
    if (!activeEpisode || !currentProject) return;
    
    setIsAnalyzingPacing(true);
    const toastId = toast.loading("正在深度分析剧本节奏...");
    
    try {
      const updatedScenes = [];
      for (const scene of activeEpisode.scenes) {
        const scriptContent = scene.scriptBlocks 
          ? scene.scriptBlocks.map((b: any) => b.content).join('\n')
          : (scene.script || scene.description);
          
        if (!scriptContent.trim()) {
          updatedScenes.push(scene);
          continue;
        }

        try {
          const result = await generateAIContent({
            prompt: templates.analyzePacing.template.replace('{{scriptContent}}', scriptContent),
            schema: {
              type: Type.OBJECT,
              properties: {
                valueCharge: { type: Type.STRING, enum: [VALUE_CHARGES.POSITIVE, VALUE_CHARGES.NEGATIVE, VALUE_CHARGES.NEUTRAL] },
                hook: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["valueCharge", "hook", "reasoning"]
            }
          });

          const parsed = safeParseAIResponse(result, { valueCharge: scene.valueCharge, hook: scene.hook });
          updatedScenes.push({
            ...scene,
            valueCharge: parsed.valueCharge,
            hook: parsed.hook
          });
        } catch (e) {
          console.error(`Failed to analyze scene ${scene.id}:`, e);
          updatedScenes.push(scene);
        }
      }

      updatedScenes.forEach(scene => {
        updateScene(scene.id, {
          valueCharge: scene.valueCharge,
          hook: scene.hook
        }, activeEpisode.id);
      });

      toast.success("节奏分析完成！", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("分析失败，请重试", { id: toastId });
    } finally {
      setIsAnalyzingPacing(false);
    }
  };

  const handleParsePlainText = async () => {
    if (!activeScene || !activeEpisode || !activeScene.script) return;
    
    setIsRewriting(true);
    const toastId = toast.loading("正在智能解析剧本格式...");
    
    try {
      const responseText = await generateAIContent({
        prompt: templates.breakdown.template.replace('{{scriptContent}}', activeScene.script),
        requireJson: true,
        schema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: Object.values(SCRIPT_BLOCK_TYPES) },
                  content: { type: Type.STRING },
                  emotion: { type: Type.STRING, description: "如果是台词，提取其隐含的情绪" },
                  camera: { type: Type.STRING, description: "如果是动作，提取其中包含的镜头语言建议" }
                },
                required: ["type", "content"]
              }
            }
          },
          required: ["blocks"]
        }
      });

      if (responseText) {
        const parsedData = safeParseAIResponse(responseText, { blocks: [] });
        if (parsedData.blocks && parsedData.blocks.length > 0) {
          const scriptBlocks = parsedData.blocks.map((b: any) => ({
            id: crypto.randomUUID(),
            ...b
          }));
          
          if (currentProject) {
            scriptBlocks.forEach((block: any) => {
              if (block.type === SCRIPT_BLOCK_TYPES.CHARACTER) {
                const matchedChar = currentProject.characters.find((c: any) => c.name === block.content);
                if (matchedChar) block.linkedAssetId = matchedChar.id;
              } else if (block.type === SCRIPT_BLOCK_TYPES.SCENE_HEADING) {
                const matchedLoc = currentProject.assets.find((a: any) => a.type === 'location' && block.content.includes(a.name));
                if (matchedLoc) block.locationId = matchedLoc.id;
              }
              
              const matchedProps = currentProject.assets.filter((a: any) => a.type === 'prop' && block.content.includes(a.name));
              if (matchedProps.length > 0) {
                block.propIds = matchedProps.map((p: any) => p.id);
              }
            });
          }

          updateScene(activeScene.id, { scriptBlocks }, activeEpisode.id);
          toast.success("剧本解析成功！", { id: toastId });
        } else {
          toast.error("未能解析出有效的剧本块", { id: toastId });
        }
      }
    } catch (error) {
      console.error("Parse Error:", error);
      toast.error("解析失败，请检查文本格式或重试", { id: toastId });
    } finally {
      setIsRewriting(false);
    }
  };

  const handlePlayTTS = async (
    blockId: string, 
    text: string
  ) => {
    if (playingBlockId === blockId && isPlaying) {
      pause();
      setPlayingBlockId(null);
      return;
    }

    const block = activeScene?.scriptBlocks?.find((b: any) => b.id === blockId);
    if (block?.audioUrl) {
      play(block.audioUrl);
      setPlayingBlockId(blockId);
      return;
    }

    setIsGeneratingTTS(blockId);
    try {
      let voiceName = 'Kore';
      
      if (activeScene && activeScene.scriptBlocks) {
        const blockIndex = activeScene.scriptBlocks.findIndex((b: any) => b.id === blockId);
        if (blockIndex > 0) {
          for (let i = blockIndex - 1; i >= 0; i--) {
            const b = activeScene.scriptBlocks[i];
            if (b.type === 'character') {
              if (b.linkedAssetId) {
                const character = currentProject?.characters.find((c: any) => c.id === b.linkedAssetId);
                if (character && character.voiceName) {
                  voiceName = character.voiceName;
                }
              }
              break;
            }
          }
        }
      }

      const audioUrl = await generateAIVoice({
        text,
        voiceName
      });
      
      if (activeScene && activeEpisode) {
        const newBlocks = [...(activeScene.scriptBlocks || [])];
        const blockIndex = newBlocks.findIndex((b: any) => b.id === blockId);
        if (blockIndex !== -1) {
          newBlocks[blockIndex] = { ...newBlocks[blockIndex], audioUrl };
          updateScene(activeScene.id, { scriptBlocks: newBlocks }, activeEpisode.id);
        }
      }

      play(audioUrl);
      setPlayingBlockId(blockId);
    } catch (error) {
      console.error("Failed to generate TTS:", error);
      toast.error("生成语音失败");
    } finally {
      setIsGeneratingTTS(null);
    }
  };

  const handleRewriteBlock = async (blockId: string) => {
    if (!activeScene?.scriptBlocks) return;
    
    const blockIndex = activeScene.scriptBlocks.findIndex((b: any) => b.id === blockId);
    if (blockIndex === -1) return;
    
    const block = activeScene.scriptBlocks[blockIndex];

    setPromptModalState({
      isOpen: true,
      templateId: 'rewriteScriptBlock',
      variables: {
        blockType: block.type,
        blockContent: block.content
      },
      onConfirm: async (finalPrompt) => {
        setRewritingBlockId(blockId);
        try {
          const responseText = await generateAIContent({
            prompt: finalPrompt,
            requireJson: true,
            schema: {
              type: Type.OBJECT,
              properties: {
                reasoning: { type: Type.STRING },
                content: { type: Type.STRING },
                emotion: { type: Type.STRING },
                camera: { type: Type.STRING },
              },
              required: ["reasoning", "content"]
            }
          });
          if (responseText) {
            const data: any = safeParseAIResponse(responseText, {});
            if (!data.content) {
              toast.error("AI 返回的数据格式有误，请重试或切换模型。");
              return;
            }
            
            const newBlocks = [...activeScene.scriptBlocks];
            const latestBlockIndex = newBlocks.findIndex((b: any) => b.id === blockId);
            if (latestBlockIndex !== -1) {
              newBlocks[latestBlockIndex] = {
                ...newBlocks[latestBlockIndex],
                content: data.content || newBlocks[latestBlockIndex].content,
                emotion: data.emotion || newBlocks[latestBlockIndex].emotion,
                camera: data.camera || newBlocks[latestBlockIndex].camera,
              };
              
              const newScript = newBlocks.map((b: any) => {
                if (b.type === 'character') return `\n${b.content}`;
                if (b.type === 'dialogue') return `${b.content}`;
                if (b.type === 'parenthetical') return `(${b.content})`;
                return `\n${b.content}\n`;
              }).join('\n').trim();

              updateScene(activeScene.id, { scriptBlocks: newBlocks, script: newScript }, activeEpisode.id);
              toast.success("局部重写成功");
            }
          }
        } catch (e) {
          console.error(e);
          toast.error("局部重写失败");
        } finally {
          setRewritingBlockId(null);
        }
      }
    });
  };

  const handlePolishText = async (selectionRange: { start: number; end: number } | null, setSelectionRange: (range: null) => void, setMenuPosition: (pos: null) => void) => {
    if (!activeScene || !selectionRange || isPolishing) return;
    
    const selectedText = activeScene.script?.substring(selectionRange.start, selectionRange.end);
    if (!selectedText) return;

    setPromptModalState({
      isOpen: true,
      templateId: 'polishScriptText',
      variables: {
        selectedText
      },
      onConfirm: async (finalPrompt) => {
        setIsPolishing(true);
        try {
          const polishedText = await generateAIContent({ prompt: finalPrompt });
          if (polishedText) {
            const newScript = 
              (activeScene.script || "").substring(0, selectionRange.start) + 
              polishedText.trim() + 
              (activeScene.script || "").substring(selectionRange.end);
            
            updateScene(activeScene.id, { script: newScript }, activeEpisode.id);
            setSelectionRange(null);
            setMenuPosition(null);
          }
        } catch (e) {
          console.error(e);
          toast.error("润色失败");
        } finally {
          setIsPolishing(false);
        }
      }
    });
  };

  const handleShowDontTell = (selectionRange: { start: number; end: number } | null, setSelectionRange: (range: null) => void, setMenuPosition: (pos: null) => void) => {
    if (activeScene?.script && selectionRange) {
      const text = activeScene.script.substring(selectionRange.start, selectionRange.end);
      setPromptModalState({
        isOpen: true,
        templateId: 'showDontTell',
        variables: {
          selectedText: text.trim()
        },
        onConfirm: async (finalPrompt) => {
          setIsPolishing(true);
          try {
            const response = await generateAIContent({ prompt: finalPrompt });
            if (response) {
              const newScript = activeScene.script!.substring(0, selectionRange.start) + response + activeScene.script!.substring(selectionRange.end);
              updateScene(activeScene.id, { script: newScript }, activeEpisode.id);
              setSelectionRange(null);
              setMenuPosition(null);
              toast.success("转换成功！");
            }
          } catch (error) {
            console.error(error);
            toast.error("转换失败");
          } finally {
            setIsPolishing(false);
          }
        }
      });
    }
  };

  const handleSubtextAnalysis = (selectionRange: { start: number; end: number } | null, setSelectionRange: (range: null) => void, setMenuPosition: (pos: null) => void) => {
    if (activeScene?.script && selectionRange) {
      const text = activeScene.script.substring(selectionRange.start, selectionRange.end);
      setPromptModalState({
        isOpen: true,
        templateId: 'subtextAnalysis',
        variables: {
          selectedText: text.trim()
        },
        onConfirm: async (finalPrompt) => {
          setIsPolishing(true);
          try {
            const response = await generateAIContent({ prompt: finalPrompt });
            if (response) {
              toast(response, { duration: 8000, icon: '💡' });
              setSelectionRange(null);
              setMenuPosition(null);
            }
          } catch (error) {
            console.error(error);
            toast.error("分析失败");
          } finally {
            setIsPolishing(false);
          }
        }
      });
    }
  };

  const handlePrepareRewrite = () => {
    if (!activeScene || isRewriting) return;

    const systemInstruction = `## Activate Agent 3: The Writer-Director
**Profile**:
你是全球顶级的、拥有最强大脑的金牌编剧兼“作者导演”。你像大卫·芬奇或克里斯托弗·诺兰一样，拥有极强画面控制力兼顾剧本深度。你奉行"Show, Don't Tell"。
**Task**:
请根据 Agent 2 提供的节拍大纲，为指定场景撰写全格式拍摄台本 (Shooting Script)。
**Guidelines (推荐原则)**:
1. Format: 建议使用标准剧本格式（Slugline, Action, Character, Dialogue）。
2. Subtext First (潜台词优先)：尽量避免角色用嘴说出真实感受，用环境互动、停顿来体现内心情感。
3. Visual Directing: 在 Action 描写中，建议嵌入导演视角的镜头语言。
4. Pacing: 删去不必要的寒暄（进场要晚，出场要早 / Enter late, leave early）。
5. Style: 遵循项目设定的叙事风格和类型基调。
6. User Intent: 创作者的具体想法（User Intent）拥有最高优先级，请务必严格遵循创作者的指令。`;

    const activeSceneIndex = activeEpisode.scenes.findIndex((s: any) => s.id === activeScene.id);
    const creativeVision = currentProject.creativeVision;
    const stylePrompt = creativeVision ? `\n【创作视点 (Creative Vision)】\n${formatCreativeVision(creativeVision)}` : "";
    const isVertical = currentProject.aspectRatio === "9:16";
    const shortDramaInstruction = currentProject.type === 'short-drama'
      ? `\n【微短剧剧本专属要求】\n1. 极简环境：减少不必要的环境描写，直接切入核心动作或对话。\n2. 构图要求：默认画幅（${currentProject.aspectRatio || "16:9"}）${isVertical ? '，由于是竖屏，多用特写（CU）和中近景（MCU），避免大远景。' : '，请根据画幅合理安排景别。'}\n3. 台词风格：台词精炼、直接、冲突密集，甚至可以带有一点夸张和情绪化，拒绝冗长说教。\n4. 节奏极快：每个动作和对话都要推动情绪或剧情，没有废话。`
      : "";

    const tvSeriesInstruction = currentProject.type === 'tv-series'
      ? `\n【电视剧剧本专属要求】\n1. 人物关系：强调人物关系的拉扯和多线交织的自然过渡。\n2. 节奏把控：注意单场戏在整集结构中的位置，保持张弛有度。`
      : "";

    const sceneCount = activeEpisode.scenes.length || 1;
    const estimatedSceneDuration = activeScene.targetDuration 
      ? Number(activeScene.targetDuration)
      : (activeEpisode.targetDuration ? Number((activeEpisode.targetDuration / sceneCount).toFixed(1)) : null);
    
    let durationInstruction = "";
    if (estimatedSceneDuration) {
      const minWordCount = Math.ceil(estimatedSceneDuration * 240);
      durationInstruction = `\n【时长控制与物理密度】
本场景预计时长 ${estimatedSceneDuration} 分钟。
强制要求：为了达到 ${estimatedSceneDuration * 60} 秒的屏幕时间，你的描述文字必须达到至少 ${minWordCount} 字的物理规模（按中文4字/秒的语速计算）。
请运用“慢电影”手法，将一个宏观动作拆解为 5-8 个微观节拍（例如：不要只写“喝水”，要写“拿起杯子的触感、杯中水的震荡、喉结的起伏、放下杯子时桌面的回响”）。`;
    }

    const contextOptions = activeEpisode.scenes.map((s: any, idx: number) => ({
      id: s.id,
      label: `第 ${idx + 1} 场: ${s.title}`,
      value: `[作为上下文参考的相邻场景] 【第 ${idx + 1} 场: ${s.title}】\n描述: ${s.description}\n剧本:\n${s.script || "(空)"}`
    }));

    const defaultSelectedContextIds: string[] = [];
    if (activeSceneIndex > 0) {
      for (let i = Math.max(0, activeSceneIndex - 2); i < activeSceneIndex; i++) {
        defaultSelectedContextIds.push(activeEpisode.scenes[i].id);
      }
    }

    if (currentProject.characters) {
      currentProject.characters.forEach((char: any) => {
        contextOptions.push({
          id: `char-${char.id}`,
          label: `角色档案: ${char.name}`,
          value: `[角色心理档案] 【${char.name}】\n内在渴望 (Internal Desire): ${char.internalDesire || '未知'}\n外在目标 (External Goal): ${char.externalGoal || '未知'}\n致命弱点 (Fatal Flaw): ${char.flaw || '未知'}`
        });
        if (activeScene.title.includes(char.name) || (activeScene.description && activeScene.description.includes(char.name))) {
          defaultSelectedContextIds.push(`char-${char.id}`);
        }
      });
    }

    const isActionScene = activeScene.description?.toLowerCase().includes('action') || 
                          activeScene.description?.includes('打斗') || 
                          activeScene.description?.includes('追逐');
    const dialogueActionRatio = isActionScene ? 1 : 3;

    const registeredAssets = [
      ...currentProject.characters.map((c: any) => `角色: ${c.name}`),
      ...currentProject.assets.filter((a: any) => a.type === 'location').map((a: any) => `场景: ${a.name}`),
      ...currentProject.assets.filter((a: any) => a.type === 'prop').map((a: any) => `道具: ${a.name}`)
    ].join('\n');

    setPromptModalState({
      isOpen: true,
      templateId: 'generateScript',
      variables: {
        logline: currentProject.logline,
        coreConflict: currentProject.coreConflict,
        stylePrompt,
        shortDramaInstruction,
        tvSeriesInstruction,
        durationInstruction,
        dialogueActionRatio: dialogueActionRatio.toString(),
        sequenceTitle: activeEpisode.title || "未命名",
        sequenceDescription: activeEpisode.inspiration || "(无)",
        sceneNumber: (activeSceneIndex + 1).toString(),
        sceneTitle: activeScene.title,
        sceneDescription: activeScene.description,
        currentScript: activeScene.script || "(空)",
        registeredAssets: registeredAssets || "(当前暂无已注册的资产)"
      },
      contextOptions,
      defaultSelectedContextIds,
      onConfirm: async (finalPrompt) => {
        setIsRewriting(true);
        try {
          const responseText = await generateAIContent({
            prompt: finalPrompt,
            systemInstruction,
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
                      sceneOutline: { type: Type.STRING },
                      breakdown: {
                        type: Type.OBJECT,
                        properties: {
                          setting: { type: Type.STRING },
                          location: { type: Type.STRING },
                          time: { type: Type.STRING },
                          characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                          props: { type: Type.ARRAY, items: { type: Type.STRING } },
                          vfx: { type: Type.ARRAY, items: { type: Type.STRING } },
                          sfx: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["setting", "location", "time", "characters", "props"]
                      },
                      blocks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            type: { type: Type.STRING },
                            content: { type: Type.STRING },
                            camera: { type: Type.STRING }
                          },
                          required: ["type", "content"]
                        }
                      }
                    },
                    required: ["optionId", "optionDescription", "sceneOutline", "breakdown", "blocks"]
                  }
                }
              },
              required: ["options"]
            }
          });

          if (responseText) {
            const data = safeParseAIResponse(responseText, { options: [] });
            if (data.options && data.options.length > 0) {
              setGeneratedOptions(data.options);
            }
          }
        } catch (e) {
          console.error(e);
          toast.error("生成剧本失败");
        } finally {
          setIsRewriting(false);
        }
      }
    });
  };

  const handleSelectOption = (option: any) => {
    setGeneratedOptions(null);
    if (!activeScene || !activeEpisode) return;

    const scriptBlocks = option.blocks.map((b: any) => {
      const block: any = {
        id: crypto.randomUUID(),
        type: b.type,
        content: b.content,
        emotion: b.emotion,
        camera: b.camera
      };

      // Auto-link assets if they match existing ones
      if (b.type === 'character' && currentProject) {
        const matchedChar = currentProject.characters.find((c: any) => c.name === b.content);
        if (matchedChar) {
          block.linkedAssetId = matchedChar.id;
        }
      } else if (b.type === 'scene_heading' && currentProject) {
        const matchedLoc = currentProject.assets.find((a: any) => a.type === 'location' && b.content.includes(a.name));
        if (matchedLoc) {
          block.locationId = matchedLoc.id;
        }
      }

      // Auto-link props
      if (currentProject && currentProject.assets) {
        const matchedProps = currentProject.assets.filter((a: any) => a.type === 'prop' && b.content.includes(a.name));
        if (matchedProps.length > 0) {
          block.propIds = matchedProps.map((p: any) => p.id);
        }
      }

      return block;
    });

    // Also generate a plain text version for backward compatibility
    const plainText = scriptBlocks.map((b: any) => {
      if (b.type === 'character') return `\n${b.content}`;
      if (b.type === 'dialogue') return `${b.content}`;
      if (b.type === 'parenthetical') return `(${b.content})`;
      return `\n${b.content}\n`;
    }).join('\n').trim();
    
    // Process breakdown to link IDs
    const processedBreakdown = { ...option.breakdown };
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
    
    updateScene(activeScene.id, { scriptBlocks, script: plainText, breakdown: processedBreakdown }, activeEpisode.id);
    toast.success("剧本生成成功");

    // Automatic Script Scanning for new assets
    if (currentProject && option.breakdown) {
      const existingCharacters = currentProject.characters.map((c: any) => c.name) || [];
      const newCharacters = option.breakdown.characters?.filter((c: string) => !existingCharacters.includes(c)) || [];
      
      const existingProps = currentProject.assets?.filter((a: any) => a.type === 'prop').map((a: any) => a.name) || [];
      const newProps = option.breakdown.props?.filter((p: string) => !existingProps.includes(p)) || [];
      
      const newAssets = [];
      if (newCharacters.length > 0) newAssets.push(`角色: ${newCharacters.join(', ')}`);
      if (newProps.length > 0) newAssets.push(`道具: ${newProps.join(', ')}`);
      
      if (newAssets.length > 0) {
        toast.success(`发现新资产：${newAssets.join('; ')}。请前往资产库补全设定。`, { duration: 6000 });
      }
    }
  };

  return {
    isRewriting,
    isPolishing,
    isAnalyzingPacing,
    isGeneratingTTS,
    playingBlockId,
    rewritingBlockId,
    generatedOptions,
    setGeneratedOptions,
    promptModalState,
    setPromptModalState,
    handleAnalyzePacing,
    handleParsePlainText,
    handlePlayTTS,
    handleRewriteBlock,
    handlePolishText,
    handleShowDontTell,
    handleSubtextAnalysis,
    handleSelectOption,
    handlePrepareRewrite
  };
}
