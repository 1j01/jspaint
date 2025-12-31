/**
 * Get app state (for backwards compatibility)
 */
import { useCanvasStore } from "./canvasStore";

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
