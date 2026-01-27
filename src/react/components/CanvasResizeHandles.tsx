import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUIStore } from "../context/state/uiStore";
import "./CanvasResizeHandles.css";

/**
 * Handle position constants for canvas resize handles
 * Matches the legacy Handles.js implementation
 */
const HANDLE_START = -1; // Top or left edge
const HANDLE_MIDDLE = 0; // Center (horizontal or vertical)
const HANDLE_END = 1; // Bottom or right edge

/**
 * Handle axis type - position along an axis
 */
type HandleAxis = typeof HANDLE_START | typeof HANDLE_MIDDLE | typeof HANDLE_END;

/**
 * Configuration for a single resize handle
 */
interface HandleConfig {
  /** Horizontal axis position */
  xAxis: HandleAxis;
  /** Vertical axis position */
  yAxis: HandleAxis;
}

/**
 * 8 resize handles around the canvas
 * Order matches legacy Handles.js implementation
 */
const HANDLE_CONFIGS: HandleConfig[] = [
  { yAxis: HANDLE_START, xAxis: HANDLE_END }, // top-right (↗)
  { yAxis: HANDLE_START, xAxis: HANDLE_MIDDLE }, // top (↑)
  { yAxis: HANDLE_START, xAxis: HANDLE_START }, // top-left (↖)
  { yAxis: HANDLE_MIDDLE, xAxis: HANDLE_START }, // left (←)
  { yAxis: HANDLE_END, xAxis: HANDLE_START }, // bottom-left (↙)
  { yAxis: HANDLE_END, xAxis: HANDLE_MIDDLE }, // bottom (↓)
  { yAxis: HANDLE_END, xAxis: HANDLE_END }, // bottom-right (↘)
  { yAxis: HANDLE_MIDDLE, xAxis: HANDLE_END }, // right (→)
];

/**
 * Props for CanvasResizeHandles component
 */
