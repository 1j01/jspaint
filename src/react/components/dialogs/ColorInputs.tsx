import React, { RefObject } from "react";

interface ColorInputsProps {
	resultCanvasRef: RefObject<HTMLCanvasElement>;
	hue: number;
	saturation: number;
	luminosity: number;
	red: number;
	green: number;
	blue: number;
	onHslInput: (value: string, setter: (val: number) => void, max: number) => void;
	onRgbInput: (component: "r" | "g" | "b", value: string) => void;
	onAddToCustomColors: () => void;
	setHue: (val: number) => void;
	setSaturation: (val: number) => void;
	setLuminosity: (val: number) => void;
}

/**
 * Color input fields component
 *
 * Displays:
 * - Result color preview canvas
 * - HSL input fields (Hue, Saturation, Luminosity)
 * - RGB input fields (Red, Green, Blue)
 * - "Add to Custom Colors" button
 */
export function ColorInputs({
	resultCanvasRef,
	hue,
	saturation,
	luminosity,
	red,
	green,
	blue,
	onHslInput,
	onRgbInput,
	onAddToCustomColors,
	setHue,
	setSaturation,
	setLuminosity,
}: ColorInputsProps) {
	return (
		<div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
			<div>
				<label htmlFor="color-solid-canvas">Color|Solid</label>
				<canvas
					ref={resultCanvasRef}
					id="color-solid-canvas"
					className="result-color-canvas inset-shallow"
					width={58}
					height={40}
					style={{
						display: "block",
						marginTop: "4px",
						border: "2px solid",
						borderColor: "var(--button-shadow) var(--button-highlight) var(--button-highlight) var(--button-shadow)",
					}}
				/>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
				<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
					<label htmlFor="hue-input" style={{ width: "30px" }}>
						Hue:
					</label>
					<input
						id="hue-input"
						type="number"
						min="0"
						max="360"
						value={Math.round(hue)}
						onChange={(e) => onHslInput(e.target.value, setHue, 360)}
						style={{ width: "40px" }}
					/>
				</div>

				<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
					<label htmlFor="sat-input" style={{ width: "30px" }}>
						Sat:
					</label>
					<input
						id="sat-input"
						type="number"
						min="0"
						max="100"
						value={Math.round(saturation)}
						onChange={(e) => onHslInput(e.target.value, setSaturation, 100)}
						style={{ width: "40px" }}
					/>
				</div>

				<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
					<label htmlFor="lum-input" style={{ width: "30px" }}>
						Lum:
					</label>
					<input
						id="lum-input"
						type="number"
						min="0"
						max="100"
						value={Math.round(luminosity)}
						onChange={(e) => onHslInput(e.target.value, setLuminosity, 100)}
						style={{ width: "40px" }}
					/>
				</div>

				<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
					<label htmlFor="red-input" style={{ width: "30px" }}>
						Red:
					</label>
					<input
						id="red-input"
						type="number"
						min="0"
						max="255"
						value={red}
						onChange={(e) => onRgbInput("r", e.target.value)}
						style={{ width: "40px" }}
					/>
				</div>

				<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
					<label htmlFor="green-input" style={{ width: "30px" }}>
						Green:
					</label>
					<input
						id="green-input"
						type="number"
						min="0"
						max="255"
						value={green}
						onChange={(e) => onRgbInput("g", e.target.value)}
						style={{ width: "40px" }}
					/>
				</div>

				<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
					<label htmlFor="blue-input" style={{ width: "30px" }}>
						Blue:
					</label>
					<input
						id="blue-input"
						type="number"
						min="0"
						max="255"
						value={blue}
						onChange={(e) => onRgbInput("b", e.target.value)}
						style={{ width: "40px" }}
					/>
				</div>

				<button onClick={onAddToCustomColors} style={{ marginTop: "4px", fontSize: "11px" }}>
					Add to Custom Colors
				</button>
			</div>
		</div>
	);
}
