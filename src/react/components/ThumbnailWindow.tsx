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
import { useTranslation } from "react-i18next";
import { useCanvasDimensions } from "../context/state/useCanvasDimensions";

/**
 * ThumbnailWindow component props
 */
interface ThumbnailWindowProps {
	/** Whether the thumbnail window is visible */
	visible: boolean;
	/** Callback to close the window */
	onClose: () => void;
	/** Reference to the main canvas element */
	canvasRef: React.RefObject<HTMLCanvasElement>;
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
export function ThumbnailWindow({ visible, onClose, canvasRef }: ThumbnailWindowProps) {
	const { t } = useTranslation();
	const { canvasWidth, canvasHeight } = useCanvasDimensions();
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
		const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
			const entry = entries[0];
			if (!entry) return;
			let width: number;
			let height: number;

			// Prefer device-pixel box size when the browser provides it.
			// Note: DOM typings declare these properties, but at runtime browsers may
			// provide empty arrays depending on support.
			const dp = entry.devicePixelContentBoxSize?.[0];
			if (dp) {
				width = dp.inlineSize;
				height = dp.blockSize;
			} else {
				const cb = entry.contentBoxSize?.[0];
				if (cb) {
					width = Math.round(cb.inlineSize * window.devicePixelRatio);
					height = Math.round(cb.blockSize * window.devicePixelRatio);
				} else {
					width = Math.round(entry.contentRect.width * window.devicePixelRatio);
					height = Math.round(entry.contentRect.height * window.devicePixelRatio);
				}
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
				<div className="title-bar-text">{t("Thumbnail")}</div>
				<div className="title-bar-controls">
					<button aria-label={t("Close")} onClick={onClose}></button>
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
