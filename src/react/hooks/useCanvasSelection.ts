import { useCallback, RefObject } from "react";
import { useColors } from "../context/state/useColors";
import { useHistory } from "../context/state/useHistory";
import { useSelection } from "../context/state/useSelection";
import { useSelectionAnimation } from "./useSelectionAnimation";
import { useRectangularSelection } from "./useRectangularSelection";
import { useFreeFormSelection } from "./useFreeFormSelection";

export interface SelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  freeFormPoints: Array<{ x: number; y: number }>;
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
}

interface UseCanvasSelectionProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  getCanvasCoords: (e: { clientX: number; clientY: number }) => { x: number; y: number };
}

/**
 * Hook for handling canvas selection tools (rectangular and free-form)
 *
 * This is a facade hook that composes three specialized hooks:
 * - useSelectionAnimation: Marching ants animation effect
 * - useRectangularSelection: Rectangular selection logic
 * - useFreeFormSelection: Free-form/lasso selection logic
 *
 * Provides a unified interface for:
 * - Starting and finalizing selections
 * - Moving/dragging selections
 * - Checking if selection is active
 * - Accessing selection state and clearing
 *
 * @param {UseCanvasSelectionProps} props - Hook configuration
 * @param {RefObject<HTMLCanvasElement | null>} props.canvasRef - Reference to main canvas
 * @param {RefObject<HTMLCanvasElement | null>} props.overlayRef - Reference to selection overlay
 * @param {Function} props.getCanvasCoords - Function to convert screen coords to canvas coords
 * @returns {Object} Selection control functions and state
 *
 * @example
 * const selection = useCanvasSelection({ canvasRef, overlayRef, getCanvasCoords });
 * // Start rectangular selection
 * selection.startRectangularSelection(x, y, ctx);
 * // Move selection
 * selection.handleSelectionMove(x, y, true); // true = rectangular
 * // Finalize
 * selection.finalizeRectangularSelection(x, y, ctx);
 */
export function useCanvasSelection({ canvasRef, overlayRef, getCanvasCoords }: UseCanvasSelectionProps) {
  const { secondaryColor } = useColors();
  const { saveState } = useHistory();
  const { selection, setSelection, clearSelection } = useSelection();

  // Marching ants animation
  useSelectionAnimation({ selection, overlayRef });

  // Rectangular selection logic
  const rectangularSelection = useRectangularSelection({
    canvasRef,
    overlayRef,
    selection,
    secondaryColor,
    setSelection,
    clearSelection,
    saveState,
  });

  // Free-form selection logic
  const freeFormSelection = useFreeFormSelection({
    canvasRef,
    overlayRef,
    selection,
    secondaryColor,
    setSelection,
    clearSelection,
    saveState,
  });

  /**
   * Start a rectangular selection
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @returns {boolean} True if dragging existing selection
   */
  const startRectangularSelection = useCallback(
    (x: number, y: number, ctx: CanvasRenderingContext2D): boolean => {
      return rectangularSelection.start(x, y, ctx);
    },
    [rectangularSelection],
  );

  /**
   * Finalize a rectangular selection
   * @param {number} x - Final mouse X coordinate
   * @param {number} y - Final mouse Y coordinate
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  const finalizeRectangularSelection = useCallback(
    (x: number, y: number, ctx: CanvasRenderingContext2D): void => {
      rectangularSelection.finalize(x, y, ctx);
    },
    [rectangularSelection],
  );

  /**
   * Start a free-form selection
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @returns {boolean} True if dragging existing selection
   */
  const startFreeFormSelection = useCallback(
    (x: number, y: number, ctx: CanvasRenderingContext2D): boolean => {
      return freeFormSelection.start(x, y, ctx);
    },
    [freeFormSelection],
  );

  /**
   * Finalize a free-form selection
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  const finalizeFreeFormSelection = useCallback(
    (ctx: CanvasRenderingContext2D): void => {
      freeFormSelection.finalize(ctx);
    },
    [freeFormSelection],
  );

  /**
   * Handle selection movement (drag or preview update)
   * @param {number} x - Current mouse X coordinate
   * @param {number} y - Current mouse Y coordinate
   * @param {boolean} isRectangular - True for rectangular, false for free-form
   */
  const handleSelectionMove = useCallback(
    (x: number, y: number, isRectangular: boolean): void => {
      if (isRectangular) {
        rectangularSelection.move(x, y);
      } else {
        freeFormSelection.move(x, y);
      }
    },
    [rectangularSelection, freeFormSelection],
  );

  /**
   * Check if currently selecting or dragging
   * @returns {boolean} True if any selection operation is active
   */
  const isActive = useCallback((): boolean => {
    return rectangularSelection.isActive() || freeFormSelection.isActive();
  }, [rectangularSelection, freeFormSelection]);

  /**
   * Cancel current selection operation (clear preview and reset state)
   */
  const cancelSelection = useCallback((): void => {
    rectangularSelection.cancel();
    freeFormSelection.cancel();
  }, [rectangularSelection, freeFormSelection]);

  // Wrap clearSelection to also cancel any in-progress selection
  const clearSelectionWithCancel = useCallback((): void => {
    cancelSelection();
    clearSelection();
  }, [cancelSelection, clearSelection]);

  return {
    startRectangularSelection,
    startFreeFormSelection,
    handleSelectionMove,
    finalizeRectangularSelection,
    finalizeFreeFormSelection,
    isActive,
    cancelSelection,
    selection,
    clearSelection: clearSelectionWithCancel,
  };
}
