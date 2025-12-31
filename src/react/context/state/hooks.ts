/**
 * Convenience hooks for Zustand stores
 *
 * These hooks provide clean, composable selectors for common state combinations.
 * IMPORTANT: We do NOT use useShallow for actions - Zustand actions are already stable.
 * Individual selectors provide better stability and prevent infinite re-render loops.
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
	const primaryColor = useSettingsStore((state) => state.primaryColor);
	const secondaryColor = useSettingsStore((state) => state.secondaryColor);
	const palette = useSettingsStore((state) => state.palette);
	const setPrimaryColor = useSettingsStore((state) => state.setPrimaryColor);
	const setSecondaryColor = useSettingsStore((state) => state.setSecondaryColor);
	const swapColors = useSettingsStore((state) => state.swapColors);

	return {
		primaryColor,
		secondaryColor,
		palette,
		setPrimaryColor,
		setSecondaryColor,
		swapColors,
	};
}

/**
 * Get all shape-related settings
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

/**
 * Get all brush-related settings
 */
export function useBrushSettings() {
	const brushSize = useSettingsStore((state) => state.brushSize);
	const brushShape = useSettingsStore((state) => state.brushShape);
	const pencilSize = useSettingsStore((state) => state.pencilSize);
	const eraserSize = useSettingsStore((state) => state.eraserSize);
	const airbrushSize = useSettingsStore((state) => state.airbrushSize);
	const setBrushSize = useSettingsStore((state) => state.setBrushSize);
	const setBrushShape = useSettingsStore((state) => state.setBrushShape);
	const setEraserSize = useSettingsStore((state) => state.setEraserSize);
	const setAirbrushSize = useSettingsStore((state) => state.setAirbrushSize);

	return {
		brushSize,
		brushShape,
		pencilSize,
		eraserSize,
		airbrushSize,
		setBrushSize,
		setBrushShape,
		setEraserSize,
		setAirbrushSize,
	};
}

/**
 * Get all font-related settings
 */
export function useFontSettings() {
	const fontFamily = useSettingsStore((state) => state.fontFamily);
	const fontSize = useSettingsStore((state) => state.fontSize);
	const fontBold = useSettingsStore((state) => state.fontBold);
	const fontItalic = useSettingsStore((state) => state.fontItalic);
	const fontUnderline = useSettingsStore((state) => state.fontUnderline);
	const textTransparent = useSettingsStore((state) => state.textTransparent);
	const setFontFamily = useSettingsStore((state) => state.setFontFamily);
	const setFontSize = useSettingsStore((state) => state.setFontSize);
	const setFontStyle = useSettingsStore((state) => state.setFontStyle);
	const setTextTransparent = useSettingsStore((state) => state.setTextTransparent);

	return {
		fontFamily,
		fontSize,
		fontBold,
		fontItalic,
		fontUnderline,
		textTransparent,
		setFontFamily,
		setFontSize,
		setFontStyle,
		setTextTransparent,
	};
}

/**
 * Get undo/redo state and actions
 */
export function useHistory() {
	const canUndo = useCanvasStore((state) => state.undoStack.length > 0);
	const canRedo = useCanvasStore((state) => state.redoStack.length > 0);
	const saveState = useCanvasStore((state) => state.saveState);
	const undo = useCanvasStore((state) => state.undo);
	const redo = useCanvasStore((state) => state.redo);
	const clearHistory = useCanvasStore((state) => state.clearHistory);

	return {
		canUndo,
		canRedo,
		saveState,
		undo,
		redo,
		clearHistory,
	};
}

/**
 * Get tree-based history state and actions
 * Use this for the advanced branching history UI
 *
 * NOTE: This hook does NOT return currentNode to avoid unnecessary re-renders.
 * Use useCurrentHistoryNode() if you specifically need to track the current node.
 */
export function useTreeHistory() {
	const historyTree = useHistoryStore((state) => state.historyTree);
	const getRoot = useHistoryStore((state) => state.getRoot);
	const canUndo = useHistoryStore((state) => state.canUndo);
	const canRedo = useHistoryStore((state) => state.canRedo);
	const pushState = useHistoryStore((state) => state.pushState);
	const undo = useHistoryStore((state) => state.undo);
	const redo = useHistoryStore((state) => state.redo);
	const goToNode = useHistoryStore((state) => state.goToNode);
	const getAllNodes = useHistoryStore((state) => state.getAllNodes);
	const pruneHistory = useHistoryStore((state) => state.pruneHistory);

	return {
		historyTree,
		getRoot,
		canUndo,
		canRedo,
		pushState,
		undo,
		redo,
		goToNode,
		getAllNodes,
		pruneHistory,
	};
}

/**
 * Get only the current history node
 * Use this sparingly as it will cause re-renders on every history change
 */
export function useCurrentHistoryNode() {
	return useHistoryStore((state) => state.currentNode);
}

