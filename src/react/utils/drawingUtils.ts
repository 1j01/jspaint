/**
 * Drawing utility functions for canvas operations
 * Pure functions that perform drawing algorithms
 */

import { getRgbaFromColor } from "./colorUtils";

/**
 * Draw a line using Bresenham's algorithm for pixel-perfect lines.
 * This algorithm efficiently rasterizes a line between two points by calling
 * a callback function for each pixel along the line path.
 *
 * @param x0 - Starting X coordinate
 * @param y0 - Starting Y coordinate
 * @param x1 - Ending X coordinate
 * @param y1 - Ending Y coordinate
 * @param callback - Function called for each pixel (x, y) on the line
 * @returns void
 *
 * @example
 * // Draw a line from (10, 10) to (50, 30)
 * bresenhamLine(10, 10, 50, 30, (x, y) => {
 *   ctx.fillRect(x, y, 1, 1);
 * });
 */
export function bresenhamLine(
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	callback: (x: number, y: number) => void,
): void {
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

	let currentX = x0;
	let currentY = y0;

	while (true) {
		callback(currentX, currentY);

		if (currentX === x1 && currentY === y1) break;

		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			currentX += sx;
		}
		if (e2 < dx) {
			err += dx;
			currentY += sy;
		}
	}
}

export type BrushShape = "circle" | "square" | "reverse_diagonal" | "diagonal";

export interface BrushPoint {
	x: number;
	y: number;
}

/**
 * Get brush shape points for a given size and shape.
 * Returns an array of relative offsets from the brush center that define
 * the brush pattern. Used by the Brush and Eraser tools.
 *
 * @param size - Brush diameter in pixels (1-4)
 * @param shape - Brush shape: "circle" (default), "square", "diagonal", or "reverse_diagonal"
 * @returns Array of {x, y} offset points relative to brush center
 *
 * @example
 * // Get points for a 3-pixel circle brush
 * const points = getBrushPoints(3, "circle");
 * // Returns points like [{x: 0, y: 0}, {x: -1, y: 0}, {x: 1, y: 0}, ...]
 */
export function getBrushPoints(size: number, shape: BrushShape = "circle"): BrushPoint[] {
	const points: BrushPoint[] = [];
	const radius = Math.floor(size / 2);

	switch (shape) {
		case "circle":
			for (let y = -radius; y <= radius; y++) {
				for (let x = -radius; x <= radius; x++) {
					if (x * x + y * y <= radius * radius) {
						points.push({ x, y });
					}
				}
			}
			break;

		case "square":
			for (let y = -radius; y <= radius; y++) {
				for (let x = -radius; x <= radius; x++) {
					points.push({ x, y });
				}
			}
			break;

		case "reverse_diagonal":
			// Diagonal line from top-right to bottom-left (/)
			for (let i = 0; i < size; i++) {
				points.push({ x: radius - i, y: -radius + i });
			}
			break;

		case "diagonal":
			// Diagonal line from top-left to bottom-right (\)
			for (let i = 0; i < size; i++) {
				points.push({ x: -radius + i, y: -radius + i });
			}
			break;
	}

	// Ensure at least one point (for size 1)
	if (points.length === 0) {
		points.push({ x: 0, y: 0 });
	}

	return points;
}

/**
 * Flood fill algorithm (scanline-based).
 * Fills a contiguous region of similar colors starting from a point.
 * Does nothing if clicking on the same color as the fill color.
 *
 * **Tolerance Note:**
 * Uses a fixed tolerance of 2 (per RGB/A channel) to handle slight color variations
 * that can occur from canvas anti-aliasing or JPEG compression artifacts.
 * Classic MS Paint uses exact pixel matching (tolerance=0), but browser canvas
 * rendering can introduce sub-pixel color differences, so a small tolerance
 * prevents unexpected fill boundaries. This value is intentionally not
 * configurable to match the original MS Paint behavior of having no tolerance UI.
 *
 * @param ctx - Canvas 2D rendering context to fill on
 * @param startX - Starting X coordinate (will be clamped to canvas bounds)
 * @param startY - Starting Y coordinate (will be clamped to canvas bounds)
 * @param fillColor - CSS color string for the fill color
 * @returns void
 *
 * @example
 * // Fill from point (50, 50) with red color
 * floodFill(ctx, 50, 50, "#ff0000");
 */
