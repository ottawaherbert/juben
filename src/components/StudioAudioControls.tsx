import React from "react";
import { Loader2, Mic } from "lucide-react";
import { AudioTrack, Project } from "../types/project";

interface StudioAudioControlsProps {
  selectedAudioTrack: AudioTrack;
  localAudioText: string;
  onAudioTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  currentProject: Project;
  isGeneratingVoice: boolean;
  onGenerateVoice: () => void;
  onUpdateCharacter: (characterId: string) => void;
}

export const StudioAudioControls: React.FC<StudioAudioControlsProps> = ({
  selectedAudioTrack,
  localAudioText,
  onAudioTextChange,
  currentProject,
  isGeneratingVoice,
  onGenerateVoice,
  onUpdateCharacter,
}) => {
  return (
    <div className="space-y-6">
      {selectedAudioTrack.type === 'dialogue' && (
        <>
          <div>
            <label className="block text-xs font-bold text-white mb-3">
              配音台词 (Voiceover)
            </label>
            <textarea
              value={localAudioText}
              onChange={onAudioTextChange}
              placeholder="输入该镜头的对白或旁白..."
              className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-300 resize-none focus:outline-none focus:border-purple-500/50 custom-scrollbar"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-3">
              绑定配音角色
            </label>
            <select 
              value={selectedAudioTrack.characterId || ""}
              onChange={(e) => onUpdateCharacter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">选择角色...</option>
              <option value="narrator">旁白 (Narrator)</option>
              {currentProject.characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onGenerateVoice}
            disabled={isGeneratingVoice || !localAudioText}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isGeneratingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            生成 AI 配音
          </button>
        </>
      )}
      
      {selectedAudioTrack.type !== 'dialogue' && (
        <div className="p-8 text-center border border-dashed border-neutral-800 rounded-2xl">
          <p className="text-sm text-neutral-500">背景音乐与音效暂不支持在线编辑，请在时间轴调整位置。</p>
        </div>
      )}
    </div>
  );
};
