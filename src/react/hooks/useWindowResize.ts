/**
 * useWindowResize Hook
 *
 * Manages window resize handles and drag-to-resize functionality.
 * Supports 8-directional resizing with minimum size constraints.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseWindowResizeParams {
	/** Initial window width */
	initialWidth: number;
	/** Initial window height */
	initialHeight: number;
	/** Minimum window width (default: 200) */
	minWidth?: number;
	/** Minimum window height (default: 150) */
	minHeight?: number;
	/** Initial window position */
	initialPosition?: { left: number; top: number };
}

interface ResizeState {
	direction: ResizeDirection;
	startX: number;
	startY: number;
	originalLeft: number;
	originalTop: number;
	originalWidth: number;
	originalHeight: number;
}

/**
 * Hook for window resize functionality
 *
 * @param params - Configuration parameters
 * @returns Window resize state and handlers
 */
export function useWindowResize({
	initialWidth,
	initialHeight,
	minWidth = 200,
	minHeight = 150,
	initialPosition = { left: 100, top: 100 },
}: UseWindowResizeParams) {
	const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
	const [position, setPosition] = useState(initialPosition);
	const [isResizing, setIsResizing] = useState(false);
	const resizeStateRef = useRef<ResizeState | null>(null);

	/**
	 * Start resizing in the specified direction
	 */
	const handleResizeStart = useCallback((e: React.PointerEvent, direction: ResizeDirection) => {
		e.preventDefault();
		e.stopPropagation();

		setIsResizing(true);
		resizeStateRef.current = {
			direction,
			startX: e.clientX,
			startY: e.clientY,
			originalLeft: position.left,
			originalTop: position.top,
			originalWidth: size.width,
			originalHeight: size.height,
		};

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		document.body.classList.add("cursor-bully");
	}, [position, size]);

	/**
	 * Handle pointer move during resize
	 */
	const handlePointerMove = useCallback((e: PointerEvent) => {
		if (!isResizing || !resizeStateRef.current) return;

		const { direction, startX, startY, originalLeft, originalTop, originalWidth, originalHeight } = resizeStateRef.current;
		const deltaX = e.clientX - startX;
		const deltaY = e.clientY - startY;

		let newLeft = originalLeft;
		let newTop = originalTop;
		let newWidth = originalWidth;
		let newHeight = originalHeight;

		// Handle north resize (top edge)
		if (direction.includes('n')) {
			newTop = originalTop + deltaY;
			newHeight = Math.max(minHeight, originalHeight - deltaY);
			// Prevent going beyond original position when hitting min height
			if (newHeight === minHeight) {
				newTop = originalTop + originalHeight - minHeight;
			}
		}

		// Handle south resize (bottom edge)
		if (direction.includes('s')) {
			newHeight = Math.max(minHeight, originalHeight + deltaY);
		}

		// Handle west resize (left edge)
		if (direction.includes('w')) {
			newLeft = originalLeft + deltaX;
			newWidth = Math.max(minWidth, originalWidth - deltaX);
			// Prevent going beyond original position when hitting min width
			if (newWidth === minWidth) {
				newLeft = originalLeft + originalWidth - minWidth;
			}
		}

		// Handle east resize (right edge)
		if (direction.includes('e')) {
			newWidth = Math.max(minWidth, originalWidth + deltaX);
		}

		setPosition({ left: newLeft, top: newTop });
		setSize({ width: newWidth, height: newHeight });
	}, [isResizing, minWidth, minHeight]);

	/**
	 * Handle pointer up to end resize
	 */
	const handlePointerUp = useCallback(() => {
		if (!isResizing) return;

		setIsResizing(false);
		resizeStateRef.current = null;
		document.body.classList.remove("cursor-bully");
	}, [isResizing]);

	// Add global listeners during resize
	useEffect(() => {
		if (!isResizing) return;

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		};
	}, [isResizing, handlePointerMove, handlePointerUp]);

	return {
		size,
		setSize,
		position,
		setPosition,
		isResizing,
		handleResizeStart,
	};
}