export function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string): void {
	const canvas = ctx.canvas;
	const width = canvas.width;
	const height = canvas.height;

	const clampedStartX = Math.max(0, Math.min(Math.floor(startX), width - 1));
	const clampedStartY = Math.max(0, Math.min(Math.floor(startY), height - 1));

	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	// Get start color
	const startPos = (clampedStartY * width + clampedStartX) * 4;
	const startR = data[startPos];
	const startG = data[startPos + 1];
	const startB = data[startPos + 2];
	const startA = data[startPos + 3];

	// Get fill color
	const [fillR, fillG, fillB, fillA] = getRgbaFromColor(fillColor);

	// Don't fill if clicking on the same color
	// Tolerance handles anti-aliasing artifacts (see JSDoc for rationale)
	const tolerance = 2;
	if (
		Math.abs(fillR - startR) <= tolerance &&
		Math.abs(fillG - startG) <= tolerance &&
		Math.abs(fillB - startB) <= tolerance &&
		Math.abs(fillA - startA) <= tolerance
	) {
		return;
	}

	const stack: [number, number][] = [[clampedStartX, clampedStartY]];

	const shouldFill = (pos: number): boolean => {
		return (
			Math.abs(data[pos] - startR) <= tolerance &&
			Math.abs(data[pos + 1] - startG) <= tolerance &&
			Math.abs(data[pos + 2] - startB) <= tolerance &&
			Math.abs(data[pos + 3] - startA) <= tolerance
		);
	};

	const doFill = (pos: number): void => {
		data[pos] = fillR;
		data[pos + 1] = fillG;
		data[pos + 2] = fillB;
		data[pos + 3] = fillA;
	};

	while (stack.length > 0) {
		const [x, y] = stack.pop()!;

		// Go up to find the top of the fill area
		let currentY = y;
		while (currentY >= 0 && shouldFill((currentY * width + x) * 4)) {
			currentY--;
		}
		currentY++;
		let pixelPos = (currentY * width + x) * 4;

		let reachLeft = false;
		let reachRight = false;

		// Fill downward
		while (currentY < height && shouldFill(pixelPos)) {
			doFill(pixelPos);

			// Check left
			if (x > 0) {
				if (shouldFill(pixelPos - 4)) {
					if (!reachLeft) {
						stack.push([x - 1, currentY]);
						reachLeft = true;
					}
				} else {
					reachLeft = false;
				}
			}

			// Check right
			if (x < width - 1) {
				if (shouldFill(pixelPos + 4)) {
					if (!reachRight) {
						stack.push([x + 1, currentY]);
						reachRight = true;
					}
				} else {
					reachRight = false;
				}
			}

			currentY++;
			pixelPos = (currentY * width + x) * 4;
		}
	}

	ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw an ellipse using the native canvas ellipse method.
 * Fills first, then strokes (so stroke is on top of fill).
 * Automatically normalizes negative width/height values.
 * Minimum size is 2x2 pixels.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Top-left X coordinate of bounding box
 * @param y - Top-left Y coordinate of bounding box
 * @param width - Width of bounding box (can be negative)
 * @param height - Height of bounding box (can be negative)
 * @param strokeColor - Stroke color (null for no stroke)
 * @param fillColor - Fill color (null for no fill)
 * @param strokeWidth - Stroke width in pixels (default: 1)
 * @returns void
 *
 * @example
 * // Draw a filled red ellipse with black outline
 * drawEllipse(ctx, 10, 10, 100, 50, "#000000", "#ff0000", 2);
 */
export function drawEllipse(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	strokeColor: string | null,
	fillColor: string | null,
	strokeWidth: number = 1,
): void {
	// Normalize coordinates
	let normX = x;
	let normY = y;
	let normWidth = width;
	let normHeight = height;

	if (normWidth < 0) {
		normX += normWidth;
		normWidth = -normWidth;
	}
	if (normHeight < 0) {
		normY += normHeight;
		normHeight = -normHeight;
	}

	if (normWidth < 2 || normHeight < 2) return;

	const cx = normX + normWidth / 2;
	const cy = normY + normHeight / 2;
	const rx = normWidth / 2;
	const ry = normHeight / 2;

	// Fill first
	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.beginPath();
		ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
		ctx.fill();
	}

	// Stroke
	if (strokeColor && strokeWidth > 0) {
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = strokeWidth;
		ctx.beginPath();
		ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
		ctx.stroke();
	}
}

