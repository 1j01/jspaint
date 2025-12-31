/**
 * Canvas Component
 *
 * Main drawing canvas component for the Paint application.
 * Handles all drawing operations, tool interactions, and canvas state management.
 *
 * Features:
 * - 16 drawing tools (pencil, brush, shapes, selection, text, etc.)
 * - Persistent canvas state across remounts
 * - Magnification/zoom support (1x-8x)
 * - Selection with resize handles
 * - Text input overlay
 * - Canvas resize handles
 * - Pointer event handling for all tools
 */

import React, { useCallback, useEffect, useRef } from "react";
import { TOOL_IDS, useApp, useCursorPosition, useHistory, useUIStore, useSelection, useTool, useCanvasDimensions } from "../context/state";
import { useTreeHistory } from "../context/state";
import { useCanvasCurvePolygon } from "../hooks/useCanvasCurvePolygon";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { useCanvasSelection } from "../hooks/useCanvasSelection";
import { useCanvasShapes } from "../hooks/useCanvasShapes";
import { useCanvasTextBox } from "../hooks/useCanvasTextBox";
import { useCanvasLifecycle } from "../hooks/useCanvasLifecycle";
import { useAirbrushEffect } from "../hooks/useAirbrushEffect";
import { useCanvasEventHandlers } from "../hooks/useCanvasEventHandlers";
import { getCursorForTool, resizeSelection, prepareCanvasResize, restoreCanvasAfterResize } from "../utils/canvasHelpers";
import { CanvasOverlay } from "./CanvasOverlay";
import { CanvasTextBox } from "./CanvasTextBox";
import { SelectionHandles } from "./SelectionHandles";
import { CanvasResizeHandles } from "./CanvasResizeHandles";

/**
 * Canvas component - the main drawing surface.
 *
 * This component orchestrates all drawing operations by:
 * - Managing canvas lifecycle (initialization, preservation across remounts)
 * - Coordinating tool-specific hooks (drawing, selection, shapes, text)
 * - Handling all pointer events (down, move, up, leave)
 * - Rendering overlay elements (selection handles, text box, resize handles)
 *
 * @param {Object} props - Component props
 * @param {string} [props.className=""] - Additional CSS class names
 * @returns {JSX.Element} Canvas element with overlays and handles
 */
