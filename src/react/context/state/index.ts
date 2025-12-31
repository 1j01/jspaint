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

import { useMemo } from "react";
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
	return useSettingsStore(
		(state) => ({
			primaryColor: state.primaryColor,
			secondaryColor: state.secondaryColor,
			palette: state.palette,
			setPrimaryColor: state.setPrimaryColor,
			setSecondaryColor: state.setSecondaryColor,
			swapColors: state.swapColors,
		}),
		useShallow,
	);
}

/**
 * Get all shape-related settings
 */
export function useShapeSettings() {
	return useSettingsStore(
		(state) => ({
		fillStyle: state.fillStyle,
		lineWidth: state.lineWidth,
		setFillStyle: state.setFillStyle,
		setLineWidth: state.setLineWidth,
		}),
		useShallow,
	);
}

/**
 * Get all brush-related settings
 */
export function useBrushSettings() {
	return useSettingsStore(
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
		}),
		useShallow,
	);
}

/**
 * Get all font-related settings
 */
export function useFontSettings() {
	return useSettingsStore(
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
		}),
		useShallow,
	);
}

/**
 * Get undo/redo state and actions
 */
export function useHistory() {
	return useCanvasStore(
		(state) => ({
		canUndo: state.undoStack.length > 0,
		canRedo: state.redoStack.length > 0,
		saveState: state.saveState,
		undo: state.undo,
		redo: state.redo,
		clearHistory: state.clearHistory,
		}),
		useShallow,
	);
}

/**
 * Get tree-based history state and actions
 * Use this for the advanced branching history UI
 */
export function useTreeHistory() {
	return useHistoryStore(
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
		}),
		useShallow,
	);
}

/**
 * Get canvas dimensions and actions
 * Note: canvasRef should be managed locally with useRef in the component
 */
export function useCanvasDimensions() {
	return useCanvasStore(
		(state) => ({
			canvasWidth: state.canvasWidth,
			canvasHeight: state.canvasHeight,
			setCanvasSize: state.setCanvasSize,
		}),
		useShallow,
	);
}

/**
 * Get tool state and actions
 */
export function useTool() {
	return useToolStore(
		(state) => ({
		selectedToolId: state.selectedToolId,
		setTool: state.setTool,
		}),
		useShallow,
	);
}

/**
 * Get selection state and actions
 */
export function useSelection() {
	return useToolStore(
		(state) => ({
		selection: state.selection,
		setSelection: state.setSelection,
		clearSelection: state.clearSelection,
		hasSelection: state.selection !== null,
		}),
		useShallow,
	);
}

/**
 * Get clipboard state and actions
 */
export function useClipboard() {
	return useToolStore(
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
		},
		useShallow,
	);
}

/**
 * Get text box state and actions
 */
export function useTextBox() {
	return useToolStore(
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
		},
		useShallow,
	);
}

/**
 * Get view state toggles
 */
export function useViewState() {
	const uiState = useUIStore(
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
		}),
		useShallow,
	);

	const settingsState = useSettingsStore(
		(state) => ({
			drawOpaque: state.drawOpaque,
			toggleDrawOpaque: state.toggleDrawOpaque,
		}),
		useShallow,
	);

	return useMemo(() => ({ ...uiState, ...settingsState }), [uiState, settingsState]);
}

/**
 * Get magnification state and actions
 */
export function useMagnification() {
	return useUIStore(
		(state) => ({
			magnification: state.magnification,
			setMagnification: state.setMagnification,
		}),
		useShallow,
	);
}

/**
 * Get cursor position state
 */
export function useCursorPosition() {
	return useUIStore(
		(state) => ({
			cursorPosition: state.cursorPosition,
			setCursorPosition: state.setCursorPosition,
		}),
		useShallow,
	);
}

/**
 * Get app state (for backwards compatibility)
 * Note: canvasRef must be passed to components that need it
 */
export function useApp() {
	return useCanvasStore(
		(state) => ({
			state: {
				canvasWidth: state.canvasWidth,
				canvasHeight: state.canvasHeight,
			},
		}),
		useShallow,
	);
}
