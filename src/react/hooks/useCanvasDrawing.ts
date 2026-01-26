import { RefObject, useCallback } from "react";
import { TOOL_IDS } from "../context/state/types";
import { useBrushSettings } from "../context/state/useBrushSettings";
import { useColors } from "../context/state/useColors";
import { useMagnification } from "../context/state/useMagnification";
import { useTool } from "../context/state/useTool";
import { bresenhamLine, BrushShape, floodFill, getBrushPoints, sprayAirbrush } from "../utils/drawingUtils";

/**
 * Hook for core canvas drawing operations
 *
 * Provides low-level drawing primitives and tool-specific actions:
 * - Point and line drawing with brush shapes
 * - Coordinate transformation (screen space to canvas space)
 * - Color selection based on mouse button
 * - Tool-specific size and shape configuration
 * - Fill (flood fill), erase, and airbrush operations
 * - Color picker (eyedropper)
 *
 * @param {RefObject<HTMLCanvasElement | null>} canvasRef - Reference to the canvas element
 * @returns {Object} Drawing functions and state
 *
 * @example
 * const drawing = useCanvasDrawing(canvasRef);
 * // Draw a point
 * drawing.drawPoint(ctx, 10, 10, '#ff0000', 5, 'circle');
 * // Draw a line
 * drawing.drawLine(ctx, 0, 0, 100, 100, '#0000ff', 2);
 */
