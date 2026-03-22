import React from 'react';
import { 
  FileText, 
  Edit3, 
  Sparkles, 
  Wand2, 
  Loader2, 
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScriptBlockItem } from "./ScriptBlockItem";
import { Episode, Scene, ScriptBlock } from "../../types/project";
import { useProjectStore } from "../../store/useProjectStore";
import toast from "react-hot-toast";

interface ScriptEditorProps {
  activeScene: Scene;
  activeEpisode: Episode;
  isRewriting: boolean;
  isPolishing: boolean;
  rewritingBlockId: string | null;
  draggedBlockId: string | null;
  editingBlockId: string | null;
  editingBlockContent: string;
  playingBlockId: string | null;
  isGeneratingTTS: string | null;
  selectionRange: { start: number; end: number } | null;
  menuPosition: { top: number; left: number } | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onRewrite: () => void;
  onParsePlainText: () => void;
  onExportFountain: () => void;
  onExportPDF: () => void;
  onBlockEditStart: (id: string, content: string) => void;
  onBlockEditSave: (id: string) => void;
  onBlockEditCancel: () => void;
  onBlockEditChange: (content: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onPlayTTS: (id: string, content: string, audioUrl?: string) => void;
  onRewriteBlock: (id: string) => void;
  onLinkAsset: (id: string, type: string, content: string) => void;
  onSelect: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPolishText: () => void;
  onShowDontTell: () => void;
  onSubtextAnalysis: () => void;
  onSaveAsAsset: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  activeScene,
  activeEpisode,
  isRewriting,
  isPolishing,
  rewritingBlockId,
  draggedBlockId,
  editingBlockId,
  editingBlockContent,
  playingBlockId,
  isGeneratingTTS,
  selectionRange,
  menuPosition,
  textareaRef,
  onRewrite,
  onParsePlainText,
  onExportFountain,
  onExportPDF,
  onBlockEditStart,
  onBlockEditSave,
  onBlockEditCancel,
  onBlockEditChange,
  onDragStart,
  onDragOver,
  onDrop,
  onPlayTTS,
  onRewriteBlock,
  onLinkAsset,
  onSelect,
  onKeyDown,
  onPolishText,
  onShowDontTell,
  onSubtextAnalysis,
  onSaveAsAsset
}) => {
  const { updateScene, currentProject } = useProjectStore();

  return (
    <div className="flex-1 flex flex-col p-6 md:p-12 max-w-4xl mx-auto w-full overflow-hidden">
      <div className="mb-6 md:mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <input
              type="text"
              value={activeScene.sceneNumber || ''}
              onChange={(e) => updateScene(activeScene.id, { sceneNumber: e.target.value }, activeEpisode.id)}
              placeholder="场号(如:1A)"
              className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 shrink-0"
            />
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white truncate">
              {activeScene.title}
            </h1>
            <select
              value={activeScene.revision || 'white'}
              onChange={(e) => updateScene(activeScene.id, { revision: e.target.value }, activeEpisode.id)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-400 focus:outline-none focus:border-emerald-500 shrink-0"
            >
              <option value="white">白稿 (White)</option>
              <option value="blue">蓝稿 (Blue)</option>
              <option value="pink">粉稿 (Pink)</option>
              <option value="yellow">黄稿 (Yellow)</option>
              <option value="green">绿稿 (Green)</option>
            </select>
          </div>
          <p className="text-neutral-400 text-xs md:text-sm truncate">
            潜台词优先 (Subtext) | Show, Don't Tell
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportFountain}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              .fountain
            </button>
            <button
              onClick={onExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
          {activeScene.scriptBlocks && activeScene.scriptBlocks.length > 0 ? (
            <button
              onClick={() => updateScene(activeScene.id, { scriptBlocks: undefined }, activeEpisode.id)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
              title="返回纯文本编辑模式"
            >
              <Edit3 className="w-4 h-4" />
              编辑文本
            </button>
          ) : (
            <button
              onClick={onParsePlainText}
              disabled={isRewriting || !activeScene.script}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-colors w-full sm:w-auto disabled:opacity-50"
              title="将纯文本智能解析为剧本块"
            >
              {isRewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              智能解析
            </button>
          )}
          <button
            onClick={onRewrite}
            disabled={isRewriting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {isRewriting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            AI 生成剧本
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden relative">
        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col">
          {activeScene.scriptBlocks ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {activeScene.scriptBlocks.map((block, index) => (
                <ScriptBlockItem
                  key={block.id}
                  block={block}
                  index={index}
                  draggedBlockId={draggedBlockId}
                  editingBlockId={editingBlockId}
                  editingBlockContent={editingBlockContent}
                  playingBlockId={playingBlockId}
                  isGeneratingTTS={isGeneratingTTS}
                  rewritingBlockId={rewritingBlockId}
                  characters={currentProject?.characters || []}
                  assets={currentProject?.assets || []}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onEditStart={onBlockEditStart}
                  onEditSave={onBlockEditSave}
                  onEditCancel={onBlockEditCancel}
                  onEditChange={onBlockEditChange}
                  onPlayTTS={onPlayTTS}
                  onRewrite={onRewriteBlock}
                  onLinkAsset={onLinkAsset}
                />
              ))}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={activeScene.script || ""}
              onChange={(e) =>
                updateScene(activeScene.id, { script: e.target.value }, activeEpisode.id)
              }
              onSelect={onSelect}
              onMouseUp={onSelect}
              onKeyUp={onSelect}
              onKeyDown={onKeyDown}
              placeholder="[EXT. LOCATION - DAY]\n\nACTION DESCRIPTION...\n\nCHARACTER NAME\nDialogue..."
              className="w-full h-full bg-transparent text-neutral-300 font-script text-[12pt] leading-relaxed resize-none focus:outline-none placeholder-neutral-700 custom-scrollbar"
            />
          )}
          
          <AnimatePresence>
            {selectionRange && menuPosition && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl flex items-center p-1 gap-1"
                style={{
                  top: Math.max(10, menuPosition.top),
                  left: Math.max(10, menuPosition.left),
                }}
              >
                <button
                  onClick={onPolishText}
                  disabled={isPolishing}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPolishing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI 润色
                </button>
                <div className="w-px h-4 bg-neutral-700" />
                <button
                  onClick={onShowDontTell}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-purple-400 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <Wand2 className="w-3 h-3" />
                  Show, Don't Tell
                </button>
                <div className="w-px h-4 bg-neutral-700" />
                <button
                  onClick={onSubtextAnalysis}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  潜台词分析
                </button>
                <div className="w-px h-4 bg-neutral-700" />
                <button
                  onClick={onSaveAsAsset}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  存为资产
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
