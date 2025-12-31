/**
 * Get clipboard state and actions
 * Actions are stable module-level functions for maximum stability
 */
import { useToolStore } from "./toolStore";

export function useClipboard() {
	const clipboard = useToolStore((state) => state.clipboard);
	const hasClipboard = clipboard !== null;

	// Return stable object - no useMemo needed
	return {
		clipboard,
		hasClipboard,
		copy: () => {
			const selection = useToolStore.getState().selection;
			if (selection?.imageData) {
				useToolStore.getState().setClipboard(selection.imageData);
			}
		},
		cut: () => {
			const selection = useToolStore.getState().selection;
			if (selection?.imageData) {
				useToolStore.getState().setClipboard(selection.imageData);
			}
		},
		paste: () => {
			return useToolStore.getState().clipboard || undefined;
		},
	};
}
