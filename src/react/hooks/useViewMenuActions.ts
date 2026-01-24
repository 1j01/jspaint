/**
 * View menu actions hook
 * Handles View menu operations: toggles, zoom, fullscreen, etc.
 */

import { RefObject, useCallback } from "react";
import { useUIStore } from "../context/state/uiStore";
import { viewBitmap as showViewBitmap } from "../utils/viewBitmap";

/**
 * View menu actions interface
 */
export interface ViewMenuActions {
	viewToggleToolBox: () => void;
	viewToggleColorBox: () => void;
	viewToggleStatusBar: () => void;
	viewToggleTextToolbar: () => void;
	viewZoomNormal: () => void;
	viewZoomLarge: () => void;
	viewZoomToWindow: () => void;
	viewZoomCustom: () => void;
	viewToggleGrid: () => void;
	viewToggleThumbnail: () => void;
	viewToggleAIPanel: () => void;
	viewBitmap: () => void;
	viewFullscreen: () => void;
}

/**
 * Parameters for the view menu actions hook
 */
export interface UseViewMenuActionsParams {
	canvasRef: RefObject<HTMLCanvasElement>;
	toggleToolBox: () => void;
	toggleColorBox: () => void;
	toggleStatusBar: () => void;
	toggleTextToolbar: () => void;
	toggleGrid: () => void;
	toggleThumbnail: () => void;
	toggleAIPanel: () => void;
	setMagnification: (mag: number) => void;
}

/**
 * Hook for View menu action handlers
 *
 * @param {UseViewMenuActionsParams} params - Hook parameters
 * @returns {ViewMenuActions} View menu action handlers
 *
 * @example
 * const viewActions = useViewMenuActions({
 *   canvasRef,
 *   toggleToolBox,
 *   toggleColorBox,
 *   toggleStatusBar,
 *   toggleTextToolbar,
 *   toggleGrid,
 *   toggleThumbnail,
 *   toggleAIPanel,
 *   setMagnification,
 * });
 */
export function useViewMenuActions(params: UseViewMenuActionsParams): ViewMenuActions {
	const {
		canvasRef,
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		toggleAIPanel,
		setMagnification,
	} = params;

	const openDialog = useUIStore((state) => state.openDialog);

	const viewZoomNormal = useCallback(() => setMagnification(1), [setMagnification]);
	const viewZoomLarge = useCallback(() => setMagnification(4), [setMagnification]);

	const viewZoomToWindow = useCallback(() => {
		const container = document.querySelector(".canvas-area");
		if (container && canvasRef.current) {
			const containerRect = container.getBoundingClientRect();
			const canvas = canvasRef.current;
			const scaleX = containerRect.width / canvas.width;
			const scaleY = containerRect.height / canvas.height;
			const scale = Math.min(scaleX, scaleY, 8);
			setMagnification(Math.max(0.1, scale));
		}
	}, [canvasRef, setMagnification]);

	const viewZoomCustom = useCallback(() => openDialog("customZoom"), [openDialog]);

	const viewBitmap = useCallback(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			showViewBitmap(canvas);
		} else {
			console.warn("[useViewMenuActions.viewBitmap] Canvas ref is null!");
		}
	}, [canvasRef]);

	const viewFullscreen = useCallback(() => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
	}, []);

	return {
		viewToggleToolBox: toggleToolBox,
		viewToggleColorBox: toggleColorBox,
		viewToggleStatusBar: toggleStatusBar,
		viewToggleTextToolbar: toggleTextToolbar,
		viewZoomNormal,
		viewZoomLarge,
		viewZoomToWindow,
		viewZoomCustom,
		viewToggleGrid: toggleGrid,
		viewToggleThumbnail: toggleThumbnail,
		viewToggleAIPanel: toggleAIPanel,
		viewBitmap,
		viewFullscreen,
	};
}
