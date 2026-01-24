import { useEffect, useRef, RefObject } from "react";
import type { Selection } from "../context/state/types";
import { drawSelectionOverlay } from "../utils/selectionDrawing";

interface UseSelectionAnimationProps {
	selection: Selection | null;
	overlayRef: RefObject<HTMLCanvasElement | null>;
}

/**
 * Custom hook for marching ants animation on selection
 *
 * Provides the classic animated dashed outline effect for selections.
 * Automatically starts/stops animation based on selection state.
 *
 * Animation details:
 * - Updates every frame (60 FPS) using requestAnimationFrame
 * - Marching ants offset increments by 1 each frame, wrapping at 16
 * - Automatically clears overlay when no selection is active
 * - Cleans up animation frame on unmount
 *
 * @param {UseSelectionAnimationProps} props - Hook configuration
 * @param {Selection | null} props.selection - Current selection state (null if no selection)
 * @param {RefObject<HTMLCanvasElement | null>} props.overlayRef - Reference to the overlay canvas
 *
 * @example
 * useSelectionAnimation({ selection, overlayRef });
 * // Animation starts automatically when selection is set
 * // and stops when selection is cleared
 */
export function useSelectionAnimation({ selection, overlayRef }: UseSelectionAnimationProps) {
	const marchingAntsOffset = useRef(0);
	const animationFrameId = useRef<number | null>(null);

	// Clear overlay on mount
	useEffect(() => {
		const overlay = overlayRef.current;
		if (overlay) {
			const ctx = overlay.getContext("2d");
			if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
		}
	}, [overlayRef]);

	// Animate marching ants for selection
	useEffect(() => {
		if (!selection) {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
				animationFrameId.current = null;
			}
			// Clear overlay
			const overlay = overlayRef.current;
			if (overlay) {
				const ctx = overlay.getContext("2d");
				if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
			}
			return;
		}

		const overlay = overlayRef.current;
		if (!overlay) return;

		const ctx = overlay.getContext("2d");
		if (!ctx) return;

		const animate = () => {
			marchingAntsOffset.current = (marchingAntsOffset.current + 0.25) % 16;

			ctx.clearRect(0, 0, overlay.width, overlay.height);

			drawSelectionOverlay(ctx, selection, marchingAntsOffset.current);

			animationFrameId.current = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, [selection, overlayRef]);
}
