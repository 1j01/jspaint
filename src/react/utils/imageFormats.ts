/**
 * Image format utilities for encoding and decoding various image formats.
 *
 * Supported formats:
 * - PNG: Native canvas support via toDataURL/toBlob
 * - JPEG: Native canvas support via toDataURL/toBlob
 * - BMP: Custom encoder for 24-bit BMPs
 * - GIF: Basic support (no animation)
 *
 * Note: Browser canvas natively supports PNG and JPEG.
 * BMP encoding is implemented manually for compatibility.
 */

export interface ImageFormat {
	formatID: string;
	mimeType: string;
	name: string;
	extensions: string[];
	quality?: number; // For JPEG quality (0-1)
}

/**
 * Available image formats for save/export
 */
export const IMAGE_FORMATS: ImageFormat[] = [
	{
		formatID: "png",
		mimeType: "image/png",
		name: "PNG",
		extensions: ["png"],
	},
	{
		formatID: "jpeg",
		mimeType: "image/jpeg",
		name: "JPEG",
		extensions: ["jpg", "jpeg", "jpe", "jfif"],
		quality: 0.92,
	},
	{
		formatID: "webp",
		mimeType: "image/webp",
		name: "WebP",
		extensions: ["webp"],
		quality: 0.92,
	},
	{
		formatID: "bmp",
		mimeType: "image/bmp",
		name: "24-bit Bitmap",
		extensions: ["bmp", "dib"],
	},
];

/**
 * Get format by extension
 */
export function getFormatByExtension(extension: string): ImageFormat | undefined {
	const ext = extension.toLowerCase().replace(/^\./, "");
	return IMAGE_FORMATS.find((f) => f.extensions.includes(ext));
}

/**
 * Get format by MIME type
 */
export function getFormatByMimeType(mimeType: string): ImageFormat | undefined {
	return IMAGE_FORMATS.find((f) => f.mimeType === mimeType);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	const match = filename.match(/\.([^.]+)$/);
	return match ? match[1].toLowerCase() : "";
}

/**
 * Encode canvas to a specific format and return as Blob
 */
export async function encodeToBlob(
	canvas: HTMLCanvasElement,
	formatId: string,
	quality?: number,
): Promise<Blob> {
	const format = IMAGE_FORMATS.find((f) => f.formatID === formatId);

	if (!format) {
		throw new Error(`Unknown format: ${formatId}`);
	}

	// BMP requires custom encoding
	if (formatId === "bmp") {
		return encodeBMP(canvas);
	}

	// Use native canvas toBlob for other formats
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error(`Failed to encode as ${format.name}`));
				}
			},
			format.mimeType,
			quality ?? format.quality,
		);
	});
}

/**
 * Encode canvas to a specific format and return as data URL
 */
export function encodeToDataURL(
	canvas: HTMLCanvasElement,
	formatId: string,
	quality?: number,
): string {
	const format = IMAGE_FORMATS.find((f) => f.formatID === formatId);

	if (!format) {
		throw new Error(`Unknown format: ${formatId}`);
	}

	// BMP requires custom encoding - convert blob to data URL
	if (formatId === "bmp") {
		const blob = encodeBMPSync(canvas);
		return URL.createObjectURL(blob);
	}

	return canvas.toDataURL(format.mimeType, quality ?? format.quality);
}

/**
 * Download canvas as file
 */
