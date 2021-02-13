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

		open_from_file(file, callback, canceled);
	});
};

// Only support 24bpp BMP files because the electron save dialog doesn't allow you to access the selected file type,
// you can only guess it from the file extension the user types.
const get_electron_app_supported_image_formats = ()=> image_formats.filter((format)=>
	format.extensions.includes("bmp") ? format.mimeType.indexOf("bpp=24") > -1 : true
);

const get_image_format_from_extension = (file_path_or_name_or_ext)=> {
	const ext_match = file_path_or_name_or_ext.match(/\.([^.]+)$/);
	const ext = ext_match ? ext_match[1].toLowerCase() : file_path_or_name_or_ext; // excluding dot
	for (const image_format of get_electron_app_supported_image_formats()) {
		if (image_format.extensions.includes(ext)) {
			return image_format;
		}
	}
};

window.save_to_file_path = (canvas, filePath, savedCallback, updateFromSaved=true) => {
	const extension = (filePath.indexOf(/\./) > -1) && filePath.split(/\./g).pop().toLowerCase();
	if (!extension) {
		// @TODO: Linux/Unix?? you're not supposed to need file extensions
		return show_error_message("Missing file extension - Try adding .png to the end of the file name");
	}
	const format = get_image_format_from_extension(filePath);
	if (!format) {
		return show_error_message(`Can't save as *.${extension} - Try adding .png to the end of the file name`);
	}
	write_image_file(canvas, format.mimeType, (blob) => {
		blob_to_buffer(blob, (err, buffer) => {
			if (err) {
				return show_error_message(localize("Failed to save document."), err);
			}
			fs.writeFile(filePath, buffer, err => {
				if (err) {
					return show_error_message(localize("Failed to save document."), err);
				}
				const fileName = path.basename(filePath);
				savedCallback(filePath, fileName, format.mimeType);
				if (updateFromSaved) {
					update_from_saved_file(blob);
				}
			});
		});
	});
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
window.systemSaveCanvasAs = (canvas, suggestedFileName, savedCallback, updateFromSaved=true) => {

	// First filter in filters list determines default selected file type.
	// @TODO: default to existing extension, except it would be awkward to rearrange the list...
	// const suggestedExtension = get_file_extension(suggestedFileName);
	const filters = get_electron_app_supported_image_formats().map(({name, extensions})=> ({name, extensions}));

	// @TODO: pass BrowserWindow to make dialog modal?
	// @TODO: should suggestedFileName be sanitized in some way?
	dialog.showSaveDialog({
		defaultPath: suggestedFileName,
		filters,
	}, filePath => {
		if(!filePath){
			return; // user canceled
		}
		save_to_file_path(canvas, filePath, savedCallback, updateFromSaved);
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

	const file_reader = new FileReader();
	file_reader.onloadend = () => {
		const buffer = Buffer.from(file_reader.result);
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
	};
	file_reader.onerror = () => {
		throw new Error("Failed to read canvas image to array buffer");
	};
	wallpaperCanvas.toBlob(blob => {
		sanity_check_blob(blob, () => {
			file_reader.readAsArrayBuffer(blob);
		});
	});
};
