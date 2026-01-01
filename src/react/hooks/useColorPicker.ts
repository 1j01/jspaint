import { useState, useEffect, useCallback, RefObject } from "react";
import { getRgbaFromColor, rgbToHsl, hslToRgb } from "../utils/colorUtils";

interface UseColorPickerProps {
	initialColor: string;
	rainbowCanvasRef: RefObject<HTMLCanvasElement>;
	luminosityCanvasRef: RefObject<HTMLCanvasElement>;
}

/**
 * Custom hook for color picker state and interaction logic
 *
 * Manages:
 * - HSL and RGB color state
 * - Rainbow canvas (hue/saturation) interaction
 * - Luminosity slider interaction
 * - Input field updates
 * - Color conversion between HSL and RGB
 */
export function useColorPicker({ initialColor, rainbowCanvasRef, luminosityCanvasRef }: UseColorPickerProps) {
	// HSL state
	const [hue, setHue] = useState(0); // 0-360
	const [saturation, setSaturation] = useState(50); // 0-100
	const [luminosity, setLuminosity] = useState(50); // 0-100

	// RGB state (derived from HSL)
	const [red, setRed] = useState(0);
	const [green, setGreen] = useState(0);
	const [blue, setBlue] = useState(0);

	// Interaction state
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

	// Handle rainbow canvas interaction
	const handleRainbowPointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			setMouseDownOnRainbow(true);
			setCrosshairShown(false);

			const canvas = rainbowCanvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

			setHue(x * 360);
			setSaturation((1 - y) * 100);
		},
		[rainbowCanvasRef]
	);

	const handleRainbowPointerMove = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (!mouseDownOnRainbow) return;

			const canvas = rainbowCanvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

			setHue(x * 360);
			setSaturation((1 - y) * 100);
		},
		[mouseDownOnRainbow, rainbowCanvasRef]
	);

	const handleRainbowPointerUp = useCallback(() => {
		setMouseDownOnRainbow(false);
		setCrosshairShown(true);
	}, []);

	// Handle luminosity slider interaction
	const handleLuminosityPointerDown = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			const canvas = luminosityCanvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

			setLuminosity((1 - y) * 100);
		},
		[luminosityCanvasRef]
	);

	const handleLuminosityPointerMove = useCallback(
		(e: React.PointerEvent<HTMLCanvasElement>) => {
			if (e.buttons !== 1) return;

			const canvas = luminosityCanvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

			setLuminosity((1 - y) * 100);
		},
		[luminosityCanvasRef]
	);

	// Handle number input changes
	const handleHslInput = useCallback((value: string, setter: (val: number) => void, max: number) => {
		if (value === "") return;
		const num = parseInt(value, 10);
		if (isNaN(num)) return;
		setter(Math.max(0, Math.min(max, num)));
	}, []);

	const handleRgbInput = useCallback(
		(component: "r" | "g" | "b", value: string) => {
			if (value === "") return;
			const num = parseInt(value, 10);
			if (isNaN(num)) return;

			const clamped = Math.max(0, Math.min(255, num));
			const newRgb = { r: red, g: green, b: blue, [component]: clamped };

			if (component === "r") setRed(clamped);
			if (component === "g") setGreen(clamped);
			if (component === "b") setBlue(clamped);

			updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
		},
		[red, green, blue, updateFromRgb]
	);

	return {
		// HSL state
		hue,
		saturation,
		luminosity,
		setHue,
		setSaturation,
		setLuminosity,

		// RGB state
		red,
		green,
		blue,

		// Interaction state
		mouseDownOnRainbow,
		crosshairShown,

		// Methods
		getCurrentColor,
		updateFromRgb,

		// Event handlers
		handleRainbowPointerDown,
		handleRainbowPointerMove,
		handleRainbowPointerUp,
		handleLuminosityPointerDown,
		handleLuminosityPointerMove,
		handleHslInput,
		handleRgbInput,
	};
}
