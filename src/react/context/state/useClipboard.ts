/**
 * Get clipboard state and actions
 * Actions are stable module-level functions for maximum stability
 */
import { useToolStore } from "./toolStore";

/**
 * Hook to access clipboard state and actions
 * Provides copy/cut/paste operations for selections
 * @returns {{
 *   clipboard: ImageData | null;
 *   hasClipboard: boolean;
 *   copy: () => void;
 *   cut: () => void;
 *   paste: () => ImageData | undefined;
 * }} Clipboard state and actions
 */
export function useClipboard() {
  const clipboard = useToolStore((state) => state.clipboard);
  const hasClipboard = clipboard !== null;

  // Return stable object - no useMemo needed
  return {
    clipboard,
    hasClipboard,
    /**
     * Copy current selection to clipboard
     */
    copy: () => {
      const selection = useToolStore.getState().selection;
      if (selection?.imageData) {
        useToolStore.getState().setClipboard(selection.imageData);
      }
    },
    /**
     * Cut current selection to clipboard
     */
    cut: () => {
      const selection = useToolStore.getState().selection;
      if (selection?.imageData) {
        useToolStore.getState().setClipboard(selection.imageData);
      }
    },
    /**
     * Get clipboard contents for pasting
     * @returns {ImageData | undefined} Clipboard image data
     */
    paste: () => {
      return useToolStore.getState().clipboard || undefined;
    },
  };
}
