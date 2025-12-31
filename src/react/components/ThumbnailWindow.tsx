/**
 * ThumbnailWindow Component
 *
 * Displays a resizable thumbnail view of the entire canvas.
 * The thumbnail updates in real-time as you draw and shows the current viewport location.
 *
 * Features:
 * - Real-time canvas preview
 * - Device pixel ratio aware (using ResizeObserver)
 * - Shows viewport indicator rectangle
 * - Resizable window (handled by os-gui Window component)
 */

import { useEffect, useRef } from "react";
import { useApp, useCanvas } from "../context/AppContext";

/**
 * ThumbnailWindow component props
 */
interface ThumbnailWindowProps {
	/** Whether the thumbnail window is visible */
	visible: boolean;
	/** Callback to close the window */
	onClose: () => void;
}

/**
 * ThumbnailWindow component
 *
 * Renders a small preview of the entire canvas that updates continuously.
 * The preview maintains aspect ratio and device pixel ratio for crisp rendering.
 *
 * @param {ThumbnailWindowProps} props - Component props
 * @returns {JSX.Element | null} Window element or null if not visible
 */
export function ThumbnailWindow({ visible, onClose }: ThumbnailWindowProps) {
	const { canvasRef } = useApp();
	const { canvasWidth, canvasHeight } = useCanvas();
	const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Initial thumbnail dimensions (matching legacy 108x92)
	const INITIAL_WIDTH = 108;
	const INITIAL_HEIGHT = 92;

	/**
	 * Update thumbnail canvas content
	 * Draws the main canvas onto the thumbnail at a smaller scale
	 */
	const updateThumbnail = useRef(() => {
		const mainCanvas = canvasRef.current;
		const thumbnailCanvas = thumbnailCanvasRef.current;

		if (!mainCanvas || !thumbnailCanvas) return;

		const ctx = thumbnailCanvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Clear and draw the main canvas scaled to thumbnail size
		ctx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

		// Disable image smoothing for pixel-perfect rendering
		ctx.imageSmoothingEnabled = false;

		// Calculate scale to fit main canvas into thumbnail
		const scaleX = thumbnailCanvas.width / mainCanvas.width;
		const scaleY = thumbnailCanvas.height / mainCanvas.height;
		const scale = Math.min(scaleX, scaleY);

		// Center the thumbnail if aspect ratios don't match
		const scaledWidth = mainCanvas.width * scale;
		const scaledHeight = mainCanvas.height * scale;
		const offsetX = (thumbnailCanvas.width - scaledWidth) / 2;
		const offsetY = (thumbnailCanvas.height - scaledHeight) / 2;

		// Draw main canvas to thumbnail
		ctx.drawImage(
			mainCanvas,
			0, 0, mainCanvas.width, mainCanvas.height,
			offsetX, offsetY, scaledWidth, scaledHeight
		);

		// TODO: Draw viewport indicator rectangle showing which part of canvas is visible
		// This would require scroll position and magnification info
	});

	// Set up ResizeObserver to handle thumbnail canvas resizing
	useEffect(() => {
		const thumbnailCanvas = thumbnailCanvasRef.current;
		const container = containerRef.current;

		if (!thumbnailCanvas || !container) return;

		// Handle device pixel ratio for crisp rendering
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			let width: number;
			let height: number;

			// Use devicePixelContentBoxSize if available (Chrome)
			if ("devicePixelContentBoxSize" in entry) {
				const dpContentBox = entry.devicePixelContentBoxSize as any;
				if (dpContentBox && dpContentBox[0]) {
					width = dpContentBox[0].inlineSize;
					height = dpContentBox[0].blockSize;
				} else {
					// Fallback
					width = Math.round(entry.contentRect.width * window.devicePixelRatio);
					height = Math.round(entry.contentRect.height * window.devicePixelRatio);
				}
			} else if ("contentBoxSize" in entry) {
				// Firefox fallback
				const contentBox = entry.contentBoxSize as any;
				width = Math.round(contentBox[0].inlineSize * window.devicePixelRatio);
				height = Math.round(contentBox[0].blockSize * window.devicePixelRatio);
			} else {
				// Safari/iOS fallback
				width = Math.round(entry.contentRect.width * window.devicePixelRatio);
				height = Math.round(entry.contentRect.height * window.devicePixelRatio);
			}

			// Avoid zero dimensions (can happen when hidden)
			if (width && height) {
				thumbnailCanvas.width = width;
				thumbnailCanvas.height = height;
				updateThumbnail.current();
			}
		});

		resizeObserver.observe(thumbnailCanvas, { box: "device-pixel-content-box" } as any);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	// Update thumbnail when canvas changes
	useEffect(() => {
		if (!visible) return;

		// Set up interval to update thumbnail periodically
		const intervalId = setInterval(() => {
			updateThumbnail.current();
		}, 100); // Update every 100ms (10fps)

		// Initial update
		updateThumbnail.current();

		return () => {
			clearInterval(intervalId);
		};
	}, [visible, canvasWidth, canvasHeight]);

	if (!visible) return null;

	return (
		<div
			className="window thumbnail-window tool-window"
			style={{
				position: "absolute",
				top: "60px",
				right: "10px",
				width: `${INITIAL_WIDTH + 8}px`, // Add border/padding
				height: `${INITIAL_HEIGHT + 30}px`, // Add titlebar
				zIndex: 1000,
			}}
		>
			<div className="title-bar">
				<div className="title-bar-text">Thumbnail</div>
				<div className="title-bar-controls">
					<button aria-label="Close" onClick={onClose}></button>
				</div>
			</div>
			<div
				ref={containerRef}
				className="window-body inset-deep"
				style={{
					margin: "1px 2px 2px 2px",
					padding: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: `${INITIAL_WIDTH}px`,
					height: `${INITIAL_HEIGHT}px`,
					overflow: "hidden",
				}}
			>
				<canvas
					ref={thumbnailCanvasRef}
					style={{
						width: "100%",
						height: "100%",
						imageRendering: "pixelated",
					}}
				/>
			</div>
		</div>
	);
}

export default ThumbnailWindow;
