/**
 * State Management - Re-exports
 *
 * This file re-exports stores, types, and hooks.
 * Prefer importing directly from the source files for better IDE performance and tree-shaking.
 *
 * Direct imports examples:
 * - import { useSettingsStore } from './context/state/settingsStore';
 * - import { TOOL_IDS } from './context/state/types';
 * - import { useColors } from './context/state/useColors';
 */

// Re-export stores
export { useSettingsStore, type SettingsState } from "./settingsStore";
export { useUIStore, type UIState, type DialogName } from "./uiStore";
export { useToolStore, type ToolState } from "./toolStore";
export { useCanvasStore, type CanvasState } from "./canvasStore";
export { useHistoryStore, type HistoryState, type HistoryNode } from "./historyStore";

// Re-export persistence utilities
export { saveSetting, loadSetting, removeSetting, clearAllData } from "./persistence";
export { useInitializeStores } from "./useInitializeStores";

// Re-export types
export { TOOL_IDS, type ToolId, type Selection, type TextBoxState, type BrushShape, type FillStyle } from "./types";

// Re-export convenience hooks
export { useDrawingColor } from "./useDrawingColor";
export { useColors } from "./useColors";
export { useShapeSettings } from "./useShapeSettings";
export { useBrushSettings } from "./useBrushSettings";
export { useFontSettings } from "./useFontSettings";
export { useHistory } from "./useHistory";
export { useTreeHistory } from "./useTreeHistory";
export { useCurrentHistoryNode } from "./useCurrentHistoryNode";
export { useCanvasDimensions } from "./useCanvasDimensions";
export { useTool } from "./useTool";
export { useSelection } from "./useSelection";
export { useClipboard } from "./useClipboard";
export { useTextBox } from "./useTextBox";
export { useViewState } from "./useViewState";
export { useMagnification } from "./useMagnification";
export { useCursorPosition } from "./useCursorPosition";
export { useApp } from "./useApp";

/**
 * Initialize all persisted stores
 * Call this once on app startup
 */
export async function initializeStores(): Promise<void> {
  const settingsStore = await import("./settingsStore");
  const uiStore = await import("./uiStore");
  const canvasStore = await import("./canvasStore");

  // Load settings from IndexedDB
  await Promise.all([
    settingsStore.useSettingsStore.getState().loadPersistedSettings(),
    uiStore.useUIStore.getState().loadPersistedUIState(),
    canvasStore.useCanvasStore.getState().loadPersistedCanvasState(),
  ]);
}
