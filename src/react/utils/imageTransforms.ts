/**
 * Image transformation utilities for canvas operations.
 * These functions operate on ImageData and return new ImageData.
 */

/**
 * Flips an image horizontally (mirror along vertical axis).
 * Creates a new ImageData with pixels reversed left-to-right.
 *
 * @param imageData - Source image data to flip
 * @returns New ImageData with horizontally flipped pixels
 *
 * @example
 * const flipped = flipHorizontal(originalImageData);
 * ctx.putImageData(flipped, 0, 0);
 */
export function flipHorizontal(imageData: ImageData): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const srcIndex = (y * width + x) * 4;
			const destIndex = (y * width + (width - 1 - x)) * 4;

			resultData[destIndex] = data[srcIndex];
			resultData[destIndex + 1] = data[srcIndex + 1];
			resultData[destIndex + 2] = data[srcIndex + 2];
			resultData[destIndex + 3] = data[srcIndex + 3];
		}
	}

	return result;
}

/**
 * Flips an image vertically (mirror along horizontal axis).
 * Creates a new ImageData with pixels reversed top-to-bottom.
 *
 * @param imageData - Source image data to flip
 * @returns New ImageData with vertically flipped pixels
 *
 * @example
 * const flipped = flipVertical(originalImageData);
 * ctx.putImageData(flipped, 0, 0);
 */
export function flipVertical(imageData: ImageData): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const srcIndex = (y * width + x) * 4;
			const destIndex = ((height - 1 - y) * width + x) * 4;

			resultData[destIndex] = data[srcIndex];
			resultData[destIndex + 1] = data[srcIndex + 1];
			resultData[destIndex + 2] = data[srcIndex + 2];
			resultData[destIndex + 3] = data[srcIndex + 3];
		}
	}

	return result;
}

/**
 * Rotates an image by the specified degrees (90, 180, or 270).
 * For 90/270 degree rotations, swaps width and height dimensions.
 * For arbitrary angles, use rotateArbitrary instead.
 *
 * @param imageData - Source image data to rotate
 * @param degrees - Rotation angle in degrees (normalized to 0, 90, 180, or 270)
 * @returns New ImageData with rotated pixels (may have swapped dimensions)
 *
 * @example
 * const rotated = rotate(originalImageData, 90);
 * // Returns image rotated 90 degrees clockwise
 */
export function rotate(imageData: ImageData, degrees: number): ImageData {
	const { width, height, data } = imageData;

	// Normalize degrees to 0, 90, 180, or 270
	const normalizedDegrees = ((degrees % 360) + 360) % 360;

	if (normalizedDegrees === 0) {
		// No rotation needed, return a copy
		const result = new ImageData(width, height);
		result.data.set(data);
		return result;
	}

	if (normalizedDegrees === 180) {
		// 180 degree rotation: same dimensions
		const result = new ImageData(width, height);
		const resultData = result.data;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const srcIndex = (y * width + x) * 4;
				const destIndex = ((height - 1 - y) * width + (width - 1 - x)) * 4;

				resultData[destIndex] = data[srcIndex];
				resultData[destIndex + 1] = data[srcIndex + 1];
				resultData[destIndex + 2] = data[srcIndex + 2];
				resultData[destIndex + 3] = data[srcIndex + 3];
			}
		}

		return result;
	}

	// 90 or 270 degree rotation: swap dimensions
	const result = new ImageData(height, width);
	const resultData = result.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const srcIndex = (y * width + x) * 4;
			let destX: number, destY: number;

			if (normalizedDegrees === 90) {
				// Rotate 90 degrees clockwise
				destX = height - 1 - y;
				destY = x;
			} else {
				// Rotate 270 degrees clockwise (90 counter-clockwise)
				destX = y;
				destY = width - 1 - x;
			}

			const destIndex = (destY * height + destX) * 4;

			resultData[destIndex] = data[srcIndex];
			resultData[destIndex + 1] = data[srcIndex + 1];
			resultData[destIndex + 2] = data[srcIndex + 2];
			resultData[destIndex + 3] = data[srcIndex + 3];
		}
	}

	return result;
}

