/**
 * Get all font-related settings
 */
import { useSettingsStore } from "./settingsStore";

/**
 * Hook to access text/font settings and actions
 * @returns {{
 *   fontFamily: string;
 *   fontSize: number;
 *   fontBold: boolean;
 *   fontItalic: boolean;
 *   fontUnderline: boolean;
 *   textTransparent: boolean;
 *   setFontFamily: (family: string) => void;
 *   setFontSize: (size: number) => void;
 *   setFontStyle: (bold: boolean, italic: boolean, underline: boolean) => void;
 *   setTextTransparent: (transparent: boolean) => void;
 * }} Font settings and actions
 */
export function useFontSettings() {
	const fontFamily = useSettingsStore((state) => state.fontFamily);
	const fontSize = useSettingsStore((state) => state.fontSize);
	const fontBold = useSettingsStore((state) => state.fontBold);
	const fontItalic = useSettingsStore((state) => state.fontItalic);
	const fontUnderline = useSettingsStore((state) => state.fontUnderline);
	const textTransparent = useSettingsStore((state) => state.textTransparent);
	const setFontFamily = useSettingsStore((state) => state.setFontFamily);
	const setFontSize = useSettingsStore((state) => state.setFontSize);
	const setFontStyle = useSettingsStore((state) => state.setFontStyle);
	const setTextTransparent = useSettingsStore((state) => state.setTextTransparent);

	return {
		fontFamily,
		fontSize,
		fontBold,
		fontItalic,
		fontUnderline,
		textTransparent,
		setFontFamily,
		setFontSize,
		setFontStyle,
		setTextTransparent,
	};
}
