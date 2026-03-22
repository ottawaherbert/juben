import { StateCreator } from 'zustand';
import { Episode, EpisodeMeta, Scene } from '../../types/project';
import { getItemRestored, setItemNow } from '../../utils/storage';
import { debouncedSetItem } from './projectSlice';

export interface EpisodeSlice {
  activeEpisodeId: string | null;
  activeEpisode: Episode | null;
  setActiveEpisodeId: (id: string | null) => Promise<void>;
  addEpisode: (episode: Episode) => Promise<void>;
  updateEpisode: (episodeId: string, updates: Partial<Episode>) => Promise<void>;
  deleteEpisode: (episodeId: string) => Promise<void>;
  reorderEpisodes: (startIndex: number, endIndex: number) => Promise<void>;
  reorderScenes: (episodeId: string, startIndex: number, endIndex: number) => Promise<void>;
  updateScene: (sceneId: string, updates: Partial<Scene>, episodeId?: string) => Promise<void>;
}

export const createEpisodeSlice: StateCreator<EpisodeSlice & any, [], [], EpisodeSlice> = (set, get) => ({
  activeEpisodeId: null,
  activeEpisode: null,

  setActiveEpisodeId: async (id) => {
    const { currentProject } = get();
    if (!currentProject || !id) {
      set({ activeEpisodeId: id, activeEpisode: null });
      return;
    }
    
    try {
      const episode = await getItemRestored<Episode>(`project_${currentProject.id}_episode_${id}`);
      set({ activeEpisodeId: id, activeEpisode: episode });
    } catch (e) {
      console.error("Failed to load episode:", e);
    }
  },

  updateScene: async (sceneId, updates, episodeId?: string) => {
    const { activeEpisode, updateEpisode, currentProject } = get();
    if (!currentProject) return;

    let targetEpisodeId = episodeId;
    
    if (!targetEpisodeId && activeEpisode) {
      targetEpisodeId = activeEpisode.id;
    }
    
    if (!targetEpisodeId) return;

    if (activeEpisode && activeEpisode.id === targetEpisodeId) {
      const newScenes = activeEpisode.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...updates } : s,
      );
      const updatedEp = { ...activeEpisode, scenes: newScenes };
      set({ activeEpisode: updatedEp });
      
      try {
        debouncedSetItem(`project_${currentProject.id}_episode_${targetEpisodeId}`, updatedEp);
      } catch (e) {
        console.error("Failed to persist scene update:", e);
      }
      return;
    }

    try {
      const ep = await getItemRestored<Episode>(`project_${currentProject.id}_episode_${targetEpisodeId}`);
      if (!ep) return;
      
      const newScenes = ep.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...updates } : s,
      );

      await updateEpisode(targetEpisodeId, { scenes: newScenes });
    } catch (e) {
      console.error("Failed to update scene:", e);
    }
  },

  addEpisode: async (episode) => {
    const { currentProject, updateProject } = get();
    if (!currentProject) return;
    
    const episodeMeta: EpisodeMeta = {
      id: episode.id,
      title: episode.title,
      inspiration: episode.inspiration,
      arcId: episode.arcId,
      targetDuration: episode.targetDuration,
      sceneCount: episode.scenes?.length || 0
    };
    
    const newEpisodes = [...currentProject.episodes, episodeMeta];
    await setItemNow(`project_${currentProject.id}_episode_${episode.id}`, episode);
    await updateProject({ episodes: newEpisodes });
    await get().setActiveEpisodeId(episode.id);
  },

  updateEpisode: async (episodeId, updates) => {
    const { currentProject, activeEpisode, updateProject } = get();
    if (!currentProject) return;
    
    let updatedEp: Episode | null = null;
    if (activeEpisode?.id === episodeId) {
      updatedEp = { ...activeEpisode, ...updates };
      set({ activeEpisode: updatedEp });
    }
    
    try {
      const existingEp = await getItemRestored<Episode>(`project_${currentProject.id}_episode_${episodeId}`);
      if (existingEp) {
        if (!updatedEp) {
          updatedEp = { ...existingEp, ...updates };
        } else {
          updatedEp = { ...existingEp, ...updatedEp };
        }
        
        debouncedSetItem(`project_${currentProject.id}_episode_${episodeId}`, updatedEp);
        
        const metaChanged = ['title', 'inspiration', 'arcId', 'targetDuration', 'scenes'].some(k => k in updates);
        if (metaChanged) {
          const newEpisodes = currentProject.episodes.map((ep) => {
            if (ep.id === episodeId) {
              const metaUpdates: Partial<EpisodeMeta> = {};
              if ('title' in updates) metaUpdates.title = updates.title;
              if ('inspiration' in updates) metaUpdates.inspiration = updates.inspiration;
              if ('arcId' in updates) metaUpdates.arcId = updates.arcId;
              if ('targetDuration' in updates) metaUpdates.targetDuration = updates.targetDuration;
              if ('scenes' in updates) metaUpdates.sceneCount = updates.scenes?.length || 0;
              return { ...ep, ...metaUpdates };
            }
            return ep;
          });
          await updateProject({ episodes: newEpisodes });
        }
      }
    } catch (e) {
      console.error("Failed to update episode:", e);
    }
  },

  deleteEpisode: async (episodeId) => {
    const { currentProject, activeEpisodeId, updateProject } = get();
    if (!currentProject) return;
    
    const localforage = (await import("localforage")).default;
    await localforage.removeItem(`project_${currentProject.id}_episode_${episodeId}`);
    
    const newEpisodes = currentProject.episodes.filter(
      (ep) => ep.id !== episodeId,
    );
    await updateProject({ episodes: newEpisodes });
    
    if (activeEpisodeId === episodeId) {
      if (newEpisodes.length > 0) {
        await get().setActiveEpisodeId(newEpisodes[0].id);
      } else {
        set({ activeEpisodeId: null, activeEpisode: null });
      }
    }
  },

  reorderEpisodes: async (startIndex, endIndex) => {
    const { currentProject, updateProject } = get();
    if (!currentProject) return;
    
    const newEpisodes = Array.from(currentProject.episodes);
    const [removed] = newEpisodes.splice(startIndex, 1);
    newEpisodes.splice(endIndex, 0, removed);
    
    await updateProject({ episodes: newEpisodes });
  },

  reorderScenes: async (episodeId, startIndex, endIndex) => {
    const { currentProject, activeEpisode, updateEpisode } = get();
    if (!currentProject) return;
    
    let targetEpisode = activeEpisode?.id === episodeId ? activeEpisode : null;
    
    if (!targetEpisode) {
      try {
        targetEpisode = await getItemRestored<Episode>(`project_${currentProject.id}_episode_${episodeId}`);
      } catch (e) {
        console.error("Failed to load episode for reordering scenes:", e);
      }
    }
    
    if (!targetEpisode) return;
    
    const newScenes = Array.from(targetEpisode.scenes);
    const [removed] = newScenes.splice(startIndex, 1);
    newScenes.splice(endIndex, 0, removed);
    
    await updateEpisode(episodeId, { scenes: newScenes });
  },
});
