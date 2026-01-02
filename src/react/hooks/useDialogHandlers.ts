import { useCallback, RefObject } from "react";
import type { FlipRotateAction } from "../components/dialogs/FlipRotateDialog";
import type { StretchSkewValues } from "../components/dialogs/StretchSkewDialog";
import type { AttributesValues } from "../components/dialogs/AttributesDialog";
import type { MessageBoxResult } from "../components/dialogs/MessageBoxDialog";
import { TOOL_IDS } from "../context/state/types";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "../constants/canvas";
import {
	applyToCanvas,
	flipHorizontal,
	flipVertical,
	invertColors,
	rotate,
	skew,
	stretch,
	transformCanvas,
} from "../utils/imageTransforms";
import { downloadCanvas } from "../utils/imageFormats";

interface UseDialogHandlersProps {
	canvasRef: RefObject<HTMLCanvasElement>;
	saveState: () => void;
	setCanvasSize: (width: number, height: number) => void;
	canvasWidth: number;
	canvasHeight: number;
	secondaryColor: string;
	setPrimaryColor: (color: string) => void;
	setSelection: (selection: {
		x: number;
		y: number;
		width: number;
		height: number;
		imageData: ImageData | null;
	}) => void;
	clearSelection: () => void;
	setTool: (toolId: string) => void;
	goToNode: (nodeId: string) => any;
	setShowNewConfirm?: (show: boolean) => void;
	setCustomColors?: (colors: string[]) => void;
	setMagnification: (mag: number) => void;
}

/**
 * Custom hook providing dialog action handlers for App.tsx
 *
 * Centralizes all dialog-related handlers to reduce App.tsx bloat.
 * Each handler manages canvas transformations, state updates, and UI feedback.
 */
