/**
 * File Operations Utilities
 *
 * Handles loading images from files into the canvas.
 * Extracted from useMenuActions to reduce file size.
 */

/**
 * Load an image file to canvas
 *
 * @param file - The file to load
 * @param canvasRef - Reference to the canvas element
 * @param callbacks - Callbacks for success/error/state updates
 */
export async function loadImageFileToCanvas(
	file: File,
	canvasRef: React.RefObject<HTMLCanvasElement>,
	callbacks: {
		onClearSelection: () => void;
		onSetCanvasSize: (width: number, height: number) => void;
		onSaveState: (imageData: ImageData) => void;
	}
): Promise<void> {
	const { onClearSelection, onSetCanvasSize, onSaveState } = callbacks;

	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (ev) => {
			const img = new Image();

			img.onload = () => {
				// Helper to wait for canvas ref to be available
				const waitForCanvas = (attempts = 0): void => {
					const canvas = canvasRef.current;
					if (!canvas) {
						if (attempts < 10) {
							setTimeout(() => waitForCanvas(attempts + 1), 100);
							return;
						}
						reject(new Error("Canvas not ready"));
						return;
					}

					try {
						loadImageToCanvas(canvas, img);
						resolve();
					} catch (error) {
						reject(error);
					}
				};

				// Actual image loading logic
				const loadImageToCanvas = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
					const ctx = canvas.getContext("2d", { willReadFrequently: true });
					if (!ctx) {
						throw new Error("Could not get 2d context");
					}

					// Clear any existing selection before loading new image
					onClearSelection();

					// Resize canvas to match image
					canvas.width = img.width;
					canvas.height = img.height;

					// Draw the image
					ctx.drawImage(img, 0, 0);

					// Update canvas size in store
					onSetCanvasSize(img.width, img.height);

					// Save to history AFTER drawing (so the new image is captured)
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					onSaveState(imageData);
				};

				// Start waiting for canvas
				waitForCanvas();
			};

			img.onerror = () => {
				reject(new Error("Failed to load image"));
			};

			img.src = ev.target?.result as string;
		};

		reader.onerror = () => {
			reject(new Error("Failed to read file"));
		};

		reader.readAsDataURL(file);
	});
}

/**
 * Create a file input element and trigger file selection
 *
 * @param accept - File types to accept (e.g., ".png,.jpg,.bmp")
 * @param onFileSelected - Callback when file is selected
 */
export function createFileInput(accept: string, onFileSelected: (file: File) => void): void {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			onFileSelected(file);
		}
	};
	input.click();
}
