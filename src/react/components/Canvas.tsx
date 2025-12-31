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
import { useCursorPosition } from "../context/state/useCursorPosition";
import { useHistory } from "../context/state/useHistory";
import { useSelection } from "../context/state/useSelection";
import { useTool } from "../context/state/useTool";
import { useCanvasDimensions } from "../context/state/useCanvasDimensions";
import { useTreeHistory } from "../context/state/useTreeHistory";
import { useUIStore } from "../context/state/uiStore";
import { useToolStore } from "../context/state/toolStore";
import { useCanvasCurvePolygon } from "../hooks/useCanvasCurvePolygon";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { useCanvasSelection } from "../hooks/useCanvasSelection";
import { useCanvasShapes } from "../hooks/useCanvasShapes";
import { useCanvasTextBox } from "../hooks/useCanvasTextBox";
import { useCanvasLifecycle } from "../hooks/useCanvasLifecycle";
import { useAirbrushEffect } from "../hooks/useAirbrushEffect";
import { useCanvasEventHandlers } from "../hooks/useCanvasEventHandlers";
import { getCanvasStyle, resizeSelection, prepareCanvasResize, restoreCanvasAfterResize } from "../utils/canvasHelpers";
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
 * - Delegating all pointer events to useCanvasEventHandlers hook
 * - Rendering overlay elements (selection handles, text box, resize handles)
 *
 * @param {Object} props - Component props
 * @param {React.RefObject<HTMLCanvasElement>} props.canvasRef - Ref to canvas element
 * @param {string} [props.className=""] - Additional CSS class names
 * @returns {JSX.Element} Canvas element with overlays and handles
 */
export function Canvas({ canvasRef, className = "" }: { canvasRef: React.RefObject<HTMLCanvasElement>; className?: string }) {
	const { selectedToolId } = useTool();
	const { saveState } = useHistory();
	const { pushState: pushTreeState } = useTreeHistory();
	const magnification = useUIStore((state) => state.magnification);
	const setMagnification = useUIStore((state) => state.setMagnification);
	const { setCursorPosition } = useCursorPosition();
	const { selection: currentSelection, setSelection } = useSelection();
	const { canvasWidth, canvasHeight, setCanvasSize } = useCanvasDimensions();

	// Overlay canvas ref for selection marching ants
	const overlayRef = useRef<HTMLCanvasElement>(null);

	// Container ref for selection handles - use canvas parent (.canvas-area)
	const containerRef = useRef<HTMLDivElement>(null);

	// Text input ref
	const textInputRef = useRef<HTMLTextAreaElement>(null);

	// Set container ref to canvas parent on mount
	useEffect(() => {
		if (canvasRef.current && canvasRef.current.parentElement) {
			containerRef.current = canvasRef.current.parentElement as HTMLDivElement;
		}
	}, [canvasRef]);

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

	/**
	 * Helper to save state to tree history.
	 * Captures current canvas state and stores it in the history tree.
	 *
	 * @param operationName - Human-readable name for the operation (e.g., "Pencil", "Fill")
	 */
	const saveHistoryState = useCallback((operationName: string = "Edit") => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Get current canvas state
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Get current selection from store directly (avoids dependency on unstable object)
		const currentSelection = useToolStore.getState().selection;

		// Save to tree history
		pushTreeState(imageData, operationName, {
			selectionImageData: currentSelection?.imageData,
			selectionX: currentSelection?.x,
			selectionY: currentSelection?.y,
			selectionWidth: currentSelection?.width,
			selectionHeight: currentSelection?.height,
		});

		// console.warn(`[Canvas] 🌳 Saved to history tree: ${operationName}`);
	}, [canvasRef, pushTreeState]);

	// Initialize all event handlers from the hook
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

	// Focus text input when text box is active
	useEffect(() => {
		if (textBoxHook.textBox?.isActive && textInputRef.current) {
			textInputRef.current.focus();
		}
	}, [textBoxHook.textBox?.isActive]);

	/**
	 * Selection resize handler.
	 * Called when user drags selection resize handles.
	 */
	const handleSelectionResize = useCallback(
		(newRect: { x: number; y: number; width: number; height: number }) => {
			// Get current selection from store directly (avoids dependency on unstable object)
			const currentSelection = useToolStore.getState().selection;
			const resized = resizeSelection(currentSelection, newRect);
			if (resized) {
				setSelection(resized);
			}
		},
		[setSelection],
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

	// Compute canvas style (cursor and magnification transform)
	const canvasStyle = getCanvasStyle(selectedToolId, magnification);

	return (
		<>
			<canvas
				ref={canvasRef}
				className="main-canvas"
				width={canvasWidth}
				height={canvasHeight}
				style={canvasStyle}
				onPointerDown={eventHandlers.handlePointerDown}
				onPointerMove={eventHandlers.handlePointerMove}
				onPointerUp={eventHandlers.handlePointerUp}
				onPointerLeave={(e) => {
					eventHandlers.handlePointerUp(e);
					eventHandlers.handlePointerLeave();
				}}
				onContextMenu={eventHandlers.handleContextMenu}
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
					onChange={eventHandlers.handleTextChange}
					onKeyDown={eventHandlers.handleTextKeyDown}
					onBlur={eventHandlers.handleTextBlur}
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
