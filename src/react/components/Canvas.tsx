import { useCallback, useEffect, useRef } from "react";
import { TOOL_IDS, useApp, useColors, useHistory, useTool } from "../context/AppContext";

/**
 * Draw a line using Bresenham's algorithm for pixel-perfect lines
 */
function bresenhamLine(x0, y0, x1, y1, callback) {
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

	while (true) {
		callback(x0, y0);

		if (x0 === x1 && y0 === y1) break;

		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			x0 += sx;
		}
		if (e2 < dx) {
			err += dx;
			y0 += sy;
		}
	}
}

/**
 * Get brush shape points for a given size and shape
 */
function getBrushPoints(size, shape = "circle") {
	const points = [];
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
function getRgbaFromColor(color: string): [number, number, number, number] {
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
		return [
			parseInt(hexMatch[1], 16),
			parseInt(hexMatch[2], 16),
			parseInt(hexMatch[3], 16),
			255,
		];
	}

	// Default to black
	return [0, 0, 0, 255];
}

/**
 * Flood fill algorithm (scanline-based)
 */
function floodFill(
	ctx: CanvasRenderingContext2D,
	startX: number,
	startY: number,
	fillColor: string,
) {
	const canvas = ctx.canvas;
	const width = canvas.width;
	const height = canvas.height;

	startX = Math.max(0, Math.min(Math.floor(startX), width - 1));
	startY = Math.max(0, Math.min(Math.floor(startY), height - 1));

	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;

	// Get start color
	const startPos = (startY * width + startX) * 4;
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

	const stack: [number, number][] = [[startX, startY]];

	const shouldFill = (pos: number): boolean => {
		return (
			Math.abs(data[pos] - startR) <= tolerance &&
			Math.abs(data[pos + 1] - startG) <= tolerance &&
			Math.abs(data[pos + 2] - startB) <= tolerance &&
			Math.abs(data[pos + 3] - startA) <= tolerance
		);
	};

	const doFill = (pos: number) => {
		data[pos] = fillR;
		data[pos + 1] = fillG;
		data[pos + 2] = fillB;
		data[pos + 3] = fillA;
	};

	while (stack.length > 0) {
		const [x, y] = stack.pop()!;
		let pixelPos = (y * width + x) * 4;

		// Go up to find the top of the fill area
		let currentY = y;
		while (currentY >= 0 && shouldFill((currentY * width + x) * 4)) {
			currentY--;
		}
		currentY++;
		pixelPos = (currentY * width + x) * 4;

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
function drawEllipse(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	strokeColor: string,
	fillColor: string | null,
	strokeWidth: number = 1,
) {
	// Normalize coordinates
	if (width < 0) {
		x += width;
		width = -width;
	}
	if (height < 0) {
		y += height;
		height = -height;
	}

	if (width < 2 || height < 2) return;

	const cx = x + width / 2;
	const cy = y + height / 2;
	const rx = width / 2;
	const ry = height / 2;

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
function drawRectangle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	strokeColor: string,
	fillColor: string | null,
	strokeWidth: number = 1,
) {
	// Normalize coordinates
	if (width < 0) {
		x += width;
		width = -width;
	}
	if (height < 0) {
		y += height;
		height = -height;
	}

	// Fill first
	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fillRect(x, y, width, height);
	}

	// Stroke - draw as filled rectangles for pixel-perfect rendering
	if (strokeColor && strokeWidth > 0) {
		ctx.fillStyle = strokeColor;
		// Top
		ctx.fillRect(x, y, width, strokeWidth);
		// Bottom
		ctx.fillRect(x, y + height - strokeWidth, width, strokeWidth);
		// Left
		ctx.fillRect(x, y, strokeWidth, height);
		// Right
		ctx.fillRect(x + width - strokeWidth, y, strokeWidth, height);
	}
}

/**
 * Canvas component for drawing
 */
export function Canvas({ className = "" }) {
	const { canvasRef } = useApp();
	const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useColors();
	const { selectedToolId, brushSize, pencilSize, eraserSize } = useTool();
	const { saveState } = useHistory();

	// Track drawing state locally for performance
	const drawingState = useRef({
		isDrawing: false,
		lastX: 0,
		lastY: 0,
		button: 0, // 0 = left, 2 = right
		// Shape preview state
		startX: 0,
		startY: 0,
		previewImageData: null as ImageData | null,
	});

	// Initialize canvas with white background
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, [canvasRef]);

	// Get the current drawing color based on mouse button
	const getDrawColor = useCallback(
		(button) => {
			return button === 0 ? primaryColor : secondaryColor;
		},
		[primaryColor, secondaryColor],
	);

	// Get tool-specific brush size
	const getToolSize = useCallback(() => {
		switch (selectedToolId) {
			case TOOL_IDS.PENCIL:
				return pencilSize;
			case TOOL_IDS.BRUSH:
				return brushSize;
			case TOOL_IDS.ERASER:
				return eraserSize;
			default:
				return 1;
		}
	}, [selectedToolId, pencilSize, brushSize, eraserSize]);

	// Draw a single point or brush stamp
	const drawPoint = useCallback((ctx, x, y, color, size) => {
		ctx.fillStyle = color;

		if (size <= 1) {
			ctx.fillRect(x, y, 1, 1);
		} else {
			const points = getBrushPoints(size, "circle");
			for (const point of points) {
				ctx.fillRect(x + point.x, y + point.y, 1, 1);
			}
		}
	}, []);

	// Draw a line from one point to another
	const drawLine = useCallback((ctx, x0, y0, x1, y1, color, size) => {
		ctx.fillStyle = color;

		if (size <= 1) {
			bresenhamLine(Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1), (x, y) => {
				ctx.fillRect(x, y, 1, 1);
			});
		} else {
			const points = getBrushPoints(size, "circle");
			bresenhamLine(Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1), (x, y) => {
				for (const point of points) {
					ctx.fillRect(x + point.x, y + point.y, 1, 1);
				}
			});
		}
	}, []);

	// Erase (draw with background color or white)
	const erase = useCallback(
		(ctx, x0, y0, x1, y1, size) => {
			drawLine(ctx, x0, y0, x1, y1, secondaryColor, size);
		},
		[drawLine, secondaryColor],
	);

	// Get canvas coordinates from mouse event
	const getCanvasCoords = useCallback(
		(e) => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;

			return {
				x: Math.floor((e.clientX - rect.left) * scaleX),
				y: Math.floor((e.clientY - rect.top) * scaleY),
			};
		},
		[canvasRef],
	);

	// Handle tool action
	const handleToolAction = useCallback(
		(ctx, x, y, prevX, prevY, button) => {
			const size = getToolSize();
			const color = getDrawColor(button);

			switch (selectedToolId) {
				case TOOL_IDS.PENCIL:
					drawLine(ctx, prevX, prevY, x, y, color, 1);
					break;

				case TOOL_IDS.BRUSH:
					drawLine(ctx, prevX, prevY, x, y, color, size);
					break;

				case TOOL_IDS.ERASER:
					erase(ctx, prevX, prevY, x, y, size);
					break;

				case TOOL_IDS.PICK_COLOR: {
					// Get color at point
					const imageData = ctx.getImageData(x, y, 1, 1);
					const [r, g, b, a] = imageData.data;
					const pickedColor = `rgba(${r},${g},${b},${a / 255})`;
					// TODO: Update color in context
					console.log("Picked color:", pickedColor);
					break;
				}

				default:
					// Default to pencil behavior for unimplemented tools
					drawLine(ctx, prevX, prevY, x, y, color, 1);
					break;
			}
		},
		[selectedToolId, getToolSize, getDrawColor, drawLine, erase],
	);

	// Mouse event handlers
	const handlePointerDown = useCallback(
		(e) => {
			e.preventDefault();
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			const { x, y } = getCanvasCoords(e);

			// Determine if this is a shape tool that needs preview
			const isShapeTool = [
				TOOL_IDS.LINE,
				TOOL_IDS.RECTANGLE,
				TOOL_IDS.ELLIPSE,
				TOOL_IDS.ROUNDED_RECTANGLE,
			].includes(selectedToolId);

			// Save state for undo before drawing
			saveState();

			// Save starting point and canvas state for shape tools
			const previewImageData = isShapeTool
				? ctx.getImageData(0, 0, canvas.width, canvas.height)
				: null;

			drawingState.current = {
				isDrawing: true,
				lastX: x,
				lastY: y,
				button: e.button,
				startX: x,
				startY: y,
				previewImageData,
			};

			const color = getDrawColor(e.button);
			const size = getToolSize();

			switch (selectedToolId) {
				case TOOL_IDS.PENCIL:
					drawPoint(ctx, x, y, color, 1);
					break;

				case TOOL_IDS.BRUSH:
					drawPoint(ctx, x, y, color, size);
					break;

				case TOOL_IDS.ERASER:
					drawPoint(ctx, x, y, secondaryColor, size);
					break;

				case TOOL_IDS.FILL:
					// Fill is immediate - click to fill
					floodFill(ctx, x, y, color);
					break;

				case TOOL_IDS.PICK_COLOR: {
					// Pick color is immediate
					if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
						const imageData = ctx.getImageData(x, y, 1, 1);
						const [r, g, b, a] = imageData.data;
						const pickedColor = `rgba(${r},${g},${b},${a / 255})`;
						if (e.button === 0) {
							setPrimaryColor(pickedColor);
						} else {
							setSecondaryColor(pickedColor);
						}
					}
					break;
				}

				case TOOL_IDS.LINE:
				case TOOL_IDS.RECTANGLE:
				case TOOL_IDS.ELLIPSE:
				case TOOL_IDS.ROUNDED_RECTANGLE:
					// Shape tools - just record start point, drawing happens on move/up
					break;

				default:
					// Default to pencil behavior
					drawPoint(ctx, x, y, color, 1);
					break;
			}

			// Capture pointer for smooth drawing even outside canvas
			canvas.setPointerCapture(e.pointerId);
		},
		[
			canvasRef,
			getCanvasCoords,
			saveState,
			getToolSize,
			getDrawColor,
			selectedToolId,
			drawPoint,
			secondaryColor,
			setPrimaryColor,
			setSecondaryColor,
		],
	);

	const handlePointerMove = useCallback(
		(e) => {
			if (!drawingState.current.isDrawing) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			const { x, y } = getCanvasCoords(e);
			const { lastX, lastY, button, startX, startY, previewImageData } = drawingState.current;
			const color = getDrawColor(button);

			// Check if this is a shape tool
			const isShapeTool = [
				TOOL_IDS.LINE,
				TOOL_IDS.RECTANGLE,
				TOOL_IDS.ELLIPSE,
				TOOL_IDS.ROUNDED_RECTANGLE,
			].includes(selectedToolId);

			if (isShapeTool && previewImageData) {
				// Restore original state before drawing preview
				ctx.putImageData(previewImageData, 0, 0);

				const width = x - startX;
				const height = y - startY;
				const strokeWidth = 1; // Default stroke width

				switch (selectedToolId) {
					case TOOL_IDS.LINE:
						// Draw line from start to current
						ctx.strokeStyle = color;
						ctx.lineWidth = strokeWidth;
						ctx.beginPath();
						ctx.moveTo(startX, startY);
						ctx.lineTo(x, y);
						ctx.stroke();
						break;

					case TOOL_IDS.RECTANGLE:
						drawRectangle(ctx, startX, startY, width, height, color, null, strokeWidth);
						break;

					case TOOL_IDS.ELLIPSE:
						drawEllipse(ctx, startX, startY, width, height, color, null, strokeWidth);
						break;

					case TOOL_IDS.ROUNDED_RECTANGLE:
						// Use rectangle for now (rounded rect implementation similar)
						drawRectangle(ctx, startX, startY, width, height, color, null, strokeWidth);
						break;
				}
			} else {
				// Regular drawing tools
				handleToolAction(ctx, x, y, lastX, lastY, button);
			}

			drawingState.current.lastX = x;
			drawingState.current.lastY = y;
		},
		[canvasRef, getCanvasCoords, handleToolAction, selectedToolId, getDrawColor],
	);

	const handlePointerUp = useCallback(
		(e) => {
			const canvas = canvasRef.current;
			const { startX, startY, button, previewImageData } = drawingState.current;

			if (canvas && drawingState.current.isDrawing) {
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				const { x, y } = getCanvasCoords(e);
				const color = getDrawColor(button);

				// Finalize shape drawing
				const isShapeTool = [
					TOOL_IDS.LINE,
					TOOL_IDS.RECTANGLE,
					TOOL_IDS.ELLIPSE,
					TOOL_IDS.ROUNDED_RECTANGLE,
				].includes(selectedToolId);

				if (isShapeTool && previewImageData) {
					// Restore and draw final shape
					ctx.putImageData(previewImageData, 0, 0);

					const width = x - startX;
					const height = y - startY;
					const strokeWidth = 1;

					switch (selectedToolId) {
						case TOOL_IDS.LINE:
							ctx.strokeStyle = color;
							ctx.lineWidth = strokeWidth;
							ctx.beginPath();
							ctx.moveTo(startX, startY);
							ctx.lineTo(x, y);
							ctx.stroke();
							break;

						case TOOL_IDS.RECTANGLE:
							drawRectangle(ctx, startX, startY, width, height, color, null, strokeWidth);
							break;

						case TOOL_IDS.ELLIPSE:
							drawEllipse(ctx, startX, startY, width, height, color, null, strokeWidth);
							break;

						case TOOL_IDS.ROUNDED_RECTANGLE:
							drawRectangle(ctx, startX, startY, width, height, color, null, strokeWidth);
							break;
					}
				}

				canvas.releasePointerCapture(e.pointerId);
			}

			drawingState.current.isDrawing = false;
			drawingState.current.previewImageData = null;
		},
		[canvasRef, getCanvasCoords, selectedToolId, getDrawColor],
	);

	// Prevent context menu on right-click
	const handleContextMenu = useCallback((e) => {
		e.preventDefault();
	}, []);

	// Get cursor style based on tool
	const getCursorStyle = useCallback(() => {
		switch (selectedToolId) {
			case TOOL_IDS.PENCIL:
				return "crosshair";
			case TOOL_IDS.BRUSH:
				return "crosshair";
			case TOOL_IDS.ERASER:
				return "crosshair";
			case TOOL_IDS.FILL:
				return "crosshair";
			case TOOL_IDS.PICK_COLOR:
				return "crosshair";
			case TOOL_IDS.MAGNIFIER:
				return "zoom-in";
			case TOOL_IDS.TEXT:
				return "text";
			default:
				return "crosshair";
		}
	}, [selectedToolId]);

	return (
		<canvas
			ref={canvasRef}
			className={`main-canvas ${className}`}
			width={480}
			height={320}
			style={{ cursor: getCursorStyle() }}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
			onContextMenu={handleContextMenu}
			aria-label="Drawing canvas"
		/>
	);
}

export default Canvas;
