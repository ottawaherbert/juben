import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultTemplates, PromptTemplate } from '../config/prompts';

interface PromptStore {
  templates: Record<string, PromptTemplate>;
  updateTemplate: (id: string, template: string) => void;
  resetTemplate: (id: string) => void;
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set) => ({
      templates: defaultTemplates,
      updateTemplate: (id, template) =>
        set((state) => ({
          templates: {
            ...state.templates,
            [id]: { ...state.templates[id], template },
          },
        })),
      resetTemplate: (id) =>
        set((state) => ({
          templates: {
            ...state.templates,
            [id]: defaultTemplates[id],
          },
        })),
    }),
    {
      name: 'omni-prompt-storage',
      version: 1,
      merge: (persistedState: any, currentState: PromptStore) => {
        return {
          ...currentState,
          ...persistedState,
          templates: {
            ...currentState.templates,
            ...(persistedState?.templates || {}),
          },
        };
      },
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as PromptStore;
        let newTemplates = { ...defaultTemplates, ...(state.templates || {}) };
        
        if (version === 0) {
          for (const key in newTemplates) {
            if (newTemplates[key] && typeof newTemplates[key].template === 'string') {
              newTemplates[key].template = newTemplates[key].template.replace(/\\n/g, '\n');
            }
          }
        }
        return {
          ...state,
          templates: newTemplates,
        };
      },
    }
  )
);
