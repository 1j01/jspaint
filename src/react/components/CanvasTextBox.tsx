import React, { forwardRef, CSSProperties, ChangeEvent, KeyboardEvent, FocusEvent, useCallback, useRef, useState, useEffect } from "react";
import type { TextBoxState } from "../context/state/types";
import { useSettingsStore } from "../context/state/settingsStore";
import {
	HANDLE_CONFIGS,
	HANDLE_START,
	HANDLE_MIDDLE,
	HANDLE_END,
	getCursor,
	getHandlePositions,
	type HandleAxis,
} from "../utils/resizeHandles";

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
	const drawOpaque = useSettingsStore((state) => state.drawOpaque);

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
	// Uses SVG foreignObject approach (like legacy code) to support vertical text via CSS
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Create SVG with foreignObject containing styled textarea
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("version", "1.1");
		svg.setAttribute("width", textBox.width.toString());
		svg.setAttribute("height", textBox.height.toString());

		const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
		foreignObject.setAttribute("x", "0");
		foreignObject.setAttribute("y", "0");
		foreignObject.setAttribute("width", textBox.width.toString());
		foreignObject.setAttribute("height", textBox.height.toString());

		const textarea = document.createElement("textarea");
		textarea.value = textBox.text;
		textarea.style.cssText = `
			position: absolute;
			left: 0;
			top: 0;
			right: 0;
			bottom: 0;
			padding: 0;
			margin: 0;
			border: 0;
			resize: none;
			overflow: hidden;
			width: ${textBox.width}px;
			height: ${textBox.height}px;
			font-family: ${textBox.fontFamily};
			font-size: ${textBox.fontSize}px;
			font-weight: ${textBox.fontBold ? "bold" : "normal"};
			font-style: ${textBox.fontItalic ? "italic" : "normal"};
			text-decoration: ${textBox.fontUnderline ? "underline" : "none"};
			writing-mode: ${textBox.fontVertical ? "vertical-lr" : "horizontal-tb"};
			-ms-writing-mode: ${textBox.fontVertical ? "tb-lr" : "lr-tb"};
			-webkit-writing-mode: ${textBox.fontVertical ? "vertical-lr" : "horizontal-tb"};
			line-height: ${Math.round(textBox.fontSize * 1.2)}px;
			color: ${primaryColor};
			background: ${drawOpaque ? secondaryColor : "transparent"};
		`;

		foreignObject.appendChild(textarea);
		svg.appendChild(foreignObject);

		const svgSource = new XMLSerializer().serializeToString(svg);
		const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgSource)}`;

		const img = new Image();
		img.onload = () => {
			canvas.width = textBox.width;
			canvas.height = textBox.height;
			ctx.drawImage(img, 0, 0);
		};
		img.onerror = (event) => {
			console.error("Failed to load SVG image for text preview", event);
		};
		img.src = dataUrl;
	}, [textBox.text, textBox.width, textBox.height, textBox.fontFamily, textBox.fontSize, textBox.fontBold, textBox.fontItalic, textBox.fontUnderline, textBox.fontVertical, primaryColor, secondaryColor, drawOpaque]);

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
		position: "absolute",
		left: 0,
		top: 0,
		pointerEvents: "none",
		transform: `scale(${magnification})`,
		transformOrigin: "left top",
		zIndex: 5, // Above textarea (z-index: 4) to show rendered text
		opacity: 1, // Override CSS that sets opacity: 0
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
		writingMode: textBox.fontVertical ? "vertical-lr" : undefined,
		lineHeight: `${Math.round(textBox.fontSize * 1.2)}px`,
		color: primaryColor,
		background: drawOpaque ? secondaryColor : "transparent", // Transparent background when drawOpaque is false
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

			{/* Canvas overlay for text preview */}
			<canvas
				ref={canvasRef}
				width={textBox.width}
				height={textBox.height}
				style={canvasStyle}
			/>

			{/* Resize handles and grab regions */}
			{HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => {
				const positions = getHandlePositions(xAxis, yAxis, textBox.width, textBox.height);
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
