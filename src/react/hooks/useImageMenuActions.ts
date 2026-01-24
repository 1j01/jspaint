/**
 * Image menu actions hook
 * Handles Image menu operations: Flip/Rotate, Stretch/Skew, Invert Colors, etc.
 */

import { RefObject, useCallback } from "react";
import { useUIStore } from "../context/state/uiStore";

/**
 * Image menu actions interface
 */
export interface ImageMenuActions {
	imageFlipRotate: () => void;
	imageStretchSkew: () => void;
	imageInvertColors: () => void;
	imageAttributes: () => void;
	imageClearImage: () => void;
	imageCropToSelection: () => void;
	imageToggleDrawOpaque: () => void;
}

/**
 * Selection state interface
 */
interface SelectionState {
	x: number;
	y: number;
	width: number;
	height: number;
	imageData?: ImageData;
}

/**
 * Parameters for the image menu actions hook
 */
export interface UseImageMenuActionsParams {
	canvasRef: RefObject<HTMLCanvasElement>;
	saveState: () => void;
	setCanvasSize: (width: number, height: number) => void;
	selection: SelectionState | null;
	clearSelection: () => void;
	handleInvertColors: () => void;
	handleClearImage: () => void;
	toggleDrawOpaque: () => void;
}

/**
 * Hook for Image menu action handlers
 *
 * @param {UseImageMenuActionsParams} params - Hook parameters
 * @returns {ImageMenuActions} Image menu action handlers
 *
 * @example
 * const imageActions = useImageMenuActions({
 *   canvasRef,
 *   saveState,
 *   setCanvasSize,
 *   selection,
 *   clearSelection,
 *   handleInvertColors,
 *   handleClearImage,
 *   toggleDrawOpaque,
 * });
 */
export function useImageMenuActions(params: UseImageMenuActionsParams): ImageMenuActions {
	const {
		canvasRef,
		saveState,
		setCanvasSize,
		selection,
		clearSelection,
		handleInvertColors,
		handleClearImage,
		toggleDrawOpaque,
	} = params;

	const openDialog = useUIStore((state) => state.openDialog);

	const imageFlipRotate = useCallback(() => openDialog("flipRotate"), [openDialog]);
	const imageStretchSkew = useCallback(() => openDialog("stretchSkew"), [openDialog]);
	const imageAttributes = useCallback(() => openDialog("attributes"), [openDialog]);

	const imageCropToSelection = useCallback(() => {
		if (!selection) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		saveState();
		const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
		canvas.width = selection.width;
		canvas.height = selection.height;
		ctx.putImageData(imageData, 0, 0);
		setCanvasSize(selection.width, selection.height);
		clearSelection();
	}, [selection, canvasRef, saveState, setCanvasSize, clearSelection]);

	return {
		imageFlipRotate,
		imageStretchSkew,
		imageInvertColors: handleInvertColors,
		imageAttributes,
		imageClearImage: handleClearImage,
		imageCropToSelection,
		imageToggleDrawOpaque: toggleDrawOpaque,
	};
}
