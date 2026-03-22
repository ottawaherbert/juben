import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'google' | 'deepseek';

interface SettingsState {
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  isOmniWindowEnabled: boolean;
  setIsOmniWindowEnabled: (enabled: boolean) => void;
  isFastMode: boolean;
  setIsFastMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiProvider: 'google', // Default to google
      setAiProvider: (provider) => set({ aiProvider: provider }),
      isOmniWindowEnabled: true,
      setIsOmniWindowEnabled: (enabled) => set({ isOmniWindowEnabled: enabled }),
      isFastMode: false,
      setIsFastMode: (enabled) => set({ isFastMode: enabled }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
