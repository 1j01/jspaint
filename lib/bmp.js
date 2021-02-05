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
	const bytesPerPixel = bitsPerPixel / 8; // can be more or less than one
	// Rows are always a multiple of 4 bytes long.
	const pixelRowSize = Math.ceil(imgData.width * bytesPerPixel / 4) * 4;
	const pixelDataSize = imgData.height * pixelRowSize;
	const headerInfoSize = 40;
	const indexed = bitsPerPixel <= 8;
	const maxColorCount = 2 ** bitsPerPixel;

	let rgbTable;
	let indices;
	let colorCount = 0;
	if (indexed) {
		// rgbTable = [];
		// for (const color of palette.slice(0, maxColorCount)) {
		// 	const [r, g, b] = get_rgba_from_color(color);
		// 	rgbTable.push([r, g, b]);
		// }
		const res = UPNG.quantize(imgData.data, maxColorCount);
		indices = res.inds;
		rgbTable = res.plte.map((color_entry)=> color_entry.est.q.map((component)=> Math.round(component * 255)));
		colorCount = rgbTable.length;
	}

	const flag = "BM";
	const planes = 1;
	const compressionType = 0;
	const hr = 0;
	const vr = 0;
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

	if (rgbTable) {
		for (const [r, g, b] of rgbTable) {
			view.setUint8(pos, b); pos += 1;
			view.setUint8(pos, g); pos += 1;
			view.setUint8(pos, r); pos += 1;
			pos += 1;
		}
	}

	const getColorIndex = (imgDataIndex) => {
		return indices[imgDataIndex / 4];
	};

	let i = 0;
	for (let y = 0; y < imgData.height; y += 1) {
		for (let x = 0; x < imgData.width; ) {
			const pixelGroupPos = pos + y * pixelRowSize + x * bytesPerPixel;
			if (bitsPerPixel === 1) {
				let byte = 0;
				for (let j = 0; j < 8 && x + j < imgData.width; j += 1) {
					byte |= getColorIndex(i) << (7 - j);
					i += 4;
				}
				view.setUint8(pixelGroupPos, byte);
				x += 8;
			} else if (bitsPerPixel === 4) {
				let byte = 0;
				for (let j = 0; j < 2 && x + j < imgData.width; j += 1) {
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
				view.setUint8(pixelGroupPos + 2, imgData.data[i + 0]); // red
				view.setUint8(pixelGroupPos + 1, imgData.data[i + 1]); // green
				view.setUint8(pixelGroupPos + 0, imgData.data[i + 2]); // blue
				if (bitsPerPixel === 32) {
					view.setUint8(pixelGroupPos + 3, imgData.data[i + 3]); // alpha
				}
				i += 4;
				x += 1;
			}
		}
	}

	return view;
}
