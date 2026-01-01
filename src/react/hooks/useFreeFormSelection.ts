import { useCallback, useRef, RefObject } from "react";
import type { Selection } from "../context/state/types";
import { drawFreeFormPreview, clearOverlay } from "../utils/selectionDrawing";

interface UseFreeFormSelectionProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	overlayRef: RefObject<HTMLCanvasElement | null>;
	selection: Selection | null;
	secondaryColor: string;
	setSelection: (selection: Selection) => void;
	clearSelection: () => void;
	saveState: (imageData: ImageData) => void;
}

interface FreeFormSelectionState {
	isSelecting: boolean;
	isDragging: boolean;
	startX: number;
	startY: number;
	points: Array<{ x: number; y: number }>;
	dragOffsetX: number;
	dragOffsetY: number;
}

/**
 * Custom hook for free-form selection logic
 *
 * Handles all aspects of free-form/lasso selection behavior:
 * - Recording path points during mouse drag
 * - Dragging an existing selection to move it
 * - Drawing a preview outline during selection creation
 * - Finalizing selection with mask-based image data extraction
 * - Automatic selection commit when clicking outside
 *
 * Free-form selection workflow:
 * 1. Mouse down -> Start recording path
 * 2. Mouse move -> Add points to path and update preview
 * 3. Mouse up -> Close path, create mask, extract ImageData
 * 4. Transparent pixels outside the path are preserved in ImageData
 *
 * @param {UseFreeFormSelectionProps} props - Hook configuration
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
 * const freeFormSelection = useFreeFormSelection({
 *   canvasRef, overlayRef, selection,
 *   secondaryColor, setSelection, clearSelection, saveState
 * });
 * // Start selection
 * freeFormSelection.start(x, y, ctx);
 * // Update during drag (adds points)
 * freeFormSelection.move(x, y);
 * // Finalize on release
 * freeFormSelection.finalize(ctx);
 */
export function useFreeFormSelection({
	canvasRef,
	overlayRef,
	selection,
	secondaryColor,
	setSelection,
	clearSelection,
	saveState,
}: UseFreeFormSelectionProps) {
	const state = useRef<FreeFormSelectionState>({
		isSelecting: false,
		isDragging: false,
		startX: 0,
		startY: 0,
		points: [],
		dragOffsetX: 0,
		dragOffsetY: 0,
	});

	// Start a new free-form selection
	const start = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): boolean => {
			// Check if clicking inside existing selection to drag it
			if (selection && selection.path) {
				// Simple bounding box check
				const inSelection =
					x >= selection.x &&
					x < selection.x + selection.width &&
					y >= selection.y &&
					y < selection.y + selection.height;

				if (inSelection) {
					state.current = {
						...state.current,
						isDragging: true,
						dragOffsetX: x - selection.x,
						dragOffsetY: y - selection.y,
					};
					return true;
				} else {
					// Commit selection
					if (selection.imageData) {
						ctx.putImageData(selection.imageData, selection.x, selection.y);
					}
					clearSelection();
				}
			}

			// Start a new free-form selection
			const canvas = canvasRef.current;
			if (canvas) {
				const canvasCtx = canvas.getContext("2d");
				if (canvasCtx) saveState(canvasCtx.getImageData(0, 0, canvas.width, canvas.height));
			}

			state.current = {
				isSelecting: true,
				startX: x,
				startY: y,
				points: [{ x, y }],
				isDragging: false,
				dragOffsetX: 0,
				dragOffsetY: 0,
			};
			return false;
		},
		[selection, clearSelection, saveState, canvasRef],
	);

	// Handle selection move (during drag or selection drawing)
	const move = useCallback(
		(x: number, y: number): void => {
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
			if (!overlay) return;
			const overlayCtx = overlay.getContext("2d");
			if (!overlayCtx) return;

			state.current.points.push({ x, y });

			overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
			drawFreeFormPreview(overlayCtx, state.current.points);
		},
		[selection, setSelection, overlayRef],
	);

	// Finalize free-form selection
	const finalize = useCallback(
		(ctx: CanvasRenderingContext2D): void => {
			if (state.current.isDragging) {
				state.current.isDragging = false;
				return;
			}

			if (!state.current.isSelecting) return;

			const points = state.current.points;

			if (points.length > 2) {
				// Calculate bounding box
				let minX = Infinity,
					minY = Infinity,
					maxX = -Infinity,
					maxY = -Infinity;
				for (const p of points) {
					minX = Math.min(minX, p.x);
					minY = Math.min(minY, p.y);
					maxX = Math.max(maxX, p.x);
					maxY = Math.max(maxY, p.y);
				}

				const selWidth = maxX - minX;
				const selHeight = maxY - minY;

				if (selWidth > 0 && selHeight > 0) {
					// Get the full area image data
					const fullImageData = ctx.getImageData(minX, minY, selWidth, selHeight);

					// Create a mask for the free-form selection
					const maskCanvas = document.createElement("canvas");
					maskCanvas.width = selWidth;
					maskCanvas.height = selHeight;
					const maskCtx = maskCanvas.getContext("2d");
					if (maskCtx) {
						maskCtx.fillStyle = "#000000";
						maskCtx.beginPath();
						maskCtx.moveTo(points[0].x - minX, points[0].y - minY);
						for (let i = 1; i < points.length; i++) {
							maskCtx.lineTo(points[i].x - minX, points[i].y - minY);
						}
						maskCtx.closePath();
						maskCtx.fill();

						const maskData = maskCtx.getImageData(0, 0, selWidth, selHeight);

						// Apply mask to image data (transparent outside selection)
						for (let i = 0; i < fullImageData.data.length; i += 4) {
							if (maskData.data[i + 3] === 0) {
								fullImageData.data[i + 3] = 0; // Make transparent
							}
						}
					}

					// Fill the selected area with background color
					ctx.save();
					ctx.beginPath();
					ctx.moveTo(points[0].x, points[0].y);
					for (let i = 1; i < points.length; i++) {
						ctx.lineTo(points[i].x, points[i].y);
					}
					ctx.closePath();
					ctx.fillStyle = secondaryColor;
					ctx.fill();
					ctx.restore();

					// Clear overlay FIRST (before setting selection)
					const overlay = overlayRef.current;
					if (overlay) {
						const overlayCtx = overlay.getContext("2d");
						if (overlayCtx) clearOverlay(overlayCtx, overlay.width, overlay.height);
					}

					state.current.isSelecting = false;
					state.current.points = [];

					setSelection({
						x: minX,
						y: minY,
						width: selWidth,
						height: selHeight,
						imageData: fullImageData,
						path: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
					});
				}
			} else {
				// Clear overlay if selection was too small
				const overlay = overlayRef.current;
				if (overlay) {
					const overlayCtx = overlay.getContext("2d");
					if (overlayCtx) clearOverlay(overlayCtx, overlay.width, overlay.height);
				}
				state.current.isSelecting = false;
				state.current.points = [];
			}
		},
		[secondaryColor, setSelection, overlayRef],
	);

	// Check if currently selecting or dragging
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
