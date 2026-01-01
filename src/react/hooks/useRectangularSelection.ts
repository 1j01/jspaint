import { useCallback, useRef, RefObject } from "react";
import type { Selection } from "../context/state/types";
import { drawRectangularPreview, clearOverlay } from "../utils/selectionDrawing";

interface UseRectangularSelectionProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	overlayRef: RefObject<HTMLCanvasElement | null>;
	selection: Selection | null;
	secondaryColor: string;
	setSelection: (selection: Selection) => void;
	clearSelection: () => void;
	saveState: (imageData: ImageData) => void;
}

interface RectangularSelectionState {
	isSelecting: boolean;
	isDragging: boolean;
	startX: number;
	startY: number;
	dragOffsetX: number;
	dragOffsetY: number;
}

/**
 * Custom hook for rectangular selection logic
 *
 * Handles all aspects of rectangular selection behavior:
 * - Starting a new rectangular selection by dragging
 * - Dragging an existing selection to move it
 * - Drawing a preview rectangle during selection creation
 * - Finalizing selection with image data extraction and background fill
 * - Automatic selection commit when clicking outside
 *
 * Selection workflow:
 * 1. Click outside selection or no selection -> Start new selection
 * 2. Click inside selection -> Start dragging
 * 3. Mouse move -> Update preview or drag position
 * 4. Mouse up -> Finalize selection with extracted ImageData
 *
 * @param {UseRectangularSelectionProps} props - Hook configuration
 * @param {RefObject<HTMLCanvasElement | null>} props.canvasRef - Reference to main canvas
 * @param {RefObject<HTMLCanvasElement | null>} props.overlayRef - Reference to selection overlay
 * @param {Selection | null} props.selection - Current selection state
 * @param {string} props.secondaryColor - Background color for cleared selection area
 * @param {Function} props.setSelection - Function to update selection state
 * @param {Function} props.clearSelection - Function to clear selection
 * @param {Function} props.saveState - Function to save undo state
 * @returns {Object} Selection control functions
 *
 * @example
 * const rectSelection = useRectangularSelection({
 *   canvasRef, overlayRef, selection,
 *   secondaryColor, setSelection, clearSelection, saveState
 * });
 * // Start selection
 * rectSelection.start(x, y, ctx);
 * // Update during drag
 * rectSelection.move(x, y);
 * // Finalize on release
 * rectSelection.finalize(x, y, ctx);
 */
