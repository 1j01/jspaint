/**
 * Custom hook for creating menu action handlers
 * Facade that combines specialized per-menu hooks
 */

import { RefObject, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { MenuActions } from "../menus/menuDefinitions";
import { useFileMenuActions, UseFileMenuActionsParams } from "./useFileMenuActions";
import { useEditMenuActions, UseEditMenuActionsParams } from "./useEditMenuActions";
import { useViewMenuActions, UseViewMenuActionsParams } from "./useViewMenuActions";
import { useImageMenuActions, UseImageMenuActionsParams } from "./useImageMenuActions";
import { useColorsMenuActions, UseColorsMenuActionsParams } from "./useColorsMenuActions";
import { useUIStore } from "../context/state/uiStore";

/**
 * Parameters for the menu actions hook
 */
interface UseMenuActionsParams {
	canvasRef: RefObject<HTMLCanvasElement>;
	saveState: () => void;
	setCanvasSize: (width: number, height: number) => void;
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	hasSelection: boolean;
	selection: any;
	copy: () => void;
	cut: () => void;
	paste: () => ImageData | undefined;
	hasClipboard: boolean;
	clearSelection: () => void;
	handleSelectAll: () => void;
	handleInvertColors: () => void;
	handleClearImage: () => void;
	secondaryColor: string;
	setSelection: (selection: any) => void;
	setTool: (toolId: string) => void;
	showToolBox: boolean;
	showColorBox: boolean;
	showStatusBar: boolean;
	showTextToolbar: boolean;
	showGrid: boolean;
	showThumbnail: boolean;
	showAIPanel: boolean;
	toggleToolBox: () => void;
	toggleColorBox: () => void;
	toggleStatusBar: () => void;
	toggleTextToolbar: () => void;
	toggleGrid: () => void;
	toggleThumbnail: () => void;
	toggleAIPanel: () => void;
	toggleDrawOpaque: () => void;
	drawOpaque: boolean;
	magnification: number;
	setMagnification: (mag: number) => void;
	palette: string[];
	onShowNewConfirm?: () => void;
}

/**
 * Hook for creating all menu action handlers
 * Combines specialized per-menu hooks into a single MenuActions object
 *
 * @param {UseMenuActionsParams} params - Hook parameters
 * @returns {MenuActions} All menu action handlers
 *
 * @example
 * const menuActions = useMenuActions({
 *   canvasRef,
 *   saveState,
 *   setCanvasSize,
 *   undo,
 *   redo,
 *   // ... other params
 * });
 */
export function useMenuActions(params: UseMenuActionsParams): MenuActions {
	const {
		canvasRef,
		saveState,
		setCanvasSize,
		undo,
		redo,
		canUndo,
		canRedo,
		hasSelection,
		selection,
		copy,
		cut,
		paste,
		hasClipboard,
		clearSelection,
		handleSelectAll,
		handleInvertColors,
		handleClearImage,
		secondaryColor,
		setSelection,
		setTool,
		showToolBox,
		showColorBox,
		showStatusBar,
		showTextToolbar,
		showGrid,
		showThumbnail,
		showAIPanel,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		toggleAIPanel,
		toggleDrawOpaque,
		drawOpaque,
		magnification,
		setMagnification,
		palette,
		onShowNewConfirm,
	} = params;

	const openDialog = useUIStore((state) => state.openDialog);
	const { i18n } = useTranslation();

	// File menu actions
	const fileMenuParams: UseFileMenuActionsParams = {
		canvasRef,
		saveState,
		setCanvasSize,
		setMagnification,
		clearSelection,
		onShowNewConfirm,
	};
	const fileActions = useFileMenuActions(fileMenuParams);

	// Edit menu actions
	const editMenuParams: UseEditMenuActionsParams = {
		canvasRef,
		saveState,
		undo,
		redo,
		hasSelection,
		selection,
		copy,
		cut,
		paste,
		hasClipboard,
		clearSelection,
		handleSelectAll,
		secondaryColor,
		setSelection,
		setTool,
	};
	const editActions = useEditMenuActions(editMenuParams);

	// View menu actions
	const viewMenuParams: UseViewMenuActionsParams = {
		canvasRef,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		toggleAIPanel,
		setMagnification,
	};
	const viewActions = useViewMenuActions(viewMenuParams);

	// Image menu actions
	const imageMenuParams: UseImageMenuActionsParams = {
		canvasRef,
		saveState,
		setCanvasSize,
		selection,
		clearSelection,
		handleInvertColors,
		handleClearImage,
		toggleDrawOpaque,
	};
	const imageActions = useImageMenuActions(imageMenuParams);

	// Colors menu actions
	const colorsMenuParams: UseColorsMenuActionsParams = {
		palette,
	};
	const colorsActions = useColorsMenuActions(colorsMenuParams);

	// Extras menu actions
	const extrasChangeLanguage = useCallback((languageCode: string) => {
		i18n.changeLanguage(languageCode);
		try {
			localStorage.setItem('mcpaint-language', languageCode);
		} catch (error) {
			// Silently fail if localStorage is unavailable
		}
	}, [i18n]);

	const getCurrentLanguage = useCallback(() => i18n.language, [i18n]);

	// Help menu actions
	const helpTopics = useCallback(() => openDialog("helpTopics"), [openDialog]);
	const helpAbout = useCallback(() => openDialog("about"), [openDialog]);

	return {
		// File menu
		...fileActions,

		// Edit menu
		...editActions,

		// View menu
		...viewActions,

		// Image menu
		...imageActions,

		// Colors menu
		...colorsActions,

		// Extras menu
		extrasChangeLanguage,
		getCurrentLanguage,

		// Help menu
		helpTopics,
		helpAbout,

		// State checks - these must return CURRENT values, not captured values
		canUndo: useCallback(() => canUndo, [canUndo]),
		canRedo: useCallback(() => canRedo, [canRedo]),
		hasSelection: useCallback(() => hasSelection, [hasSelection]),
		hasClipboard: useCallback(() => hasClipboard, [hasClipboard]),
		isToolBoxVisible: useCallback(() => showToolBox, [showToolBox]),
		isColorBoxVisible: useCallback(() => showColorBox, [showColorBox]),
		isStatusBarVisible: useCallback(() => showStatusBar, [showStatusBar]),
		isTextToolbarVisible: useCallback(() => showTextToolbar, [showTextToolbar]),
		isGridVisible: useCallback(() => showGrid, [showGrid]),
		isThumbnailVisible: useCallback(() => showThumbnail, [showThumbnail]),
		isAIPanelVisible: useCallback(() => showAIPanel, [showAIPanel]),
		isFullscreen: () => !!document.fullscreenElement,
		isDrawOpaque: useCallback(() => drawOpaque, [drawOpaque]),
		getMagnification: useCallback(() => magnification, [magnification]),
	};
}
