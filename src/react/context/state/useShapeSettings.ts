/**
 * Get all shape-related settings
 */
import { useSettingsStore } from "./settingsStore";

export function useShapeSettings() {
	const fillStyle = useSettingsStore((state) => state.fillStyle);
	const lineWidth = useSettingsStore((state) => state.lineWidth);
	const setFillStyle = useSettingsStore((state) => state.setFillStyle);
	const setLineWidth = useSettingsStore((state) => state.setLineWidth);

	return {
		fillStyle,
		lineWidth,
		setFillStyle,
		setLineWidth,
	};
}