/**
 * Rotates an image by an arbitrary angle using bilinear interpolation.
 * Calculates new dimensions to contain the full rotated image.
 * Empty areas are filled with the specified background color.
 *
 * @param imageData - Source image data to rotate
 * @param degrees - Rotation angle in degrees (can be any value)
 * @param backgroundColor - RGBA values for empty areas (default: white [255, 255, 255, 255])
 * @returns New ImageData with rotated pixels and expanded dimensions
 *
 * @example
 * const rotated = rotateArbitrary(imageData, 45, [255, 0, 0, 255]);
 * // Returns image rotated 45 degrees with red background
 */
export function rotateArbitrary(
	imageData: ImageData,
	degrees: number,
	backgroundColor: [number, number, number, number] = [255, 255, 255, 255],
): ImageData {
	const { width, height, data } = imageData;

	// Convert to radians
	const radians = (degrees * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);

	// Calculate new dimensions to contain the rotated image
	const corners = [
		{ x: 0, y: 0 },
		{ x: width, y: 0 },
		{ x: width, y: height },
		{ x: 0, y: height },
	];

	const centerX = width / 2;
	const centerY = height / 2;

	const rotatedCorners = corners.map((c) => ({
		x: cos * (c.x - centerX) - sin * (c.y - centerY) + centerX,
		y: sin * (c.x - centerX) + cos * (c.y - centerY) + centerY,
	}));

	const minX = Math.min(...rotatedCorners.map((c) => c.x));
	const maxX = Math.max(...rotatedCorners.map((c) => c.x));
	const minY = Math.min(...rotatedCorners.map((c) => c.y));
	const maxY = Math.max(...rotatedCorners.map((c) => c.y));

	const newWidth = Math.ceil(maxX - minX);
	const newHeight = Math.ceil(maxY - minY);

	const result = new ImageData(newWidth, newHeight);
	const resultData = result.data;

	// Fill with background color
	for (let i = 0; i < resultData.length; i += 4) {
		resultData[i] = backgroundColor[0];
		resultData[i + 1] = backgroundColor[1];
		resultData[i + 2] = backgroundColor[2];
		resultData[i + 3] = backgroundColor[3];
	}

	const newCenterX = newWidth / 2;
	const newCenterY = newHeight / 2;

	// Reverse rotation for each destination pixel
	for (let y = 0; y < newHeight; y++) {
		for (let x = 0; x < newWidth; x++) {
			// Translate to center, rotate backwards, translate back
			const dx = x - newCenterX;
			const dy = y - newCenterY;

			const srcX = cos * dx + sin * dy + centerX;
			const srcY = -sin * dx + cos * dy + centerY;

			if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
				// Bilinear interpolation
				const x0 = Math.floor(srcX);
				const y0 = Math.floor(srcY);
				const x1 = Math.min(x0 + 1, width - 1);
				const y1 = Math.min(y0 + 1, height - 1);

				const fx = srcX - x0;
				const fy = srcY - y0;

				const destIndex = (y * newWidth + x) * 4;

				for (let c = 0; c < 4; c++) {
					const v00 = data[(y0 * width + x0) * 4 + c];
					const v10 = data[(y0 * width + x1) * 4 + c];
					const v01 = data[(y1 * width + x0) * 4 + c];
					const v11 = data[(y1 * width + x1) * 4 + c];

					const value = v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;

					resultData[destIndex + c] = Math.round(value);
				}
			}
		}
	}

	return result;
}

