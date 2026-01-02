import type { Selection } from "../context/state/types";

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

	console.log('[drawSelectionOverlay] Drawing selection:', { x, y, width, height, hasPath: !!path });

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
