import React, { useState } from "react";
import { LayoutGrid, Loader2, Video, Sparkles, Image as ImageIcon } from "lucide-react";
import { Shot, Project, Scene } from "../types/project";
import { generateAIContent, generateAIImage, generateAIVideo } from "../services/ai";
import { useProjectStore } from "../store/useProjectStore";
import toast from "react-hot-toast";
import PromptEditorModal from "./PromptEditorModal";

interface StudioMultiGridControlsProps {
  selectedShots: Shot[];
  activeScene: Scene;
  currentProject: Project;
  activeEpisodeId: string;
  onUpdateGlobalParams: (params: Partial<Project['globalGenerationParams']>) => void;
}

export const StudioMultiGridControls: React.FC<StudioMultiGridControlsProps> = ({
  selectedShots,
  activeScene,
  currentProject,
  activeEpisodeId,
  onUpdateGlobalParams,
}) => {
  const { updateScene } = useProjectStore();
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    templateId: string;
    variables: Record<string, string>;
    onConfirm: (finalPrompt: string) => void;
  }>({
    isOpen: false,
    templateId: '',
    variables: {},
    onConfirm: () => {},
  });

  const multiGrid = activeScene.multiGrid || {};
  const { prompt = "", imageUrl = "", videoUrl = "" } = multiGrid;
  const videoPrompt = multiGrid.videoPrompt || "生成一段连贯的电影感视频，讲述提供的分镜宫格图中显示的连续故事。不要在视频中生成宫格布局。相反，在面板中描绘的场景之间平滑过渡，形成一个有凝聚力的叙事。";

  const handlePrepareGeneratePrompt = () => {
    if (selectedShots.length === 0) {
      toast.error("请至少选择一个分镜");
      return;
    }

    const shotDescriptions = selectedShots.map((shot, index) => {
      const shotAssets = [
        ...(shot.characterIdsInShot || []).map(id => currentProject?.characters?.find(c => c.id === id)?.name),
        ...(shot.propIds || []).map(id => currentProject?.assets?.find(a => a.id === id)?.name),
        currentProject?.assets?.find(a => a.id === shot.locationId)?.name
      ].filter(Boolean).join(", ");

      const assetContext = shotAssets ? ` (涉及资产: ${shotAssets})` : "";
      return `分镜 ${index + 1}: ${shot.imagePrompt || shot.visualAction || ""}${assetContext}`;
    }).join("\n");

    const visualStyle = currentProject?.creativeVision?.globalLookTags || "无特定风格";

    const assetIdsInSelectedShots = Array.from(new Set(selectedShots.flatMap(shot => [
      ...(shot.propIds || []),
      shot.locationId
    ].filter(Boolean) as string[])));

    const characterIdsInSelectedShots = Array.from(new Set(selectedShots.flatMap(shot => [
      ...(shot.characterIdsInShot || [])
    ].filter(Boolean) as string[])));

    const assetsInSelectedShots = assetIdsInSelectedShots.map(id => currentProject?.assets?.find(a => a.id === id)).filter(Boolean);
    const charactersInSelectedShots = characterIdsInSelectedShots.map(id => currentProject?.characters?.find(c => c.id === id)).filter(Boolean);
    
    const assetsInfo = [
      ...assetsInSelectedShots.map(a => `- [${a?.type === 'location' ? '场景' : '道具'}] ${a?.name}: ${a?.description || "无描述"}`),
      ...charactersInSelectedShots.map(c => `- [角色] ${c?.name}: ${[c?.internalDesire, c?.externalGoal, c?.flaw].filter(Boolean).join(', ') || "无描述"}`)
    ].join("\n") || "无特定资产";

    setPromptModalState({
      isOpen: true,
      templateId: 'generateMultiGridPrompt',
      variables: {
        shotDescriptions,
        visualStyle,
        assetsInfo,
      },
      onConfirm: (finalPrompt) => handleGeneratePrompt(finalPrompt)
    });
  };

  const handleGeneratePrompt = async (finalPrompt: string) => {
    setIsGeneratingPrompt(true);
    try {
      const response = await generateAIContent({
        prompt: finalPrompt,
        requireJson: true,
        schema: {
          type: "object",
          properties: {
            imagePrompt: { type: "string" },
            videoPrompt: { type: "string" }
          },
          required: ["imagePrompt", "videoPrompt"]
        }
      });
      
      const data = JSON.parse(response);
      
      updateScene(activeScene.id, {
        multiGrid: {
          ...multiGrid,
          prompt: data.imagePrompt.trim(),
          videoPrompt: data.videoPrompt.trim(),
          shotIds: selectedShots.map(s => s.id)
        }
      }, activeEpisodeId);
      
      toast.success("多宫格提示词生成成功");
    } catch (error) {
      console.error(error);
      toast.error("生成提示词失败");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt) {
      toast.error("请先生成多宫格提示词");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const globalParams = currentProject.globalGenerationParams;
      const currentGlobalAppendedPrompt = globalParams?.globalAppendedPrompt ?? currentProject.creativeVision?.globalLookTags ?? "";
      const globalAppendedPromptText = currentGlobalAppendedPrompt ? `, ${currentGlobalAppendedPrompt}` : "";
      const qualityPrompt = globalParams?.qualityPrompt ? `, ${globalParams.qualityPrompt}` : "";
      const negativePrompt = globalParams?.negativePrompt ? ` --no ${globalParams.negativePrompt}` : "";
      const aspectRatioParam = currentProject.aspectRatio ? ` --ar ${currentProject.aspectRatio.replace(':', ':')}` : " --ar 16:9";
      
      const finalPrompt = `${prompt}${globalAppendedPromptText}${qualityPrompt}${negativePrompt}${aspectRatioParam}`;

      const newImageUrl = await generateAIImage({
        prompt: finalPrompt,
        aspectRatio: (currentProject.aspectRatio as "16:9" | "1:1" | "3:4" | "4:3" | "9:16") || "16:9",
      });

      updateScene(activeScene.id, {
        multiGrid: {
          ...multiGrid,
          imageUrl: newImageUrl
        }
      }, activeEpisodeId);
      
      toast.success("多宫格图片生成成功");
    } catch (error) {
      console.error(error);
      toast.error("生成图片失败");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageUrl) {
      toast.error("请先生成多宫格图片");
      return;
    }

    setIsGeneratingVideo(true);
    try {
      const newVideoUrl = await generateAIVideo({
        prompt: videoPrompt,
        imageUrl: imageUrl,
        aspectRatio: currentProject.aspectRatio === "9:16" ? "9:16" : "16:9",
      });

      updateScene(activeScene.id, {
        multiGrid: {
          ...multiGrid,
          videoUrl: newVideoUrl
        }
      }, activeEpisodeId);
      
      toast.success("多宫格视频生成成功");
    } catch (error) {
      console.error(error);
      toast.error("生成视频失败");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateScene(activeScene.id, {
      multiGrid: {
        ...multiGrid,
        prompt: e.target.value
      }
    }, activeEpisodeId);
  };

  const handleVideoPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateScene(activeScene.id, {
      multiGrid: {
        ...multiGrid,
        videoPrompt: e.target.value
      }
    }, activeEpisodeId);
  };

  // Calculate assets in selected shots
  const assetIdsInSelectedShotsRender = Array.from(new Set(selectedShots.flatMap(shot => [
    ...(shot.propIds || []),
    shot.locationId
  ].filter(Boolean) as string[])));

  const characterIdsInSelectedShotsRender = Array.from(new Set(selectedShots.flatMap(shot => [
    ...(shot.characterIdsInShot || [])
  ].filter(Boolean) as string[])));

  const assetsInSelectedShotsRender = assetIdsInSelectedShotsRender.map(id => currentProject.assets?.find(a => a.id === id)).filter(Boolean);
  const charactersInSelectedShotsRender = characterIdsInSelectedShotsRender.map(id => currentProject.characters?.find(c => c.id === id)).filter(Boolean);

  const globalParams = currentProject.globalGenerationParams;
  const globalAppendedPrompt = globalParams?.globalAppendedPrompt ?? currentProject.creativeVision?.globalLookTags ?? "";

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          多宫格模式
        </h3>
        <p className="text-xs text-emerald-500/80">
          已选择 {selectedShots.length} 个分镜。生成多宫格图后，可直接生成包含多个画面的视频，节省 Token。
        </p>
      </div>

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

      {(assetsInSelectedShotsRender.length > 0 || charactersInSelectedShotsRender.length > 0) && (
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            包含的资产 ({assetsInSelectedShotsRender.length + charactersInSelectedShotsRender.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {charactersInSelectedShotsRender.map(char => (
              <span key={char?.id} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-blue-400">
                {char?.name}
              </span>
            ))}
            {assetsInSelectedShotsRender.map(asset => (
              <span key={asset?.id} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300">
                {asset?.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            多宫格提示词
          </span>
          <button
            onClick={handlePrepareGeneratePrompt}
            disabled={isGeneratingPrompt || selectedShots.length === 0}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
          >
            {isGeneratingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI 生成
          </button>
        </label>
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          placeholder="点击右上角 AI 生成，或手动输入多宫格提示词..."
          className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono resize-none focus:outline-none focus:border-blue-500/50 custom-scrollbar transition-colors"
        />
        <button
          onClick={handleGenerateImage}
          disabled={isGeneratingImage || !prompt}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
        >
          {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <LayoutGrid className="w-3 h-3" />}
          生成宫格图
        </button>
      </div>

      <div>
        <label className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
            <Video className="w-4 h-4" />
            宫格视频提示词
          </span>
        </label>
        <textarea
          value={videoPrompt}
          onChange={handleVideoPromptChange}
          placeholder="输入视频提示词，例如：为这张宫格图中的面板添加动画，让场景栩栩如生..."
          className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono resize-none focus:outline-none focus:border-emerald-500/50 custom-scrollbar transition-colors mb-2"
        />

        <button
          onClick={handleGenerateVideo}
          disabled={isGeneratingVideo || !videoPrompt || !imageUrl}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          title={!imageUrl ? "请先生成宫格图" : ""}
        >
          {isGeneratingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
          基于宫格生成视频
        </button>
      </div>

      {imageUrl && (
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-purple-500 mb-2 uppercase tracking-wider">
            <LayoutGrid className="w-4 h-4" />
            宫格图预览
          </label>
          <div className="relative rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 aspect-video mb-4">
            <img src={imageUrl} alt="Multi-grid Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
      
      {videoUrl && (
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-emerald-500 mb-2 uppercase tracking-wider">
            <Video className="w-4 h-4" />
            宫格视频预览
          </label>
          <div className="relative rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 aspect-video">
            <video src={videoUrl} controls className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState(prev => ({ ...prev, isOpen: false }))}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={(finalPrompt) => {
          setPromptModalState(prev => ({ ...prev, isOpen: false }));
          promptModalState.onConfirm(finalPrompt);
        }}
      />
    </div>
  );
};
