/**
 * Hook for making windows resizable by dragging edges/corners.
 * Implements Windows 98-style window resizing behavior.
 */
import { useRef, useCallback, useEffect, useState } from "react";

export interface Size {
	width: number;
	height: number;
}

interface UseResizableOptions {
	/** Initial size */
	initialSize: Size;
	/** Minimum width */
	minWidth?: number;
	/** Minimum height */
	minHeight?: number;
	/** Whether resizing is enabled */
	enabled?: boolean;
	/** Callback when resize starts */
	onResizeStart?: () => void;
	/** Callback when resize ends */
	onResizeEnd?: (size: Size) => void;
}

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface ResizeHandleProps {
	onPointerDown: (e: React.PointerEvent) => void;
	style: React.CSSProperties;
}

interface UseResizableReturn {
	/** Current size of the element */
	size: Size;
	/** Set size programmatically */
	setSize: React.Dispatch<React.SetStateAction<Size>>;
	/** Props for each resize handle edge */
	resizeHandleProps: Record<ResizeEdge, ResizeHandleProps>;
	/** Whether currently resizing */
	isResizing: boolean;
	/** Position offset caused by resizing (for north/west edges) */
	positionOffset: { x: number; y: number };
	/** Reset position offset after applying to position */
	resetPositionOffset: () => void;
}

const HANDLE_SIZE = 6;

const edgeCursors: Record<ResizeEdge, string> = {
	n: "ns-resize",
	s: "ns-resize",
	e: "ew-resize",
	w: "ew-resize",
	ne: "nesw-resize",
	nw: "nwse-resize",
	se: "nwse-resize",
	sw: "nesw-resize",
};

