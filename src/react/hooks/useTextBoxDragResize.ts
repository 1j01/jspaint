/**
 * Custom hook for text box drag and resize operations
 * Extracted from CanvasTextBox to reduce complexity
 *
 * Handles:
 * - Container drag to move text box
 * - 8-handle resize with pointer capture
 * - Position and size updates
 * - Cursor management during operations
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { HANDLE_START, HANDLE_END, getCursor, type HandleAxis } from "../utils/resizeHandles";

/**
 * Parameters for the text box drag/resize hook
 */
interface UseTextBoxDragResizeParams {
  /** Current X position of text box */
  x: number;
  /** Current Y position of text box */
  y: number;
  /** Current width of text box */
  width: number;
  /** Current height of text box */
  height: number;
  /** Canvas magnification level (affects delta calculations) */
  magnification: number;
  /** Callback when text box is moved */
  onMove: (x: number, y: number) => void;
  /** Callback when text box is resized */
  onResize: (width: number, height: number) => void;
  /** Minimum size constraint (default: 20) */
  minSize?: number;
}

/**
 * State for tracking drag operations
 */
interface DragState {
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  originalWidth: number;
  originalHeight: number;
  xAxis?: HandleAxis;
  yAxis?: HandleAxis;
}

/**
 * Return type for the drag/resize hook
 */
interface UseTextBoxDragResizeReturn {
  /** Whether container is being dragged */
  isDragging: boolean;
  /** Whether resize handle is being dragged */
  isResizing: boolean;
  /** Handler for container pointer down (start drag) */
  handleContainerPointerDown: (e: React.PointerEvent<HTMLDivElement>, containerElement: HTMLDivElement | null) => void;
  /** Handler for resize handle pointer down (start resize) */
  handleResizePointerDown: (xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => void;
}

/**
 * Manages drag and resize operations for the text box
 *
 * @param params - Hook parameters
 * @returns Handlers and state for drag/resize operations
 *
 * @example
 * const { isDragging, isResizing, handleContainerPointerDown, handleResizePointerDown } =
 *   useTextBoxDragResize({
 *     x: textBox.x,
 *     y: textBox.y,
 *     width: textBox.width,
 *     height: textBox.height,
 *     magnification: 2,
 *     onMove: handleTextMove,
 *     onResize: handleTextResize,
 *   });
 */
export function useTextBoxDragResize({
  x,
  y,
  width,
  height,
  magnification,
  onMove,
  onResize,
  minSize = 20,
}: UseTextBoxDragResizeParams): UseTextBoxDragResizeReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  // Handle container drag (move)
  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, containerElement: HTMLDivElement | null) => {
      // Only drag if clicking on the container itself, not textarea or handles
      if (e.target !== containerElement) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originalX: x,
        originalY: y,
        originalWidth: width,
        originalHeight: height,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.cursor = "move";
      document.body.classList.add("cursor-bully");
    },
    [x, y, width, height],
  );

  // Handle resize handle drag
  const handleResizePointerDown = useCallback(
    (xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originalX: x,
        originalY: y,
        originalWidth: width,
        originalHeight: height,
        xAxis,
        yAxis,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.cursor = getCursor(xAxis, yAxis);
      document.body.classList.add("cursor-bully");
    },
    [x, y, width, height],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging && !isResizing) return;
      if (!dragStateRef.current) return;

      const deltaX = (e.clientX - dragStateRef.current.startX) / magnification;
      const deltaY = (e.clientY - dragStateRef.current.startY) / magnification;

      if (isDragging) {
        // Move the textbox
        onMove(
          Math.round(dragStateRef.current.originalX + deltaX),
          Math.round(dragStateRef.current.originalY + deltaY),
        );
      } else if (isResizing && dragStateRef.current.xAxis !== undefined && dragStateRef.current.yAxis !== undefined) {
        // Resize the textbox
        const { xAxis, yAxis, originalX, originalY, originalWidth, originalHeight } = dragStateRef.current;

        let newX = originalX;
        let newY = originalY;
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        // Handle horizontal resizing
        if (xAxis === HANDLE_START) {
          newX = originalX + deltaX;
          newWidth = originalWidth - deltaX;
        } else if (xAxis === HANDLE_END) {
          newWidth = originalWidth + deltaX;
        }

        // Handle vertical resizing
        if (yAxis === HANDLE_START) {
          newY = originalY + deltaY;
          newHeight = originalHeight - deltaY;
        } else if (yAxis === HANDLE_END) {
          newHeight = originalHeight + deltaY;
        }

        // Enforce minimum size
        if (newWidth < minSize) {
          if (xAxis === HANDLE_START) {
            newX = originalX + originalWidth - minSize;
          }
          newWidth = minSize;
        }
        if (newHeight < minSize) {
          if (yAxis === HANDLE_START) {
            newY = originalY + originalHeight - minSize;
          }
          newHeight = minSize;
        }

        // Update position if resizing from top or left
        if (xAxis === HANDLE_START || yAxis === HANDLE_START) {
          onMove(Math.round(newX), Math.round(newY));
        }

        onResize(Math.round(newWidth), Math.round(newHeight));
      }
    },
    [isDragging, isResizing, magnification, onMove, onResize, minSize],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging && !isResizing) return;

    setIsDragging(false);
    setIsResizing(false);
    dragStateRef.current = null;

    document.body.style.cursor = "";
    document.body.classList.remove("cursor-bully");
  }, [isDragging, isResizing]);

  // Add global pointer event listeners
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp]);

  return {
    isDragging,
    isResizing,
    handleContainerPointerDown,
    handleResizePointerDown,
  };
}
