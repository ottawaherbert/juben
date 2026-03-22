import { useState } from "react";
import toast from "react-hot-toast";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { generateAIImage, generateAIVideo, generateAIVoice } from "../services/ai";
import { useProjectStore } from "../store/useProjectStore";
import { Shot, AudioTrack, Project, Episode } from "../types/project";

export function useStudioAI() {
  const { updateScene } = useProjectStore();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    templateId: string;
    variables: Record<string, string>;
    onConfirm: (finalPrompt: string) => void;
  }>({
    isOpen: false,
    templateId: '',
    variables: {},
    onConfirm: () => {}
  });

  const handlePrepareGenerateImage = (
    selectedShot: Shot,
    activeSceneId: string,
    activeEpisode: Episode,
    currentProject: Project
  ) => {
    if (isGeneratingImage) return;

    const globalParams = currentProject?.globalGenerationParams;
    const globalAppendedPrompt = globalParams?.globalAppendedPrompt ? `, ${globalParams.globalAppendedPrompt}` : "";
    const qualityPrompt = globalParams?.qualityPrompt ? `, ${globalParams.qualityPrompt}` : "";
    const negativePrompt = globalParams?.negativePrompt ? ` --no ${globalParams.negativePrompt}` : "";
    const aspectRatioParam = currentProject?.aspectRatio ? ` --ar ${currentProject.aspectRatio.replace(':', ':')}` : " --ar 16:9";
    const globalParamsText = `${globalAppendedPrompt}${qualityPrompt}${negativePrompt}${aspectRatioParam}`;

    const assetDescriptions: string[] = [];
    if (currentProject) {
      const assetIds = [
        ...(selectedShot.propIds || []),
        selectedShot.locationId
      ].filter(Boolean) as string[];

      assetIds.forEach(id => {
        const asset = currentProject.assets.find(a => a.id === id);
        if (asset && asset.description) {
          assetDescriptions.push(`[${asset.type === 'location' ? '场景' : '道具'}] ${asset.name}: ${asset.description}`);
        }
      });

      const characterIds = selectedShot.characterIdsInShot || [];
      characterIds.forEach(id => {
        const char = currentProject.characters.find(c => c.id === id);
        if (char) {
          const desc = [char.internalDesire, char.externalGoal, char.flaw].filter(Boolean).join(', ');
          assetDescriptions.push(`[角色] ${char.name}: ${desc}`);
        }
      });
    }

    const assetDescriptionsText = assetDescriptions.length > 0 
      ? assetDescriptions.join('\n') 
      : "无特定资产视觉描述";

    setPromptModalState({
      isOpen: true,
      templateId: 'generateImage',
      variables: {
        imagePrompt: selectedShot.imagePrompt || "",
        assetDescriptions: assetDescriptionsText,
        globalParams: globalParamsText
      },
      onConfirm: (finalPrompt) => handleGenerateImage(finalPrompt, selectedShot, activeSceneId, activeEpisode, currentProject)
    });
  };

  const handleGenerateImage = async (
    finalPrompt: string,
    selectedShot: Shot,
    activeSceneId: string,
    activeEpisode: Episode,
    currentProject: Project
  ) => {
    setIsGeneratingImage(true);
    setPromptModalState(prev => ({ ...prev, isOpen: false }));
    try {
      const referenceImages: string[] = [];
      if (currentProject) {
        const assetIds = [
          ...(selectedShot.propIds || []),
          selectedShot.locationId
        ].filter(Boolean) as string[];

        assetIds.forEach(id => {
          const asset = currentProject.assets.find(a => a.id === id);
          if (asset && asset.imageUrl) {
            referenceImages.push(asset.imageUrl);
          }
        });

        const characterIds = selectedShot.characterIdsInShot || [];
        characterIds.forEach(id => {
          const char = currentProject.characters.find(c => c.id === id);
          if (char && char.referenceImageUrl) {
            referenceImages.push(char.referenceImageUrl);
          }
        });
      }

      const imageUrl = await generateAIImage({
        prompt: finalPrompt,
        aspectRatio: currentProject?.aspectRatio as any || "16:9",
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      });
      
      const latestActiveEpisode = useProjectStore.getState().activeEpisode;
      const latestActiveScene = latestActiveEpisode?.scenes.find(s => s.id === activeSceneId);
      if (!latestActiveScene) return;

      updateScene(activeSceneId, {
        shots: latestActiveScene.shots!.map((s) =>
          s.id === selectedShot.id ? { ...s, imageUrl } : s
        ),
      }, activeEpisode.id);
      
      return imageUrl;
    } catch (error) {
      console.error("Generate Image Error:", error);
      toast.error("生成图片失败，请重试。");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrepareGenerateVideo = (
    selectedShot: Shot,
    activeSceneId: string,
    activeEpisode: Episode,
    currentProject: Project
  ) => {
    if (!selectedShot?.imageUrl || isGeneratingVideo) {
      if (!selectedShot?.imageUrl) toast.error("请先生成或上传图片，然后再生成视频！");
      return;
    }

    const assetDescriptions: string[] = [];
    if (currentProject) {
      const assetIds = [
        ...(selectedShot.propIds || []),
        selectedShot.locationId
      ].filter(Boolean) as string[];

      assetIds.forEach(id => {
        const asset = currentProject.assets.find(a => a.id === id);
        if (asset && asset.description) {
          assetDescriptions.push(`[${asset.type === 'location' ? '场景' : '道具'}] ${asset.name}: ${asset.description}`);
        }
      });

      const characterIds = selectedShot.characterIdsInShot || [];
      characterIds.forEach(id => {
        const char = currentProject.characters.find(c => c.id === id);
        if (char) {
          const desc = [char.internalDesire, char.externalGoal, char.flaw].filter(Boolean).join(', ');
          assetDescriptions.push(`[角色] ${char.name}: ${desc}`);
        }
      });
    }

    const assetDescriptionsText = assetDescriptions.length > 0 
      ? assetDescriptions.join('\n') 
      : "无特定资产视觉描述";

    const globalParams = currentProject?.globalGenerationParams;
    const globalAppendedPrompt = globalParams?.globalAppendedPrompt ? `, ${globalParams.globalAppendedPrompt}` : "";
    const qualityPrompt = globalParams?.qualityPrompt ? `, ${globalParams.qualityPrompt}` : "";
    const negativePrompt = globalParams?.negativePrompt ? ` --no ${globalParams.negativePrompt}` : "";
    const aspectRatioParam = currentProject?.aspectRatio ? ` --ar ${currentProject.aspectRatio.replace(':', ':')}` : " --ar 16:9";
    const globalParamsText = `${globalAppendedPrompt}${qualityPrompt}${negativePrompt}${aspectRatioParam}`;

    setPromptModalState({
      isOpen: true,
      templateId: 'generateVideo',
      variables: {
        videoPrompt: selectedShot.videoPrompt || "",
        assetDescriptions: assetDescriptionsText,
        globalParams: globalParamsText
      },
      onConfirm: (finalPrompt) => handleGenerateVideo(finalPrompt, selectedShot, activeSceneId, activeEpisode, currentProject)
    });
  };

  const handleGenerateVideo = async (
    finalPrompt: string,
    selectedShot: Shot,
    activeSceneId: string,
    activeEpisode: Episode,
    currentProject: Project
  ) => {
    setIsGeneratingVideo(true);
    setPromptModalState(prev => ({ ...prev, isOpen: false }));
    try {
      const videoUrl = await generateAIVideo({
        prompt: finalPrompt,
        imageUrl: selectedShot.imageUrl,
        aspectRatio: currentProject?.aspectRatio as any || "16:9",
      });
      
      const latestActiveEpisode = useProjectStore.getState().activeEpisode;
      const latestActiveScene = latestActiveEpisode?.scenes.find(s => s.id === activeSceneId);
      if (!latestActiveScene) return;

      updateScene(activeSceneId, {
        shots: latestActiveScene.shots!.map((s) =>
          s.id === selectedShot.id ? { ...s, videoUrl } : s
        ),
      }, activeEpisode.id);
      
      return videoUrl;
    } catch (error) {
      console.error("Generate Video Error:", error);
      toast.error("生成视频失败，请重试。");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateVoice = async (
    selectedAudioTrack: AudioTrack,
    activeSceneId: string,
    activeEpisode: Episode,
    currentProject: Project
  ) => {
    if (isGeneratingVoice) return;
    if (!selectedAudioTrack.text) {
      toast.error("请先输入配音台词！");
      return;
    }

    let voiceName = "Puck"; // Default
    if (selectedAudioTrack.characterId && selectedAudioTrack.characterId !== "narrator") {
      const character = currentProject?.characters.find(c => c.id === selectedAudioTrack.characterId);
      if (character && character.voiceName) {
        voiceName = character.voiceName;
      }
    }

    setIsGeneratingVoice(true);
    try {
      const audioUrl = await generateAIVoice({
        text: selectedAudioTrack.text,
        voiceName,
      });
      
      const getAudioDuration = (url: string): Promise<number> => {
        return new Promise((resolve) => {
          const audio = new Audio(url);
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
          });
          audio.addEventListener('error', () => {
            resolve(0);
          });
        });
      };

      const duration = await getAudioDuration(audioUrl);
      
      const latestActiveEpisode = useProjectStore.getState().activeEpisode;
      const latestActiveScene = latestActiveEpisode?.scenes.find(s => s.id === activeSceneId);
      if (!latestActiveScene) return;

      const newDuration = duration > 0 ? Math.ceil(duration) : selectedAudioTrack.duration;

      const newShots = latestActiveScene.shots?.map((s) => 
        s.id === selectedAudioTrack.shotId ? { ...s, duration: Math.max(s.duration || 5, newDuration) } : s
      ) || [];

      let currentStart = 0;
      const newShotPositions = newShots.map(s => {
        const start = currentStart;
        currentStart += (s.duration || 5);
        return { id: s.id, start };
      });

      updateScene(activeSceneId, {
        audioTracks: latestActiveScene.audioTracks!.map((a) => {
          if (a.id === selectedAudioTrack.id) {
            return { ...a, url: audioUrl, duration: newDuration };
          }
          if (a.shotId) {
            const linkedShot = newShotPositions.find(s => s.id === a.shotId);
            if (linkedShot) {
              return { ...a, startTime: linkedShot.start };
            }
          }
          return a;
        }),
        shots: newShots
      }, activeEpisode.id);
      
      return audioUrl;
    } catch (error) {
      console.error("Generate Voice Error:", error);
      toast.error("生成配音失败，请重试。");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleSynthesize = async (activeScene: any) => {
    if (isSynthesizing || !activeScene) return;
    setIsSynthesizing(true);
    
    const loadingToast = toast.loading("初始化 FFmpeg...");
    
    try {
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('progress', ({ progress }) => {
        toast.loading(`正在合成视频... ${Math.round(progress * 100)}%`, { id: loadingToast });
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm`, 'application/wasm'),
      });

      toast.loading("正在处理素材...", { id: loadingToast });

      const shots = activeScene.shots || [];
      const audioTracks = activeScene.audioTracks || [];

      if (shots.length === 0) {
        throw new Error("没有镜头数据");
      }

      const inputFiles: string[] = [];
      let filterComplex = "";
      let videoInputs = "";

      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        const filename = `shot_${i}.mp4`;
        const imageFilename = `shot_${i}.jpg`;
        
        if (shot.videoUrl) {
          await ffmpeg.writeFile(filename, await fetchFile(shot.videoUrl));
          inputFiles.push(`-i`);
          inputFiles.push(filename);
          filterComplex += `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}];`;
          videoInputs += `[v${i}]`;
        } else if (shot.imageUrl) {
          await ffmpeg.writeFile(imageFilename, await fetchFile(shot.imageUrl));
          inputFiles.push(`-loop`);
          inputFiles.push(`1`);
          inputFiles.push(`-t`);
          inputFiles.push(`${shot.duration || 5}`);
          inputFiles.push(`-i`);
          inputFiles.push(imageFilename);
          filterComplex += `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}];`;
          videoInputs += `[v${i}]`;
        } else {
          inputFiles.push(`-f`);
          inputFiles.push(`lavfi`);
          inputFiles.push(`-t`);
          inputFiles.push(`${shot.duration || 5}`);
          inputFiles.push(`-i`);
          inputFiles.push(`color=c=black:s=1920x1080:r=30`);
          filterComplex += `[${i}:v]copy[v${i}];`;
          videoInputs += `[v${i}]`;
        }
      }

      filterComplex += `${videoInputs}concat=n=${shots.length}:v=1:a=0[outv];`;

      let audioInputs = "";
      let audioFilter = "";
      let audioIndex = shots.length;

      const validAudioTracks = audioTracks.filter((t: any) => t.url);

      for (let i = 0; i < validAudioTracks.length; i++) {
        const track = validAudioTracks[i];
        const filename = `audio_${i}.mp3`;
        await ffmpeg.writeFile(filename, await fetchFile(track.url));
        
        inputFiles.push(`-i`);
        inputFiles.push(filename);
        
        const delayMs = Math.round(track.startTime * 1000);
        audioFilter += `[${audioIndex}:a]adelay=${delayMs}|${delayMs}[a${i}];`;
        audioInputs += `[a${i}]`;
        audioIndex++;
      }

      if (validAudioTracks.length > 0) {
        filterComplex += `${audioFilter}${audioInputs}amix=inputs=${validAudioTracks.length}:duration=longest[outa]`;
      } else {
        filterComplex = filterComplex.slice(0, -1);
      }

      toast.loading("正在合成视频...", { id: loadingToast });

      const outputArgs = [
        ...inputFiles,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
      ];

      if (validAudioTracks.length > 0) {
        outputArgs.push('-map', '[outa]');
      }

      outputArgs.push(
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
        'output.mp4'
      );

      await ffmpeg.exec(outputArgs);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      toast.success("视频合成成功！", { id: loadingToast });
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeScene?.title || 'scene'}_export.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Synthesis Error:", error);
      toast.error("视频合成失败，请重试。", { id: loadingToast });
    } finally {
      setIsSynthesizing(false);
    }
  };

  return {
    isGeneratingImage,
    isGeneratingVideo,
    isGeneratingVoice,
    isSynthesizing,
    promptModalState,
    setPromptModalState,
    handlePrepareGenerateImage,
    handlePrepareGenerateVideo,
    handleGenerateImage,
    handleGenerateVideo,
    handleGenerateVoice,
    handleSynthesize,
  };
}
