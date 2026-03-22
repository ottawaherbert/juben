import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Wand2 } from "lucide-react";

interface ScriptOptionsModalProps {
  generatedOptions: any[] | null;
  onSelectOption: (option: any) => void;
  onClose: () => void;
}

export const ScriptOptionsModal: React.FC<ScriptOptionsModalProps> = ({
  generatedOptions,
  onSelectOption,
  onClose
}) => {
  return (
    <AnimatePresence>
      {generatedOptions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6 shrink-0">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Wand2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">选择生成方案</h3>
                <p className="text-sm text-neutral-400">AI 为您提供了以下不同走向的剧本方案，请选择最符合您意图的一个。</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {generatedOptions.map((option, index) => (
                <div key={index} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-emerald-400 mb-1">方案 {index + 1}</h4>
                      <p className="text-sm text-neutral-300">{option.optionDescription}</p>
                    </div>
                    <button
                      onClick={() => onSelectOption(option)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors shrink-0"
                    >
                      选择此方案
                    </button>
                  </div>
                  <div className="space-y-3">
                    {option.blocks.slice(0, 5).map((block: any, blockIdx: number) => (
                      <div key={blockIdx} className="bg-neutral-900 rounded-xl p-3">
                        <div className="text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider">{block.type}</div>
                        <div className="text-sm text-white line-clamp-2">{block.content}</div>
                      </div>
                    ))}
                    {option.blocks.length > 5 && (
                      <div className="text-xs text-neutral-500 text-center pt-2">
                        ... 以及其他 {option.blocks.length - 5} 个剧本块
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
              >
                取消
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