export async function downloadCanvas(
	canvas: HTMLCanvasElement,
	filename: string,
	formatId?: string,
): Promise<void> {
	// Determine format from filename or default to PNG
	const extension = getFileExtension(filename);
	const format = formatId
		? IMAGE_FORMATS.find((f) => f.formatID === formatId)
		: getFormatByExtension(extension);

	const finalFormatId = format?.formatID ?? "png";
	const blob = await encodeToBlob(canvas, finalFormatId);

	// Create download link
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Encode canvas as 24-bit BMP
 * BMP format: https://en.wikipedia.org/wiki/BMP_file_format
 */
export function encodeBMP(canvas: HTMLCanvasElement): Promise<Blob> {
	return Promise.resolve(encodeBMPSync(canvas));
}

/**
 * Synchronous BMP encoder
 */
export function encodeBMPSync(canvas: HTMLCanvasElement): Blob {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	const width = canvas.width;
	const height = canvas.height;
	const imageData = ctx.getImageData(0, 0, width, height);

	// BMP files have row padding to 4-byte boundary
	const rowPadding = (4 - ((width * 3) % 4)) % 4;
	const rowSize = width * 3 + rowPadding;
	const pixelDataSize = rowSize * height;

	// File header (14 bytes) + DIB header (40 bytes) + pixel data
	const headerSize = 14 + 40;
	const fileSize = headerSize + pixelDataSize;

	const buffer = new ArrayBuffer(fileSize);
	const view = new DataView(buffer);
	const uint8 = new Uint8Array(buffer);

	let offset = 0;

	// File header (14 bytes)
	// Signature "BM"
	view.setUint8(offset++, 0x42); // 'B'
	view.setUint8(offset++, 0x4d); // 'M'

	// File size (4 bytes, little-endian)
	view.setUint32(offset, fileSize, true);
	offset += 4;

	// Reserved (4 bytes)
	view.setUint32(offset, 0, true);
	offset += 4;

	// Pixel data offset (4 bytes, little-endian)
	view.setUint32(offset, headerSize, true);
	offset += 4;

	// DIB header (BITMAPINFOHEADER - 40 bytes)
	// Header size (4 bytes)
	view.setUint32(offset, 40, true);
	offset += 4;

	// Image width (4 bytes, signed)
	view.setInt32(offset, width, true);
	offset += 4;

	// Image height (4 bytes, signed, positive = bottom-up)
	view.setInt32(offset, height, true);
	offset += 4;

	// Color planes (2 bytes)
	view.setUint16(offset, 1, true);
	offset += 2;

	// Bits per pixel (2 bytes)
	view.setUint16(offset, 24, true);
	offset += 2;

	// Compression method (4 bytes) - 0 = BI_RGB (uncompressed)
	view.setUint32(offset, 0, true);
	offset += 4;

	// Image size (4 bytes) - can be 0 for BI_RGB
	view.setUint32(offset, pixelDataSize, true);
	offset += 4;

	// Horizontal resolution (4 bytes) - pixels per meter
	view.setInt32(offset, 2835, true); // ~72 DPI
	offset += 4;

	// Vertical resolution (4 bytes)
	view.setInt32(offset, 2835, true);
	offset += 4;

	// Colors in palette (4 bytes) - 0 for 24-bit
	view.setUint32(offset, 0, true);
	offset += 4;

	// Important colors (4 bytes) - 0 means all
	view.setUint32(offset, 0, true);
	offset += 4;

	// Pixel data (bottom-up, BGR format)
	const pixels = imageData.data;
	for (let y = height - 1; y >= 0; y--) {
		for (let x = 0; x < width; x++) {
			const srcIndex = (y * width + x) * 4;
			// BMP uses BGR order
			uint8[offset++] = pixels[srcIndex + 2]; // B
			uint8[offset++] = pixels[srcIndex + 1]; // G
			uint8[offset++] = pixels[srcIndex]; // R
		}
		// Add row padding
		for (let p = 0; p < rowPadding; p++) {
			uint8[offset++] = 0;
		}
	}

	return new Blob([buffer], { type: "image/bmp" });
}

/**
 * Decode BMP file to ImageData
 */
export async function decodeBMP(blob: Blob): Promise<ImageData> {
	const buffer = await blob.arrayBuffer();
	const view = new DataView(buffer);

	// Verify BMP signature
	if (view.getUint8(0) !== 0x42 || view.getUint8(1) !== 0x4d) {
		throw new Error("Not a valid BMP file");
	}

	// Get pixel data offset
	const pixelOffset = view.getUint32(10, true);

	// Get image dimensions from DIB header
	const width = view.getInt32(18, true);
	const height = view.getInt32(22, true);
	const bitsPerPixel = view.getUint16(28, true);
	const compression = view.getUint32(30, true);

	// Handle negative height (top-down BMP)
	const isTopDown = height < 0;
	const absHeight = Math.abs(height);

	if (bitsPerPixel !== 24 && bitsPerPixel !== 32) {
		throw new Error(`Unsupported BMP bit depth: ${bitsPerPixel}. Only 24-bit and 32-bit are supported.`);
	}

	if (compression !== 0 && compression !== 3) {
		throw new Error(`Unsupported BMP compression: ${compression}`);
	}

	const bytesPerPixel = bitsPerPixel / 8;
	const rowPadding = (4 - ((width * bytesPerPixel) % 4)) % 4;

	// Create ImageData
	const imageData = new ImageData(width, absHeight);
	const pixels = imageData.data;

	let srcOffset = pixelOffset;
	for (let y = 0; y < absHeight; y++) {
		const destY = isTopDown ? y : absHeight - 1 - y;
		for (let x = 0; x < width; x++) {
			const destIndex = (destY * width + x) * 4;

			if (bitsPerPixel === 24) {
				// BGR order
				pixels[destIndex + 2] = view.getUint8(srcOffset++); // B -> R
				pixels[destIndex + 1] = view.getUint8(srcOffset++); // G -> G
				pixels[destIndex] = view.getUint8(srcOffset++); // R -> B
				pixels[destIndex + 3] = 255; // A
			} else if (bitsPerPixel === 32) {
				// BGRA order
				pixels[destIndex + 2] = view.getUint8(srcOffset++); // B -> R
				pixels[destIndex + 1] = view.getUint8(srcOffset++); // G -> G
				pixels[destIndex] = view.getUint8(srcOffset++); // R -> B
				pixels[destIndex + 3] = view.getUint8(srcOffset++); // A
			}
		}
		srcOffset += rowPadding;
	}

	return imageData;
}

/**
 * Load an image file and return it as ImageData
 * Supports all browser-supported image formats plus BMP
 */
export async function loadImageFile(file: File): Promise<ImageData> {
	// Check if it's a BMP file that might need custom decoding
	if (file.type === "image/bmp" || file.name.toLowerCase().endsWith(".bmp")) {
		try {
			return await decodeBMP(file);
		} catch {
			// Fall through to browser decoding
		}
	}

	// Use browser's native image decoding for other formats
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}
				ctx.drawImage(img, 0, 0);
				const imageData = ctx.getImageData(0, 0, img.width, img.height);
				resolve(imageData);
			};
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = e.target?.result as string;
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}

/**
 * Load image from URL and return as ImageData
 */
export async function loadImageFromURL(url: string): Promise<ImageData> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Failed to get canvas context"));
				return;
			}
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, img.width, img.height);
			resolve(imageData);
		};
		img.onerror = () => reject(new Error("Failed to load image from URL"));
		img.src = url;
	});
}

/**
 * Get accept string for file input
 */
export function getAcceptString(): string {
	const mimeTypes = IMAGE_FORMATS.map((f) => f.mimeType);
	const extensions = IMAGE_FORMATS.flatMap((f) => f.extensions.map((e) => `.${e}`));
	return [...mimeTypes, ...extensions].join(",");
}
