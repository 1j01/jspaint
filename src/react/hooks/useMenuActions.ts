/**
 * Custom hook for creating menu action handlers
 * Extracted from App.tsx to reduce complexity
 */

import { RefObject, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { MenuActions } from "../menus/menuDefinitions";
import { useUIStore } from "../context/state/uiStore";

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
	paste: () => void;
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
	toggleToolBox: () => void;
	toggleColorBox: () => void;
	toggleStatusBar: () => void;
	toggleTextToolbar: () => void;
	toggleGrid: () => void;
	toggleThumbnail: () => void;
	toggleDrawOpaque: () => void;
	drawOpaque: boolean;
	magnification: number;
	setMagnification: (mag: number) => void;
	palette: string[];
}

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
		toggleToolBox,
		toggleColorBox,
		toggleStatusBar,
		toggleTextToolbar,
		toggleGrid,
		toggleThumbnail,
		toggleDrawOpaque,
		drawOpaque,
		magnification,
		setMagnification,
		palette,
	} = params;

	const openDialog = useUIStore((state) => state.openDialog);

	// Get i18next for language switching
	const { i18n } = useTranslation();

	return {
		// File menu
		fileNew: useCallback(() => {
			if (confirm("Clear the current image and start new?")) {
				saveState();
				const canvas = canvasRef.current;
				if (canvas) {
					const ctx = canvas.getContext("2d", { willReadFrequently: true });
					if (ctx) {
						ctx.fillStyle = "#FFFFFF";
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}
				}
			}
		}, [canvasRef, saveState]),

		fileOpen: useCallback(() => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.onchange = (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = (ev) => {
					const img = new Image();
					img.onload = () => {
						const canvas = canvasRef.current;
						if (!canvas) return;
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						if (!ctx) return;
						saveState();
						canvas.width = img.width;
						canvas.height = img.height;
						ctx.drawImage(img, 0, 0);
						setCanvasSize(img.width, img.height);
					};
					img.src = ev.target?.result as string;
				};
				reader.readAsDataURL(file);
			};
			input.click();
		}, [canvasRef, saveState, setCanvasSize]),

		fileSave: useCallback(() => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const link = document.createElement("a");
			link.download = "image.png";
			link.href = canvas.toDataURL("image/png");
			link.click();
		}, [canvasRef]),

		fileSaveAs: useCallback(() => openDialog("saveAs"), [openDialog]),
		fileLoadFromUrl: useCallback(() => openDialog("loadFromUrl"), [openDialog]),
		fileUploadToImgur: useCallback(() => openDialog("imgurUpload"), [openDialog]),
		fileManageStorage: useCallback(() => openDialog("manageStorage"), [openDialog]),
		filePrint: useCallback(() => window.print(), []),
		fileExit: useCallback(() => {
			if (confirm("Are you sure you want to exit?")) {
				window.close();
			}
		}, []),

		// Edit menu
		editUndo: undo,
		editRedo: redo,
		editHistory: useCallback(() => openDialog("history"), [openDialog]),
		editCut: useCallback(() => {
			if (hasSelection) {
				cut();
				clearSelection();
			}
		}, [hasSelection, cut, clearSelection]),
		editCopy: useCallback(() => {
			if (hasSelection) copy();
		}, [hasSelection, copy]),
		editPaste: useCallback(() => {
			if (hasClipboard) paste();
		}, [hasClipboard, paste]),
		editClearSelection: useCallback(() => {
			if (hasSelection) {
				const canvas = canvasRef.current;
				if (canvas && selection) {
					const ctx = canvas.getContext("2d", { willReadFrequently: true });
					if (ctx) {
						saveState();
						ctx.fillStyle = secondaryColor;
						ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
					}
				}
				clearSelection();
			}
		}, [hasSelection, canvasRef, selection, saveState, secondaryColor, clearSelection]),
		editSelectAll: handleSelectAll,
		editCopyTo: useCallback(() => {
			if (hasSelection) {
				const canvas = canvasRef.current;
				if (canvas && selection) {
					const tempCanvas = document.createElement("canvas");
					tempCanvas.width = selection.width;
					tempCanvas.height = selection.height;
					const tempCtx = tempCanvas.getContext("2d");
					if (tempCtx) {
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						if (ctx) {
							const imageData = ctx.getImageData(
								selection.x,
								selection.y,
								selection.width,
								selection.height,
							);
							tempCtx.putImageData(imageData, 0, 0);
							const link = document.createElement("a");
							link.download = "selection.png";
							link.href = tempCanvas.toDataURL("image/png");
							link.click();
						}
					}
				}
			}
		}, [hasSelection, canvasRef, selection]),
		editPasteFrom: useCallback(() => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.onchange = (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = (ev) => {
					const img = new Image();
					img.onload = () => {
						const tempCanvas = document.createElement("canvas");
						tempCanvas.width = img.width;
						tempCanvas.height = img.height;
						const tempCtx = tempCanvas.getContext("2d");
						if (tempCtx) {
							tempCtx.drawImage(img, 0, 0);
							const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
							setSelection({
								x: 0,
								y: 0,
								width: img.width,
								height: img.height,
								imageData,
							});
							setTool("select");
						}
					};
					img.src = ev.target?.result as string;
				};
				reader.readAsDataURL(file);
			};
			input.click();
		}, [setSelection, setTool]),

		// View menu
		viewToggleToolBox: toggleToolBox,
		viewToggleColorBox: toggleColorBox,
		viewToggleStatusBar: toggleStatusBar,
		viewToggleTextToolbar: toggleTextToolbar,
		viewZoomNormal: useCallback(() => setMagnification(1), [setMagnification]),
		viewZoomLarge: useCallback(() => setMagnification(4), [setMagnification]),
		viewZoomToWindow: useCallback(() => {
			const container = document.querySelector(".canvas-area");
			if (container && canvasRef.current) {
				const containerRect = container.getBoundingClientRect();
				const canvas = canvasRef.current;
				const scaleX = containerRect.width / canvas.width;
				const scaleY = containerRect.height / canvas.height;
				const scale = Math.min(scaleX, scaleY, 8);
				setMagnification(Math.max(0.1, scale));
			}
		}, [canvasRef, setMagnification]),
		viewZoomCustom: useCallback(() => openDialog("customZoom"), [openDialog]),
		viewToggleGrid: toggleGrid,
		viewToggleThumbnail: toggleThumbnail,
		viewBitmap: useCallback(() => {
			const canvas = canvasRef.current;
			if (canvas) {
				const { viewBitmap } = require("../utils/viewBitmap");
				viewBitmap(canvas);
			}
		}, [canvasRef]),
		viewFullscreen: useCallback(() => {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
		}, []),

		// Image menu
		imageFlipRotate: useCallback(() => openDialog("flipRotate"), [openDialog]),
		imageStretchSkew: useCallback(() => openDialog("stretchSkew"), [openDialog]),
		imageInvertColors: handleInvertColors,
		imageAttributes: useCallback(() => openDialog("attributes"), [openDialog]),
		imageClearImage: handleClearImage,
		imageCropToSelection: useCallback(() => {
			if (!selection) return;
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			saveState();
			const imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
			canvas.width = selection.width;
			canvas.height = selection.height;
			ctx.putImageData(imageData, 0, 0);
			setCanvasSize(selection.width, selection.height);
			clearSelection();
		}, [selection, canvasRef, saveState, setCanvasSize, clearSelection]),
		imageToggleDrawOpaque: toggleDrawOpaque,

		// Colors menu
		colorsEditColors: useCallback(() => openDialog("editColors"), [openDialog]),
		colorsGetColors: useCallback(async () => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".pal,.gpl,.txt,.hex";
			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;

				try {
					const { loadPaletteFile } = await import("../utils/paletteFormats");
					const colors = await loadPaletteFile(file);
					if (colors.length > 0) {
						alert(`Loaded ${colors.length} colors from palette file.\n\nFull palette replacement coming soon. For now, you can use the Edit Colors dialog to manually add these colors.`);
						console.log("Loaded palette colors:", colors);
					} else {
						alert("No colors found in the palette file.");
					}
				} catch (error) {
					console.error("Failed to load palette:", error);
					alert(`Failed to load palette: ${error instanceof Error ? error.message : "Unknown error"}`);
				}
			};
			input.click();
		}, []),
		colorsSaveColors: useCallback(async () => {
			try {
				const { downloadPalette } = await import("../utils/paletteFormats");
				await downloadPalette(palette, "palette.gpl", "gpl");
			} catch (error) {
				console.error("Failed to save palette:", error);
				alert(`Failed to save palette: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		}, [palette]),

		// Extras menu
		extrasChangeLanguage: useCallback((languageCode: string) => {
			i18n.changeLanguage(languageCode);
			// Store in localStorage for persistence
			try {
				localStorage.setItem('mcpaint-language', languageCode);
			} catch (error) {
				console.warn('Failed to save language preference:', error);
			}
		}, [i18n]),

		getCurrentLanguage: useCallback(() => i18n.language, [i18n]),

		// Help menu
		helpTopics: useCallback(() => openDialog("helpTopics"), [openDialog]),
		helpAbout: useCallback(() => openDialog("about"), [openDialog]),

		// State checks
		canUndo: () => canUndo,
		canRedo: () => canRedo,
		hasSelection: () => hasSelection,
		hasClipboard: () => hasClipboard,
		isToolBoxVisible: () => showToolBox,
		isColorBoxVisible: () => showColorBox,
		isStatusBarVisible: () => showStatusBar,
		isTextToolbarVisible: () => showTextToolbar,
		isGridVisible: () => showGrid,
		isThumbnailVisible: () => showThumbnail,
		isFullscreen: () => !!document.fullscreenElement,
		isDrawOpaque: () => drawOpaque,
		getMagnification: () => magnification,
	};
}
