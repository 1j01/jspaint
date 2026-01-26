import { CSSProperties, forwardRef, useImperativeHandle, useRef } from "react";
import { useUIStore } from "../context/state/uiStore";

/**
 * Props for HelperLayer component
 */
interface HelperLayerProps {
  /** X position in canvas coordinates */
  x: number;
  /** Y position in canvas coordinates */
  y: number;
  /** Width in canvas pixels */
  width: number;
  /** Height in canvas pixels */
  height: number;
  /** Device pixel ratio for high-DPI rendering (default: 1) */
  pixelRatio?: number;
}

/**
 * Imperative handle exposed to parent components
 */
export interface HelperLayerHandle {
  /** Direct access to canvas element */
  canvas: HTMLCanvasElement | null;
  /** Get 2D rendering context */
  getContext: () => CanvasRenderingContext2D | null;
  /** Clear the entire canvas */
  clear: () => void;
}

/**
 * HelperLayer component - Overlay canvas for temporary drawing hints
 * Provides a transparent overlay canvas for rendering temporary visuals like:
 * - Shape tool previews (line, rectangle, ellipse during drag)
 * - Grid overlay
 * - Cursor crosshairs
 * - Other non-permanent drawing hints
 *
 * Port of legacy OnCanvasHelperLayer.js to React.
 *
 * Features:
 * - Positioned absolutely over the specified region
 * - Pointer events disabled (doesn't interfere with mouse input)
 * - Pixelated rendering for crisp pixels
 * - Exposes imperative handle for direct canvas manipulation
 * - Scales with magnification
 * - Supports high-DPI displays via pixelRatio
 *
 * @param {HelperLayerProps} props - Component props
 * @param {React.Ref<HelperLayerHandle>} ref - Forwarded ref exposing canvas and methods
 * @returns {JSX.Element} Overlay canvas element
 *
 * @example
 * const helperRef = useRef<HelperLayerHandle>(null);
 *
 * // Clear helper layer
 * helperRef.current?.clear();
 *
 * // Draw line preview
 * const ctx = helperRef.current?.getContext();
 * if (ctx) {
 *   ctx.strokeStyle = 'red';
 *   ctx.beginPath();
 *   ctx.moveTo(x1, y1);
 *   ctx.lineTo(x2, y2);
 *   ctx.stroke();
 * }
 *
 * <HelperLayer
 *   ref={helperRef}
 *   x={0}
 *   y={0}
 *   width={512}
 *   height={384}
 *   pixelRatio={window.devicePixelRatio}
 * />
 */
export const HelperLayer = forwardRef<HelperLayerHandle, HelperLayerProps>(function HelperLayer(
  { x, y, width, height, pixelRatio = 1 },
  ref,
) {
  const magnification = useUIStore((state) => state.magnification);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Expose imperative methods to parent
  useImperativeHandle(
    ref,
    () => ({
      canvas: canvasRef.current,
      getContext: () => canvasRef.current?.getContext("2d") ?? null,
      clear: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      },
    }),
    [],
  );

  const style: CSSProperties = {
    position: "absolute",
    left: x * magnification,
    top: y * magnification,
    width: width * magnification,
    height: height * magnification,
    pointerEvents: "none",
    imageRendering: "pixelated",
  };

  return (
    <canvas
      ref={canvasRef}
      className="helper-layer"
      width={width * pixelRatio}
      height={height * pixelRatio}
      style={style}
      aria-hidden="true"
    />
  );
});

export default HelperLayer;