export function useRectangularSelection({
	canvasRef,
	overlayRef,
	selection,
	secondaryColor,
	setSelection,
	clearSelection,
	saveState,
}: UseRectangularSelectionProps) {
	const state = useRef<RectangularSelectionState>({
		isSelecting: false,
		isDragging: false,
		startX: 0,
		startY: 0,
		dragOffsetX: 0,
		dragOffsetY: 0,
	});

	/**
	 * Start a new rectangular selection or begin dragging existing selection
	 * @param {number} x - Mouse X coordinate
	 * @param {number} y - Mouse Y coordinate
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 * @returns {boolean} True if dragging existing selection, false if starting new
	 */
	const start = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): boolean => {
			console.log("[RectangularSelection] start() called at", x, y);

			// Check if clicking inside existing selection to drag it
			if (selection) {
				const inSelection =
					x >= selection.x &&
					x < selection.x + selection.width &&
					y >= selection.y &&
					y < selection.y + selection.height;

				if (inSelection) {
					console.log("[RectangularSelection] Starting drag of existing selection");
					// Start dragging the selection
					state.current = {
						...state.current,
						isDragging: true,
						dragOffsetX: x - selection.x,
						dragOffsetY: y - selection.y,
					};
					return true;
				} else {
					console.log("[RectangularSelection] Click outside selection, committing it");
					// Click outside - commit the selection to canvas first
					if (selection.imageData) {
						ctx.putImageData(selection.imageData, selection.x, selection.y);
					}
					clearSelection();
				}
			}

			// Start a new selection
			console.log("[RectangularSelection] Starting new selection");
			const canvas = canvasRef.current;
			if (canvas) {
				const canvasCtx = canvas.getContext("2d");
				if (canvasCtx) saveState(canvasCtx.getImageData(0, 0, canvas.width, canvas.height));
			}

			state.current = {
				isSelecting: true,
				startX: x,
				startY: y,
				isDragging: false,
				dragOffsetX: 0,
				dragOffsetY: 0,
			};
			console.log("[RectangularSelection] State set to:", state.current);
			return false;
		},
		[selection, clearSelection, saveState, canvasRef],
	);

	/**
	 * Handle selection move during drag or selection drawing
	 * @param {number} x - Current mouse X coordinate
	 * @param {number} y - Current mouse Y coordinate
	 */
	const move = useCallback(
		(x: number, y: number): void => {
			console.log("[RectangularSelection] move() called, isDragging:", state.current.isDragging, "isSelecting:", state.current.isSelecting);

			// Handle selection dragging
			if (state.current.isDragging && selection) {
				const newX = x - state.current.dragOffsetX;
				const newY = y - state.current.dragOffsetY;
				setSelection({
					...selection,
					x: newX,
					y: newY,
				});
				return;
			}

			// Handle selection drawing
			if (!state.current.isSelecting) return;

			const overlay = overlayRef.current;
			if (!overlay) {
				console.log("[RectangularSelection] No overlay canvas!");
				return;
			}
			const overlayCtx = overlay.getContext("2d");
			if (!overlayCtx) {
				console.log("[RectangularSelection] Could not get overlay context!");
				return;
			}

			console.log("[RectangularSelection] Drawing preview from", state.current.startX, state.current.startY, "to", x, y);
			overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
			drawRectangularPreview(overlayCtx, state.current.startX, state.current.startY, x, y);
		},
		[selection, setSelection, overlayRef],
	);

	/**
	 * Finalize rectangular selection
	 * Extracts ImageData from selection region and fills with background color
	 * @param {number} x - Final mouse X coordinate
	 * @param {number} y - Final mouse Y coordinate
	 * @param {CanvasRenderingContext2D} ctx - Canvas context
	 */
	const finalize = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): void => {
			console.log("[RectangularSelection] finalize() called at", x, y, "isDragging:", state.current.isDragging, "isSelecting:", state.current.isSelecting);

			if (state.current.isDragging) {
				console.log("[RectangularSelection] Was dragging, stopping drag");
				state.current.isDragging = false;
				return;
			}

			if (!state.current.isSelecting) {
				console.log("[RectangularSelection] Was not selecting, nothing to finalize");
				return;
			}

			const { startX, startY } = state.current;
			const selX = Math.min(startX, x);
			const selY = Math.min(startY, y);
			const selWidth = Math.abs(x - startX);
			const selHeight = Math.abs(y - startY);

			console.log("[RectangularSelection] Final selection rect:", { selX, selY, selWidth, selHeight });

			// Clear overlay FIRST (before setting selection, so animation can redraw properly)
			const overlay = overlayRef.current;
			if (overlay) {
				const overlayCtx = overlay.getContext("2d");
				if (overlayCtx) clearOverlay(overlayCtx, overlay.width, overlay.height);
			}

			state.current.isSelecting = false;

			if (selWidth > 0 && selHeight > 0) {
				// Get the image data for the selection
				const imageData = ctx.getImageData(selX, selY, selWidth, selHeight);
				console.log("[RectangularSelection] Extracted imageData:", imageData.width, "x", imageData.height);

				// Fill the selected area with background color
				ctx.fillStyle = secondaryColor;
				ctx.fillRect(selX, selY, selWidth, selHeight);
				console.log("[RectangularSelection] Filled selection area with", secondaryColor);

				setSelection({
					x: selX,
					y: selY,
					width: selWidth,
					height: selHeight,
					imageData,
				});
				console.log("[RectangularSelection] Selection state set");
			} else {
				console.log("[RectangularSelection] Selection too small, ignoring");
			}

			console.log("[RectangularSelection] Finalize complete");
		},
		[secondaryColor, setSelection, overlayRef],
	);

	/**
	 * Check if currently selecting or dragging
	 * @returns {boolean} True if any selection operation is active
	 */
	const isActive = useCallback((): boolean => {
		return state.current.isSelecting || state.current.isDragging;
	}, []);

	return {
		start,
		move,
		finalize,
		isActive,
	};
}
