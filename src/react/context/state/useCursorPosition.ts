/**
 * Get cursor position state
 */
import { useUIStore } from "./uiStore";

/**
 * Hook to access cursor position (for status bar display)
 * @returns {{
 *   cursorPosition: { x: number; y: number } | null;
 *   setCursorPosition: (position: { x: number; y: number } | null) => void;
 * }} Cursor position state and actions
 */
export function useCursorPosition() {
  const cursorPosition = useUIStore((state) => state.cursorPosition);
  const setCursorPosition = useUIStore((state) => state.setCursorPosition);

  return {
    cursorPosition,
    setCursorPosition,
  };
}
