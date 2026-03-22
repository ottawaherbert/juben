import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripHorizontal, Wand2, Trash2 } from "lucide-react";
import { Scene } from "../../types/project";

interface SceneCardProps {
  scene: Scene;
  index: number;
  activeEpisodeId: string;
  isGenerating: boolean;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>, episodeId?: string) => void;
  onRegenerateScene: (scene: Scene) => void;
  onDeleteScene: (sceneId: string) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  activeEpisodeId,
  isGenerating,
  onUpdateScene,
  onRegenerateScene,
  onDeleteScene,
}) => {
  return (
    <Draggable key={scene.id} draggableId={scene.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-full shrink-0 flex flex-col bg-neutral-900 border rounded-3xl overflow-hidden shadow-xl transition-colors ${
            scene.valueCharge === "neutral"
              ? "border-red-500/50"
              : "border-neutral-800"
          } ${snapshot.isDragging ? "opacity-80 z-50" : ""}`}
        >
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
            <div
              {...provided.dragHandleProps}
              className="text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing mr-2 shrink-0"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={scene.sceneNumber || ""}
              onChange={(e) =>
                onUpdateScene(scene.id, { sceneNumber: e.target.value }, activeEpisodeId)
              }
              placeholder="场号"
              className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs font-mono text-emerald-500 focus:outline-none focus:border-emerald-500 w-12 mr-2 shrink-0"
            />
            <input
              type="text"
              value={scene.title || ""}
              onChange={(e) =>
                onUpdateScene(scene.id, { title: e.target.value }, activeEpisodeId)
              }
              className="bg-transparent font-bold text-white focus:outline-none focus:text-emerald-500 w-full min-w-0"
            />
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                onClick={() => onRegenerateScene(scene)}
                disabled={isGenerating}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                title="重新生成此场景"
              >
                <Wand2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteScene(scene.id)}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                title="删除场景"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                场景目标 (Scene Goal)
              </label>
              <textarea
                value={scene.sceneGoal || ""}
                onChange={(e) =>
                  onUpdateScene(scene.id, { sceneGoal: e.target.value }, activeEpisodeId)
                }
                placeholder="本场戏要解决什么冲突？"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-emerald-500/50 min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                场景描述 (Action/Beat)
              </label>
              <textarea
                value={scene.description || ""}
                onChange={(e) =>
                  onUpdateScene(scene.id, { description: e.target.value }, activeEpisodeId)
                }
                placeholder="具体发生了什么？"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-emerald-500/50 min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                  价值转换
                </label>
                <select
                  value={scene.valueCharge}
                  onChange={(e) =>
                    onUpdateScene(
                      scene.id,
                      { valueCharge: e.target.value as any },
                      activeEpisodeId
                    )
                  }
                  className={`w-full bg-neutral-950 border rounded-xl p-2 text-xs font-bold focus:outline-none ${
                    scene.valueCharge === "positive"
                      ? "text-emerald-400 border-emerald-500/30"
                      : scene.valueCharge === "negative"
                      ? "text-red-400 border-red-500/30"
                      : "text-neutral-400 border-neutral-800"
                  }`}
                >
                  <option value="neutral">中性 (Neutral)</option>
                  <option value="positive">正向 (+) 成功/获得</option>
                  <option value="negative">负向 (-) 失败/丧失</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                  预计时长 (分)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={scene.targetDuration || ""}
                  onChange={(e) =>
                    onUpdateScene(
                      scene.id,
                      { targetDuration: parseFloat(e.target.value) },
                      activeEpisodeId
                    )
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                核心资产 (Assets)
              </label>
              <input
                type="text"
                value={scene.sceneAssets || ""}
                onChange={(e) =>
                  onUpdateScene(scene.id, { sceneAssets: e.target.value }, activeEpisodeId)
                }
                placeholder="人物、道具、场景..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-neutral-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {scene.cliffhanger && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <label className="text-[10px] uppercase tracking-wider font-bold text-red-400 block mb-1">
                  钩子 / 悬念 (Cliffhanger)
                </label>
                <p className="text-xs text-red-200/70 italic leading-relaxed">
                  {scene.cliffhanger}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
