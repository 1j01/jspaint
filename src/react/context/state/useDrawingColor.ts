/**
 * Get current drawing color based on mouse button
 */
import { useSettingsStore } from "./settingsStore";

export function useDrawingColor(button: number = 0): string {
	return useSettingsStore((state) => (button === 0 ? state.primaryColor : state.secondaryColor));
}
