import { useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';

interface DragAndDropHandlers {
  onReorder: (sourceIndex: number, destinationIndex: number, droppableId: string, type: string) => void;
}

export function useDragAndDrop({ onReorder }: DragAndDropHandlers) {
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;
    if (destination.index === source.index && destination.droppableId === source.droppableId) return;

    onReorder(source.index, destination.index, source.droppableId, type);
  }, [onReorder]);

  return {
    handleDragEnd,
  };
}
