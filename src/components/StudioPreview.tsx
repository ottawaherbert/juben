import React from "react";
import { Video, Play, Image as ImageIcon } from "lucide-react";
import { Shot, AudioTrack } from "../types/project";

interface StudioPreviewProps {
  previewMode: "video" | "image";
  setPreviewMode: (mode: "video" | "image") => void;
  isPlaying: boolean;
  togglePlay: () => void;
  isMuted: boolean;
  playingShot?: Shot;
  audioTracks?: AudioTrack[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement }>;
  onSynthesize: () => void;
  isSynthesizing: boolean;
}

export const StudioPreview: React.FC<StudioPreviewProps> = ({
  previewMode,
  setPreviewMode,
  isPlaying,
  togglePlay,
  isMuted,
  playingShot,
  audioTracks,
  videoRef,
  audioRefs,
  onSynthesize,
  isSynthesizing,
}) => {
  return (
    <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden border-r border-neutral-800">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          <button
            onClick={() => setPreviewMode("video")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
              previewMode === "video"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Video className="w-4 h-4" />
            视频预览
          </button>
          <button
            onClick={() => setPreviewMode("image")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
              previewMode === "image"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            图片预览
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSynthesize}
            disabled={isSynthesizing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isSynthesizing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                合成中...
              </span>
            ) : (
              <>
                <Video className="w-4 h-4" />
                导出成片
              </>
            )}
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 bg-black relative flex items-center justify-center group overflow-hidden">
        {/* Hidden audio elements for all tracks */}
        {audioTracks?.map(track => (
          <audio 
            key={track.id} 
            ref={el => { if (el) audioRefs.current[track.id] = el; }} 
            src={track.url || ""} 
            muted={isMuted} 
          />
        ))}

        {previewMode === "video" ? (
          playingShot?.videoUrl ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                muted={isMuted}
                playsInline
              />
              {/* Play/Pause Overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm">
                  {isPlaying ? (
                    <div className="w-6 h-6 flex gap-1">
                      <div className="w-2 h-full bg-white rounded-sm"></div>
                      <div className="w-2 h-full bg-white rounded-sm"></div>
                    </div>
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-neutral-600 flex flex-col items-center">
              <Video className="w-12 h-12 mb-2 opacity-50" />
              <p>当前时间点无视频片段</p>
            </div>
          )
        ) : playingShot?.imageUrl ? (
          <img
            src={playingShot.imageUrl}
            alt="preview"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-neutral-600 flex flex-col items-center">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <p>当前时间点无图片片段</p>
          </div>
        )}
      </div>
    </div>
  );
};
