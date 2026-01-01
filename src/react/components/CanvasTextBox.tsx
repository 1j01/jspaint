import React, { forwardRef, CSSProperties, ChangeEvent, KeyboardEvent, FocusEvent, useCallback, useRef, useState, useEffect } from "react";
import type { TextBoxState } from "../context/state/types";

/**
 * Props for CanvasTextBox component
 */
interface CanvasTextBoxProps {
	/** Current text box state from toolStore */
	textBox: TextBoxState;
	/** Canvas magnification level (1 = 100%, 2 = 200%, etc.) */
	magnification: number;
	/** Primary/foreground color for text */
	primaryColor: string;
	/** Secondary/background color for text box */
	secondaryColor: string;
	/** Callback when textarea content changes */
	onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	/** Callback for keyboard events (e.g., Escape to commit) */
	onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
	/** Callback when textarea loses focus */
	onBlur: (e: FocusEvent<HTMLTextAreaElement>) => void;
	/** Callback when text box is moved (dragged) */
	onMove: (x: number, y: number) => void;
	/** Callback when text box is resized */
	onResize: (width: number, height: number) => void;
}

/**
 * Handle position constants for textbox resize handles
 * Matches the legacy jQuery implementation
 */
const HANDLE_START = -1;  // Top or left edge
const HANDLE_MIDDLE = 0;  // Center (horizontal or vertical)
const HANDLE_END = 1;     // Bottom or right edge

/**
 * Handle axis type - position along an axis
 */
type HandleAxis = typeof HANDLE_START | typeof HANDLE_MIDDLE | typeof HANDLE_END;

/**
 * Configuration for a single resize handle
 */
interface HandleConfig {
	/** Horizontal axis position */
	xAxis: HandleAxis;
	/** Vertical axis position */
	yAxis: HandleAxis;
}

/**
 * 8 resize handles around the textbox
 * Order matches legacy jQuery implementation for consistency
 */
const HANDLE_CONFIGS: HandleConfig[] = [
	{ yAxis: HANDLE_START, xAxis: HANDLE_END }, // top-right (↗)
	{ yAxis: HANDLE_START, xAxis: HANDLE_MIDDLE }, // top (↑)
	{ yAxis: HANDLE_START, xAxis: HANDLE_START }, // top-left (↖)
	{ yAxis: HANDLE_MIDDLE, xAxis: HANDLE_START }, // left (←)
	{ yAxis: HANDLE_END, xAxis: HANDLE_START }, // bottom-left (↙)
	{ yAxis: HANDLE_END, xAxis: HANDLE_MIDDLE }, // bottom (↓)
	{ yAxis: HANDLE_END, xAxis: HANDLE_END }, // bottom-right (↘)
	{ yAxis: HANDLE_MIDDLE, xAxis: HANDLE_END }, // right (→)
];

/**
 * Gets the appropriate cursor style for a resize handle
 * Based on handle position (corner vs edge vs middle).
 *
 * @param {HandleAxis} xAxis - Horizontal axis position
 * @param {HandleAxis} yAxis - Vertical axis position
 * @returns {string} CSS cursor value
 */
function getCursor(xAxis: HandleAxis, yAxis: HandleAxis): string {
	if ((xAxis === HANDLE_START && yAxis === HANDLE_START) || (xAxis === HANDLE_END && yAxis === HANDLE_END)) {
		return "nwse-resize";
	}
	if ((xAxis === HANDLE_END && yAxis === HANDLE_START) || (xAxis === HANDLE_START && yAxis === HANDLE_END)) {
		return "nesw-resize";
	}
	if (xAxis === HANDLE_MIDDLE && yAxis !== HANDLE_MIDDLE) return "ns-resize";
	if (yAxis === HANDLE_MIDDLE && xAxis !== HANDLE_MIDDLE) return "ew-resize";
	return "default";
}

