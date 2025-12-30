import React, { useState, useEffect, useRef, useCallback } from "react";
import Dialog from "./Dialog";
import { getRgbaFromColor, rgbToHsl, hslToRgb } from "../../utils/colorUtils";
import { basicColors } from "../../data/basicColors";
import "./EditColorsDialog.css";

interface EditColorsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	initialColor: string;
	customColors: string[];
	onColorSelect: (color: string, customColors: string[]) => void;
}

/**
 * Color Editor Dialog
 *
 * A visually stunning color picker inspired by the Windows system color picker,
 * but with modern touches: smooth gradients, micro-interactions, and refined typography.
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
	const [isDraggingRainbow, setIsDraggingRainbow] = useState(false);
	const [isDraggingLuminosity, setIsDraggingLuminosity] = useState(false);

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

		// Draw rainbow gradient with optimized rendering
		for (let y = 0; y < canvas.height; y += 4) {
			for (let x = 0; x < canvas.width; x += 2) {
				const h = (x / canvas.width) * 360;
				const s = (1 - y / canvas.height) * 100;
				ctx.fillStyle = `hsl(${h}deg, ${s}%, 50%)`;
				ctx.fillRect(x, y, 2, 4);
			}
		}

		// Draw crosshair if not dragging
		if (!isDraggingRainbow) {
			const x = Math.round((hue / 360) * canvas.width);
			const y = Math.round((1 - saturation / 100) * canvas.height);

			ctx.strokeStyle = "#000";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.stroke();

			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.stroke();
		}
	}, [hue, saturation, isDraggingRainbow]);

	// Draw luminosity slider
	useEffect(() => {
		const canvas = luminosityCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Draw gradient
		for (let y = 0; y < canvas.height; y += 4) {
			const l = (1 - y / canvas.height) * 100;
			ctx.fillStyle = `hsl(${hue}deg, ${saturation}%, ${l}%)`;
			ctx.fillRect(0, y, canvas.width, 4);
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

	// Handle rainbow canvas interaction
	const handleRainbowPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		setIsDraggingRainbow(true);
		updateRainbowSelection(e);
	};

	const handleRainbowPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (isDraggingRainbow) {
			updateRainbowSelection(e);
		}
	};

	const handleRainbowPointerUp = () => {
		setIsDraggingRainbow(false);
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
		setIsDraggingLuminosity(true);
		updateLuminositySelection(e);
	};

	const handleLuminosityPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (isDraggingLuminosity) {
			updateLuminositySelection(e);
		}
	};

	const handleLuminosityPointerUp = () => {
		setIsDraggingLuminosity(false);
	};

	const updateLuminositySelection = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = luminosityCanvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

		setLuminosity((1 - y) * 100);
	};

	// Handle number input changes
	const handleNumberInput = (
		value: string,
		setter: (val: number) => void,
		max: number,
		isRgb: boolean = false
	) => {
		if (value === "") return;
		const num = parseInt(value, 10);
		if (isNaN(num)) return;

		const clamped = Math.max(0, Math.min(max, num));
		setter(clamped);

		// If RGB changed, update HSL
		if (isRgb) {
			updateFromRgb(red, green, blue);
		}
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
			width={expanded ? 540 : 280}
		>
			<div className={`edit-colors-content ${expanded ? "expanded" : ""}`}>
				<div className="edit-colors-left">
					<label className="edit-colors-label">Basic colors:</label>
					<div className="basic-colors-grid">
						{basicColors.map((color, index) => (
							<button
								key={index}
								className={`color-swatch ${selectedColor === color ? "selected" : ""}`}
								style={{ backgroundColor: color }}
								onClick={() => handleColorSelect(color)}
								title={color}
								aria-label={`Basic color ${index + 1}: ${color}`}
							/>
						))}
					</div>

					<label className="edit-colors-label">Custom colors:</label>
					<div className="custom-colors-grid">
						{customColors.map((color, index) => (
							<button
								key={index}
								className={`color-swatch ${selectedColor === color ? "selected" : ""}`}
								style={{ backgroundColor: color }}
								onClick={() => handleColorSelect(color)}
								title={color}
								aria-label={`Custom color ${index + 1}: ${color}`}
							/>
						))}
					</div>

					{!expanded && (
						<button
							className="define-custom-colors-button"
							onClick={() => setExpanded(true)}
						>
							Define Custom Colors &gt;&gt;
						</button>
					)}

					<div className="dialog-buttons">
						<button onClick={handleOk}>OK</button>
						<button onClick={onClose}>Cancel</button>
					</div>
				</div>

				{expanded && (
					<div className="edit-colors-right">
						<div className="color-picker-area">
							<canvas
								ref={rainbowCanvasRef}
								className="rainbow-canvas"
								width={220}
								height={220}
								onPointerDown={handleRainbowPointerDown}
								onPointerMove={handleRainbowPointerMove}
								onPointerUp={handleRainbowPointerUp}
								onPointerLeave={handleRainbowPointerUp}
							/>

							<div className="luminosity-slider-container">
								<canvas
									ref={luminosityCanvasRef}
									className="luminosity-canvas"
									width={20}
									height={220}
									onPointerDown={handleLuminosityPointerDown}
									onPointerMove={handleLuminosityPointerMove}
									onPointerUp={handleLuminosityPointerUp}
									onPointerLeave={handleLuminosityPointerUp}
								/>
								<div
									className="luminosity-arrow"
									style={{
										top: `${(1 - luminosity / 100) * 220 - 4}px`,
									}}
								>
									▶
								</div>
							</div>
						</div>

						<div className="color-inputs-area">
							<div className="color-result-preview">
								<label>Color:</label>
								<canvas
									ref={resultCanvasRef}
									className="result-canvas"
									width={80}
									height={50}
								/>
							</div>

							<div className="color-inputs-grid">
								<div className="color-input-group">
									<label>Hue:</label>
									<input
										type="number"
										min="0"
										max="360"
										value={Math.round(hue)}
										onChange={(e) => handleNumberInput(e.target.value, setHue, 360)}
									/>
								</div>

								<div className="color-input-group">
									<label>Sat:</label>
									<input
										type="number"
										min="0"
										max="100"
										value={Math.round(saturation)}
										onChange={(e) => handleNumberInput(e.target.value, setSaturation, 100)}
									/>
								</div>

								<div className="color-input-group">
									<label>Lum:</label>
									<input
										type="number"
										min="0"
										max="100"
										value={Math.round(luminosity)}
										onChange={(e) => handleNumberInput(e.target.value, setLuminosity, 100)}
									/>
								</div>

								<div className="color-input-group">
									<label>Red:</label>
									<input
										type="number"
										min="0"
										max="255"
										value={red}
										onChange={(e) => {
											const val = parseInt(e.target.value, 10);
											if (!isNaN(val)) {
												setRed(Math.max(0, Math.min(255, val)));
												updateFromRgb(val, green, blue);
											}
										}}
									/>
								</div>

								<div className="color-input-group">
									<label>Green:</label>
									<input
										type="number"
										min="0"
										max="255"
										value={green}
										onChange={(e) => {
											const val = parseInt(e.target.value, 10);
											if (!isNaN(val)) {
												setGreen(Math.max(0, Math.min(255, val)));
												updateFromRgb(red, val, blue);
											}
										}}
									/>
								</div>

								<div className="color-input-group">
									<label>Blue:</label>
									<input
										type="number"
										min="0"
										max="255"
										value={blue}
										onChange={(e) => {
											const val = parseInt(e.target.value, 10);
											if (!isNaN(val)) {
												setBlue(Math.max(0, Math.min(255, val)));
												updateFromRgb(red, green, val);
											}
										}}
									/>
								</div>
							</div>

							<button
								className="add-to-custom-colors-button"
								onClick={handleAddToCustomColors}
							>
								Add To Custom Colors
							</button>
						</div>
					</div>
				)}
			</div>
		</Dialog>
	);
}
