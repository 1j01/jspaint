/**
 * Get text box actions
 */
import { useToolStore } from "./toolStore";

export function useTextBoxActions() {
	const setTextBox = useToolStore((state) => state.setTextBox);
	const clearTextBox = useToolStore((state) => state.clearTextBox);

	return {
		setTextBox,
		clearTextBox,
	};
}
