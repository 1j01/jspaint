import { forwardRef, CSSProperties } from "react";

interface CanvasOverlayProps {
	width: number;
	height: number;
	magnification: number;
}

/**
 * Overlay canvas for selection marching ants and other overlays
 */
export const CanvasOverlay = forwardRef<HTMLCanvasElement, CanvasOverlayProps>(function CanvasOverlay(
	{ width, height, magnification },
	ref,
) {
	const style: CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		pointerEvents: "none",
		transform: magnification > 1 ? `scale(${magnification})` : undefined,
		transformOrigin: "top left",
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
