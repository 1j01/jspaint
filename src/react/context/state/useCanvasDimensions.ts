/**
 * Get canvas dimensions and actions
 */
import { useCanvasStore } from "./canvasStore";

/**
 * Hook to access canvas dimensions and resize actions
 * @returns {{
 *   canvasWidth: number;
 *   canvasHeight: number;
 *   setCanvasSize: (width: number, height: number) => void;
 * }} Canvas dimensions and actions
 */
export function useCanvasDimensions() {
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const setCanvasSize = useCanvasStore((state) => state.setCanvasSize);

  return {
    canvasWidth,
    canvasHeight,
    setCanvasSize,
  };
}
