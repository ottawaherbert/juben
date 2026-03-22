import React from "react";
import { Trash2, User, Camera, Loader2, Wand2 } from "lucide-react";
import { Character } from "../../types/project";

interface CharacterCardProps {
  character: Character;
  index: number;
  onUpdate: (index: number, updates: Partial<Character>) => void;
  onDelete: (id: string) => void;
  onGenerateImage: (id: string) => void;
  onRegenerate: (id: string, name: string) => void;
  isGeneratingImage: boolean;
  isRegenerating: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  index,
  onUpdate,
  onDelete,
  onGenerateImage,
  onRegenerate,
  isGeneratingImage,
  isRegenerating,
}) => {
  return (
    <div className="bg-neutral-950 border border-neutral-800/50 rounded-2xl p-6 relative group transition-all hover:border-neutral-700">
      <button
        onClick={() => onDelete(character.id)}
        className="absolute top-6 right-6 p-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-900 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group/img shrink-0">
            <div className="w-16 h-20 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex items-center justify-center">
              {character.referenceImageUrl ? (
                <img src={character.referenceImageUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-neutral-700" />
              )}
              <button
                onClick={() => onGenerateImage(character.id)}
                disabled={isGeneratingImage}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity disabled:opacity-100"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
          <input
            type="text"
            value={character.name || ""}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
            placeholder="角色姓名"
            className="flex-1 bg-transparent text-2xl font-black text-white focus:outline-none focus:text-purple-400 transition-colors uppercase tracking-tight"
          />
        </div>
        <button
          onClick={() => onRegenerate(character.id, character.name)}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 mr-8"
        >
          {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          AI 丰满设定
        </button>
      </div>

      <div className="mb-4 bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
        <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
          心理画像 / Psychological Profile
        </label>
        <textarea
          value={character.psychologicalProfile || ""}
          onChange={(e) => onUpdate(index, { psychologicalProfile: e.target.value })}
          placeholder="角色的核心性格、心理动机、行为逻辑..."
          className="w-full h-16 bg-transparent text-sm text-neutral-300 focus:outline-none resize-none custom-scrollbar"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
          <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
            外在目标 / Goal
          </label>
          <textarea
            value={character.externalGoal || ""}
            onChange={(e) => onUpdate(index, { externalGoal: e.target.value })}
            placeholder="TA想得到什么？"
            className="w-full h-20 bg-transparent text-sm text-neutral-300 focus:outline-none resize-none custom-scrollbar"
          />
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
          <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
            内在渴望 / Need
          </label>
          <textarea
            value={character.internalDesire || ""}
            onChange={(e) => onUpdate(index, { internalDesire: e.target.value })}
            placeholder="TA真正需要什么？"
            className="w-full h-20 bg-transparent text-sm text-neutral-300 focus:outline-none resize-none custom-scrollbar"
          />
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
          <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
            致命弱点 / Flaw
          </label>
          <textarea
            value={character.flaw || ""}
            onChange={(e) => onUpdate(index, { flaw: e.target.value })}
            placeholder="TA的性格缺陷？"
            className="w-full h-20 bg-transparent text-sm text-neutral-300 focus:outline-none resize-none custom-scrollbar"
          />
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50 flex flex-col">
          <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-widest">
            默认音色 / Voice
          </label>
          <div className="flex-1 flex flex-col justify-center">
            <select
              value={character.voiceName || ""}
              onChange={(e) => onUpdate(index, { voiceName: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">未绑定音色</option>
              <option value="Puck">Puck (活泼/年轻)</option>
              <option value="Charon">Charon (深沉/成熟)</option>
              <option value="Kore">Kore (温柔/平静)</option>
              <option value="Fenrir">Fenrir (粗犷/力量)</option>
              <option value="Zephyr">Zephyr (轻快/自然)</option>
            </select>
            <p className="text-[10px] text-neutral-600 mt-2 leading-tight">
              绑定后，摄影棚将自动使用该音色生成配音。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