/**
 * Stretches/scales an image by the given factors using bilinear interpolation.
 * Creates a new ImageData with dimensions multiplied by the scale factors.
 * Minimum size is 1x1 pixel.
 *
 * @param imageData - Source image data to stretch
 * @param scaleX - Horizontal scale factor (1.0 = 100%, 2.0 = 200%, etc.)
 * @param scaleY - Vertical scale factor (1.0 = 100%, 2.0 = 200%, etc.)
 * @returns New ImageData with stretched/scaled pixels
 *
 * @example
 * const stretched = stretch(imageData, 2.0, 1.5);
 * // Returns image doubled in width, 1.5x height
 */
export function stretch(imageData: ImageData, scaleX: number, scaleY: number): ImageData {
	const { width, height, data } = imageData;

	const newWidth = Math.max(1, Math.round(width * scaleX));
	const newHeight = Math.max(1, Math.round(height * scaleY));

	const result = new ImageData(newWidth, newHeight);
	const resultData = result.data;

	for (let y = 0; y < newHeight; y++) {
		for (let x = 0; x < newWidth; x++) {
			// Map destination to source using bilinear interpolation
			const srcX = (x / newWidth) * width;
			const srcY = (y / newHeight) * height;

			const x0 = Math.floor(srcX);
			const y0 = Math.floor(srcY);
			const x1 = Math.min(x0 + 1, width - 1);
			const y1 = Math.min(y0 + 1, height - 1);

			const fx = srcX - x0;
			const fy = srcY - y0;

			const destIndex = (y * newWidth + x) * 4;

			for (let c = 0; c < 4; c++) {
				const v00 = data[(y0 * width + x0) * 4 + c];
				const v10 = data[(y0 * width + x1) * 4 + c];
				const v01 = data[(y1 * width + x0) * 4 + c];
				const v11 = data[(y1 * width + x1) * 4 + c];

				const value = v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;

				resultData[destIndex + c] = Math.round(value);
			}
		}
	}

	return result;
}

/**
 * Skews an image by the given angles.
 * Applies shear transformation along X and/or Y axes.
 * Creates expanded canvas to fit skewed image.
 * Empty areas are filled with the specified background color.
 *
 * @param imageData - Source image data to skew
 * @param degreesX - Horizontal skew angle in degrees (positive = skew right)
 * @param degreesY - Vertical skew angle in degrees (positive = skew down)
 * @param backgroundColor - RGBA values for empty areas (default: white [255, 255, 255, 255])
 * @returns New ImageData with skewed pixels and expanded dimensions
 *
 * @example
 * const skewed = skew(imageData, 15, 0, [255, 255, 255, 255]);
 * // Returns image skewed 15 degrees horizontally
 */
export function skew(
	imageData: ImageData,
	degreesX: number,
	degreesY: number,
	backgroundColor: [number, number, number, number] = [255, 255, 255, 255],
): ImageData {
	const { width, height, data } = imageData;

	// Convert to radians and get tangent
	const tanX = Math.tan((degreesX * Math.PI) / 180);
	const tanY = Math.tan((degreesY * Math.PI) / 180);

	// Calculate new dimensions
	const newWidth = Math.ceil(width + Math.abs(tanX) * height);
	const newHeight = Math.ceil(height + Math.abs(tanY) * width);

	const result = new ImageData(newWidth, newHeight);
	const resultData = result.data;

	// Fill with background color
	for (let i = 0; i < resultData.length; i += 4) {
		resultData[i] = backgroundColor[0];
		resultData[i + 1] = backgroundColor[1];
		resultData[i + 2] = backgroundColor[2];
		resultData[i + 3] = backgroundColor[3];
	}

	// Calculate offsets for positive/negative skew
	const offsetX = tanX < 0 ? -tanX * height : 0;
	const offsetY = tanY < 0 ? -tanY * width : 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			// Apply skew transformation
			const newX = Math.round(x + tanX * y + offsetX);
			const newY = Math.round(y + tanY * x + offsetY);

			if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
				const srcIndex = (y * width + x) * 4;
				const destIndex = (newY * newWidth + newX) * 4;

				resultData[destIndex] = data[srcIndex];
				resultData[destIndex + 1] = data[srcIndex + 1];
				resultData[destIndex + 2] = data[srcIndex + 2];
				resultData[destIndex + 3] = data[srcIndex + 3];
			}
		}
	}

	return result;
}

