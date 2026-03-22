import React from "react";
import { Eye, Film, Camera, PenTool, Clapperboard } from "lucide-react";
import { CreativeVision } from "../../types/project";

interface CreativeVisionEditorProps {
  creativeVision: CreativeVision | undefined;
  updateCreativeVision: (key: keyof CreativeVision, value: any) => void;
}

export const CreativeVisionEditor: React.FC<CreativeVisionEditorProps> = ({
  creativeVision,
  updateCreativeVision,
}) => {
  return (
    <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Eye className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Creative Vision 创作视点
          </h2>
          <p className="text-xs text-neutral-500 mt-1">全局风格设定，将影响 AI 剧本与分镜生成</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <Film className="w-3 h-3" /> 类型基调 (Genre)
          </label>
          <input
            type="text"
            value={creativeVision?.genre?.join(", ") || ""}
            onChange={(e) => updateCreativeVision("genre", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            placeholder="如：悬疑, 赛博朋克, 黑色幽默 (用逗号分隔)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <Camera className="w-3 h-3" /> 视觉风格 / 导演 (Visual Style)
          </label>
          <input
            type="text"
            value={creativeVision?.visualStyle || ""}
            onChange={(e) => updateCreativeVision("visualStyle", e.target.value)}
            placeholder="如：王家卫的抽帧与高饱和，或 丹尼斯·维伦纽瓦的巨物感"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <PenTool className="w-3 h-3" /> 叙事风格 / 编剧 (Narrative Style)
          </label>
          <input
            type="text"
            value={creativeVision?.narrativeStyle || ""}
            onChange={(e) => updateCreativeVision("narrativeStyle", e.target.value)}
            placeholder="如：昆汀的碎嘴台词，或 阿伦·索尔金的快节奏交锋"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <Clapperboard className="w-3 h-3" /> 对标作品 (Reference Works)
          </label>
          <input
            type="text"
            value={creativeVision?.referenceWorks || ""}
            onChange={(e) => updateCreativeVision("referenceWorks", e.target.value)}
            placeholder="如：《银翼杀手2049》+《盗梦空间》"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <Camera className="w-3 h-3" /> 全局光学底片 (Global Look Tags)
          </label>
          <textarea
            value={creativeVision?.globalLookTags || ""}
            onChange={(e) => updateCreativeVision("globalLookTags", e.target.value)}
            placeholder="如：35mm film grain, warm analog color shift, high dynamic range. (系统将在分镜生图时自动追加)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none h-20"
          />
        </div>
      </div>
    </div>
  );
};