/**
 * Get canvas dimensions and actions
 */
export function useCanvasDimensions() {
	const canvasWidth = useCanvasStore((state) => state.canvasWidth);
	const canvasHeight = useCanvasStore((state) => state.canvasHeight);
	const setCanvasSize = useCanvasStore((state) => state.setCanvasSize);

	return {
		canvasWidth,
		canvasHeight,
		setCanvasSize,
	};
}

/**
 * Get tool state and actions
 */
export function useTool() {
	const selectedToolId = useToolStore((state) => state.selectedToolId);
	const setTool = useToolStore((state) => state.setTool);

	return {
		selectedToolId,
		setTool,
	};
}

/**
 * Get selection state and actions
 */
export function useSelection() {
	const selection = useToolStore((state) => state.selection);
	const setSelection = useToolStore((state) => state.setSelection);
	const clearSelection = useToolStore((state) => state.clearSelection);
	const hasSelection = selection !== null;

	return {
		selection,
		setSelection,
		clearSelection,
		hasSelection,
	};
}

/**
 * Get clipboard state and actions
 * Actions are stable module-level functions for maximum stability
 */
export function useClipboard() {
	const clipboard = useToolStore((state) => state.clipboard);
	const hasClipboard = clipboard !== null;

	// Return stable object - no useMemo needed
	return {
		clipboard,
		hasClipboard,
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
}

/**
 * Get text box state
 */
export function useTextBoxState() {
	return useToolStore((state) => state.textBox);
}

/**
 * Get text box actions
 */
export function useTextBoxActions() {
	const setTextBox = useToolStore((state) => state.setTextBox);
	const clearTextBox = useToolStore((state) => state.clearTextBox);

	return {
		setTextBox,
		clearTextBox,
	};
}

/**
 * Combined text box hook (for backwards compatibility)
 * NOTE: This combines multiple stores - prefer using separate hooks for better performance
 */
export function useTextBox() {
	const textBox = useToolStore((state) => state.textBox);
	const setTextBox = useToolStore((state) => state.setTextBox);
	const clearTextBox = useToolStore((state) => state.clearTextBox);
	const fontFamily = useSettingsStore((state) => state.fontFamily);
	const fontSize = useSettingsStore((state) => state.fontSize);
	const fontBold = useSettingsStore((state) => state.fontBold);
	const fontItalic = useSettingsStore((state) => state.fontItalic);
	const fontUnderline = useSettingsStore((state) => state.fontUnderline);
	const setFontFamily = useSettingsStore((state) => state.setFontFamily);
	const setFontSize = useSettingsStore((state) => state.setFontSize);
	const setFontStyle = useSettingsStore((state) => state.setFontStyle);

	return {
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
	};
}

/**
 * Get view state toggles
 */
export function useViewState() {
	const showToolBox = useUIStore((state) => state.showToolBox);
	const showColorBox = useUIStore((state) => state.showColorBox);
	const showStatusBar = useUIStore((state) => state.showStatusBar);
	const showTextToolbar = useUIStore((state) => state.showTextToolbar);
	const showGrid = useUIStore((state) => state.showGrid);
	const showThumbnail = useUIStore((state) => state.showThumbnail);
	const toggleToolBox = useUIStore((state) => state.toggleToolBox);
	const toggleColorBox = useUIStore((state) => state.toggleColorBox);
	const toggleStatusBar = useUIStore((state) => state.toggleStatusBar);
	const toggleTextToolbar = useUIStore((state) => state.toggleTextToolbar);
	const toggleGrid = useUIStore((state) => state.toggleGrid);
	const toggleThumbnail = useUIStore((state) => state.toggleThumbnail);
	const drawOpaque = useSettingsStore((state) => state.drawOpaque);
	const toggleDrawOpaque = useSettingsStore((state) => state.toggleDrawOpaque);

	return {
		showToolBox,
		showColorBox,
		showStatusBar,
		showTextToolbar,
		showGrid,
		showThumbnail,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		drawOpaque,
		toggleDrawOpaque,
	};
}

/**
 * Get magnification state and actions
 */
export function useMagnification() {
	const magnification = useUIStore((state) => state.magnification);
	const setMagnification = useUIStore((state) => state.setMagnification);

	return {
		magnification,
		setMagnification,
	};
}

/**
 * Get cursor position state
 */
export function useCursorPosition() {
	const cursorPosition = useUIStore((state) => state.cursorPosition);
	const setCursorPosition = useUIStore((state) => state.setCursorPosition);

	return {
		cursorPosition,
		setCursorPosition,
	};
}

/**
 * Get app state (for backwards compatibility)
 */
export function useApp() {
	const canvasWidth = useCanvasStore((state) => state.canvasWidth);
	const canvasHeight = useCanvasStore((state) => state.canvasHeight);

	return {
		state: {
			canvasWidth,
			canvasHeight,
		},
	};
}
