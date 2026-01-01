import { useEffect, RefObject } from "react";

interface UseColorCanvasesProps {
	rainbowCanvasRef: RefObject<HTMLCanvasElement>;
	luminosityCanvasRef: RefObject<HTMLCanvasElement>;
	resultCanvasRef: RefObject<HTMLCanvasElement>;
	lumArrowCanvasRef: RefObject<HTMLCanvasElement>;
	hue: number;
	saturation: number;
	luminosity: number;
	mouseDownOnRainbow: boolean;
	crosshairShown: boolean;
	getCurrentColor: () => string;
}

/**
 * Custom hook for managing color picker canvas rendering
 *
 * Handles:
 * - Rainbow canvas (hue/saturation picker) with crosshair
 * - Luminosity slider with gradient
 * - Result color preview
 * - Luminosity arrow indicator
 */
export function useColorCanvases({
	rainbowCanvasRef,
	luminosityCanvasRef,
	resultCanvasRef,
	lumArrowCanvasRef,
	hue,
	saturation,
	luminosity,
	mouseDownOnRainbow,
	crosshairShown,
	getCurrentColor,
}: UseColorCanvasesProps) {
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
	}, [hue, saturation, mouseDownOnRainbow, crosshairShown, rainbowCanvasRef]);

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
	}, [hue, saturation, luminosityCanvasRef]);

	// Draw result color
	useEffect(() => {
		const canvas = resultCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = getCurrentColor();
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}, [getCurrentColor, resultCanvasRef]);

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
	}, [lumArrowCanvasRef]);
}
