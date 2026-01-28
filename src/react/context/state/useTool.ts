/**
 * Get tool state and actions
 */
import { useShallow } from "zustand/react/shallow";
import { useToolStore } from "./toolStore";

/**
 * Hook to access current tool state and tool switching
 * Uses useShallow to prevent re-renders when unrelated store properties change.
 * @returns {{
 *   selectedToolId: string;
 *   setTool: (toolId: string) => void;
 * }} Tool state and actions
 */
export function useTool() {
  return useToolStore(
    useShallow((state) => ({
      selectedToolId: state.selectedToolId,
      setTool: state.setTool,
    })),
  );
}
