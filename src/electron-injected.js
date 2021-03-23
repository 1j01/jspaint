// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// so libraries don't get confused and export to `module` instead of the `window`
global.module = undefined;

// @TODO: use app.isPackaged instead of electron-is-dev? https://www.electronjs.org/docs/api/app#appispackaged-readonly
// https://github.com/sindresorhus/electron-is-dev#how-is-this-different-than-appispackaged
const is_dev = require("electron-is-dev");
const dialog = require("electron").remote.dialog;
const fs = require("fs");
const path = require("path");
const argv = require("electron").remote.process.argv;

// @TODO: let user apply this setting somewhere in the UI (toggleable)
// (Note: it would be better to use REG.EXE to apply the change, rather than a .reg file)
// This registry modification changes the right click > Edit option for images in Windows Explorer
const reg_contents = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\SystemFileAssociations\\image\\shell\\edit\\command]
@="\\"${argv[0].replace(/\\/g, "\\\\")}\\" ${is_dev ? "\\\".\\\" " : ""}\\"%1\\""
`; // oof that's a lot of escaping \\
const reg_file_path = path.join(is_dev ? "." : path.dirname(argv[0]), `set-jspaint${is_dev ? "-DEV-MODE" : ""}-as-default-image-editor.reg`);
if(process.platform == "win32" && !is_dev){
	fs.writeFile(reg_file_path, reg_contents, (err) => {
		if(err){
			return console.error(err);
		}
	});
}

window.is_electron_app = true;

// @TODO: ideally electron should use FS Access API when it's at parity,
// but I could model a similar thing for security, with opaque file handles
// or just keep track of allowed file paths, only allowing things from dialogs / recent files
// the idea being, don't give the page free reign over the filesystem, in case of XSS holes

if (process.platform == "win32" && argv.length >= 2) {
	if (is_dev) { // in development, "path/to/electron.exe" "." "maybe/a/file.png"
		window.document_file_path_to_open = argv[2];
	} else { // in production, "path/to/JS Paint.exe" "maybe/a/file.png"
		window.document_file_path_to_open = argv[1];
	}
}

window.open_from_file_path = (file_path, callback, canceled) => {
	fs.readFile(file_path, (err, buffer) => {
		if (err) {
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

window.save_to_file_path = (filePath, blob, savedCallback) => {
	blob.arrayBuffer().then((arrayBuffer) => {
		fs.writeFile(filePath, Buffer.from(arrayBuffer), (err) => {
			if (err) {
				return show_error_message(localize("Failed to save document."), err);
			}
			savedCallback();
		});
	}, (error) => {
		show_error_message(localize("Failed to save document."), error);
	});
};

window.systemHooks = window.systemHooks || {};
window.systemHooks.saveFile = async ({ formats, defaultFileName, defaultFileFormatID, getBlob, savedCallbackUnreliable }) => {

	// First filter in filters list determines default selected file type.
	// @TODO: default to existing extension, except it would be awkward to rearrange the list...
	// const suggestedExtension = get_file_extension(defaultFileName);

	// We can't get the selected file type, so show only a set of formats
	// that can be accessed by their unique file extensions
	formats = formats_unique_per_file_extension(formats);

	const filters = formats.map(({ name, extensions }) => ({ name, extensions }));

	// @TODO: pass BrowserWindow to make dialog modal?
	// @TODO: should defaultFileName be sanitized in some way?
	// @TODO: defaultPath full, not just file name
	let filePath, canceled;
	try {
		({filePath, canceled} = await dialog.showSaveDialog({
			defaultPath: path.basename(defaultFileName),
			filters,
		}));
	} catch (error) {
		show_error_message(localize("Failed to save document."), error);
	}
	if (canceled) {
		return;
	}

	const extension = (filePath.indexOf(".") > -1) && filePath.split(/\./g).pop().toLowerCase();
	if (!extension) {
		// @TODO: Linux/Unix?? you're not supposed to need file extensions
		// should it use defaultFileFormatID?
		return show_error_message("Missing file extension - Try adding .png to the end of the file name");
	}
	const format = get_format_from_extension(formats, filePath);
	if (!format) {
		return show_error_message(`Can't save as *.${extension} - Try adding .png to the end of the file name`);
	}
	const blob = await getBlob(format.mimeType);
	
	// @TODO: DRY
	blob.arrayBuffer().then((arrayBuffer) => {
		fs.writeFile(filePath, Buffer.from(arrayBuffer), (error) => {
			if (error) {
				return show_error_message(localize("Failed to save document."), error);
			}
			savedCallbackUnreliable && savedCallbackUnreliable({
				newFileName: path.basename(filePath),
				newFileType: format.mimeType,
				newFilePath: filePath,
				newBlob: blob,
			});
		});
	}, (error) => {
		show_error_message(localize("Failed to save document."), error);
	});
};

window.systemHooks.setWallpaperCentered = (canvas) => {
	const dataPath = require('electron').remote.app.getPath("userData");

	const imgPath = require("path").join(dataPath, "bg.png");
	const fs = require("fs");
	const wallpaper = require("wallpaper");

	// @TODO: implement centered option for Windows and Linux in https://www.npmjs.com/package/wallpaper
	// currently it's only supported on macOS
	let wallpaperCanvas;
	if (process.platform === "darwin") {
		wallpaperCanvas = canvas;
	} else {
		wallpaperCanvas = make_canvas(screen.width, screen.height);
		const x = (screen.width - canvas.width) / 2;
		const y = (screen.height - canvas.height) / 2;
		wallpaperCanvas.ctx.drawImage(canvas, ~~x, ~~y);
	}

	wallpaperCanvas.toBlob(blob => {
		sanity_check_blob(blob, () => {
			blob.arrayBuffer().then((arrayBuffer) => {
				const buffer = Buffer.from(arrayBuffer);
				fs.writeFile(imgPath, Buffer.from(arrayBuffer), error => {
					if (error) {
						return show_error_message("Failed to set as desktop background: couldn't write temporary image file.", error);
					}
					// {scale: "center"} only supported on macOS; see above workaround
					wallpaper.set(imgPath, { scale: "center" }, error => {
						if (error) {
							show_error_message("Failed to set as desktop background!", error);
						}
					});
				});
			}, (error) => {
				show_error_message(localize("Failed to save document."), error);
			});
		});
	});
};
