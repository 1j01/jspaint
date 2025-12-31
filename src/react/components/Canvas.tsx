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
import { TOOL_IDS, useApp, useCanvas, useCursorPosition, useHistory, useMagnification, useSelection, useTool, useCanvasDimensions } from "../context/state";
import { useTreeHistory } from "../context/state";
import { useCanvasCurvePolygon } from "../hooks/useCanvasCurvePolygon";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { useCanvasSelection } from "../hooks/useCanvasSelection";
import { useCanvasShapes } from "../hooks/useCanvasShapes";
import { useCanvasTextBox } from "../hooks/useCanvasTextBox";
import { CanvasOverlay } from "./CanvasOverlay";
import { CanvasTextBox } from "./CanvasTextBox";
import { SelectionHandles } from "./SelectionHandles";
import { CanvasResizeHandles } from "./CanvasResizeHandles";

/**
 * Module-level flag to track canvas initialization.
 * Prevents re-initializing the canvas with white background on every remount.
 * This persists across component remounts to maintain canvas state.
 */
let canvasInitialized = false;

/**
 * Module-level storage for canvas data when component unmounts.
 * Used to preserve drawing when the component temporarily unmounts (e.g., during React updates).
 * The ImageData is restored on the next mount if available.
 */
let savedCanvasData: ImageData | null = null;

/**
 * Available magnification levels for the Magnifier tool.
 * Matches MS Paint's zoom levels: 1x, 2x, 4x, 6x, 8x
 */
