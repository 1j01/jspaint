import { CSSProperties, forwardRef, useImperativeHandle, useRef } from "react";
import { useMagnification } from "../context/state";

interface HelperLayerProps {
	x: number;
	y: number;
	width: number;
	height: number;
	pixelRatio?: number;
}

export interface HelperLayerHandle {
	canvas: HTMLCanvasElement | null;
	getContext: () => CanvasRenderingContext2D | null;
	clear: () => void;
}

/**
 * Helper layer overlay for temporary drawing hints and previews.
 * This is used for things like shape previews, grid overlay, etc.
 *
 * Port of legacy OnCanvasHelperLayer.js
 */
export const HelperLayer = forwardRef<HelperLayerHandle, HelperLayerProps>(function HelperLayer(
	{ x, y, width, height, pixelRatio = 1 },
	ref,
) {
	const { magnification } = useMagnification();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Expose imperative methods to parent
	useImperativeHandle(ref, () => ({
		canvas: canvasRef.current,
		getContext: () => canvasRef.current?.getContext("2d") ?? null,
		clear: () => {
			const canvas = canvasRef.current;
			if (canvas) {
				const ctx = canvas.getContext("2d");
				if (ctx) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
				}
			}
		},
	}), []);

	const style: CSSProperties = {
		position: "absolute",
		left: x * magnification,
		top: y * magnification,
		width: width * magnification,
		height: height * magnification,
		pointerEvents: "none",
		imageRendering: "pixelated",
	};

	return (
		<canvas
			ref={canvasRef}
			className="helper-layer"
			width={width * pixelRatio}
			height={height * pixelRatio}
			style={style}
			aria-hidden="true"
		/>
	);
});

export default HelperLayer;
