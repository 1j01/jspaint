// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// so libraries don't get confused and export to `module` instead of the `window`
global.module = undefined;

const is_dev = require("electron-is-dev");
const dialog = require("electron").remote.dialog;
const fs = require("fs");
const path = require("path");
const argv = require("electron").remote.process.argv;

// @TODO: let user apply this setting somewhere in the UI
// (and ideally revert it)
// (Note: it would be better to use REG.EXE to apply the change, rather than a .reg file)
// This registry modification changes the right click > Edit option for images in Windows Explorer
const reg_contents = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\SystemFileAssociations\\image\\shell\\edit\\command]
@="\\"${argv[0].replace(/\\/g, "\\\\")}\\" ${is_dev ? "\\\".\\\" " : ""}\\"%1\\""
`; // oof \\\\
const reg_file_path = path.join(is_dev ? "." : path.dirname(argv[0]), `set-jspaint${is_dev ? "-DEV-MODE" : ""}-as-default-image-editor.reg`);
if(process.platform == "win32" && !is_dev){
	fs.writeFile(reg_file_path, reg_contents, err => {
		if(err){
			return console.error(err);
		}
	});
}

if (process.platform == "win32" && argv.length >= 2) {
	if (is_dev) { // in development, "path/to/electron.exe" "." "maybe/a/file.png"
		window.document_file_path_to_open = argv[2];
	} else { // in production, "path/to/JS Paint.exe" "maybe/a/file.png"
		window.document_file_path_to_open = argv[1];
	}
}

window.open_from_file_path = (file_path, callback, canceled) => {
	fs.readFile(file_path, (err, buffer) => {
		if(err){
			return callback(err);
		}
		const file = new File([new Uint8Array(buffer)], path.basename(file_path));
		// can't set file.path directly, but we can do this:
		Object.defineProperty(file, 'path', {
			value: file_path,
		});

		open_from_File(file, callback, canceled);
	});
};

window.save_to_file_path = (filePath, formatName, savedCallback) => {
	const mimeType = {
		"JPEG": "image/jpeg",
		"PNG": "image/png",
		"GIF": "image/gif",
		"WebP": "image/webp",
		// "Monochrome Bitmap": "image/bitmap",
		// "16 Color Bitmap": "image/bitmap",
		// "256 Color Bitmap": "image/bitmap",
		// "24-bit Bitmap": "image/bitmap",
	}[formatName];
	if(!mimeType){
		return show_error_message(`Can't save as ${formatName}. Format is not supported.`);
	}
	// if(mimeType === "image/gif"){
	// 	new GIF();
	// }
	canvas.toBlob(blob => {
		// TODO: unify/DRY with magic number checking based sanity_check_blob usage in save_canvas_as
		if(blob.type !== mimeType){
			return show_error_message(`Failed to save as ${formatName} (your browser doesn't support exporting a canvas as "${mimeType}")`);
		}
		sanity_check_blob(blob, () => {
			blob_to_buffer(blob, (err, buffer) => {
				if(err){
					return show_error_message("Failed to save! (Technically, failed to convert a Blob to a Buffer.)", err);
				}
				fs.writeFile(filePath, buffer, err => {
					if(err){
						return show_error_message("Failed to save file!", err);
					}
					const fileName = path.basename(filePath);
					savedCallback(filePath, fileName);
				});
			});
		});
	}, mimeType);
};

function blob_to_buffer(blob, callback) {
	const file_reader = new FileReader();

	file_reader.addEventListener("loadend", () => {
		if (file_reader.error) {
			callback(file_reader.error);
		} else {
			callback(null, Buffer.from(file_reader.result));
		}
	}, false);

	// Read the blob as a typed array.
	file_reader.readAsArrayBuffer(blob);

	return file_reader;
}

// @TODO: window.platform.saveCanvasAs etc. or platformIntegration or system or something
window.systemSaveCanvasAs = (canvas, suggestedFileName, savedCallback) => {
	const getExtension = filePathOrName => {
		const splitByDots = filePathOrName.split(/\./g);
		return splitByDots[splitByDots.length - 1].toLowerCase();
	};
	// @TODO: default to existing extension, except it would be awkward to rearrange the list...
	// const suggestedExtension = getExtension(suggestedFileName);
	const filters = [
		// top one is considered default by electron
		{name: "PNG", extensions: ["png"]},
		// @TODO: enable more formats
		// {name: "Monochrome Bitmap", extensions: ["bmp", "dib"]},
		// {name: "16 Color Bitmap", extensions: ["bmp", "dib"]},
		// {name: "256 Color Bitmap", extensions: ["bmp", "dib"]},
		// {name: "24-bit Bitmap", extensions: ["bmp", "dib"]},
		{name: "JPEG", extensions: ["jpg", "jpeg", "jpe", "jfif"]},
		// {name: "GIF", extensions: ["gif"]},
		// {name: "TIFF", extensions: ["tif", "tiff"]},
		// {name: "PNG", extensions: ["png"]},
		{name: "WebP", extensions: ["webp"]},
	];
	// @TODO: pass BrowserWindow to make dialog modal?
	// @TODO: should suggestedFileName be sanitized in some way?
	dialog.showSaveDialog({
		defaultPath: suggestedFileName,
		filters,
	}, filePath => {
		if(!filePath){
			return; // user canceled
		}
		const extension = getExtension(filePath);
		if(!extension){
			// @TODO: Linux/Unix?? you're not supposed to need file extensions
			return show_error_message("Missing file extension - try adding .png to the file name");
		}
		const formatNameMatched = ((filters.find(({extensions}) => extensions.includes(extension))) || {}).name;
		if(!formatNameMatched){
			return show_error_message(`Can't save as *.${extension} - try adding .png to the file name`);
		}

		save_to_file_path(filePath, formatNameMatched, savedCallback);
	});
};

window.systemSetAsWallpaperCentered = c => {
	const dataPath = require('electron').remote.app.getPath("userData");

	const imgPath = require("path").join(dataPath, "bg.png");
	const fs = require("fs");
	const wallpaper = require("wallpaper");

	// @TODO: implement centered option for Windows and Linux in https://www.npmjs.com/package/wallpaper
	// currently it's only supported on macOS
	let wallpaperCanvas;
	if(process.platform === "darwin"){
		wallpaperCanvas = c;
	}else{
		wallpaperCanvas = make_canvas(screen.width, screen.height);
		const x = (screen.width - c.width) / 2;
		const y = (screen.height - c.height) / 2;
		wallpaperCanvas.ctx.drawImage(c, ~~x, ~~y);
	}

	get_array_buffer_from_canvas(wallpaperCanvas).then(array_buffer => {
		const buffer = new Buffer(array_buffer);
		fs.writeFile(imgPath, buffer, err => {
			if(err){
				return show_error_message("Failed to set as desktop background: couldn't write temporary image file.", err);
			}
			// {scale: "center"} only supported on macOS; see above workaround
			wallpaper.set(imgPath, {scale: "center"}, err => {
				if(err){
					show_error_message("Failed to set as desktop background!", err);
				}
			});
		});
	});
};
