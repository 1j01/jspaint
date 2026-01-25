import React, { RefObject } from "react";
import { useTranslation } from "react-i18next";

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
 * Color input fields component - matches jQuery implementation with absolute positioning
 *
 * Displays:
 * - Result color preview canvas (positioned at left:10, top:198)
 * - "Color|Solid" label (positioned at left:10, top:244)
 * - HSL input fields (Hue, Sat, Lum) - absolutely positioned
 * - RGB input fields (Red, Green, Blue) - absolutely positioned
 * - "Add to Custom Colors" button (positioned at bottom:5, right:5)
 *
 * All elements use absolute positioning to exactly match edit-colors.js layout.
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
	const { t } = useTranslation();
	const inputYSpacing = 22;

	return (
		<>
			{/* Result canvas - shows current color */}
			<canvas
				ref={resultCanvasRef}
				id="color-solid-canvas"
				className="result-color-canvas inset-shallow"
				width={58}
				height={40}
				style={{
					position: "absolute",
					left: 10,
					top: 198,
				}}
			/>

			{/* "Color|Solid" label */}
			<label
				htmlFor="color-solid-canvas"
				style={{
					position: "absolute",
					left: 10,
					top: 244,
				}}
			>
				{t("Color|Solid")}
			</label>

			{/* HSL inputs - column at left: 63 */}
			<label
				style={{
					position: "absolute",
					left: 63,
					top: 202,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				}}
			>
				{t("Hue:")}
			</label>
			<input
				type="text"
				className="inset-deep"
				value={Math.floor(hue)}
				onChange={(e) => onHslInput(e.target.value, setHue, 360)}
				style={{
					position: "absolute",
					left: 106,
					top: 202,
					width: 21,
					height: 14,
				}}
			/>

			<label
				style={{
					position: "absolute",
					left: 63,
					top: 202 + inputYSpacing,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				}}
			>
				{t("Sat:")}
			</label>
			<input
				type="text"
				className="inset-deep"
				value={Math.floor(saturation)}
				onChange={(e) => onHslInput(e.target.value, setSaturation, 100)}
				style={{
					position: "absolute",
					left: 106,
					top: 202 + inputYSpacing,
					width: 21,
					height: 14,
				}}
			/>

			<label
				style={{
					position: "absolute",
					left: 63,
					top: 202 + inputYSpacing * 2,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				}}
			>
				{t("Lum:")}
			</label>
			<input
				type="text"
				className="inset-deep"
				value={Math.floor(luminosity)}
				onChange={(e) => onHslInput(e.target.value, setLuminosity, 100)}
				style={{
					position: "absolute",
					left: 106,
					top: 202 + inputYSpacing * 2 + 1, // uneven spacing by 1px
					width: 21,
					height: 14,
				}}
			/>

			{/* RGB inputs - column at left: 143 (63 + 80) */}
			<label
				style={{
					position: "absolute",
					left: 143,
					top: 202,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				}}
			>
				{t("Red:")}
			</label>
			<input
				type="text"
				className="inset-deep"
				value={red}
				onChange={(e) => onRgbInput("r", e.target.value)}
				style={{
					position: "absolute",
					left: 186,
					top: 202,
					width: 21,
					height: 14,
				}}
			/>

			<label
				style={{
					position: "absolute",
					left: 143,
					top: 202 + inputYSpacing,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				}}
			>
				{t("Green:")}
			</label>
			<input
				type="text"
				className="inset-deep"
				value={green}
				onChange={(e) => onRgbInput("g", e.target.value)}
				style={{
					position: "absolute",
					left: 186,
					top: 202 + inputYSpacing,
					width: 21,
					height: 14,
				}}
			/>

			<label
				style={{
					position: "absolute",
					left: 143,
					top: 202 + inputYSpacing * 2,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				}}
			>
				{t("Blue:")}
			</label>
			<input
				type="text"
				className="inset-deep"
				value={blue}
				onChange={(e) => onRgbInput("b", e.target.value)}
				style={{
					position: "absolute",
					left: 186,
					top: 202 + inputYSpacing * 2 + 1, // uneven spacing by 1px
					width: 21,
					height: 14,
				}}
			/>

			{/* Add to Custom Colors button - positioned at bottom right */}
			<button
				className="add-to-custom-colors-button"
				type="button"
				onClick={onAddToCustomColors}
			>
				{t("Add To Custom Colors")}
			</button>
		</>
	);
}
