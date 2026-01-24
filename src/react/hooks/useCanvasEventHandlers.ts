/**
 * Canvas Event Handlers Hook
 *
 * Manages all pointer and input event handlers for the canvas.
 * Handles tool-specific interactions, drawing operations, and history saving.
 */

import { RefObject, useCallback } from "react";
import { TOOL_IDS } from "../context/state/types";
import { MAGNIFICATION_LEVELS, TOOL_NAMES } from "../utils/canvasHelpers";
import type { useCanvasDrawing } from "./useCanvasDrawing";
import type { useCanvasSelection } from "./useCanvasSelection";
import type { useCanvasTextBox } from "./useCanvasTextBox";
import type { useCanvasShapes } from "./useCanvasShapes";
import type { useCanvasCurvePolygon } from "./useCanvasCurvePolygon";

interface UseCanvasEventHandlersParams {
	canvasRef: RefObject<HTMLCanvasElement>;
	selectedToolId: string;
	drawing: ReturnType<typeof useCanvasDrawing>;
	selectionHook: ReturnType<typeof useCanvasSelection>;
	textBoxHook: ReturnType<typeof useCanvasTextBox>;
	shapes: ReturnType<typeof useCanvasShapes>;
	curvePolygon: ReturnType<typeof useCanvasCurvePolygon>;
	setCursorPosition: (pos: { x: number; y: number } | null) => void;
	saveHistoryState: (operationName: string) => void;
	magnification: number;
	setMagnification: (mag: number) => void;
}

