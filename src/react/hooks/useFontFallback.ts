/**
 * Custom hook for font fallback validation
 * Validates that the selected font is available and provides fallback cascade
 *
 * Matches jQuery $FontBox.js fallback behavior:
 * 1. Check if current font is available
 * 2. Try "Liberation Sans" as primary fallback
 * 3. Try "Arial" as secondary fallback
 * 4. Fall back to first available font
 */

import { useEffect } from "react";

/**
 * Font state interface
 */
interface FontState {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  vertical: boolean;
}

/**
 * Parameters for the font fallback hook
 */
interface UseFontFallbackParams {
  /** Whether fonts are still loading */
  loadingFonts: boolean;
  /** List of available fonts */
  availableFonts: string[];
  /** Current font state */
  fontState: FontState;
  /** Callback to update font state */
  onFontChange: (state: FontState) => void;
}

/**
 * Hook to validate and apply font fallback cascade
 *
 * When fonts finish loading, validates that the selected font is available.
 * Falls back to Liberation Sans -> Arial -> first available font if not found.
 *
 * @param {UseFontFallbackParams} params - Hook parameters
 *
 * @example
 * useFontFallback({
 *   loadingFonts: false,
 *   availableFonts: ["Arial", "Times New Roman", "Courier New"],
 *   fontState: { family: "Unknown Font", size: 12, bold: false, italic: false, underline: false, vertical: false },
 *   onFontChange: (state) => setFontState(state),
 * });
 * // Will update family to "Arial" since "Unknown Font" is not available
 */
export function useFontFallback({
  loadingFonts,
  availableFonts,
  fontState,
  onFontChange,
}: UseFontFallbackParams): void {
  useEffect(() => {
    // Wait for fonts to finish loading
    if (loadingFonts || availableFonts.length === 0) return;

    // Check if current font is in the available list (case-insensitive)
    const normalizedFamily = fontState.family.toLowerCase();
    const fontAvailable = availableFonts.some((font) => font.toLowerCase() === normalizedFamily);

    if (!fontAvailable) {
      // Font not available - apply fallback cascade like jQuery
      // Try "Liberation Sans" first (common fallback)
      const liberationSans = availableFonts.find((font) => font.toLowerCase() === "liberation sans");
      if (liberationSans) {
        onFontChange({ ...fontState, family: liberationSans });
        return;
      }

      // Try "Arial" as secondary fallback
      const arial = availableFonts.find((font) => font.toLowerCase() === "arial");
      if (arial) {
        onFontChange({ ...fontState, family: arial });
        return;
      }

      // Fall back to first available font
      if (availableFonts[0]) {
        onFontChange({ ...fontState, family: availableFonts[0] });
      }
    }
  }, [loadingFonts, availableFonts, fontState, onFontChange]);
}
