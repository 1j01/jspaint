import { useCallback } from "react";
import { useApp, useHistory, useSelection, useColors, TOOL_IDS } from "../context/AppContext";

/**
 * Hook providing selection operations: selectAll, deleteSelection, cropToSelection
 */
export function useSelectionOperations() {
	const { actions, canvasRef } = useApp();
	const { saveState } = useHistory();
	const { selection, setSelection, clearSelection } = useSelection();
	const { secondaryColor } = useColors();

	/**
	 * Select the entire canvas content
	 * Creates a selection covering the full canvas and "lifts" the pixels
	 */
	const selectAll = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		saveState(); // For undo

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
		actions.setTool(TOOL_IDS.SELECT);
	}, [canvasRef, saveState, secondaryColor, setSelection, actions]);

	/**
	 * Delete the current selection
	 * The selection area is already cleared when lifted, so we just clear the selection state
	 */
	const deleteSelection = useCallback(() => {
		if (!selection) return;

		saveState(); // For undo

		// The area under the selection is already filled with background color
		// when the selection was created (pixels are "lifted" from canvas)
		// So we just need to clear the selection without putting it back
		clearSelection();
	}, [selection, saveState, clearSelection]);

	/**
	 * Crop the canvas to the current selection bounds
	 * Resizes the canvas to match the selection dimensions
	 */
	const cropToSelection = useCallback(() => {
		if (!selection?.imageData) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		saveState(); // For undo

		const { width, height, imageData } = selection;

		// Resize canvas to selection dimensions
		canvas.width = width;
		canvas.height = height;

		// Draw the selection content onto the resized canvas
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		ctx.putImageData(imageData, 0, 0);

		// Update canvas size in state
		actions.setCanvasSize(width, height);

		// Clear selection
		clearSelection();
	}, [selection, canvasRef, saveState, actions, clearSelection]);

	return {
		selectAll,
		deleteSelection,
		cropToSelection,
		hasSelection: selection !== null,
		hasSelectionWithData: selection?.imageData !== null,
	};
}
