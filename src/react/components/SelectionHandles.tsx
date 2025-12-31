import { CSSProperties, RefObject, useCallback, useEffect, useRef } from "react";
import { Selection, useMagnification } from "../context/AppContext";

// Handle positions relative to selection
const HANDLE_START = -1;
const HANDLE_MIDDLE = 0;
const HANDLE_END = 1;

type HandleAxis = typeof HANDLE_START | typeof HANDLE_MIDDLE | typeof HANDLE_END;

interface HandleConfig {
	xAxis: HandleAxis;
	yAxis: HandleAxis;
}

// 8 handles around the selection (corners and edges)
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

interface SelectionHandlesProps {
	selection: Selection | null;
	onResize: (newRect: { x: number; y: number; width: number; height: number }) => void;
	containerRef: RefObject<HTMLDivElement | null>;
	handleSize?: number;
}

function getCursor(xAxis: HandleAxis, yAxis: HandleAxis): string {
	if (xAxis === HANDLE_START && yAxis === HANDLE_START) return "nwse-resize";
	if (xAxis === HANDLE_END && yAxis === HANDLE_END) return "nwse-resize";
	if (xAxis === HANDLE_END && yAxis === HANDLE_START) return "nesw-resize";
	if (xAxis === HANDLE_START && yAxis === HANDLE_END) return "nesw-resize";
	if (xAxis === HANDLE_MIDDLE && yAxis !== HANDLE_MIDDLE) return "ns-resize";
	if (yAxis === HANDLE_MIDDLE && xAxis !== HANDLE_MIDDLE) return "ew-resize";
	return "move";
}

export function SelectionHandles({
	selection,
	onResize,
	containerRef,
	handleSize = 6,
}: SelectionHandlesProps) {
	const { magnification } = useMagnification();

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
	}, [containerRef]);

	// Convert screen coords to canvas coords
	const toCanvasCoords = useCallback(
		(clientX: number, clientY: number) => {
			const offset = getContainerOffset();
			const padding = getContainerPadding();
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
