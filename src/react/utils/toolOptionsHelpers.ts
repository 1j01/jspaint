import { BrushShape } from "../data/toolOptionsData";

/**
 * Draw brush shape on canvas (matches legacy stamp_brush_canvas)
 *
 * @param ctx - Canvas rendering context
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param shape - Brush shape type
 * @param size - Brush size in pixels
 * @param color - Fill color
 */
export function drawBrushShape(
	ctx: CanvasRenderingContext2D,
	centerX: number,
	centerY: number,
	shape: BrushShape,
	size: number,
	color: string,
): void {
	ctx.fillStyle = color;

	switch (shape) {
		case "circle": {
			// Draw circular brush
			const radius = size / 2;
			for (let y = -Math.ceil(radius); y <= Math.ceil(radius); y++) {
				for (let x = -Math.ceil(radius); x <= Math.ceil(radius); x++) {
					if (x * x + y * y <= radius * radius) {
						ctx.fillRect(centerX + x, centerY + y, 1, 1);
					}
				}
			}
			break;
		}
		case "square": {
			// Draw square brush
			const halfSize = Math.floor(size / 2);
			ctx.fillRect(centerX - halfSize, centerY - halfSize, size, size);
			break;
		}
		case "reverse_diagonal": {
			// Draw reverse diagonal line (top-right to bottom-left: /)
			for (let i = 0; i < size; i++) {
				ctx.fillRect(centerX + Math.floor(size / 2) - i - 1, centerY - Math.floor(size / 2) + i, 1, 1);
			}
			break;
		}
		case "diagonal": {
			// Draw diagonal line (top-left to bottom-right: \)
			for (let i = 0; i < size; i++) {
				ctx.fillRect(centerX - Math.floor(size / 2) + i, centerY - Math.floor(size / 2) + i, 1, 1);
			}
			break;
		}
	}
}
