/**
 * Combined text box hook (for backwards compatibility)
 * NOTE: This combines multiple stores - prefer using separate hooks for better performance
 */
import { useToolStore } from "./toolStore";
import { useSettingsStore } from "./settingsStore";

/**
 * Hook to access text box state and font settings (combined)
 * WARNING: This hook subscribes to multiple stores, which may cause unnecessary re-renders.
 * Consider using useTextBoxState and useFontSettings separately for better performance.
 * @returns {{
 *   textBox: TextBoxState | null;
 *   setTextBox: (textBox: TextBoxState | null) => void;
 *   clearTextBox: () => void;
 *   fontFamily: string;
 *   fontSize: number;
 *   fontBold: boolean;
 *   fontItalic: boolean;
 *   fontUnderline: boolean;
 *   setFontFamily: (family: string) => void;
 *   setFontSize: (size: number) => void;
 *   setFontStyle: (bold: boolean, italic: boolean, underline: boolean) => void;
 * }} Text box state and font settings
 */
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