/**
 * Draw a rectangle with pixel-perfect rendering.
 * Fills first, then strokes using fillRect for crisp edges.
 * Automatically normalizes negative width/height values.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Top-left X coordinate (can be negative)
 * @param y - Top-left Y coordinate (can be negative)
 * @param width - Rectangle width (can be negative)
 * @param height - Rectangle height (can be negative)
 * @param strokeColor - Stroke color (null for no stroke)
 * @param fillColor - Fill color (null for no fill)
 * @param strokeWidth - Stroke width in pixels (default: 1)
 * @returns void
 *
 * @example
 * // Draw a filled blue rectangle with black outline
 * drawRectangle(ctx, 10, 10, 100, 50, "#000000", "#0000ff", 2);
 */
export function drawRectangle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	strokeColor: string | null,
	fillColor: string | null,
	strokeWidth: number = 1,
): void {
	// Normalize coordinates
	let normX = x;
	let normY = y;
	let normWidth = width;
	let normHeight = height;

	if (normWidth < 0) {
		normX += normWidth;
		normWidth = -normWidth;
	}
	if (normHeight < 0) {
		normY += normHeight;
		normHeight = -normHeight;
	}

	// Fill first
	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fillRect(normX, normY, normWidth, normHeight);
	}

	// Stroke - draw as filled rectangles for pixel-perfect rendering
	if (strokeColor && strokeWidth > 0) {
		ctx.fillStyle = strokeColor;
		// Top
		ctx.fillRect(normX, normY, normWidth, strokeWidth);
		// Bottom
		ctx.fillRect(normX, normY + normHeight - strokeWidth, normWidth, strokeWidth);
		// Left
		ctx.fillRect(normX, normY, strokeWidth, normHeight);
		// Right
		ctx.fillRect(normX + normWidth - strokeWidth, normY, strokeWidth, normHeight);
	}
}

/**
 * Airbrush spray effect - random dots within a circular radius.
 * Creates a natural spray paint effect by placing random pixels
 * within a circular area. Density increases with size.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param color - CSS color string for spray dots
 * @param size - Spray radius diameter in pixels (default: 10)
 * @returns void
 *
 * @example
 * // Spray red paint at point (100, 100) with 20px radius
 * sprayAirbrush(ctx, 100, 100, "#ff0000", 20);
 */
export function sprayAirbrush(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	color: string,
	size: number = 10,
): void {
	const radius = size / 2;
	const density = Math.floor(6 + radius / 5);

	ctx.fillStyle = color;

	for (let i = 0; i < density; i++) {
		const rx = (Math.random() * 2 - 1) * radius;
		const ry = (Math.random() * 2 - 1) * radius;
		const distance = rx * rx + ry * ry;

		// Only place dots within the circular radius
		if (distance <= radius * radius) {
			// Use bitwise OR for truncation toward zero (matches jQuery's ~~rx behavior)
			// This differs from Math.floor which floors toward negative infinity
			ctx.fillRect(x + (rx | 0), y + (ry | 0), 1, 1);
		}
	}
}

/**
 * Draw a quadratic bezier curve.
 * Used by the Curve tool to create smooth curved lines
 * defined by two endpoints and one control point.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x1 - Starting X coordinate
 * @param y1 - Starting Y coordinate
 * @param x2 - Ending X coordinate
 * @param y2 - Ending Y coordinate
 * @param cpX - Control point X coordinate
 * @param cpY - Control point Y coordinate
 * @param strokeColor - CSS color string for the curve
 * @param strokeWidth - Stroke width in pixels (default: 1)
 * @returns void
 *
 * @example
 * // Draw a curved line from (10, 10) to (100, 10) with control at (55, 50)
 * drawQuadraticCurve(ctx, 10, 10, 100, 10, 55, 50, "#000000", 2);
 */
export function drawQuadraticCurve(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	cpX: number,
	cpY: number,
	strokeColor: string,
	strokeWidth: number = 1,
): void {
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = strokeWidth;
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.quadraticCurveTo(cpX, cpY, x2, y2);
	ctx.stroke();
}

export interface Point {
	x: number;
	y: number;
}

/**
 * Draw a polygon from an array of points.
 * Connects points with straight lines. Optionally closes the path
 * and fills/strokes the shape. Fills first, then strokes.
 *
 * @param ctx - Canvas 2D rendering context
 * @param points - Array of {x, y} points defining the polygon vertices
 * @param strokeColor - Stroke color (null for no stroke)
 * @param fillColor - Fill color (null for no fill)
 * @param strokeWidth - Stroke width in pixels (default: 1)
 * @param closed - Whether to close the path (connect last to first point) (default: true)
 * @returns void
 *
 * @example
 * // Draw a filled triangle
 * const points = [{x: 50, y: 10}, {x: 10, y: 90}, {x: 90, y: 90}];
 * drawPolygon(ctx, points, "#000000", "#ffff00", 2, true);
 */
