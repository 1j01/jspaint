/**
 * Combined text box hook (for backwards compatibility)
 * NOTE: This combines multiple stores - prefer using separate hooks for better performance
 */
import { useToolStore } from "./toolStore";
import { useSettingsStore } from "./settingsStore";

export function useTextBox() {
	const textBox = useToolStore((state) => state.textBox);
	const setTextBox = useToolStore((state) => state.setTextBox);
	const clearTextBox = useToolStore((state) => state.clearTextBox);
	const fontFamily = useSettingsStore((state) => state.fontFamily);
	const fontSize = useSettingsStore((state) => state.fontSize);
	const fontBold = useSettingsStore((state) => state.fontBold);
	const fontItalic = useSettingsStore((state) => state.fontItalic);
	const fontUnderline = useSettingsStore((state) => state.fontUnderline);
	const setFontFamily = useSettingsStore((state) => state.setFontFamily);
	const setFontSize = useSettingsStore((state) => state.setFontSize);
	const setFontStyle = useSettingsStore((state) => state.setFontStyle);

	return {
		textBox,
		setTextBox,
		clearTextBox,
		fontFamily,
		fontSize,
		fontBold,
		fontItalic,
		fontUnderline,
		setFontFamily,
		setFontSize,
		setFontStyle,
	};
}
