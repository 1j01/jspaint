/**
 * Get all color-related state
 */
import { useSettingsStore } from "./settingsStore";

export function useColors() {
	const primaryColor = useSettingsStore((state) => state.primaryColor);
	const secondaryColor = useSettingsStore((state) => state.secondaryColor);
	const palette = useSettingsStore((state) => state.palette);
	const setPrimaryColor = useSettingsStore((state) => state.setPrimaryColor);
	const setSecondaryColor = useSettingsStore((state) => state.setSecondaryColor);
	const swapColors = useSettingsStore((state) => state.swapColors);

	return {
		primaryColor,
		secondaryColor,
		palette,
		setPrimaryColor,
		setSecondaryColor,
		swapColors,
	};
}
