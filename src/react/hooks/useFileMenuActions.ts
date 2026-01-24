/**
 * File menu actions hook
 * Handles File menu operations: New, Open, Save, Save As, etc.
 */

import { RefObject, useCallback } from "react";
import { useUIStore } from "../context/state/uiStore";
import { loadImageFileToCanvas, createFileInput } from "../utils/fileOperations";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "../constants/canvas";

/**
 * File menu actions interface
 */
export interface FileMenuActions {
	fileNew: () => void;
	fileOpen: () => void;
	fileSave: () => void;
	fileSaveAs: () => void;
	fileLoadFromUrl: () => void;
	fileUploadToImgur: () => void;
	fileManageStorage: () => void;
	filePrint: () => void;
	fileExit: () => void;
}

/**
 * Parameters for the file menu actions hook
 */
export interface UseFileMenuActionsParams {
	canvasRef: RefObject<HTMLCanvasElement>;
	saveState: () => void;
	setCanvasSize: (width: number, height: number) => void;
	setMagnification: (mag: number) => void;
	clearSelection: () => void;
	onShowNewConfirm?: () => void;
}

/**
 * Hook for File menu action handlers
 *
 * @param {UseFileMenuActionsParams} params - Hook parameters
 * @returns {FileMenuActions} File menu action handlers
 *
 * @example
 * const fileActions = useFileMenuActions({
 *   canvasRef,
 *   saveState,
 *   setCanvasSize,
 *   setMagnification,
 *   clearSelection,
 *   onShowNewConfirm: () => setShowNewConfirm(true),
 * });
 */
export function useFileMenuActions(params: UseFileMenuActionsParams): FileMenuActions {
	const {
		canvasRef,
		saveState,
		setCanvasSize,
		setMagnification,
		clearSelection,
		onShowNewConfirm,
	} = params;

	const openDialog = useUIStore((state) => state.openDialog);

	const fileNew = useCallback(() => {
		if (onShowNewConfirm) {
			onShowNewConfirm();
		} else {
			// Fallback to confirm if callback not provided
			if (confirm("Clear the current image and start new?")) {
				// Reset canvas to default size (Windows XP: 512x384)
				setCanvasSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);

				// Reset magnification to 1x (100%)
				setMagnification(1);

				// Fill with white on next frame after resize
				requestAnimationFrame(() => {
					const canvas = canvasRef.current;
					if (canvas) {
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						if (ctx) {
							ctx.fillStyle = "#FFFFFF";
							ctx.fillRect(0, 0, canvas.width, canvas.height);
							saveState();
						}
					}
				});
			}
		}
	}, [onShowNewConfirm, canvasRef, setCanvasSize, saveState, setMagnification]);

	const fileOpen = useCallback(() => {
		createFileInput(".png,.jpg,.jpeg,.bmp,image/png,image/jpeg,image/bmp", async (file) => {
			try {
				await loadImageFileToCanvas(file, canvasRef, {
					onClearSelection: clearSelection,
					onSetCanvasSize: setCanvasSize,
					onSaveState: saveState,
				});
			} catch (error) {
				console.error("[fileOpen] Error loading file:", error);
				alert(`Failed to load image: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		});
	}, [canvasRef, saveState, setCanvasSize, clearSelection]);

	const fileSave = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const link = document.createElement("a");
		link.download = "image.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
	}, [canvasRef]);

	const fileSaveAs = useCallback(() => openDialog("saveAs"), [openDialog]);
	const fileLoadFromUrl = useCallback(() => openDialog("loadFromUrl"), [openDialog]);
	const fileUploadToImgur = useCallback(() => openDialog("imgurUpload"), [openDialog]);
	const fileManageStorage = useCallback(() => openDialog("manageStorage"), [openDialog]);
	const filePrint = useCallback(() => window.print(), []);
	const fileExit = useCallback(() => {
		if (confirm("Are you sure you want to exit?")) {
			window.close();
		}
	}, []);

	return {
		fileNew,
		fileOpen,
		fileSave,
		fileSaveAs,
		fileLoadFromUrl,
		fileUploadToImgur,
		fileManageStorage,
		filePrint,
		fileExit,
	};
}