export function useResizable(options: UseResizableOptions): UseResizableReturn {
	const { initialSize, minWidth = 200, minHeight = 100, enabled = true, onResizeStart, onResizeEnd } = options;

	const [size, setSize] = useState<Size>(initialSize);
	const [isResizing, setIsResizing] = useState(false);
	const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });

	// Resize state refs
	const startSizeRef = useRef<Size>({ width: 0, height: 0 });
	const startPosRef = useRef({ x: 0, y: 0 });
	const activeEdgeRef = useRef<ResizeEdge | null>(null);
	const pointerIdRef = useRef<number | null>(null);

	const resetPositionOffset = useCallback(() => {
		setPositionOffset({ x: 0, y: 0 });
	}, []);

	// Handle pointer move during resize
	const handlePointerMove = useCallback(
		(e: PointerEvent) => {
			if (pointerIdRef.current !== e.pointerId || !activeEdgeRef.current) return;

			const edge = activeEdgeRef.current;
			const deltaX = e.clientX - startPosRef.current.x;
			const deltaY = e.clientY - startPosRef.current.y;

			let newWidth = startSizeRef.current.width;
			let newHeight = startSizeRef.current.height;
			let offsetX = 0;
			let offsetY = 0;

			// Handle horizontal resizing
			if (edge.includes("e")) {
				newWidth = Math.max(minWidth, startSizeRef.current.width + deltaX);
			} else if (edge.includes("w")) {
				const proposedWidth = startSizeRef.current.width - deltaX;
				newWidth = Math.max(minWidth, proposedWidth);
				// Only offset if we actually resized
				if (proposedWidth >= minWidth) {
					offsetX = deltaX;
				} else {
					offsetX = startSizeRef.current.width - minWidth;
				}
			}

			// Handle vertical resizing
			if (edge.includes("s")) {
				newHeight = Math.max(minHeight, startSizeRef.current.height + deltaY);
			} else if (edge.includes("n")) {
				const proposedHeight = startSizeRef.current.height - deltaY;
				newHeight = Math.max(minHeight, proposedHeight);
				// Only offset if we actually resized
				if (proposedHeight >= minHeight) {
					offsetY = deltaY;
				} else {
					offsetY = startSizeRef.current.height - minHeight;
				}
			}

			setSize({ width: newWidth, height: newHeight });
			setPositionOffset({ x: offsetX, y: offsetY });
		},
		[minWidth, minHeight],
	);

	// Handle pointer up to end resize
	const handlePointerUp = useCallback(
		(e: PointerEvent) => {
			if (pointerIdRef.current !== e.pointerId) return;

			pointerIdRef.current = null;
			activeEdgeRef.current = null;
			setIsResizing(false);
			document.body.classList.remove("resizing");

			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("pointercancel", handlePointerUp);

			onResizeEnd?.(size);
		},
		[handlePointerMove, onResizeEnd, size],
	);

	// Create pointer down handler for a specific edge
	const createHandlePointerDown = useCallback(
		(edge: ResizeEdge) => (e: React.PointerEvent) => {
			if (!enabled) return;

			e.preventDefault();
			e.stopPropagation();

			startSizeRef.current = { ...size };
			startPosRef.current = { x: e.clientX, y: e.clientY };
			activeEdgeRef.current = edge;
			pointerIdRef.current = e.pointerId;

			setIsResizing(true);
			setPositionOffset({ x: 0, y: 0 });
			document.body.classList.add("resizing");

			window.addEventListener("pointermove", handlePointerMove);
			window.addEventListener("pointerup", handlePointerUp);
			window.addEventListener("pointercancel", handlePointerUp);

			onResizeStart?.();
		},
		[enabled, size, handlePointerMove, handlePointerUp, onResizeStart],
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

	// Generate props for each edge
	const resizeHandleProps: Record<ResizeEdge, ResizeHandleProps> = {
		n: {
			onPointerDown: createHandlePointerDown("n"),
			style: {
				position: "absolute",
				top: 0,
				left: HANDLE_SIZE,
				right: HANDLE_SIZE,
				height: HANDLE_SIZE,
				cursor: edgeCursors.n,
				touchAction: "none",
			},
		},
		s: {
			onPointerDown: createHandlePointerDown("s"),
			style: {
				position: "absolute",
				bottom: 0,
				left: HANDLE_SIZE,
				right: HANDLE_SIZE,
				height: HANDLE_SIZE,
				cursor: edgeCursors.s,
				touchAction: "none",
			},
		},
		e: {
			onPointerDown: createHandlePointerDown("e"),
			style: {
				position: "absolute",
				top: HANDLE_SIZE,
				right: 0,
				bottom: HANDLE_SIZE,
				width: HANDLE_SIZE,
				cursor: edgeCursors.e,
				touchAction: "none",
			},
		},
		w: {
			onPointerDown: createHandlePointerDown("w"),
			style: {
				position: "absolute",
				top: HANDLE_SIZE,
				left: 0,
				bottom: HANDLE_SIZE,
				width: HANDLE_SIZE,
				cursor: edgeCursors.w,
				touchAction: "none",
			},
		},
		ne: {
			onPointerDown: createHandlePointerDown("ne"),
			style: {
				position: "absolute",
				top: 0,
				right: 0,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				cursor: edgeCursors.ne,
				touchAction: "none",
			},
		},
		nw: {
			onPointerDown: createHandlePointerDown("nw"),
			style: {
				position: "absolute",
				top: 0,
				left: 0,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				cursor: edgeCursors.nw,
				touchAction: "none",
			},
		},
		se: {
			onPointerDown: createHandlePointerDown("se"),
			style: {
				position: "absolute",
				bottom: 0,
				right: 0,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				cursor: edgeCursors.se,
				touchAction: "none",
			},
		},
		sw: {
			onPointerDown: createHandlePointerDown("sw"),
			style: {
				position: "absolute",
				bottom: 0,
				left: 0,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				cursor: edgeCursors.sw,
				touchAction: "none",
			},
		},
	};

	return {
		size,
		setSize,
		resizeHandleProps,
		isResizing,
		positionOffset,
		resetPositionOffset,
	};
}

export default useResizable;
