/**
 * Get selection state and actions
 */
import { useShallow } from "zustand/react/shallow";
import { useToolStore } from "./toolStore";

/**
 * Hook to access selection state and actions
 * Uses useShallow to prevent re-renders when unrelated store properties change.
 * @returns {{
 *   selection: Selection | null;
 *   setSelection: (selection: Selection | null) => void;
 *   clearSelection: () => void;
 *   hasSelection: boolean;
 * }} Selection state and actions
 */
export function useSelection() {
  const { selection, setSelection, clearSelection } = useToolStore(
    useShallow((state) => ({
      selection: state.selection,
      setSelection: state.setSelection,
      clearSelection: state.clearSelection,
    })),
  );
  const hasSelection = selection !== null;

  return {
    selection,
    setSelection,
    clearSelection,
    hasSelection,
  };
}
