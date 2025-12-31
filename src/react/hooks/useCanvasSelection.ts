import { useCallback, useRef, useEffect, RefObject } from "react";
import { Selection, useColors, useHistory, useSelection } from "../context/state";

export interface SelectionState {
	isSelecting: boolean;
	startX: number;
	startY: number;
	freeFormPoints: Array<{ x: number; y: number }>;
	isDragging: boolean;
	dragOffsetX: number;
	dragOffsetY: number;
}

interface UseCanvasSelectionProps {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	overlayRef: RefObject<HTMLCanvasElement | null>;
	getCanvasCoords: (e: { clientX: number; clientY: number }) => { x: number; y: number };
}

/**
 * Hook for handling canvas selection tools (rectangular and free-form)
 */
export function useCanvasSelection({ canvasRef, overlayRef, getCanvasCoords }: UseCanvasSelectionProps) {
	const { secondaryColor } = useColors();
	const { saveState } = useHistory();
	const { selection, setSelection, clearSelection } = useSelection();

	// Selection state tracking
	const selectionState = useRef<SelectionState>({
		isSelecting: false,
		startX: 0,
		startY: 0,
		freeFormPoints: [],
		isDragging: false,
		dragOffsetX: 0,
		dragOffsetY: 0,
	});

	// Marching ants animation
	const marchingAntsOffset = useRef(0);
	const animationFrameId = useRef<number | null>(null);

	// Draw selection overlay with marching ants
	const drawSelectionOverlay = useCallback(() => {
		const overlay = overlayRef.current;
		if (!overlay || !selection) return;

		const ctx = overlay.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, overlay.width, overlay.height);

		const { x, y, width, height, path } = selection;

		ctx.save();
		ctx.setLineDash([4, 4]);
		ctx.lineDashOffset = -marchingAntsOffset.current;

		if (path && path.length > 2) {
			// Free-form selection
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(x + path[0].x, y + path[0].y);
			for (let i = 1; i < path.length; i++) {
				ctx.lineTo(x + path[i].x, y + path[i].y);
			}
			ctx.closePath();
			ctx.stroke();

			ctx.strokeStyle = "#ffffff";
			ctx.lineDashOffset = -marchingAntsOffset.current + 4;
			ctx.stroke();
		} else {
			// Rectangular selection
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 1;
			ctx.strokeRect(x + 0.5, y + 0.5, width, height);

			ctx.strokeStyle = "#ffffff";
			ctx.lineDashOffset = -marchingAntsOffset.current + 4;
			ctx.strokeRect(x + 0.5, y + 0.5, width, height);
		}

		ctx.restore();

		// Draw the selection content if we have it
		if (selection.imageData) {
			// Create a temporary canvas to draw the selection
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = selection.imageData.width;
			tempCanvas.height = selection.imageData.height;
			const tempCtx = tempCanvas.getContext("2d");
			if (tempCtx) {
				tempCtx.putImageData(selection.imageData, 0, 0);
				ctx.drawImage(tempCanvas, x, y);
			}
		}
	}, [selection, overlayRef]);

	// Animate marching ants for selection
	useEffect(() => {
		if (!selection) {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
				animationFrameId.current = null;
			}
			// Clear overlay
			const overlay = overlayRef.current;
			if (overlay) {
				const ctx = overlay.getContext("2d");
				if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
			}
			return;
		}

		const animate = () => {
			marchingAntsOffset.current = (marchingAntsOffset.current + 1) % 16;
			drawSelectionOverlay();
			animationFrameId.current = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, [selection, drawSelectionOverlay, overlayRef]);

	// Start a new rectangular selection
	const startRectangularSelection = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): boolean => {
			// Check if clicking inside existing selection to drag it
			if (selection) {
				const inSelection =
					x >= selection.x &&
					x < selection.x + selection.width &&
					y >= selection.y &&
					y < selection.y + selection.height;

				if (inSelection) {
					// Start dragging the selection
					selectionState.current = {
						...selectionState.current,
						isDragging: true,
						dragOffsetX: x - selection.x,
						dragOffsetY: y - selection.y,
					};
					return true;
				} else {
					// Click outside - commit the selection to canvas first
					if (selection.imageData) {
						ctx.putImageData(selection.imageData, selection.x, selection.y);
					}
					clearSelection();
				}
			}

			// Start a new selection
			saveState();
			selectionState.current = {
				isSelecting: true,
				startX: x,
				startY: y,
				freeFormPoints: [],
				isDragging: false,
				dragOffsetX: 0,
				dragOffsetY: 0,
			};
			return false;
		},
		[selection, clearSelection, saveState],
	);

	// Start a new free-form selection
	const startFreeFormSelection = useCallback(
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
					selectionState.current = {
						...selectionState.current,
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
			saveState();
			selectionState.current = {
				isSelecting: true,
				startX: x,
				startY: y,
				freeFormPoints: [{ x, y }],
				isDragging: false,
				dragOffsetX: 0,
				dragOffsetY: 0,
			};
			return false;
		},
		[selection, clearSelection, saveState],
	);

	// Handle selection move (during drag or selection drawing)
	const handleSelectionMove = useCallback(
		(x: number, y: number, isRectangular: boolean): void => {
			// Handle selection dragging
			if (selectionState.current.isDragging && selection) {
				const newX = x - selectionState.current.dragOffsetX;
				const newY = y - selectionState.current.dragOffsetY;
				setSelection({
					...selection,
					x: newX,
					y: newY,
				});
				return;
			}

			// Handle selection drawing
			if (!selectionState.current.isSelecting) return;

			const overlay = overlayRef.current;
			if (!overlay) return;
			const overlayCtx = overlay.getContext("2d");
			if (!overlayCtx) return;

			overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

			if (isRectangular) {
				// Draw rectangular selection preview
				const { startX, startY } = selectionState.current;
				const width = x - startX;
				const height = y - startY;

				overlayCtx.setLineDash([4, 4]);
				overlayCtx.strokeStyle = "#000000";
				overlayCtx.strokeRect(
					Math.min(startX, x) + 0.5,
					Math.min(startY, y) + 0.5,
					Math.abs(width),
					Math.abs(height),
				);
				overlayCtx.strokeStyle = "#ffffff";
				overlayCtx.lineDashOffset = 4;
				overlayCtx.strokeRect(
					Math.min(startX, x) + 0.5,
					Math.min(startY, y) + 0.5,
					Math.abs(width),
					Math.abs(height),
				);
			} else {
				// Draw free-form selection preview
				selectionState.current.freeFormPoints.push({ x, y });
				const points = selectionState.current.freeFormPoints;

				if (points.length > 1) {
					overlayCtx.setLineDash([4, 4]);
					overlayCtx.strokeStyle = "#000000";
					overlayCtx.beginPath();
					overlayCtx.moveTo(points[0].x, points[0].y);
					for (let i = 1; i < points.length; i++) {
						overlayCtx.lineTo(points[i].x, points[i].y);
					}
					overlayCtx.stroke();
				}
			}
		},
		[selection, setSelection, overlayRef],
	);

	// Finalize rectangular selection
	const finalizeRectangularSelection = useCallback(
		(x: number, y: number, ctx: CanvasRenderingContext2D): void => {
			if (selectionState.current.isDragging) {
				selectionState.current.isDragging = false;
				return;
			}

			if (!selectionState.current.isSelecting) return;

			const { startX, startY } = selectionState.current;
			const selX = Math.min(startX, x);
			const selY = Math.min(startY, y);
			const selWidth = Math.abs(x - startX);
			const selHeight = Math.abs(y - startY);

			if (selWidth > 0 && selHeight > 0) {
				// Get the image data for the selection
				const imageData = ctx.getImageData(selX, selY, selWidth, selHeight);

				// Fill the selected area with background color
				ctx.fillStyle = secondaryColor;
				ctx.fillRect(selX, selY, selWidth, selHeight);

				setSelection({
					x: selX,
					y: selY,
					width: selWidth,
					height: selHeight,
					imageData,
				});
			}

			selectionState.current.isSelecting = false;
			clearOverlay();
		},
		[secondaryColor, setSelection],
	);

	// Finalize free-form selection
	const finalizeFreeFormSelection = useCallback(
		(ctx: CanvasRenderingContext2D): void => {
			if (selectionState.current.isDragging) {
				selectionState.current.isDragging = false;
				return;
			}

			if (!selectionState.current.isSelecting) return;

			const points = selectionState.current.freeFormPoints;

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

					setSelection({
						x: minX,
						y: minY,
						width: selWidth,
						height: selHeight,
						imageData: fullImageData,
						path: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
					});
				}
			}

			selectionState.current.isSelecting = false;
			selectionState.current.freeFormPoints = [];
			clearOverlay();
		},
		[secondaryColor, setSelection],
	);

	// Clear overlay canvas
	const clearOverlay = useCallback(() => {
		const overlay = overlayRef.current;
		if (overlay) {
			const overlayCtx = overlay.getContext("2d");
			if (overlayCtx) overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
		}
	}, [overlayRef]);

	// Check if currently selecting or dragging
	const isActive = useCallback((): boolean => {
		return selectionState.current.isSelecting || selectionState.current.isDragging;
	}, []);

	return {
		selectionState,
		startRectangularSelection,
		startFreeFormSelection,
		handleSelectionMove,
		finalizeRectangularSelection,
		finalizeFreeFormSelection,
		isActive,
		selection,
		clearSelection,
	};
}
