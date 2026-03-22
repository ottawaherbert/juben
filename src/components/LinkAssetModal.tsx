import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Image as ImageIcon, Box, Search, Link as LinkIcon } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { Asset } from '../types/project';
import toast from 'react-hot-toast';

interface LinkAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (assetId: string) => void;
  initialSearch?: string;
  onCreateNew?: (name: string) => void;
}

export default function LinkAssetModal({ isOpen, onClose, onLink, initialSearch = '', onCreateNew }: LinkAssetModalProps) {
  const { currentProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialSearch);
    }
  }, [isOpen, initialSearch]);

  if (!isOpen || !currentProject) return null;

  const allAssets = [
    ...(currentProject.characters || []).map(c => ({
      id: c.id,
      type: 'character' as const,
      name: c.name,
      description: c.externalGoal || c.internalDesire || '',
      imageUrl: c.referenceImageUrl,
      tags: []
    })),
    ...(currentProject.assets || [])
  ];

  const filteredAssets = allAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-500" />
              关联资产库
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 border-b border-neutral-800 shrink-0 bg-neutral-950/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="搜索资产名称或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 flex flex-col items-center gap-4">
                <p>没有找到匹配的资产</p>
                {onCreateNew && searchQuery && (
                  <button
                    onClick={() => {
                      onCreateNew(searchQuery);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    创建新资产 "{searchQuery}"
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onLink(asset.id);
                      onClose();
                    }}
                    className="flex items-center gap-4 p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden">
                      {asset.imageUrl ? (
                        <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        asset.type === 'character' ? <User className="w-5 h-5 text-neutral-500" /> :
                        asset.type === 'location' ? <ImageIcon className="w-5 h-5 text-neutral-500" /> :
                        <Box className="w-5 h-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate">{asset.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-400 shrink-0">
                          {asset.type === 'character' ? '角色' : asset.type === 'location' ? '场地' : '道具'}
                        </span>
                      </div>
                      {asset.description && (
                        <p className="text-xs text-neutral-500 truncate">{asset.description}</p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg">
                        关联
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
