/**
 * Resizable split pane component for the Help window.
 * Allows dragging a divider to resize the left and right panels.
 */
import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";

export interface ResizableSplitPaneProps {
	/** Left panel content */
	left: ReactNode;
	/** Right panel content */
	right: ReactNode;
	/** Initial width of left panel in pixels */
	initialLeftWidth?: number;
	/** Minimum width of left panel */
	minLeftWidth?: number;
	/** Minimum width of right panel */
	minRightWidth?: number;
	/** Whether the left panel is visible */
	leftVisible?: boolean;
}

const RESIZER_WIDTH = 4;

export function ResizableSplitPane({
	left,
	right,
	initialLeftWidth = 200,
	minLeftWidth = 100,
	minRightWidth = 200,
	leftVisible = true,
}: ResizableSplitPaneProps) {
	const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
	const [isDragging, setIsDragging] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);
	const pointerIdRef = useRef<number | null>(null);

	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (pointerIdRef.current !== e.pointerId || !containerRef.current) return;

			const containerRect = containerRef.current.getBoundingClientRect();
			const maxLeftWidth = containerRect.width - minRightWidth - RESIZER_WIDTH;
			const newWidth = Math.max(
				minLeftWidth,
				Math.min(maxLeftWidth, startWidthRef.current + (e.clientX - startXRef.current)),
			);

			setLeftWidth(newWidth);
		},
		[minLeftWidth, minRightWidth],
	);

	const handlePointerUp = useCallback(
		(e: PointerEvent) => {
			if (pointerIdRef.current !== e.pointerId) return;

			pointerIdRef.current = null;
			setIsDragging(false);
			document.body.classList.remove("resizing");

			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("pointercancel", handlePointerUp);
		},
		[handlePointerMove],
	);

	const handleResizerPointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();

			startXRef.current = e.clientX;
			startWidthRef.current = leftWidth;
			pointerIdRef.current = e.pointerId;

			setIsDragging(true);
			document.body.classList.add("resizing");

			window.addEventListener("pointermove", handlePointerMove);
			window.addEventListener("pointerup", handlePointerUp);
			window.addEventListener("pointercancel", handlePointerUp);
		},
		[leftWidth, handlePointerMove, handlePointerUp],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("pointercancel", handlePointerUp);
			document.body.classList.remove("resizing");
		};
	}, [handlePointerMove, handlePointerUp]);

	return (
		<div
			ref={containerRef}
			className={`help-split-pane ${isDragging ? "dragging" : ""}`}
		>
			{leftVisible && (
				<>
					<div
						className="help-split-pane-left"
						style={{ flexBasis: leftWidth, flexShrink: 0 }}
					>
						{left}
					</div>
					<div
						className="help-split-pane-resizer"
						onPointerDown={handleResizerPointerDown}
						style={{
							width: RESIZER_WIDTH,
							cursor: "ew-resize",
							touchAction: "none",
						}}
					/>
				</>
			)}
			<div className="help-split-pane-right">{right}</div>
		</div>
	);
}

export default ResizableSplitPane;
