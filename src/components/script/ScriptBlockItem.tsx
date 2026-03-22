import React, { useMemo } from 'react';
import { Edit3, Volume2, Pause, Loader2, Wand2, Link as LinkIcon } from 'lucide-react';
import { ScriptBlock, Character, Asset } from '../../types/project';

interface ScriptBlockItemProps {
  block: ScriptBlock;
  index: number;
  draggedBlockId: string | null;
  editingBlockId: string | null;
  editingBlockContent: string;
  playingBlockId: string | null;
  isGeneratingTTS: string | null;
  rewritingBlockId: string | null;
  characters: Character[];
  assets: Asset[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onEditStart: (id: string, content: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onEditChange: (content: string) => void;
  onPlayTTS: (id: string, text: string, url?: string) => void;
  onRewrite: (id: string) => void;
  onLinkAsset: (id: string, type: string, content: string) => void;
}

export const ScriptBlockItem: React.FC<ScriptBlockItemProps> = ({
  block,
  draggedBlockId,
  editingBlockId,
  editingBlockContent,
  playingBlockId,
  isGeneratingTTS,
  rewritingBlockId,
  characters,
  assets,
  onDragStart,
  onDragOver,
  onDrop,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onPlayTTS,
  onRewrite,
  onLinkAsset,
}) => {
  const isEditing = editingBlockId === block.id;

  const displayContent = useMemo(() => {
    if (block.type === 'character' && block.linkedAssetId) {
      const char = characters.find(c => c.id === block.linkedAssetId);
      if (char) return char.name.toUpperCase();
    }
    
    let content = block.content;
    
    // For scene headings, if we have a linked location, we could try to ensure its name is updated,
    // but scene headings are complex (e.g. INT. COFFEE SHOP - DAY). 
    // We'll just return the content for now, or we could highlight known entities in action/dialogue.
    
    return content;
  }, [block, characters, assets]);

  const renderContentWithHighlights = () => {
    if (block.type === 'character' || block.type === 'scene_heading') {
      return displayContent;
    }

    // For action and dialogue, highlight known characters and assets
    let elements: React.ReactNode[] = [displayContent];
    
    // Highlight characters
    characters.forEach(char => {
      if (!char.name) return;
      const newElements: React.ReactNode[] = [];
      elements.forEach((el, i) => {
        if (typeof el === 'string') {
          const parts = el.split(new RegExp(`(${char.name})`, 'gi'));
          parts.forEach((part, j) => {
            if (part.toLowerCase() === char.name.toLowerCase()) {
              newElements.push(
                <span key={`${char.id}-${i}-${j}`} className="text-purple-400 font-semibold bg-purple-500/10 px-1 rounded cursor-help" title={`角色: ${char.name}`}>
                  {part}
                </span>
              );
            } else if (part) {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(el);
        }
      });
      elements = newElements;
    });

    // Highlight assets (locations, props)
    assets.forEach(asset => {
      if (!asset.name) return;
      const newElements: React.ReactNode[] = [];
      elements.forEach((el, i) => {
        if (typeof el === 'string') {
          const parts = el.split(new RegExp(`(${asset.name})`, 'gi'));
          parts.forEach((part, j) => {
            if (part.toLowerCase() === asset.name.toLowerCase()) {
              const colorClass = asset.type === 'location' ? 'text-emerald-400 bg-emerald-500/10' : 'text-blue-400 bg-blue-500/10';
              const titlePrefix = asset.type === 'location' ? '场景' : '道具';
              newElements.push(
                <span key={`${asset.id}-${i}-${j}`} className={`${colorClass} font-semibold px-1 rounded cursor-help`} title={`${titlePrefix}: ${asset.name}`}>
                  {part}
                </span>
              );
            } else if (part) {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(el);
        }
      });
      elements = newElements;
    });

    return elements;
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, block.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, block.id)}
      className={`p-3 rounded-xl border border-neutral-800 bg-neutral-950/50 group relative cursor-move transition-all ${
        draggedBlockId === block.id ? 'opacity-50 scale-95' : ''
      } ${
        block.type === 'scene_heading' ? 'bg-emerald-900/20 border-emerald-500/20' :
        block.type === 'character' ? 'text-center font-bold mt-6' :
        block.type === 'dialogue' ? 'ml-12 mr-12' :
        block.type === 'parenthetical' ? 'ml-16 mr-16 text-neutral-400 italic' : ''
      }`}
    >
      {isEditing ? (
        <textarea
          autoFocus
          value={editingBlockContent}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={() => onEditSave(block.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onEditSave(block.id);
            }
            if (e.key === 'Escape') {
              onEditCancel();
            }
          }}
          className={`w-full bg-neutral-900 border border-emerald-500/50 rounded-lg p-2 text-[12pt] font-script text-neutral-300 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
            block.type === 'character' ? 'text-center font-bold' : ''
          }`}
          rows={Math.max(1, editingBlockContent.split('\n').length)}
        />
      ) : (
        <div 
          className={`text-[12pt] font-script text-neutral-300 whitespace-pre-wrap relative ${
            block.type === 'character' ? 'cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 justify-center w-full' : 
            block.type === 'scene_heading' ? 'cursor-pointer hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5' : ''
          }`}
          onClick={() => {
            if (block.type === 'character' || block.type === 'scene_heading') {
              onLinkAsset(block.id, block.type, block.content);
            }
          }}
          onDoubleClick={() => onEditStart(block.id, block.content)}
          title={(block.type === 'character' || block.type === 'scene_heading') ? ((block.type === 'scene_heading' ? block.locationId : block.linkedAssetId) ? '点击修改关联资产，双击编辑文本' : '未关联资产！点击关联资产库，双击编辑文本') : '双击编辑文本'}
        >
          {renderContentWithHighlights()}
          {(block.type === 'character' || block.type === 'scene_heading') && (
            <div className="relative inline-flex items-center justify-center">
              <LinkIcon className={`w-3 h-3 ${(block.type === 'scene_heading' ? block.locationId : block.linkedAssetId) ? 'text-emerald-500' : 'text-red-500'}`} />
              {!(block.type === 'scene_heading' ? block.locationId : block.linkedAssetId) && (
                <span className="absolute -right-1.5 -top-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Annotations */}
      {(block.emotion || block.camera) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {block.emotion && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              🎭 {block.emotion}
            </span>
          )}
          {block.camera && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              🎥 {block.camera}
            </span>
          )}
        </div>
      )}
      
      {/* Block Actions (Hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button 
          className="p-1.5 bg-neutral-800 hover:bg-emerald-600 rounded-md text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          title="编辑此段"
          onClick={() => onEditStart(block.id, block.content)}
        >
          <Edit3 className="w-3 h-3" />
        </button>
        {block.type === 'dialogue' && (
          <button
            className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
              playingBlockId === block.id 
                ? 'bg-emerald-600 text-white' 
                : 'bg-neutral-800 hover:bg-emerald-600 text-neutral-400 hover:text-white'
            }`}
            title={playingBlockId === block.id ? "停止播放" : "TTS 语音预演"}
            disabled={isGeneratingTTS === block.id}
            onClick={() => onPlayTTS(block.id, block.content, block.audioUrl)}
          >
            {isGeneratingTTS === block.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : playingBlockId === block.id ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </button>
        )}
        <button 
          className="p-1.5 bg-neutral-800 hover:bg-emerald-600 rounded-md text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          title="AI 重写此段"
          disabled={rewritingBlockId === block.id}
          onClick={() => onRewrite(block.id)}
        >
          {rewritingBlockId === block.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wand2 className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};
