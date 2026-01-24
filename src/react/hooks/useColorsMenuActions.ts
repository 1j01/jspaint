/**
 * Colors menu actions hook
 * Handles Colors menu operations: Edit Colors, Get Colors, Save Colors
 */

import { useCallback } from "react";
import { useUIStore } from "../context/state/uiStore";

/**
 * Colors menu actions interface
 */
export interface ColorsMenuActions {
	colorsEditColors: () => void;
	colorsGetColors: () => Promise<void>;
	colorsSaveColors: () => Promise<void>;
}

/**
 * Parameters for the colors menu actions hook
 */
export interface UseColorsMenuActionsParams {
	palette: string[];
}

/**
 * Hook for Colors menu action handlers
 *
 * @param {UseColorsMenuActionsParams} params - Hook parameters
 * @returns {ColorsMenuActions} Colors menu action handlers
 *
 * @example
 * const colorsActions = useColorsMenuActions({
 *   palette,
 * });
 */
export function useColorsMenuActions(params: UseColorsMenuActionsParams): ColorsMenuActions {
	const { palette } = params;

	const openDialog = useUIStore((state) => state.openDialog);

	const colorsEditColors = useCallback(() => openDialog("editColors"), [openDialog]);

	const colorsGetColors = useCallback(async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".pal,.gpl,.txt,.hex";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const { loadPaletteFile } = await import("../utils/paletteFormats");
				const colors = await loadPaletteFile(file);
				if (colors.length > 0) {
					alert(`Loaded ${colors.length} colors from palette file.\n\nFull palette replacement coming soon. For now, you can use the Edit Colors dialog to manually add these colors.`);
				} else {
					alert("No colors found in the palette file.");
				}
			} catch (error) {
				alert(`Failed to load palette: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		input.click();
	}, []);

	const colorsSaveColors = useCallback(async () => {
		try {
			const { downloadPalette } = await import("../utils/paletteFormats");
			await downloadPalette(palette, "palette.gpl", "gpl");
		} catch (error) {
			alert(`Failed to save palette: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}, [palette]);

	return {
		colorsEditColors,
		colorsGetColors,
		colorsSaveColors,
	};
}
