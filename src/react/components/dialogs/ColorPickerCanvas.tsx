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
 * Color picker canvas component
 *
 * Renders the rainbow (hue/saturation) canvas and luminosity slider
 * with interactive crosshair and arrow indicators.
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
		<div style={{ display: "flex", gap: "8px" }}>
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
					border: "2px solid",
					borderColor: "var(--button-shadow) var(--button-highlight) var(--button-highlight) var(--button-shadow)",
				}}
			/>
			<div style={{ position: "relative" }}>
				<canvas
					ref={luminosityCanvasRef}
					className="luminosity-canvas inset-shallow"
					width={10}
					height={187}
					onPointerDown={onLuminosityPointerDown}
					onPointerMove={onLuminosityPointerMove}
					style={{
						cursor: "ns-resize",
						border: "2px solid",
						borderColor: "var(--button-shadow) var(--button-highlight) var(--button-highlight) var(--button-shadow)",
					}}
				/>
				<canvas
					ref={lumArrowCanvasRef}
					width={5}
					height={9}
					style={{
						position: "absolute",
						left: "15px",
						top: `${3 + Math.floor((1 - luminosity / 100) * 187)}px`,
						pointerEvents: "none",
					}}
				/>
			</div>
		</div>
	);
}
