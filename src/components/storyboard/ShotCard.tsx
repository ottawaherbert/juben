import React, { useState } from 'react';
import { 
  Camera, 
  Trash2, 
  Wand2, 
  ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shot, Scene } from '../../types/project';

interface ShotCardProps {
  shot: Shot;
  index: number;
  activeScene: Scene;
  activeEpisodeId: string;
  updateScene: (sceneId: string, updates: Partial<Scene>, episodeId: string) => void;
  onReroll: (shotId: string) => void;
}

export const ShotCard: React.FC<ShotCardProps> = ({
  shot,
  index,
  activeScene,
  activeEpisodeId,
  updateScene,
  onReroll,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<Partial<Shot>>({});
  const navigate = useNavigate();

  const handleSave = () => {
    const newShots = activeScene.shots!.map(s => s.id === shot.id ? { ...s, ...editingData } : s);
    updateScene(activeScene.id, { shots: newShots }, activeEpisodeId);
    setIsEditing(false);
  };

  const handleSelectTake = (takeId: string) => {
    const updatedShots = activeScene.shots!.map(s => {
      if (s.id === shot.id && s.takes) {
        const selectedTake = s.takes.find(t => t.id === takeId);
        if (selectedTake) {
          return {
            ...s,
            activeTakeId: takeId,
            imageUrl: selectedTake.imageUrl,
            videoUrl: selectedTake.videoUrl
          };
        }
      }
      return s;
    });

    updateScene(activeScene.id, { shots: updatedShots }, activeEpisodeId);
  };

  const handleDelete = () => {
    const newShots = activeScene.shots?.filter(s => s.id !== shot.id) || [];
    updateScene(activeScene.id, { shots: newShots }, activeEpisodeId);
    setIsDeleting(false);
  };

  // Calculate audio tracks for this shot
  let currentStartTime = 0;
  for (let i = 0; i < index; i++) {
    currentStartTime += activeScene.shots![i].duration || 0;
  }
  const shotEndTime = currentStartTime + (shot.duration || 0);
  const overlappingAudio = activeScene.audioTracks?.filter(a => 
    a.type === 'dialogue' && a.startTime >= currentStartTime && a.startTime < shotEndTime
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl group flex flex-col">
      <div className="aspect-video bg-neutral-950 relative flex items-center justify-center">
        {shot.imageUrl ? (
          <img
            src={shot.imageUrl}
            alt="preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Camera className="w-12 h-12 text-neutral-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-50" />
        
        {isDeleting ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-black/80 p-1 rounded-lg backdrop-blur-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="text-xs text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded bg-red-500/20"
            >
              确认
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleting(false);
              }}
              className="text-xs text-neutral-300 hover:text-white px-2 py-1 rounded bg-neutral-700"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleting(true);
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
            title="删除分镜"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
            SHOT {index + 1}
          </span>
          <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            {shot.duration}s
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">动作描述 (Action)</label>
                <textarea
                  value={editingData.visualAction || ""}
                  onChange={(e) => setEditingData({ ...editingData, visualAction: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300 resize-none h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">景别</label>
                  <input
                    value={editingData.shotSize || ""}
                    onChange={(e) => setEditingData({ ...editingData, shotSize: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">角度</label>
                  <input
                    value={editingData.cameraAngle || ""}
                    onChange={(e) => setEditingData({ ...editingData, cameraAngle: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">运镜</label>
                  <input
                    value={editingData.cameraMovement || ""}
                    onChange={(e) => setEditingData({ ...editingData, cameraMovement: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider block mb-1">光影氛围 (Lighting)</label>
                <input
                  value={editingData.lightingAtmo || ""}
                  onChange={(e) => setEditingData({ ...editingData, lightingAtmo: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block mb-1">导演意图 (Motivation)</label>
                <textarea
                  value={editingData.motivation || ""}
                  onChange={(e) => setEditingData({ ...editingData, motivation: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300 resize-none h-16"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">画面提示词 (Image Prompt)</label>
                <textarea
                  value={editingData.imagePrompt || ""}
                  onChange={(e) => setEditingData({ ...editingData, imagePrompt: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300 resize-none h-20 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">动态提示词 (Video Prompt)</label>
                <textarea
                  value={editingData.videoPrompt || ""}
                  onChange={(e) => setEditingData({ ...editingData, videoPrompt: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-300 resize-none h-20 font-mono"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 text-xs font-bold transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded py-2 text-xs font-bold transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">动作描述 (Action)</span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {shot.visualAction || "暂无动作描述"}
                </p>
              </div>
              {shot.lightingAtmo && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider block mb-1">光影氛围 (Lighting)</span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {shot.lightingAtmo}
                  </p>
                </div>
              )}
              {shot.motivation && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block mb-1">导演意图 (Motivation)</span>
                  <p className="text-xs text-neutral-400 leading-relaxed italic">
                    {shot.motivation}
                  </p>
                </div>
              )}
              {shot.visualSummary && (
                <div className="mb-3 p-2 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">视觉总结 (Summary)</span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {shot.visualSummary}
                  </p>
                </div>
              )}
              {(shot.imagePrompt || shot.videoPrompt) && (
                <div className="mb-3 p-2 bg-blue-900/20 rounded-lg border border-blue-500/20">
                  {shot.imagePrompt && (
                    <div className="mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">画面提示词 (Image Prompt)</span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-mono break-all">
                        {shot.imagePrompt}
                      </p>
                      {(() => {
                        const params = shot.imagePrompt.match(/--[a-z]+\s+[^\s--]+/g);
                        if (params && params.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {params.map((p, i) => (
                                <span key={i} className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 font-mono">
                                  {p}
                                </span>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  {shot.videoPrompt && (
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">动态提示词 (Video Prompt)</span>
                      <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                        {shot.videoPrompt}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-3 flex flex-wrap gap-2">
                {shot.shotSize && (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700">
                    景别: {shot.shotSize}
                  </span>
                )}
                {shot.cameraAngle && (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700">
                    角度: {shot.cameraAngle}
                  </span>
                )}
                {shot.cameraMovement && (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700">
                    运动: {shot.cameraMovement}
                  </span>
                )}
              </div>
              {overlappingAudio && overlappingAudio.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block mb-1">台词 (Audio)</span>
                  {overlappingAudio.map(audio => (
                    <p key={audio.id} className="text-xs text-neutral-400 italic leading-relaxed border-l-2 border-purple-500/30 pl-2 mb-1">
                      "{audio.text}"
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2 mt-2 shrink-0">
          <button
            onClick={() => {
              setIsEditing(true);
              setEditingData(shot);
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-colors"
          >
            编辑参数
          </button>
          <button
            onClick={() => onReroll(shot.id)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Wand2 className="w-3 h-3" />
            重抽 (Reroll)
          </button>
          <button
            onClick={() =>
              navigate(
                `/studio?sceneId=${activeScene.id}&shotId=${shot.id}`,
              )
            }
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold transition-colors"
          >
            进入摄影棚
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {shot.takes && shot.takes.length > 1 && (
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] text-neutral-500">Takes:</span>
            <div className="flex gap-1">
              {shot.takes.map((take, tIdx) => (
                <button
                  key={take.id}
                  onClick={() => handleSelectTake(take.id)}
                  className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${
                    shot.activeTakeId === take.id || (!shot.activeTakeId && tIdx === 0)
                      ? 'bg-emerald-500 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {tIdx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
