/**
 * Get selection state and actions
 */
import { useToolStore } from "./toolStore";

/**
 * Hook to access selection state and actions
 * @returns {{
 *   selection: Selection | null;
 *   setSelection: (selection: Selection | null) => void;
 *   clearSelection: () => void;
 *   hasSelection: boolean;
 * }} Selection state and actions
 */
export function useSelection() {
  const selection = useToolStore((state) => state.selection);
  const setSelection = useToolStore((state) => state.setSelection);
  const clearSelection = useToolStore((state) => state.clearSelection);
  const hasSelection = selection !== null;

  return {
    selection,
    setSelection,
    clearSelection,
    hasSelection,
  };
}
