/**
 * UI State Store - Window/panel visibility and view state
 * Persisted to IndexedDB for cross-session consistency
 */

import { create } from "zustand";
import { loadSetting, saveSetting } from "./persistence";

/**
 * Dialog names for all available dialogs in the application
 */
export type DialogName =
  | "about"
  | "flipRotate"
  | "stretchSkew"
  | "attributes"
  | "customZoom"
  | "loadFromUrl"
  | "helpTopics"
  | "editColors"
  | "imgurUpload"
  | "manageStorage"
  | "history"
  | "saveAs";

/**
 * UI state interface
 * Manages visibility of panels, dialogs, and view settings
 */
export interface UIState {
  /**
   * Whether Tool Box panel is visible
   */
  showToolBox: boolean;

  /**
   * Whether Color Box panel is visible
   */
  showColorBox: boolean;

  /**
   * Whether status bar is visible
   */
  showStatusBar: boolean;

  /**
   * Whether text formatting toolbar is visible
   */
  showTextToolbar: boolean;

  /**
   * Whether pixel grid overlay is visible
   */
  showGrid: boolean;

  /**
   * Whether thumbnail preview window is visible
   */
  showThumbnail: boolean;

  /**
   * Whether AI assistant panel is visible
   */
  showAIPanel: boolean;

  /**
   * Current zoom magnification level (1 = 100%, 2 = 200%, etc.)
   */
  magnification: number;

  /**
   * Current cursor position in canvas coordinates (for status bar display)
   */
  cursorPosition: { x: number; y: number } | null;

  /**
   * Dialog visibility state (session-only, not persisted)
   */
  dialogs: Record<DialogName, boolean>;

  /**
   * Toggle Tool Box panel visibility
   */
  toggleToolBox: () => void;

  /**
   * Toggle Color Box panel visibility
   */
  toggleColorBox: () => void;

  /**
   * Toggle status bar visibility
   */
  toggleStatusBar: () => void;

  /**
   * Toggle text formatting toolbar visibility
   */
  toggleTextToolbar: () => void;

  /**
   * Toggle pixel grid overlay visibility
   */
  toggleGrid: () => void;

  /**
   * Toggle thumbnail preview window visibility
   */
  toggleThumbnail: () => void;

  /**
   * Toggle AI assistant panel visibility
   */
  toggleAIPanel: () => void;

  /**
   * Set zoom magnification level
   * @param {number} mag - Magnification level (1 = 100%, 2 = 200%, etc.)
   */
  setMagnification: (mag: number) => void;

  /**
   * Set cursor position for status bar display
   * @param {{ x: number; y: number } | null} position - Cursor position or null to clear
   */
  setCursorPosition: (position: { x: number; y: number } | null) => void;

  /**
   * Open a dialog by name
   * @param {DialogName} name - Name of the dialog to open
   */
  openDialog: (name: DialogName) => void;

  /**
   * Close a dialog by name
   * @param {DialogName} name - Name of the dialog to close
   */
  closeDialog: (name: DialogName) => void;

  /**
   * Load all persisted UI state from IndexedDB
   * @returns {Promise<void>}
   */
  loadPersistedUIState: () => Promise<void>;
}

/**
 * Zustand store for UI state
 * Panel visibility is persisted to IndexedDB, dialog state is session-only
 * @returns {UIState} The UI state store
 */
export const useUIStore = create<UIState>((set, get) => ({
  // Initial values
  showToolBox: true,
  showColorBox: true,
  showStatusBar: true,
  showTextToolbar: false,
  showGrid: false,
  showThumbnail: false,
  showAIPanel: true,
  magnification: 1,
  cursorPosition: null,

  // Dialog state (all closed initially)
  dialogs: {
    about: false,
    flipRotate: false,
    stretchSkew: false,
    attributes: false,
    customZoom: false,
    loadFromUrl: false,
    helpTopics: false,
    editColors: false,
    imgurUpload: false,
    manageStorage: false,
    history: false,
    saveAs: false,
  },

  // Actions with persistence
  toggleToolBox: () => {
    const newValue = !get().showToolBox;
    set({ showToolBox: newValue });
    saveSetting("showToolBox", newValue);
  },

  toggleColorBox: () => {
    const newValue = !get().showColorBox;
    set({ showColorBox: newValue });
    saveSetting("showColorBox", newValue);
  },

  toggleStatusBar: () => {
    const newValue = !get().showStatusBar;
    set({ showStatusBar: newValue });
    saveSetting("showStatusBar", newValue);
  },

  toggleTextToolbar: () => {
    const newValue = !get().showTextToolbar;
    set({ showTextToolbar: newValue });
    saveSetting("showTextToolbar", newValue);
  },

  toggleGrid: () => {
    const newValue = !get().showGrid;
    set({ showGrid: newValue });
    saveSetting("showGrid", newValue);
  },

  toggleThumbnail: () => {
    const newValue = !get().showThumbnail;
    set({ showThumbnail: newValue });
    saveSetting("showThumbnail", newValue);
  },

  toggleAIPanel: () => {
    const newValue = !get().showAIPanel;
    set({ showAIPanel: newValue });
    saveSetting("showAIPanel", newValue);
  },

  setMagnification: (mag) => {
    // Support both zoom-in and zoom-out, but prevent invalid values (0/NaN/Infinity)
    const normalized = Number.isFinite(mag) ? Math.min(8, Math.max(0.1, mag)) : 1;
    set({ magnification: normalized });
    saveSetting("magnification", normalized);
  },

  setCursorPosition: (position) => {
    set({ cursorPosition: position });
    // Don't persist cursor position - it's ephemeral
  },

  // Dialog actions (not persisted)
  openDialog: (name) => {
    set((state) => ({
      dialogs: { ...state.dialogs, [name]: true },
    }));
  },

  closeDialog: (name) => {
    set((state) => ({
      dialogs: { ...state.dialogs, [name]: false },
    }));
  },

  // Load persisted UI state on app initialization
  loadPersistedUIState: async () => {
    const showToolBox = await loadSetting("showToolBox", true);
    const showColorBox = await loadSetting("showColorBox", true);
    const showStatusBar = await loadSetting("showStatusBar", true);
    const showTextToolbar = await loadSetting("showTextToolbar", false);
    const showGrid = await loadSetting("showGrid", false);
    const showThumbnail = await loadSetting("showThumbnail", false);
    const showAIPanel = await loadSetting("showAIPanel", true);
    const rawMagnification = await loadSetting<unknown>("magnification", 1);
    const magnification =
      typeof rawMagnification === "number" && Number.isFinite(rawMagnification)
        ? Math.min(8, Math.max(0.1, rawMagnification))
        : 1;

    set({
      showToolBox,
      showColorBox,
      showStatusBar,
      showTextToolbar,
      showGrid,
      showThumbnail,
      showAIPanel,
      magnification,
    });
  },
}));
