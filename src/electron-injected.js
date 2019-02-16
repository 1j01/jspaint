// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// so libraries don't get confused and export to `module` instead of the `window`
global.module = undefined;

var dialog = require("electron").remote.dialog;
var fs = require("fs");
// TODO: window.platform.saveCanvasAs etc. or platformIntegration or system or something
window.systemSaveCanvasAs = function(canvas, fileName, savedCallback){
	var getExtension = function(filePathOrName){
		var splitByDots = filePathOrName.split(/\./g);
		return splitByDots[splitByDots.length - 1].toLowerCase();
	};
	var extension = getExtension(fileName);
	var filters = [
		// top one is considered default by electron
		{name: "PNG", extensions: ["png"]},
		// TODO: enable more formats
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
	// TODO: pass BrowserWindow to make dialog modal?
	// TODO: pass defaultPath of last opened file (w/ different file name)?
	// also maybe sanitize fileName?
	dialog.showSaveDialog({
		defaultPath: fileName,
		filters: filters,
	}, function(filePath) {
		if(!filePath){
			return; // user canceled
		}
		var extension = getExtension(filePath);
		if(!extension){
			// TODO: Linux/Unix?? you're not supposed to need file extensions
			return show_error_message("Missing file extension - try adding .png to the file name");
		}
		var typeNameMatched = ((filters.find(function(filter){return filter.extensions.indexOf(extension) > -1})) || {}).name;
		if(!typeNameMatched){
			return show_error_message("Can't save as *." +extension + " - try adding .png to the file name");
		}

		var mimeType = {
			"JPEG": "image/jpeg",
			"PNG": "image/png",
			"GIF": "image/gif",
			"WebP": "image/webp",
			// "Monochrome Bitmap": "image/bitmap",
			// "16 Color Bitmap": "image/bitmap",
			// "256 Color Bitmap": "image/bitmap",
			// "24-bit Bitmap": "image/bitmap",
		}[typeNameMatched];
		if(!mimeType){
			return show_error_message("Can't save as " + typeNameMatched + ". Format is not supported.");
		}
		// if(mimeType === "image/gif"){
		// 	new GIF();
		// }
		canvas.toBlob(function(blob){
			if(blob.type !== mimeType){
				return show_error_message("Failed to save as " + typeNameMatched + " (your browser doesn't support exporting a canvas as \"" + mimeType + "\")");
			}
			sanity_check_blob(blob, function(){
				blob_to_buffer(blob, function(err, buffer){
					if(err){
						return show_error_message("Failed to save! (Technically, failed to convert a Blob to a Buffer.)", err);
					}
					fs.writeFile(filePath, buffer, function(err){
						if(err){
							return show_error_message("Failed to save file!", err);
						}
						savedCallback();
					});
				});
			});
		}, mimeType);
	});
};

window.systemSetAsWallpaperCentered = function(c){
	var dataPath = require('electron').remote.app.getPath("userData");

	var imgPath = require("path").join(dataPath, "bg.png");
	var fs = require("fs");
	var wallpaper = require("wallpaper");

	// TODO: implement centered option for Windows and Linux in https://www.npmjs.com/package/wallpaper
	// currently it's only supported on macOS
	if(process.platform === "darwin"){
		var wallpaperCanvas = c;
	}else{
		var wallpaperCanvas = new Canvas(screen.width, screen.height);
		var x = (screen.width - c.width) / 2;
		var y = (screen.height - c.height) / 2;
		wallpaperCanvas.ctx.drawImage(c, ~~x, ~~y);
	}

	get_array_buffer_from_canvas(wallpaperCanvas).then(function(array_buffer){
		var buffer = new Buffer(array_buffer);
		fs.writeFile(imgPath, buffer, function(err){
			if(err){
				return show_error_message("Failed to set as desktop background: couldn't write temporary image file.", err);
			}
			// {scale: "center"} only supported on macOS; see above workaround
			wallpaper.set(imgPath, {scale: "center"}, function(err){
				if(err){
					show_error_message("Failed to set as desktop background!", err);
				}
			});
		});
	});
};
