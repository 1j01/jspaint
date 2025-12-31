/**
 * Get magnification state and actions
 */
import { useUIStore } from "./uiStore";

export function useMagnification() {
	const magnification = useUIStore((state) => state.magnification);
	const setMagnification = useUIStore((state) => state.setMagnification);

	return {
		magnification,
		setMagnification,
	};
}
