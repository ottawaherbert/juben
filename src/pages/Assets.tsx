import { useProjectStore } from '../store/useProjectStore';
import { motion } from 'motion/react';
import { User, Image as ImageIcon, Box, Upload, X, Wand2, Loader2, ScanSearch, Plus } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { generateAIImage, generateAIContent } from '../services/ai';
import { Type } from '@google/genai';
import toast from 'react-hot-toast';
import AddAssetModal from '../components/AddAssetModal';
import { formatCreativeVision } from '../utils/projectUtils';

export default function Assets() {
  const { currentProject, updateProject } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [generatingAssetId, setGeneratingAssetId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Combine characters and assets for display
  const allAssets = [
    ...(currentProject?.characters || []).map(c => ({
      id: c.id,
      type: 'character' as const,
      name: c.name,
      description: c.externalGoal || c.internalDesire || '',
      imageUrl: c.referenceImageUrl,
      tags: []
    })),
    ...(currentProject?.assets || [])
  ];

  // Extract all unique tags
  const allTags = Array.from(new Set(allAssets.flatMap(a => a.tags || []) || []));

  // Filter assets
  const filteredAssets = allAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? asset.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  }) || [];

  const handleScanScripts = async () => {
    if (!currentProject || isScanning) return;
    
    setIsScanning(true);
    try {
      const { getItemRestored } = await import("../store/useProjectStore");
      const allScripts: string[] = [];
      
      for (const epMeta of currentProject.episodes) {
        const ep = await getItemRestored<any>(`project_${currentProject.id}_episode_${epMeta.id}`);
        if (ep && ep.scenes) {
          allScripts.push(...ep.scenes.map((s: any) => s.script).filter(Boolean));
        }
      }

      const allScriptsText = allScripts.join('\n\n---\n\n');

      if (!allScriptsText.trim()) {
        toast.error("当前没有任何剧本内容，请先在剧本页面生成剧本。");
        setIsScanning(false);
        return;
      }

      const existingNames = currentProject.assets.map(a => a.name).join(', ');
      const prompt = `【角色设定】\n你是全球顶级的、拥有最强大脑的影视制片统筹与资产管理专家。你目光如炬，能够从剧本的字里行间精准提取出所有关键的视觉实体。\n\n【任务目标】\n请仔细阅读以下剧本内容，并提取出剧本中出现的【角色】、【场景】和【重要道具】。\n注意：以下实体已经存在于资产库中，请【不要】重复提取：${existingNames || '无'}\n\n【剧本内容】\n${allScriptsText}\n\n【提取要求】\n请返回一个 JSON 数组，每个对象包含：\n1. type: 必须是 "character"（角色）、"location"（场地/环境）或 "prop"（道具）之一。\n2. name: 实体名称（如：张三、废弃工厂、神秘怀表）。\n3. description: 根据剧本内容，推断并详细描述该实体的外观、特征、内在属性或氛围。\n4. prompt: 用于 AI 绘图的英文提示词（Cinematic, high quality, detailed...）。如果 type 是 character，请参考剧本中的性格和外貌；如果是 location，请描述光影和环境。\n5. tags: 字符串数组，为该资产添加 2-3 个标签（如：赛博朋克、反派、室内、关键道具）。`;

      const responseText = await generateAIContent({
        prompt,
        requireJson: true,
        schema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              prompt: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["type", "name", "description", "prompt", "tags"]
          }
        }
      });

      const newAssetsData = JSON.parse(responseText || '[]');
      if (newAssetsData.length === 0) {
        toast.error("未发现新的资产。");
        return;
      }

      // Merge into existing assets
      const newAssets = newAssetsData.map((a: any) => ({
        id: a.type === 'character' ? `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: a.type as "character" | "location" | "prop",
        name: a.name,
        description: a.description,
        prompt: a.prompt,
        tags: a.tags || [],
      }));

      // If there are new characters, we should also sync them to the characters array
      const newCharacters = newAssets.filter((a: any) => a.type === 'character').map((a: any) => ({
        id: a.id.replace('char-', ''),
        name: a.name,
        internalDesire: '待补充',
        externalGoal: '待补充',
        flaw: '待补充',
        referenceImageUrl: undefined,
      }));

      const latestProject = useProjectStore.getState().currentProject;
      if (!latestProject) return;

      const updatedCharacters = [...(latestProject.characters || []), ...newCharacters];
      const updatedAssets = [...(latestProject.assets || []), ...newAssets.filter((a: any) => a.type !== 'character')];

      await updateProject({ 
        assets: updatedAssets,
        characters: updatedCharacters
      });

      toast.success(`成功提取了 ${newAssets.length} 个新资产！`);
    } catch (error) {
      console.error("Scan Error:", error);
      toast.error("扫描提取失败，请重试。");
    } finally {
      setIsScanning(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <User className="w-5 h-5 text-emerald-500" />;
      case 'location':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'prop':
        return <Box className="w-5 h-5 text-emerald-500" />;
      default:
        return <Box className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'character':
        return '角色';
      case 'location':
        return '场地';
      case 'prop':
        return '道具';
      default:
        return '未知';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeAssetId || !currentProject) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const latestProject = useProjectStore.getState().currentProject;
      if (!latestProject) return;
      const base64String = reader.result as string;
      
      const isCharacter = latestProject.characters?.some(c => c.id === activeAssetId);
      if (isCharacter) {
        const newCharacters = latestProject.characters.map(c => 
          c.id === activeAssetId ? { ...c, referenceImageUrl: base64String } : c
        );
        updateProject({ characters: newCharacters });
      } else {
        const newAssets = latestProject.assets.map(asset => 
          asset.id === activeAssetId ? { ...asset, imageUrl: base64String } : asset
        );
        updateProject({ assets: newAssets });
      }
      setActiveAssetId(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (assetId: string) => {
    const latestProject = useProjectStore.getState().currentProject;
    if (!latestProject) return;
    
    const isCharacter = latestProject.characters?.some(c => c.id === assetId);
    if (isCharacter) {
      const newCharacters = latestProject.characters.map(c => 
        c.id === assetId ? { ...c, referenceImageUrl: undefined } : c
      );
      updateProject({ characters: newCharacters });
    } else {
      const newAssets = latestProject.assets.map(asset => 
        asset.id === assetId ? { ...asset, imageUrl: undefined } : asset
      );
      updateProject({ assets: newAssets });
    }
  };

  const handleGenerateImage = async (assetId: string, prompt: string, type: string) => {
    if (!currentProject || generatingAssetId) return;
    setGeneratingAssetId(assetId);

    try {
      const creativeVision = currentProject.creativeVision;
      const stylePrompt = creativeVision ? `\n【全局风格要求】\n${formatCreativeVision(creativeVision)}\n请严格遵循上述视觉风格和对标作品的质感、色调、光影进行绘制。` : "";

      const fullPrompt = `请生成一张电影概念设计图。
【资产类型】: ${getTypeLabel(type)}
【资产描述】: ${prompt}
${stylePrompt}
要求：画面具有电影感，高品质，细节丰富。`;

      const imageUrl = await generateAIImage({
        prompt: fullPrompt,
        aspectRatio: "16:9",
      });

      const latestProject = useProjectStore.getState().currentProject;
      if (!latestProject) return;

      const isCharacter = latestProject.characters?.some(c => c.id === assetId);
      if (isCharacter) {
        const newCharacters = latestProject.characters.map(c => 
          c.id === assetId ? { ...c, referenceImageUrl: imageUrl } : c
        );
        updateProject({ characters: newCharacters });
      } else {
        const newAssets = latestProject.assets.map(asset => 
          asset.id === assetId ? { ...asset, imageUrl } : asset
        );
        updateProject({ assets: newAssets });
      }
    } catch (error) {
      console.error("Generate Image Error:", error);
      toast.error("生成图片失败，请重试。");
    } finally {
      setGeneratingAssetId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-12 h-full flex flex-col"
    >
      <div className="mb-8 md:mb-12 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            资产库 (Asset Library)
          </h1>
          <p className="text-neutral-400 text-sm">
            {currentProject ? `当前项目: ${currentProject.title}` : '全局资产库'}
          </p>
        </div>
        {currentProject && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增资产
            </button>
            <button
              onClick={handleScanScripts}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ScanSearch className="w-4 h-4" />
              )}
              {isScanning ? '正在扫描剧本...' : '扫描剧本提取新资产'}
            </button>
          </div>
        )}
      </div>

      {currentProject && (
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="搜索资产名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTag === null ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTag === tag ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
        {!currentProject ? (
          <div className="flex items-center justify-center h-full text-neutral-500 border-2 border-dashed border-neutral-800 rounded-3xl">
            请先在项目列表中选择一个项目以查看其资产。
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-neutral-950 rounded-lg">
                    {getIcon(asset.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white truncate">{asset.name}</h3>
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {getTypeLabel(asset.type)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  {/* Reference Image Section */}
                  <div className="relative aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 group flex items-center justify-center">
                    {asset.imageUrl ? (
                      <>
                        <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(asset.id)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                          title="移除参考图"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-500 p-4 text-center w-full h-full">
                        {generatingAssetId === asset.id ? (
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 mb-2 animate-spin text-emerald-500" />
                            <span className="text-xs text-emerald-500">正在生成...</span>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs mb-3">暂无参考图</span>
                            <div className="flex flex-col gap-2 w-full max-w-[160px]">
                              <button 
                                onClick={() => handleGenerateImage(asset.id, ('prompt' in asset ? asset.prompt : '') || asset.description || asset.name, asset.type)}
                                className="w-full text-[10px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/30"
                              >
                                <Wand2 className="w-3 h-3" />
                                AI 生成
                              </button>
                              <button 
                                onClick={() => {
                                  setActiveAssetId(asset.id);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Upload className="w-3 h-3" />
                                本地上传
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-sm text-neutral-400 mb-4">
                      {asset.description}
                    </p>
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {asset.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] rounded-md border border-neutral-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider">
                        AI 提示词
                      </label>
                      <textarea
                        value={('prompt' in asset ? asset.prompt : '') || ''}
                        onChange={(e) => {
                          const isCharacter = currentProject.characters?.some(c => c.id === asset.id);
                          if (isCharacter) {
                            // Characters don't have a prompt field in this view, but if they did, we'd update it.
                            // Currently they just use externalGoal/internalDesire as description.
                            // Let's just update the description field if it was mapped, but actually characters don't have a prompt field in the interface.
                            // We can just ignore or update a custom field if needed.
                          } else {
                            const newAssets = currentProject.assets.map(a => 
                              a.id === asset.id ? { ...a, prompt: e.target.value } : a
                            );
                            updateProject({ assets: newAssets });
                          }
                        }}
                        placeholder="输入用于生成图片的提示词..."
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 font-mono focus:outline-none focus:border-emerald-500 transition-colors resize-none h-24 custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500 border-2 border-dashed border-neutral-800 rounded-3xl">
            当前项目暂无资产。请在“剧本”页面提取角色、场景和道具。
          </div>
        )}
      </div>
      
      {/* Hidden file input for image upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <AddAssetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </motion.div>
  );
}
