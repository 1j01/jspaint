/**
 * Get app state (for backwards compatibility)
 */
import { useCanvasStore } from "./canvasStore";

/**
 * Hook to access basic app state (canvas dimensions)
 * This is a backwards compatibility layer for components migrating from the old AppContext
 * @returns {{ state: { canvasWidth: number; canvasHeight: number } }} App state object
 */
export function useApp() {
	const canvasWidth = useCanvasStore((state) => state.canvasWidth);
	const canvasHeight = useCanvasStore((state) => state.canvasHeight);

	return {
		state: {
			canvasWidth,
			canvasHeight,
		},
	};
}
