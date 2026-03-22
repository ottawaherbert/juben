import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Image as ImageIcon, Box } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { Asset } from '../types/project';
import toast from 'react-hot-toast';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSave?: (assetId: string) => void;
}

export default function AddAssetModal({ isOpen, onClose, initialName = '', onSave }: AddAssetModalProps) {
  const { currentProject, updateProject } = useProjectStore();
  const [type, setType] = useState<"character" | "location" | "prop">("character");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setType("character");
      setDescription('');
      setPrompt('');
      setTags('');
    }
  }, [isOpen, initialName]);

  const handleSave = async () => {
    if (!currentProject) return;
    if (!name.trim()) {
      toast.error('请输入资产名称');
      return;
    }

    const newAsset: Asset = {
      id: type === 'character' ? `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: name.trim(),
      description: description.trim(),
      prompt: prompt.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    let updatedAssets = currentProject.assets || [];
    let updatedCharacters = currentProject.characters || [];

    if (type === 'character') {
      updatedCharacters = [
        ...updatedCharacters,
        {
          id: newAsset.id.replace('char-', ''),
          name: newAsset.name,
          internalDesire: '待补充',
          externalGoal: '待补充',
          flaw: '待补充',
        }
      ];
      // Do not add to updatedAssets here, updateProject will generate it from characters
    } else {
      updatedAssets = [...updatedAssets, newAsset];
    }

    try {
      await updateProject({
        assets: updatedAssets,
        characters: updatedCharacters
      });
      toast.success('资产添加成功');
      if (onSave) {
        onSave(newAsset.id);
      }
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('添加失败');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-800">
            <h2 className="text-xl font-bold text-white">新增资产</h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">资产类型</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setType('character')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    type === 'character' 
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">角色</span>
                </button>
                <button
                  onClick={() => setType('location')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    type === 'location' 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">场地</span>
                </button>
                <button
                  onClick={() => setType('prop')}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                    type === 'prop' 
                      ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  <Box className="w-5 h-5" />
                  <span className="text-sm font-medium">道具</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">资产名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：张三、废弃工厂、神秘怀表"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细描述该资产的外观、特征或氛围..."
                className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none custom-scrollbar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">AI 绘图提示词 (可选)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="用于生成概念图的英文 Prompt..."
                className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none custom-scrollbar font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">标签 (可选)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗号分隔，如：赛博朋克, 反派, 室内"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-6 border-t border-neutral-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
            >
              保存资产
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