export function useDialogHandlers({
	canvasRef,
	saveState,
	setCanvasSize,
	canvasWidth,
	canvasHeight,
	secondaryColor,
	setPrimaryColor,
	setSelection,
	clearSelection,
	setTool,
	goToNode,
	setShowNewConfirm,
	setCustomColors,
	setMagnification,
}: UseDialogHandlersProps) {
	/**
	 * Handle File > New confirmation
	 * - "Yes": Save current canvas as file (download), then create new blank canvas
	 * - "No": Create new blank canvas without saving
	 * - "Cancel": Do nothing
	 */
	const handleNewConfirm = useCallback(
		(result: MessageBoxResult) => {
			console.log('[handleNewConfirm] Called with result:', result);

			if (setShowNewConfirm) {
				setShowNewConfirm(false);
			}

			// Only proceed if user clicked Yes or No (not Cancel)
			if (result === "yes" || result === "no") {
				console.log('[handleNewConfirm] Processing yes/no action');
				const canvas = canvasRef.current;
				if (!canvas) {
					console.error('[handleNewConfirm] Canvas ref is null!');
					return;
				}
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				if (!ctx) {
					console.error('[handleNewConfirm] Could not get 2d context!');
					return;
				}

				// Save file (download) before clearing (only if user clicked Yes)
				if (result === "yes") {
					console.log('[handleNewConfirm] Downloading file...');
					// Download the canvas as PNG file
					const link = document.createElement("a");
					link.download = "Untitled.png";
					link.href = canvas.toDataURL("image/png");
					link.click();
					console.log('[handleNewConfirm] File download triggered');
				}

				// Reset canvas to default size (Windows XP: 512x384)
				console.log(`[handleNewConfirm] Resizing canvas to ${DEFAULT_CANVAS_WIDTH}x${DEFAULT_CANVAS_HEIGHT}...`);
				setCanvasSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);

				// Reset magnification to 1x (100%)
				console.log('[handleNewConfirm] Resetting magnification to 1x...');
				setMagnification(1);

				// Clear to white on next frame (after resize completes)
				requestAnimationFrame(() => {
					const canvas = canvasRef.current;
					if (!canvas) return;
					const ctx = canvas.getContext("2d", { willReadFrequently: true });
					if (!ctx) return;

					console.log('[handleNewConfirm] Clearing canvas to white...');
					ctx.fillStyle = "#FFFFFF";
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					console.log('[handleNewConfirm] Canvas cleared');

					// Clear any active selection
					clearSelection();

					// Save the new white canvas state to history
					console.log('[handleNewConfirm] Saving to history...');
					saveState();
					console.log('[handleNewConfirm] Saved to history');
				});
			} else {
				console.log('[handleNewConfirm] Cancel clicked, doing nothing');
			}
			// If result === "cancel", do nothing
		},
		[canvasRef, saveState, setShowNewConfirm, setCanvasSize, clearSelection, setMagnification],
	);

	/**
	 * Handle Image > Flip/Rotate operations
	 */
	const handleFlipRotate = useCallback(
		(action: FlipRotateAction) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			saveState();

			let result: ImageData;
			if (action.type === "flipHorizontal") {
				result = transformCanvas(ctx, flipHorizontal);
			} else if (action.type === "flipVertical") {
				result = transformCanvas(ctx, flipVertical);
			} else {
				result = transformCanvas(ctx, (data) => rotate(data, action.degrees));
			}

			applyToCanvas(ctx, result, true);
			if (canvas.width !== result.width || canvas.height !== result.height) {
				setCanvasSize(result.width, result.height);
			}
		},
		[canvasRef, saveState, setCanvasSize],
	);

	/**
	 * Handle Image > Stretch/Skew operations
	 */
	const handleStretchSkew = useCallback(
		(values: StretchSkewValues) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return;

			saveState();

			let result = ctx.getImageData(0, 0, canvas.width, canvas.height);

			// Apply stretch if not 100%
			if (values.stretchHorizontal !== 100 || values.stretchVertical !== 100) {
				result = stretch(result, values.stretchHorizontal / 100, values.stretchVertical / 100);
			}

			// Apply skew if not 0
			if (values.skewHorizontal !== 0 || values.skewVertical !== 0) {
				result = skew(result, values.skewHorizontal, values.skewVertical);
			}

			applyToCanvas(ctx, result, true);
			setCanvasSize(result.width, result.height);
		},
		[canvasRef, saveState, setCanvasSize],
	);

	/**
	 * Handle Image > Attributes (canvas resize)
	 */
	const handleAttributes = useCallback(
		(values: AttributesValues) => {
			if (values.width !== canvasWidth || values.height !== canvasHeight) {
				saveState();
				setCanvasSize(values.width, values.height);
			}
		},
		[canvasWidth, canvasHeight, saveState, setCanvasSize],
	);

	/**
	 * Handle File > Load from URL
	 */
	const handleLoadFromUrl = useCallback(
		(url: string) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
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
			img.onerror = () => {
				alert("Failed to load image from URL. The image may not allow cross-origin access.");
			};
			img.src = url;
		},
		[canvasRef, saveState, setCanvasSize],
	);

	/**
	 * Handle File > Save As
	 */
	const handleSaveAs = useCallback(
		async (filename: string, formatId: string) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			try {
				await downloadCanvas(canvas, filename, formatId);
			} catch (error) {
				// console.error("Failed to save file:", error);
				alert(`Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		},
		[canvasRef],
	);

	/**
	 * Handle Image > Invert Colors
	 */
	const handleInvertColors = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		saveState();
		const result = transformCanvas(ctx, invertColors);
		applyToCanvas(ctx, result, false);
	}, [canvasRef, saveState]);

	/**
	 * Handle color selection from Edit Colors dialog
	 */
	const handleColorSelect = useCallback(
		(color: string, newCustomColors: string[]) => {
			setPrimaryColor(color);
			if (setCustomColors) {
				setCustomColors(newCustomColors);
			}
		},
		[setPrimaryColor, setCustomColors],
	);

	/**
	 * Handle Image > Clear Image
	 */
	const handleClearImage = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		saveState();
		ctx.fillStyle = secondaryColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, [canvasRef, saveState, secondaryColor]);

	/**
	 * Handle Edit > Select All
	 */
	const handleSelectAll = useCallback(() => {
		setSelection({
			x: 0,
			y: 0,
			width: canvasWidth,
			height: canvasHeight,
			imageData: null,
		});
		setTool(TOOL_IDS.SELECT);
	}, [canvasWidth, canvasHeight, setSelection, setTool]);

	/**
	 * Handle history tree navigation
	 */
	const handleHistoryNavigate = useCallback(
		(nodeId: string) => {
			const node = goToNode(nodeId);
			if (node && canvasRef.current) {
				// Restore canvas from history node
				const ctx = canvasRef.current.getContext("2d");
				if (ctx) {
					ctx.putImageData(node.imageData, 0, 0);
				}

				// Restore selection if present
				if (node.selectionImageData) {
					setSelection({
						x: node.selectionX ?? 0,
						y: node.selectionY ?? 0,
						width: node.selectionWidth ?? 0,
						height: node.selectionHeight ?? 0,
						imageData: node.selectionImageData,
					});
				} else {
					clearSelection();
				}
			}
		},
		[goToNode, canvasRef, setSelection, clearSelection],
	);

	return {
		handleNewConfirm,
		handleFlipRotate,
		handleStretchSkew,
		handleAttributes,
		handleLoadFromUrl,
		handleSaveAs,
		handleInvertColors,
		handleColorSelect,
		handleClearImage,
		handleSelectAll,
		handleHistoryNavigate,
	};
}
