/**
 * Get all color-related state
 */
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "./settingsStore";

/**
 * Hook to access color state and actions
 * Uses useShallow to prevent re-renders when unrelated store properties change.
 * @returns {{
 *   primaryColor: string;
 *   secondaryColor: string;
 *   palette: string[];
 *   setPrimaryColor: (color: string) => void;
 *   setSecondaryColor: (color: string) => void;
 *   swapColors: () => void;
 * }} Color state and actions
 */
export function useColors() {
  return useSettingsStore(
    useShallow((state) => ({
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      palette: state.palette,
      setPrimaryColor: state.setPrimaryColor,
      setSecondaryColor: state.setSecondaryColor,
      swapColors: state.swapColors,
    })),
  );
}
