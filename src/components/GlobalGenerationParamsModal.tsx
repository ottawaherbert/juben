import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings2, Save } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

interface GlobalGenerationParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalGenerationParamsModal({ isOpen, onClose }: GlobalGenerationParamsModalProps) {
  const { currentProject, updateProject } = useProjectStore();
  
  const [qualityPrompt, setQualityPrompt] = useState(currentProject?.globalGenerationParams?.qualityPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState(currentProject?.globalGenerationParams?.negativePrompt || '');
  const [aspectRatio, setAspectRatio] = useState(currentProject?.aspectRatio || '16:9');

  useEffect(() => {
    if (isOpen && currentProject) {
      setQualityPrompt(currentProject.globalGenerationParams?.qualityPrompt || '');
      setNegativePrompt(currentProject.globalGenerationParams?.negativePrompt || '');
      setAspectRatio(currentProject.aspectRatio || '16:9');
    }
  }, [isOpen, currentProject]);

  if (!isOpen || !currentProject) return null;

  const handleSave = () => {
    updateProject({
      aspectRatio,
      globalGenerationParams: {
        qualityPrompt,
        negativePrompt
      }
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-emerald-500" />
              全局生图参数配置
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                画质词 (Quality Prompt)
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                这些词将自动追加到每个镜头的画面提示词中，用于统一控制整体画质和风格。
              </p>
              <textarea
                value={qualityPrompt}
                onChange={(e) => setQualityPrompt(e.target.value)}
                placeholder="例如：masterpiece, best quality, ultra-detailed, 8k resolution..."
                className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                负面提示词 (Negative Prompt)
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                告诉 AI 不希望在画面中出现的元素。
              </p>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="例如：lowres, bad anatomy, bad hands, text, error, missing fingers..."
                className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none custom-scrollbar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                长宽比 (Aspect Ratio)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['16:9', '9:16', '2.39:1', '1:1', '4:3'].map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      aspectRatio === ar
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
