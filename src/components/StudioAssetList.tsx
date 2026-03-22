import React from "react";
import { Video, Camera, Mic, Music, Volume2, LayoutGrid } from "lucide-react";
import { Shot, AudioTrack } from "../types/project";

interface StudioAssetListProps {
  shotPositions: (Shot & { start: number; duration: number })[];
  audioTracks?: AudioTrack[];
  selectedShotId: string | null;
  selectedAudioTrackId: string | null;
  onSelectShot: (id: string, start: number) => void;
  onSelectAudioTrack: (id: string, start: number) => void;
  isMultiGridMode: boolean;
  onToggleMultiGridMode: () => void;
  selectedMultiShotIds: string[];
  onToggleMultiShot: (id: string) => void;
  onSelectAllShots: () => void;
  onClearAllShots: () => void;
}

export const StudioAssetList: React.FC<StudioAssetListProps> = ({
  shotPositions,
  audioTracks,
  selectedShotId,
  selectedAudioTrackId,
  onSelectShot,
  onSelectAudioTrack,
  isMultiGridMode,
  onToggleMultiGridMode,
  selectedMultiShotIds,
  onToggleMultiShot,
  onSelectAllShots,
  onClearAllShots,
}) => {
  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 flex flex-col shrink-0">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-bold text-emerald-500 flex items-center gap-2">
          <Video className="w-4 h-4" />
          媒体池 (Media Pool)
        </h2>
        <div className="flex items-center gap-2">
          {isMultiGridMode && (
            <button
              onClick={() => {
                if (selectedMultiShotIds.length === shotPositions.length) {
                  onClearAllShots();
                } else {
                  onSelectAllShots();
                }
              }}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-medium transition-colors"
            >
              {selectedMultiShotIds.length === shotPositions.length ? "取消全选" : "全选"}
            </button>
          )}
          <button
            onClick={onToggleMultiGridMode}
            className={`p-1.5 rounded-lg transition-colors ${isMultiGridMode ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-neutral-800 text-neutral-400'}`}
            title="多宫格模式"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        {shotPositions.map((shot, index) => {
          const isSelected = isMultiGridMode 
            ? selectedMultiShotIds.includes(shot.id)
            : selectedShotId === shot.id;

          return (
            <button
              key={shot.id}
              onClick={() => {
                if (isMultiGridMode) {
                  onToggleMultiShot(shot.id);
                } else {
                  onSelectShot(shot.id, shot.start);
                }
              }}
              className={`text-left p-2 rounded-xl border transition-colors flex gap-3 ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="w-16 h-12 bg-neutral-900 rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                {shot.imageUrl ? (
                  <img src={shot.imageUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Camera className="w-4 h-4 text-neutral-700" />
                )}
                {shot.videoUrl && (
                  <div className="absolute bottom-0.5 right-0.5 bg-emerald-500 rounded p-0.5">
                    <Video className="w-2 h-2 text-white" />
                  </div>
                )}
                {isMultiGridMode && (
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-black/50 border-white/50'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center overflow-hidden">
                <span className={`text-xs font-bold ${isSelected ? "text-emerald-400" : "text-white"}`}>
                  SHOT {index + 1}
                </span>
                <span className="text-[10px] text-neutral-500 truncate">
                  {shot.duration}s | {shot.cameraAngle}
                </span>
              </div>
            </button>
          );
        })}
        
        {!isMultiGridMode && (
          <>
            <div className="mt-4 mb-2">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">音频轨道</h3>
            </div>
            {audioTracks?.map((track, index) => (
          <button
            key={track.id}
            onClick={() => onSelectAudioTrack(track.id, track.startTime)}
            className={`text-left p-2 rounded-xl border transition-colors flex items-center gap-3 ${
              selectedAudioTrackId === track.id
                ? "bg-purple-500/10 border-purple-500/50"
                : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              track.type === 'dialogue' ? 'bg-emerald-500/20 text-emerald-500' :
              track.type === 'bgm' ? 'bg-purple-500/20 text-purple-500' :
              'bg-amber-500/20 text-amber-500'
            }`}>
              {track.type === 'dialogue' ? <Mic className="w-4 h-4" /> :
               track.type === 'bgm' ? <Music className="w-4 h-4" /> :
               <Volume2 className="w-4 h-4" />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className={`text-xs font-bold ${selectedAudioTrackId === track.id ? "text-purple-400" : "text-white"}`}>
                {track.type === 'dialogue' ? '配音' : track.type === 'bgm' ? '背景音乐' : '音效'} {index + 1}
              </span>
              <span className="text-[10px] text-neutral-500 truncate">
                {track.text || '无台词'}
              </span>
            </div>
          </button>
        ))}
          </>
        )}
      </div>
    </div>
  );
};
