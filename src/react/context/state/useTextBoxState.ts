/**
 * Get text box state
 */
import { useToolStore } from "./toolStore";

/**
 * Hook to access text box state only (no actions)
 * More efficient than useTextBox when you only need to read the state
 * @returns {TextBoxState | null} Current text box state
 */
export function useTextBoxState() {
  return useToolStore((state) => state.textBox);
}
