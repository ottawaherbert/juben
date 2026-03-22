import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Loader2, BookOpen } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { BeatTemplate } from '../types/project';
import { generateAIContent } from '../services/ai';
import { Type } from '@google/genai';
import toast from 'react-hot-toast';

interface EpisodeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (skeletonId: string, beatId: string) => void;
}

import { FORMAT_ROUTING } from '../config/templates';

export default function EpisodeTemplateModal({ isOpen, onClose, onSelect }: EpisodeTemplateModalProps) {
  const { currentProject, updateProject } = useProjectStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceWork, setReferenceWork] = useState('');
  const [activeTab, setActiveTab] = useState<'skeleton' | 'beat'>('skeleton');

  const format = currentProject?.type || 'movie';
  const formatTemplates = FORMAT_ROUTING[format] || FORMAT_ROUTING['movie'];
  const defaultSkeletons = formatTemplates.skeletons;
  const defaultBeats = formatTemplates.beats;

  const [selectedSkeletonId, setSelectedSkeletonId] = useState(defaultSkeletons[0]?.id);
  const [selectedBeatId, setSelectedBeatId] = useState(defaultBeats[0]?.id);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedSkeletonId(defaultSkeletons[0]?.id);
      setSelectedBeatId(defaultBeats[0]?.id);
      setActiveTab('skeleton');
    }
  }, [isOpen, currentProject?.type]);

  const customSkeletons = (currentProject?.customTemplates || []).filter(t => t.id.startsWith('custom-skel-'));
  const customBeats = (currentProject?.customTemplates || []).filter(t => t.id.startsWith('custom-beat-'));

  const allSkeletons = [...defaultSkeletons, ...customSkeletons];
  const allBeats = [...defaultBeats, ...customBeats];

  const handleGenerateTemplate = async () => {
    if (!referenceWork.trim() || isGenerating || !currentProject) return;
    
    setIsGenerating(true);
    try {
      const typeStr = activeTab === 'skeleton' ? '宏观结构骨架' : '内部节拍特征';
      const prompt = `【角色设定】
你是全球顶级的、拥有最强大脑的资深剧作分析师。你阅片无数，能够像庖丁解牛一样，将任何经典影视作品的叙事段落拆解为可复用的宏观结构或内部节拍模板。

【任务目标】
请分析作品《${referenceWork}》的${typeStr}，并将其总结为一个通用的模板。
请返回一个 JSON 对象，包含：
1. name: 模板名称（例如："《${referenceWork}》式${typeStr}"）
2. description: 简短描述这个结构适合什么样的故事（一两句话）。
3. instruction: 给 AI 的详细指令，说明如何按照这个模板来规划。必须列出该结构的所有关键阶段。

格式示例：
{
  "name": "《盗梦空间》式多层嵌套结构",
  "description": "适合悬疑、科幻类，包含多层梦境或多线并行的复杂叙事。",
  "instruction": "请按照多层嵌套结构规划段落：1. 现实基准线建立 2. 第一层进入 3. 第二层深入 4. 核心危机(Kick) 5. 逐层苏醒..."
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
          id: `custom-${activeTab}-${Date.now()}`,
          name: data.name,
          description: data.description,
          instruction: data.instruction
        };

        const updatedTemplates = [...(currentProject.customTemplates || []), newTemplate];
        await updateProject({ customTemplates: updatedTemplates });
        
        if (activeTab === 'skeleton') {
          setSelectedSkeletonId(newTemplate.id);
        } else {
          setSelectedBeatId(newTemplate.id);
        }
        
        setReferenceWork('');
        toast.success(`自定义${typeStr}模板生成成功！`);
      }
    } catch (e) {
      console.error(e);
      toast.error('生成模板失败');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'skeleton' ? allSkeletons : allBeats;
  const currentSelectedId = activeTab === 'skeleton' ? selectedSkeletonId : selectedBeatId;
  const setCurrentSelectedId = activeTab === 'skeleton' ? setSelectedSkeletonId : setSelectedBeatId;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">选择宏观结构模板</h2>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('skeleton')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'skeleton' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              1. 结构骨架 (Skeleton)
            </button>
            <button
              onClick={() => setActiveTab('beat')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'beat' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              2. 内部节拍 (Beats)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentList.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setCurrentSelectedId(template.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    currentSelectedId === template.id 
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50' 
                      : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800'
                  }`}
                >
                  <div className={`font-bold text-sm mb-1 ${currentSelectedId === template.id ? 'text-emerald-400' : 'text-white'}`}>
                    {template.name}
                  </div>
                  <div className="text-xs text-neutral-400 leading-relaxed">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">AI 提取自定义{activeTab === 'skeleton' ? '骨架' : '节拍'}</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                输入一部你喜欢的影视作品名称，AI 将自动分析其{activeTab === 'skeleton' ? '宏观结构骨架' : '内部节拍特征'}并生成模板。
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={referenceWork}
                  onChange={(e) => setReferenceWork(e.target.value)}
                  placeholder="例如：盗梦空间、绝命毒师、黑暗荣耀..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerateTemplate();
                  }}
                />
                <button
                  onClick={handleGenerateTemplate}
                  disabled={!referenceWork.trim() || isGenerating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : '提取模板'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              已选择: <span className="text-white font-medium">{allSkeletons.find(t => t.id === selectedSkeletonId)?.name}</span> + <span className="text-white font-medium">{allBeats.find(t => t.id === selectedBeatId)?.name}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedSkeletonId && selectedBeatId) {
                    onSelect(selectedSkeletonId, selectedBeatId);
                  }
                }}
                disabled={!selectedSkeletonId || !selectedBeatId}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                确认选择
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
