/**
 * Get canvas dimensions and actions
 */
import { useCanvasStore } from "./canvasStore";

export function useCanvasDimensions() {
	const canvasWidth = useCanvasStore((state) => state.canvasWidth);
	const canvasHeight = useCanvasStore((state) => state.canvasHeight);
	const setCanvasSize = useCanvasStore((state) => state.setCanvasSize);

	return {
		canvasWidth,
		canvasHeight,
		setCanvasSize,
	};
}
