import localforage from 'localforage';

export const assetStore = localforage.createInstance({
  name: 'OMNI_Studio',
  storeName: 'assets'
});

const isBase64Image = (str: string) => 
  typeof str === 'string' && (str.startsWith('data:image/') || str.startsWith('data:video/') || str.startsWith('data:audio/'));

// Fast hash function for strings
const fastHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return `asset_${Math.abs(hash)}_${str.length}`;
};

export const extractAndSaveAssets = async (obj: any): Promise<any> => {
  if (!obj) return obj;
  
  if (isBase64Image(obj)) {
    const id = fastHash(obj);
    const existing = await assetStore.getItem(id);
    if (!existing) {
      await assetStore.setItem(id, obj);
    }
    return `local://${id}`;
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => extractAndSaveAssets(item)));
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = await extractAndSaveAssets(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
};

export const restoreAssets = async (obj: any): Promise<any> => {
  if (!obj) return obj;

  if (typeof obj === 'string' && obj.startsWith('local://')) {
    const id = obj.replace('local://', '');
    const data = await assetStore.getItem<string>(id);
    return data || obj; // Fallback to the local:// url if not found
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => restoreAssets(item)));
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = await restoreAssets(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
};

export const setItemNow = async (key: string, value: any) => {
  const optimizedValue = await extractAndSaveAssets(value);
  await localforage.setItem(key, optimizedValue);
};

export const getItemRestored = async <T>(key: string): Promise<T | null> => {
  const data = await localforage.getItem<T>(key);
  if (!data) return null;
  return await restoreAssets(data) as T;
};

export const cleanupExpiredTakes = async (episodes: any[], assets: any[], characters: any[], projectId?: string) => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let episodesModified = false;

  // 1. Remove expired takes from episodes
  episodes.forEach(ep => {
    let epModified = false;
    if (ep.scenes) {
      ep.scenes.forEach((scene: any) => {
        if (scene.shots) {
          scene.shots.forEach((shot: any) => {
            if (shot.takes && shot.takes.length > 1) {
              const originalLength = shot.takes.length;
              shot.takes = shot.takes.filter((take: any) => {
                // Keep if it's the active take
                if (shot.activeTakeId === take.id) return true;
                // Keep if it's newer than 7 days
                if (take.createdAt && (now - take.createdAt) < SEVEN_DAYS_MS) return true;
                return false;
              });
              if (shot.takes.length < originalLength) {
                epModified = true;
                episodesModified = true;
              }
            }
          });
        }
      });
    }
    
    // If we modified the episode, we should save it back
    if (epModified && projectId) {
      setItemNow(`project_${projectId}_episode_${ep.id}`, ep);
    }
  });

  // 2. Find all active asset IDs
  const activeAssetIds = new Set<string>();
  
  const collectAssetIds = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string' && obj.startsWith('local://')) {
      activeAssetIds.add(obj.replace('local://', ''));
    } else if (Array.isArray(obj)) {
      obj.forEach(collectAssetIds);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(collectAssetIds);
    }
  };

  episodes.forEach(collectAssetIds);
  assets.forEach(collectAssetIds);
  characters.forEach(collectAssetIds);

  // 3. Iterate over all keys in assetStore and delete unreferenced ones
  const keys = await assetStore.keys();
  let deletedCount = 0;
  for (const key of keys) {
    if (!activeAssetIds.has(key)) {
      // It's not referenced in any episode, asset, or character. We can delete it.
      await assetStore.removeItem(key);
      deletedCount++;
    }
  }
  if (deletedCount > 0 || episodesModified) {
    console.log(`[Storage] Cleaned up ${deletedCount} expired assets and removed old takes.`);
  }
};
