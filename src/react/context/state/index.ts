/**
 * Zustand Stores - Centralized state management with IndexedDB persistence
 *
 * This module provides a clean, modular state management solution using Zustand.
 * State is split into logical domains for better performance and maintainability:
 *
 * - **settingsStore**: User preferences and tool settings (persisted)
 * - **uiStore**: UI visibility and view state (persisted)
 * - **toolStore**: Active tool and drawing state (session-only)
 * - **canvasStore**: Document state and undo/redo history (IndexedDB for history)
 *
 * Usage:
 * ```tsx
 * import { useSettingsStore, useUIStore, useToolStore, useCanvasStore } from './state';
 *
 * function MyComponent() {
 *   const primaryColor = useSettingsStore(state => state.primaryColor);
 *   const setPrimaryColor = useSettingsStore(state => state.setPrimaryColor);
 *   // ...
 * }
 * ```
 *
 * To initialize persisted state on app load:
 * ```tsx
 * useEffect(() => {
 *   useSettingsStore.getState().loadPersistedSettings();
 *   useUIStore.getState().loadPersistedUIState();
 * }, []);
 * ```
 */

import { useShallow } from "zustand/react/shallow";

export { useSettingsStore, type SettingsState } from "./settingsStore";
export { useUIStore, type UIState, type DialogName } from "./uiStore";
export { useToolStore, type ToolState } from "./toolStore";
export { useCanvasStore, type CanvasState } from "./canvasStore";
export { useHistoryStore, type HistoryState, type HistoryNode } from "./historyStore";
export { saveSetting, loadSetting, removeSetting, clearAllData } from "./persistence";
export { useInitializeStores } from "./useInitializeStores";

// Export types from single source
export { TOOL_IDS, type ToolId, type Selection, type TextBoxState, type BrushShape, type FillStyle } from "./types";

/**
 * Initialize all persisted stores
 * Call this once on app startup
 */
export async function initializeStores(): Promise<void> {
	const settingsStore = await import("./settingsStore");
	const uiStore = await import("./uiStore");

	// Load settings from IndexedDB
	await Promise.all([
		settingsStore.useSettingsStore.getState().loadPersistedSettings(),
		uiStore.useUIStore.getState().loadPersistedUIState(),
	]);
}

/**
 * Selector hooks for common state combinations
 * These improve performance by selecting only needed values
 */

import { useSettingsStore } from "./settingsStore";
import { useToolStore } from "./toolStore";
import { useUIStore } from "./uiStore";
import { useCanvasStore } from "./canvasStore";
import { useHistoryStore } from "./historyStore";

/**
 * Get current drawing color based on mouse button
 */
export function useDrawingColor(button: number = 0): string {
	return useSettingsStore((state) => (button === 0 ? state.primaryColor : state.secondaryColor));
}

/**
 * Get all color-related state
 */
export function useColors() {
	console.warn("[HOOK] useColors called");
	return useSettingsStore(useShallow(
		(state) => ({
			primaryColor: state.primaryColor,
			secondaryColor: state.secondaryColor,
			palette: state.palette,
			setPrimaryColor: state.setPrimaryColor,
			setSecondaryColor: state.setSecondaryColor,
			swapColors: state.swapColors,
		})
	));
}

/**
 * Get all shape-related settings
 */
export function useShapeSettings() {
	console.warn("[HOOK] useShapeSettings called");
	return useSettingsStore(useShallow(
		(state) => ({
		fillStyle: state.fillStyle,
		lineWidth: state.lineWidth,
		setFillStyle: state.setFillStyle,
		setLineWidth: state.setLineWidth,
		})
	));
}

/**
 * Get all brush-related settings
 */
export function useBrushSettings() {
	console.warn("[HOOK] useBrushSettings called");
	return useSettingsStore(useShallow(
		(state) => ({
		brushSize: state.brushSize,
		brushShape: state.brushShape,
		pencilSize: state.pencilSize,
		eraserSize: state.eraserSize,
		airbrushSize: state.airbrushSize,
		setBrushSize: state.setBrushSize,
		setBrushShape: state.setBrushShape,
		setEraserSize: state.setEraserSize,
		setAirbrushSize: state.setAirbrushSize,
		})
	));
}

/**
 * Get all font-related settings
 */
export function useFontSettings() {
	return useSettingsStore(useShallow(
		(state) => ({
		fontFamily: state.fontFamily,
		fontSize: state.fontSize,
		fontBold: state.fontBold,
		fontItalic: state.fontItalic,
		fontUnderline: state.fontUnderline,
		textTransparent: state.textTransparent,
		setFontFamily: state.setFontFamily,
		setFontSize: state.setFontSize,
		setFontStyle: state.setFontStyle,
		setTextTransparent: state.setTextTransparent,
		})
	));
}

/**
 * Get undo/redo state and actions
 */
