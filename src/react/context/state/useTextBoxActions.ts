/**
 * Get text box actions
 */
import { useToolStore } from "./toolStore";

/**
 * Hook to access text box actions only (no state)
 * More efficient than useTextBox when you only need the actions
 * @returns {{
 *   setTextBox: (textBox: TextBoxState | null) => void;
 *   clearTextBox: () => void;
 * }} Text box actions
 */
export function useTextBoxActions() {
	const setTextBox = useToolStore((state) => state.setTextBox);
	const clearTextBox = useToolStore((state) => state.clearTextBox);

	return {
		setTextBox,
		clearTextBox,
	};
}
