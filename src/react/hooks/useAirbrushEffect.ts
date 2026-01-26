/**
 * Airbrush Effect Hook
 *
 * Manages continuous airbrush painting when the mouse is held down.
 * Creates a spray effect by repeatedly calling the airbrush drawing function
 * at regular intervals (every 5ms).
 */

import { RefObject, useEffect } from "react";
import { TOOL_IDS } from "../context/state/types";
import { useCanvasDrawing } from "./useCanvasDrawing";
import { useCanvasShapes } from "./useCanvasShapes";

interface UseAirbrushEffectParams {
  canvasRef: RefObject<HTMLCanvasElement>;
  selectedToolId: string;
  drawing: ReturnType<typeof useCanvasDrawing>;
  shapes: ReturnType<typeof useCanvasShapes>;
}

/**
 * Hook to manage continuous airbrush painting effect
 *
 * When the airbrush tool is active and the mouse is held down,
 * this hook sets up an interval to continuously spray paint at the cursor position.
 *
 * @param params - Configuration object
 * @param params.canvasRef - Reference to the canvas element
 * @param params.selectedToolId - Currently selected tool ID
 * @param params.drawing - Drawing hook instance
 * @param params.shapes - Shapes hook instance (contains drawing state)
 */
export function useAirbrushEffect({ canvasRef, selectedToolId, drawing, shapes }: UseAirbrushEffectParams) {
  useEffect(() => {
    // Only activate for airbrush tool when drawing
    // Note: We check shapes.drawingState.current inside the effect, not in dependencies
    // because .current is a mutable ref and shouldn't be in the dependency array
    if (selectedToolId !== TOOL_IDS.AIRBRUSH) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Set up interval for continuous painting (every 5ms, matching original implementation)
    const intervalId = setInterval(() => {
      // Check drawing state inside the interval callback
      const state = shapes.drawingState.current;
      if (!state?.isDrawing) {
        return;
      }

      const { lastX, lastY, button } = state;
      const color = drawing.getDrawColor(button);
      const size = drawing.getToolSize();

      // Spray airbrush at current position
      drawing.sprayAirbrush(ctx, lastX, lastY, color, size);
    }, 5);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedToolId, canvasRef, drawing, shapes]);
}
