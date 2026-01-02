import React, { RefObject } from "react";

interface ColorPickerCanvasProps {
	rainbowCanvasRef: RefObject<HTMLCanvasElement>;
	luminosityCanvasRef: RefObject<HTMLCanvasElement>;
	lumArrowCanvasRef: RefObject<HTMLCanvasElement>;
	luminosity: number;
	onRainbowPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
	onRainbowPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
	onRainbowPointerUp: () => void;
	onLuminosityPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
	onLuminosityPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}

/**
 * Color picker canvas component - matches jQuery implementation with absolute positioning
 *
 * Renders the rainbow (hue/saturation) canvas and luminosity slider
 * with interactive crosshair and arrow indicators.
 *
 * All elements use absolute positioning to match the original edit-colors.js layout.
 */
export function ColorPickerCanvas({
	rainbowCanvasRef,
	luminosityCanvasRef,
	lumArrowCanvasRef,
	luminosity,
	onRainbowPointerDown,
	onRainbowPointerMove,
	onRainbowPointerUp,
	onLuminosityPointerDown,
	onLuminosityPointerMove,
}: ColorPickerCanvasProps) {
	return (
		<>
			{/* Rainbow canvas - no positioning, flows naturally */}
			<canvas
				ref={rainbowCanvasRef}
				className="rainbow-canvas inset-shallow"
				width={175}
				height={187}
				onPointerDown={onRainbowPointerDown}
				onPointerMove={onRainbowPointerMove}
				onPointerUp={onRainbowPointerUp}
				onPointerLeave={onRainbowPointerUp}
				style={{
					cursor: "crosshair",
				}}
			/>

			{/* Luminosity canvas - uses CSS margin-left: 15px to position next to rainbow */}
			<canvas
				ref={luminosityCanvasRef}
				className="luminosity-canvas inset-shallow"
				width={10}
				height={187}
				onPointerDown={onLuminosityPointerDown}
				onPointerMove={onLuminosityPointerMove}
				style={{
					cursor: "ns-resize",
				}}
			/>

			{/* Lum arrow - absolute positioned at left: 215px, dynamic top */}
			<canvas
				ref={lumArrowCanvasRef}
				width={5}
				height={9}
				style={{
					position: "absolute",
					left: "215px",
					top: `${3 + Math.floor((1 - luminosity / 100) * 187)}px`,
					pointerEvents: "none",
				}}
			/>
		</>
	);
}
