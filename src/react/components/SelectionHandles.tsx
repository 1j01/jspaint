import { CSSProperties, RefObject, useCallback, useEffect, useRef } from "react";
import { useUIStore } from "../context/state/uiStore";
import type { Selection } from "../context/state/types";

/**
 * Handle position constants for selection resize handles
 * Matches the legacy implementation
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
 * 8 resize handles around the selection
 * Order matches legacy implementation for consistency
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
 * Props for SelectionHandles component
 */
interface SelectionHandlesProps {
	/** Current selection state (null if no selection) */
	selection: Selection | null;
	/** Callback when selection is resized */
	onResize: (newRect: { x: number; y: number; width: number; height: number }) => void;
	/** Reference to canvas container element for coordinate calculation */
	containerRef: RefObject<HTMLDivElement | null>;
	/** Size of resize handles in pixels (default: 6) */
	handleSize?: number;
}

/**
 * Gets the appropriate cursor style for a resize handle
 * Based on handle position (corner vs edge vs middle).
 *
 * @param {HandleAxis} xAxis - Horizontal axis position
 * @param {HandleAxis} yAxis - Vertical axis position
 * @returns {string} CSS cursor value
 */
function getCursor(xAxis: HandleAxis, yAxis: HandleAxis): string {
	if (xAxis === HANDLE_START && yAxis === HANDLE_START) return "nwse-resize";
	if (xAxis === HANDLE_END && yAxis === HANDLE_END) return "nwse-resize";
	if (xAxis === HANDLE_END && yAxis === HANDLE_START) return "nesw-resize";
	if (xAxis === HANDLE_START && yAxis === HANDLE_END) return "nesw-resize";
	if (xAxis === HANDLE_MIDDLE && yAxis !== HANDLE_MIDDLE) return "ns-resize";
	if (yAxis === HANDLE_MIDDLE && xAxis !== HANDLE_MIDDLE) return "ew-resize";
	return "move";
}

/**
 * SelectionHandles component - Resize handles for selections
 * Provides 8 resize handles (4 corners + 4 edges) around the current selection.
 * Handles dragging with live ghost preview and pointer capture for smooth interaction.
 *
 * Features:
 * - 8 draggable resize handles (corners and edges)
 * - Ghost preview during resize (semi-transparent overlay)
 * - Pointer capture for reliable drag tracking
 * - Coordinate transformation for magnification support
 * - Minimum size enforcement (1x1 pixel)
 * - Handles negative dimensions correctly
 *
 * The handles appear when a selection is active and allow the user to
 * resize the selection by dragging. The ghost preview shows the new size
 * during drag, and the final size is committed on pointer up.
 *
 * @param {SelectionHandlesProps} props - Component props
 * @returns {JSX.Element | null} Resize handles and ghost preview, or null if no selection
 *
 * @example
 * <SelectionHandles
 *   selection={selection}
 *   onResize={(newRect) => setSelection({ ...selection, ...newRect })}
 *   containerRef={canvasContainerRef}
 *   handleSize={6}
 * />
 */
