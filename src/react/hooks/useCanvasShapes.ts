import { useCallback, useRef, RefObject } from "react";
import { useColors } from "../context/state/useColors";
import { useShapeSettings } from "../context/state/useShapeSettings";
import { TOOL_IDS } from "../context/state/types";
import { drawRectangle, drawEllipse, drawRoundedRectangle } from "../utils/drawingUtils";

export interface ShapeDrawingState {
	isDrawing: boolean;
	lastX: number;
	lastY: number;
	button: number;
	startX: number;
	startY: number;
	previewImageData: ImageData | null;
}

interface UseCanvasShapesProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	getDrawColor: (button: number) => string;
}

// Shape tool IDs
const SHAPE_TOOLS = [TOOL_IDS.LINE, TOOL_IDS.RECTANGLE, TOOL_IDS.ELLIPSE, TOOL_IDS.ROUNDED_RECTANGLE];

/**
 * Hook for handling shape drawing tools (line, rectangle, ellipse, rounded rectangle)
 */
export function useCanvasShapes({ canvasRef, getDrawColor }: UseCanvasShapesProps) {
	const { secondaryColor } = useColors();
	const { fillStyle, lineWidth } = useShapeSettings();

	// Drawing state
	const drawingState = useRef<ShapeDrawingState>({
		isDrawing: false,
		lastX: 0,
		lastY: 0,
		button: 0,
		startX: 0,
		startY: 0,
		previewImageData: null,
	});

	// Check if a tool is a shape tool
	const isShapeTool = useCallback((toolId: string): boolean => {
		return SHAPE_TOOLS.includes(toolId);
	}, []);

	// Start shape drawing
	const startShape = useCallback(
		(x: number, y: number, button: number, ctx: CanvasRenderingContext2D): void => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			// Save canvas state for preview
			const previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			drawingState.current = {
				isDrawing: true,
				lastX: x,
				lastY: y,
				button,
				startX: x,
				startY: y,
				previewImageData,
			};
		},
		[canvasRef],
	);

	// Draw shape preview
	const previewShape = useCallback(
		(x: number, y: number, toolId: string, ctx: CanvasRenderingContext2D): void => {
			if (!drawingState.current.isDrawing || !drawingState.current.previewImageData) return;

			const { startX, startY, button, previewImageData } = drawingState.current;

			// Restore original state before drawing preview
			ctx.putImageData(previewImageData, 0, 0);

			const width = x - startX;
			const height = y - startY;
			const color = getDrawColor(button);
			const strokeWidth = lineWidth;

			// Determine fill and stroke colors based on fill style
			const shapeFillColor = fillStyle === "fill" || fillStyle === "both" ? secondaryColor : null;
			const shapeStrokeColor = fillStyle === "fill" ? null : color;

			switch (toolId) {
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
					drawRectangle(ctx, startX, startY, width, height, shapeStrokeColor, shapeFillColor, strokeWidth);
					break;

				case TOOL_IDS.ELLIPSE:
					drawEllipse(ctx, startX, startY, width, height, shapeStrokeColor, shapeFillColor, strokeWidth);
					break;

				case TOOL_IDS.ROUNDED_RECTANGLE:
					drawRoundedRectangle(
						ctx,
						startX,
						startY,
						width,
						height,
						shapeStrokeColor,
						shapeFillColor,
						strokeWidth,
					);
					break;
			}

			drawingState.current.lastX = x;
			drawingState.current.lastY = y;
		},
		[getDrawColor, fillStyle, lineWidth, secondaryColor],
	);

	// Finalize shape drawing
	const finalizeShape = useCallback(
		(x: number, y: number, toolId: string, ctx: CanvasRenderingContext2D): void => {
			if (!drawingState.current.isDrawing || !drawingState.current.previewImageData) {
				drawingState.current.isDrawing = false;
				return;
			}

			const { startX, startY, button, previewImageData } = drawingState.current;

			// Restore and draw final shape
			ctx.putImageData(previewImageData, 0, 0);

			const width = x - startX;
			const height = y - startY;
			const color = getDrawColor(button);
			const strokeWidth = lineWidth;

			// Determine fill and stroke colors based on fill style
			const shapeFillColor = fillStyle === "fill" || fillStyle === "both" ? secondaryColor : null;
			const shapeStrokeColor = fillStyle === "fill" ? null : color;

			switch (toolId) {
				case TOOL_IDS.LINE:
					ctx.strokeStyle = color;
					ctx.lineWidth = strokeWidth;
					ctx.beginPath();
					ctx.moveTo(startX, startY);
					ctx.lineTo(x, y);
					ctx.stroke();
					break;

				case TOOL_IDS.RECTANGLE:
					drawRectangle(ctx, startX, startY, width, height, shapeStrokeColor, shapeFillColor, strokeWidth);
					break;

				case TOOL_IDS.ELLIPSE:
					drawEllipse(ctx, startX, startY, width, height, shapeStrokeColor, shapeFillColor, strokeWidth);
					break;

				case TOOL_IDS.ROUNDED_RECTANGLE:
					drawRoundedRectangle(
						ctx,
						startX,
						startY,
						width,
						height,
						shapeStrokeColor,
						shapeFillColor,
						strokeWidth,
					);
					break;
			}

			drawingState.current.isDrawing = false;
			drawingState.current.previewImageData = null;
		},
		[getDrawColor, fillStyle, lineWidth, secondaryColor],
	);

	// Check if currently drawing a shape
	const isDrawing = useCallback((): boolean => {
		return drawingState.current.isDrawing;
	}, []);

	// Get current drawing state
	const getDrawingState = useCallback((): ShapeDrawingState => {
		return drawingState.current;
	}, []);

	return {
		drawingState,
		isShapeTool,
		startShape,
		previewShape,
		finalizeShape,
		isDrawing,
		getDrawingState,
		fillStyle,
		lineWidth,
	};
}
