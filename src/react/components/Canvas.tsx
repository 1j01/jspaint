import { useCallback, useEffect, useRef } from "react";
import { TOOL_IDS, useApp, useCursorPosition, useHistory, useMagnification, useTool } from "../context/AppContext";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { useCanvasSelection } from "../hooks/useCanvasSelection";
import { useCanvasTextBox } from "../hooks/useCanvasTextBox";
import { useCanvasShapes } from "../hooks/useCanvasShapes";
import { useCanvasCurvePolygon } from "../hooks/useCanvasCurvePolygon";
import { CanvasOverlay } from "./CanvasOverlay";
import { CanvasTextBox } from "./CanvasTextBox";

// Magnification levels
const MAGNIFICATION_LEVELS = [1, 2, 4, 6, 8];

/**
 * Canvas component for drawing
 */
export function Canvas({ className = "" }: { className?: string }) {
	const { canvasRef } = useApp();
	const { selectedToolId } = useTool();
	const { saveState } = useHistory();
	const { magnification, setMagnification } = useMagnification();
	const { setCursorPosition } = useCursorPosition();

	// Overlay canvas ref for selection marching ants
	const overlayRef = useRef<HTMLCanvasElement>(null);

	// Text input ref
	const textInputRef = useRef<HTMLTextAreaElement>(null);

	// Initialize drawing hook
	const drawing = useCanvasDrawing(canvasRef);

	// Initialize selection hook
	const selection = useCanvasSelection({
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

	// Initialize canvas with white background
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, [canvasRef]);

	// Focus text input when text box is active
	useEffect(() => {
		if (textBoxHook.textBox?.isActive && textInputRef.current) {
			textInputRef.current.focus();
		}
	}, [textBoxHook.textBox?.isActive]);

	// Mouse event handlers
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

			// Save state for undo before drawing (for most tools)
			const toolsWithOwnSaveState = [
				TOOL_IDS.SELECT,
				TOOL_IDS.FREE_FORM_SELECT,
				TOOL_IDS.CURVE,
				TOOL_IDS.POLYGON,
			];
			if (!toolsWithOwnSaveState.includes(selectedToolId)) {
				saveState();
			}

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
					selection.startRectangularSelection(x, y, ctx);
					break;

				case TOOL_IDS.FREE_FORM_SELECT:
					selection.startFreeFormSelection(x, y, ctx);
					break;

				case TOOL_IDS.TEXT:
					if (textBoxHook.textBox?.isActive) {
						textBoxHook.commitTextBox();
					}
					textBoxHook.startTextBox(x, y);
					saveState();
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
			selection,
			textBoxHook,
			magnification,
			setMagnification,
			curvePolygon,
			shapes,
		],
	);

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
			if (selection.isActive()) {
				selection.handleSelectionMove(x, y, selectedToolId === TOOL_IDS.SELECT);
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
		[canvasRef, drawing, setCursorPosition, selection, selectedToolId, curvePolygon, shapes],
	);

	const handlePointerLeave = useCallback(() => {
		setCursorPosition(null);
	}, [setCursorPosition]);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			const { x, y } = drawing.getCanvasCoords(e);

			// Handle selection finalization
			if (selection.isActive()) {
				if (selectedToolId === TOOL_IDS.SELECT) {
					selection.finalizeRectangularSelection(x, y, ctx);
				} else if (selectedToolId === TOOL_IDS.FREE_FORM_SELECT) {
					selection.finalizeFreeFormSelection(ctx);
				}
				return;
			}

			// Handle text box creation
			if (textBoxHook.isCreating()) {
				textBoxHook.finalizeTextBox(x, y);
				return;
			}

			// Finalize shape drawing
			if (shapes.isDrawing() && shapes.isShapeTool(selectedToolId)) {
				shapes.finalizeShape(x, y, selectedToolId, ctx);
				canvas.releasePointerCapture(e.pointerId);
				return;
			}

			// Release pointer capture
			if (shapes.getDrawingState().isDrawing) {
				canvas.releasePointerCapture(e.pointerId);
				shapes.drawingState.current.isDrawing = false;
			}
		},
		[canvasRef, drawing, selectedToolId, selection, textBoxHook, shapes],
	);

	// Handle text input change
	const handleTextChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			textBoxHook.updateText(e.target.value);
		},
		[textBoxHook],
	);

	// Handle text input key events
	const handleTextKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Escape") {
				textBoxHook.clearTextBox();
			}
		},
		[textBoxHook],
	);

	// Handle clicking outside text box to commit
	const handleTextBlur = useCallback(() => {
		setTimeout(() => {
			if (textBoxHook.textBox?.isActive) {
				textBoxHook.commitTextBox();
			}
		}, 100);
	}, [textBoxHook]);

	// Prevent context menu on right-click
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	// Get cursor style based on tool
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

	const canvasStyle: React.CSSProperties = {
		cursor: getCursorStyle(),
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
		transformOrigin: "top left",
	};

	return (
		<div className={`canvas-container ${className}`} style={{ position: "relative", display: "inline-block" }}>
			<canvas
				ref={canvasRef}
				className="main-canvas"
				width={480}
				height={320}
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
			<CanvasOverlay ref={overlayRef} width={480} height={320} magnification={magnification} />
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
		</div>
	);
}

export default Canvas;