/**
 * Inverts all colors in the image (creates negative).
 * Alpha channel is preserved unchanged.
 * RGB values are inverted: newValue = 255 - oldValue
 *
 * @param imageData - Source image data to invert
 * @returns New ImageData with inverted RGB channels
 *
 * @example
 * const inverted = invertColors(imageData);
 * // White becomes black, red becomes cyan, etc.
 */
export function invertColors(imageData: ImageData): ImageData {
	const { width, height, data } = imageData;
	const result = new ImageData(width, height);
	const resultData = result.data;

	for (let i = 0; i < data.length; i += 4) {
		resultData[i] = 255 - data[i]; // R
		resultData[i + 1] = 255 - data[i + 1]; // G
		resultData[i + 2] = 255 - data[i + 2]; // B
		resultData[i + 3] = data[i + 3]; // A (keep alpha unchanged)
	}

	return result;
}

/**
 * Creates a new ImageData filled with a solid color.
 * Used for clearing canvas or creating blank images.
 *
 * @param width - Width of the resulting image in pixels
 * @param height - Height of the resulting image in pixels
 * @param color - RGBA color values (default: white [255, 255, 255, 255])
 * @returns New ImageData filled with the specified color
 *
 * @example
 * const whiteCanvas = clearToColor(800, 600);
 * const redCanvas = clearToColor(800, 600, [255, 0, 0, 255]);
 */
export function clearToColor(
	width: number,
	height: number,
	color: [number, number, number, number] = [255, 255, 255, 255],
): ImageData {
	const result = new ImageData(width, height);
	const resultData = result.data;

	for (let i = 0; i < resultData.length; i += 4) {
		resultData[i] = color[0];
		resultData[i + 1] = color[1];
		resultData[i + 2] = color[2];
		resultData[i + 3] = color[3];
	}

	return result;
}

/**
 * Applies a transformation to canvas ImageData and returns the result.
 * Helper function for working with canvas contexts.
 * Extracts ImageData, applies transform function, and returns result.
 *
 * @param ctx - Canvas 2D rendering context to extract ImageData from
 * @param transform - Function that transforms ImageData
 * @returns Transformed ImageData
 *
 * @example
 * const flipped = transformCanvas(ctx, flipHorizontal);
 * ctx.putImageData(flipped, 0, 0);
 */
export function transformCanvas(
	ctx: CanvasRenderingContext2D,
	transform: (imageData: ImageData) => ImageData,
): ImageData {
	const canvas = ctx.canvas;
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return transform(imageData);
}

/**
 * Applies transformed ImageData to a canvas, optionally resizing the canvas.
 * If resize is true and dimensions don't match, resizes canvas to fit ImageData.
 * Always puts the ImageData at (0, 0) coordinate.
 *
 * @param ctx - Canvas 2D rendering context to apply ImageData to
 * @param imageData - ImageData to apply to the canvas
 * @param resize - Whether to resize canvas to match ImageData dimensions (default: true)
 * @returns void
 *
 * @example
 * const stretched = stretch(imageData, 2.0, 2.0);
 * applyToCanvas(ctx, stretched, true); // Resizes canvas and applies
 */
export function applyToCanvas(ctx: CanvasRenderingContext2D, imageData: ImageData, resize: boolean = true): void {
	const canvas = ctx.canvas;

	if (resize && (canvas.width !== imageData.width || canvas.height !== imageData.height)) {
		canvas.width = imageData.width;
		canvas.height = imageData.height;
	}

	ctx.putImageData(imageData, 0, 0);
}
