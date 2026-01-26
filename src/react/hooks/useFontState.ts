import { useCallback, useMemo } from "react";
import { useSettingsStore } from "../context/state/settingsStore";
import { TOOL_IDS } from "../context/state/types";

/**
 * Font state interface for FontBoxWindow
 */
export interface FontState {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  vertical: boolean;
}

/**
 * Custom hook for managing font state and FontBoxWindow integration
 *
 * Provides:
 * - Current font state in the format expected by FontBoxWindow
 * - Handler for font changes from FontBoxWindow
 * - Logic to determine when FontBoxWindow should be visible
 */
export function useFontState(selectedToolId: string, isTextBoxActive?: boolean) {
  // Get font settings from store
  const fontFamily = useSettingsStore((state) => state.fontFamily);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const fontBold = useSettingsStore((state) => state.fontBold);
  const fontItalic = useSettingsStore((state) => state.fontItalic);
  const fontUnderline = useSettingsStore((state) => state.fontUnderline);
  const fontVertical = useSettingsStore((state) => state.fontVertical);
  const setFontFamily = useSettingsStore((state) => state.setFontFamily);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const setFontStyle = useSettingsStore((state) => state.setFontStyle);

  /**
   * Font state in FontBoxWindow format
   */
  const fontState = useMemo<FontState>(
    () => ({
      family: fontFamily,
      size: fontSize,
      bold: fontBold,
      italic: fontItalic,
      underline: fontUnderline,
      vertical: fontVertical,
    }),
    [fontFamily, fontSize, fontBold, fontItalic, fontUnderline, fontVertical],
  );

  /**
   * Handle font changes from FontBoxWindow
   */
  const handleFontChange = useCallback(
    (newFontState: FontState) => {
      if (newFontState.family !== fontFamily) {
        setFontFamily(newFontState.family);
      }
      if (newFontState.size !== fontSize) {
        setFontSize(newFontState.size);
      }
      if (
        newFontState.bold !== fontBold ||
        newFontState.italic !== fontItalic ||
        newFontState.underline !== fontUnderline ||
        newFontState.vertical !== fontVertical
      ) {
        setFontStyle(newFontState.bold, newFontState.italic, newFontState.underline, newFontState.vertical);
      }
    },
    [fontFamily, fontSize, fontBold, fontItalic, fontUnderline, fontVertical, setFontFamily, setFontSize, setFontStyle],
  );

  /**
   * Show font box when text tool is selected or text box is active
   */
  const showFontBox = useMemo(() => {
    return selectedToolId === TOOL_IDS.TEXT || isTextBoxActive;
  }, [selectedToolId, isTextBoxActive]);

  return {
    fontState,
    handleFontChange,
    showFontBox,
  };
}
