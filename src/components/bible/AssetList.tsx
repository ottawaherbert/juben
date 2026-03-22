import React from "react";
import { MapPin, Box } from "lucide-react";
import { Asset } from "../../types/project";
import { AssetCard } from "./AssetCard";

interface AssetListProps {
  assets: Asset[];
  activeTab: "locations" | "props";
  onUpdate: (id: string, updates: Partial<Asset>) => void;
  onDelete: (id: string) => void;
  onGenerateImage: (id: string) => void;
  onRegenerate: (id: string, name: string, type: "location" | "prop") => void;
  generatingImageId: string | null;
  regeneratingId: string | null;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  activeTab,
  onUpdate,
  onDelete,
  onGenerateImage,
  onRegenerate,
  generatingImageId,
  regeneratingId,
}) => {
  const filteredAssets = assets.filter(a => a.type === (activeTab === "locations" ? "location" : "prop"));

  if (filteredAssets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-2xl p-12">
        {activeTab === "locations" ? <MapPin className="w-12 h-12 mb-4 opacity-20" /> : <Box className="w-12 h-12 mb-4 opacity-20" />}
        <p>暂无{activeTab === "locations" ? "场景" : "道具"}设定</p>
        <p className="text-sm opacity-60 mt-2">
          点击右上角添加，或在资产库中扫描剧本提取
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredAssets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          activeTab={activeTab}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onGenerateImage={onGenerateImage}
          onRegenerate={onRegenerate}
          isGeneratingImage={generatingImageId === asset.id}
          isRegenerating={regeneratingId === asset.id}
        />
      ))}
    </div>
  );
};