/**
 * CanvasTextBox component - On-canvas text editing overlay
 * Provides editable text box with live preview, resize handles, and drag-to-move.
 * Matches the legacy jQuery text tool implementation exactly.
 *
 * Features:
 * - Textarea for text input with font styling applied
 * - Canvas overlay for rendering text preview with underline support
 * - 8 resize handles (corners and edges) with intelligent grab regions
 * - Drag container to move text box
 * - CSS transform scaling for magnification support
 * - Pointer capture for smooth drag/resize
 * - Minimum size enforcement (20x20 pixels)
 * - Auto-adjusts handle grab regions based on text box size
 *
 * The text box appears when Text tool is active and user clicks on canvas.
 * User can type, move, resize, and format text before committing to canvas.
 *
 * @param {CanvasTextBoxProps} props - Component props
 * @param {React.Ref<HTMLTextAreaElement>} ref - Forwarded ref to textarea element
 * @returns {JSX.Element} Text box overlay with textarea, canvas preview, and resize handles
 *
 * @example
 * {textBox?.isActive && (
 *   <CanvasTextBox
 *     ref={textareaRef}
 *     textBox={textBox}
 *     magnification={2}
 *     primaryColor="rgb(0,0,0)"
 *     secondaryColor="rgb(255,255,255)"
 *     onChange={handleTextChange}
 *     onKeyDown={handleTextKeyDown}
 *     onBlur={handleTextBlur}
 *     onMove={handleTextMove}
 *     onResize={handleTextResize}
 *   />
 * )}
 */
