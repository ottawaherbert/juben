import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { usePromptStore } from "../store/usePromptStore";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

import AddAssetModal from "../components/AddAssetModal";
import LinkAssetModal from "../components/LinkAssetModal";
import PromptEditorModal from "../components/PromptEditorModal";
import { SCRIPT_BLOCK_TYPES } from "../constants";

import { ScriptEditor } from "../components/script/ScriptEditor";
import { AssetExtractionPanel } from "../components/script/AssetExtractionPanel";
import { ScriptOptionsModal } from "../components/script/ScriptOptionsModal";
import { SceneSidebar } from "../components/script/SceneSidebar";
import { useScriptAI } from "../hooks/useScriptAI";

export default function Script() {
  const { currentProject, activeEpisodeId, activeEpisode, updateScene } = useProjectStore();
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    activeEpisode?.scenes[0]?.id || null,
  );

  const {
    isRewriting,
    isPolishing,
    isAnalyzingPacing,
    isGeneratingTTS,
    playingBlockId,
    rewritingBlockId,
    generatedOptions,
    setGeneratedOptions,
    promptModalState,
    setPromptModalState,
    handleAnalyzePacing,
    handleParsePlainText,
    handlePlayTTS,
    handleRewriteBlock,
    handlePolishText,
    handleShowDontTell,
    handleSubtextAnalysis,
    handleSelectOption,
    handlePrepareRewrite
  } = useScriptAI(currentProject, activeEpisode, updateScene, activeSceneId);

  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAssetText, setSelectedAssetText] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingBlockId, setLinkingBlockId] = useState<string | null>(null);
  const [linkingSearch, setLinkingSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState('');

  const activeScene = activeEpisode?.scenes.find((s) => s.id === activeSceneId);

  const handleRewrite = () => {
    handlePrepareRewrite();
  };

  const onPlayTTS = (blockId: string, content: string) => {
    handlePlayTTS(blockId, content);
  };

  const onPolishText = () => {
    handlePolishText(selectionRange, setSelectionRange, setMenuPosition);
  };

  const onShowDontTell = () => {
    handleShowDontTell(selectionRange, setSelectionRange, setMenuPosition);
  };

  const onSubtextAnalysis = () => {
    handleSubtextAnalysis(selectionRange, setSelectionRange, setMenuPosition);
  };

  const handleBlockEditStart = (blockId: string, content: string) => {
    setEditingBlockId(blockId);
    setEditingBlockContent(content);
  };

  const handleBlockEditSave = (blockId: string) => {
    if (!activeScene?.scriptBlocks) return;
    
    const newBlocks = [...activeScene.scriptBlocks];
    const blockIndex = newBlocks.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: editingBlockContent };
      const newScript = blocksToPlainText(newBlocks);
      updateScene(activeScene.id, { scriptBlocks: newBlocks, script: newScript }, activeEpisode.id);
    }
    setEditingBlockId(null);
  };

  const handleBlockEditCancel = () => {
    setEditingBlockId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBlockId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const blocksToPlainText = (blocks: any[]) => {
    return blocks.map((b: any) => {
      if (b.type === 'character') return `\n${b.content}`;
      if (b.type === 'dialogue') return `${b.content}`;
      if (b.type === 'parenthetical') return `(${b.content})`;
      return `\n${b.content}\n`;
    }).join('\n').trim();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetId || !activeScene?.scriptBlocks) return;

    const newBlocks = [...activeScene.scriptBlocks];
    const draggedIndex = newBlocks.findIndex(b => b.id === draggedBlockId);
    const targetIndex = newBlocks.findIndex(b => b.id === targetId);

    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);

    const newScript = blocksToPlainText(newBlocks);
    updateScene(activeScene.id, { scriptBlocks: newBlocks, script: newScript }, activeEpisode.id);
    setDraggedBlockId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeScene) return;
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
      updateScene(activeScene.id, { script: newValue }, activeEpisode.id);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 4;
        }
      }, 0);
    } else if (e.key === 'Enter') {
      const textBeforeCursor = value.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Auto-indent if current line is indented
      const match = currentLine.match(/^(\s+)/);
      if (match) {
        e.preventDefault();
        const indent = match[1];
        const newValue = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
        updateScene(activeScene.id, { script: newValue }, activeEpisode.id);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 1 + indent.length;
          }
        }, 0);
      } else if (currentLine.trim().length > 0 && currentLine === currentLine.toUpperCase() && !currentLine.includes('INT.') && !currentLine.includes('EXT.')) {
        // Auto-indent for dialogue if current line is likely a character name
        e.preventDefault();
        const newValue = value.substring(0, selectionStart) + '\n    ' + value.substring(selectionEnd);
        updateScene(activeScene.id, { script: newValue }, activeEpisode.id);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 5;
          }
        }, 0);
      }
    }
  };

  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      setSelectionRange({ start, end });
      // Calculate position for floating menu (simplified, relative to textarea)
      // In a real app, you might use getBoundingClientRect or a library like floating-ui
      const rect = textarea.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 40, // Position above the textarea
        left: rect.left + rect.width / 2 - 60, // Center horizontally
      });
    } else {
      setSelectionRange(null);
      setMenuPosition(null);
    }
  };

  // Hide menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setSelectionRange(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在起点注入灵感并立项。
      </div>
    );
  }

  if (!activeEpisode) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        请先在“{currentProject.type === "movie" ? "段落" : "分集"}”页面创建并选择一个{currentProject.type === "movie" ? "段落" : "分集"}。
      </div>
    );
  }

  const handleSaveAsAsset = () => {
    if (activeScene?.script && selectionRange) {
      const text = activeScene.script.substring(selectionRange.start, selectionRange.end);
      setSelectedAssetText(text.trim());
      setIsAddModalOpen(true);
      setSelectionRange(null);
      setMenuPosition(null);
    }
  };

  const handleExportFountain = () => {
    exportToFountain();
  };

  const handleExportPDF = () => {
    exportToPDF();
  };

  const handleLinkAsset = (blockId: string, type: string, content: string) => {
    setLinkingBlockId(blockId);
    // For scene heading, try to extract the location part (e.g., "EXT. LOCATION - DAY" -> "LOCATION")
    let searchStr = content;
    if (type === 'scene_heading') {
      const match = content.match(/(?:INT\.|EXT\.|INT\/EXT\.)\s+(.*?)(?:\s+-|$)/i);
      if (match && match[1]) {
        searchStr = match[1].trim();
      }
    }
    setLinkingSearch(searchStr);
    setIsLinkModalOpen(true);
  };

  const exportToFountain = () => {
    if (!activeEpisode || !currentProject) return;
    
    let fountainContent = `Title: ${currentProject.title || 'Untitled'}\n`;
    fountainContent += `Author: O.M.N.I. Studio\n`;
    fountainContent += `Draft date: ${new Date().toLocaleDateString()}\n\n`;

    activeEpisode.scenes.forEach((scene) => {
      // Scene Heading
      const sceneNumStr = scene.sceneNumber ? ` #${scene.sceneNumber}#` : '';
      const isStandardHeading = /^(INT|EXT|EST|I\/E|INT\/EXT)[.\s]/i.test(scene.title);
      const headingPrefix = isStandardHeading ? '' : '.';
      
      fountainContent += `\n${headingPrefix}${scene.title.toUpperCase()}${sceneNumStr}\n\n`;
      
      if (scene.scriptBlocks && scene.scriptBlocks.length > 0) {
        let previousType = '';
        
        scene.scriptBlocks.forEach((block, i) => {
          const content = block.content.trim();
          if (!content) return;

          if (block.type === 'scene_heading') {
            const isStd = /^(INT|EXT|EST|I\/E|INT\/EXT)[.\s]/i.test(content);
            fountainContent += `${isStd ? '' : '.'}${content.toUpperCase()}\n\n`;
          } else if (block.type === 'action') {
            // Force action if it's all caps to prevent it from being parsed as Character
            const forceAction = /^[A-Z0-9\s.,!?]+$/.test(content) && content.length > 0;
            fountainContent += `${forceAction ? '!' : ''}${content}\n\n`;
          } else if (block.type === 'character') {
            // Check for dual dialogue (if previous block was dialogue and we want dual, we'd add ^)
            // For now, just standard character
            // Ensure there's a blank line before character unless it's the first block
            if (i > 0 && previousType !== 'action' && previousType !== 'scene_heading' && previousType !== 'transition' && previousType !== 'dialogue') {
               // Usually character follows a blank line, which is handled by the \n\n of previous blocks
            }
            // Add emotion as parenthetical if exists
            let charLine = content.toUpperCase();
            if (block.emotion) {
              charLine += ` (${block.emotion})`; // Emotion next to character name is not standard, usually it's a separate parenthetical block. But we can keep it simple or add a parenthetical block.
            }
            fountainContent += `${charLine}\n`;
          } else if (block.type === 'parenthetical') {
            const text = content.startsWith('(') && content.endsWith(')') ? content : `(${content})`;
            fountainContent += `${text}\n`;
          } else if (block.type === 'dialogue') {
            fountainContent += `${content}\n\n`;
          } else if (block.type === 'transition') {
            const isStdTrans = content.toUpperCase().endsWith('TO:');
            fountainContent += `${isStdTrans ? '' : '> '}${content.toUpperCase()}\n\n`;
          } else {
            fountainContent += `${content}\n\n`;
          }
          previousType = block.type;
        });
      } else if (scene.script) {
        fountainContent += `${scene.script}\n\n`;
      }
    });

    const blob = new Blob([fountainContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.title || 'script'}_${activeEpisode.title || 'episode'}.fountain`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("剧本已导出为 .fountain 格式");
  };

  const exportToPDF = () => {
    if (!activeEpisode || !currentProject) return;
    
    const doc = new jsPDF();
    
    // Standard Hollywood margins (in mm)
    const topMargin = 25.4;
    const bottomMargin = 25.4;
    const leftMargin = 38.1; // 1.5 inches
    const rightMargin = 25.4; // 1.0 inches
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    let y = topMargin;
    
    // Set font to Courier, size 12
    doc.setFont("courier", "normal");
    doc.setFontSize(12);

    const addText = (text: string, x: number, maxWidth: number, align: "left" | "center" | "right" = "left") => {
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (y > pageHeight - bottomMargin) {
          doc.addPage();
          y = topMargin;
        }
        doc.text(line, x, y, { align });
        y += 4.23; // Standard line height for 12pt Courier is approx 4.23mm (1/6 inch)
      });
    };

    // Title Page
    doc.setFontSize(24);
    doc.setFont("courier", "bold");
    addText(currentProject.title || 'Untitled', pageWidth / 2, pageWidth, "center");
    y += 10;
    doc.setFontSize(12);
    doc.setFont("courier", "normal");
    addText("O.M.N.I. Studio", pageWidth / 2, pageWidth, "center");
    addText(`Draft date: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageWidth, "center");
    
    doc.addPage();
    y = topMargin;

    activeEpisode.scenes.forEach(scene => {
      if (y > pageHeight - bottomMargin * 2) {
        doc.addPage();
        y = topMargin;
      }
      
      const sceneNumStr = scene.sceneNumber ? ` #${scene.sceneNumber}#` : '';
      const heading = `${scene.title.toUpperCase()}${sceneNumStr}`;
      
      doc.setFont("courier", "bold");
      addText(heading, leftMargin, pageWidth - leftMargin - rightMargin);
      doc.setFont("courier", "normal");
      y += 4.23; // Blank line after scene heading

      if (scene.scriptBlocks && scene.scriptBlocks.length > 0) {
        scene.scriptBlocks.forEach(block => {
          const content = block.content.trim();
          if (!content) return;

          if (block.type === 'scene_heading') {
            y += 4.23; // Blank line before scene heading
            doc.setFont("courier", "bold");
            addText(content.toUpperCase(), leftMargin, pageWidth - leftMargin - rightMargin);
            doc.setFont("courier", "normal");
            y += 4.23; // Blank line after scene heading
          } else if (block.type === 'action') {
            addText(content, leftMargin, pageWidth - leftMargin - rightMargin);
            y += 4.23; // Blank line after action
          } else if (block.type === 'character') {
            // Character name: ~3.7 inches from left (94mm)
            let charLine = content.toUpperCase();
            if (block.emotion) charLine += ` (${block.emotion})`;
            addText(charLine, 94, pageWidth - 94 - rightMargin);
          } else if (block.type === 'parenthetical') {
            // Parenthetical: ~3.1 inches from left (79mm), max width ~2.0 inches (50mm)
            const text = content.startsWith('(') && content.endsWith(')') ? content : `(${content})`;
            addText(text, 79, 50);
          } else if (block.type === 'dialogue') {
            // Dialogue: ~2.5 inches from left (64mm), max width ~3.5 inches (89mm)
            addText(content, 64, 89);
            y += 4.23; // Blank line after dialogue
          } else if (block.type === 'transition') {
            // Transition: ~5.5 inches from left (140mm)
            y += 4.23; // Blank line before transition
            addText(content.toUpperCase(), 140, pageWidth - 140 - rightMargin);
            y += 4.23; // Blank line after transition
          } else {
            addText(content, leftMargin, pageWidth - leftMargin - rightMargin);
            y += 4.23;
          }
        });
      } else if (scene.script) {
        addText(scene.script, leftMargin, pageWidth - leftMargin - rightMargin);
        y += 4.23;
      }
    });

    doc.save(`${currentProject.title || 'script'}_${activeEpisode.title || 'episode'}.pdf`);
    toast.success("剧本已导出为 PDF 格式");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row h-full overflow-hidden"
    >
      {/* Scene List Sidebar */}
      <SceneSidebar
        activeEpisode={activeEpisode}
        activeSceneId={activeSceneId}
        currentProject={currentProject}
        isAnalyzingPacing={isAnalyzingPacing}
        onSelectScene={setActiveSceneId}
        onAnalyzePacing={handleAnalyzePacing}
      />

      {/* Script Editor */}
      <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden">
        {activeScene ? (
          <div className="flex-1 flex gap-6 overflow-hidden relative">
            <ScriptEditor
              activeScene={activeScene}
              activeEpisode={activeEpisode}
              isRewriting={isRewriting}
              isPolishing={isPolishing}
              rewritingBlockId={rewritingBlockId}
              draggedBlockId={draggedBlockId}
              editingBlockId={editingBlockId}
              editingBlockContent={editingBlockContent}
              playingBlockId={playingBlockId}
              isGeneratingTTS={isGeneratingTTS}
              selectionRange={selectionRange}
              menuPosition={menuPosition}
              textareaRef={textareaRef}
              onRewrite={handleRewrite}
              onParsePlainText={handleParsePlainText}
              onExportFountain={handleExportFountain}
              onExportPDF={handleExportPDF}
              onBlockEditStart={handleBlockEditStart}
              onBlockEditSave={handleBlockEditSave}
              onBlockEditCancel={handleBlockEditCancel}
              onBlockEditChange={setEditingBlockContent}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onPlayTTS={onPlayTTS}
              onRewriteBlock={handleRewriteBlock}
              onLinkAsset={handleLinkAsset}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              onPolishText={onPolishText}
              onShowDontTell={onShowDontTell}
              onSubtextAnalysis={onSubtextAnalysis}
              onSaveAsAsset={handleSaveAsAsset}
            />

            <AssetExtractionPanel
              activeScene={activeScene}
              currentProject={currentProject}
            />
            </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            选择左侧场景开始编写剧本
          </div>
        )}
      </div>

      <AddAssetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        initialName={selectedAssetText}
        onSave={(assetId) => {
          if (activeScene && linkingBlockId) {
            const updatedBlocks = activeScene.scriptBlocks?.map(b => {
              if (b.id === linkingBlockId) {
                if (b.type === 'scene_heading') {
                  return { ...b, locationId: assetId };
                }
                return { ...b, linkedAssetId: assetId };
              }
              return b;
            });
            updateScene(activeScene.id, { scriptBlocks: updatedBlocks }, activeEpisode.id);
            toast.success('新资产已自动关联');
            setLinkingBlockId(null);
          }
        }}
      />

      <LinkAssetModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        initialSearch={linkingSearch}
        onCreateNew={(name) => {
          setSelectedAssetText(name);
          setIsAddModalOpen(true);
        }}
        onLink={(assetId) => {
          if (activeScene && linkingBlockId) {
            const updatedBlocks = activeScene.scriptBlocks?.map(b => {
              if (b.id === linkingBlockId) {
                if (b.type === 'scene_heading') {
                  return { ...b, locationId: assetId };
                }
                return { ...b, linkedAssetId: assetId };
              }
              return b;
            });
            updateScene(activeScene.id, { scriptBlocks: updatedBlocks }, activeEpisode.id);
            toast.success('资产关联成功');
            setLinkingBlockId(null);
          }
        }}
      />

      <PromptEditorModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState(prev => ({ ...prev, isOpen: false }))}
        templateId={promptModalState.templateId}
        variables={promptModalState.variables}
        onConfirm={promptModalState.onConfirm}
        contextOptions={promptModalState.contextOptions}
        defaultSelectedContextIds={promptModalState.defaultSelectedContextIds}
      />

      <ScriptOptionsModal
        generatedOptions={generatedOptions}
        onSelectOption={handleSelectOption}
        onClose={() => setGeneratedOptions(null)}
      />
    </motion.div>
  );
}