export function useCanvasDrawing(canvasRef: RefObject<HTMLCanvasElement | null>) {
	const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useColors();
	const { selectedToolId } = useTool();
	const { brushSize, brushShape, pencilSize, eraserSize, airbrushSize } = useBrushSettings();
	const { magnification } = useMagnification();

	/**
	 * Get the current drawing color based on mouse button
	 * @param {number} button - Mouse button number (0=left, 2=right)
	 * @returns {string} Primary color for left button, secondary color for right button
	 */
	const getDrawColor = useCallback(
		(button: number): string => {
			return button === 0 ? primaryColor : secondaryColor;
		},
		[primaryColor, secondaryColor],
	);

	/**
	 * Get tool-specific brush size
	 * @returns {number} Size in pixels for the currently selected tool (pencil/brush/eraser/airbrush)
	 */
	const getToolSize = useCallback((): number => {
		switch (selectedToolId) {
			case TOOL_IDS.PENCIL:
				return pencilSize;
			case TOOL_IDS.BRUSH:
				return brushSize;
			case TOOL_IDS.ERASER:
				return eraserSize;
			case TOOL_IDS.AIRBRUSH:
				return airbrushSize;
			default:
				return 1;
		}
	}, [selectedToolId, pencilSize, brushSize, eraserSize, airbrushSize]);

	/**
	 * Get tool-specific brush shape
	 * @returns {BrushShape} Shape type: "circle" or "square"
	 */
	const getToolShape = useCallback((): BrushShape => {
		switch (selectedToolId) {
			case TOOL_IDS.BRUSH:
				return brushShape;
			case TOOL_IDS.ERASER:
				return "square"; // Eraser always uses square shape
			default:
				return "circle";
		}
	}, [selectedToolId, brushShape]);

	/**
	 * Get canvas coordinates from mouse event
	 * Accounts for CSS transform scaling (magnification)
	 * @param {Object} e - Event object with clientX and clientY properties
	 * @param {number} e.clientX - Client X coordinate
	 * @param {number} e.clientY - Client Y coordinate
	 * @returns {{x: number, y: number}} Canvas-space coordinates (floored to integers)
	 */
	const getCanvasCoords = useCallback(
		(e: { clientX: number; clientY: number }): { x: number; y: number } => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();

			// When magnification != 1, CSS transform: scale() is applied with transform-origin: top left
			// The click position is in screen space (scaled), so we divide by magnification to get canvas coords
			// When magnification != 1, CSS transform: scale() is applied with transform-origin: top left
			// The click position is in screen space (scaled), so we divide by magnification to get canvas coords
			const coords = {
				x: Math.floor((e.clientX - rect.left) / magnification),
				y: Math.floor((e.clientY - rect.top) / magnification),
			};
			console.log('[Debug] getCanvasCoords', { clientX: e.clientX, clientY: e.clientY, rectLeft: rect.left, rectTop: rect.top, magnification, res: coords });
			return coords;
		},
		[canvasRef, magnification],
	);

	/**
	 * Draw a single point or brush stamp
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @param {string} color - Fill color
	 * @param {number} size - Brush size in pixels
	 * @param {BrushShape} [shape="circle"] - Brush shape ("circle" or "square")
	 */
	const drawPoint = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			x: number,
			y: number,
			color: string,
			size: number,
			shape: BrushShape = "circle",
		): void => {
			// Ensure correct drawing mode
			ctx.globalCompositeOperation = 'source-over';
			ctx.globalAlpha = 1;
			ctx.fillStyle = color;

			console.log('[Debug] drawPoint', { x, y, color, size, shape, ctxFillStyle: ctx.fillStyle });

			if (size <= 1) {
				ctx.fillRect(x, y, 1, 1);
			} else {
				const points = getBrushPoints(size, shape);
				for (const point of points) {
					ctx.fillRect(x + point.x, y + point.y, 1, 1);
				}
			}
		},
		[],
	);

	/**
	 * Draw a line from one point to another
	 * Uses Bresenham's line algorithm for pixel-perfect straight lines
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x0 - Start X coordinate
	 * @param {number} y0 - Start Y coordinate
	 * @param {number} x1 - End X coordinate
	 * @param {number} y1 - End Y coordinate
	 * @param {string} color - Line color
	 * @param {number} size - Line thickness (brush size)
	 * @param {BrushShape} [shape="circle"] - Brush shape for thick lines
	 */
	const drawLine = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			x0: number,
			y0: number,
			x1: number,
			y1: number,
			color: string,
			size: number,
			shape: BrushShape = "circle",
		): void => {
			// Ensure correct drawing mode (some tools temporarily change these)
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = 1;
			ctx.fillStyle = color;

			if (size <= 1) {
				bresenhamLine(Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1), (x, y) => {
					ctx.fillRect(x, y, 1, 1);
				});
			} else {
				const points = getBrushPoints(size, shape);
				bresenhamLine(Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1), (x, y) => {
					for (const point of points) {
						ctx.fillRect(x + point.x, y + point.y, 1, 1);
					}
				});
			}
		},
		[],
	);

	/**
	 * Erase by drawing a line with the background color
	 * Always uses square brush shape for eraser tool
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x0 - Start X coordinate
	 * @param {number} y0 - Start Y coordinate
	 * @param {number} x1 - End X coordinate
	 * @param {number} y1 - End Y coordinate
	 * @param {number} size - Eraser size in pixels
	 */
	const erase = useCallback(
		(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, size: number): void => {
			drawLine(ctx, x0, y0, x1, y1, secondaryColor, size, "square");
		},
		[drawLine, secondaryColor],
	);

	/**
	 * Handle tool action for continuous drawing tools
	 * Dispatches the appropriate drawing operation based on selected tool
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x - Current X coordinate
	 * @param {number} y - Current Y coordinate
	 * @param {number} prevX - Previous X coordinate
	 * @param {number} prevY - Previous Y coordinate
	 * @param {number} button - Mouse button (0=left, 2=right)
	 */
	const handleToolAction = useCallback(
		(ctx: CanvasRenderingContext2D, x: number, y: number, prevX: number, prevY: number, button: number): void => {
			const size = getToolSize();
			const shape = getToolShape();
			const color = getDrawColor(button);

			switch (selectedToolId) {
				case TOOL_IDS.PENCIL:
					drawLine(ctx, prevX, prevY, x, y, color, size);
					break;

				case TOOL_IDS.BRUSH:
					drawLine(ctx, prevX, prevY, x, y, color, size, shape);
					break;

				case TOOL_IDS.ERASER:
					erase(ctx, prevX, prevY, x, y, size);
					break;

				case TOOL_IDS.AIRBRUSH:
					// Spray on move to match jQuery behavior (sprays on both move AND interval)
					// This creates denser trails when moving fast
					sprayAirbrush(ctx, x, y, color, size);
					break;

				default:
					// Default to pencil behavior for unimplemented tools
					drawLine(ctx, prevX, prevY, x, y, color, 1);
					break;
			}
		},
		[selectedToolId, getToolSize, getToolShape, getDrawColor, drawLine, erase],
	);

	/**
	 * Pick a color from the canvas at the specified coordinates
	 * Sets primary color on left-click, secondary color on right-click
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x - X coordinate to sample
	 * @param {number} y - Y coordinate to sample
	 * @param {number} button - Mouse button (0=primary, 2=secondary)
	 */
	const pickColor = useCallback(
		(ctx: CanvasRenderingContext2D, x: number, y: number, button: number): void => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
				const imageData = ctx.getImageData(x, y, 1, 1);
				const [r, g, b, a] = imageData.data;
				const pickedColor = `rgba(${r},${g},${b},${a / 255})`;
				if (button === 0) {
					setPrimaryColor(pickedColor);
				} else {
					setSecondaryColor(pickedColor);
				}
			}
		},
		[canvasRef, setPrimaryColor, setSecondaryColor],
	);

	/**
	 * Handle fill tool (flood fill/bucket fill)
	 * Fills a connected region with the selected color
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x - X coordinate of fill start point
	 * @param {number} y - Y coordinate of fill start point
	 * @param {number} button - Mouse button (0=primary color, 2=secondary color)
	 */
	const handleFill = useCallback(
		(ctx: CanvasRenderingContext2D, x: number, y: number, button: number): void => {
			const color = getDrawColor(button);
			floodFill(ctx, x, y, color);
		},
		[getDrawColor],
	);

	/**
	 * Spray airbrush effect at a specific point
	 * Creates a randomized spray of pixels within the airbrush radius
	 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
	 * @param {number} x - X coordinate of spray center
	 * @param {number} y - Y coordinate of spray center
	 * @param {string} color - Spray color
	 * @param {number} size - Airbrush radius in pixels
	 */
	const spray = useCallback(
		(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number): void => {
			sprayAirbrush(ctx, x, y, color, size);
		},
		[],
	);

	return {
		getDrawColor,
		getToolSize,
		getToolShape,
		getCanvasCoords,
		drawPoint,
		drawLine,
		erase,
		handleToolAction,
		pickColor,
		handleFill,
		sprayAirbrush: spray,
		primaryColor,
		secondaryColor,
	};
}
