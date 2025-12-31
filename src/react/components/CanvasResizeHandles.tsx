import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMagnification } from "../context/AppContext";
import "./CanvasResizeHandles.css";

// Handle positions - matching Handles.js
const HANDLE_START = -1;
const HANDLE_MIDDLE = 0;
const HANDLE_END = 1;

type HandleAxis = typeof HANDLE_START | typeof HANDLE_MIDDLE | typeof HANDLE_END;

interface HandleConfig {
	xAxis: HandleAxis;
	yAxis: HandleAxis;
}

// 8 handles around the canvas - matching Handles.js order
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

interface CanvasResizeHandlesProps {
	canvasWidth: number;
	canvasHeight: number;
	onResize: (width: number, height: number) => void;
	containerRef: React.RefObject<HTMLDivElement>;
}

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
 * Canvas Resize Handles Component
 *
 * Provides draggable handles around the canvas to resize it, matching the original
 * MS Paint behavior with grab regions for easier interaction.
 *
 * In "size-only" mode (like MS Paint), only the bottom and right handles work.
 */
export function CanvasResizeHandles({
	canvasWidth,
	canvasHeight,
	onResize,
	containerRef,
}: CanvasResizeHandlesProps) {
	const { magnification } = useMagnification();
	const [isDragging, setIsDragging] = useState(false);
	const [ghostRect, setGhostRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
	const dragStateRef = useRef<{
		xAxis: HandleAxis;
		yAxis: HandleAxis;
		startMouseX: number;
		startMouseY: number;
		originalRect: { x: number; y: number; width: number; height: number };
	} | null>(null);

	const handlePointerDown = useCallback(
		(xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => {
			// In size-only mode, ignore top and left handles
			if (yAxis === HANDLE_START || xAxis === HANDLE_START) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			setIsDragging(true);
			dragStateRef.current = {
				xAxis,
				yAxis,
				startMouseX: e.clientX,
				startMouseY: e.clientY,
				originalRect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
			};

			// Capture pointer
			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			// Add cursor to body
			document.body.style.cursor = getCursor(xAxis, yAxis);
			document.body.classList.add("cursor-bully");
		},
		[canvasWidth, canvasHeight]
	);

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (!isDragging || !dragStateRef.current) return;

			const { xAxis, yAxis, startMouseX, startMouseY, originalRect } = dragStateRef.current;

			// Get mouse position in canvas coordinates
			const mouseCanvasX = (e.clientX - startMouseX) / magnification;
			const mouseCanvasY = (e.clientY - startMouseY) / magnification;

			let deltaX = 0;
			let deltaY = 0;
			let width = originalRect.width;
			let height = originalRect.height;

			// Calculate new dimensions based on handle being dragged
			if (xAxis === HANDLE_END) {
				deltaX = 0;
				width = Math.floor(originalRect.width + mouseCanvasX);
			} else if (xAxis === HANDLE_START) {
				deltaX = Math.floor(mouseCanvasX);
				width = Math.floor(originalRect.width - mouseCanvasX);
			}

			if (yAxis === HANDLE_END) {
				deltaY = 0;
				height = Math.floor(originalRect.height + mouseCanvasY);
			} else if (yAxis === HANDLE_START) {
				deltaY = Math.floor(mouseCanvasY);
				height = Math.floor(originalRect.height - mouseCanvasY);
			}

			let newRect = {
				x: originalRect.x + deltaX,
				y: originalRect.y + deltaY,
				width,
				height,
			};

			// Enforce minimum size
			newRect.width = Math.max(1, newRect.width);
			newRect.height = Math.max(1, newRect.height);

			// Constrain position
			newRect.x = Math.min(newRect.x, originalRect.x + originalRect.width);
			newRect.y = Math.min(newRect.y, originalRect.y + originalRect.height);

			setGhostRect(newRect);
		},
		[isDragging, magnification]
	);

	const handlePointerUp = useCallback(() => {
		if (!isDragging || !dragStateRef.current) return;

		// Remove cursor from body
		document.body.style.cursor = "";
		document.body.classList.remove("cursor-bully");

		if (ghostRect) {
			// Apply the resize - for size-only mode, we only change width/height
			onResize(ghostRect.width, ghostRect.height);
		}

		setIsDragging(false);
		setGhostRect(null);
		dragStateRef.current = null;
	}, [isDragging, ghostRect, onResize]);

	// Add global pointer event listeners when dragging
	useEffect(() => {
		if (!isDragging) return;

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [isDragging, handlePointerMove, handlePointerUp]);

	// Get container padding - matches SelectionHandles and CanvasTextBox approach
	const getContainerPadding = useCallback(() => {
		const container = containerRef.current;
		if (!container) return { left: 0, top: 0 };
		const styles = window.getComputedStyle(container);
		return {
			left: parseFloat(styles.paddingLeft) || 0,
			top: parseFloat(styles.paddingTop) || 0,
		};
	}, [containerRef]);

	// Calculate handle and grab region positions - matching Handles.js logic
	const getHandlePositions = (xAxis: HandleAxis, yAxis: HandleAxis) => {
		const handleSize = 3;
		const grabSize = 32;
		const outset = 0;
		// Get dynamic padding from .canvas-area
		const padding = getContainerPadding();
		const offsetLeft = padding.left;
		const offsetTop = padding.top;

		const rect = { width: canvasWidth, height: canvasHeight };

		// Calculate positions for each axis
		const positions = { handle: { left: 0, top: 0 }, grabRegion: { left: 0, top: 0, width: 0, height: 0 } };

		// X-axis calculations
		if (xAxis === HANDLE_START) {
			positions.handle.left = -outset + offsetLeft;
			positions.grabRegion.left = -grabSize / 2 + offsetLeft;
			positions.grabRegion.width = Math.min(grabSize / 2, rect.width * magnification / 3);
		} else if (xAxis === HANDLE_MIDDLE) {
			const middleStart = Math.max(
				rect.width * magnification / 2 - grabSize / 2,
				Math.min(grabSize / 2, rect.width * magnification / 3)
			);
			let middleEnd = rect.width * magnification - middleStart;
			if (middleEnd - middleStart < magnification) {
				positions.grabRegion.left = 0 + offsetLeft;
				positions.grabRegion.width = magnification;
			} else {
				positions.grabRegion.left = middleStart + offsetLeft;
				positions.grabRegion.width = middleEnd - middleStart;
			}
			positions.handle.left = (rect.width * magnification - handleSize) / 2 + offsetLeft;
		} else {
			// HANDLE_END
			positions.handle.left = rect.width * magnification - handleSize / 2 + offsetLeft;
			const startEnd = Math.min(grabSize / 2, rect.width * magnification / 3);
			const endStart = rect.width * magnification - startEnd;
			const endEnd = rect.width * magnification + grabSize / 2;
			positions.grabRegion.left = endStart + offsetLeft;
			positions.grabRegion.width = endEnd - endStart;
		}

		// Y-axis calculations
		if (yAxis === HANDLE_START) {
			positions.handle.top = -outset + offsetTop;
			positions.grabRegion.top = -grabSize / 2 + offsetTop;
			positions.grabRegion.height = Math.min(grabSize / 2, rect.height * magnification / 3);
		} else if (yAxis === HANDLE_MIDDLE) {
			const middleStart = Math.max(
				rect.height * magnification / 2 - grabSize / 2,
				Math.min(grabSize / 2, rect.height * magnification / 3)
			);
			let middleEnd = rect.height * magnification - middleStart;
			if (middleEnd - middleStart < magnification) {
				positions.grabRegion.top = 0 + offsetTop;
				positions.grabRegion.height = magnification;
			} else {
				positions.grabRegion.top = middleStart + offsetTop;
				positions.grabRegion.height = middleEnd - middleStart;
			}
			positions.handle.top = (rect.height * magnification - handleSize) / 2 + offsetTop;
		} else {
			// HANDLE_END
			positions.handle.top = rect.height * magnification - handleSize / 2 + offsetTop;
			const startEnd = Math.min(grabSize / 2, rect.height * magnification / 3);
			positions.grabRegion.top = rect.height * magnification - startEnd + offsetTop;
			positions.grabRegion.height = rect.height * magnification + grabSize / 2 - positions.grabRegion.top + offsetTop;
		}

		return positions;
	};

	// Render resize ghost outline when dragging - matching Handles.js
	const ghostStyle: React.CSSProperties | undefined = ghostRect
		? {
				position: "absolute",
				left: `${ghostRect.x * magnification + getContainerPadding().left}px`,
				top: `${ghostRect.y * magnification + getContainerPadding().top}px`,
				width: `${ghostRect.width * magnification - 2}px`,
				height: `${ghostRect.height * magnification - 2}px`,
				pointerEvents: "none",
				zIndex: 100,
			}
		: undefined;

	return (
		<>
			{/* Resize ghost outline */}
			{ghostStyle && <div className="resize-ghost" style={ghostStyle} />}

			{/* Resize handles with grab regions */}
			{HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => {
				// In size-only mode, top and left handles are "useless" but still visible
				const isUseless = yAxis === HANDLE_START || xAxis === HANDLE_START;
				const positions = getHandlePositions(xAxis, yAxis);
				const cursor = getCursor(xAxis, yAxis);
				const isMiddle = xAxis === HANDLE_MIDDLE || yAxis === HANDLE_MIDDLE;

				const handleStyle: React.CSSProperties = {
					left: `${positions.handle.left}px`,
					top: `${positions.handle.top}px`,
				};

				const grabRegionStyle: React.CSSProperties = {
					left: `${positions.grabRegion.left}px`,
					top: `${positions.grabRegion.top}px`,
					width: `${positions.grabRegion.width}px`,
					height: `${positions.grabRegion.height}px`,
					cursor,
				};

				return (
					<React.Fragment key={index}>
						<div
							className={`canvas-resize-handle ${isUseless ? "useless-handle" : ""}`}
							style={handleStyle}
						/>
						{!isUseless && (
							<div
								className={`canvas-resize-grab-region ${isMiddle ? "is-middle" : ""}`}
								style={grabRegionStyle}
								onPointerDown={(e) => handlePointerDown(xAxis, yAxis, e)}
								onMouseDown={(e) => e.preventDefault()}
							/>
						)}
					</React.Fragment>
				);
			})}
		</>
	);
}
