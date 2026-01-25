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
	fileSetWallpaperTiled: () => void;
	fileSetWallpaperCentered: () => void;
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

	/**
	 * Downloads the canvas image as a wallpaper file
	 * @param {HTMLCanvasElement} sourceCanvas - The canvas to save
	 * @param {string} suffix - Suffix for the filename (e.g., "tiled" or "centered")
	 */
	const downloadWallpaper = useCallback((sourceCanvas: HTMLCanvasElement, suffix: string) => {
		const link = document.createElement("a");
		link.download = `wallpaper-${suffix}.png`;
		link.href = sourceCanvas.toDataURL("image/png");
		link.click();
	}, []);

	/**
	 * Creates a tiled wallpaper by repeating the canvas pattern to fill screen dimensions
	 */
	const fileSetWallpaperTiled = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Create a canvas sized to the screen dimensions
		const wallpaperCanvas = document.createElement("canvas");
		wallpaperCanvas.width = window.screen.width;
		wallpaperCanvas.height = window.screen.height;
		const ctx = wallpaperCanvas.getContext("2d");
		if (!ctx) return;

		// Create a repeating pattern from the source canvas
		const pattern = ctx.createPattern(canvas, "repeat");
		if (pattern) {
			ctx.fillStyle = pattern;
			ctx.fillRect(0, 0, wallpaperCanvas.width, wallpaperCanvas.height);
		}

		downloadWallpaper(wallpaperCanvas, "tiled");
	}, [canvasRef, downloadWallpaper]);

	/**
	 * Creates a centered wallpaper with the canvas centered on a background
	 */
	const fileSetWallpaperCentered = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Create a canvas sized to the screen dimensions
		const wallpaperCanvas = document.createElement("canvas");
		wallpaperCanvas.width = window.screen.width;
		wallpaperCanvas.height = window.screen.height;
		const ctx = wallpaperCanvas.getContext("2d");
		if (!ctx) return;

		// Fill background with a neutral color (dark teal like classic Windows)
		ctx.fillStyle = "#008080";
		ctx.fillRect(0, 0, wallpaperCanvas.width, wallpaperCanvas.height);

		// Center the canvas image
		const x = Math.floor((wallpaperCanvas.width - canvas.width) / 2);
		const y = Math.floor((wallpaperCanvas.height - canvas.height) / 2);
		ctx.drawImage(canvas, x, y);

		downloadWallpaper(wallpaperCanvas, "centered");
	}, [canvasRef, downloadWallpaper]);

	return {
		fileNew,
		fileOpen,
		fileSave,
		fileSaveAs,
		fileLoadFromUrl,
		fileUploadToImgur,
		fileManageStorage,
		filePrint,
		fileSetWallpaperTiled,
		fileSetWallpaperCentered,
		fileExit,
	};
}
