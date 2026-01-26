/**
 * Virtual Cursor Hook
 * Provides smooth cursor animation for AI drawing visualization
 * Uses requestAnimationFrame for 60fps interpolated cursor movement
 */

import { useCallback, useRef } from "react";
import { useAIStore } from "../context/state/aiStore";

/**
 * Animation target for cursor movement
 */
interface CursorAnimationTarget {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTime: number;
  duration: number;
  toolIcon: string;
}

/**
 * Options for cursor animation
 */
export interface CursorAnimationOptions {
  /** Duration of animation in ms (default: 100) */
  duration?: number;
  /** Tool icon to display */
  toolIcon?: string;
}

/**
 * Hook for managing virtual cursor animation during AI command execution
 * Provides smooth interpolated cursor movement using requestAnimationFrame
 *
 * @returns {Object} Cursor animation controls
 * @returns {Function} animateTo - Animate cursor to a position
 * @returns {Function} moveTo - Instantly move cursor to a position
 * @returns {Function} show - Show the cursor at a position
 * @returns {Function} hide - Hide the cursor
 * @returns {Function} cancelAnimation - Cancel any running animation
 */
export function useVirtualCursor() {
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef<CursorAnimationTarget | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const showCursor = useAIStore((state) => state.showCursor);
  const hideCursor = useAIStore((state) => state.hideCursor);
  const setVirtualCursor = useAIStore((state) => state.setVirtualCursor);

  /**
   * Cancel any running animation
   */
  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
    targetRef.current = null;
  }, []);

  /**
   * Animation loop using requestAnimationFrame
   */
  const animate = useCallback(() => {
    const target = targetRef.current;
    if (!target) {
      animationRef.current = null;
      return;
    }

    const elapsed = performance.now() - target.startTime;
    const progress = Math.min(1, elapsed / target.duration);

    // Easing function: ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    const x = target.startX + (target.endX - target.startX) * eased;
    const y = target.startY + (target.endY - target.startY) * eased;

    setVirtualCursor({ x, y, visible: true, toolIcon: target.toolIcon });

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
      targetRef.current = null;
      if (resolveRef.current) {
        resolveRef.current();
        resolveRef.current = null;
      }
    }
  }, [setVirtualCursor]);

  /**
   * Animate cursor from current position to a new position
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @param {CursorAnimationOptions} options - Animation options
   * @returns {Promise<void>} Resolves when animation completes
   */
  const animateTo = useCallback(
    (x: number, y: number, options: CursorAnimationOptions = {}): Promise<void> => {
      return new Promise((resolve) => {
        const { duration = 100, toolIcon = "pencil" } = options;

        // Cancel any existing animation
        cancelAnimation();

        // Get current cursor position
        const currentCursor = useAIStore.getState().virtualCursor;
        const startX = currentCursor.visible ? currentCursor.x : x;
        const startY = currentCursor.visible ? currentCursor.y : y;

        // If already at target or very short duration, just set directly
        const distance = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        if (distance < 1 || duration < 16) {
          setVirtualCursor({ x, y, visible: true, toolIcon });
          resolve();
          return;
        }

        // Set up animation target
        targetRef.current = {
          startX,
          startY,
          endX: x,
          endY: y,
          startTime: performance.now(),
          duration,
          toolIcon,
        };

        resolveRef.current = resolve;

        // Start animation loop
        animationRef.current = requestAnimationFrame(animate);
      });
    },
    [animate, cancelAnimation, setVirtualCursor],
  );

  /**
   * Instantly move cursor to a position (no animation)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} toolIcon - Tool icon to display
   */
  const moveTo = useCallback(
    (x: number, y: number, toolIcon: string = "pencil") => {
      cancelAnimation();
      setVirtualCursor({ x, y, visible: true, toolIcon });
    },
    [cancelAnimation, setVirtualCursor],
  );

  /**
   * Show cursor at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} toolIcon - Tool icon to display
   */
  const show = useCallback(
    (x: number, y: number, toolIcon: string = "pencil") => {
      showCursor(x, y, toolIcon);
    },
    [showCursor],
  );

  /**
   * Hide the virtual cursor
   */
  const hide = useCallback(() => {
    cancelAnimation();
    hideCursor();
  }, [cancelAnimation, hideCursor]);

  /**
   * Animate cursor along a path of points
   * @param {Array<{x: number, y: number}>} points - Path points
   * @param {CursorAnimationOptions} options - Animation options
   * @returns {Promise<void>} Resolves when animation completes
   */
  const animateAlongPath = useCallback(
    async (points: Array<{ x: number; y: number }>, options: CursorAnimationOptions = {}): Promise<void> => {
      if (points.length === 0) return;

      const { duration = 100, toolIcon = "pencil" } = options;

      // Calculate total path length
      let totalLength = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }

      // If path is very short, just move to end
      if (totalLength < 2 || points.length === 1) {
        const lastPoint = points[points.length - 1];
        moveTo(lastPoint.x, lastPoint.y, toolIcon);
        return;
      }

      // Animate through each segment proportional to its length
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        const segmentDuration = Math.max(16, (segmentLength / totalLength) * duration);

        await animateTo(points[i].x, points[i].y, {
          duration: segmentDuration,
          toolIcon,
        });
      }
    },
    [animateTo, moveTo],
  );

  return {
    animateTo,
    animateAlongPath,
    moveTo,
    show,
    hide,
    cancelAnimation,
  };
}
