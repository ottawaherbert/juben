import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Type } from '@google/genai';
import { Loader2, Sparkles, Globe2, SlidersHorizontal, ArrowRight, ArrowLeft, Users, MapPin, Check } from 'lucide-react';
import { generateAIContent } from '../services/ai';
import toast from 'react-hot-toast';
import PromptEditorModal from '../components/PromptEditorModal';
import { getProjectTypeLabel } from '../utils/projectUtils';

const REGIONS = [
  { id: 'global', label: '🌍 全球随机混合' },
  { id: 'us', label: '🇺🇸 美国 (商业大片/独立)' },
  { id: 'cn', label: '🇨🇳 中国大陆 (第五代/第六代)' },
  { id: 'hk', label: '🇭🇰 中国香港 (王家卫/杜琪峰)' },
  { id: 'jp', label: '🇯🇵 日本 (是枝裕和/黑泽明)' },
  { id: 'kr', label: '🇰🇷 韩国 (奉俊昊/朴赞郁)' },
  { id: 'fr', label: '🇫🇷 法国 (新浪潮/吕克·贝松)' },
  { id: 'it', label: '🇮🇹 意大利 (新现实主义/费里尼)' },
  { id: 'in', label: '🇮🇳 印度 (宝莱坞/阿米尔·汗)' },
  { id: 'uk', label: '🇬🇧 英国 (盖·里奇/诺兰)' },
  { id: 'es', label: '🇪🇸 西班牙 (阿莫多瓦/保罗)' },
  { id: 'ir', label: '🇮🇷 伊朗 (阿巴斯/法哈蒂)' },
];