export function drawPolygon(
	ctx: CanvasRenderingContext2D,
	points: Point[],
	strokeColor: string | null,
	fillColor: string | null,
	strokeWidth: number = 1,
	closed: boolean = true,
): void {
	if (points.length < 2) return;

	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);

	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(points[i].x, points[i].y);
	}

	if (closed) {
		ctx.closePath();
	}

	// Fill first (so stroke is on top)
	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fill();
	}

	// Then stroke
	if (strokeColor && strokeWidth > 0) {
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = strokeWidth;
		ctx.stroke();
	}
}

/**
 * Draw a rounded rectangle with quadratic curve corners.
 * Corner radius is automatically calculated (max 8px, limited by dimensions).
 * Fills first, then strokes. Automatically normalizes negative width/height.
 * Minimum size is 2x2 pixels.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Top-left X coordinate
 * @param y - Top-left Y coordinate
 * @param width - Rectangle width (can be negative)
 * @param height - Rectangle height (can be negative)
 * @param strokeColor - Stroke color (null for no stroke)
 * @param fillColor - Fill color (null for no fill)
 * @param strokeWidth - Stroke width in pixels (default: 1)
 * @returns void
 *
 * @example
 * // Draw a filled rounded rectangle with black outline
 * drawRoundedRectangle(ctx, 10, 10, 100, 50, "#000000", "#00ff00", 2);
 */
export function drawRoundedRectangle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	strokeColor: string | null,
	fillColor: string | null,
	strokeWidth: number = 1,
): void {
	// Normalize coordinates
	let normX = x;
	let normY = y;
	let normWidth = width;
	let normHeight = height;

	if (normWidth < 0) {
		normX += normWidth;
		normWidth = -normWidth;
	}
	if (normHeight < 0) {
		normY += normHeight;
		normHeight = -normHeight;
	}

	if (normWidth < 2 || normHeight < 2) return;

	// Calculate radius - similar to MS Paint, max 8px, but limited by half the smaller dimension
	const radius = Math.min(8, normWidth / 2, normHeight / 2);

	ctx.beginPath();
	ctx.moveTo(normX + radius, normY);
	ctx.lineTo(normX + normWidth - radius, normY);
	ctx.quadraticCurveTo(normX + normWidth, normY, normX + normWidth, normY + radius);
	ctx.lineTo(normX + normWidth, normY + normHeight - radius);
	ctx.quadraticCurveTo(normX + normWidth, normY + normHeight, normX + normWidth - radius, normY + normHeight);
	ctx.lineTo(normX + radius, normY + normHeight);
	ctx.quadraticCurveTo(normX, normY + normHeight, normX, normY + normHeight - radius);
	ctx.lineTo(normX, normY + radius);
	ctx.quadraticCurveTo(normX, normY, normX + radius, normY);
	ctx.closePath();

	// Fill first
	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fill();
	}

	// Then stroke
	if (strokeColor && strokeWidth > 0) {
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = strokeWidth;
		ctx.stroke();
	}
}

/**
 * Calculate fill and stroke colors for shapes based on fill style.
 * Used by shape tools (rectangle, ellipse, rounded rect, polygon) to determine
 * how to render based on the current fill style setting.
 *
 * Fill style behavior:
 * - "outline": Stroke only with draw color, no fill
 * - "fill": Fill only with secondary color, no stroke
 * - "both": Fill with secondary color, stroke with draw color
 *
 * @param fillStyle - Current fill style ("outline", "fill", or "both")
 * @param drawColor - Primary color for stroke (from left or right button)
 * @param secondaryColor - Secondary color for fill
 * @returns Object with fillColor and strokeColor (null means don't draw that part)
 *
 * @example
 * const { fillColor, strokeColor } = getShapeColors("both", "#000000", "#ffffff");
 * // Returns: { fillColor: "#ffffff", strokeColor: "#000000" }
 */
export function getShapeColors(
	fillStyle: "outline" | "fill" | "both",
	drawColor: string,
	secondaryColor: string,
): { fillColor: string | null; strokeColor: string | null } {
	const fillColor = fillStyle === "fill" || fillStyle === "both" ? secondaryColor : null;
	const strokeColor = fillStyle === "fill" ? null : drawColor;

	return { fillColor, strokeColor };
}
