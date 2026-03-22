import { StateCreator } from 'zustand';
import localforage from 'localforage';
import toast from 'react-hot-toast';
import { Project, Episode, EpisodeMeta, Asset, Character } from '../../types/project';
import { getItemRestored, setItemNow } from '../../utils/storage';

export interface ProjectSlice {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (project: Partial<Project>) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

// Helper for debounced persistence (shared logic, but defined here for now or moved to utils)
const debounceTimers: Record<string, NodeJS.Timeout> = {};
export const debouncedSetItem = (key: string, value: any, delay: number = 500) => {
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(async () => {
    try {
      const { extractAndSaveAssets } = await import("../../utils/storage");
      const optimizedValue = await extractAndSaveAssets(value);
      await localforage.setItem(key, optimizedValue);
    } catch (e) {
      console.error(`Failed to persist ${key}:`, e);
    }
    delete debounceTimers[key];
  }, delay);
};

export const createProjectSlice: StateCreator<ProjectSlice & any, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const keys = await localforage.keys();
      const projectKeys = keys.filter(k => k.startsWith('project_meta_'));
      const projects = await Promise.all(
        projectKeys.map(k => getItemRestored<Project>(k))
      );
      set({ projects: projects.filter(Boolean) as Project[], isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  createProject: async (project) => {
    set({ isLoading: true });
    try {
      const initialCharacters = project.characters || [];
      const initialAssets = project.assets || [];
      
      const charAssets = initialCharacters.map(c => ({
        id: `char-${c.id}`,
        type: "character" as const,
        name: c.name,
        description: `内在渴望: ${c.internalDesire}\n外在目标: ${c.externalGoal}\n致命弱点: ${c.flaw}`,
        prompt: `A cinematic portrait of ${c.name}, movie character concept art`,
        imageUrl: c.referenceImageUrl,
      }));
      
      const nonCharAssets = initialAssets.filter(a => a.type !== "character");
      const mergedAssets = [...nonCharAssets, ...charAssets];

      const id = Date.now().toString();
      
      const fullEpisodes: Episode[] = (project.episodes as any) || [];
      const episodeMetas: EpisodeMeta[] = fullEpisodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        inspiration: ep.inspiration,
        arcId: ep.arcId,
        targetDuration: ep.targetDuration
      }));

      const newProject: Project = {
        id,
        title: project.title || "Untitled Project",
        type: project.type || "movie",
        aspectRatio: project.aspectRatio || "16:9",
        globalGenerationParams: project.globalGenerationParams || {
          qualityPrompt: "",
          negativePrompt: ""
        },
        logline: project.logline || "",
        coreConflict: project.coreConflict || "",
        creativeVision: project.creativeVision || {
          genre: [],
          visualStyle: "",
          narrativeStyle: "",
          referenceWorks: ""
        },
        characters: initialCharacters,
        episodes: episodeMetas,
        assets: mergedAssets,
      };

      const { assets, characters, ...meta } = newProject;
      await setItemNow(`project_meta_${id}`, meta);
      await setItemNow(`project_${id}_assets`, assets);
      await setItemNow(`project_${id}_characters`, characters);
      
      for (const ep of fullEpisodes) {
        await setItemNow(`project_${id}_episode_${ep.id}`, ep);
      }

      set((state) => ({
        projects: [...state.projects, newProject],
        currentProject: newProject,
        isLoading: false,
      }));
      
      if (fullEpisodes.length > 0) {
        await get().setActiveEpisodeId(fullEpisodes[0].id);
      }
    } catch (e) {
      console.error("Failed to create project:", e);
      toast.error("创建项目失败，请检查存储");
      set({ isLoading: false });
      throw e;
    }
  },

  loadProject: async (id) => {
    set({ isLoading: true });
    try {
      let data = await getItemRestored<Project>(`project_meta_${id}`);
      const assets = await getItemRestored<Asset[]>(`project_${id}_assets`) || [];
      const characters = await getItemRestored<Character[]>(`project_${id}_characters`) || [];
      
      if (!data) {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const apiData = await res.json();
          const fullEpisodes = apiData.episodes || [];
          if (apiData.scenes && apiData.scenes.length > 0 && fullEpisodes.length === 0) {
            fullEpisodes.push({
              id: "default-episode",
              title: apiData.type === "movie" ? "第一幕" : "第1集",
              inspiration: "",
              scenes: [...apiData.scenes],
            });
            delete apiData.scenes;
          }
          
          const episodeMetas = fullEpisodes.map((ep: any) => ({
            id: ep.id,
            title: ep.title,
            inspiration: ep.inspiration,
            arcId: ep.arcId,
            targetDuration: ep.targetDuration
          }));
          
          data = { ...apiData, episodes: episodeMetas };
          const { assets: apiAssets = [], characters: apiCharacters = [], ...meta } = data as any;
          await setItemNow(`project_meta_${id}`, meta);
          await setItemNow(`project_${id}_assets`, apiAssets);
          await setItemNow(`project_${id}_characters`, apiCharacters);
          
          data.assets = apiAssets;
          data.characters = apiCharacters;
          
          for (const ep of fullEpisodes) {
            await setItemNow(`project_${id}_episode_${ep.id}`, ep);
          }
        }
      } else {
        if (data.assets) {
          await setItemNow(`project_${id}_assets`, data.assets);
        } else {
          data.assets = assets;
        }
        if (data.characters) {
          await setItemNow(`project_${id}_characters`, data.characters);
        } else {
          data.characters = characters;
        }
      }

      if (data) {
        set({ currentProject: data, isLoading: false });
        if (data.episodes && data.episodes.length > 0) {
          await get().setActiveEpisodeId(data.episodes[0].id);
        } else {
          set({ activeEpisodeId: null, activeEpisode: null });
        }
        
        setTimeout(async () => {
          try {
            const { cleanupExpiredTakes } = await import("../../utils/storage");
            const allEpisodes = [];
            for (const epMeta of data.episodes || []) {
              const ep = await getItemRestored<Episode>(`project_${data.id}_episode_${epMeta.id}`);
              if (ep) allEpisodes.push(ep);
            }
            await cleanupExpiredTakes(allEpisodes, data.assets || [], data.characters || [], data.id);
          } catch (err) {
            console.error("Failed to clean up expired takes:", err);
          }
        }, 5000);
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  updateProject: async (updates) => {
    const { currentProject } = get();
    if (!currentProject) return;

    let newAssets = updates.assets || currentProject.assets || [];
    let newCharacters = updates.characters || currentProject.characters || [];

    if (updates.characters) {
      const updatedCharIds = new Set(updates.characters.map(c => `char-${c.id}`));
      
      const retainedAssets = newAssets.filter(a => 
        a.type !== "character" || (!a.id.startsWith('char-') && !updatedCharIds.has(a.id))
      );

      const charAssets = updates.characters.map(c => {
        const existingAsset = newAssets.find(a => a.id === `char-${c.id}`);
        return {
          id: `char-${c.id}`,
          type: "character" as const,
          name: c.name,
          description: `内在渴望: ${c.internalDesire}\n外在目标: ${c.externalGoal}\n致命弱点: ${c.flaw}`,
          prompt: existingAsset?.prompt || `A cinematic portrait of ${c.name}, movie character concept art`,
          imageUrl: existingAsset?.imageUrl || c.referenceImageUrl,
        };
      });
      
      newAssets = [...retainedAssets, ...charAssets];
      updates.assets = newAssets;
    }

    if (updates.assets) {
      newCharacters = newCharacters.map(c => {
        const correspondingAsset = updates.assets!.find(a => a.id === `char-${c.id}`);
        if (correspondingAsset && correspondingAsset.imageUrl !== c.referenceImageUrl) {
          return { ...c, referenceImageUrl: correspondingAsset.imageUrl };
        }
        return c;
      });
      updates.characters = newCharacters;
    }

    const updatedProject = { ...currentProject, ...updates };
    set({ currentProject: updatedProject });

    try {
      const { assets, characters, ...meta } = updatedProject;
      debouncedSetItem(`project_meta_${updatedProject.id}`, meta);
      debouncedSetItem(`project_${updatedProject.id}_assets`, assets);
      debouncedSetItem(`project_${updatedProject.id}_characters`, characters);
      
      set(state => ({
        projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
      }));
    } catch (e) {
      console.error(e);
    }
  },

  deleteProject: async (id) => {
    try {
      const project = await getItemRestored<Project>(`project_meta_${id}`);
      if (project) {
        await localforage.removeItem(`project_meta_${id}`);
        await localforage.removeItem(`project_${id}_assets`);
        await localforage.removeItem(`project_${id}_characters`);
        for (const ep of project.episodes || []) {
          await localforage.removeItem(`project_${id}_episode_${ep.id}`);
        }
      }
      
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        activeEpisodeId: state.currentProject?.id === id ? null : state.activeEpisodeId,
        activeEpisode: state.currentProject?.id === id ? null : state.activeEpisode,
      }));
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  },
});
