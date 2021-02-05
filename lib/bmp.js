/**
 * based on: https://github.com/shaozilee/bmp-js/blob/db2c466ca1869ddc09e4b2143404eb03ecd490db/lib/encoder.js
 * @author shaozilee
 * @author 1j01
 *
 * BMP format encoder, encodes 32bit, 24bit, 8bit, 4bit, and 1bit BMP files.
 * Doesn't support compression.
 *
 */

function encodeBMP(imgData, bitsPerPixel = 24, palette) {
	if (![1, 4, 8, 24, 32].includes(bitsPerPixel)) {
		throw new Error(`not supported: ${bitsPerPixel} bits per pixel`)
	}
	// Rows are always a multiple of 4 bytes long.
	const pixelRowSize = Math.ceil((bitsPerPixel / 8 * imgData.width) / 4) * 4;
	const pixelDataSize = imgData.height * pixelRowSize;
	const headerInfoSize = 40;
	const indexed = bitsPerPixel <= 8;

	const flag = "BM";
	const planes = 1;
	const compressionType = 0;
	const hr = 0;
	const vr = 0;
	const colorCount = indexed ? Math.min(palette.length, 2 ** bitsPerPixel) : 0;
	const importantColorCount = 0; // 0 means all colors are important

	const colorTableSize = colorCount * 4;
	const offsetToPixelData = 54 + colorTableSize;
	const fileSize = pixelDataSize + offsetToPixelData;

	const fileArrayBuffer = new ArrayBuffer(fileSize);
	const view = new DataView(fileArrayBuffer);
	let pos = 0;
	// BMP header
	view.setUint8(pos, flag.charCodeAt(0)); pos += 1;
	view.setUint8(pos, flag.charCodeAt(1)); pos += 1;
	view.setUint32(pos, fileSize, true); pos += 4;
	pos += 4; // reserved
	view.setUint32(pos, offsetToPixelData, true); pos += 4;
	// DIB header
	view.setUint32(pos, headerInfoSize, true); pos += 4;
	view.setUint32(pos, imgData.width, true); pos += 4;
	view.setInt32(pos, -imgData.height, true); pos += 4; // negative indicates rows are stored top to bottom
	view.setUint16(pos, planes, true); pos += 2;
	view.setUint16(pos, bitsPerPixel, true); pos += 2;
	view.setUint32(pos, compressionType, true); pos += 4;
	view.setUint32(pos, pixelDataSize, true); pos += 4;
	view.setUint32(pos, hr, true); pos += 4;
	view.setUint32(pos, vr, true); pos += 4;
	view.setUint32(pos, colorCount, true); pos += 4;
	view.setUint32(pos, importantColorCount, true); pos += 4;

	const rgb_table = [];
	if (indexed) {
		for (const color of palette.slice(0, colorCount)) {
			const [r, g, b] = get_rgba_from_color(color);
			rgb_table.push([r, g, b]);
			view.setUint8(pos, b); pos += 1;
			view.setUint8(pos, g); pos += 1;
			view.setUint8(pos, r); pos += 1;
			pos += 1;
		}
	}

	const getColorIndex = (imgDataIndex) => {
		const r = imgData.data[imgDataIndex + 0];
		const g = imgData.data[imgDataIndex + 1];
		const b = imgData.data[imgDataIndex + 2];
		for (let i = 0; i < rgb_table.length; i++) {
			if (
				Math.abs(r - rgb_table[i][0]) < 5 &&
				Math.abs(g - rgb_table[i][1]) < 5 &&
				Math.abs(b - rgb_table[i][2]) < 5
			) {
				return i;
			}
		}
		return 0;
	};

	let i = 0;
	for (let y = 0; y < imgData.height; y++) {
		for (let x = 0; x < imgData.width; ) {
			const pixelGroupPos = pos + y * pixelRowSize + x / 8 * bitsPerPixel;
			if (bitsPerPixel === 1) {
				let byte = 0;
				for (let j = 0; j < 8 && x + j < imgData.width; j++) {
					byte |= getColorIndex(i) << (7 - j);
					i += 4;
				}
				view.setUint8(pixelGroupPos, byte);
				x += 8;
			} else if (bitsPerPixel === 4) {
				let byte = 0;
				for (let j = 0; j < 2 && x + j < imgData.width; j++) {
					byte |= getColorIndex(i) << (4 * (1 - j));
					i += 4;
				}
				view.setUint8(pixelGroupPos, byte);
				x += 2;
			} else if (bitsPerPixel === 8) {
				view.setUint8(pixelGroupPos, getColorIndex(i));
				i += 4;
				x += 1;
			} else {
				view.setUint8(pixelGroupPos + 2, imgData.data[i++]); // red
				view.setUint8(pixelGroupPos + 1, imgData.data[i++]); // green
				view.setUint8(pixelGroupPos, imgData.data[i++]); // blue
				if (bitsPerPixel === 32) {
					view.setUint8(pixelGroupPos + 3, imgData.data[i++]); // alpha
				} else {
					i++; // skip alpha
				}
				x += 1;
			}
		}
	}

	return view;
}
