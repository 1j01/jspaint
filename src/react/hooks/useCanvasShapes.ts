import { useCallback, useRef, RefObject } from "react";
import { useColors } from "../context/state/useColors";
import { useShapeSettings } from "../context/state/useShapeSettings";
import { TOOL_IDS, type ToolId } from "../context/state/types";
import { drawRectangle, drawEllipse, drawRoundedRectangle, getShapeColors } from "../utils/drawingUtils";

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
const SHAPE_TOOLS: readonly ToolId[] = [TOOL_IDS.LINE, TOOL_IDS.RECTANGLE, TOOL_IDS.ELLIPSE, TOOL_IDS.ROUNDED_RECTANGLE];

/**
 * Hook for handling shape drawing tools (line, rectangle, ellipse, rounded rectangle)
 *
 * Provides preview-and-commit workflow for shape tools:
 * - Saves canvas state before preview
 * - Shows live preview while dragging
 * - Commits final shape on mouse up
 * - Supports fill styles: outline, fill, both
 * - Configurable line width and colors
 *
 * Shape drawing workflow:
 * 1. Mouse down -> Save canvas state, record start point
 * 2. Mouse move -> Restore state, draw preview shape
 * 3. Mouse up -> Draw final shape, clear preview state
 *
 * @param {UseCanvasShapesProps} props - Hook configuration
 * @param {RefObject<HTMLCanvasElement | null>} props.canvasRef - Reference to the canvas element
 * @param {Function} props.getDrawColor - Function to get color based on mouse button
 * @returns {Object} Shape drawing functions and state
 *
 * @example
 * const shapes = useCanvasShapes({ canvasRef, getDrawColor });
 * // Check if tool is a shape
 * if (shapes.isShapeTool(toolId)) {
 *   // Start shape
 *   shapes.startShape(x, y, button, ctx);
 *   // Preview during drag
 *   shapes.previewShape(x, y, toolId, ctx);
 *   // Finalize on mouse up
 *   shapes.finalizeShape(x, y, toolId, ctx);
 * }
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
	const isShapeTool = useCallback((toolId: ToolId): boolean => {
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
		(x: number, y: number, toolId: ToolId, ctx: CanvasRenderingContext2D, shiftKey = false): void => {
			if (!drawingState.current.isDrawing || !drawingState.current.previewImageData) return;

			const { startX, startY, button, previewImageData } = drawingState.current;

			// Restore original state before drawing preview
			ctx.putImageData(previewImageData, 0, 0);

			let width = x - startX;
			let height = y - startY;

			// Constrain to square/circle when Shift is held (for rectangle, ellipse, rounded rectangle)
			if (shiftKey && toolId !== TOOL_IDS.LINE) {
				const size = Math.max(Math.abs(width), Math.abs(height));
				width = width >= 0 ? size : -size;
				height = height >= 0 ? size : -size;
			}
			const color = getDrawColor(button);
			const strokeWidth = lineWidth;

			// Determine fill and stroke colors based on fill style
			const { fillColor: shapeFillColor, strokeColor: shapeStrokeColor } = getShapeColors(
				fillStyle,
				color,
				secondaryColor,
			);

			switch (toolId) {
				case TOOL_IDS.LINE: {
					// Draw line from start to current
					let endX = x;
					let endY = y;
					// Constrain line to 45-degree angles when Shift is held
					if (shiftKey) {
						const dx = x - startX;
						const dy = y - startY;
						const angle = Math.atan2(dy, dx);
						const length = Math.sqrt(dx * dx + dy * dy);
						// Snap to nearest 45-degree increment (0, 45, 90, 135, 180, 225, 270, 315)
						const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
						endX = startX + length * Math.cos(snapAngle);
						endY = startY + length * Math.sin(snapAngle);
					}
					ctx.strokeStyle = color;
					ctx.lineWidth = strokeWidth;
					ctx.beginPath();
					ctx.moveTo(startX, startY);
					ctx.lineTo(endX, endY);
					ctx.stroke();
					break;
				}

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
		(x: number, y: number, toolId: ToolId, ctx: CanvasRenderingContext2D, shiftKey = false): void => {
			if (!drawingState.current.isDrawing || !drawingState.current.previewImageData) {
				drawingState.current.isDrawing = false;
				return;
			}

			const { startX, startY, button, previewImageData } = drawingState.current;

			// Restore and draw final shape
			ctx.putImageData(previewImageData, 0, 0);

			let width = x - startX;
			let height = y - startY;

			// Constrain to square/circle when Shift is held (for rectangle, ellipse, rounded rectangle)
			if (shiftKey && toolId !== TOOL_IDS.LINE) {
				const size = Math.max(Math.abs(width), Math.abs(height));
				width = width >= 0 ? size : -size;
				height = height >= 0 ? size : -size;
			}
			const color = getDrawColor(button);
			const strokeWidth = lineWidth;

			// Determine fill and stroke colors based on fill style
			const { fillColor: shapeFillColor, strokeColor: shapeStrokeColor } = getShapeColors(
				fillStyle,
				color,
				secondaryColor,
			);

			switch (toolId) {
				case TOOL_IDS.LINE: {
					let endX = x;
					let endY = y;
					// Constrain line to 45-degree angles when Shift is held
					if (shiftKey) {
						const dx = x - startX;
						const dy = y - startY;
						const angle = Math.atan2(dy, dx);
						const length = Math.sqrt(dx * dx + dy * dy);
						// Snap to nearest 45-degree increment (0, 45, 90, 135, 180, 225, 270, 315)
						const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
						endX = startX + length * Math.cos(snapAngle);
						endY = startY + length * Math.sin(snapAngle);
					}
					ctx.strokeStyle = color;
					ctx.lineWidth = strokeWidth;
					ctx.beginPath();
					ctx.moveTo(startX, startY);
					ctx.lineTo(endX, endY);
					ctx.stroke();
					break;
				}

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
