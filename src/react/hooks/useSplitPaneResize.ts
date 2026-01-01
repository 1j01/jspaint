/**
 * useSplitPaneResize Hook
 *
 * Manages split-pane resizer drag functionality.
 * Used for adjustable horizontal or vertical panes.
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSplitPaneResizeParams {
	/** Initial split position (left pane width for horizontal, top pane height for vertical) */
	initialPosition: number;
	/** Minimum position value */
	min?: number;
	/** Maximum position value */
	max?: number;
	/** Orientation: horizontal (left/right panes) or vertical (top/bottom panes) */
	orientation?: 'horizontal' | 'vertical';
}

interface SplitResizeState {
	startX: number;
	startY: number;
	originalPosition: number;
}

/**
 * Hook for split-pane resizer functionality
 *
 * @param params - Configuration parameters
 * @returns Split position state and handlers
 *
 * @example
 * const { splitPosition, setSplitPosition, handleSplitResizeStart } = useSplitPaneResize({
 *   initialPosition: 250,
 *   min: 100,
 *   max: 500,
 *   orientation: 'horizontal',
 * });
 */
export function useSplitPaneResize({
	initialPosition,
	min = 100,
	max = Infinity,
	orientation = 'horizontal',
}: UseSplitPaneResizeParams) {
	const [splitPosition, setSplitPosition] = useState(initialPosition);
	const [isSplitResizing, setIsSplitResizing] = useState(false);
	const splitResizeRef = useRef<SplitResizeState | null>(null);

	/**
	 * Start split pane resizing
	 */
	const handleSplitResizeStart = useCallback((e: React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setIsSplitResizing(true);
		splitResizeRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			originalPosition: splitPosition,
		};

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		document.body.classList.add("cursor-bully");
	}, [splitPosition]);

	/**
	 * Handle pointer move during split resize
	 */
	const handlePointerMove = useCallback((e: PointerEvent) => {
		if (!isSplitResizing || !splitResizeRef.current) return;

		const delta = orientation === 'horizontal'
			? e.clientX - splitResizeRef.current.startX
			: e.clientY - splitResizeRef.current.startY;

		const newPosition = Math.max(
			min,
			Math.min(max, splitResizeRef.current.originalPosition + delta)
		);

		setSplitPosition(newPosition);
	}, [isSplitResizing, min, max, orientation]);

	/**
	 * Handle pointer up to end split resize
	 */
	const handlePointerUp = useCallback(() => {
		if (!isSplitResizing) return;

		setIsSplitResizing(false);
		splitResizeRef.current = null;
		document.body.classList.remove("cursor-bully");
	}, [isSplitResizing]);

	// Add global listeners during resize
	useEffect(() => {
		if (!isSplitResizing) return;

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [isSplitResizing, handlePointerMove, handlePointerUp]);

	return {
		splitPosition,
		setSplitPosition,
		isSplitResizing,
		handleSplitResizeStart,
	};
}
