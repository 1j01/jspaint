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
		// Position and transform-origin handled by CSS (.selection-overlay) to ensure exact alignment with main-canvas
		// Only set transform here to match main-canvas scaling
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
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