interface CanvasResizeHandlesProps {
  /** Current canvas width in pixels */
  canvasWidth: number;
  /** Current canvas height in pixels */
  canvasHeight: number;
  /** Callback when canvas is resized */
  onResize: (width: number, height: number) => void;
  /** Reference to canvas container element for coordinate calculation */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Gets the appropriate cursor style for a resize handle
 * Based on handle position (corner vs edge vs middle).
 *
 * @param {HandleAxis} xAxis - Horizontal axis position
 * @param {HandleAxis} yAxis - Vertical axis position
 * @returns {string} CSS cursor value
 */
function getCursor(xAxis: HandleAxis, yAxis: HandleAxis): string {
  if ((xAxis === HANDLE_START && yAxis === HANDLE_START) || (xAxis === HANDLE_END && yAxis === HANDLE_END)) {
    return "nwse-resize";
  }
  if ((xAxis === HANDLE_END && yAxis === HANDLE_START) || (xAxis === HANDLE_START && yAxis === HANDLE_END)) {
    return "nesw-resize";
  }
  if (xAxis === HANDLE_MIDDLE && yAxis !== HANDLE_MIDDLE) return "ns-resize";
  if (yAxis === HANDLE_MIDDLE && xAxis !== HANDLE_MIDDLE) return "ew-resize";
  return "default";
}

/** Cached padding type */
interface Padding {
  left: number;
  top: number;
}

/**
 * CanvasResizeHandles component - Resize handles for canvas
 * Provides draggable handles around the canvas to resize it, matching MS Paint behavior.
 * Includes intelligent grab regions for easier interaction.
 *
 * Features:
 * - Size-only mode (like MS Paint): only bottom and right handles work
 * - Top and left handles are visible but inactive ("useless")
 * - Ghost preview during resize (dashed outline)
 * - Pointer capture for reliable drag tracking
 * - Intelligent grab regions (larger hit areas for easier grabbing)
 * - Magnification support with dynamic positioning
 * - Minimum size enforcement (1x1 pixel)
 *
 * The handles appear around the canvas edges and allow the user to
 * drag to resize. In "size-only" mode (matching MS Paint), only the
 * bottom and right handles actually resize - dragging top or left
 * handles does nothing.
 *
 * @param {CanvasResizeHandlesProps} props - Component props
 * @returns {JSX.Element} Canvas resize handles with ghost preview
 *
 * @example
 * <CanvasResizeHandles
 *   canvasWidth={512}
 *   canvasHeight={384}
 *   onResize={(width, height) => setCanvasSize(width, height)}
 *   containerRef={canvasAreaRef}
 * />
 */
export function CanvasResizeHandles({ canvasWidth, canvasHeight, onResize, containerRef }: CanvasResizeHandlesProps) {
  const magnification = useUIStore((state) => state.magnification);
  const [isDragging, setIsDragging] = useState(false);
  const [ghostRect, setGhostRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Cached padding to avoid calling getComputedStyle repeatedly
  const paddingRef = useRef<Padding>({ left: 0, top: 0 });

  // Render counter to trigger re-renders when padding needs update
  const [renderKey, setRenderKey] = useState(0);

  const dragStateRef = useRef<{
    xAxis: HandleAxis;
    yAxis: HandleAxis;
    startMouseX: number;
    startMouseY: number;
    originalRect: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Store refs for stable event handlers (avoids recreating window listeners)
  const magnificationRef = useRef(magnification);
  const ghostRectRef = useRef(ghostRect);
  const onResizeRef = useRef(onResize);

  // Keep refs in sync with current values
  magnificationRef.current = magnification;
  ghostRectRef.current = ghostRect;
  onResizeRef.current = onResize;

  // Update cached padding when container or dimensions change
  useEffect(() => {
    const updatePadding = () => {
      const container = containerRef.current;
      if (!container) return;
      const styles = window.getComputedStyle(container);
      paddingRef.current = {
        left: parseFloat(styles.paddingLeft) || 0,
        top: parseFloat(styles.paddingTop) || 0,
      };
      setRenderKey((n) => n + 1);
    };

    // Use requestAnimationFrame to ensure DOM has painted
    const rafId = requestAnimationFrame(updatePadding);
    return () => cancelAnimationFrame(rafId);
  }, [containerRef, canvasWidth, canvasHeight, magnification]);

  // Force recalculation on mount after containerRef becomes available
  useEffect(() => {
    let rafId2: number | null = null;

    const rafId1 = requestAnimationFrame(() => {
      if (containerRef.current) {
        const styles = window.getComputedStyle(containerRef.current);
        paddingRef.current = {
          left: parseFloat(styles.paddingLeft) || 0,
          top: parseFloat(styles.paddingTop) || 0,
        };
        setRenderKey((n) => n + 1);
      } else {
        rafId2 = requestAnimationFrame(() => {
          if (containerRef.current) {
            const styles = window.getComputedStyle(containerRef.current);
            paddingRef.current = {
              left: parseFloat(styles.paddingLeft) || 0,
              top: parseFloat(styles.paddingTop) || 0,
            };
            setRenderKey((n) => n + 1);
          }
        });
      }
    });

    return () => {
      cancelAnimationFrame(rafId1);
      if (rafId2 != null) cancelAnimationFrame(rafId2);
    };
  }, [containerRef]);

  const handlePointerDown = useCallback(
    (xAxis: HandleAxis, yAxis: HandleAxis, e: React.PointerEvent) => {
      // In size-only mode, ignore top and left handles
      if (yAxis === HANDLE_START || xAxis === HANDLE_START) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      dragStateRef.current = {
        xAxis,
        yAxis,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        originalRect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      };

      // Capture pointer
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Add cursor to body
      document.body.style.cursor = getCursor(xAxis, yAxis);
      document.body.classList.add("cursor-bully");
    },
    [canvasWidth, canvasHeight],
  );

  // Stable pointer move handler using refs
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragStateRef.current) return;

    const { xAxis, yAxis, startMouseX, startMouseY, originalRect } = dragStateRef.current;
    const mag = magnificationRef.current;

    // Get mouse position in canvas coordinates
    const mouseCanvasX = (e.clientX - startMouseX) / mag;
    const mouseCanvasY = (e.clientY - startMouseY) / mag;

    let deltaX = 0;
    let deltaY = 0;
    let width = originalRect.width;
    let height = originalRect.height;

    // Calculate new dimensions based on handle being dragged
    if (xAxis === HANDLE_END) {
      deltaX = 0;
      width = Math.floor(originalRect.width + mouseCanvasX);
    } else if (xAxis === HANDLE_START) {
      deltaX = Math.floor(mouseCanvasX);
      width = Math.floor(originalRect.width - mouseCanvasX);
    }

    if (yAxis === HANDLE_END) {
      deltaY = 0;
      height = Math.floor(originalRect.height + mouseCanvasY);
    } else if (yAxis === HANDLE_START) {
      deltaY = Math.floor(mouseCanvasY);
      height = Math.floor(originalRect.height - mouseCanvasY);
    }

    const newRect = {
      x: Math.min(originalRect.x + deltaX, originalRect.x + originalRect.width),
      y: Math.min(originalRect.y + deltaY, originalRect.y + originalRect.height),
      width: Math.max(1, width),
      height: Math.max(1, height),
    };

    setGhostRect(newRect);
  }, []);

