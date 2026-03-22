import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Wand2, Loader2, AlertTriangle } from "lucide-react";
import { Project } from "../../types/project";

interface GenerateEpisodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  selectedSkeletonId: string;
  selectedBeatId: string;
  genCount: number;
  genDuration: number;
  isGenerating: boolean;
  isRecommending: boolean;
  isDiagnosing: boolean;
  recommendation: any;
  diagnosis: any;
  debugPrompt: string;
  showDebug: boolean;
  onSetGenCount: (count: number) => void;
  onSetGenDuration: (duration: number) => void;
  onOpenTemplateModal: () => void;
  onPrepareGenerate: (count: number, duration: number) => void;
  onRecommend: () => void;
  onDiagnose: () => void;
  onApplyRecommendation: (skelId: string, beatId: string) => void;
  onToggleDebug: () => void;
  getAllSkeletons: () => any[];
  getAllBeats: () => any[];
}

export const GenerateEpisodesModal: React.FC<GenerateEpisodesModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  selectedSkeletonId,
  selectedBeatId,
  genCount,
  genDuration,
  isGenerating,
  isRecommending,
  isDiagnosing,
  recommendation,
  diagnosis,
  debugPrompt,
  showDebug,
  onSetGenCount,
  onSetGenDuration,
  onOpenTemplateModal,
  onPrepareGenerate,
  onRecommend,
  onDiagnose,
  onApplyRecommendation,
  onToggleDebug,
  getAllSkeletons,
  getAllBeats
}) => {
  const isMovie = currentProject.type === 'movie';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl flex flex-col md:flex-row gap-6"
          >
            {/* Left Column: Settings */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Wand2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI 自动划分</h3>
                  <p className="text-sm text-neutral-400">设置生成参数</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    选择宏观结构模板
                  </label>
                  <button
                    onClick={onOpenTemplateModal}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-emerald-500/50 transition-colors flex justify-between items-center"
                  >
                    <span>
                      {(() => {
                        if (!selectedSkeletonId || !selectedBeatId) {
                          return <span className="text-neutral-500">请选择骨架与节拍</span>;
                        }
                        const allSkeletons = getAllSkeletons();
                        const allBeats = getAllBeats();
                        
                        const skelName = allSkeletons.find(t => t.id === selectedSkeletonId)?.name || '未知骨架';
                        const beatName = allBeats.find(t => t.id === selectedBeatId)?.name || '未知节拍';
                        
                        return `${skelName} + ${beatName}`;
                      })()}
                    </span>
                    <span className="text-emerald-500 text-xs">更改</span>
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    生成数量 ({isMovie ? "段落" : "篇章/集数"})
                  </label>
                  {(() => {
                    const allSkeletons = getAllSkeletons();
                    const skeleton = allSkeletons.find(t => t.id === selectedSkeletonId);
                    
                    if (skeleton?.fixedCount) {
                      return (
                        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed">
                          {skeleton.fixedCount} (由骨架决定)
                        </div>
                      );
                    }
                    
                    return (
                      <input
                        type="number"
                        value={genCount}
                        onChange={(e) => onSetGenCount(parseInt(e.target.value) || 1)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        min="1"
                        max="50"
                      />
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    单{isMovie ? "段落" : "集"}预计时长 (分钟)
                  </label>
                  <input
                    type="number"
                    value={genDuration}
                    onChange={(e) => onSetGenDuration(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => onPrepareGenerate(genCount, genDuration)}
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  开始生成
                </button>
              </div>
            </div>

            {/* Right Column: Script Doctor */}
            <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Wand2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-bold text-white">剧本医生</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onRecommend}
                    disabled={isRecommending || isDiagnosing}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isRecommending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    获取 AI 推荐
                  </button>
                  <button
                    onClick={onDiagnose}
                    disabled={isRecommending || isDiagnosing || !selectedSkeletonId || !selectedBeatId}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isDiagnosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    诊断当前组合
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {isRecommending || isDiagnosing ? (
                  <div className="flex flex-col items-center justify-center text-neutral-500 py-12 space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-sm">{isRecommending ? '正在分析项目圣经并生成推荐...' : '正在诊断当前结构组合...'}</p>
                  </div>
                ) : (
                  <>
                    {!recommendation && !diagnosis && (
                      <div className="flex flex-col items-center justify-center text-neutral-500 py-12 text-sm text-center px-4">
                        <p className="mb-2">点击上方按钮获取 AI 结构推荐，或对当前选择的结构进行诊断。</p>
                      </div>
                    )}

                    {recommendation && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-sm font-bold text-blue-400 uppercase tracking-wider">AI 最优推荐</h5>
                          <button
                            onClick={() => {
                              const allSkeletons = getAllSkeletons();
                              const allBeats = getAllBeats();
                              
                              const recommendedSkel = allSkeletons.find(t => t.name.includes(recommendation.recommendedSkeleton) || recommendation.recommendedSkeleton.includes(t.name));
                              const recommendedBeat = allBeats.find(t => t.name.includes(recommendation.recommendedBeats) || recommendation.recommendedBeats.includes(t.name));
                              
                              if (recommendedSkel && recommendedBeat) {
                                onApplyRecommendation(recommendedSkel.id, recommendedBeat.id);
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-bold transition-colors"
                          >
                            应用推荐
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm text-blue-300 flex items-start gap-2 bg-blue-950/50 p-2 rounded-lg">
                            <span className="font-bold shrink-0">骨架：</span>
                            <span>{recommendation.recommendedSkeleton}</span>
                          </div>
                          <div className="text-sm text-blue-300 flex items-start gap-2 bg-blue-950/50 p-2 rounded-lg">
                            <span className="font-bold shrink-0">节拍：</span>
                            <span>{recommendation.recommendedBeats}</span>
                          </div>
                          <div className="mt-3">
                            <h6 className="text-xs font-bold text-blue-500/70 uppercase mb-1">推荐理由</h6>
                            <p className="text-sm text-blue-200/80 leading-relaxed">{recommendation.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {diagnosis && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                          <span className="text-sm font-bold text-neutral-300">匹配度得分</span>
                          <span className={`text-3xl font-black ${diagnosis.matchScore >= 80 ? 'text-emerald-500' : diagnosis.matchScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {diagnosis.matchScore}
                          </span>
                        </div>
                        
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                          <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">诊断意见</h5>
                          <p className="text-sm text-neutral-300 leading-relaxed">{diagnosis.reasoning}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                            <h5 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">优势</h5>
                            <ul className="space-y-2">
                              {diagnosis.pros.map((pro: string, i: number) => (
                                <li key={i} className="text-xs text-neutral-300 flex items-start gap-2 leading-relaxed">
                                  <span className="text-emerald-500 mt-0.5">•</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                            <h5 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">风险</h5>
                            <ul className="space-y-2">
                              {diagnosis.cons.map((con: string, i: number) => (
                                <li key={i} className="text-xs text-neutral-300 flex items-start gap-2 leading-relaxed">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Debug Prompt Section */}
                {debugPrompt && (
                  <div className="mt-6 border-t border-neutral-800 pt-4">
                    <button
                      onClick={onToggleDebug}
                      className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                    >
                      {showDebug ? '隐藏调试信息' : '显示调试信息 (Prompt)'}
                    </button>
                    {showDebug && (
                      <div className="mt-2 bg-black/50 border border-neutral-800 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-[10px] text-neutral-400 whitespace-pre-wrap font-mono leading-relaxed">
                          {debugPrompt}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
