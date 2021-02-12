/**
 * Based on: https://github.com/shaozilee/bmp-js/blob/db2c466ca1869ddc09e4b2143404eb03ecd490db/lib/encoder.js
 * @author shaozilee
 * @author 1j01
 * @license MIT
 *
 * BMP format encoder, encodes 32bit, 24bit, 8bit, 4bit, and 1bit BMP files.
 * Doesn't support compression.
 *
 */

function encodeBMP(imgData, bitsPerPixel = 24) {
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
		rgbTable = res.plte.map((color_entry) => color_entry.est.q.map((component) => Math.round(component * 255)));
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
	view.setInt32(pos, imgData.width, true); pos += 4;
	view.setInt32(pos, -imgData.height, true); pos += 4; // negative indicates rows are stored top to bottom
	view.setUint16(pos, planes, true); pos += 2;
	view.setUint16(pos, bitsPerPixel, true); pos += 2;
	view.setUint32(pos, compressionType, true); pos += 4;
	view.setUint32(pos, pixelDataSize, true); pos += 4;
	view.setInt32(pos, hr, true); pos += 4;
	view.setInt32(pos, vr, true); pos += 4;
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
		for (let x = 0; x < imgData.width;) {
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

	return view.buffer;
}

/**
 * Based on https://github.com/ericandrewlewis/bitmap-js/blob/c33a6137829b18e3420a763ef20bffae874610b3/index.js
 * @author ericandrewlewis
 * @license MIT
 */
function decodeBMP(arrayBuffer) {
	function readBitmapFileHeader(view) {
		if (view.getUint8(0) !== "B".charCodeAt(0) || view.getUint8(1) !== "M".charCodeAt(0)) {
			throw new Error("not a BMP file"); // Note: exact error message is checked for to detect this case
		}
		return {
			filesize: view.getUint32(2, true),
			imageDataOffset: view.getUint32(10, true)
		};
	}

	const dibHeaderLengthToVersionMap = {
		12: "BITMAPCOREHEADER",
		16: "OS22XBITMAPHEADER",
		40: "BITMAPINFOHEADER",
		52: "BITMAPV2INFOHEADER",
		56: "BITMAPV3INFOHEADER",
		64: "OS22XBITMAPHEADER",
		108: "BITMAPV4HEADER",
		124: "BITMAPV5HEADER"
	};

	function readDibHeader(view) {
		const dibHeaderLength = view.getUint32(14, true);
		const header = {};
		header.headerLength = dibHeaderLength;
		header.headerType = dibHeaderLengthToVersionMap[dibHeaderLength];
		header.width = view.getInt32(18, true);
		header.height = view.getInt32(22, true); // Note: negative is used to mean rows go top to bottom instead of bottom to top
		if (header.headerType == "BITMAPCOREHEADER") {
			return header;
		}
		header.bitsPerPixel = view.getUint16(28, true);
		header.compressionType = view.getUint32(30, true);
		if (header.headerType == "OS22XBITMAPHEADER") {
			return header;
		}
		header.bitmapDataSize = view.getUint32(34, true);
		header.numberOfColorsInPalette = view.getUint32(46, true);
		header.numberOfImportantColors = view.getUint32(50, true);
		if (header.headerType == "BITMAPINFOHEADER") {
			return header;
		}
		// There are more data fields in later versions of the dib header.
		// I hear that BITMAPINFOHEADER is the most widely supported
		// header type, so I'm not going to implement them yet.
		return header;
	}

	function readColorTable(view) {
		const dibHeader = readDibHeader(view);
		const colorTable = [];
		const sourceStart = 14 + dibHeader.headerLength;
		const numberOfColorsInPalette = dibHeader.numberOfColorsInPalette || (dibHeader.bitsPerPixel <= 8 ? 2 ** dibHeader.bitsPerPixel : 0);
		for (let i = 0; i < numberOfColorsInPalette; i += 1) {
			colorTable.push({
				r: view.getUint8(sourceStart + i * 4 + 2),
				g: view.getUint8(sourceStart + i * 4 + 1),
				b: view.getUint8(sourceStart + i * 4 + 0),
			});
		}
		return colorTable;
	}

	const view = new DataView(arrayBuffer);
	const fileHeader = readBitmapFileHeader(view);
	const dibHeader = readDibHeader(view);
	// const imageDataLength = dibHeader.bitmapDataSize;
	// const imageDataOffset = fileHeader.imageDataOffset;
	const colorTable = readColorTable(view);
	// view.copy(imageData, 0, imageDataOffset);
	const width = Math.abs(fileHeader.width);
	const height = Math.abs(fileHeader.height); // negative is used to mean rows go top to bottom instead of bottom to top
	// const imageData = new ImageData(width, height);
	// const pixelRowSize = Math.ceil(width * dibHeader.bitsPerPixel / 8 / 4) * 4;
	// for (let y = 0; y < height; y += 1) {
	// 	for (let x = 0; x < width; x += 1) {
	// 		const byte = view.readUint8(y * pixelRowSize + x * dibHeader.bitsPerPixel / 8);
	// 		imageData.data[y * height * 4 + 0,1,2,3] = ...;
	// 	}
	// }
	return {
		// width,
		// height,
		// fileHeader,
		// dibHeader,
		// imageData,
		colorTable,
		bitsPerPixel: dibHeader.bitsPerPixel,
	};
}
