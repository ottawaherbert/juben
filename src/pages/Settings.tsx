import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wand2, Settings2, Cpu, Network, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAIConfigStore, AIChannel, AIModel } from '../store/useAIConfigStore';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'basic' | 'ai'>('basic');
  const { isOmniWindowEnabled, setIsOmniWindowEnabled, isFastMode, setIsFastMode } = useSettingsStore();
  const { 
    channels, models, routing, comfyWorkflows,
    addChannel, updateChannel, deleteChannel,
    addModel, updateModel, deleteModel,
    updateRouting, addComfyWorkflow, updateComfyWorkflow, deleteComfyWorkflow
  } = useAIConfigStore();

  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');

  const filteredModels = selectedChannelFilter === 'all' 
    ? models 
    : models.filter(m => m.channelId === selectedChannelFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-12 h-full flex flex-col max-w-5xl mx-auto"
    >
      <div className="mb-8 md:mb-12 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            系统设置 (Settings)
          </h1>
          <p className="text-neutral-400 text-sm">
            管理全局配置和大模型路由
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-neutral-800 pb-px">
        <button
          onClick={() => setActiveTab('basic')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'basic' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            基础设置
          </div>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'ai' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            大模型配置
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-8">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">O.M.N.I 主脑视窗</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    在全局悬浮显示 O.M.N.I 智能助手
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isOmniWindowEnabled}
                    onChange={(e) => setIsOmniWindowEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </section>

            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">快速模式 (Fast Mode)</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    开启后，将隐藏复杂的集数和结构管理，使用扁平化的大纲板 (Beat Board) 进行创作
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isFastMode}
                    onChange={(e) => setIsFastMode(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8">
            {/* Task Routing */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Network className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">任务路由 (Task Routing)</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    为不同任务指定默认使用的 AI 模型
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(routing).map(([task, modelId]) => (
                  <div key={task} className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-300 capitalize">
                      {task.replace('Gen', ' Generation')}
                    </label>
                    <select
                      value={modelId}
                      onChange={(e) => updateRouting({ [task]: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                    >
                      <option value="">-- 选择模型 --</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.alias} ({m.modelId})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* Channels */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Cpu className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">渠道管理 (Channels)</h2>
                    <p className="text-xs text-neutral-400 mt-1">配置 API 供应商和接口规范</p>
                  </div>
                </div>
                <button
                  onClick={() => addChannel({
                    id: `channel-${Date.now()}`,
                    name: 'New Channel',
                    type: 'openai',
                    baseUrl: '',
                    apiKey: ''
                  })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> 新增渠道
                </button>
              </div>
              
              <div className="space-y-4">
                {channels.map(channel => (
                  <div key={channel.id} className="p-4 border border-neutral-800 rounded-xl bg-neutral-950 space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={channel.name}
                        onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                        className="bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500"
                      />
                      <button onClick={() => deleteChannel(channel.id)} className="text-neutral-500 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">API 规范</label>
                        <select
                          value={channel.type}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            const updates: Partial<AIChannel> = { type: newType };
                            if (newType === 'gemini' && (!channel.baseUrl || channel.baseUrl === 'https://api.openai.com/v1')) {
                              updates.baseUrl = 'https://generativelanguage.googleapis.com';
                            } else if (newType === 'openai' && (!channel.baseUrl || channel.baseUrl === 'https://generativelanguage.googleapis.com')) {
                              updates.baseUrl = 'https://api.openai.com/v1';
                            } else if (newType === 'minimax' && (!channel.baseUrl || channel.baseUrl === 'https://api.openai.com/v1' || channel.baseUrl === 'https://generativelanguage.googleapis.com')) {
                              updates.baseUrl = 'https://api.minimaxi.com/anthropic';
                            }
                            updateChannel(channel.id, updates);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="openai">OpenAI 兼容</option>
                          <option value="gemini">Google Gemini</option>
                          <option value="minimax">MiniMax (Anthropic 兼容)</option>
                          <option value="comfyui">ComfyUI</option>
                          <option value="custom">自定义</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Base URL</label>
                        <input
                          type="text"
                          value={channel.baseUrl}
                          onChange={(e) => updateChannel(channel.id, { baseUrl: e.target.value })}
                          placeholder={channel.type === 'gemini' ? "https://generativelanguage.googleapis.com" : "https://api.openai.com/v1"}
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">API Key</label>
                        <input
                          type="password"
                          value={channel.apiKey}
                          onChange={(e) => updateChannel(channel.id, { apiKey: e.target.value })}
                          placeholder="sk-..."
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Models */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Wand2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">模型管理 (Models)</h2>
                    <p className="text-xs text-neutral-400 mt-1">配置具体模型及其能力</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">按渠道筛选:</span>
                    <select
                      value={selectedChannelFilter}
                      onChange={(e) => setSelectedChannelFilter(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">全部渠道</option>
                      {channels.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                    if (channels.length === 0) {
                      toast.error('请先创建渠道');
                      return;
                    }
                    addModel({
                      id: `model-${Date.now()}`,
                      channelId: channels[0].id,
                      alias: 'New Model',
                      modelId: 'gpt-4o',
                      capabilities: ['text']
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> 新增模型
                </button>
              </div>
            </div>

            <div className="space-y-4">
                {filteredModels.map(model => (
                  <div key={model.id} className="p-4 border border-neutral-800 rounded-xl bg-neutral-950 space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={model.alias}
                        onChange={(e) => updateModel(model.id, { alias: e.target.value })}
                        className="bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500"
                        placeholder="模型别名 (如 GPT-4o)"
                      />
                      <button onClick={() => deleteModel(model.id)} className="text-neutral-500 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">所属渠道</label>
                        <select
                          value={model.channelId}
                          onChange={(e) => updateModel(model.id, { channelId: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        >
                          {channels.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Model ID</label>
                        <input
                          type="text"
                          value={model.modelId}
                          onChange={(e) => updateModel(model.id, { modelId: e.target.value })}
                          placeholder="gpt-4o"
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">能力标签 (逗号分隔)</label>
                        <input
                          type="text"
                          value={model.capabilities.join(', ')}
                          onChange={(e) => {
                            const caps = e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any[];
                            updateModel(model.id, { capabilities: caps });
                          }}
                          placeholder="text, image, video"
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ComfyUI Workflows */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Settings2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">ComfyUI 工作流 (Workflows)</h2>
                    <p className="text-xs text-neutral-400 mt-1">配置本地 ComfyUI 接口与参数映射</p>
                  </div>
                </div>
                <button
                  onClick={() => addComfyWorkflow({
                    id: `workflow-${Date.now()}`,
                    name: 'New Workflow',
                    workflowJson: {},
                    mappings: []
                  })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> 新增工作流
                </button>
              </div>

              <div className="space-y-4">
                {comfyWorkflows.map(workflow => (
                  <div key={workflow.id} className="p-4 border border-neutral-800 rounded-xl bg-neutral-950 space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={workflow.name}
                        onChange={(e) => updateComfyWorkflow(workflow.id, { name: e.target.value })}
                        className="bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-emerald-500"
                        placeholder="工作流名称"
                      />
                      <button onClick={() => deleteComfyWorkflow(workflow.id)} className="text-neutral-500 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">API JSON (Save API Format)</label>
                      <textarea
                        value={JSON.stringify(workflow.workflowJson, null, 2)}
                        onChange={(e) => {
                          try {
                            const json = JSON.parse(e.target.value);
                            updateComfyWorkflow(workflow.id, { workflowJson: json });
                          } catch (err) {
                            // ignore invalid json while typing
                          }
                        }}
                        className="w-full h-32 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 font-mono resize-y"
                        placeholder="{ ... }"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs text-neutral-500">参数映射 (Node Mapping)</label>
                        <button
                          onClick={() => {
                            updateComfyWorkflow(workflow.id, {
                              mappings: [...workflow.mappings, { systemParam: 'prompt', nodeId: '', nodeInput: 'text' }]
                            });
                          }}
                          className="text-xs text-emerald-500 hover:text-emerald-400"
                        >
                          + 添加映射
                        </button>
                      </div>
                      <div className="space-y-2">
                        {workflow.mappings.map((mapping, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              value={mapping.systemParam}
                              onChange={(e) => {
                                const newMappings = [...workflow.mappings];
                                newMappings[idx].systemParam = e.target.value;
                                updateComfyWorkflow(workflow.id, { mappings: newMappings });
                              }}
                              className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-1.5 text-xs focus:outline-none focus:border-emerald-500"
                            >
                              <option value="prompt">Prompt (提示词)</option>
                              <option value="negative_prompt">Negative Prompt (反向提示词)</option>
                              <option value="image">Image (参考图)</option>
                              <option value="seed">Seed (随机种子)</option>
                            </select>
                            <span className="text-neutral-500 text-xs">→</span>
                            <input
                              type="text"
                              value={mapping.nodeId}
                              onChange={(e) => {
                                const newMappings = [...workflow.mappings];
                                newMappings[idx].nodeId = e.target.value;
                                updateComfyWorkflow(workflow.id, { mappings: newMappings });
                              }}
                              placeholder="Node ID (e.g. 6)"
                              className="w-24 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-1.5 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text"
                              value={mapping.nodeInput}
                              onChange={(e) => {
                                const newMappings = [...workflow.mappings];
                                newMappings[idx].nodeInput = e.target.value;
                                updateComfyWorkflow(workflow.id, { mappings: newMappings });
                              }}
                              placeholder="Input (e.g. text)"
                              className="w-24 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-1.5 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              onClick={() => {
                                const newMappings = workflow.mappings.filter((_, i) => i !== idx);
                                updateComfyWorkflow(workflow.id, { mappings: newMappings });
                              }}
                              className="text-neutral-500 hover:text-red-500 ml-auto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </motion.div>
  );
}