export default function Home() {
  const { createProject } = useProjectStore();
  const navigate = useNavigate();
  const [inspiration, setInspiration] = useState('');
  const [type, setType] = useState<'movie' | 'tv-series' | 'short-drama'>('movie');
  const [aspectRatio, setAspectRatio] = useState('2.39:1');
  
  // New state for Phase 3 feature
  const [versionCount, setVersionCount] = useState(3);
  const [styleMode, setStyleMode] = useState<'region' | 'director-actor'>('region');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['global']);
  const [customRegion, setCustomRegion] = useState('');
  const [customDirectorActor, setCustomDirectorActor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});

  const toggleRegion = (id: string) => {
    if (id === 'global') {
      setSelectedRegions(['global']);
      return;
    }
    
    setSelectedRegions(prev => {
      const newSelection = prev.filter(r => r !== 'global');
      if (newSelection.includes(id)) {
        const filtered = newSelection.filter(r => r !== id);
        return filtered.length === 0 ? ['global'] : filtered;
      } else {
        return [...newSelection, id];
      }
    });
  };

  const handlePrepareGenerate = () => {
    if (!inspiration || isGenerating) return;

    let styleInstructions = '';
    if (styleMode === 'region') {
      const regionLabels = selectedRegions.map(id => REGIONS.find(r => r.id === id)?.label).filter(Boolean);
      if (customRegion.trim()) {
        regionLabels.push(customRegion.trim());
      }
      const regionString = regionLabels.length > 0 ? regionLabels.join('、') : '全球随机混合';
      
      styleInstructions = `- 风格倾向请参考国家/地区：${regionString}。请根据【用户的创意】选择符合该国家/地区风格的导演/演员作为参考。
- 如果包含“全球随机混合”，请提供截然不同的风格（如商业大片、欧洲文艺、日韩犯罪等）。
- 如果选择了多个国家/地区，请在生成的 ${versionCount} 个版本中，融合或分别体现这些国家/地区的风格。
- 如果只选择了一个国家/地区，请基于该国家/地区生成 ${versionCount} 个不同细分风格的版本。`;
    } else {
      styleInstructions = `- 风格倾向请严格参考以下导演/演员：${customDirectorActor || '未指定'}。
- 请基于这些导演/演员的标志性视觉、叙事和表演风格，生成 ${versionCount} 个不同侧重点的版本。`;
    }

    setPromptVariables({
      inspiration,
      type: getProjectTypeLabel(type),
      versionCount: versionCount.toString(),
      styleInstructions
    });
    setIsPromptModalOpen(true);
  };

  const handleGenerateProposals = async (finalPrompt: string) => {
    setIsGenerating(true);
    setGeneratedData(null);

    try {
      console.log('--- AI Request ---');
      console.log('Prompt:', finalPrompt);

      const responseText = await generateAIContent({
        prompt: finalPrompt,
        requireJson: true,
        schema: {
          type: Type.OBJECT,
          properties: {
            premiseReasoning: { type: Type.STRING },
            logline: { type: Type.STRING },
            coreConflict: {
              type: Type.OBJECT,
              properties: {
                want: { type: Type.STRING },
                need: { type: Type.STRING },
                antagonism: { type: Type.STRING },
                stakes: { type: Type.STRING }
              },
              required: ["want", "need", "antagonism", "stakes"]
            },
            creativeVisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  visionReasoning: { type: Type.STRING },
                  versionName: { type: Type.STRING },
                  genre: { type: Type.ARRAY, items: { type: Type.STRING } },
                  visualStyle: { type: Type.STRING },
                  narrativeStyle: { type: Type.STRING },
                  referenceWorks: { type: Type.STRING },
                  globalLookTags: { type: Type.STRING },
                },
                required: ["visionReasoning", "versionName", "genre", "visualStyle", "narrativeStyle", "referenceWorks", "globalLookTags"]
              }
            }
          },
          required: ["premiseReasoning", "logline", "coreConflict", "creativeVisions"]
        }
      });

      console.log('--- AI Response Text ---');
      console.log(responseText);
      console.log('------------------------');

      let result: any = {};
      try {
        result = JSON.parse(responseText || '{}');
      } catch (e) {
        console.error("JSON Parse Error:", e, "Raw Text:", responseText);
        toast.error("AI 返回的数据格式有误，请重试或切换模型。");
        setIsGenerating(false);
        return;
      }
      
      // Fallback for wrapped response or different field names
      if (result.projectBible) {
        result = { ...result, ...result.projectBible };
      }
      if (typeof result.coreConflict === 'object' && result.coreConflict !== null) {
        const cc = result.coreConflict;
        result.coreConflict = `【外部目标】${cc.want || ''}\n【内在缺失】${cc.need || ''}\n【对抗力量】${cc.antagonism || ''}\n【终极代价】${cc.stakes || ''}`;
      }

      console.log('--- Parsed Result ---');
      console.dir(result, { depth: null });
      console.log('---------------------');

      if (!result.creativeVisions || result.creativeVisions.length === 0) {
        console.warn('Warning: No creative visions generated by the model.');
        toast.error('未能生成创作视点，请尝试修改灵感或重试');
      }

      setGeneratedData(result);
    } catch (error) {
      console.error('Generation Error:', error);
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVision = async (vision: any) => {
    if (!generatedData) return;
    
    try {
      await createProject({
        title: '未命名项目 (Untitled)',
        type,
        aspectRatio,
        logline: generatedData.logline || inspiration,
        coreConflict: generatedData.coreConflict || '',
        creativeVision: {
          genre: vision.genre || [],
          visualStyle: vision.visualStyle || '',
          narrativeStyle: vision.narrativeStyle || '',
          referenceWorks: vision.referenceWorks || '',
          globalLookTags: vision.globalLookTags || ''
        },
        characters: [],
        scenes: [],
        episodes: [],
        assets: [],
      });
      navigate('/bible');
    } catch (error) {
      console.error('Failed to create project:', error);
      // Toast is already shown in createProject
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <AnimatePresence mode="wait">
        {!generatedData ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 font-serif">
                <span className="text-emerald-500">O.M.N.I.</span> 灵感注入端
              </h1>
              <p className="text-sm md:text-lg text-neutral-400 max-w-2xl mx-auto">
                输入一句话灵感或小说章节，选择类型，一键立项。主脑将自动为您生成项目圣经。
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
              {/* 项目类型 */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  项目类型
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setType('movie')}
                    className={`flex-1 py-4 px-6 rounded-2xl border transition-all ${
                      type === 'movie'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">电影长片</div>
                    <div className="text-xs opacity-70">120分钟标准结构</div>
                  </button>
                  <button
                    onClick={() => setType('tv-series')}
                    className={`flex-1 py-4 px-6 rounded-2xl border transition-all ${
                      type === 'tv-series'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">电视剧/网剧</div>
                    <div className="text-xs opacity-70">多集连续叙事</div>
                  </button>
                  <button
                    onClick={() => setType('short-drama')}
                    className={`flex-1 py-4 px-6 rounded-2xl border transition-all ${
                      type === 'short-drama'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">微短剧</div>
                    <div className="text-xs opacity-70">强钩子 / 快节奏反转</div>
                  </button>
                </div>
              </div>

              {/* 画幅比例 */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  画幅比例 (Aspect Ratio)
                </label>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4">
                  {[
                    { value: '2.39:1', label: '2.39:1', desc: '电影宽银幕' },
                    { value: '16:9', label: '16:9', desc: '标准宽屏' },
                    { value: '9:16', label: '9:16', desc: '手机竖屏' },
                    { value: '4:3', label: '4:3', desc: '复古电视' },
                    { value: '1:1', label: '1:1', desc: '正方形' },
                  ].map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`flex-1 min-w-0 sm:min-w-[100px] py-3 px-4 rounded-xl border transition-all ${
                        aspectRatio === ar.value
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-bold mb-1">{ar.label}</div>
                      <div className="text-xs opacity-70">{ar.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 灵感种子 */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  灵感种子 (Logline / 核心设定)
                </label>
                <textarea
                  value={inspiration}
                  onChange={(e) => setInspiration(e.target.value)}
                  placeholder="例如：一个能看到别人死亡倒计时的程序员，发现自己的倒计时只剩24小时... (可补充：赛博朋克风格，昆汀式对白，对标《银翼杀手》)"
                  className="w-full h-40 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
              </div>

              {/* 多维度创作视点配置 */}
              <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-medium text-white">AI 制片人：多维度创作视点生成</h3>
                </div>
                
                <div className="space-y-6">
                  {/* 生成版本数 */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-neutral-400 mb-3">
                      <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> 生成版本数</span>
                      <span className="text-emerald-500 font-mono">{versionCount}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={versionCount}
                      onChange={(e) => setVersionCount(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-neutral-600 mt-2">
                      <span>1 个</span>
                      <span>10 个</span>
                    </div>
                  </div>

                  {/* 风格模式切换 */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-3">风格参考模式</label>
                    <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                      <button
                        onClick={() => {
                          setStyleMode('region');
                          setCustomDirectorActor('');
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          styleMode === 'region' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <MapPin className="w-4 h-4" /> 国家/地区模式
                      </button>
                      <button
                        onClick={() => {
                          setStyleMode('director-actor');
                          setSelectedRegions(['global']);
                          setCustomRegion('');
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          styleMode === 'director-actor' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        <Users className="w-4 h-4" /> 导演/演员模式
                      </button>
                    </div>
                  </div>

                  {/* 模式对应的内容 */}
                  {styleMode === 'region' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-3">
                          选择国家/地区 (可多选，选"全球随机混合"则清空其他)
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {REGIONS.map(r => (
                            <button
                              key={r.id}
                              onClick={() => toggleRegion(r.id)}
                              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                selectedRegions.includes(r.id)
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50 shadow-sm shadow-emerald-500/10'
                                  : 'bg-neutral-800/50 text-neutral-300 ring-1 ring-neutral-700 hover:bg-neutral-800 hover:ring-neutral-600'
                              }`}
                            >
                              {r.label}
                              {selectedRegions.includes(r.id) && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">自定义国家/地区 (可选)</label>
                        <input
                          type="text"
                          value={customRegion}
                          onChange={(e) => setCustomRegion(e.target.value)}
                          placeholder="例如：北欧、拉美、东南亚..."
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">指定导演/演员 (手动输入)</label>
                        <textarea
                          value={customDirectorActor}
                          onChange={(e) => setCustomDirectorActor(e.target.value)}
                          placeholder="例如：导演选克里斯托弗·诺兰，演员选莱昂纳多·迪卡普里奥和汤姆·哈迪..."
                          className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                          在此模式下，AI 将严格参考您输入的导演和演员风格来生成创作视点。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handlePrepareGenerate}
                disabled={!inspiration || isGenerating}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    主脑正在推演 {versionCount} 种创作视点...
                  </>
                ) : (
                  '一键立项 (Initialize Project)'
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="proposals-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">选择创作视点 (Creative Vision)</h2>
                <p className="text-neutral-400">AI 制片人已为您推演了 {generatedData.creativeVisions?.length || 0} 种不同的项目包装方案。</p>
              </div>
              <button
                onClick={() => setGeneratedData(null)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-neutral-800"
              >
                <ArrowLeft className="w-4 h-4" /> 返回修改
              </button>
            </div>

            {/* 故事内核预览 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">核心故事 (Logline)</h3>
              <p className="text-lg text-white leading-relaxed">{generatedData.logline}</p>
            </div>

            {/* 视点卡片列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedData.creativeVisions && generatedData.creativeVisions.length > 0 ? (
                generatedData.creativeVisions.map((vision: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col transition-all group cursor-pointer"
                    onClick={() => handleSelectVision(vision)}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-emerald-400 mb-2">{vision.versionName}</h3>
                      <div className="flex flex-wrap gap-2">
                        {vision.genre?.map((g: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4 flex-1 mb-6">
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">视觉风格</div>
                        <div className="text-sm text-neutral-200">{vision.visualStyle}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">叙事风格</div>
                        <div className="text-sm text-neutral-200">{vision.narrativeStyle}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">对标作品</div>
                        <div className="text-sm text-neutral-200 italic">{vision.referenceWorks}</div>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-neutral-800 group-hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                      应用此视点 <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl">
                  <p className="text-neutral-400 mb-4">未能生成创作视点，您可以直接使用基础设定立项。</p>
                  <button
                    onClick={() => handleSelectVision({
                      versionName: "默认视点",
                      genre: [],
                      visualStyle: "",
                      narrativeStyle: "",
                      referenceWorks: ""
                    })}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                  >
                    使用基础设定立项
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PromptEditorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        templateId="generateProposals"
        variables={promptVariables}
        onConfirm={handleGenerateProposals}
      />
    </div>
  );
}
