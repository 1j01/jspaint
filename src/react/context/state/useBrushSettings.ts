/**
 * Get all brush-related settings
 */
import { useSettingsStore } from "./settingsStore";

export function useBrushSettings() {
	const brushSize = useSettingsStore((state) => state.brushSize);
	const brushShape = useSettingsStore((state) => state.brushShape);
	const pencilSize = useSettingsStore((state) => state.pencilSize);
	const eraserSize = useSettingsStore((state) => state.eraserSize);
	const airbrushSize = useSettingsStore((state) => state.airbrushSize);
	const setBrushSize = useSettingsStore((state) => state.setBrushSize);
	const setBrushShape = useSettingsStore((state) => state.setBrushShape);
	const setEraserSize = useSettingsStore((state) => state.setEraserSize);
	const setAirbrushSize = useSettingsStore((state) => state.setAirbrushSize);

	return {
		brushSize,
		brushShape,
		pencilSize,
		eraserSize,
		airbrushSize,
		setBrushSize,
		setBrushShape,
		setEraserSize,
		setAirbrushSize,
	};
}
