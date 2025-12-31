/**
 * Get cursor position state
 */
import { useUIStore } from "./uiStore";

export function useCursorPosition() {
	const cursorPosition = useUIStore((state) => state.cursorPosition);
	const setCursorPosition = useUIStore((state) => state.setCursorPosition);

	return {
		cursorPosition,
		setCursorPosition,
	};
}