export function Canvas({ canvasRef, className = "" }: { canvasRef: React.RefObject<HTMLCanvasElement>; className?: string }) {
	const { selectedToolId } = useTool();
	const { saveState } = useHistory();
	const { pushState: pushTreeState, historyTree } = useTreeHistory();
	const magnification = useUIStore((state) => state.magnification);
	const setMagnification = useUIStore((state) => state.setMagnification);
	const { setCursorPosition } = useCursorPosition();
	const { selection: currentSelection, setSelection } = useSelection();
	const { canvasWidth, canvasHeight, setCanvasSize } = useCanvasDimensions();

	// Overlay canvas ref for selection marching ants
	const overlayRef = useRef<HTMLCanvasElement>(null);

	// Container ref for selection handles - use canvas parent (.canvas-area)
	const containerRef = useRef<HTMLDivElement>(null);

	// Set container ref to canvas parent on mount
	useEffect(() => {
		if (canvasRef.current && canvasRef.current.parentElement) {
			containerRef.current = canvasRef.current.parentElement as HTMLDivElement;
		}
	}, [canvasRef]);

	// Text input ref
	const textInputRef = useRef<HTMLTextAreaElement>(null);

	// Initialize drawing hook
	const drawing = useCanvasDrawing(canvasRef);

	// Initialize selection hook
	const selectionHook = useCanvasSelection({
		canvasRef,
		overlayRef,
		getCanvasCoords: drawing.getCanvasCoords,
	});

	// Initialize text box hook
	const textBoxHook = useCanvasTextBox({ canvasRef });

	// Initialize shapes hook
	const shapes = useCanvasShapes({
		canvasRef,
		getDrawColor: drawing.getDrawColor,
	});

	// Initialize curve/polygon hook
	const curvePolygon = useCanvasCurvePolygon({
		canvasRef,
		getDrawColor: drawing.getDrawColor,
	});

	// Initialize canvas lifecycle (initialization, persistence, cleanup)
	useCanvasLifecycle(canvasRef);

	// Initialize airbrush effect (continuous painting)
	useAirbrushEffect({ canvasRef, selectedToolId, drawing, shapes });

	// Helper to save state to both linear and tree history
	const saveHistoryState = useCallback((operationName: string = "Edit") => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Get current canvas state
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Save to tree history (new system)
		pushTreeState(imageData, operationName, {
			selectionImageData: currentSelection?.imageData,
			selectionX: currentSelection?.x,
			selectionY: currentSelection?.y,
			selectionWidth: currentSelection?.width,
			selectionHeight: currentSelection?.height,
		});

		console.warn(`[Canvas] 🌳 Saved to history tree: ${operationName}`);
	}, [canvasRef, saveState, pushTreeState, currentSelection]);

	// Initialize all event handlers
	const eventHandlers = useCanvasEventHandlers({
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
	});

	// Watch for canvas dimension changes (which auto-clear the canvas)
	useEffect(() => {
	}, [canvasWidth, canvasHeight]);

	// Focus text input when text box is active
	useEffect(() => {
		if (textBoxHook.textBox?.isActive && textInputRef.current) {
			textInputRef.current.focus();
		}
	}, [textBoxHook.textBox?.isActive]);

	/**
	 * Pointer down event handler - initiates drawing operations.
	 *
	 * Handles the start of all drawing operations based on the currently selected tool.
	 * Responsibilities:
	 * - Saves undo state (except for multi-click tools like SELECT, CURVE, POLYGON)
	 * - Dispatches to appropriate tool handler
	 * - Initializes drawing state for continuous tools (PENCIL, BRUSH, ERASER)
	 * - Captures pointer for smooth drawing outside canvas bounds
	 *
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
	 *
	 * @param {React.PointerEvent<HTMLCanvasElement>} e - Pointer event
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

			// History is now saved on pointer UP (after operation completes), not down
			// This matches the jQuery version's undoable() pattern

			switch (selectedToolId) {
				case TOOL_IDS.PENCIL:
					drawing.drawPoint(ctx, x, y, color, 1);
					// Initialize drawing state for continuous drawing
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
					// Initialize drawing state for continuous drawing
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
					// Initialize drawing state for continuous drawing
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
					// Airbrush uses continuous drawing
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
					// For any other tool, just draw a point (no continuous drawing)
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
			saveState,
selectionHook,
			textBoxHook,
			magnification,
			setMagnification,
			curvePolygon,
			shapes,
		],
	);

	/**
	 * Pointer move event handler - handles drawing and preview updates.
	 *
	 * Responds to mouse movement over the canvas. Behavior depends on current tool and state:
	 *
	 * Always:
	 * - Updates cursor position for status bar display
	 *
	 * When selection is active:
	 * - Updates selection region bounds (rectangular or free-form)
	 *
	 * When curve/polygon tool is active:
	 * - Shows preview of curve/polygon with current mouse position
	 *
	 * When shape tool is drawing:
	 * - Shows preview of shape (line, rectangle, ellipse, etc.) from start to current position
	 *
	 * When continuous drawing tool is active (PENCIL, BRUSH, ERASER):
	 * - Draws line from last position to current position
	 * - Updates last position for next move event
	 *
	 * @param {React.PointerEvent<HTMLCanvasElement>} e - Pointer event
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
				shapes.previewShape(x, y, selectedToolId, ctx);
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
	 * Called when the pointer leaves the canvas area.
	 * Clears cursor position in state so the status bar shows no coordinates.
	 */
	const handlePointerLeave = useCallback(() => {
		setCursorPosition(null);
	}, [setCursorPosition]);

	/**
	 * Pointer up event handler - finalizes drawing operations.
	 *
	 * Completes the current drawing operation based on tool and state:
	 *
	 * Selection tools:
	 * - Finalizes rectangular or free-form selection region
	 * - Captures the selected area as ImageData
	 *
	 * Text box creation:
	 * - Finalizes text box dimensions and activates for editing
	 *
	 * Shape tools (LINE, RECTANGLE, ELLIPSE, ROUNDED_RECTANGLE):
	 * - Commits the shape from preview to canvas
	 * - Releases pointer capture
	 *
	 * Continuous drawing tools (PENCIL, BRUSH, ERASER):
	 * - Ends continuous drawing mode
	 * - Releases pointer capture
	 *
	 * @param {React.PointerEvent<HTMLCanvasElement>} e - Pointer event
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
				saveHistoryState("Text Box");
				return;
			}

			// Finalize shape drawing
			if (shapes.isDrawing() && shapes.isShapeTool(selectedToolId)) {
				shapes.finalizeShape(x, y, selectedToolId, ctx);
				canvas.releasePointerCapture(e.pointerId);
				
				// Save with specific tool name
				const toolNames: Record<string, string> = {
					[TOOL_IDS.LINE]: "Line",
					[TOOL_IDS.CURVE]: "Curve",
					[TOOL_IDS.RECTANGLE]: "Rectangle",
					[TOOL_IDS.ROUNDED_RECTANGLE]: "Rounded Rectangle",
					[TOOL_IDS.ELLIPSE]: "Ellipse",
					[TOOL_IDS.POLYGON]: "Polygon",
				};
				saveHistoryState(toolNames[selectedToolId] || "Shape");
				return;
			}

			// Save history for continuous drawing tools (Pencil, Brush, Eraser, Airbrush)
			if (shapes.getDrawingState().isDrawing) {
				canvas.releasePointerCapture(e.pointerId);
				shapes.drawingState.current.isDrawing = false;

				// Determine tool name
				let toolName = "Edit";
				switch (selectedToolId) {
					case TOOL_IDS.PENCIL:
						toolName = "Pencil";
						break;
					case TOOL_IDS.BRUSH:
						toolName = "Brush";
						break;
					case TOOL_IDS.ERASER:
						toolName = "Eraser";
						break;
					case TOOL_IDS.AIRBRUSH:
						toolName = "Airbrush";
						break;
				}
				saveHistoryState(toolName);
			}

			// Save for instant tools (Fill, Pick Color)
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
	 *
	 * @param {React.ChangeEvent<HTMLTextAreaElement>} e - Change event from textarea
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
	 *
	 * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - Keyboard event
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
				textBoxHook.commitTextBox();
			}
		}, 100);
	}, [textBoxHook]);

	/**
	 * Context menu handler.
	 * Prevents the browser's default context menu on right-click.
	 * Right mouse button is used for secondary color in drawing tools.
	 *
	 * @param {React.MouseEvent} e - Mouse event
	 */
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	/**
	 * Canvas inline styles.
	 * Applies cursor and magnification transform to the canvas element.
	 * Position and transform-origin are handled by CSS for exact alignment with overlay.
	 */
	const canvasStyle: React.CSSProperties = {
		cursor: getCursorForTool(selectedToolId),
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
	};

	/**
	 * Selection resize handler.
	 * Called when user drags selection resize handles.
	 */
	const handleSelectionResize = useCallback(
		(newRect: { x: number; y: number; width: number; height: number }) => {
			const resized = resizeSelection(currentSelection, newRect);
			if (resized) {
				setSelection(resized);
			}
		},
		[currentSelection, setSelection],
	);

	/**
	 * Canvas resize handler.
	 * Called when user drags canvas resize handles (bottom or right edge).
	 */
	const handleCanvasResize = useCallback(
		(width: number, height: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			// Save current canvas content
			const currentImageData = prepareCanvasResize(canvas, canvasWidth, canvasHeight);
			if (!currentImageData) return;

			// Resize canvas (this will clear it)
			setCanvasSize(width, height);

			// Restore the previous content on the next frame (after resize completes)
			requestAnimationFrame(() => {
				const resizedCanvas = canvasRef.current;
				if (!resizedCanvas) return;

				// Restore content with white background
				restoreCanvasAfterResize(resizedCanvas, currentImageData, width, height);

				// Save to history AFTER resize completes
				saveHistoryState("Resize Canvas");
			});
		},
		[canvasRef, canvasWidth, canvasHeight, setCanvasSize, saveHistoryState],
	);

	return (
		<>
			<canvas
				ref={canvasRef}
				className="main-canvas"
				width={canvasWidth}
				height={canvasHeight}
				style={canvasStyle}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={(e) => {
					handlePointerUp(e);
					handlePointerLeave();
				}}
				onContextMenu={handleContextMenu}
				aria-label="Drawing canvas"
			/>
			<CanvasOverlay ref={overlayRef} width={canvasWidth} height={canvasHeight} magnification={magnification} />
			{currentSelection && (
				<SelectionHandles
					selection={currentSelection}
					onResize={handleSelectionResize}
					containerRef={containerRef}
				/>
			)}
			{textBoxHook.textBox?.isActive && (
				<CanvasTextBox
					ref={textInputRef}
					textBox={textBoxHook.textBox}
					magnification={magnification}
					primaryColor={drawing.primaryColor}
					onChange={handleTextChange}
					onKeyDown={handleTextKeyDown}
					onBlur={handleTextBlur}
				/>
			)}
			<CanvasResizeHandles
				canvasWidth={canvasWidth}
				canvasHeight={canvasHeight}
				onResize={handleCanvasResize}
				containerRef={containerRef}
			/>
		</>
	);
}

export default Canvas;
