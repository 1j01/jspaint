/**
 * Hook for making elements draggable by a handle (like a titlebar).
 * Implements Windows 98-style window dragging behavior similar to OS-GUI.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Initial position. If not provided, will be centered on first render */
  initialPosition?: Position;
  /** Whether dragging is enabled */
  enabled?: boolean;
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
}

interface UseDraggableReturn {
  /** Current position of the element */
  position: Position | null;
  /** Ref to attach to the draggable element */
  elementRef: React.RefObject<HTMLDivElement | null>;
  /** Props to spread on the drag handle (titlebar) */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    style: React.CSSProperties;
  };
  /** Whether currently dragging */
  isDragging: boolean;
  /** Center the element in the viewport */
  center: () => void;
  /** Programmatically set position */
  setPosition: (pos: Position) => void;
}

export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const { initialPosition, enabled = true, onDragStart, onDragEnd } = options;

  const elementRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Position | null>(initialPosition ?? null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag state refs (don't need to trigger re-renders)
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPointerIdRef = useRef<number | null>(null);

  // Center the element in the viewport
  const center = useCallback(() => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const x = Math.max(0, (window.innerWidth - rect.width) / 2);
    const y = Math.max(0, (window.innerHeight - rect.height) / 2);
    setPosition({ x, y });
  }, []);

  // Auto-center on mount if no initial position
  useEffect(() => {
    if (!initialPosition && elementRef.current) {
      // Use requestAnimationFrame to ensure element is rendered
      requestAnimationFrame(() => {
        center();
      });
    }
  }, [initialPosition, center]);

  // Handle pointer move during drag
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (dragPointerIdRef.current !== e.pointerId) return;

    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    setPosition({ x: newX, y: newY });
  }, []);

  // Handle pointer up to end drag
  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (dragPointerIdRef.current !== e.pointerId) return;

      dragPointerIdRef.current = null;
      setIsDragging(false);
      document.body.classList.remove("dragging");

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      // Keep titlebar in bounds
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const titlebarHeight = 30; // approximate
        let newY = rect.top;

        // Don't let titlebar go above viewport
        if (newY < 0) {
          newY = 0;
          setPosition((prev) => (prev ? { ...prev, y: newY } : null));
        }

        // Don't let titlebar go too far below viewport
        const maxY = window.innerHeight - titlebarHeight;
        if (newY > maxY) {
          newY = maxY;
          setPosition((prev) => (prev ? { ...prev, y: newY } : null));
        }
      }

      onDragEnd?.();
    },
    [handlePointerMove, onDragEnd],
  );

  // Handle pointer down on the drag handle (titlebar)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;

      // Don't drag if clicking on buttons
      if ((e.target as HTMLElement).closest("button")) return;

      e.preventDefault();

      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      dragPointerIdRef.current = e.pointerId;

      setIsDragging(true);
      document.body.classList.add("dragging");

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);

      onDragStart?.();
    },
    [enabled, handlePointerMove, handlePointerUp, onDragStart],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.classList.remove("dragging");
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    position,
    elementRef,
    handleProps: {
      onPointerDown: handlePointerDown,
      style: {
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "default",
      },
    },
    isDragging,
    center,
    setPosition,
  };
}

export default useDraggable;
