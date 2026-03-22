import React from "react";
import { Users } from "lucide-react";
import { Character } from "../../types/project";
import { CharacterCard } from "./CharacterCard";

interface CharacterListProps {
  characters: Character[];
  onUpdate: (index: number, updates: Partial<Character>) => void;
  onDelete: (id: string) => void;
  onGenerateImage: (id: string) => void;
  onRegenerate: (id: string, name: string) => void;
  generatingImageId: string | null;
  regeneratingId: string | null;
}

export const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  onUpdate,
  onDelete,
  onGenerateImage,
  onRegenerate,
  generatingImageId,
  regeneratingId,
}) => {
  if (characters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-2xl p-12">
        <Users className="w-12 h-12 mb-4 opacity-20" />
        <p>暂无角色设定</p>
        <p className="text-sm opacity-60 mt-2">
          点击右上角添加，或通过主脑自动生成
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {characters.map((char, index) => (
        <CharacterCard
          key={char.id}
          character={char}
          index={index}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onGenerateImage={onGenerateImage}
          onRegenerate={onRegenerate}
          isGeneratingImage={generatingImageId === char.id}
          isRegenerating={regeneratingId === char.id}
        />
      ))}
    </div>
  );
};
