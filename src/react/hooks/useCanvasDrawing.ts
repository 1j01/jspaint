import { useCallback, RefObject } from "react";
import { useBrushSettings } from "../context/state/useBrushSettings";
import { useColors } from "../context/state/useColors";
import { useTool } from "../context/state/useTool";
import { useMagnification } from "../context/state/useMagnification";
import { TOOL_IDS } from "../context/state/types";
import { bresenhamLine, getBrushPoints, sprayAirbrush, floodFill, BrushShape } from "../utils/drawingUtils";

/**
 * Hook for core canvas drawing operations
 */
export function useCanvasDrawing(canvasRef: RefObject<HTMLCanvasElement | null>) {
	const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useColors();
	const { selectedToolId } = useTool();
	const { brushSize, brushShape, pencilSize, eraserSize, airbrushSize } = useBrushSettings();
	const { magnification } = useMagnification();

	// Get the current drawing color based on mouse button
	const getDrawColor = useCallback(
		(button: number): string => {
			return button === 0 ? primaryColor : secondaryColor;
		},
		[primaryColor, secondaryColor],
	);

	// Get tool-specific brush size
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

	// Get tool-specific brush shape
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

	// Get canvas coordinates from mouse event
	// Accounts for CSS transform scaling (magnification)
	const getCanvasCoords = useCallback(
		(e: { clientX: number; clientY: number }): { x: number; y: number } => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };

			const rect = canvas.getBoundingClientRect();

			// When magnification > 1, CSS transform: scale() is applied with transform-origin: top left
			// The click position is in screen space (scaled), so we divide by magnification to get canvas coords
			return {
				x: Math.floor((e.clientX - rect.left) / magnification),
				y: Math.floor((e.clientY - rect.top) / magnification),
			};
		},
		[canvasRef, magnification],
	);

	// Draw a single point or brush stamp
	const drawPoint = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			x: number,
			y: number,
			color: string,
			size: number,
			shape: BrushShape = "circle",
		): void => {
			ctx.fillStyle = color;

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

	// Draw a line from one point to another
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

	// Erase (draw with background color) - uses square shape
	const erase = useCallback(
		(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, size: number): void => {
			drawLine(ctx, x0, y0, x1, y1, secondaryColor, size, "square");
		},
		[drawLine, secondaryColor],
	);

	// Handle tool action for continuous drawing tools
	const handleToolAction = useCallback(
		(ctx: CanvasRenderingContext2D, x: number, y: number, prevX: number, prevY: number, button: number): void => {
			const size = getToolSize();
			const shape = getToolShape();
			const color = getDrawColor(button);

			switch (selectedToolId) {
				case TOOL_IDS.PENCIL:
					drawLine(ctx, prevX, prevY, x, y, color, 1);
					break;

				case TOOL_IDS.BRUSH:
					drawLine(ctx, prevX, prevY, x, y, color, size, shape);
					break;

				case TOOL_IDS.ERASER:
					erase(ctx, prevX, prevY, x, y, size);
					break;

				case TOOL_IDS.AIRBRUSH:
					// Spray at current position (continuous effect)
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

	// Handle color picker
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

	// Handle fill tool
	const handleFill = useCallback(
		(ctx: CanvasRenderingContext2D, x: number, y: number, button: number): void => {
			const color = getDrawColor(button);
			floodFill(ctx, x, y, color);
		},
		[getDrawColor],
	);

	// Spray airbrush at a specific point
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
