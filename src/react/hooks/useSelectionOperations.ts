import { useCallback } from "react";
import { useHistory, useSelection, useColors, useTool } from "../context/state/hooks";
import { useCanvasStore } from "../context/state/canvasStore";
import { TOOL_IDS } from "../context/state/types";

/**
 * Hook providing selection operations: selectAll, deleteSelection, cropToSelection
 * Requires canvasRef to be passed in since it's no longer in context
 */
export function useSelectionOperations(canvasRef: React.RefObject<HTMLCanvasElement>) {
	const { saveState } = useHistory();
	const { selection, setSelection, clearSelection } = useSelection();
	const { secondaryColor } = useColors();
	const { setTool } = useTool();
	const { setCanvasSize } = useCanvasStore();

	/**
	 * Select the entire canvas content
	 * Creates a selection covering the full canvas and "lifts" the pixels
	 */
	const selectAll = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Capture current state for undo
		const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
		saveState(currentState);

		// Capture the entire canvas content
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Clear canvas with background color (selection "lifts" pixels)
		ctx.fillStyle = secondaryColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Create selection covering entire canvas
		setSelection({
			x: 0,
			y: 0,
			width: canvas.width,
			height: canvas.height,
			imageData,
		});

		// Switch to select tool
		setTool(TOOL_IDS.SELECT);
	}, [canvasRef, saveState, secondaryColor, setSelection, setTool]);

	/**
	 * Delete the current selection
	 * The selection area is already cleared when lifted, so we just clear the selection state
	 */
	const deleteSelection = useCallback(() => {
		if (!selection) return;

		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Capture current state for undo
		const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
		saveState(currentState);

		// The area under the selection is already filled with background color
		// when the selection was created (pixels are "lifted" from canvas)
		// So we just need to clear the selection without putting it back
		clearSelection();
	}, [selection, saveState, clearSelection, canvasRef]);

	/**
	 * Crop the canvas to the current selection bounds
	 * Resizes the canvas to match the selection dimensions
	 */
	const cropToSelection = useCallback(() => {
		if (!selection?.imageData) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Capture current state for undo
		const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
		saveState(currentState);

		const { width, height, imageData } = selection;

		// Resize canvas to selection dimensions
		canvas.width = width;
		canvas.height = height;

		// Draw the selection content onto the resized canvas (ctx is still valid after resize)
		ctx.putImageData(imageData, 0, 0);

		// Update canvas size in state
		setCanvasSize(width, height);

		// Clear selection
		clearSelection();
	}, [selection, canvasRef, saveState, setCanvasSize, clearSelection]);

	return {
		selectAll,
		deleteSelection,
		cropToSelection,
		hasSelection: selection !== null,
		hasSelectionWithData: selection?.imageData !== null,
	};
}
