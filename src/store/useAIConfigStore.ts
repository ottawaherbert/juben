import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChannelType = 'openai' | 'gemini' | 'minimax' | 'comfyui' | 'custom';

export interface AIChannel {
  id: string;
  name: string;
  type: ChannelType;
  baseUrl: string;
  apiKey: string;
}

export interface AIModel {
  id: string;
  channelId: string;
  alias: string;
  modelId: string;
  capabilities: ('text' | 'image' | 'video' | 'audio')[];
  apiKeyOverride?: string;
}

export interface TaskRouting {
  scriptGen: string; // modelId
  storyboardGen: string;
  imageGen: string;
  videoGen: string;
  audioGen: string;
}

export interface ComfyNodeMapping {
  systemParam: string;
  nodeId: string;
  nodeInput: string;
}

export interface ComfyWorkflow {
  id: string;
  name: string;
  workflowJson: any;
  mappings: ComfyNodeMapping[];
}

interface AIConfigState {
  channels: AIChannel[];
  models: AIModel[];
  routing: TaskRouting;
  comfyWorkflows: ComfyWorkflow[];
  
  addChannel: (channel: AIChannel) => void;
  updateChannel: (id: string, channel: Partial<AIChannel>) => void;
  deleteChannel: (id: string) => void;
  
  addModel: (model: AIModel) => void;
  updateModel: (id: string, model: Partial<AIModel>) => void;
  deleteModel: (id: string) => void;
  
  updateRouting: (routing: Partial<TaskRouting>) => void;
  
  addComfyWorkflow: (workflow: ComfyWorkflow) => void;
  updateComfyWorkflow: (id: string, workflow: Partial<ComfyWorkflow>) => void;
  deleteComfyWorkflow: (id: string) => void;
}

const defaultChannels: AIChannel[] = [
  {
    id: 'default-openai',
    name: 'OpenAI (Default)',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
  },
  {
    id: 'default-gemini',
    name: 'Google Gemini (Default)',
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
  },
  {
    id: 'default-minimax',
    name: 'MiniMax (Anthropic Compatible)',
    type: 'minimax',
    baseUrl: 'https://api.minimaxi.com/anthropic',
    apiKey: '',
  }
];

const defaultModels: AIModel[] = [
  {
    id: 'minimax-m2.7',
    channelId: 'default-minimax',
    alias: 'MiniMax M2.7',
    modelId: 'MiniMax-M2.7',
    capabilities: ['text'],
  },
  {
    id: 'minimax-m2.5',
    channelId: 'default-minimax',
    alias: 'MiniMax M2.5',
    modelId: 'MiniMax-M2.5',
    capabilities: ['text'],
  },
  {
    id: 'minimax-m2.1',
    channelId: 'default-minimax',
    alias: 'MiniMax M2.1',
    modelId: 'MiniMax-M2.1',
    capabilities: ['text'],
  },
  {
    id: 'gemini-3-flash',
    channelId: 'default-gemini',
    alias: 'Gemini 3 Flash',
    modelId: 'gemini-3-flash-preview',
    capabilities: ['text'],
  },
  {
    id: 'gemini-3.1-pro',
    channelId: 'default-gemini',
    alias: 'Gemini 3.1 Pro',
    modelId: 'gemini-3.1-pro-preview',
    capabilities: ['text'],
  },
  {
    id: 'gemini-2.5-flash-image',
    channelId: 'default-gemini',
    alias: 'Gemini 2.5 Flash Image',
    modelId: 'gemini-2.5-flash-image',
    capabilities: ['image'],
  },
  {
    id: 'veo-3.1-fast',
    channelId: 'default-gemini',
    alias: 'Veo 3.1 Fast',
    modelId: 'veo-3.1-fast-generate-preview',
    capabilities: ['video'],
  },
  {
    id: 'gemini-tts',
    channelId: 'default-gemini',
    alias: 'Gemini TTS',
    modelId: 'gemini-2.5-flash-preview-tts',
    capabilities: ['audio'],
  }
];

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set) => ({
      channels: defaultChannels,
      models: defaultModels,
      routing: {
        scriptGen: 'gemini-3.1-pro',
        storyboardGen: 'gemini-3-flash',
        imageGen: 'gemini-2.5-flash-image',
        videoGen: 'veo-3.1-fast',
        audioGen: 'gemini-tts',
      },
      comfyWorkflows: [],
      
      addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
      updateChannel: (id, updates) => set((state) => ({
        channels: state.channels.map((c) => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteChannel: (id) => set((state) => ({
        channels: state.channels.filter((c) => c.id !== id),
        models: state.models.filter((m) => m.channelId !== id)
      })),
      
      addModel: (model) => set((state) => ({ models: [...state.models, model] })),
      updateModel: (id, updates) => set((state) => ({
        models: state.models.map((m) => m.id === id ? { ...m, ...updates } : m)
      })),
      deleteModel: (id) => set((state) => ({
        models: state.models.filter((m) => m.id !== id)
      })),
      
      updateRouting: (updates) => set((state) => ({
        routing: { ...state.routing, ...updates }
      })),
      
      addComfyWorkflow: (workflow) => set((state) => ({ comfyWorkflows: [...state.comfyWorkflows, workflow] })),
      updateComfyWorkflow: (id, updates) => set((state) => ({
        comfyWorkflows: state.comfyWorkflows.map((w) => w.id === id ? { ...w, ...updates } : w)
      })),
      deleteComfyWorkflow: (id) => set((state) => ({
        comfyWorkflows: state.comfyWorkflows.filter((w) => w.id !== id)
      })),
    }),
    {
      name: 'ai-config-storage',
    }
  )
);
