/**
 * Custom hook for canvas history operations
 * Provides undo/redo functionality that integrates tree history with canvas rendering
 *
 * Handles:
 * - Saving current canvas state to tree history
 * - Undo operation with canvas restoration
 * - Redo operation with canvas restoration
 */

import { useCallback, RefObject } from "react";
import { useTreeHistory } from "../context/state/useTreeHistory";

/**
 * Parameters for the canvas history hook
 */
interface UseCanvasHistoryParams {
	/** Reference to the canvas element */
	canvasRef: RefObject<HTMLCanvasElement>;
}

/**
 * Return type for the canvas history hook
 */
interface UseCanvasHistoryReturn {
	/** Save current canvas state to history */
	saveHistoryState: () => void;
	/** Undo last action and restore canvas */
	undo: () => void;
	/** Redo last undone action and restore canvas */
	redo: () => void;
	/** Whether undo is available */
	canUndo: boolean;
	/** Whether redo is available */
	canRedo: boolean;
	/** Push state to tree history */
	pushTreeState: (imageData: ImageData, description: string) => void;
	/** Get root node of history tree */
	getRoot: ReturnType<typeof useTreeHistory>["getRoot"];
	/** Navigate to a specific history node */
	goToNode: ReturnType<typeof useTreeHistory>["goToNode"];
}

/**
 * Hook for managing canvas history with tree-based undo/redo
 *
 * This hook integrates the tree history system with actual canvas operations,
 * capturing canvas state and restoring it when navigating history.
 *
 * @param {UseCanvasHistoryParams} params - Hook parameters
 * @returns {UseCanvasHistoryReturn} History operations and state
 *
 * @example
 * const { saveHistoryState, undo, redo, canUndo, canRedo } = useCanvasHistory({
 *   canvasRef,
 * });
 *
 * // Save state before making changes
 * saveHistoryState();
 *
 * // Undo last action
 * if (canUndo) undo();
 */
export function useCanvasHistory({
	canvasRef,
}: UseCanvasHistoryParams): UseCanvasHistoryReturn {
	const {
		getRoot,
		goToNode,
		undo: undoTree,
		redo: redoTree,
		canUndo,
		canRedo,
		pushState: pushTreeState,
	} = useTreeHistory();

	/**
	 * Save current canvas state to tree history
	 * Captures the canvas ImageData and pushes to history tree
	 */
	const saveHistoryState = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Save to tree history (used by Canvas component and dialogs)
		pushTreeState(imageData, "Manual Save");
	}, [canvasRef, pushTreeState]);

	/**
	 * Undo last action and restore canvas to previous state
	 * Uses tree history to get previous node and restores its ImageData
	 */
	const undo = useCallback(() => {
		const node = undoTree();
		if (node && canvasRef.current) {
			const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
			if (ctx) {
				ctx.putImageData(node.imageData, 0, 0);
			}
		}
	}, [undoTree, canvasRef]);

	/**
	 * Redo last undone action and restore canvas to next state
	 * Uses tree history to get next node and restores its ImageData
	 */
	const redo = useCallback(() => {
		const node = redoTree();
		if (node && canvasRef.current) {
			const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
			if (ctx) {
				ctx.putImageData(node.imageData, 0, 0);
			}
		}
	}, [redoTree, canvasRef]);

	return {
		saveHistoryState,
		undo,
		redo,
		canUndo: canUndo(),
		canRedo: canRedo(),
		pushTreeState,
		getRoot,
		goToNode,
	};
}
