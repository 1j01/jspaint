import React, { useState, useEffect, useRef, useCallback } from "react";
import Dialog from "./Dialog";
import { getRgbaFromColor, rgbToHsl, hslToRgb } from "../../utils/colorUtils";
import { basicColors } from "../../data/basicColors";

interface EditColorsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	initialColor: string;
	customColors: string[];
	onColorSelect: (color: string, customColors: string[]) => void;
}

/**
 * Color Editor Dialog - Windows 98 Style
 * Faithful recreation of the Windows system color picker with authentic styling
 */
export default function EditColorsDialog({
	isOpen,
	onClose,
	initialColor,
	customColors: initialCustomColors,
	onColorSelect,
}: EditColorsDialogProps) {
	const [expanded, setExpanded] = useState(false);
	const [selectedColor, setSelectedColor] = useState(initialColor);
	const [customColors, setCustomColors] = useState(initialCustomColors);
	const [customColorIndex, setCustomColorIndex] = useState(0);

	// HSL state
	const [hue, setHue] = useState(0); // 0-360
	const [saturation, setSaturation] = useState(50); // 0-100
	const [luminosity, setLuminosity] = useState(50); // 0-100

	// RGB state (derived from HSL)
	const [red, setRed] = useState(0);
	const [green, setGreen] = useState(0);
	const [blue, setBlue] = useState(0);

	const rainbowCanvasRef = useRef<HTMLCanvasElement>(null);
	const luminosityCanvasRef = useRef<HTMLCanvasElement>(null);
	const resultCanvasRef = useRef<HTMLCanvasElement>(null);
	const lumArrowCanvasRef = useRef<HTMLCanvasElement>(null);
	const [mouseDownOnRainbow, setMouseDownOnRainbow] = useState(false);
	const [crosshairShown, setCrosshairShown] = useState(false);

	// Update RGB when HSL changes
	useEffect(() => {
		const [r, g, b] = hslToRgb(hue / 360, saturation / 100, luminosity / 100);
		setRed(Math.round(r));
		setGreen(Math.round(g));
		setBlue(Math.round(b));
	}, [hue, saturation, luminosity]);

	// Parse initial color
	useEffect(() => {
		if (initialColor) {
			const [r, g, b] = getRgbaFromColor(initialColor);
			const [h, s, l] = rgbToHsl(r, g, b);
			setHue(h * 360);
			setSaturation(s * 100);
			setLuminosity(l * 100);
			setSelectedColor(initialColor);
		}
	}, [initialColor]);

	// Get current color as CSS string
	const getCurrentColor = useCallback(() => {
		return `hsl(${hue}deg, ${saturation}%, ${luminosity}%)`;
	}, [hue, saturation, luminosity]);

	// Update color from RGB
	const updateFromRgb = useCallback((r: number, g: number, b: number) => {
		const [h, s, l] = rgbToHsl(r, g, b);
		setHue(h * 360);
		setSaturation(s * 100);
		setLuminosity(l * 100);
	}, []);

	// Draw rainbow canvas (hue/saturation picker)
	useEffect(() => {
		const canvas = rainbowCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Draw rainbow gradient
		for (let y = 0; y < canvas.height; y += 6) {
			for (let x = -1; x < canvas.width; x += 3) {
				const h = (x / canvas.width) * 360;
				const s = (1 - y / canvas.height) * 100;
				ctx.fillStyle = `hsl(${h}deg, ${s}%, 50%)`;
				ctx.fillRect(x, y, 3, 6);
			}
		}

		// Draw crosshair if not dragging
		if (!mouseDownOnRainbow || crosshairShown) {
			const x = Math.floor((hue / 360) * canvas.width);
			const y = Math.floor((1 - saturation / 100) * canvas.height);

			ctx.fillStyle = "black";
			ctx.fillRect(x - 1, y - 9, 3, 5);
			ctx.fillRect(x - 1, y + 5, 3, 5);
			ctx.fillRect(x - 9, y - 1, 5, 3);
			ctx.fillRect(x + 5, y - 1, 5, 3);
		}
	}, [hue, saturation, mouseDownOnRainbow, crosshairShown]);

	// Draw luminosity slider
	useEffect(() => {
		const canvas = luminosityCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Draw gradient
		for (let y = -2; y < canvas.height; y += 6) {
			const l = (1 - y / canvas.height) * 100;
			ctx.fillStyle = `hsl(${hue}deg, ${saturation}%, ${l}%)`;
			ctx.fillRect(0, y, canvas.width, 6);
		}
	}, [hue, saturation]);

	// Draw result color
	useEffect(() => {
		const canvas = resultCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = getCurrentColor();
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, [getCurrentColor]);

	// Draw luminosity arrow
	useEffect(() => {
		const canvas = lumArrowCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "black";
		for (let x = 0; x < canvas.width; x++) {
			ctx.fillRect(x, canvas.width - x - 1, 1, 1 + x * 2);
		}
	}, []);

	// Handle rainbow canvas interaction
	const handleRainbowPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		setMouseDownOnRainbow(true);
		setCrosshairShown(false);
		updateRainbowSelection(e);
	};

	const handleRainbowPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (mouseDownOnRainbow) {
			updateRainbowSelection(e);
		}
	};

	const handleRainbowPointerUp = () => {
		setMouseDownOnRainbow(false);
		setCrosshairShown(true);
	};

	const updateRainbowSelection = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = rainbowCanvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

		setHue(x * 360);
		setSaturation((1 - y) * 100);
	};

	// Handle luminosity slider interaction
	const handleLuminosityPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		updateLuminositySelection(e);
	};

	const handleLuminosityPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (e.buttons === 1) {
			updateLuminositySelection(e);
		}
	};

	const updateLuminositySelection = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = luminosityCanvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

		setLuminosity((1 - y) * 100);
	};

	// Handle number input changes
	const handleHslInput = (value: string, setter: (val: number) => void, max: number) => {
		if (value === "") return;
		const num = parseInt(value, 10);
		if (isNaN(num)) return;
		setter(Math.max(0, Math.min(max, num)));
	};

	const handleRgbInput = (component: "r" | "g" | "b", value: string) => {
		if (value === "") return;
		const num = parseInt(value, 10);
		if (isNaN(num)) return;

		const clamped = Math.max(0, Math.min(255, num));
		const newRgb = { r: red, g: green, b: blue, [component]: clamped };

		if (component === "r") setRed(clamped);
		if (component === "g") setGreen(clamped);
		if (component === "b") setBlue(clamped);

		updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
	};

	// Select a color from grid
	const handleColorSelect = (color: string) => {
		setSelectedColor(color);
		const [r, g, b] = getRgbaFromColor(color);
		updateFromRgb(r, g, b);
	};

	// Add to custom colors
	const handleAddToCustomColors = () => {
		const color = getCurrentColor();
		const newCustomColors = [...customColors];
		newCustomColors[customColorIndex] = color;
		setCustomColors(newCustomColors);
		setCustomColorIndex((customColorIndex + 1) % newCustomColors.length);
	};

	// Handle OK
	const handleOk = () => {
		onColorSelect(getCurrentColor(), customColors);
		onClose();
	};

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="Edit Colors"
			width={expanded ? 450 : 240}
		>
			<div style={{ display: "flex", gap: "8px" }}>
				<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
					<label htmlFor="basic-colors">Basic colors:</label>
					<div
						id="basic-colors"
						className="color-grid inset-shallow"
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(8, 20px)",
							gridTemplateRows: "repeat(6, 20px)",
							gap: "0",
							border: "2px solid",
							borderColor: "var(--button-shadow) var(--button-highlight) var(--button-highlight) var(--button-shadow)",
							padding: "2px",
							background: "var(--surface)",
						}}
					>
						{basicColors.map((color, index) => (
							<button
								key={index}
								className={`color-swatch ${selectedColor === color ? "selected" : ""}`}
								style={{
									width: "20px",
									height: "20px",
									backgroundColor: color,
									border: selectedColor === color ? "2px solid black" : "1px solid #808080",
									padding: 0,
									minWidth: 0,
									minHeight: 0,
									boxShadow: "none",
								}}
								onClick={() => handleColorSelect(color)}
								title={color}
								aria-label={`Basic color ${index + 1}: ${color}`}
							/>
						))}
					</div>

					<label htmlFor="custom-colors">Custom colors:</label>
					<div
						id="custom-colors"
						className="color-grid inset-shallow"
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(8, 20px)",
							gridTemplateRows: "repeat(2, 20px)",
							gap: "0",
							border: "2px solid",
							borderColor: "var(--button-shadow) var(--button-highlight) var(--button-highlight) var(--button-shadow)",
							padding: "2px",
							background: "var(--surface)",
						}}
					>
						{customColors.map((color, index) => (
							<button
								key={index}
								className={`color-swatch ${selectedColor === color ? "selected" : ""}`}
								style={{
									width: "20px",
									height: "20px",
									backgroundColor: color,
									border: selectedColor === color ? "2px solid black" : "1px solid #808080",
									padding: 0,
									minWidth: 0,
									minHeight: 0,
									boxShadow: "none",
								}}
								onClick={() => handleColorSelect(color)}
								title={color}
								aria-label={`Custom color ${index + 1}: ${color}`}
							/>
						))}
					</div>

					{!expanded && (
						<button onClick={() => setExpanded(true)} style={{ marginTop: "4px" }}>
							Define Custom Colors &gt;&gt;
						</button>
					)}

					<div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
						<button onClick={handleOk}>OK</button>
						<button onClick={onClose}>Cancel</button>
					</div>
				</div>

				{expanded && (
					<div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
						<div style={{ display: "flex", gap: "8px" }}>
							<canvas
								ref={rainbowCanvasRef}
								className="rainbow-canvas inset-shallow"
								width={175}
								height={187}
								onPointerDown={handleRainbowPointerDown}
								onPointerMove={handleRainbowPointerMove}
								onPointerUp={handleRainbowPointerUp}
								onPointerLeave={handleRainbowPointerUp}
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
									onPointerDown={handleLuminosityPointerDown}
									onPointerMove={handleLuminosityPointerMove}
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
									<label htmlFor="hue-input" style={{ width: "30px" }}>Hue:</label>
									<input
										id="hue-input"
										type="number"
										min="0"
										max="360"
										value={Math.round(hue)}
										onChange={(e) => handleHslInput(e.target.value, setHue, 360)}
										style={{ width: "40px" }}
									/>
								</div>

								<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
									<label htmlFor="sat-input" style={{ width: "30px" }}>Sat:</label>
									<input
										id="sat-input"
										type="number"
										min="0"
										max="100"
										value={Math.round(saturation)}
										onChange={(e) => handleHslInput(e.target.value, setSaturation, 100)}
										style={{ width: "40px" }}
									/>
								</div>

								<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
									<label htmlFor="lum-input" style={{ width: "30px" }}>Lum:</label>
									<input
										id="lum-input"
										type="number"
										min="0"
										max="100"
										value={Math.round(luminosity)}
										onChange={(e) => handleHslInput(e.target.value, setLuminosity, 100)}
										style={{ width: "40px" }}
									/>
								</div>

								<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
									<label htmlFor="red-input" style={{ width: "30px" }}>Red:</label>
									<input
										id="red-input"
										type="number"
										min="0"
										max="255"
										value={red}
										onChange={(e) => handleRgbInput("r", e.target.value)}
										style={{ width: "40px" }}
									/>
								</div>

								<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
									<label htmlFor="green-input" style={{ width: "30px" }}>Green:</label>
									<input
										id="green-input"
										type="number"
										min="0"
										max="255"
										value={green}
										onChange={(e) => handleRgbInput("g", e.target.value)}
										style={{ width: "40px" }}
									/>
								</div>

								<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
									<label htmlFor="blue-input" style={{ width: "30px" }}>Blue:</label>
									<input
										id="blue-input"
										type="number"
										min="0"
										max="255"
										value={blue}
										onChange={(e) => handleRgbInput("b", e.target.value)}
										style={{ width: "40px" }}
									/>
								</div>

								<button onClick={handleAddToCustomColors} style={{ marginTop: "4px", fontSize: "11px" }}>
									Add to Custom Colors
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</Dialog>
	);
}
