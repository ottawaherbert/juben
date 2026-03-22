import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Loader2, BookOpen, Stethoscope } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { BeatTemplate } from '../types/project';
import { generateAIContent } from '../services/ai';
import { Type } from '@google/genai';
import toast from 'react-hot-toast';
import { FORMAT_ROUTING } from '../config/templates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  setPromptModalState?: (state: any) => void;
}

export default function TemplateModal({ isOpen, onClose, onSelect, setPromptModalState }: TemplateModalProps) {
  const { currentProject, updateProject } = useProjectStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [referenceWork, setReferenceWork] = useState('');

  const format = currentProject?.type || 'movie';
  const formatTemplates = FORMAT_ROUTING[format] || FORMAT_ROUTING['movie'];
  const defaultTemplates = formatTemplates.sceneTemplates;

  const [selectedId, setSelectedId] = useState(defaultTemplates[0]?.id);

  // Reset selectedId when project type changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedId(defaultTemplates[0]?.id);
    }
  }, [isOpen, currentProject?.type]);

  const customTemplates = (currentProject?.customTemplates || []).filter(t => !t.id.startsWith('custom-macro-'));

  const allTemplates = [
    ...defaultTemplates,
    ...customTemplates
  ];

  const handleDoctorDiagnose = async () => {
    if (isDiagnosing || !currentProject) return;
    
    const activeEpisode = useProjectStore.getState().activeEpisode;
    if (!activeEpisode) {
      toast.error("未找到当前段落信息");
      return;
    }

    const otherEpisodesContext = currentProject.episodes
      .map((ep, idx) => ({ ep, originalIndex: idx + 1 }))
      .filter(({ ep }) => ep.id !== activeEpisode.id)
      .map(({ ep, originalIndex }) => `第 ${originalIndex} 集/段落: ${ep.title}\n梗概: ${ep.inspiration}`)
      .join('\n\n') || '无';

    const projectTypeName = currentProject.type === 'movie' ? '电影' : currentProject.type === 'tv-series' ? '电视剧' : '微短剧';
    const targetDuration = activeEpisode.targetDuration ? `${activeEpisode.targetDuration} 分钟` : '未知时长';

    if (setPromptModalState) {
      setPromptModalState({
        isOpen: true,
        templateId: 'doctorDiagnose',
        variables: {
          logline: currentProject.logline,
          coreConflict: currentProject.coreConflict,
          otherEpisodesContext,
          episodeTitle: activeEpisode.title,
          episodeInspiration: activeEpisode.inspiration || "(无)",
          projectTypeName,
          targetDuration
        },
        onConfirm: async (finalPrompt: string) => {
          setIsDiagnosing(true);
          try {
            const responseText = await generateAIContent({
              prompt: finalPrompt,
              requireJson: true,
              schema: {
                type: Type.OBJECT,
                properties: {
                  diagnosis: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                },
                required: ["diagnosis", "name", "description", "instruction"]
              }
            });

            if (responseText) {
              const data = JSON.parse(responseText);
              const newTemplate: BeatTemplate = {
                id: `custom-doctor-${Date.now()}`,
                name: `[剧本医生] ${data.name}`,
                description: data.description,
                instruction: `【剧本医生诊断】\n${data.diagnosis}\n\n【节拍指令】\n${data.instruction}`
              };

              const updatedTemplates = [newTemplate, ...(currentProject.customTemplates || [])];
              await updateProject({ customTemplates: updatedTemplates });
              setSelectedId(newTemplate.id);
              toast.success('剧本医生诊断并生成模板成功！');
            }
          } catch (e) {
            console.error(e);
            toast.error('剧本医生诊断失败');
          } finally {
            setIsDiagnosing(false);
          }
        }
      });
    }
  };

  const handleDiagnoseSelectedTemplate = async () => {
    const selected = allTemplates.find(t => t.id === selectedId);
    if (isDiagnosing || !currentProject || !selected) return;
    
    const activeEpisode = useProjectStore.getState().activeEpisode;
    if (!activeEpisode) {
      toast.error("未找到当前段落信息");
      return;
    }

    const otherEpisodesContext = currentProject.episodes
      .map((ep, idx) => ({ ep, originalIndex: idx + 1 }))
      .filter(({ ep }) => ep.id !== activeEpisode.id)
      .map(({ ep, originalIndex }) => `第 ${originalIndex} 集/段落: ${ep.title}\n梗概: ${ep.inspiration}`)
      .join('\n\n') || '无';

    const projectTypeName = currentProject.type === 'movie' ? '电影' : currentProject.type === 'tv-series' ? '电视剧' : '微短剧';
    const targetDuration = activeEpisode.targetDuration ? `${activeEpisode.targetDuration} 分钟` : '未知时长';

    if (setPromptModalState) {
      setPromptModalState({
        isOpen: true,
        templateId: 'diagnoseSelectedTemplate',
        variables: {
          logline: currentProject.logline,
          coreConflict: currentProject.coreConflict,
          otherEpisodesContext,
          episodeTitle: activeEpisode.title,
          episodeInspiration: activeEpisode.inspiration || "(无)",
          templateName: selected.name,
          templateDescription: selected.description,
          templateInstruction: selected.instruction,
          projectTypeName,
          targetDuration
        },
        onConfirm: async (finalPrompt: string) => {
          setIsDiagnosing(true);
          try {
            const responseText = await generateAIContent({
              prompt: finalPrompt,
              requireJson: true,
              schema: {
                type: Type.OBJECT,
                properties: {
                  diagnosis: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                },
                required: ["diagnosis", "name", "description", "instruction"]
              }
            });

            if (responseText) {
              const data = JSON.parse(responseText);
              const newTemplate: BeatTemplate = {
                id: `custom-doctor-${Date.now()}`,
                name: data.name,
                description: data.description,
                instruction: `【剧本医生诊断】\n${data.diagnosis}\n\n【节拍指令】\n${data.instruction}`
              };

              const updatedTemplates = [newTemplate, ...(currentProject.customTemplates || [])];
              await updateProject({ customTemplates: updatedTemplates });
              setSelectedId(newTemplate.id);
              toast.success('剧本医生诊断并优化模板成功！');
            }
          } catch (e) {
            console.error(e);
            toast.error('剧本医生诊断失败');
          } finally {
            setIsDiagnosing(false);
          }
        }
      });
    }
  };

  const handleGenerateTemplate = async () => {
    if (!referenceWork.trim() || isGenerating || !currentProject) return;
    
    setIsGenerating(true);
    try {
      const prompt = `【角色设定】
你是全球顶级的、拥有最强大脑的资深剧作分析师。你阅片无数，能够像庖丁解牛一样，将任何经典影视作品的叙事段落拆解为可复用的微观结构模板。

【任务目标】
请分析作品《${referenceWork}》中某个经典段落（Sequence）的叙事结构，并将其总结为一个通用的“微观场景模板”。
请返回一个 JSON 对象，包含：
1. name: 模板名称（例如："《${referenceWork}》式动作段落" 或该作品特有的微观结构名称）
2. description: 简短描述这个微观结构适合什么样的 10 分钟左右的段落（一两句话）。
3. instruction: 给 AI 的详细指令，说明如何按照这个结构来拆解 3-5 个场景。必须列出该结构的所有关键节拍/阶段。

格式示例：
{
  "name": "《盗梦空间》式多层嵌套段落",
  "description": "适合悬疑、科幻类，包含多层梦境或多线并行的复杂叙事段落。",
  "instruction": "请按照多层嵌套结构拆解场景：1. 现实基准线建立 2. 第一层进入 3. 第二层深入 4. 核心危机(Kick) 5. 逐层苏醒..."
}`;

      const responseText = await generateAIContent({
        prompt,
        requireJson: true,
        schema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            instruction: { type: Type.STRING },
          },
          required: ["name", "description", "instruction"]
        }
      });
      if (responseText) {
        const data = JSON.parse(responseText);
        const newTemplate: BeatTemplate = {
          id: `custom-${Date.now()}`,
          name: data.name,
          description: data.description,
          instruction: data.instruction
        };

        const updatedTemplates = [...(currentProject.customTemplates || []), newTemplate];
        await updateProject({ customTemplates: updatedTemplates });
        setSelectedId(newTemplate.id);
        setReferenceWork('');
        toast.success('自定义模板生成成功！');
      }
    } catch (e) {
      console.error(e);
      toast.error('生成模板失败');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              选择节拍模板
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Template List */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 shrink-0 flex flex-col gap-4">
                <button
                  onClick={handleDoctorDiagnose}
                  disabled={isDiagnosing}
                  className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDiagnosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
                  剧本医生：智能诊断与定制模板
                </button>

                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">参考作品生成模板</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referenceWork}
                      onChange={(e) => setReferenceWork(e.target.value)}
                      placeholder="输入参考作品，如：权力的游戏"
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateTemplate()}
                    />
                    <button
                      onClick={handleGenerateTemplate}
                      disabled={isGenerating || !referenceWork.trim()}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      生成
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {allTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedId(template.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedId === template.id 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`font-bold text-sm mb-1 ${selectedId === template.id ? 'text-emerald-400' : 'text-white'}`}>
                      {template.name}
                    </div>
                    <div className="text-xs text-neutral-500 line-clamp-2">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Details */}
            <div className="w-full md:w-1/2 bg-neutral-950 flex flex-col overflow-hidden">
              {(() => {
                const selected = allTemplates.find(t => t.id === selectedId);
                if (!selected) return null;
                return (
                  <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                      <button
                        onClick={handleDiagnoseSelectedTemplate}
                        disabled={isDiagnosing}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                      >
                        {isDiagnosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Stethoscope className="w-3 h-3" />}
                        诊断此模板
                      </button>
                    </div>
                    <p className="text-sm text-neutral-400 mb-6">{selected.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">结构指令 (Instruction)</h4>
                      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {selected.instruction}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="p-6 border-t border-neutral-800 shrink-0">
                <button
                  onClick={() => {
                    onSelect(selectedId);
                    onClose();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
                >
                  使用此模板生成节拍
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
