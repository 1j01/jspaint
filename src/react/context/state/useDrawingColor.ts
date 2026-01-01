/**
 * Get current drawing color based on mouse button
 */
import { useSettingsStore } from "./settingsStore";

/**
 * Hook to get the appropriate drawing color based on mouse button
 * @param {number} [button=0] - Mouse button (0 = left/primary, other = right/secondary)
 * @returns {string} Color to use for drawing (primary or secondary)
 */
export function useDrawingColor(button: number = 0): string {
	return useSettingsStore((state) => (button === 0 ? state.primaryColor : state.secondaryColor));
}
