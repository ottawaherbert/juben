import React from 'react';
import { Scene, Project } from "../../types/project";

interface AssetExtractionPanelProps {
  activeScene: Scene;
  currentProject: Project;
}

export const AssetExtractionPanel: React.FC<AssetExtractionPanelProps> = ({
  activeScene,
  currentProject
}) => {
  return (
    <div className="w-64 shrink-0 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 overflow-y-auto custom-scrollbar hidden lg:block">
      <h3 className="text-sm font-bold text-emerald-500 mb-4 uppercase tracking-wider">
        本场资产 (Assets)
      </h3>
      <p className="text-xs text-neutral-500 mb-6">
        自动提取剧本中的人物、场景、道具，以便加入资产库保持一致性。
      </p>

      {!activeScene.breakdown ? (
        <div className="text-center text-neutral-500 text-sm py-8 border border-dashed border-neutral-800 rounded-xl">
          请先前往“剧本拆解”页面进行 AI 智能拆解
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              人物 (Characters)
              <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">{activeScene.breakdown.characters?.length || 0}</span>
            </h4>
            <div className="space-y-2">
              {activeScene.breakdown.characters?.map((charName, i) => {
                const isLinked = currentProject.characters.some(c => c.name === charName);
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl flex items-center justify-between group ${isLinked ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-neutral-950 border border-neutral-800'}`}
                  >
                    <span className={`text-sm ${isLinked ? 'text-emerald-400' : 'text-neutral-300'}`}>
                      {charName}
                    </span>
                    {isLinked && (
                      <span className="text-[10px] text-emerald-500">已入库</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              场景 (Locations)
            </h4>
            <div className="space-y-2">
              {activeScene.breakdown.location && (() => {
                const locName = activeScene.breakdown.location;
                const isLinked = currentProject.assets.some(a => a.name === locName && a.type === 'location');
                return (
                  <div
                    className={`p-3 rounded-xl flex items-center justify-between group ${isLinked ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-neutral-950 border border-neutral-800'}`}
                  >
                    <span className={`text-sm truncate pr-2 ${isLinked ? 'text-emerald-400' : 'text-neutral-300'}`}>
                      {locName}
                    </span>
                    {isLinked && (
                      <span className="text-[10px] text-emerald-500 shrink-0">已入库</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              道具 (Props)
              <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">{activeScene.breakdown.props?.length || 0}</span>
            </h4>
            <div className="space-y-2">
              {activeScene.breakdown.props?.map((propName, i) => {
                const isLinked = currentProject.assets.some(a => a.name === propName && a.type === 'prop');
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl flex items-center justify-between group ${isLinked ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-neutral-950 border border-neutral-800'}`}
                  >
                    <span className={`text-sm truncate pr-2 ${isLinked ? 'text-emerald-400' : 'text-neutral-300'}`}>
                      {propName}
                    </span>
                    {isLinked && (
                      <span className="text-[10px] text-emerald-500 shrink-0">已入库</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              声音 & 音乐 (Sound & Music)
              <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">{activeScene.breakdown.sfx?.length || 0}</span>
            </h4>
            <div className="space-y-2">
              {activeScene.breakdown.sfx?.map((sfxName, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between group"
                >
                  <span className="text-sm text-neutral-300 truncate pr-2">
                    {sfxName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
