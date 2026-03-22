import { useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Scene } from '../types/project';
import { Activity, Loader2 } from 'lucide-react';

interface EmotionalPacingMonitorProps {
  scenes: Scene[];
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export default function EmotionalPacingMonitor({ scenes, onAnalyze, isAnalyzing }: EmotionalPacingMonitorProps) {
  const currentProject = useProjectStore(state => state.currentProject);

  const data = useMemo(() => {
    return scenes.map((scene, index) => {
      let intensity = 0;
      if (scene.valueCharge === 'positive') intensity = 1;
      if (scene.valueCharge === 'negative') intensity = -1;
      
      // Hook adds extra intensity
      if (scene.hook && scene.hook.trim() !== '') {
        intensity *= 1.5;
      }
      
      // Cliffhanger is even more intense
      if (scene.cliffhanger && scene.cliffhanger.trim() !== '') {
        intensity *= 2;
      }
      
      return {
        index,
        title: scene.title,
        score: intensity, // This is now direct intensity, not cumulative
        charge: scene.valueCharge,
        hasHook: !!scene.hook && scene.hook.trim() !== '',
        hasCliffhanger: !!scene.cliffhanger && scene.cliffhanger.trim() !== ''
      };
    });
  }, [scenes]);

  const warning = useMemo(() => {
    if (currentProject?.type === 'short-drama') {
      // Short Drama specific checks
      // 1. First 3 scenes must have a core conflict (negative charge or hook)
      const firstThreeScenes = scenes.slice(0, 3);
      const hasEarlyConflict = firstThreeScenes.some(s => s.valueCharge === 'negative' || (s.hook && s.hook.trim() !== ''));
      if (scenes.length >= 3 && !hasEarlyConflict) {
        return "短剧警告：前 3 场戏必须出现核心冲突或强 Hook，否则极易流失观众！";
      }

      // 2. Last scene must have a cliffhanger
      const lastScene = scenes[scenes.length - 1];
      if (lastScene && (!lastScene.cliffhanger || lastScene.cliffhanger.trim() === '')) {
        return "短剧警告：最后一集必须设置“付费卡点 (Cliffhanger)”！";
      }
    }

    let flatCount = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.valueCharge === 'neutral' && (!scene.hook || scene.hook.trim() === '')) {
        flatCount++;
        if (flatCount >= 3) {
          return "警告：连续 3 个场景没有出现负向转折或高强度 Hook，节奏过平，存在观众流失风险！";
        }
      } else {
        flatCount = 0;
      }
    }
    return null;
  }, [scenes, currentProject?.type]);

  if (scenes.length === 0) return null;

  // For intensity curve, we want a fixed range or at least a symmetric one
  const maxAbsScore = Math.max(...data.map(d => Math.abs(d.score)), 1);
  const range = maxAbsScore * 2;
  const minScore = -maxAbsScore;

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4" />
          戏剧节奏波形图 (Dramatic Pacing Waveform)
        </h3>
        <div className="flex items-center gap-2">
          {warning && (
            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              {warning}
            </span>
          )}
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
              title="AI 分析剧本冲突密度与 Hook"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              AI 深度分析
            </button>
          )}
        </div>
      </div>
      
      <div className="relative h-32 w-full flex items-center">
        {/* Zero Line */}
        <div className="absolute left-0 right-0 border-t border-dashed border-neutral-700 z-0" />
        
        {/* Graph Points */}
        <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
          {data.map((point, i) => {
            const isPositive = point.score > 0;
            const isNeutral = point.score === 0;
            
            return (
              <div key={i} className="relative flex-1 flex flex-col items-center group h-full">
                {/* Bar */}
                <div className="flex-1 w-full flex flex-col items-center justify-center">
                  <div 
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      point.hasCliffhanger ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] w-2.5' :
                      point.hasHook ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] w-2' :
                      isPositive ? 'bg-emerald-500' : 
                      isNeutral ? 'bg-neutral-700' : 'bg-blue-500'
                    }`}
                    style={{ 
                      height: isNeutral ? '4px' : `${(Math.abs(point.score) / maxAbsScore) * 50}%`,
                      transform: point.score >= 0 ? 'translateY(-50%)' : 'translateY(50%)',
                      opacity: isNeutral ? 0.3 : 1
                    }}
                  />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none shadow-xl border border-neutral-700">
                  <div className="font-bold border-b border-neutral-700 mb-1 pb-1">{point.title}</div>
                  <div className="flex flex-col gap-0.5">
                    <span>价值转换: <span className={isPositive ? 'text-emerald-400' : point.score < 0 ? 'text-red-400' : 'text-neutral-400'}>{point.charge}</span></span>
                    {point.hasHook && <span className="text-purple-400">★ 包含 Hook</span>}
                    {point.hasCliffhanger && <span className="text-red-400">⚡ 包含 Cliffhanger</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-bold px-2">
        <span>序幕 (Prologue)</span>
        <span>中段 (Midpoint)</span>
        <span>高潮 (Climax)</span>
      </div>
    </div>
  );
}
