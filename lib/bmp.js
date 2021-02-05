/**
 * based on: https://github.com/shaozilee/bmp-js/blob/db2c466ca1869ddc09e4b2143404eb03ecd490db/lib/encoder.js
 * @author shaozilee
 *
 * BMP format encoder, encode 24bit BMP
 * Not supporting compression
 *
 */

function encodeBMP(imgData, bitsPerPixel = 24) {
	if (![/*1, 4, 8,*/ 24].includes(bitsPerPixel)) {
		throw new Error(`not supported: ${bitsPerPixel} bits per pixel`)
	}
	const paddingBytes = imgData.width % 4;
	const rowBytes = 3 * imgData.width + paddingBytes;
	const rgbSize = imgData.height * rowBytes;
	const headerInfoSize = 40;

	const flag = "BM";
	const offset = 54;
	const fileSize = rgbSize + offset;
	const planes = 1;
	const compressionType = 0;
	const hr = 0;
	const vr = 0;
	const colors = 0;
	const importantColors = 0;

	const fileArrayBuffer = new ArrayBuffer(fileSize);
	const view = new DataView(fileArrayBuffer);
	let pos = 0;
	view.setUint8(pos, flag.charCodeAt(0)); pos += 1;
	view.setUint8(pos, flag.charCodeAt(1)); pos += 1;
	view.setUint32(pos, fileSize, true); pos += 4;
	pos += 4; // reserved
	view.setUint32(pos, offset, true); pos += 4;

	view.setUint32(pos, headerInfoSize, true); pos += 4;
	view.setUint32(pos, imgData.width, true); pos += 4;
	view.setInt32(pos, -imgData.height, true); pos += 4; // negative indicates rows are stored top to bottom
	view.setUint16(pos, planes, true); pos += 2;
	view.setUint16(pos, bitsPerPixel, true); pos += 2;
	view.setUint32(pos, compressionType, true); pos += 4;
	view.setUint32(pos, rgbSize, true); pos += 4;
	view.setUint32(pos, hr, true); pos += 4;
	view.setUint32(pos, vr, true); pos += 4;
	view.setUint32(pos, colors, true); pos += 4;
	view.setUint32(pos, importantColors, true); pos += 4;

	let i = 0;
	for (let y = 0; y < imgData.height; y++) {
		for (let x = 0; x < imgData.width; x++) {
			const pixelPos = pos + y * rowBytes + x * 3;
			view.setUint8(pixelPos + 2, imgData.data[i++]); // red
			view.setUint8(pixelPos + 1, imgData.data[i++]); // green
			view.setUint8(pixelPos, imgData.data[i++]); // blue
			i++; // skip alpha
		}
	}

	return view;
}
