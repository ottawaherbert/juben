import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Send, RotateCcw, Code, Eye, CheckSquare, Square } from 'lucide-react';
import { usePromptStore } from '../store/usePromptStore';
import toast from 'react-hot-toast';

export interface ContextOption {
  id: string;
  label: string;
  value: string;
}

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  variables: Record<string, string>;
  onConfirm: (finalPrompt: string) => void;
  title?: string;
  contextOptions?: ContextOption[];
  defaultSelectedContextIds?: string[];
}

const EMPTY_ARRAY: string[] = [];

export default function PromptEditorModal({
  isOpen,
  onClose,
  templateId,
  variables,
  onConfirm,
  title = "AI 提示词编辑",
  contextOptions,
  defaultSelectedContextIds = EMPTY_ARRAY
}: PromptEditorModalProps) {
  const { templates, updateTemplate, resetTemplate } = usePromptStore();
  const templateObj = templates[templateId];
  
  const [activeTab, setActiveTab] = useState<'preview' | 'template'>('preview');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>(defaultSelectedContextIds);
  const [userIntent, setUserIntent] = useState('');

  useEffect(() => {
    if (isOpen && templateObj) {
      setCurrentTemplate(templateObj.template);
      setSelectedContextIds(defaultSelectedContextIds);
      setUserIntent('');
      setActiveTab('preview');
    }
  }, [isOpen, templateObj, defaultSelectedContextIds]);

  useEffect(() => {
    if (isOpen && templateObj) {
      setCurrentPrompt(replaceVariables(currentTemplate, variables, selectedContextIds, userIntent));
    }
  }, [currentTemplate, variables, selectedContextIds, userIntent, isOpen, templateObj, contextOptions]);

  const replaceVariables = (tpl: string, vars: Record<string, string>, selectedIds: string[], intent: string) => {
    let content = tpl;
    for (const [key, value] of Object.entries(vars)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), () => value || '');
    }
    
    let selectedContextText = '';
    if (contextOptions) {
      selectedContextText = contextOptions
        .filter(opt => selectedIds.includes(opt.id))
        .map(opt => opt.value)
        .join('\n\n');
    }
    content = content.replace(/{{selectedContext}}/g, () => selectedContextText);
    
    content = content.replace(/{{userIntent}}/g, () => intent || '无特定要求，请自由发挥。');
    
    // Clean up empty sections (e.g., 【核心角色】 followed immediately by another 【...】 or end of string)
    // We run this in a loop just in case, though the lookahead usually handles consecutive matches.
    let previousContent;
    do {
      previousContent = content;
      content = content.replace(/【[^】]+】[:：]?\n\s*(?=【|$)/g, '');
    } while (content !== previousContent);
    
    return content.trim();
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentTemplate(e.target.value);
  };

  const toggleContextOption = (id: string) => {
    setSelectedContextIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSaveTemplate = () => {
    updateTemplate(templateId, currentTemplate);
    toast.success('模板已保存');
  };

  const handleResetTemplate = () => {
    resetTemplate(templateId);
    const defaultTpl = usePromptStore.getState().templates[templateId].template;
    setCurrentTemplate(defaultTpl);
    toast.success('已恢复默认模板');
  };

  if (!isOpen || !templateObj) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-neutral-500 mt-1">模板: {templateObj.name}</p>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar: Variables */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-950/30 p-4 overflow-y-auto custom-scrollbar">
              {contextOptions && contextOptions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">参考上下文</h4>
                  <div className="space-y-2">
                    {contextOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleContextOption(opt.id)}
                        className="w-full flex items-start gap-2 text-left p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <div className="mt-0.5 text-emerald-500">
                          {selectedContextIds.includes(opt.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600" />
                          )}
                        </div>
                        <span className="text-xs text-neutral-300">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-neutral-500">
                    在模板中使用 <span className="font-mono text-emerald-500">{"{{selectedContext}}"}</span> 插入选中的内容。
                  </div>
                </div>
              )}

              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">可用上下文变量</h4>
              <div className="space-y-3">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                    <div className="text-xs font-mono text-emerald-500 mb-1">{`{{${key}}}`}</div>
                    <div className="text-xs text-neutral-400 truncate" title={value}>{value || '(空)'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center border-b border-neutral-800 bg-neutral-900">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'preview' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
                >
                  <Eye className="w-4 h-4" />
                  预览并发送
                </button>
                <button
                  onClick={() => setActiveTab('template')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'template' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
                >
                  <Code className="w-4 h-4" />
                  编辑模板
                </button>
              </div>

              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                {activeTab === 'preview' ? (
                  <div className="flex-1 flex flex-col gap-4">
                    {currentTemplate.includes('{{userIntent}}') && (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                          创作者指令 (User Intent)
                          <span className="text-xs font-normal text-neutral-400">
                            您对这一段有什么具体想法？（例如：这里我想加一场追车戏，或者，这一集是独立的单元剧故事）
                          </span>
                        </label>
                        <textarea
                          value={userIntent}
                          onChange={(e) => setUserIntent(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-300 resize-none focus:outline-none focus:border-emerald-500/50 custom-scrollbar min-h-[80px]"
                          placeholder="输入您的具体想法，AI 将严格遵循..."
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-sm font-bold text-neutral-400">最终发送的提示词预览</label>
                      <textarea
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        className="flex-1 w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 resize-none focus:outline-none focus:border-emerald-500/50 custom-scrollbar"
                        placeholder="最终发送给 AI 的提示词..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={currentTemplate}
                      onChange={handleTemplateChange}
                      className="flex-1 w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 resize-none focus:outline-none focus:border-purple-500/50 custom-scrollbar font-mono"
                      placeholder="使用 {{变量名}} 插入上下文..."
                    />
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={handleResetTemplate}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        恢复默认
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        保存模板
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                onConfirm(currentPrompt);
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Send className="w-4 h-4" />
              确认并发送
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