export function useHistory() {
	console.warn("[HOOK] useHistory called");
	return useCanvasStore(useShallow(
		(state) => ({
		canUndo: state.undoStack.length > 0,
		canRedo: state.redoStack.length > 0,
		saveState: state.saveState,
		undo: state.undo,
		redo: state.redo,
		clearHistory: state.clearHistory,
		})
	));
}

/**
 * Get tree-based history state and actions
 * Use this for the advanced branching history UI
 */
export function useTreeHistory() {
	console.warn("[HOOK] useTreeHistory called");
	return useHistoryStore(useShallow(
		(state) => ({
			historyTree: state.historyTree,
			currentNode: state.currentNode,
			rootNode: state.getRoot(),
			canUndo: state.canUndo(),
			canRedo: state.canRedo(),
			pushState: state.pushState,
			undo: state.undo,
			redo: state.redo,
			goToNode: state.goToNode,
			getAllNodes: state.getAllNodes,
			pruneHistory: state.pruneHistory,
		})
	));
}

/**
 * Get canvas dimensions and actions
 * Note: canvasRef should be managed locally with useRef in the component
 */
export function useCanvasDimensions() {
	console.warn("[HOOK] useCanvasDimensions called");
	return useCanvasStore(useShallow(
		(state) => ({
			canvasWidth: state.canvasWidth,
			canvasHeight: state.canvasHeight,
			setCanvasSize: state.setCanvasSize,
		})
	));
}

/**
 * Get tool state and actions
 */
export function useTool() {
	console.warn("[HOOK] useTool called");
	return useToolStore(useShallow(
		(state) => ({
		selectedToolId: state.selectedToolId,
		setTool: state.setTool,
		})
	));
}

/**
 * Get selection state and actions
 */
export function useSelection() {
	return useToolStore(useShallow(
		(state) => ({
		selection: state.selection,
		setSelection: state.setSelection,
		clearSelection: state.clearSelection,
		hasSelection: state.selection !== null,
		})
	));
}

/**
 * Get clipboard state and actions
 */
export function useClipboard() {
	return useToolStore(useShallow(
		(state) => {
			const clipboard = state.clipboard;
			const setClipboard = state.setClipboard;
			const selection = state.selection;

			return {
				clipboard,
				hasClipboard: clipboard !== null,
				copy: () => {
					if (selection?.imageData) {
						setClipboard(selection.imageData);
					}
				},
				cut: () => {
					if (selection?.imageData) {
						setClipboard(selection.imageData);
					}
				},
				paste: () => {
					if (clipboard) {
						// Paste logic handled by Canvas component
						return clipboard;
					}
				},
			};
		}
	));
}

/**
 * Get text box state and actions
 */
export function useTextBox() {
	return useToolStore(useShallow(
		(state) => {
			const settingsState = useSettingsStore.getState();
			return {
				textBox: state.textBox,
				setTextBox: state.setTextBox,
				clearTextBox: state.clearTextBox,
				fontFamily: settingsState.fontFamily,
				fontSize: settingsState.fontSize,
				fontBold: settingsState.fontBold,
				fontItalic: settingsState.fontItalic,
				fontUnderline: settingsState.fontUnderline,
				setFontFamily: settingsState.setFontFamily,
				setFontSize: settingsState.setFontSize,
				setFontStyle: settingsState.setFontStyle,
			};
		}
	));
}

/**
 * Get view state toggles
 */
export function useViewState() {
	const uiState = useUIStore(useShallow(
		(state) => ({
			showToolBox: state.showToolBox,
			showColorBox: state.showColorBox,
			showStatusBar: state.showStatusBar,
			showTextToolbar: state.showTextToolbar,
			showGrid: state.showGrid,
			showThumbnail: state.showThumbnail,
			toggleToolBox: state.toggleToolBox,
			toggleColorBox: state.toggleColorBox,
			toggleStatusBar: state.toggleStatusBar,
			toggleTextToolbar: state.toggleTextToolbar,
			toggleGrid: state.toggleGrid,
			toggleThumbnail: state.toggleThumbnail,
		})
	));

	const settingsState = useSettingsStore(useShallow(
		(state) => ({
			drawOpaque: state.drawOpaque,
			toggleDrawOpaque: state.toggleDrawOpaque,
		})
	));

	// No need for useMemo since useShallow already handles shallow comparison
	return { ...uiState, ...settingsState };
}

/**
 * Get magnification state and actions
 */
export function useMagnification() {
	return useUIStore(useShallow(
		(state) => ({
			magnification: state.magnification,
			setMagnification: state.setMagnification,
		})
	));
}

/**
 * Get cursor position state
 */
export function useCursorPosition() {
	return useUIStore(useShallow(
		(state) => ({
			cursorPosition: state.cursorPosition,
			setCursorPosition: state.setCursorPosition,
		})
	));
}

/**
 * Get app state (for backwards compatibility)
 * Note: canvasRef must be passed to components that need it
 */
export function useApp() {
	return useCanvasStore(useShallow(
		(state) => ({
			state: {
				canvasWidth: state.canvasWidth,
				canvasHeight: state.canvasHeight,
			},
		})
	));
}
