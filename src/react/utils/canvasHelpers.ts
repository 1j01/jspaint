/**
 * Canvas Helper Utilities
 *
 * Pure utility functions for canvas operations.
 * These functions don't use React hooks and can be tested independently.
 */

import { TOOL_IDS } from "../context/state/types";

/**
 * Available magnification levels for the Magnifier tool.
 * Matches MS Paint's zoom levels: 1x, 2x, 4x, 6x, 8x
 */
export const MAGNIFICATION_LEVELS = [1, 2, 4, 6, 8];

/**
 * Get CSS cursor style based on current tool.
 *
 * Returns the appropriate cursor for each drawing tool:
 * - Magnifier: zoom-in cursor
 * - Text: text cursor
 * - All other tools: crosshair for precision
 *
 * @param selectedToolId - Currently selected tool ID
 * @returns CSS cursor value
 */
export function getCursorForTool(selectedToolId: string): string {
	switch (selectedToolId) {
		case TOOL_IDS.MAGNIFIER:
			return "zoom-in";
		case TOOL_IDS.TEXT:
			return "text";
		default:
			return "crosshair";
	}
}

/**
 * Resize a selection's image data.
 *
 * Takes a selection with image data and resizes it to new dimensions.
 * Uses bilinear interpolation for smooth scaling.
 *
 * Process:
 * 1. Creates temporary canvas with original selection ImageData
 * 2. Creates new canvas with new dimensions
 * 3. Draws original selection scaled to new size
 * 4. Captures new ImageData
 * 5. Returns updated selection object
 *
 * @param selection - Current selection with imageData
 * @param newRect - New selection bounds
 * @returns Updated selection object with resized image data, or null if invalid
 */
export function resizeSelection(
	selection: {
		x: number;
		y: number;
		width: number;
		height: number;
		imageData: ImageData;
	} | null,
	newRect: { x: number; y: number; width: number; height: number }
): {
	x: number;
	y: number;
	width: number;
	height: number;
	imageData: ImageData;
} | null {
	if (!selection || !selection.imageData) return null;

	// Create a temporary canvas with the original selection
	const tempCanvas = document.createElement("canvas");
	tempCanvas.width = selection.imageData.width;
	tempCanvas.height = selection.imageData.height;
	const tempCtx = tempCanvas.getContext("2d");
	if (!tempCtx) return null;
	tempCtx.putImageData(selection.imageData, 0, 0);

	// Create a new canvas with the new size
	const resizedCanvas = document.createElement("canvas");
	resizedCanvas.width = newRect.width;
	resizedCanvas.height = newRect.height;
	const resizedCtx = resizedCanvas.getContext("2d");
	if (!resizedCtx) return null;

	// Draw the original selection scaled to the new size
	resizedCtx.drawImage(tempCanvas, 0, 0, newRect.width, newRect.height);

	// Get the new image data
	const newImageData = resizedCtx.getImageData(0, 0, newRect.width, newRect.height);

	// Return the updated selection
	return {
		...selection,
		x: newRect.x,
		y: newRect.y,
		width: newRect.width,
		height: newRect.height,
		imageData: newImageData,
	};
}

/**
 * Resize canvas while preserving content.
 *
 * Resizes the canvas to new dimensions while:
 * 1. Preserving the existing image content
 * 2. Filling new areas with white background
 * 3. Handling the timing properly (canvas resize clears content)
 *
 * Note: This function returns the current ImageData which should be
 * restored after the canvas resize completes in the next frame.
 *
 * @param canvas - Canvas element to resize
 * @param currentWidth - Current canvas width
 * @param currentHeight - Current canvas height
 * @returns Current canvas ImageData to restore after resize, or null if invalid
 */
export function prepareCanvasResize(
	canvas: HTMLCanvasElement,
	currentWidth: number,
	currentHeight: number
): ImageData | null {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;

	// Save current canvas content
	const currentImageData = ctx.getImageData(0, 0, currentWidth, currentHeight);
	return currentImageData;
}

/**
 * Restore canvas content after resize.
 *
 * After a canvas resize (which clears the canvas), this function:
 * 1. Fills the canvas with white background
 * 2. Restores the previous content from ImageData
 *
 * @param canvas - Canvas element that was resized
 * @param imageData - ImageData to restore
 * @param newWidth - New canvas width
 * @param newHeight - New canvas height
 */
export function restoreCanvasAfterResize(
	canvas: HTMLCanvasElement,
	imageData: ImageData,
	newWidth: number,
	newHeight: number
): void {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return;

	// Fill with white background
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, newWidth, newHeight);

	// Restore the previous content
	ctx.putImageData(imageData, 0, 0);
}

/**
 * Map of tool IDs to their display names for history.
 * Used when saving operations to the undo/redo stack.
 */
export const TOOL_NAMES: Record<string, string> = {
	[TOOL_IDS.LINE]: "Line",
	[TOOL_IDS.CURVE]: "Curve",
	[TOOL_IDS.RECTANGLE]: "Rectangle",
	[TOOL_IDS.ROUNDED_RECTANGLE]: "Rounded Rectangle",
	[TOOL_IDS.ELLIPSE]: "Ellipse",
	[TOOL_IDS.POLYGON]: "Polygon",
	[TOOL_IDS.PENCIL]: "Pencil",
	[TOOL_IDS.BRUSH]: "Brush",
	[TOOL_IDS.ERASER]: "Eraser",
	[TOOL_IDS.AIRBRUSH]: "Airbrush",
	[TOOL_IDS.FILL]: "Fill",
	[TOOL_IDS.PICK_COLOR]: "Pick Color",
	[TOOL_IDS.SELECT]: "Select",
	[TOOL_IDS.FREE_FORM_SELECT]: "Free-Form Select",
	[TOOL_IDS.TEXT]: "Text",
	[TOOL_IDS.MAGNIFIER]: "Magnifier",
};

/**
 * Get the CSS style object for the canvas element.
 * Applies cursor and magnification transform.
 *
 * @param selectedToolId - Currently selected tool ID
 * @param magnification - Current magnification level (1-8)
 * @returns CSS style object for canvas element
 */
export function getCanvasStyle(selectedToolId: string, magnification: number): React.CSSProperties {
	return {
		cursor: getCursorForTool(selectedToolId),
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
		transformOrigin: magnification > 1 ? "top left" : undefined,
	};
}