  // Stable pointer up handler using refs
  const handlePointerUp = useCallback(() => {
    if (!dragStateRef.current) return;

    // Remove cursor from body
    document.body.style.cursor = "";
    document.body.classList.remove("cursor-bully");

    const rect = ghostRectRef.current;
    if (rect) {
      // Apply the resize - for size-only mode, we only change width/height
      onResizeRef.current(rect.width, rect.height);
    }

    setIsDragging(false);
    setGhostRect(null);
    dragStateRef.current = null;
  }, []);

  // Add global pointer event listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Get cached padding (no getComputedStyle call)
  const padding = paddingRef.current;

  // Calculate handle and grab region positions - matching Handles.js logic exactly
  const getHandlePositions = useCallback((xAxis: HandleAxis, yAxis: HandleAxis) => {
    const handleSize = 3;
    const grabSize = 32;
    const outset = 4; // Matches app.js canvas_handles outset: 4
    // Use cached padding (no getComputedStyle call)
    const offsetLeft = padding.left;
    const offsetTop = padding.top;

    const rect = { width: canvasWidth, height: canvasHeight };

    // Calculate positions for each axis
    const positions = { handle: { left: 0, top: 0 }, grabRegion: { left: 0, top: 0, width: 0, height: 0 } };

    // X-axis calculations - calculate middleStart first as it's needed for start_end
    let middleStartX = Math.max(
      (rect.width * magnification) / 2 - grabSize / 2,
      Math.min(grabSize / 2, (rect.width * magnification) / 3),
    );
    let middleEndX = rect.width * magnification - middleStartX;
    if (middleEndX - middleStartX < magnification) {
      middleStartX = 0;
      middleEndX = magnification;
    }

    const startStartX = -grabSize / 2;
    const startEndX = Math.min(grabSize / 2, middleStartX);
    const endStartX = rect.width * magnification - startEndX;
    const endEndX = rect.width * magnification - startStartX;

    // size_only mode: extend middle regions left into unused space of useless handles
    // (Must happen after middleStartX is used for startEndX calculation above)
    // See Handles.js lines 209-213
    const sizeOnlyMiddleStartX = Math.max(-offsetLeft, Math.min(middleStartX, middleEndX - grabSize));

    if (xAxis === HANDLE_START) {
      positions.handle.left = offsetLeft - outset;
      positions.grabRegion.left = startStartX + offsetLeft;
      positions.grabRegion.width = startEndX - startStartX;
    } else if (xAxis === HANDLE_MIDDLE) {
      positions.handle.left = (rect.width * magnification - handleSize) / 2 + offsetLeft;
      positions.grabRegion.left = sizeOnlyMiddleStartX + offsetLeft;
      positions.grabRegion.width = middleEndX - sizeOnlyMiddleStartX;
    } else {
      // HANDLE_END
      // Match legacy Handles.js: offset + (rect.width * magnification - hs / 2)
      // Centers handle on the canvas edge
      positions.handle.left = rect.width * magnification - handleSize / 2 + offsetLeft;
      positions.grabRegion.left = endStartX + offsetLeft;
      positions.grabRegion.width = endEndX - endStartX;
    }

    // Y-axis calculations - calculate middleStart first as it's needed for start_end
    let middleStartY = Math.max(
      (rect.height * magnification) / 2 - grabSize / 2,
      Math.min(grabSize / 2, (rect.height * magnification) / 3),
    );
    let middleEndY = rect.height * magnification - middleStartY;
    if (middleEndY - middleStartY < magnification) {
      middleStartY = 0;
      middleEndY = magnification;
    }

    const startStartY = -grabSize / 2;
    const startEndY = Math.min(grabSize / 2, middleStartY);
    const endStartY = rect.height * magnification - startEndY;
    const endEndY = rect.height * magnification - startStartY;

    // size_only mode: extend middle regions up into unused space of useless handles
    // See Handles.js lines 209-213
    const sizeOnlyMiddleStartY = Math.max(-offsetTop, Math.min(middleStartY, middleEndY - grabSize));

    if (yAxis === HANDLE_START) {
      positions.handle.top = offsetTop - outset;
      positions.grabRegion.top = startStartY + offsetTop;
      positions.grabRegion.height = startEndY - startStartY;
    } else if (yAxis === HANDLE_MIDDLE) {
      positions.handle.top = (rect.height * magnification - handleSize) / 2 + offsetTop;
      positions.grabRegion.top = sizeOnlyMiddleStartY + offsetTop;
      positions.grabRegion.height = middleEndY - sizeOnlyMiddleStartY;
    } else {
      // HANDLE_END
      // Match legacy Handles.js: offset + (rect.height * magnification - hs / 2)
      // Centers handle on the canvas edge
      positions.handle.top = rect.height * magnification - handleSize / 2 + offsetTop;
      positions.grabRegion.top = endStartY + offsetTop;
      positions.grabRegion.height = endEndY - endStartY;
    }

    return positions;
  };

  // Render resize ghost outline when dragging - matching Handles.js
  const ghostStyle: React.CSSProperties | undefined = ghostRect
    ? {
        position: "absolute",
        left: `${ghostRect.x * magnification + getContainerPadding().left}px`,
        top: `${ghostRect.y * magnification + getContainerPadding().top}px`,
        width: `${ghostRect.width * magnification - 2}px`,
        height: `${ghostRect.height * magnification - 2}px`,
        pointerEvents: "none",
        zIndex: 100,
      }
    : undefined;

  return (
    <>
      {/* Resize ghost outline */}
      {ghostStyle && <div className="resize-ghost" style={ghostStyle} />}

      {/* Resize handles with grab regions */}
      {HANDLE_CONFIGS.map(({ xAxis, yAxis }, index) => {
        // In size-only mode, top and left handles are "useless" but still visible
        const isUseless = yAxis === HANDLE_START || xAxis === HANDLE_START;
        const positions = getHandlePositions(xAxis, yAxis);
        const cursor = getCursor(xAxis, yAxis);
        const isMiddle = xAxis === HANDLE_MIDDLE || yAxis === HANDLE_MIDDLE;

        const handleStyle: React.CSSProperties = {
          left: `${positions.handle.left}px`,
          top: `${positions.handle.top}px`,
        };

        const grabRegionStyle: React.CSSProperties = {
          left: `${positions.grabRegion.left}px`,
          top: `${positions.grabRegion.top}px`,
          width: `${positions.grabRegion.width}px`,
          height: `${positions.grabRegion.height}px`,
          cursor,
        };

        return (
          <React.Fragment key={index}>
            <div className={`canvas-resize-handle ${isUseless ? "useless-handle" : ""}`} style={handleStyle} />
            {!isUseless && (
              <div
                className={`canvas-resize-grab-region ${isMiddle ? "is-middle" : ""}`}
                style={grabRegionStyle}
                onPointerDown={(e) => handlePointerDown(xAxis, yAxis, e)}
                onMouseDown={(e) => e.preventDefault()}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
