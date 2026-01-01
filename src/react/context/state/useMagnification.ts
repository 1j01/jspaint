/**
 * Get magnification state and actions
 */
import { useUIStore } from "./uiStore";

/**
 * Hook to access zoom magnification state and actions
 * @returns {{
 *   magnification: number;
 *   setMagnification: (mag: number) => void;
 * }} Magnification state and actions
 */
export function useMagnification() {
	const magnification = useUIStore((state) => state.magnification);
	const setMagnification = useUIStore((state) => state.setMagnification);

	return {
		magnification,
		setMagnification,
	};
}
