export interface Character {
  id: string;
  name: string;
  psychologicalProfile?: string;
  internalDesire: string;
  externalGoal: string;
  flaw: string;
  voiceName?: string;
  referenceImageUrl?: string;
}

export interface AudioTrack {
  id: string;
  type: 'dialogue' | 'bgm' | 'sfx';
  url: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  characterId?: string; // For dialogue
  text?: string; // For dialogue
  shotId?: string; // Link to the shot that generated this audio
}

export interface Shot {
  id: string;
  // Director's Brain (Storyboard)
  shotSize?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  visualAction?: string;
  lightingAtmo?: string;
  duration?: number;
  motivation?: string;
  
  // Cinematographer's Brain (Prompts)
  imagePrompt?: string;
  videoPrompt?: string;
  visualSummary?: string;
  
  // Generated Assets & Metadata
  imageUrl?: string;
  videoUrl?: string;
  transition?: 'none' | 'fade' | 'black';
  characterIdsInShot?: string[];
  locationId?: string;
  propIds?: string[];
  takes?: {
    id: string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: number;
  }[];
  activeTakeId?: string;
}

export interface ScriptBlock {
  id: string;
  type: "scene_heading" | "action" | "character" | "dialogue" | "parenthetical" | "transition";
  content: string;
  emotion?: string; // For dialogue
  camera?: string; // For action/scene_heading
  linkedAssetId?: string; // ID of the linked asset from the library
  locationId?: string; // ID of the linked location asset
  propIds?: string[]; // IDs of the linked prop assets
  audioUrl?: string; // For TTS preview
}

export interface ScriptBreakdown {
  setting: "INT." | "EXT." | "INT./EXT.";
  location: string;
  time: "DAY" | "NIGHT" | "DAWN" | "DUSK" | "CONTINUOUS";
  characters: string[]; // Keep for backward compatibility or raw names
  props: string[]; // Keep for backward compatibility or raw names
  characterIds?: string[];
  propIds?: string[];
  locationId?: string;
  vfx?: string[];
  sfx?: string[];
}

export interface Scene {
  id: string;
  sceneNumber?: string; // Formal scene numbering (e.g., "1", "1A", "2")
  revision?: string; // Revision tracking (e.g., "White Draft", "Blue Draft")
  title: string;
  description: string;
  valueCharge: "positive" | "negative" | "neutral";
  hook?: string;
  cliffhanger?: string; // For Short Drama paywall/cliffhanger
  targetDuration?: number; // Target duration in minutes
  storyLine?: 'A-Story' | 'B-Story' | 'C-Story'; // For TV Series multi-thread narrative
  script?: string;
  scriptBlocks?: ScriptBlock[];
  shots?: Shot[];
  audioTracks?: AudioTrack[];
  breakdown?: ScriptBreakdown;
  sceneGoal?: string;
  sceneAssets?: string;
  multiGrid?: {
    prompt?: string;
    imageUrl?: string;
    videoUrl?: string;
    videoPrompt?: string;
    shotIds?: string[];
  };
}

export interface Arc {
  id: string;
  name: string;
  description: string;
}

export interface EpisodeMeta {
  id: string;
  title: string;
  inspiration: string;
  arcId?: string;
  targetDuration?: number;
  sceneCount?: number;
}

export interface Episode extends EpisodeMeta {
  scenes: Scene[];
}

export interface Asset {
  id: string;
  type: "character" | "location" | "prop";
  name: string;
  description: string;
  prompt?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface CreativeVision {
  genre: string[];
  visualStyle: string;
  narrativeStyle: string;
  referenceWorks: string;
  globalLookTags?: string;
}

export interface BeatTemplate {
  id: string;
  name: string;
  description: string;
  instruction: string;
  fixedCount?: number;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  description: string;
}

export interface WorldBuildingRule {
  id: string;
  category: string;
  content: string;
}

export interface Project {
  id: string;
  title: string;
  type: "movie" | "tv-series" | "short-drama";
  aspectRatio: string;
  globalGenerationParams?: {
    qualityPrompt?: string;
    negativePrompt?: string;
    globalAppendedPrompt?: string;
  };
  logline: string;
  coreConflict: string;
  seasonArc?: string; // For TV Series: The overarching goal/arc for the season
  arcs?: Arc[]; // For Short Dramas: Macro-structure arcs
  creativeVision?: CreativeVision;
  worldBuildingRules?: WorldBuildingRule[];
  characters: Character[];
  relationships?: Relationship[];
  scenes?: Scene[]; // Keep for backward compatibility
  episodes: EpisodeMeta[];
  assets: Asset[];
  customTemplates?: BeatTemplate[];
}
