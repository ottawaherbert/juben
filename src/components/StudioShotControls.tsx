import React from "react";
import { ImageIcon, Video, Loader2 } from "lucide-react";
import { Shot, Asset, Project, Character } from "../types/project";

interface StudioShotControlsProps {
  selectedShot: Shot;
  currentProject: Project;
  boundAssets: (Asset | Character)[];
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean;
  onGenerateImage: () => void;
  onGenerateVideo: () => void;
  onUpdateGlobalParams: (params: Partial<Project['globalGenerationParams']>) => void;
}

export const StudioShotControls: React.FC<StudioShotControlsProps> = ({
  selectedShot,
  currentProject,
  boundAssets,
  isGeneratingImage,
  isGeneratingVideo,
  onGenerateImage,
  onGenerateVideo,
  onUpdateGlobalParams,
}) => {
  const globalParams = currentProject.globalGenerationParams;
  const qualityPrompt = globalParams?.qualityPrompt ? `, ${globalParams.qualityPrompt}` : "";
  const negativePrompt = globalParams?.negativePrompt ? ` --no ${globalParams.negativePrompt}` : "";
  const aspectRatioParam = ` --ar ${currentProject.aspectRatio?.replace(':', ':') || "16:9"}`;
  const globalAppendedPrompt = globalParams?.globalAppendedPrompt ?? currentProject.creativeVision?.globalLookTags ?? "";
  
  const finalImagePrompt = `${selectedShot.imagePrompt || ""}${globalAppendedPrompt ? `, ${globalAppendedPrompt}` : ""}${qualityPrompt}${negativePrompt}${aspectRatioParam}`;

  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-amber-500 mb-2 uppercase tracking-wider">
          <ImageIcon className="w-4 h-4" />
          全局追加提示词
        </label>
        <textarea
          value={globalAppendedPrompt}
          onChange={(e) => onUpdateGlobalParams({ globalAppendedPrompt: e.target.value })}
          placeholder="例如：35mm 胶片颗粒, 温暖的模拟色彩偏移, 高动态范围..."
          className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono resize-none focus:outline-none focus:border-amber-500/50 custom-scrollbar transition-colors"
          title="此处的提示词将自动追加到所有分镜的画面提示词末尾"
        />
      </div>

      {boundAssets.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-purple-500 mb-2 uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            已绑定资产参考图
          </label>
          <div className="grid grid-cols-2 gap-2">
            {boundAssets.map(asset => {
              const imageUrl = 'imageUrl' in asset ? (asset as Asset).imageUrl : (asset as Character).referenceImageUrl;
              return (
                <div key={asset.id} className="relative group rounded-lg overflow-hidden bg-neutral-800 aspect-square border border-neutral-700">
                  {imageUrl ? (
                    <img src={imageUrl} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs p-2 text-center">
                      无参考图
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[10px] text-white truncate text-center backdrop-blur-sm">
                    {asset.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            画面提示词 (基础)
          </span>
        </label>
        <textarea
          readOnly
          value={finalImagePrompt}
          className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono resize-none focus:outline-none custom-scrollbar"
          title="最终画面提示词（包含基础提示词、全局追加提示词和全局参数）"
        />
        <button
          onClick={onGenerateImage}
          disabled={isGeneratingImage}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
        >
          {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
          编辑并生成图片
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-blue-500 mb-2 uppercase tracking-wider">
          <Video className="w-4 h-4" />
          视频提示词 (基础)
        </label>
        <textarea
          readOnly
          value={selectedShot.videoPrompt || ""}
          className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono resize-none focus:outline-none custom-scrollbar"
          title="基础视频提示词（生成时将自动注入资产描述和全局参数）"
        />
        <button
          onClick={onGenerateVideo}
          disabled={isGeneratingVideo || !selectedShot.imageUrl}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
        >
          {isGeneratingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
          编辑并生成视频
        </button>
      </div>
    </div>
  );
};
