/**
 * Drawing utility functions for canvas operations
 * Pure functions that perform drawing algorithms
 */

/**
 * Draw a line using Bresenham's algorithm for pixel-perfect lines
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

export type BrushShape = "circle" | "square";

export interface BrushPoint {
	x: number;
	y: number;
}

/**
 * Get brush shape points for a given size and shape
 */
export function getBrushPoints(size: number, shape: BrushShape = "circle"): BrushPoint[] {
	const points: BrushPoint[] = [];
	const radius = Math.floor(size / 2);

	if (shape === "circle") {
		for (let y = -radius; y <= radius; y++) {
			for (let x = -radius; x <= radius; x++) {
				if (x * x + y * y <= radius * radius) {
					points.push({ x, y });
				}
			}
		}
	} else if (shape === "square") {
		for (let y = -radius; y <= radius; y++) {
			for (let x = -radius; x <= radius; x++) {
				points.push({ x, y });
			}
		}
	}

	// Ensure at least one point (for size 1)
	if (points.length === 0) {
		points.push({ x: 0, y: 0 });
	}

	return points;
}

/**
 * Parse RGBA values from a color string
 */
export function getRgbaFromColor(color: string): [number, number, number, number] {
	// Handle rgba() format
	const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
	if (rgbaMatch) {
		return [
			parseInt(rgbaMatch[1], 10),
			parseInt(rgbaMatch[2], 10),
			parseInt(rgbaMatch[3], 10),
			rgbaMatch[4] !== undefined ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255,
		];
	}

	// Handle hex format
	const hexMatch = color.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
	if (hexMatch) {
		return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16), 255];
	}

	// Default to black
	return [0, 0, 0, 255];
}

/**
 * Flood fill algorithm (scanline-based)
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
 * Draw an ellipse using midpoint algorithm (aliased, pixel-perfect)
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
 * Draw a rectangle
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
 * Airbrush spray effect - random dots within a circular radius
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
			ctx.fillRect(Math.floor(x + rx), Math.floor(y + ry), 1, 1);
		}
	}
}

/**
 * Draw a quadratic bezier curve
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
 * Draw a polygon from an array of points
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
 * Draw a rounded rectangle
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
