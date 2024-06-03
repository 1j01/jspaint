// @ts-check
/* global get_direction, localize */

// import { get_direction, localize } from "./app-localization.js";

/** @type {ImageFileFormat[]} */
let image_formats = [];
// const ext_to_image_formats = {}; // there can be multiple with the same extension, e.g. different bit depth BMP files
// const mime_type_to_image_formats = {};
/**
 * @param {string} mime_type
 * @param {string} name_and_exts
 * @param {ImageFileFormat[]} [target_array]
 */
const add_image_format = (mime_type, name_and_exts, target_array = image_formats) => {
	// Note: some localizations have commas instead of semicolons to separate file extensions
	// Assumption: file extensions are never localized
	const format = {
		formatID: mime_type,
		mimeType: mime_type,
		name: localize(name_and_exts).replace(/\s+\([^(]+$/, ""),
		nameWithExtensions: localize(name_and_exts),
		extensions: [],
	};
	const ext_regexp = /\*\.([^);,]+)/g;
	if (get_direction() === "rtl") {
		const rlm = "\u200F";
		const lrm = "\u200E";
		format.nameWithExtensions = format.nameWithExtensions.replace(ext_regexp, `${rlm}*.${lrm}$1${rlm}`);
	}
	let match;
	// eslint-disable-next-line no-cond-assign
	while (match = ext_regexp.exec(name_and_exts)) {
		const ext = match[1];
		// ext_to_image_formats[ext] = ext_to_image_formats[ext] || [];
		// ext_to_image_formats[ext].push(format);
		// mime_type_to_image_formats[mime_type] = mime_type_to_image_formats[mime_type] || [];
		// mime_type_to_image_formats[mime_type].push(format);
		format.extensions.push(ext);
	}

	target_array.push(format);
};
// First file extension in a parenthetical defines default for the format.
// Strings are localized in add_image_format, don't need localize() here.
add_image_format("image/png", "PNG (*.png)");
add_image_format("image/webp", "WebP (*.webp)");
add_image_format("image/gif", "GIF (*.gif)");
add_image_format("image/tiff", "TIFF (*.tif;*.tiff)");
add_image_format("image/jpeg", "JPEG (*.jpg;*.jpeg;*.jpe;*.jfif)");
add_image_format("image/x-bmp-1bpp", "Monochrome Bitmap (*.bmp;*.dib)");
add_image_format("image/x-bmp-4bpp", "16 Color Bitmap (*.bmp;*.dib)");
add_image_format("image/x-bmp-8bpp", "256 Color Bitmap (*.bmp;*.dib)");
add_image_format("image/bmp", "24-bit Bitmap (*.bmp;*.dib)");
// add_image_format("image/x-bmp-32bpp", "32-bit Transparent Bitmap (*.bmp;*.dib)");

/**
 * Filter to only support 24bpp BMP files for File System Access API and Electron save dialog,
 * as these APIs don't allow you to access the selected file type.
 * You can only guess it from the file extension the user types.
 * @template {FileFormat} T
 * @param {T[]} formats
 * @returns {T[]}
 */
const formats_unique_per_file_extension = (formats) => {
	// first handle BMP format specifically to make sure the 24-bpp is the selected BMP format
	formats = formats.filter((format) =>
		format.extensions.includes("bmp") ? (/**@type {ImageFileFormat}*/(format).mimeType === "image/bmp") : true
	);
	// then generally uniquify on extensions
	// (this could be overzealous in case of partial overlap in extensions of different formats,
	// but in general it needs special care anyways, to decide which format should win)
	// This can't be simply chained with the above because it needs to use the intermediate, partially filtered formats array.
	return formats.filter((format, format_index) =>
		!format.extensions.some((extension) =>
			formats.some((other_format, other_format_index) =>
				other_format_index < format_index &&
				other_format.extensions.includes(extension)
			)
		)
	);
};

// For the Open dialog, show more general format categories, like "Bitmap Files", maybe "Icon Files", etc.
// @TODO: probably need to do this differently for showOpenFilePicker...
/*
const image_format_categories = (image_formats) => {
	image_formats = image_formats.filter((format) =>
		!format.extensions.includes("bmp")
	);
	add_image_format("image/bmp", localize("Bitmap Files (*.bmp)").replace("(*.bmp)", "(*.bmp;*.dib)"), image_formats);
	// add_image_format("", "Icon Files (*.ico;*.cur;*.ani;*.icns)", image_formats);
	// add_image_format("", "All Picture Files", image_formats);
	// add_image_format("", "All Files", image_formats);
	image_formats.push({
		// TODO: we don't treat formatID and mimeType interchangeably, do we?
		formatID: "IMAGE_FILES",
		mimeType: "image/*", // but also application/pdf, not included here, but hopefully the mime type isn't what we go off of (I don't remember)
		name: localize("All Picture Files"),
		nameWithExtensions: localize("All Picture Files"),
		extensions: image_formats.map((format) => format.extensions).flat(),
	});
	image_formats.push({
		formatID: "ALL_FILES",
		mimeType: "*" + "/*",
		name: localize("All Files"),
		nameWithExtensions: localize("All Files"),
		extensions: ["*"], // Note: no other wildcard is allowed in the extension list
	});
	return image_formats;
};
*/

/** @type {PaletteFileFormat[]} */
const palette_formats = [];
for (const [format_id, format] of Object.entries(AnyPalette.formats)) {
	if (format.write) {
		const inside_parens = format.fileExtensions.map((extension) => `*.${extension}`).join(";");
		palette_formats.push({
			formatID: format_id,
			name: format.name,
			nameWithExtensions: `${format.name} (${inside_parens})`,
			extensions: format.fileExtensions,
		});
	}
}
palette_formats.sort((a, b) =>
	// Order important formats first, starting with RIFF PAL format:
	+(b.formatID === "RIFF_PALETTE") - +(a.formatID === "RIFF_PALETTE") ||
	+(b.formatID === "GIMP_PALETTE") - +(a.formatID === "GIMP_PALETTE") ||
	0
);

export { formats_unique_per_file_extension, image_formats, palette_formats };
// Temporary globals until all dependent code is converted to ES Modules
window.formats_unique_per_file_extension = formats_unique_per_file_extension; // used by electron-injected.js
