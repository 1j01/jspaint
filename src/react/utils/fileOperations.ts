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
			console.log("[loadImageFile] FileReader loaded successfully");
			const img = new Image();

			img.onload = () => {
				console.log("[loadImageFile] Image element loaded, starting canvas operations");

				// Helper to wait for canvas ref to be available
				const waitForCanvas = (attempts = 0): void => {
					const canvas = canvasRef.current;
					if (!canvas) {
						if (attempts < 10) {
							console.log(`[loadImageFile] Canvas ref not available yet, retrying... (attempt ${attempts + 1}/10)`);
							setTimeout(() => waitForCanvas(attempts + 1), 100);
							return;
						}
						console.error("[loadImageFile] Canvas ref not available after 10 attempts");
						reject(new Error("Canvas not ready"));
						return;
					}
					console.log("[loadImageFile] Canvas ref obtained:", canvas);

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
						console.error("[loadImageFile] Could not get 2d context");
						throw new Error("Could not get 2d context");
					}
					console.log("[loadImageFile] Canvas context obtained");

					// Clear any existing selection before loading new image
					console.log("[loadImageFile] Clearing selection...");
					onClearSelection();
					console.log("[loadImageFile] Selection cleared");

					// Resize canvas to match image
					console.log(`[loadImageFile] Resizing canvas from ${canvas.width}x${canvas.height} to ${img.width}x${img.height}`);
					canvas.width = img.width;
					canvas.height = img.height;
					console.log(`[loadImageFile] Canvas resized to ${canvas.width}x${canvas.height}`);

					// Draw the image
					console.log("[loadImageFile] Drawing image to canvas...");
					ctx.drawImage(img, 0, 0);
					console.log("[loadImageFile] Image drawn to canvas");

					// Verify the image was drawn by checking a pixel
					const pixelData = ctx.getImageData(0, 0, 1, 1).data;
					console.log("[loadImageFile] Sample pixel at (0,0):", {
						r: pixelData[0],
						g: pixelData[1],
						b: pixelData[2],
						a: pixelData[3],
					});

					// Update canvas size in store
					console.log("[loadImageFile] Updating canvas size in store...");
					onSetCanvasSize(img.width, img.height);
					console.log("[loadImageFile] Canvas size updated in store");

					// Save to history AFTER drawing (so the new image is captured)
					console.log("[loadImageFile] Saving to history...");
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					console.log("[loadImageFile] ImageData captured:", {
						width: imageData.width,
						height: imageData.height,
						dataLength: imageData.data.length,
					});
					onSaveState(imageData);
					console.log("[loadImageFile] Saved to history");

					console.log(`[loadImageFile] ✅ Successfully loaded image: ${img.width}x${img.height}`);
				};

				// Start waiting for canvas
				waitForCanvas();
			};

			img.onerror = (err) => {
				console.error("[loadImageFile] Failed to load image:", err);
				reject(new Error("Failed to load image"));
			};

			img.src = ev.target?.result as string;
		};

		reader.onerror = (err) => {
			console.error("[loadImageFile] Failed to read file:", err);
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