export function SelectionHandles({
	selection,
	onResize,
	containerRef,
	handleSize = 6,
}: SelectionHandlesProps) {
	const magnification = useUIStore((state) => state.magnification);

	// Ghost element for resize preview
	const ghostRef = useRef<HTMLDivElement>(null);
	const isDragging = useRef(false);
	const dragAxis = useRef<{ x: HandleAxis; y: HandleAxis }>({ x: HANDLE_MIDDLE, y: HANDLE_MIDDLE });
	const originalRect = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
	const newRect = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

	// Get container offset for coordinate calculation
	const getContainerOffset = useCallback(() => {
		const container = containerRef.current;
		if (!container) return { left: 0, top: 0 };
		const rect = container.getBoundingClientRect();
		return { left: rect.left, top: rect.top };
	}, [containerRef]);

	// Get container padding (matches .canvas-area padding from layout.css)
	const getContainerPadding = useCallback(() => {
		const container = containerRef.current;
		if (!container) return { left: 0, top: 0 };
		const styles = window.getComputedStyle(container);
		return {
			left: parseFloat(styles.paddingLeft) || 0,
			top: parseFloat(styles.paddingTop) || 0,
		};
	}, [containerRef, selection, magnification]);

	// Convert screen coords to canvas coords
	const toCanvasCoords = useCallback(
		(clientX: number, clientY: number) => {
			const offset = getContainerOffset();
			const padding = getContainerPadding();
			// getBoundingClientRect gives us the border box
			// We need to subtract padding to get to the canvas origin
			return {
				x: Math.round((clientX - offset.left - padding.left) / magnification),
				y: Math.round((clientY - offset.top - padding.top) / magnification),
			};
		},
		[getContainerOffset, getContainerPadding, magnification],
	);

	// Handle pointer down on a resize handle
	const handlePointerDown = useCallback(
		(e: React.PointerEvent, xAxis: HandleAxis, yAxis: HandleAxis) => {
			if (e.button !== 0 || !selection) return;
			e.preventDefault();
			e.stopPropagation();

			isDragging.current = true;
			dragAxis.current = { x: xAxis, y: yAxis };
			originalRect.current = {
				x: selection.x,
				y: selection.y,
				width: selection.width,
				height: selection.height,
			};
			newRect.current = { ...originalRect.current };

			// Show ghost element
			if (ghostRef.current) {
				const padding = getContainerPadding();
				ghostRef.current.style.display = "block";
				ghostRef.current.style.left = `${selection.x * magnification + padding.left}px`;
				ghostRef.current.style.top = `${selection.y * magnification + padding.top}px`;
				ghostRef.current.style.width = `${selection.width * magnification}px`;
				ghostRef.current.style.height = `${selection.height * magnification}px`;
			}

			// Capture pointer for reliable drag
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		},
		[selection, magnification, getContainerPadding],
	);

	// Handle pointer move during drag
	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (!isDragging.current || !originalRect.current) return;

			const { x: xAxis, y: yAxis } = dragAxis.current;
			const m = toCanvasCoords(e.clientX, e.clientY);
			const rect = originalRect.current;

			let newX = rect.x;
			let newY = rect.y;
			let newWidth = rect.width;
			let newHeight = rect.height;

			// Calculate new dimensions based on which handle is being dragged
			if (xAxis === HANDLE_END) {
				newWidth = m.x - rect.x;
			} else if (xAxis === HANDLE_START) {
				newX = m.x;
				newWidth = rect.x + rect.width - m.x;
			}

			if (yAxis === HANDLE_END) {
				newHeight = m.y - rect.y;
			} else if (yAxis === HANDLE_START) {
				newY = m.y;
				newHeight = rect.y + rect.height - m.y;
			}

			// Ensure minimum size and correct negative dimensions
			if (newWidth < 1) {
				newWidth = 1;
				if (xAxis === HANDLE_START) {
					newX = rect.x + rect.width - 1;
				}
			}
			if (newHeight < 1) {
				newHeight = 1;
				if (yAxis === HANDLE_START) {
					newY = rect.y + rect.height - 1;
				}
			}

			newRect.current = { x: newX, y: newY, width: newWidth, height: newHeight };

			// Update ghost preview
			if (ghostRef.current) {
				const padding = getContainerPadding();
				ghostRef.current.style.left = `${newX * magnification + padding.left}px`;
				ghostRef.current.style.top = `${newY * magnification + padding.top}px`;
				ghostRef.current.style.width = `${newWidth * magnification}px`;
				ghostRef.current.style.height = `${newHeight * magnification}px`;
			}
		},
		[toCanvasCoords, magnification, getContainerPadding],
	);

	// Handle pointer up - finalize resize
	const handlePointerUp = useCallback(() => {
		if (!isDragging.current || !newRect.current) return;

		isDragging.current = false;

		// Hide ghost
		if (ghostRef.current) {
			ghostRef.current.style.display = "none";
		}

		// Apply the resize
		onResize(newRect.current);

		originalRect.current = null;
		newRect.current = null;
	}, [onResize]);

	// Add global event listeners for drag
	useEffect(() => {
		const moveHandler = (e: PointerEvent) => handlePointerMove(e);
		const upHandler = () => handlePointerUp();

		window.addEventListener("pointermove", moveHandler);
		window.addEventListener("pointerup", upHandler);

		return () => {
			window.removeEventListener("pointermove", moveHandler);
			window.removeEventListener("pointerup", upHandler);
		};
	}, [handlePointerMove, handlePointerUp]);

	if (!selection) return null;

	const { x, y, width, height } = selection;
	const padding = getContainerPadding();
	// Handles are positioned absolutely relative to .canvas-area border box
	// Canvas is at (0,0) which is the padding edge, so at (padding.left, padding.top) from border edge
	// Selection at canvas coords (x,y) with magnification appears at screen coords:
	// (x * mag + padding.left, y * mag + padding.top) from .canvas-area border edge
	const scaledX = x * magnification + padding.left;
	const scaledY = y * magnification + padding.top;
	const scaledWidth = width * magnification;
	const scaledHeight = height * magnification;

	// Calculate handle positions
	const getHandleStyle = (xAxis: HandleAxis, yAxis: HandleAxis): CSSProperties => {
		let left = scaledX;
		let top = scaledY;

		// X position
		if (xAxis === HANDLE_START) {
			left = scaledX - handleSize / 2;
		} else if (xAxis === HANDLE_MIDDLE) {
			left = scaledX + scaledWidth / 2 - handleSize / 2;
		} else {
			left = scaledX + scaledWidth - handleSize / 2;
		}

		// Y position
		if (yAxis === HANDLE_START) {
			top = scaledY - handleSize / 2;
		} else if (yAxis === HANDLE_MIDDLE) {
			top = scaledY + scaledHeight / 2 - handleSize / 2;
		} else {
			top = scaledY + scaledHeight - handleSize / 2;
		}

		return {
			position: "absolute",
			left,
			top,
			width: handleSize,
			height: handleSize,
			backgroundColor: "#000",
			border: "1px solid #fff",
			cursor: getCursor(xAxis, yAxis),
			zIndex: 100,
			boxSizing: "border-box",
		};
	};

	const ghostStyle: CSSProperties = {
		position: "absolute",
		display: "none",
		border: "1px dashed #000",
		backgroundColor: "rgba(0, 0, 0, 0.1)",
		pointerEvents: "none",
		zIndex: 99,
		boxSizing: "border-box",
	};

	return (
		<>
			{/* Ghost preview during resize */}
			<div ref={ghostRef} className="resize-ghost" style={ghostStyle} />

			{/* Resize handles */}
			{HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => (
				<div
					key={index}
					className="selection-handle"
					style={getHandleStyle(xAxis, yAxis)}
					onPointerDown={(e) => handlePointerDown(e, xAxis, yAxis)}
				/>
			))}
		</>
	);
}

export default SelectionHandles;
