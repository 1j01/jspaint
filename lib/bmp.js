/**
 * based on: https://github.com/shaozilee/bmp-js/blob/db2c466ca1869ddc09e4b2143404eb03ecd490db/lib/encoder.js
 * @author shaozilee
 *
 * BMP format encoder, encode 24bit BMP
 * Not support quality compression
 *
 */

function encodeBMP(imgData, bitsPerPixel = 24) {
	if (bitsPerPixel !== 24) {
		throw new Error("Not implemented: bitsPerPixel other than 24")
	}
	var extraBytes = imgData.width % 4;
	var rgbSize = imgData.height * (3 * imgData.width + extraBytes);
	var headerInfoSize = 40;

	var flag = "BM";
	var reserved = 0;
	var offset = 54;
	var fileSize = rgbSize + offset;
	var planes = 1;
	var compress = 0;
	var hr = 0;
	var vr = 0;
	var colors = 0;
	var importantColors = 0;

	var fileArrayBuffer = new ArrayBuffer(fileSize);
	var view = new DataView(fileArrayBuffer);
	var pos = 0;
	view.setUint8(pos, flag.charCodeAt(0), true); pos += 1;
	view.setUint8(pos, flag.charCodeAt(1), true); pos += 1;
	view.setUint32(pos, fileSize, true); pos += 4;
	view.setUint32(pos, reserved, true); pos += 4;
	view.setUint32(pos, offset, true); pos += 4;

	view.setUint32(pos, headerInfoSize, true); pos += 4;
	view.setUint32(pos, imgData.width, true); pos += 4;
	view.setInt32(pos, -imgData.height, true); pos += 4;
	view.setUint16(pos, planes, true); pos += 2;
	view.setUint16(pos, bitsPerPixel, true); pos += 2;
	view.setUint32(pos, compress, true); pos += 4;
	view.setUint32(pos, rgbSize, true); pos += 4;
	view.setUint32(pos, hr, true); pos += 4;
	view.setUint32(pos, vr, true); pos += 4;
	view.setUint32(pos, colors, true); pos += 4;
	view.setUint32(pos, importantColors, true); pos += 4;

	var i = 0;
	var rowBytes = 3 * imgData.width + extraBytes;

	for (var y = 0; y < imgData.height; y++) {
		for (var x = 0; x < imgData.width; x++) {
			var pixelPos = pos + y * rowBytes + x * 3;
			view.setUint8(pixelPos + 2, imgData.data[i++], true); // red
			view.setUint8(pixelPos + 1, imgData.data[i++], true); // green
			view.setUint8(pixelPos, imgData.data[i++], true); // blue
			i++; // skip alpha
		}
		// if (extraBytes > 0) {
		// 	var fillOffset = pos + y * rowBytes + imgData.width * 3;
		// 	view.fill(0, fillOffset, fillOffset + extraBytes);
		// }
	}

	return view;
}
