/**
 * Get undo/redo state and actions
 */
import { useCanvasStore } from "./canvasStore";

export function useHistory() {
	const canUndo = useCanvasStore((state) => state.undoStack.length > 0);
	const canRedo = useCanvasStore((state) => state.redoStack.length > 0);
	const saveState = useCanvasStore((state) => state.saveState);
	const undo = useCanvasStore((state) => state.undo);
	const redo = useCanvasStore((state) => state.redo);
	const clearHistory = useCanvasStore((state) => state.clearHistory);

	return {
		canUndo,
		canRedo,
		saveState,
		undo,
		redo,
		clearHistory,
	};
}
