import { useEffect, useRef, RefObject } from "react";
import type { Selection } from "../context/state/types";
import { drawSelectionOverlay, applyTransparencyToImageData } from "../utils/selectionDrawing";
import { useSettingsStore } from "../context/state/settingsStore";
import { useColors } from "../context/state/useColors";

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

  // Get drawOpaque setting and secondary (background) color for transparent selection mode
  const drawOpaque = useSettingsStore((state) => state.drawOpaque);
  const { secondaryColor } = useColors();

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

    // Pre-process imageData for transparency mode (done once, not every frame)
    let displayImageData: ImageData | null = null;
    if (selection.imageData) {
      if (!drawOpaque) {
        // Transparent selection mode: make background-colored pixels transparent
        displayImageData = applyTransparencyToImageData(selection.imageData, secondaryColor);
      } else {
        displayImageData = selection.imageData;
      }
    }

    const animate = () => {
      marchingAntsOffset.current = (marchingAntsOffset.current + 0.25) % 16;

      ctx.clearRect(0, 0, overlay.width, overlay.height);

      // Draw selection imageData (the actual content) if it exists
      if (displayImageData) {
        ctx.putImageData(displayImageData, selection.x, selection.y);
      }

      drawSelectionOverlay(ctx, selection, marchingAntsOffset.current);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [selection, overlayRef, drawOpaque, secondaryColor]);
}
