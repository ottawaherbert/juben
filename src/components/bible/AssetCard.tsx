import React from "react";
import { Trash2, MapPin, Box, Camera, Loader2, Wand2 } from "lucide-react";
import { Asset } from "../../types/project";

interface AssetCardProps {
  asset: Asset;
  activeTab: "locations" | "props";
  onUpdate: (id: string, updates: Partial<Asset>) => void;
  onDelete: (id: string) => void;
  onGenerateImage: (id: string) => void;
  onRegenerate: (id: string, name: string, type: "location" | "prop") => void;
  isGeneratingImage: boolean;
  isRegenerating: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  activeTab,
  onUpdate,
  onDelete,
  onGenerateImage,
  onRegenerate,
  isGeneratingImage,
  isRegenerating,
}) => {
  return (
    <div className="bg-neutral-950 border border-neutral-800/50 rounded-2xl p-6 relative group transition-all hover:border-neutral-700">
      <button
        onClick={() => onDelete(asset.id)}
        className="absolute top-6 right-6 p-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-900 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group/img shrink-0">
            <div className={`w-24 h-16 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex items-center justify-center ${activeTab === 'locations' ? 'aspect-video' : 'aspect-square'}`}>
              {asset.imageUrl ? (
                <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                activeTab === 'locations' ? <MapPin className="w-6 h-6 text-neutral-700" /> : <Box className="w-6 h-6 text-neutral-700" />
              )}
              <button
                onClick={() => onGenerateImage(asset.id)}
                disabled={isGeneratingImage}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity disabled:opacity-100"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
          <input
            type="text"
            value={asset.name || ""}
            onChange={(e) => onUpdate(asset.id, { name: e.target.value })}
            placeholder={`${activeTab === "locations" ? "场景" : "道具"}名称`}
            className={`flex-1 bg-transparent text-2xl font-black text-white focus:outline-none transition-colors uppercase tracking-tight ${activeTab === "locations" ? "focus:text-emerald-400" : "focus:text-blue-400"}`}
          />
        </div>
        <button
          onClick={() => onRegenerate(asset.id, asset.name, asset.type as "location" | "prop")}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 mr-8"
        >
          {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          AI 丰满设定
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
          <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
            详细描述 / Description
          </label>
          <textarea
            value={asset.description || ""}
            onChange={(e) => onUpdate(asset.id, { description: e.target.value })}
            placeholder={`描述该${activeTab === "locations" ? "场景的氛围、光影、细节" : "道具的外观、材质、用途"}...`}
            className="w-full h-32 bg-transparent text-sm text-neutral-300 focus:outline-none resize-none custom-scrollbar"
          />
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
          <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
            AI 提示词 / Prompt
          </label>
          <textarea
            value={asset.prompt || ""}
            onChange={(e) => onUpdate(asset.id, { prompt: e.target.value })}
            placeholder="用于 AI 绘图的中文提示词..."
            className="w-full h-32 bg-transparent text-sm text-neutral-300 focus:outline-none resize-none custom-scrollbar font-mono"
          />
        </div>
      </div>
    </div>
  );
};
