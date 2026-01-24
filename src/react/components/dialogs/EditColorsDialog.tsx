import React, { useState, useRef, useEffect, useCallback } from "react";
import Dialog from "./Dialog";
import { getRgbaFromColor } from "../../utils/colorUtils";
import { basicColors } from "../../data/basicColors";
import { useColorPicker } from "../../hooks/useColorPicker";
import { useColorCanvases } from "../../hooks/useColorCanvases";
import { ColorPickerCanvas } from "./ColorPickerCanvas";
import { ColorInputs } from "./ColorInputs";

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
export function EditColorsDialog({
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

	// Refs to track swatch elements for focus management
	const swatchRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

	// Canvas refs
	const rainbowCanvasRef = useRef<HTMLCanvasElement>(null);
	const luminosityCanvasRef = useRef<HTMLCanvasElement>(null);
	const resultCanvasRef = useRef<HTMLCanvasElement>(null);
	const lumArrowCanvasRef = useRef<HTMLCanvasElement>(null);

	// Color picker state and interaction logic
	const colorPicker = useColorPicker({
		initialColor,
		rainbowCanvasRef,
		luminosityCanvasRef,
	});

	// Canvas rendering
	useColorCanvases({
		rainbowCanvasRef,
		luminosityCanvasRef,
		resultCanvasRef,
		lumArrowCanvasRef,
		hue: colorPicker.hue,
		saturation: colorPicker.saturation,
		luminosity: colorPicker.luminosity,
		mouseDownOnRainbow: colorPicker.mouseDownOnRainbow,
		crosshairShown: colorPicker.crosshairShown,
		getCurrentColor: colorPicker.getCurrentColor,
		isExpanded: expanded,
	});

	// Force redraw when dialog expands
	useEffect(() => {
		if (expanded) {
			// Wait for next frame to ensure canvases are mounted and refs are set
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					// Double RAF to ensure DOM is fully updated
					const [r, g, b] = getRgbaFromColor(colorPicker.getCurrentColor());
					colorPicker.updateFromRgb(r, g, b);
				});
			});
		}
	}, [expanded]);

	// Callback ref to register swatch elements
	const setSwatchRef = useCallback((color: string) => {
		return (el: HTMLButtonElement | null) => {
			if (el) {
				swatchRefs.current.set(color, el);
			} else {
				swatchRefs.current.delete(color);
			}
		};
	}, []);

	// On mount: select the matching color swatch if it exists in basic or custom colors
	useEffect(() => {
		if (!isOpen) return;

		const initialRgba = getRgbaFromColor(initialColor).join(",");

		// Check basic colors first
		for (const color of basicColors) {
			if (getRgbaFromColor(color).join(",") === initialRgba) {
				setSelectedColor(color);
				// Focus the matching swatch element
				const swatchEl = swatchRefs.current.get(color);
				if (swatchEl) {
					swatchEl.focus();
				}
				return;
			}
		}

		// Then check custom colors
		for (const color of customColors) {
			if (getRgbaFromColor(color).join(",") === initialRgba) {
				setSelectedColor(color);
				// Focus the matching swatch element
				const swatchEl = swatchRefs.current.get(color);
				if (swatchEl) {
					swatchEl.focus();
				}
				return;
			}
		}

		// If no match found, keep initialColor as selected
		setSelectedColor(initialColor);
	}, [isOpen, initialColor, customColors]);

	// Select a color from grid
	const handleColorSelect = (color: string) => {
		setSelectedColor(color);
		const [r, g, b] = getRgbaFromColor(color);
		colorPicker.updateFromRgb(r, g, b);
	};

	// Add to custom colors
	const handleAddToCustomColors = () => {
		const color = colorPicker.getCurrentColor();
		const newCustomColors = [...customColors];
		newCustomColors[customColorIndex] = color;
		setCustomColors(newCustomColors);
		setCustomColorIndex((customColorIndex + 1) % newCustomColors.length);
	};

	// Handle expanding the dialog to show color picker
	const handleExpand = () => {
		setExpanded(true);
		// Select a random color from basic colors when expanding
		const randomColor = basicColors[Math.floor(Math.random() * basicColors.length)];
		handleColorSelect(randomColor);
	};
	const handleOk = () => {
		onColorSelect(colorPicker.getCurrentColor(), customColors);
		onClose();
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Edit Colors" width={expanded ? 435 : 254} className="dialog-window edit-colors-window">
			<div className="left-right-split">
				<div className="left-side">
					<label htmlFor="basic-colors">Basic colors:</label>
					<div id="basic-colors" className="color-grid">
						{basicColors.map((color, index) => (
							<button
								key={index}
								type="button"
								ref={setSwatchRef(color)}
								className={`swatch inset-deep lightweight ${selectedColor === color ? "selected" : ""}`}
								style={{ backgroundColor: color }}
								onClick={() => handleColorSelect(color)}
								title={color}
								aria-label={`Basic color ${index + 1}: ${color}`}
							/>
						))}
					</div>

					<label htmlFor="custom-colors">Custom colors:</label>
					<div id="custom-colors" className="color-grid">
						{customColors.map((color, index) => (
							<button
								key={index}
								type="button"
								ref={setSwatchRef(color)}
								className={`swatch inset-deep lightweight ${selectedColor === color ? "selected" : ""}`}
								style={{ backgroundColor: color }}
								onClick={() => handleColorSelect(color)}
								title={color}
								aria-label={`Custom color ${index + 1}: ${color}`}
							/>
						))}
					</div>

					{!expanded && (
						<button type="button" className="define-custom-colors-button" onClick={handleExpand}>
							Define Custom Colors &gt;&gt;
						</button>
					)}

					<div className="button-group">
						<button type="button" onClick={handleOk}>OK</button>
						<button type="button" onClick={onClose}>Cancel</button>
					</div>
				</div>

				{expanded && (
					<div className="right-side">
						<ColorPickerCanvas
							rainbowCanvasRef={rainbowCanvasRef}
							luminosityCanvasRef={luminosityCanvasRef}
							lumArrowCanvasRef={lumArrowCanvasRef}
							luminosity={colorPicker.luminosity}
							onRainbowPointerDown={colorPicker.handleRainbowPointerDown}
							onRainbowPointerMove={colorPicker.handleRainbowPointerMove}
							onRainbowPointerUp={colorPicker.handleRainbowPointerUp}
							onLuminosityPointerDown={colorPicker.handleLuminosityPointerDown}
							onLuminosityPointerMove={colorPicker.handleLuminosityPointerMove}
						/>

						<ColorInputs
							resultCanvasRef={resultCanvasRef}
							hue={colorPicker.hue}
							saturation={colorPicker.saturation}
							luminosity={colorPicker.luminosity}
							red={colorPicker.red}
							green={colorPicker.green}
							blue={colorPicker.blue}
							onHslInput={colorPicker.handleHslInput}
							onRgbInput={colorPicker.handleRgbInput}
							onAddToCustomColors={handleAddToCustomColors}
							setHue={colorPicker.setHue}
							setSaturation={colorPicker.setSaturation}
							setLuminosity={colorPicker.setLuminosity}
						/>
					</div>
				)}
			</div>
		</Dialog>
	);
}