export const CanvasTextBox = forwardRef<HTMLTextAreaElement, CanvasTextBoxProps>(function CanvasTextBox(
	{ textBox, magnification, primaryColor, secondaryColor, onChange, onKeyDown, onBlur, onMove, onResize },
	ref,
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const dragStateRef = useRef<{
		startX: number;
		startY: number;
		originalX: number;
		originalY: number;
		originalWidth: number;
		originalHeight: number;
		xAxis?: HandleAxis;
		yAxis?: HandleAxis;
	} | null>(null);

	// Get .canvas-area padding to position correctly
	const canvasArea = document.querySelector(".canvas-area");
	const padding = canvasArea
		? {
				left: parseFloat(window.getComputedStyle(canvasArea).paddingLeft) || 0,
				top: parseFloat(window.getComputedStyle(canvasArea).paddingTop) || 0,
			}
		: { left: 0, top: 0 };

	// Update canvas overlay when text changes
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Render text preview on canvas
		if (textBox.text) {
			ctx.font = `${textBox.fontItalic ? "italic " : ""}${textBox.fontBold ? "bold " : ""}${textBox.fontSize}px ${textBox.fontFamily}`;
			ctx.fillStyle = primaryColor;
			ctx.textBaseline = "top";

			const lines = textBox.text.split("\n");
			const lineHeight = textBox.fontSize * 1.2; // Approximate line height

			lines.forEach((line, index) => {
				const y = index * lineHeight;
				ctx.fillText(line, 0, y);

				// Draw underline if needed
				if (textBox.fontUnderline) {
					const metrics = ctx.measureText(line);
					ctx.strokeStyle = primaryColor;
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(0, y + textBox.fontSize);
					ctx.lineTo(metrics.width, y + textBox.fontSize);
					ctx.stroke();
				}
			});
		}
	}, [textBox.text, textBox.fontFamily, textBox.fontSize, textBox.fontBold, textBox.fontItalic, textBox.fontUnderline, primaryColor]);

	// Handle container drag (move)
	const handleContainerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		// Only drag if clicking on the container itself, not textarea or handles
		if (e.target !== containerRef.current) return;

		e.preventDefault();
		e.stopPropagation();

		setIsDragging(true);
		dragStateRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			originalX: textBox.x,
			originalY: textBox.y,
			originalWidth: textBox.width,
			originalHeight: textBox.height,
		};

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		document.body.style.cursor = "move";
		document.body.classList.add("cursor-bully");
	}, [textBox.x, textBox.y, textBox.width, textBox.height]);

	// Handle resize handle drag
	const handleResizePointerDown = useCallback((xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setIsResizing(true);
		dragStateRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			originalX: textBox.x,
			originalY: textBox.y,
			originalWidth: textBox.width,
			originalHeight: textBox.height,
			xAxis,
			yAxis,
		};

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		document.body.style.cursor = getCursor(xAxis, yAxis);
		document.body.classList.add("cursor-bully");
	}, [textBox.x, textBox.y, textBox.width, textBox.height]);

	const handlePointerMove = useCallback((e: PointerEvent) => {
		if (!isDragging && !isResizing) return;
		if (!dragStateRef.current) return;

		const deltaX = (e.clientX - dragStateRef.current.startX) / magnification;
		const deltaY = (e.clientY - dragStateRef.current.startY) / magnification;

		if (isDragging) {
			// Move the textbox
			onMove(
				Math.round(dragStateRef.current.originalX + deltaX),
				Math.round(dragStateRef.current.originalY + deltaY)
			);
		} else if (isResizing && dragStateRef.current.xAxis !== undefined && dragStateRef.current.yAxis !== undefined) {
			// Resize the textbox
			const { xAxis, yAxis, originalX, originalY, originalWidth, originalHeight } = dragStateRef.current;

			let newX = originalX;
			let newY = originalY;
			let newWidth = originalWidth;
			let newHeight = originalHeight;

			// Handle horizontal resizing
			if (xAxis === HANDLE_START) {
				newX = originalX + deltaX;
				newWidth = originalWidth - deltaX;
			} else if (xAxis === HANDLE_END) {
				newWidth = originalWidth + deltaX;
			}

			// Handle vertical resizing
			if (yAxis === HANDLE_START) {
				newY = originalY + deltaY;
				newHeight = originalHeight - deltaY;
			} else if (yAxis === HANDLE_END) {
				newHeight = originalHeight + deltaY;
			}

			// Enforce minimum size
			const minSize = 20;
			if (newWidth < minSize) {
				if (xAxis === HANDLE_START) {
					newX = originalX + originalWidth - minSize;
				}
				newWidth = minSize;
			}
			if (newHeight < minSize) {
				if (yAxis === HANDLE_START) {
					newY = originalY + originalHeight - minSize;
				}
				newHeight = minSize;
			}

			// Update position if resizing from top or left
			if (xAxis === HANDLE_START || yAxis === HANDLE_START) {
				onMove(Math.round(newX), Math.round(newY));
			}

			onResize(Math.round(newWidth), Math.round(newHeight));
		}
	}, [isDragging, isResizing, magnification, onMove, onResize]);

	const handlePointerUp = useCallback(() => {
		if (!isDragging && !isResizing) return;

		setIsDragging(false);
		setIsResizing(false);
		dragStateRef.current = null;

		document.body.style.cursor = "";
		document.body.classList.remove("cursor-bully");
	}, [isDragging, isResizing]);

	// Add global pointer event listeners
	useEffect(() => {
		if (!isDragging && !isResizing) return;

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [isDragging, isResizing, handlePointerMove, handlePointerUp]);

	// Calculate handle positions - matching jQuery logic
	const getHandlePositions = (xAxis: HandleAxis, yAxis: HandleAxis) => {
		const handleSize = 3;
		const grabSize = 32;
		const rect = { width: textBox.width, height: textBox.height };

		const positions = {
			handle: { left: 0, top: 0 },
			grabRegion: { left: 0, top: 0, width: 0, height: 0 }
		};

		// X-axis calculations
		let middleStartX = Math.max(
			rect.width / 2 - grabSize / 2,
			Math.min(grabSize / 2, rect.width / 3)
		);
		let middleEndX = rect.width - middleStartX;
		if (middleEndX - middleStartX < 1) {
			middleStartX = 0;
			middleEndX = 1;
		}

		const startStartX = -grabSize / 2;
		const startEndX = Math.min(grabSize / 2, middleStartX);

		if (xAxis === HANDLE_START) {
			positions.handle.left = -1;
			positions.grabRegion.left = startStartX;
			positions.grabRegion.width = startEndX - startStartX;
		} else if (xAxis === HANDLE_MIDDLE) {
			positions.handle.left = (rect.width - handleSize) / 2;
			positions.grabRegion.left = middleStartX;
			positions.grabRegion.width = middleEndX - middleStartX;
		} else {
			// HANDLE_END
			positions.handle.left = rect.width - handleSize / 2;
			const endStartX = rect.width - startEndX;
			const endEndX = rect.width - startStartX;
			positions.grabRegion.left = endStartX;
			positions.grabRegion.width = endEndX - endStartX;
		}

		// Y-axis calculations
		let middleStartY = Math.max(
			rect.height / 2 - grabSize / 2,
			Math.min(grabSize / 2, rect.height / 3)
		);
		let middleEndY = rect.height - middleStartY;
		if (middleEndY - middleStartY < 1) {
			middleStartY = 0;
			middleEndY = 1;
		}

		const startStartY = -grabSize / 2;
		const startEndY = Math.min(grabSize / 2, middleStartY);

		if (yAxis === HANDLE_START) {
			positions.handle.top = -1;
			positions.grabRegion.top = startStartY;
			positions.grabRegion.height = startEndY - startStartY;
		} else if (yAxis === HANDLE_MIDDLE) {
			positions.handle.top = (rect.height - handleSize) / 2;
			positions.grabRegion.top = middleStartY;
			positions.grabRegion.height = middleEndY - middleStartY;
		} else {
			// HANDLE_END
			positions.handle.top = rect.height - handleSize / 2;
			const endStartY = rect.height - startEndY;
			const endEndY = rect.height - startStartY;
			positions.grabRegion.top = endStartY;
			positions.grabRegion.height = endEndY - endStartY;
		}

		return positions;
	};

	const containerStyle: CSSProperties = {
		cursor: "move",
		touchAction: "none",
		position: "absolute",
		left: textBox.x * magnification + padding.left,
		top: textBox.y * magnification + padding.top,
		width: textBox.width * magnification,
		height: textBox.height * magnification,
	};

	const canvasStyle: CSSProperties = {
		pointerEvents: "none",
		transform: `scale(${magnification})`,
		transformOrigin: "left top",
	};

	const textareaStyle: CSSProperties = {
		position: "absolute",
		inset: 0,
		padding: 0,
		margin: 0,
		border: 0,
		resize: "none",
		overflow: "hidden",
		minWidth: "3em",
		transform: `scale(${magnification})`,
		transformOrigin: "left top",
		width: textBox.width,
		fontFamily: textBox.fontFamily,
		fontSize: `${textBox.fontSize}px`, // Use px to match canvas rendering
		fontWeight: textBox.fontBold ? "bold" : "normal",
		fontStyle: textBox.fontItalic ? "italic" : "normal",
		textDecoration: textBox.fontUnderline ? "underline" : "none",
		lineHeight: `${Math.round(textBox.fontSize * 1.2)}px`,
		color: primaryColor,
		background: "transparent", // Transparent background so canvas preview shows through
		minHeight: 0,
		height: textBox.height,
		outline: "none",
	};

	const handleStyle = (left: number, top: number): CSSProperties => ({
		touchAction: "none",
		position: "absolute",
		left: `${left}px`,
		top: `${top}px`,
		width: "3px",
		height: "3px",
		border: "1px solid #000",
		background: "#fff",
		boxSizing: "border-box",
	});

	const grabRegionStyle = (positions: ReturnType<typeof getHandlePositions>, cursor: string): CSSProperties => ({
		position: "absolute",
		cursor,
		left: `${positions.grabRegion.left}px`,
		top: `${positions.grabRegion.top}px`,
		width: `${positions.grabRegion.width}px`,
		height: `${positions.grabRegion.height}px`,
	});

	return (
		<div
			ref={containerRef}
			className="on-canvas-object textbox"
			style={containerStyle}
			onPointerDown={handleContainerPointerDown}
		>
			{/* Canvas overlay for text preview */}
			<canvas
				ref={canvasRef}
				width={textBox.width}
				height={textBox.height}
				style={canvasStyle}
			/>

			{/* Textarea for editing */}
			<textarea
				ref={ref}
				className="textbox-editor"
				value={textBox.text}
				onChange={onChange}
				onKeyDown={onKeyDown}
				onBlur={onBlur}
				style={textareaStyle}
				aria-label="Text input"
			/>

			{/* Resize handles and grab regions */}
			{HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => {
				const positions = getHandlePositions(xAxis, yAxis);
				const cursor = getCursor(xAxis, yAxis);
				const isMiddle = xAxis === HANDLE_MIDDLE || yAxis === HANDLE_MIDDLE;

				return (
					<React.Fragment key={index}>
						<div
							className="handle"
							style={handleStyle(positions.handle.left, positions.handle.top)}
						/>
						<div
							className={`grab-region ${isMiddle ? "is-middle" : ""}`}
							style={grabRegionStyle(positions, cursor)}
							onPointerDown={(e) => handleResizePointerDown(xAxis, yAxis, e)}
							onMouseDown={(e) => e.preventDefault()}
						/>
					</React.Fragment>
				);
			})}
		</div>
	);
});

export default CanvasTextBox;
