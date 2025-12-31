/**
 * Convenience hooks for Zustand stores
 *
 * These hooks provide clean, composable selectors for common state combinations.
 * They use useShallow for optimal re-render performance.
 */

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
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
	return useHistoryStore(useShallow(
		(state) => ({
			historyTree: state.historyTree,
			currentNode: state.currentNode,
			// Return the functions themselves, NOT their results
			getRoot: state.getRoot,
			canUndo: state.canUndo,
			canRedo: state.canRedo,
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
 */
export function useCanvasDimensions() {
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

// Stable clipboard helper functions (defined at module level to avoid recreation)
const clipboardHelpers = {
	copy: () => {
		const selection = useToolStore.getState().selection;
		if (selection?.imageData) {
			useToolStore.getState().setClipboard(selection.imageData);
		}
	},
	cut: () => {
		const selection = useToolStore.getState().selection;
		if (selection?.imageData) {
			useToolStore.getState().setClipboard(selection.imageData);
		}
	},
	paste: () => {
		return useToolStore.getState().clipboard || undefined;
	},
};

/**
 * Get clipboard state and actions
 */
export function useClipboard() {
	const clipboard = useToolStore((state) => state.clipboard);

	// Memoize the returned object to prevent infinite re-renders
	return useMemo(() => ({
		clipboard,
		hasClipboard: clipboard !== null,
		...clipboardHelpers,
	}), [clipboard]);
}

/**
 * Get text box state and actions
 */
export function useTextBox() {
	const { textBox, setTextBox, clearTextBox } = useToolStore(useShallow(
		(state) => ({
			textBox: state.textBox,
			setTextBox: state.setTextBox,
			clearTextBox: state.clearTextBox,
		})
	));

	const { fontFamily, fontSize, fontBold, fontItalic, fontUnderline, setFontFamily, setFontSize, setFontStyle } = useSettingsStore(useShallow(
		(state) => ({
			fontFamily: state.fontFamily,
			fontSize: state.fontSize,
			fontBold: state.fontBold,
			fontItalic: state.fontItalic,
			fontUnderline: state.fontUnderline,
			setFontFamily: state.setFontFamily,
			setFontSize: state.setFontSize,
			setFontStyle: state.setFontStyle,
		})
	));

	// Memoize the combined result to prevent infinite re-renders
	return useMemo(() => ({
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
	}), [textBox, setTextBox, clearTextBox, fontFamily, fontSize, fontBold, fontItalic, fontUnderline, setFontFamily, setFontSize, setFontStyle]);
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

	// Memoize the combined result to prevent infinite re-renders
	return useMemo(() => ({ ...uiState, ...settingsState }), [uiState, settingsState]);
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
