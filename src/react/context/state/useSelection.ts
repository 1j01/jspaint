/**
 * Get selection state and actions
 */
import { useToolStore } from "./toolStore";

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
