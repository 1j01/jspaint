import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMagnification } from "../context/AppContext";
import "./CanvasResizeHandles.css";

// Handle positions
const HANDLE_START = -1;
const HANDLE_MIDDLE = 0;
const HANDLE_END = 1;

type HandleAxis = typeof HANDLE_START | typeof HANDLE_MIDDLE | typeof HANDLE_END;

interface HandleConfig {
	xAxis: HandleAxis;
	yAxis: HandleAxis;
}

// 8 handles around the canvas (only bottom and right are active for size-only mode)
const HANDLE_CONFIGS: HandleConfig[] = [
	{ yAxis: HANDLE_START, xAxis: HANDLE_END }, // top-right (↗) - useless in size-only
	{ yAxis: HANDLE_START, xAxis: HANDLE_MIDDLE }, // top (↑) - useless in size-only
	{ yAxis: HANDLE_START, xAxis: HANDLE_START }, // top-left (↖) - useless in size-only
	{ yAxis: HANDLE_MIDDLE, xAxis: HANDLE_START }, // left (←) - useless in size-only
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
 * MS Paint behavior where you can drag the bottom/right edges to extend the canvas.
 *
 * In "size-only" mode (like MS Paint), only the bottom and right handles work,
 * allowing you to increase canvas size but not reposition it.
 */
export function CanvasResizeHandles({
	canvasWidth,
	canvasHeight,
	onResize,
	containerRef,
}: CanvasResizeHandlesProps) {
	const { magnification } = useMagnification();
	const [isDragging, setIsDragging] = useState(false);
	const [ghostRect, setGhostRect] = useState<{ width: number; height: number } | null>(null);
	const dragStateRef = useRef<{
		xAxis: HandleAxis;
		yAxis: HandleAxis;
		startX: number;
		startY: number;
		startWidth: number;
		startHeight: number;
	} | null>(null);

	const handlePointerDown = useCallback(
		(xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			// In size-only mode, ignore top and left handles
			if (yAxis === HANDLE_START || xAxis === HANDLE_START) {
				return;
			}

			setIsDragging(true);
			dragStateRef.current = {
				xAxis,
				yAxis,
				startX: e.clientX,
				startY: e.clientY,
				startWidth: canvasWidth,
				startHeight: canvasHeight,
			};

			// Capture pointer
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		},
		[canvasWidth, canvasHeight]
	);

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (!isDragging || !dragStateRef.current) return;

			const { xAxis, yAxis, startX, startY, startWidth, startHeight } = dragStateRef.current;

			// Calculate delta from start position
			const deltaX = (e.clientX - startX) / magnification;
			const deltaY = (e.clientY - startY) / magnification;

			let newWidth = startWidth;
			let newHeight = startHeight;

			// Only modify dimensions based on which handle is being dragged
			if (xAxis === HANDLE_END) {
				newWidth = Math.max(1, startWidth + deltaX);
			}
			if (yAxis === HANDLE_END) {
				newHeight = Math.max(1, startHeight + deltaY);
			}

			// Round to integers
			newWidth = Math.round(newWidth);
			newHeight = Math.round(newHeight);

			setGhostRect({ width: newWidth, height: newHeight });
		},
		[isDragging, magnification]
	);

	const handlePointerUp = useCallback(() => {
		if (!isDragging || !dragStateRef.current) return;

		if (ghostRect) {
			// Apply the resize
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

	// Calculate handle positions based on canvas size and magnification
	const getHandleStyle = (xAxis: HandleAxis, yAxis: HandleAxis): React.CSSProperties => {
		const offset = 4; // outset from canvas edges
		const handleSize = 6;

		let left = 0;
		let top = 0;

		// Horizontal position
		if (xAxis === HANDLE_START) {
			left = -offset;
		} else if (xAxis === HANDLE_MIDDLE) {
			left = (canvasWidth * magnification) / 2 - handleSize / 2;
		} else {
			// HANDLE_END
			left = canvasWidth * magnification + offset;
		}

		// Vertical position
		if (yAxis === HANDLE_START) {
			top = -offset;
		} else if (yAxis === HANDLE_MIDDLE) {
			top = (canvasHeight * magnification) / 2 - handleSize / 2;
		} else {
			// HANDLE_END
			top = canvasHeight * magnification + offset;
		}

		return {
			left: `${left}px`,
			top: `${top}px`,
			cursor: getCursor(xAxis, yAxis),
		};
	};

	// Render resize ghost outline when dragging
	const ghostStyle: React.CSSProperties | undefined = ghostRect
		? {
				position: "absolute",
				left: "0",
				top: "0",
				width: `${ghostRect.width * magnification}px`,
				height: `${ghostRect.height * magnification}px`,
				border: "1px dotted #000",
				pointerEvents: "none",
				zIndex: 100,
			}
		: undefined;

	return (
		<>
			{/* Resize ghost outline */}
			{ghostStyle && <div className="resize-ghost" style={ghostStyle} />}

			{/* Resize handles */}
			{HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => {
				// In size-only mode, hide top and left handles
				const isUseless = yAxis === HANDLE_START || xAxis === HANDLE_START;

				return (
					<div
						key={index}
						className={`canvas-resize-handle ${isUseless ? "useless-handle" : ""}`}
						style={getHandleStyle(xAxis, yAxis)}
						onPointerDown={(e) => handlePointerDown(xAxis, yAxis, e)}
					/>
				);
			})}
		</>
	);
}
