/**
 * Get text box state
 */
import { useToolStore } from "./toolStore";

export function useTextBoxState() {
	return useToolStore((state) => state.textBox);
}
