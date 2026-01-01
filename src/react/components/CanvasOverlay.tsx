import { forwardRef, CSSProperties } from "react";

interface CanvasOverlayProps {
	width: number;
	height: number;
	magnification: number;
}

/**
 * Overlay canvas for selection marching ants and other overlays
 * Positioned via CSS to match main-canvas exactly
 */
export const CanvasOverlay = forwardRef<HTMLCanvasElement, CanvasOverlayProps>(function CanvasOverlay(
	{ width, height, magnification },
	ref,
) {
	const style: CSSProperties = {
		// Match main-canvas transform and transform-origin exactly
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
		transformOrigin: magnification > 1 ? "top left" : undefined,
	};

	return (
		<canvas
			ref={ref}
			className="selection-overlay"
			width={width}
			height={height}
			style={style}
			aria-hidden="true"
		/>
	);
});

export default CanvasOverlay;