export interface CanvasEventHandlers {
	handlePointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
	handlePointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
	handlePointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
	handlePointerLeave: () => void;
	handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleTextKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	handleTextBlur: () => void;
	handleContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Hook that provides all canvas event handlers.
 *
 * @param params - Configuration object with refs, hooks, and state setters
 * @returns Object containing all event handler functions
 */
export function useCanvasEventHandlers(params: UseCanvasEventHandlersParams): CanvasEventHandlers {
	const {
		canvasRef,
		selectedToolId,
		drawing,
		selectionHook,
		textBoxHook,
		shapes,
		curvePolygon,
		setCursorPosition,
		saveHistoryState,
		magnification,
		setMagnification,
	} = params;

	/**
	 * Pointer down event handler - initiates drawing operations.
	 *
	 * Handles the start of all drawing operations based on the currently selected tool.
	 * Tool dispatch:
	 * - PENCIL/BRUSH/ERASER: Draw point and enable continuous drawing
	 * - FILL: Flood fill at point
	 * - PICK_COLOR: Sample color at point
	 * - SELECT/FREE_FORM_SELECT: Start selection region
	 * - TEXT: Commit existing text box and start new one
	 * - MAGNIFIER: Zoom in (left) or out (right)
	 * - CURVE/POLYGON: Add point to multi-click sequence
	 * - AIRBRUSH: Enable continuous spray effect
	 * - LINE/RECTANGLE/ELLIPSE/ROUNDED_RECTANGLE: Start shape preview
	 */
	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			// Skip if clicking on handles (selection handles, canvas resize handles, etc.)
			const target = e.target as HTMLElement;
			if (
				target.classList.contains('selection-handle') ||
				target.classList.contains('canvas-resize-handle') ||
				target.classList.contains('canvas-resize-grab-region') ||
				target.classList.contains('resize-ghost')
			) {
				return;
			}

			e.preventDefault();
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			const { x, y } = drawing.getCanvasCoords(e);
			const color = drawing.getDrawColor(e.button);
			const size = drawing.getToolSize();

			// History is saved on pointer UP (after operation completes), not down

			switch (selectedToolId) {
				case TOOL_IDS.PENCIL:
					drawing.drawPoint(ctx, x, y, color, 1);
					shapes.drawingState.current = {
						...shapes.drawingState.current,
						isDrawing: true,
						lastX: x,
						lastY: y,
						button: e.button,
					};
					break;

				case TOOL_IDS.BRUSH: {
					const brushShapeType = drawing.getToolShape();
					drawing.drawPoint(ctx, x, y, color, size, brushShapeType);
					shapes.drawingState.current = {
						...shapes.drawingState.current,
						isDrawing: true,
						lastX: x,
						lastY: y,
						button: e.button,
					};
					break;
				}

				case TOOL_IDS.ERASER:
					drawing.drawPoint(ctx, x, y, drawing.secondaryColor, size, "square");
					shapes.drawingState.current = {
						...shapes.drawingState.current,
						isDrawing: true,
						lastX: x,
						lastY: y,
						button: e.button,
					};
					break;

				case TOOL_IDS.FILL:
					drawing.handleFill(ctx, x, y, e.button);
					break;

				case TOOL_IDS.PICK_COLOR:
					drawing.pickColor(ctx, x, y, e.button);
					break;

				case TOOL_IDS.SELECT:
					selectionHook.startRectangularSelection(x, y, ctx);
					break;

				case TOOL_IDS.FREE_FORM_SELECT:
					selectionHook.startFreeFormSelection(x, y, ctx);
					break;

				case TOOL_IDS.TEXT:
					if (textBoxHook.textBox?.isActive) {
						// Save history if there's actual text to commit
						if (textBoxHook.textBox.text.trim()) {
							saveHistoryState("Text");
						}
						textBoxHook.commitTextBox();
					}
					textBoxHook.startTextBox(x, y);
					break;

				case TOOL_IDS.MAGNIFIER: {
					const currentIndex = MAGNIFICATION_LEVELS.indexOf(magnification);
					if (e.button === 0) {
						const nextIndex = Math.min(currentIndex + 1, MAGNIFICATION_LEVELS.length - 1);
						setMagnification(MAGNIFICATION_LEVELS[nextIndex]);
					} else {
						const nextIndex = Math.max(currentIndex - 1, 0);
						setMagnification(MAGNIFICATION_LEVELS[nextIndex]);
					}
					break;
				}

				case TOOL_IDS.CURVE:
					curvePolygon.handleCurveClick(x, y, e.button, ctx);
					break;

				case TOOL_IDS.POLYGON:
					curvePolygon.handlePolygonClick(x, y, e.button, ctx);
					break;

				case TOOL_IDS.AIRBRUSH:
					shapes.drawingState.current = {
						...shapes.drawingState.current,
						isDrawing: true,
						lastX: x,
						lastY: y,
						button: e.button,
					};
					break;

				case TOOL_IDS.LINE:
				case TOOL_IDS.RECTANGLE:
				case TOOL_IDS.ELLIPSE:
				case TOOL_IDS.ROUNDED_RECTANGLE:
					shapes.startShape(x, y, e.button, ctx);
					break;

				default:
					// For any other tool, just draw a point
					drawing.drawPoint(ctx, x, y, color, 1);
					break;
			}

			// Capture pointer for smooth drawing even outside canvas
			canvas.setPointerCapture(e.pointerId);
		},
		[
			canvasRef,
			drawing,
			selectedToolId,
			selectionHook,
			textBoxHook,
			magnification,
			setMagnification,
			curvePolygon,
			shapes,
			saveHistoryState,
		],
	);

	/**
	 * Pointer move event handler - handles drawing and preview updates.
	 *
	 * Behavior depends on current tool and state:
	 * - Always: Updates cursor position for status bar
	 * - Selection active: Updates selection region bounds
	 * - Curve/polygon active: Shows preview with current mouse position
	 * - Shape tool drawing: Shows preview of shape
	 * - Continuous drawing: Draws line from last position to current
	 */
	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			const { x, y } = drawing.getCanvasCoords(e);

			// Update cursor position for status bar
			setCursorPosition({ x: Math.floor(x), y: Math.floor(y) });

			// Handle selection
			if (selectionHook.isActive()) {
				selectionHook.handleSelectionMove(x, y, selectedToolId === TOOL_IDS.SELECT);
				return;
			}

			// Handle curve/polygon preview
			if (curvePolygon.isCurveActive() && selectedToolId === TOOL_IDS.CURVE) {
				curvePolygon.previewCurve(x, y, ctx);
				return;
			}
			if (curvePolygon.isPolygonActive() && selectedToolId === TOOL_IDS.POLYGON) {
				curvePolygon.previewPolygon(x, y, ctx);
				return;
			}

			// Handle shape preview
			if (shapes.isDrawing() && shapes.isShapeTool(selectedToolId)) {
				shapes.previewShape(x, y, selectedToolId, ctx, e.shiftKey);
				return;
			}

			// Handle continuous drawing tools
			const state = shapes.getDrawingState();
			if (!state.isDrawing) return;

			const { lastX, lastY, button } = state;

			if (!shapes.isShapeTool(selectedToolId)) {
				drawing.handleToolAction(ctx, x, y, lastX, lastY, button);
				shapes.drawingState.current.lastX = x;
				shapes.drawingState.current.lastY = y;
			}
		},
		[canvasRef, drawing, setCursorPosition, selectionHook, selectedToolId, curvePolygon, shapes],
	);

	/**
	 * Pointer leave event handler - clears cursor position.
	 * Clears cursor position in state so the status bar shows no coordinates.
	 */
	const handlePointerLeave = useCallback(() => {
		setCursorPosition(null);
	}, [setCursorPosition]);

	/**
	 * Pointer up event handler - finalizes drawing operations.
	 *
	 * Completes the current drawing operation based on tool and state:
	 * - Selection tools: Finalizes selection region and captures ImageData
	 * - Text box: Finalizes dimensions and activates for editing
	 * - Shape tools: Commits shape from preview to canvas
	 * - Continuous drawing: Ends drawing mode
	 * - Saves to history with specific operation name
	 */
	const handlePointerUp = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			const { x, y } = drawing.getCanvasCoords(e);

			// Handle selection finalization
			if (selectionHook.isActive()) {
				if (selectedToolId === TOOL_IDS.SELECT) {
					selectionHook.finalizeRectangularSelection(x, y, ctx);
					saveHistoryState("Select");
				} else if (selectedToolId === TOOL_IDS.FREE_FORM_SELECT) {
					selectionHook.finalizeFreeFormSelection(ctx);
					saveHistoryState("Free-Form Select");
				}
				return;
			}

			// Handle text box creation
			if (textBoxHook.isCreating()) {
				textBoxHook.finalizeTextBox(x, y);
				// Don't save history here - save when text is committed to canvas
				return;
			}

			// Finalize shape drawing
			if (shapes.isDrawing() && shapes.isShapeTool(selectedToolId)) {
				shapes.finalizeShape(x, y, selectedToolId, ctx, e.shiftKey);
				canvas.releasePointerCapture(e.pointerId);

				saveHistoryState(TOOL_NAMES[selectedToolId] || "Shape");
				return;
			}

			// Save history for continuous drawing tools
			if (shapes.getDrawingState().isDrawing) {
				canvas.releasePointerCapture(e.pointerId);
				shapes.drawingState.current.isDrawing = false;

				saveHistoryState(TOOL_NAMES[selectedToolId] || "Edit");
			}

			// Save for instant tools
			switch (selectedToolId) {
				case TOOL_IDS.FILL:
					saveHistoryState("Fill");
					break;
				case TOOL_IDS.PICK_COLOR:
					// Pick color doesn't modify canvas, no history needed
					break;
			}
		},
		[canvasRef, drawing, selectedToolId, selectionHook, textBoxHook, shapes, saveHistoryState],
	);

	/**
	 * Text input change handler.
	 * Updates the text content in the active text box.
	 */
	const handleTextChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			textBoxHook.updateText(e.target.value);
		},
		[textBoxHook],
	);

	/**
	 * Text input key down handler.
	 * Handles keyboard shortcuts in the text box:
	 * - Escape: Cancel text box (discard text)
	 */
	const handleTextKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Escape") {
				textBoxHook.clearTextBox();
			}
		},
		[textBoxHook],
	);

	/**
	 * Text input blur handler.
	 * Commits text to canvas when clicking outside the text box.
	 * Uses a 100ms timeout to allow other click handlers to process first.
	 */
	const handleTextBlur = useCallback(() => {
		setTimeout(() => {
			if (textBoxHook.textBox?.isActive) {
				// Only save history if there's actual text to commit
				if (textBoxHook.textBox.text.trim()) {
					saveHistoryState("Text");
				}
				textBoxHook.commitTextBox();
			}
		}, 100);
	}, [textBoxHook, saveHistoryState]);

	/**
	 * Context menu handler.
	 * Prevents the browser's default context menu on right-click.
	 * Right mouse button is used for secondary color in drawing tools.
	 */
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	return {
		handlePointerDown,
		handlePointerMove,
		handlePointerUp,
		handlePointerLeave,
		handleTextChange,
		handleTextKeyDown,
		handleTextBlur,
		handleContextMenu,
	};
}
