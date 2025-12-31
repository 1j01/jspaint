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
	return useSettingsStore((state) => ({
		primaryColor: state.primaryColor,
		secondaryColor: state.secondaryColor,
		palette: state.palette,
		setPrimaryColor: state.setPrimaryColor,
		setSecondaryColor: state.setSecondaryColor,
		swapColors: state.swapColors,
	}));
}

/**
 * Get all shape-related settings
 */
export function useShapeSettings() {
	return useSettingsStore((state) => ({
		fillStyle: state.fillStyle,
		lineWidth: state.lineWidth,
		setFillStyle: state.setFillStyle,
		setLineWidth: state.setLineWidth,
	}));
}

/**
 * Get all brush-related settings
 */
export function useBrushSettings() {
	return useSettingsStore((state) => ({
		brushSize: state.brushSize,
		brushShape: state.brushShape,
		pencilSize: state.pencilSize,
		eraserSize: state.eraserSize,
		airbrushSize: state.airbrushSize,
		setBrushSize: state.setBrushSize,
		setBrushShape: state.setBrushShape,
		setEraserSize: state.setEraserSize,
		setAirbrushSize: state.setAirbrushSize,
	}));
}

/**
 * Get all font-related settings
 */
export function useFontSettings() {
	return useSettingsStore((state) => ({
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
	}));
}

/**
 * Get undo/redo state and actions
 */
export function useHistory() {
	return useCanvasStore((state) => ({
		canUndo: state.undoStack.length > 0,
		canRedo: state.redoStack.length > 0,
		saveState: state.saveState,
		undo: state.undo,
		redo: state.redo,
		clearHistory: state.clearHistory,
	}));
}

/**
 * Get tree-based history state and actions
 * Use this for the advanced branching history UI
 */
export function useTreeHistory() {
	return {
		historyTree: useHistoryStore((state) => state.historyTree),
		currentNode: useHistoryStore((state) => state.currentNode),
		rootNode: useHistoryStore((state) => state.getRoot()),
		canUndo: useHistoryStore((state) => state.canUndo()),
		canRedo: useHistoryStore((state) => state.canRedo()),
		pushState: useHistoryStore((state) => state.pushState),
		undo: useHistoryStore((state) => state.undo),
		redo: useHistoryStore((state) => state.redo),
		goToNode: useHistoryStore((state) => state.goToNode),
		getAllNodes: useHistoryStore((state) => state.getAllNodes),
		pruneHistory: useHistoryStore((state) => state.pruneHistory),
	};
}

/**
 * Get canvas dimensions and actions
 * Note: canvasRef should be managed locally with useRef in the component
 */
export function useCanvasDimensions() {
	const canvasWidth = useCanvasStore((state) => state.canvasWidth);
	const canvasHeight = useCanvasStore((state) => state.canvasHeight);
	const setCanvasSize = useCanvasStore((state) => state.setCanvasSize);

	return { canvasWidth, canvasHeight, setCanvasSize };
}

/**
 * Get tool state and actions
 */
export function useTool() {
	return useToolStore((state) => ({
		selectedToolId: state.selectedToolId,
		setTool: state.setTool,
	}));
}

/**
 * Get selection state and actions
 */
export function useSelection() {
	return useToolStore((state) => ({
		selection: state.selection,
		setSelection: state.setSelection,
		clearSelection: state.clearSelection,
		hasSelection: state.selection !== null,
	}));
}

/**
 * Get clipboard state and actions
 */
export function useClipboard() {
	const clipboard = useToolStore((state) => state.clipboard);
	const setClipboard = useToolStore((state) => state.setClipboard);
	const selection = useToolStore((state) => state.selection);

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

/**
 * Get text box state and actions
 */
export function useTextBox() {
	return {
		textBox: useToolStore((state) => state.textBox),
		setTextBox: useToolStore((state) => state.setTextBox),
		clearTextBox: useToolStore((state) => state.clearTextBox),
		fontFamily: useSettingsStore((state) => state.fontFamily),
		fontSize: useSettingsStore((state) => state.fontSize),
		fontBold: useSettingsStore((state) => state.fontBold),
		fontItalic: useSettingsStore((state) => state.fontItalic),
		fontUnderline: useSettingsStore((state) => state.fontUnderline),
		setFontFamily: useSettingsStore((state) => state.setFontFamily),
		setFontSize: useSettingsStore((state) => state.setFontSize),
		setFontStyle: useSettingsStore((state) => state.setFontStyle),
	};
}

/**
 * Get view state toggles
 */
export function useViewState() {
	return {
		showToolBox: useUIStore((state) => state.showToolBox),
		showColorBox: useUIStore((state) => state.showColorBox),
		showStatusBar: useUIStore((state) => state.showStatusBar),
		showTextToolbar: useUIStore((state) => state.showTextToolbar),
		showGrid: useUIStore((state) => state.showGrid),
		showThumbnail: useUIStore((state) => state.showThumbnail),
		drawOpaque: useSettingsStore((state) => state.drawOpaque),
		toggleToolBox: useUIStore((state) => state.toggleToolBox),
		toggleColorBox: useUIStore((state) => state.toggleColorBox),
		toggleStatusBar: useUIStore((state) => state.toggleStatusBar),
		toggleTextToolbar: useUIStore((state) => state.toggleTextToolbar),
		toggleGrid: useUIStore((state) => state.toggleGrid),
		toggleThumbnail: useUIStore((state) => state.toggleThumbnail),
		toggleDrawOpaque: useSettingsStore((state) => state.toggleDrawOpaque),
	};
}

/**
 * Get magnification state and actions
 */
export function useMagnification() {
	return {
		magnification: useUIStore((state) => state.magnification),
		setMagnification: useUIStore((state) => state.setMagnification),
	};
}

/**
 * Get cursor position state
 */
export function useCursorPosition() {
	return {
		cursorPosition: useUIStore((state) => state.cursorPosition),
		setCursorPosition: useUIStore((state) => state.setCursorPosition),
	};
}

/**
 * Get app state (for backwards compatibility)
 * Note: canvasRef must be passed to components that need it
 */
export function useApp() {
	return {
		state: {
			canvasWidth: useCanvasStore((state) => state.canvasWidth),
			canvasHeight: useCanvasStore((state) => state.canvasHeight),
		},
	};
}
