import React, { useEffect, useRef, useCallback } from "react";
import { useApp, useColors, useTool, useHistory, TOOL_IDS } from "../context/AppContext";

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
 * Canvas component for drawing
 */
export function Canvas({ className = "" }) {
	const { canvasRef } = useApp();
	const { primaryColor, secondaryColor } = useColors();
	const { selectedToolId, brushSize, pencilSize, eraserSize } = useTool();
	const { saveState } = useHistory();

	// Track drawing state locally for performance
	const drawingState = useRef({
		isDrawing: false,
		lastX: 0,
		lastY: 0,
		button: 0, // 0 = left, 2 = right
	});

	// Initialize canvas with white background
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
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

			const ctx = canvas.getContext("2d");
			const { x, y } = getCanvasCoords(e);

			// Save state for undo before drawing
			saveState();

			drawingState.current = {
				isDrawing: true,
				lastX: x,
				lastY: y,
				button: e.button,
			};

			// Draw initial point
			const size = getToolSize();
			const color = getDrawColor(e.button);

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
				default:
					drawPoint(ctx, x, y, color, 1);
					break;
			}

			// Capture pointer for smooth drawing even outside canvas
			canvas.setPointerCapture(e.pointerId);
		},
		[canvasRef, getCanvasCoords, saveState, getToolSize, getDrawColor, selectedToolId, drawPoint, secondaryColor],
	);

	const handlePointerMove = useCallback(
		(e) => {
			if (!drawingState.current.isDrawing) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			const { x, y } = getCanvasCoords(e);
			const { lastX, lastY, button } = drawingState.current;

			handleToolAction(ctx, x, y, lastX, lastY, button);

			drawingState.current.lastX = x;
			drawingState.current.lastY = y;
		},
		[canvasRef, getCanvasCoords, handleToolAction],
	);

	const handlePointerUp = useCallback(
		(e) => {
			drawingState.current.isDrawing = false;

			const canvas = canvasRef.current;
			if (canvas) {
				canvas.releasePointerCapture(e.pointerId);
			}
		},
		[canvasRef],
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