const MAGNIFICATION_LEVELS = [1, 2, 4, 6, 8];

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
	console.warn("[Canvas] Component rendering");

	const { selectedToolId } = useTool();
	const { saveState } = useHistory();
	const { pushState: pushTreeState, historyTree } = useTreeHistory();
	const { magnification, setMagnification } = useMagnification();
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


	// Helper to save state to both linear and tree history
	const saveHistoryState = useCallback((operationName: string = "Edit") => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Get current canvas state
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Save to linear history (existing system)
		// Moved to after resize completes

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

	// Initialize canvas with white background (only once ever)
	useEffect(() => {
		console.warn("[Canvas] Mount effect running, canvasInitialized:", canvasInitialized);

		const canvas = canvasRef.current;
		if (!canvas) {
			console.warn("[Canvas] No canvas ref yet");
			return;
		}

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) {
			console.warn("[Canvas] Could not get 2d context");
			return;
		}

		console.warn(`[Canvas] Canvas dimensions: ${canvas.width}x${canvas.height}`);

		// If we have saved canvas data, restore it
		if (savedCanvasData) {
			console.warn("[Canvas] 🔄 RESTORING SAVED CANVAS DATA 🔄");
			ctx.putImageData(savedCanvasData, 0, 0);
			savedCanvasData = null; // Clear after restoring
			return () => {
				// Save canvas data on unmount
				console.warn("[Canvas] 💾 Saving canvas data before unmount");
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				savedCanvasData = imageData;
				console.warn("[Canvas] ❌ COMPONENT UNMOUNTING! ❌");
			};
		}

		// Otherwise, initialize with white background (only once)
		if (canvasInitialized) {
			console.warn("[Canvas] Skipping initialization - already done");
			return () => {
				// Save canvas data on unmount
				console.warn("[Canvas] 💾 Saving canvas data before unmount");
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				savedCanvasData = imageData;
				console.warn("[Canvas] ❌ COMPONENT UNMOUNTING! ❌");
			};
		}

		console.warn("[Canvas] ⚠️ INITIALIZING CANVAS WITH WHITE BACKGROUND ⚠️");
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		canvasInitialized = true;
		console.warn("[Canvas] Initialization complete, flag set to true");
		// Initialize history tree with the blank canvas
		if (!historyTree) {
			const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			pushTreeState(initialImageData, "New Document");
			console.warn("[Canvas] 🌳 History tree initialized with blank canvas");
		}


		return () => {
			// Save canvas data on unmount
			console.warn("[Canvas] 💾 Saving canvas data before unmount");
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			savedCanvasData = imageData;
			console.warn("[Canvas] ❌ COMPONENT UNMOUNTING! ❌");
		};
	}, [canvasRef]);

	// Watch for canvas dimension changes (which auto-clear the canvas)
	useEffect(() => {
		console.warn(`[Canvas] Dimension effect: ${canvasWidth}x${canvasHeight}`);
	}, [canvasWidth, canvasHeight]);

	// Focus text input when text box is active
	useEffect(() => {
		if (textBoxHook.textBox?.isActive && textInputRef.current) {
			textInputRef.current.focus();
		}
	}, [textBoxHook.textBox?.isActive]);

	// Continuous airbrush painting when mouse is held down
	useEffect(() => {
		if (selectedToolId !== TOOL_IDS.AIRBRUSH || !shapes.drawingState.current?.isDrawing) {
			return;
		}

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Set up interval for continuous painting (every 5ms, matching original implementation)
		const intervalId = setInterval(() => {
			if (!shapes.drawingState.current?.isDrawing) {
				return;
			}

			const { lastX, lastY, button } = shapes.drawingState.current;
			const color = drawing.getDrawColor(button);
			const size = drawing.getToolSize();

			// Spray airbrush at current position
			drawing.sprayAirbrush(ctx, lastX, lastY, color, size);
		}, 5);

		return () => {
			clearInterval(intervalId);
		};
	}, [selectedToolId, canvasRef, drawing, shapes.drawingState]);

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
	 * Get cursor style based on current tool.
	 * Returns appropriate CSS cursor value for the selected tool.
	 *
	 * @returns {string} CSS cursor value
	 */
	const getCursorStyle = useCallback((): string => {
		switch (selectedToolId) {
			case TOOL_IDS.MAGNIFIER:
				return "zoom-in";
			case TOOL_IDS.TEXT:
				return "text";
			default:
				return "crosshair";
		}
	}, [selectedToolId]);

	/**
	 * Canvas inline styles.
	 * Applies cursor and magnification transform to the canvas element.
	 * Position and transform-origin are handled by CSS for exact alignment with overlay.
	 */
	const canvasStyle: React.CSSProperties = {
		cursor: getCursorStyle(),
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
	};

	/**
	 * Selection resize handler.
	 * Called when user drags selection resize handles.
	 *
	 * Process:
	 * 1. Creates temporary canvas with original selection ImageData
	 * 2. Creates new canvas with new dimensions
	 * 3. Draws original selection scaled to new size (bilinear interpolation)
	 * 4. Captures new ImageData
	 * 5. Updates selection state with new position and resized image
	 *
	 * @param {Object} newRect - New selection bounds
	 * @param {number} newRect.x - New x position
	 * @param {number} newRect.y - New y position
	 * @param {number} newRect.width - New width
	 * @param {number} newRect.height - New height
	 */
	const handleSelectionResize = useCallback(
		(newRect: { x: number; y: number; width: number; height: number }) => {
			if (!currentSelection || !currentSelection.imageData) return;

			// Create a scaled version of the selection image data
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = currentSelection.imageData.width;
			tempCanvas.height = currentSelection.imageData.height;
			const tempCtx = tempCanvas.getContext("2d");
			if (!tempCtx) return;
			tempCtx.putImageData(currentSelection.imageData, 0, 0);

			// Create a new canvas with the new size
			const resizedCanvas = document.createElement("canvas");
			resizedCanvas.width = newRect.width;
			resizedCanvas.height = newRect.height;
			const resizedCtx = resizedCanvas.getContext("2d");
			if (!resizedCtx) return;

			// Draw the original selection scaled to the new size
			resizedCtx.drawImage(tempCanvas, 0, 0, newRect.width, newRect.height);

			// Get the new image data
			const newImageData = resizedCtx.getImageData(0, 0, newRect.width, newRect.height);

			// Update the selection with the new position and resized image data
			setSelection({
				...currentSelection,
				x: newRect.x,
				y: newRect.y,
				width: newRect.width,
				height: newRect.height,
				imageData: newImageData,
			});
		},
		[currentSelection, setSelection],
	);

	/**
	 * Canvas resize handler.
	 * Called when user drags canvas resize handles (bottom or right edge).
	 *
	 * Process:
	 * 1. Saves current canvas content as ImageData
	 * 2. Resizes canvas to new dimensions (which clears it)
	 * 3. Restores the previous content to the resized canvas
	 * 4. Saves state for undo
	 *
	 * @param {number} width - New canvas width in pixels
	 * @param {number} height - New canvas height in pixels
	 */
	const handleCanvasResize = useCallback(
		(width: number, height: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			// Save current canvas content
			const currentImageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

			// Save to undo stack before resizing
			// Moved to after resize completes

			// Resize canvas (this will clear it)
			setCanvasSize(width, height);

			// Restore the previous content on the next frame (after resize completes)
			requestAnimationFrame(() => {
				const resizedCanvas = canvasRef.current;
				if (!resizedCanvas) return;

				const resizedCtx = resizedCanvas.getContext("2d", { willReadFrequently: true });
				if (!resizedCtx) return;

				// Fill with white background
				resizedCtx.fillStyle = "#ffffff";
				resizedCtx.fillRect(0, 0, width, height);

				// Restore the previous content
			resizedCtx.putImageData(currentImageData, 0, 0);

			// Save to history AFTER resize completes
			saveHistoryState("Resize Canvas");
				resizedCtx.putImageData(currentImageData, 0, 0);
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
