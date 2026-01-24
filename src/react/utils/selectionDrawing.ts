import type { Selection } from "../context/state/types";
import { getRgbaFromColor } from "./colorUtils";

/**
 * Draw selection overlay with marching ants animation
 *
 * @param overlayCtx - Overlay canvas context
 * @param selection - Current selection state
 * @param offset - Marching ants offset for animation
 */
export function drawSelectionOverlay(
	overlayCtx: CanvasRenderingContext2D,
	selection: Selection,
	offset: number,
): void {
	const { x, y, width, height, path } = selection;

	// Draw marching ants border
	overlayCtx.save();
	overlayCtx.setLineDash([4, 4]);
	overlayCtx.lineDashOffset = -offset;

	if (path && path.length > 2) {
		// Free-form selection
		overlayCtx.strokeStyle = "#000000";
		overlayCtx.lineWidth = 1;
		overlayCtx.beginPath();
		overlayCtx.moveTo(x + path[0].x, y + path[0].y);
		for (let i = 1; i < path.length; i++) {
			overlayCtx.lineTo(x + path[i].x, y + path[i].y);
		}
		overlayCtx.closePath();
		overlayCtx.stroke();

		overlayCtx.strokeStyle = "#ffffff";
		overlayCtx.lineDashOffset = -offset + 4;
		overlayCtx.stroke();
	} else {
		// Rectangular selection
		overlayCtx.strokeStyle = "#000000";
		overlayCtx.lineWidth = 1;
		overlayCtx.strokeRect(x, y, width, height);

		overlayCtx.strokeStyle = "#ffffff";
		overlayCtx.lineDashOffset = -offset + 4;
		overlayCtx.strokeRect(x, y, width, height);
	}

	overlayCtx.restore();
}

/**
 * Draw rectangular selection preview during drag
 *
 * @param overlayCtx - Overlay canvas context
 * @param startX - Selection start X
 * @param startY - Selection start Y
 * @param currentX - Current pointer X
 * @param currentY - Current pointer Y
 */
export function drawRectangularPreview(
	overlayCtx: CanvasRenderingContext2D,
	startX: number,
	startY: number,
	currentX: number,
	currentY: number,
): void {
	const width = currentX - startX;
	const height = currentY - startY;

	overlayCtx.setLineDash([4, 4]);
	overlayCtx.strokeStyle = "#000000";
	overlayCtx.strokeRect(Math.min(startX, currentX), Math.min(startY, currentY), Math.abs(width), Math.abs(height));
	overlayCtx.strokeStyle = "#ffffff";
	overlayCtx.lineDashOffset = 4;
	overlayCtx.strokeRect(Math.min(startX, currentX), Math.min(startY, currentY), Math.abs(width), Math.abs(height));
}

/**
 * Draw free-form selection preview during drag
 *
 * @param overlayCtx - Overlay canvas context
 * @param points - Array of points forming the selection path
 */
export function drawFreeFormPreview(
	overlayCtx: CanvasRenderingContext2D,
	points: Array<{ x: number; y: number }>,
): void {
	if (points.length > 1) {
		overlayCtx.setLineDash([4, 4]);
		overlayCtx.strokeStyle = "#000000";
		overlayCtx.beginPath();
		overlayCtx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			overlayCtx.lineTo(points[i].x, points[i].y);
		}
		overlayCtx.stroke();
	}
}

/**
 * Clear overlay canvas
 *
 * @param overlayCtx - Overlay canvas context
 * @param width - Canvas width
 * @param height - Canvas height
 */
export function clearOverlay(overlayCtx: CanvasRenderingContext2D, width: number, height: number): void {
	overlayCtx.clearRect(0, 0, width, height);
}

/**
 * Apply transparency to imageData based on background color.
 * Makes pixels matching the background color fully transparent.
 * Used when drawOpaque is false (transparent selection mode).
 *
 * @param imageData - Source imageData to process
 * @param backgroundColor - CSS color string for background color
 * @param tolerance - Color matching tolerance (default 1)
 * @returns New ImageData with transparency applied
 */
export function applyTransparencyToImageData(
	imageData: ImageData,
	backgroundColor: string,
	tolerance: number = 1,
): ImageData {
	const [bgR, bgG, bgB] = getRgbaFromColor(backgroundColor);
	const result = new ImageData(
		new Uint8ClampedArray(imageData.data),
		imageData.width,
		imageData.height,
	);

	for (let i = 0; i < result.data.length; i += 4) {
		const r = result.data[i];
		const g = result.data[i + 1];
		const b = result.data[i + 2];

		// Check if pixel matches background color within tolerance
		const rDiff = Math.abs(r - bgR);
		const gDiff = Math.abs(g - bgG);
		const bDiff = Math.abs(b - bgB);

		if (rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance) {
			// Make pixel fully transparent
			result.data[i + 3] = 0;
		}
	}

	return result;
}

/**
 * Commit selection imageData to canvas with optional transparency.
 * When drawOpaque is false, background-colored pixels are made transparent
 * and the selection is composited using drawImage for proper alpha blending.
 *
 * @param ctx - Canvas context to draw on
 * @param imageData - Selection image data
 * @param x - X position to draw at
 * @param y - Y position to draw at
 * @param drawOpaque - Whether to draw opaquely (false = transparent mode)
 * @param backgroundColor - Background color for transparency matching
 */
export function commitSelectionToCanvas(
	ctx: CanvasRenderingContext2D,
	imageData: ImageData,
	x: number,
	y: number,
	drawOpaque: boolean,
	backgroundColor: string,
): void {
	if (drawOpaque) {
		// Opaque mode: directly put imageData (replaces pixels)
		ctx.putImageData(imageData, x, y);
	} else {
		// Transparent mode: apply transparency and composite with drawImage
		const transparentData = applyTransparencyToImageData(imageData, backgroundColor);

		// Create a temporary canvas to hold the transparent imageData
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = transparentData.width;
		tempCanvas.height = transparentData.height;
		const tempCtx = tempCanvas.getContext("2d");
		if (tempCtx) {
			tempCtx.putImageData(transparentData, 0, 0);
			// Use drawImage for proper alpha compositing
			ctx.drawImage(tempCanvas, x, y);
		}
	}
}
