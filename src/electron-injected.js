// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// so libraries don't get confused and export to `module` instead of the `window`
global.module = undefined;

const isPackaged = require("electron").remote.app.isPackaged;
const dialog = require("electron").remote.dialog;
const fs = require("fs");
const path = require("path");
const argv = require("electron").remote.process.argv;

// @TODO: let user apply this setting somewhere in the UI (togglable)
// (Note: it would be better to use REG.EXE to apply the change, rather than a .reg file)
// This registry modification changes the right click > Edit option for images in Windows Explorer
const reg_contents = `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\SystemFileAssociations\\image\\shell\\edit\\command]
@="\\"${argv[0].replace(/\\/g, "\\\\")}\\" ${isPackaged ? "" : '\\".\\" '}\\"%1\\""
`; // oof that's a lot of escaping \\
const reg_file_path = path.join(isPackaged ? path.dirname(argv[0]) : ".", `set-jspaint${isPackaged ? "" : "-DEV-MODE"}-as-default-image-editor.reg`);
if(process.platform == "win32" && isPackaged){
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
	if (isPackaged) { // in production, "path/to/JS Paint.exe" "maybe/a/file.png"
		window.initial_system_file_handle = argv[1];
	} else { // in development, "path/to/electron.exe" "." "maybe/a/file.png"
		window.initial_system_file_handle = argv[2];
	}
}

function write_blob_to_file_path(filePath, blob, savedCallback) {
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
}

window.systemHooks = window.systemHooks || {};
window.systemHooks.showSaveFileDialog = async ({ formats, defaultFileName, defaultPath, defaultFileFormatID, getBlob, savedCallbackUnreliable }) => {
	
	// First filter in filters list determines default selected file type.
	// @TODO: default to existing extension, except it would be awkward to rearrange the list...
	// const suggestedExtension = get_file_extension(defaultFileName);

	// We can't get the selected file type, so show only a set of formats
	// that can be accessed uniquely by their file extensions
	formats = formats_unique_per_file_extension(formats);

	const filters = formats.map(({ name, extensions }) => ({ name, extensions }));

	// @TODO: pass BrowserWindow to make dialog modal?
	// @TODO: should defaultFileName/defaultPath be sanitized in some way?
	let filePath, canceled;
	try {
		({filePath, canceled} = await dialog.showSaveDialog({
			defaultPath: defaultPath || path.basename(defaultFileName),
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
	
	write_blob_to_file_path(filePath, blob, ()=> {
		savedCallbackUnreliable && savedCallbackUnreliable({
			newFileName: path.basename(filePath),
			newFileFormatID: format.mimeType,
			newFileHandle: filePath,
			newBlob: blob,
		});
	});
};
window.systemHooks.showOpenFileDialog = async ({ formats, defaultPath }) => {
	const filters = image_format_categories(formats).map(({ name, extensions }) => ({ name, extensions }));
	const { canceled, filePaths } = await dialog.showOpenDialog({
		filters,
		defaultPath,
	});
	if (canceled) {
		throw new Error("user canceled");
	}
	const filePath = filePaths[0];
	const file = await window.systemHooks.readBlobFromHandle(filePath);
	return { file, fileHandle: filePath };
};

window.systemHooks.writeBlobToHandle = async (filePath, blob) => {
	if (typeof filePath !== "string") {
		return show_error_message("writeBlobToHandle in Electron expects a file path");
		// should it fall back to default writeBlobToHandle?
	}
	await new Promise(resolve => {
		write_blob_to_file_path(filePath, blob, resolve);
	});
};
window.systemHooks.readBlobFromHandle = async (filePath) => {
	if (typeof filePath !== "string") {
		return show_error_message("readBlobFromHandle in Electron expects a file path");
		// should it fall back to default readBlobFromHandle?
	}
	await new Promise((resolve, reject) => {
		fs.readFile(filePath, (err, buffer) => {
			if (err) {
				return reject(err);
			}
			const file = new File([new Uint8Array(buffer)], path.basename(filePath));
			// can't set file.path directly, but we can do this:
			Object.defineProperty(file, 'path', {
				value: filePath,
			});
	
			resolve(file);
		});	
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
