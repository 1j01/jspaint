/**
 * Get all shape-related settings
 */
import { useSettingsStore } from "./settingsStore";

/**
 * Hook to access shape tool settings and actions
 * @returns {{
 *   fillStyle: "outline" | "fill" | "both";
 *   lineWidth: number;
 *   setFillStyle: (style: "outline" | "fill" | "both") => void;
 *   setLineWidth: (width: number) => void;
 * }} Shape settings and actions
 */
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
