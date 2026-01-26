import { CSSProperties, forwardRef } from "react";

/**
 * Props for CanvasOverlay component
 */
interface CanvasOverlayProps {
	/** Canvas width in logical pixels (matches main canvas) */
	width: number;
	/** Canvas height in logical pixels (matches main canvas) */
	height: number;
	/** Magnification/zoom level (1 = 100%, 2 = 200%, etc.) */
	magnification: number;
}

/**
 * CanvasOverlay component - Selection and effects overlay canvas
 * Renders selection "marching ants" animation and other temporary overlays.
 * Positioned via CSS to exactly overlay the main canvas.
 * Uses CSS transform to match main canvas magnification.
 *
 * The overlay canvas is used for:
 * - Selection rectangle marching ants border
 * - Free-form selection path preview
 * - Drag handles visualization
 * - Any other temporary visual effects
 *
 * @param {CanvasOverlayProps} props - Component props
 * @param {React.Ref<HTMLCanvasElement>} ref - Forwarded ref to canvas element
 * @returns {JSX.Element} Overlay canvas element
 *
 * @example
 * <CanvasOverlay
 *   ref={overlayCanvasRef}
 *   width={512}
 *   height={384}
 *   magnification={2}
 * />
 */
export const CanvasOverlay = forwardRef<HTMLCanvasElement, CanvasOverlayProps>(function CanvasOverlay(
	{ width, height, magnification },
	ref,
) {
	const shouldScale = Number.isFinite(magnification) && magnification !== 1;
	const canvasStyle: CSSProperties = {
		// Override CSS that sets width/height to 100% - we want pixel-perfect dimensions
		width: `${width}px`,
		height: `${height}px`,
		// CSS already sets position: absolute; left: 0; top: 0; from layout.css
		// Match main-canvas transform and transform-origin exactly
		transform: shouldScale ? `scale(${magnification})` : undefined,
		transformOrigin: shouldScale ? "top left" : undefined,
	};

	// Add positioning for z-index to work properly
	const wrapperStyle: CSSProperties = {
		position: "absolute",
		left: 0,
		top: 0,
		pointerEvents: "none",
	};

	return (
		<div className="helper-layer" style={wrapperStyle}>
			<canvas
				ref={ref}
				className="selection-overlay"
				width={width}
				height={height}
				style={{ ...canvasStyle, pointerEvents: "none" }}
				aria-hidden="true"
			/>
		</div>
	);
});

export default CanvasOverlay;
