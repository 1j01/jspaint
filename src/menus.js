// @ts-check
/* global tool_transparent_mode:writable, palette:writable */
/* global $canvas_area, $colorbox, $status_area, $toolbox, available_languages, get_iso_language_name, get_language, get_language_emoji, get_language_endonym, localize, magnification, main_canvas, menu_bar, MENU_DIVIDER, redos, selection, set_language, show_grid, show_thumbnail, systemHooks, undos */
// import { available_languages, get_iso_language_name, get_language, get_language_emoji, get_language_endonym, localize, set_language } from "./app-localization.js";
import { show_edit_colors_window } from "./edit-colors.js";
import { palette_formats } from "./file-format-data.js";
import { are_you_sure, change_url_param, choose_file_to_paste, clear, delete_selection, deselect, edit_copy, edit_cut, edit_paste, file_load_from_url, file_new, file_open, file_print, file_save, file_save_as, image_attributes, image_flip_and_rotate, image_invert_colors, image_stretch_and_skew, redo, render_history_as_gif, sanity_check_blob, save_selection_to_file, select_all, set_magnification, show_about_paint, show_custom_zoom_window, show_document_history, show_file_format_errors, show_multi_user_setup_dialog, show_news, toggle_grid, toggle_thumbnail, undo, view_bitmap } from "./functions.js";
import { show_help } from "./help.js";
import { $G, get_rgba_from_color, is_discord_embed } from "./helpers.js";
import { show_imgur_uploader } from "./imgur.js";
import { manage_storage } from "./manage-storage.js";
import { showMessageBox } from "./msgbox.js";
import { simulateRandomGesturesPeriodically, simulatingGestures, stopSimulatingGestures } from "./simulate-random-gestures.js";
import { speech_recognition_active, speech_recognition_available } from "./speech-recognition.js";
import { get_theme, set_theme } from "./theme.js";

const looksLikeChrome = !!(window.chrome && (window.chrome.loadTimes || window.chrome.csi));
// NOTE: Microsoft Edge includes window.chrome.app
// (also this browser detection logic could likely use some more nuance)

/** @type {OSGUITopLevelMenus} */
const menus = {
	[localize("&File")]: [
		{
			label: localize("&New"),
			...shortcut(window.is_electron_app ? "Ctrl+N" : "Ctrl+Alt+N"), // Ctrl+N opens a new browser window
			speech_recognition: [
				"new", "new file", "new document", "create new document", "create a new document", "start new document", "start a new document",
			],
			action: () => { file_new(); },
			description: localize("Creates a new document."),
		},
		{
			label: localize("&Open"),
			...shortcut("Ctrl+O"),
			speech_recognition: [
				"open", "open document", "open file", "open an image file", "open a document", "open a file",
				"load document", "load a document", "load an image file", "load an image",
				"show file picker", "show file chooser", "show file browser", "show finder",
				"browser for file", "browse for a file", "browse for an image", "browse for an image file",
			],
			action: () => { file_open(); },
			description: localize("Opens an existing document."),
		},
		{
			label: localize("&Save"),
			...shortcut("Ctrl+S"),
			speech_recognition: [
				"save", "save document", "save file", "save image", "save picture", "save image file",
				// "save a document", "save a file", "save an image", "save an image file", // too "save as"-like
				"save the document", "save the file", "save the image", "save the image file",

				"download", "download document", "download file", "download image", "download picture", "download image file",
				"download the document", "download the file", "download the image", "download the image file",
			],
			action: () => { file_save(); },
			description: localize("Saves the active document."),
		},
		{
			label: localize("Save &As"),
			// in mspaint, no shortcut is listed; it supports F12 (but in a browser that opens the dev tools)
			// it doesn't support Ctrl+Shift+S but that's a good & common modern shortcut
			...shortcut("Ctrl+Shift+S"),
			speech_recognition: [
				// this is ridiculous
				// this would be really simple in JSGF format
				"save as", "save as a new file", "save as a new picture", "save as a new image", "save a new file", "save new file",
				"save a new document", "save a new image file", "save a new image", "save a new picture",
				"save as a copy", "save a copy", "save as copy", "save under a new name", "save with a new name",
				"save document as a copy", "save document copy", "save document as copy", "save document under a new name", "save document with a new name",
				"save image as a copy", "save image copy", "save image as copy", "save image under a new name", "save image with a new name",
				"save file as a copy", "save file copy", "save file as copy", "save file under a new name", "save file with a new name",
				"save image file as a copy", "save image file copy", "save image file as copy", "save image file under a new name", "save image file with a new name",
			],
			action: () => { file_save_as(); },
			description: localize("Saves the active document with a new name."),
		},
		MENU_DIVIDER,
		{
			label: localize("&Load From URL"),
			// shortcut: "", // no shortcut: Ctrl+L is taken, and you can paste a URL with Ctrl+V, so it's not really needed
			speech_recognition: [
				"load from url",
				"load from a url",
				"load from address",
				"load from an address",
				"load from a web address",
				// this is ridiculous
				// this would be really simple in JSGF format
				"load an image from a URL",
				"load an image from an address",
				"load an image from a web address",
				"load image from a URL",
				"load image from an address",
				"load image from a web address",
				"load an image from URL",
				"load an image from address",
				"load an image from web address",
				"load image from URL",
				"load image from address",
				"load image from web address",

				"load an picture from a URL",
				"load an picture from an address",
				"load an picture from a web address",
				"load picture from a URL",
				"load picture from an address",
				"load picture from a web address",
				"load an picture from URL",
				"load an picture from address",
				"load an picture from web address",
				"load picture from URL",
				"load picture from address",
				"load picture from web address",
			],
			action: () => { file_load_from_url(); },
			description: localize("Opens an image from the web."),
		},
		{
			label: localize("&Upload To Imgur"),
			speech_recognition: [
				"upload to imgur", "upload image to imgur", "upload picture to imgur",
			],
			action: () => {
				// include the selection in the saved image
				deselect();

				main_canvas.toBlob((blob) => {
					sanity_check_blob(blob, () => {
						show_imgur_uploader(blob);
					});
				});
			},
			description: localize("Uploads the active document to Imgur"),
		},
		MENU_DIVIDER,
		{
			label: localize("Manage Storage"),
			speech_recognition: [
				"manage storage", "show storage", "open storage window", "manage sessions", "show sessions", "show local sessions", "local sessions", "storage manager", "show storage manager", "open storage manager",
				"show autosaves", "show saves", "show saved documents", "show saved files", "show saved pictures", "show saved images", "show local storage",
				"autosaves", "autosave", "saved documents", "saved files", "saved pictures", "saved images", "local storage",
			],
			action: () => { manage_storage(); },
			description: localize("Manages storage of previously created or opened pictures."),
		},
		MENU_DIVIDER,
		{
			label: localize("Print Pre&view"),
			speech_recognition: [
				"preview print", "print preview", "show print preview", "show preview of print",
			],
			action: () => {
				file_print();
			},
			description: localize("Prints the active document and sets printing options."),
			//description: localize("Displays full pages."),
		},
		{
			label: localize("Page Se&tup"),
			speech_recognition: [
				"setup page for print", "setup page for printing", "set-up page for print", "set-up page for printing", "set up page for print", "set up page for printing",
				"page setup", "printing setup", "page set-up", "printing set-up", "page set up", "printing set up",
			],
			action: () => {
				file_print();
			},
			description: localize("Prints the active document and sets printing options."),
			//description: localize("Changes the page layout."),
		},
		{
			label: localize("&Print"),
			...shortcut("Ctrl+P"), // relies on browser's print shortcut being Ctrl+P
			speech_recognition: [
				"print", "send to printer", "show print dialog",
				"print page", "print image", "print picture", "print drawing",
				"print out page", "print out image", "print out picture", "print out drawing",
				"print out the page", "print out the image", "print out the picture", "print out the drawing",

				"send page to printer", "send image to printer", "send picture to printer", "send drawing to printer",
				"send page to the printer", "send image to the printer", "send picture to the printer", "send drawing to the printer",
				"send the page to the printer", "send the image to the printer", "send the picture to the printer", "send the drawing to the printer",
				"send the page to printer", "send the image to printer", "send the picture to printer", "send the drawing to printer",
			],
			action: () => {
				file_print();
			},
			description: localize("Prints the active document and sets printing options."),
		},
		MENU_DIVIDER,
		{
			label: localize("Set As &Wallpaper (Tiled)"),
			speech_recognition: [
				"set as wallpaper",
				"set as wallpaper tiled",
				"set image as wallpaper tiled", "set picture as wallpaper tiled", "set drawing as wallpaper tiled",
				"use as wallpaper tiled",
				"use image as wallpaper tiled", "use picture as wallpaper tiled", "use drawing as wallpaper tiled",
				"tile image as wallpaper", "tile picture as wallpaper", "tile drawing as wallpaper",
			],
			action: () => { systemHooks.setWallpaperTiled(main_canvas); },
			description: localize("Tiles this bitmap as the desktop background."),
		},
		{
			label: localize("Set As Wallpaper (&Centered)"), // in mspaint it's Wa&llpaper
			speech_recognition: [
				"set as wallpaper centered",
				"set image as wallpaper centered", "set picture as wallpaper centered", "set drawing as wallpaper centered",
				"use as wallpaper centered",
				"use image as wallpaper centered", "use picture as wallpaper centered", "use drawing as wallpaper centered",
				"center image as wallpaper", "center picture as wallpaper", "center drawing as wallpaper",
			],
			action: () => { systemHooks.setWallpaperCentered(main_canvas); },
			description: localize("Centers this bitmap as the desktop background."),
		},
		MENU_DIVIDER,
		{
			label: localize("Recent File"),
			enabled: false, // @TODO for desktop app
			description: localize(""),
		},
		MENU_DIVIDER,
		{
			label: localize("E&xit"),
			...shortcut(window.is_electron_app ? "Alt+F4" : ""), // Alt+F4 closes the browser window (in most window managers)
			speech_recognition: [
				"exit application", "exit paint", "close paint window",
			],
			action: () => {
				are_you_sure(() => {
					if (is_discord_embed) {
						// For the Discord Activity, there doesn't seem to be an API to exit the activity.
						showMessageBox({
							message: "Click the Leave Activity button in Discord to exit.",
						});
						return;
					}

					// Note: For a Chrome PWA, window.close() is allowed only if there is only one history entry.
					// I could make it try to close the window and then navigate to the official web desktop if it fails,
					// but that would be inconsistent, as it wouldn't close the window after using File > New or File > Open.
					// I could make it so that it uses replaceState when opening a new document (starting a new session);
					// that would prevent you from using Alt+Left to go back to the previous document, but that may be acceptable
					// for a desktop app experience, where the back button is already hidden.
					// That said, if you just installed the PWA, it will have history already (even if just the New Tab page),
					// as the tab is converted to a window, and in that case,
					// it would be unable to close, again being inconsistent, but less so.
					// (If on PWA install, the app could open a fresh new window and close itself, it could work from the start,
					// but if we try to do that, we'll be back at square one, trying to close a window with history.)
					try {
						// API contract is containing page can override window.close()
						// Note that e.g. (()=>{}).bind().toString() gives "function () { [native code] }"
						// so the window.close() must not use bind() (not that that's common practice anyway)
						const close_overridden = frameElement && window.close && !/\{\s*\[native code\]\s*\}/.test(window.close.toString());
						if (close_overridden || window.is_electron_app) {
							window.close();
							return;
						}
					} catch (_error) {
						// In a cross-origin iframe, most likely
						// @TODO: establish postMessage API
					}
					// In a cross-origin iframe, or same origin but without custom close(), or top level:
					// Not all browsers support close() for closing a tab,
					// so redirect instead. Exit to the official web desktop.
					// @ts-ignore
					window.location = "https://98.js.org/";
				});
			},
			description: localize("Quits Paint."),
		},
	],
	[localize("&Edit")]: [
		{
			label: localize("&Undo"),
			...shortcut("Ctrl+Z"),
			speech_recognition: [
				"undo", "undo that",
			],
			enabled: () => undos.length >= 1,
			action: () => { undo(); },
			description: localize("Undoes the last action."),
		},
		{
			label: localize("&Repeat"),
			...shortcut("F4"), // also supported: Ctrl+Shift+Z, Ctrl+Y
			speech_recognition: [
				"repeat", "redo",
			],
			enabled: () => redos.length >= 1,
			action: () => { redo(); },
			description: localize("Redoes the previously undone action."),
		},
		{
			label: localize("&History"),
			...shortcut("Ctrl+Shift+Y"),
			speech_recognition: [
				"show history", "history",
			],
			action: () => { show_document_history(); },
			description: localize("Shows the document history and lets you navigate to states not accessible with Undo or Repeat."),
		},
		MENU_DIVIDER,
		{
			label: localize("Cu&t"),
			...shortcut("Ctrl+X"),
			speech_recognition: [
				"cut", "cut selection", "cut selection to clipboard", "cut the selection", "cut the selection to clipboard", "cut the selection to the clipboard",
			],
			enabled: () =>
				// @TODO: support cutting text with this menu item as well (e.g. for the text tool)
				!!selection,
			action: () => {
				edit_cut(true);
			},
			description: localize("Cuts the selection and puts it on the Clipboard."),
		},
		{
			label: localize("&Copy"),
			...shortcut("Ctrl+C"),
			speech_recognition: [
				"copy", "copy selection", "copy selection to clipboard", "copy the selection", "copy the selection to clipboard", "copy the selection to the clipboard",
			],
			enabled: () =>
				// @TODO: support copying text with this menu item as well (e.g. for the text tool)
				!!selection,
			action: () => {
				edit_copy(true);
			},
			description: localize("Copies the selection and puts it on the Clipboard."),
		},
		{
			label: localize("&Paste"),
			...shortcut("Ctrl+V"),
			speech_recognition: [
				"paste", "paste from clipboard", "paste from the clipboard", "insert clipboard", "insert clipboard contents", "insert the contents of the clipboard", "paste what's on the clipboard",
			],
			enabled: () =>
				// @TODO: disable if nothing in clipboard or wrong type (if we can access that)
				true,
			action: () => {
				edit_paste(true);
			},
			description: localize("Inserts the contents of the Clipboard."),
		},
		{
			label: localize("C&lear Selection"),
			...shortcut("Del"),
			speech_recognition: [
				"delete", "clear selection", "delete selection", "delete selected", "delete selected area", "clear selected area", "erase selected", "erase selected area",
			],
			enabled: () => !!selection,
			action: () => { delete_selection(); },
			description: localize("Deletes the selection."),
		},
		{
			label: localize("Select &All"),
			...shortcut("Ctrl+A"),
			speech_recognition: [
				"select all", "select everything",
				"select the whole image", "select the whole picture", "select the whole drawing", "select the whole canvas", "select the whole document",
				"select the entire image", "select the entire picture", "select the entire drawing", "select the entire canvas", "select the entire document",
			],
			action: () => { select_all(); },
			description: localize("Selects everything."),
		},
		MENU_DIVIDER,
		{
			label: `${localize("C&opy To")}...`,
			speech_recognition: [
				"copy to file", "copy selection to file", "copy selection to a file", "save selection",
				"save selection as file", "save selection as image", "save selection as picture", "save selection as image file", "save selection as document",
				"save selection as a file", "save selection as a image", "save selection as a picture", "save selection as a image file", "save selection as a document",
				"save selection to file", "save selection to image", "save selection to picture", "save selection to image file", "save selection to document",
				"save selection to a file", "save selection to a image", "save selection to a picture", "save selection to a image file", "save selection to a document",
			],
			enabled: () => !!selection,
			action: () => { save_selection_to_file(); },
			description: localize("Copies the selection to a file."),
		},
		{
			label: `${localize("Paste &From")}...`,
			speech_recognition: [
				"paste a file", "paste from a file", "insert a file", "insert an image file",
			],
			action: () => { choose_file_to_paste(); },
			description: localize("Pastes a file into the selection."),
		},
	],
	[localize("&View")]: [
		{
			label: localize("&Tool Box"),
			...shortcut(window.is_electron_app ? "Ctrl+T" : ""), // Ctrl+T opens a new browser tab, Ctrl+Alt+T opens a Terminal in Ubuntu, and Ctrl+Shift+Alt+T feels silly.
			speech_recognition: [
				"toggle tool box", "toggle tools box", "toggle toolbox", "toggle tool palette", "toggle tools palette",
				// @TODO: hide/show
			],
			checkbox: {
				toggle: () => {
					$toolbox.toggle();
				},
				check: () => $toolbox.is(":visible"),
			},
			description: localize("Shows or hides the tool box."),
		},
		{
			label: localize("&Color Box"),
			...shortcut("Ctrl+L"), // focuses browser address bar, but Firefox and Chrome both allow overriding the default behavior
			speech_recognition: [
				"toggle color box", "toggle colors box", "toggle palette", "toggle color palette", "toggle colors palette",
				// @TODO: hide/show
			],
			checkbox: {
				toggle: () => {
					$colorbox.toggle();
				},
				check: () => $colorbox.is(":visible"),
			},
			description: localize("Shows or hides the color box."),
		},
		{
			label: localize("&Status Bar"),
			speech_recognition: [
				"toggle status bar", "toggle status text", "toggle status area", "toggle status indicator",
				// @TODO: hide/show
			],
			checkbox: {
				toggle: () => {
					$status_area.toggle();
				},
				check: () => $status_area.is(":visible"),
			},
			description: localize("Shows or hides the status bar."),
		},
		{
			label: localize("T&ext Toolbar"),
			speech_recognition: [
				"toggle text toolbar", "toggle font toolbar", "toggle text tool bar", "toggle font tool bar",
				"toggle font box", "toggle fonts box", "toggle text options box", "toggle text tool options box", "toggle font options box",
				"toggle font window", "toggle fonts window", "toggle text options window", "toggle text tool options window", "toggle font options window",
				// @TODO: hide/show
			],
			enabled: false, // @TODO: toggle fonts box
			checkbox: {
				toggle: () => {
					// Kind of silly that I haven't implemented this in the 10 years I've been working on this project.
				},
				check: () => false,
			},
			description: localize("Shows or hides the text toolbar."),
		},
		MENU_DIVIDER,
		{
			label: localize("&Zoom"),
			submenu: [
				{
					label: localize("&Normal Size"),
					...shortcut(window.is_electron_app ? "Ctrl+PgUp" : ""), // Ctrl+PageUp cycles thru browser tabs in Chrome & Firefox; can be overridden in Chrome in fullscreen only
					speech_recognition: [
						"reset zoom", "zoom to normal size",
						"zoom to 100%", "set zoom to 100%", "set zoom 100%",
						"zoom to 1x", "set zoom to 1x", "set zoom 1x",
						"zoom level to 100%", "set zoom level to 100%", "set zoom level 100%",
						"zoom level to 1x", "set zoom level to 1x", "set zoom level 1x",
					],
					description: localize("Zooms the picture to 100%."),
					enabled: () => magnification !== 1,
					action: () => {
						set_magnification(1);
					},
				},
				{
					label: localize("&Large Size"),
					...shortcut(window.is_electron_app ? "Ctrl+PgDn" : ""), // Ctrl+PageDown cycles thru browser tabs in Chrome & Firefox; can be overridden in Chrome in fullscreen only
					speech_recognition: [
						"zoom to large size",
						"zoom to 400%", "set zoom to 400%", "set zoom 400%",
						"zoom to 4x", "set zoom to 4x", "set zoom 4x",
						"zoom level to 400%", "set zoom level to 400%", "set zoom level 400%",
						"zoom level to 4x", "set zoom level to 4x", "set zoom level 4x",
					],
					description: localize("Zooms the picture to 400%."),
					enabled: () => magnification !== 4,
					action: () => {
						set_magnification(4);
					},
				},
				{
					label: localize("Zoom To &Window"),
					speech_recognition: [
						"zoom to window", "zoom to view",
						"zoom to fit",
						"zoom to fit within window", "zoom to fit within view",
						"zoom to fit within the window", "zoom to fit within the view",
						"zoom to fit in window", "zoom to fit in view",
						"zoom to fit in the window", "zoom to fit in the view",
						"auto zoom", "fit zoom",
						"zoom to max", "zoom to maximum", "zoom to max size", "zoom to maximum size",
						"zoom so canvas fits", "zoom so picture fits", "zoom so image fits", "zoom so document fits",
						"zoom so whole canvas is visible", "zoom so whole picture is visible", "zoom so whole image is visible", "zoom so whole document is visible",
						"zoom so the whole canvas is visible", "zoom so the whole picture is visible", "zoom so the whole image is visible", "zoom so the whole document is visible",

						"fit to window", "fit to view", "fit in window", "fit in view", "fit within window", "fit within view",
						"fit picture to window", "fit picture to view", "fit picture in window", "fit picture in view", "fit picture within window", "fit picture within view",
						"fit image to window", "fit image to view", "fit image in window", "fit image in view", "fit image within window", "fit image within view",
						"fit canvas to window", "fit canvas to view", "fit canvas in window", "fit canvas in view", "fit canvas within window", "fit canvas within view",
						"fit document to window", "fit document to view", "fit document in window", "fit document in view", "fit document within window", "fit document within view",
					],
					description: localize("Zooms the picture to fit within the view."),
					action: () => {
						const rect = $canvas_area[0].getBoundingClientRect();
						const margin = 30; // leave a margin so scrollbars won't appear
						let mag = Math.min(
							(rect.width - margin) / main_canvas.width,
							(rect.height - margin) / main_canvas.height,
						);
						// round to an integer percent for the View > Zoom > Custom... dialog, which shows non-integers as invalid
						mag = Math.floor(100 * mag) / 100;
						set_magnification(mag);
					},
				},
				{
					label: `${localize("C&ustom")}...`,
					description: localize("Zooms the picture."),
					speech_recognition: [
						"zoom custom", "custom zoom", "set custom zoom", "set custom zoom level", "zoom to custom level", "zoom to custom", "zoom level", "set zoom level",
					],
					action: () => { show_custom_zoom_window(); },
				},
				MENU_DIVIDER,
				{
					label: localize("Show &Grid"),
					...shortcut("Ctrl+G"),
					speech_recognition: [
						"toggle show grid",
						"toggle grid", "toggle gridlines", "toggle grid lines", "toggle grid cells",
						// @TODO: hide/show
					],
					enabled: () => magnification >= 4,
					checkbox: {
						toggle: () => { toggle_grid(); },
						check: () => show_grid,
					},
					description: localize("Shows or hides the grid."),
				},
				{
					label: localize("Show T&humbnail"),
					speech_recognition: [
						"toggle show thumbnail",
						"toggle thumbnail", "toggle thumbnail view", "toggle thumbnail box", "toggle thumbnail window",
						"toggle preview", "toggle image preview", "toggle picture preview",
						"toggle picture in picture", "toggle picture in picture view", "toggle picture in picture box", "toggle picture in picture window",
						// @TODO: hide/show
					],
					checkbox: {
						toggle: () => { toggle_thumbnail(); },
						check: () => show_thumbnail,
					},
					description: localize("Shows or hides the thumbnail view of the picture."),
				},
			],
		},
		{
			label: localize("&View Bitmap"),
			...shortcut("Ctrl+F"),
			speech_recognition: [
				"view bitmap", "show bitmap",
				"fullscreen", "full-screen", "full screen",
				"show picture fullscreen", "show picture full-screen", "show picture full screen",
				"show image fullscreen", "show image full-screen", "show image full screen",
				// @TODO: exit fullscreen
			],
			action: () => { view_bitmap(); },
			description: localize("Displays the entire picture."),
		},
		MENU_DIVIDER,
		{
			label: localize("&Fullscreen"),
			...shortcut("F11"), // relies on browser's shortcut
			speech_recognition: [
				// won't work with speech recognition, needs a user gesture
			],
			enabled: () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled),
			checkbox: {
				check: () => Boolean(document.fullscreenElement || document.webkitFullscreenElement),
				toggle: () => {
					if (document.fullscreenElement || document.webkitFullscreenElement) {
						if (document.exitFullscreen) {
							document.exitFullscreen();
						} else if (document.webkitExitFullscreen) {
							document.webkitExitFullscreen();
						}
					} else {
						if (document.documentElement.requestFullscreen) {
							document.documentElement.requestFullscreen();
						} else if (document.documentElement.webkitRequestFullscreen) {
							document.documentElement.webkitRequestFullscreen();
						}
					}
					// check() would need to be async or faked with a timeout,
					// if the menus stayed open. @TODO: make all checkboxes close menus
					menu_bar.closeMenus();
				},
			},
			description: localize("Makes the application take up the entire screen."),
		},
	],
	[localize("&Image")]: [
		// @TODO: speech recognition: terms that apply to selection
		{
			label: localize("&Flip/Rotate"),
			...shortcut((window.is_electron_app && !window.electron_is_dev) ? "Ctrl+R" : "Ctrl+Alt+R"), // Ctrl+R reloads the browser tab (or Electron window in dev mode via electron-debug)
			speech_recognition: [
				"flip",
				"rotate",
				"flip/rotate", "flip slash rotate", "flip and rotate", "flip or rotate", "flip rotate",
				// @TODO: parameters to command
			],
			action: () => { image_flip_and_rotate(); },
			description: localize("Flips or rotates the picture or a selection."),
		},
		{
			label: localize("&Stretch/Skew"),
			...shortcut(window.is_electron_app ? "Ctrl+W" : "Ctrl+Alt+W"), // Ctrl+W closes the browser tab
			speech_recognition: [
				"stretch", "scale", "resize image",
				"skew",
				"stretch/skew", "stretch slash skew", "stretch and skew", "stretch or skew", "stretch skew",
				// @TODO: parameters to command
			],
			action: () => { image_stretch_and_skew(); },
			description: localize("Stretches or skews the picture or a selection."),
		},
		{
			label: localize("&Invert Colors"),
			...shortcut("Ctrl+I"),
			speech_recognition: [
				"invert",
				"invert colors",
				"invert image", "invert picture", "invert drawing",
				"invert image colors", "invert picture colors", "invert drawing colors",
				"invert colors of image", "invert colors of picture", "invert colors of drawing",
			],
			action: () => { image_invert_colors(); },
			description: localize("Inverts the colors of the picture or a selection."),
		},
		{
			label: `${localize("&Attributes")}...`,
			...shortcut("Ctrl+E"),
			speech_recognition: [
				"attributes", "image attributes", "picture attributes", "image options", "picture options",
				"dimensions", "image dimensions", "picture dimensions",
				"resize canvas", "resize document", "resize page", // not resize image/picture because that implies scaling, handled by Stretch/Skew
				"set image size", "set picture size", "set canvas size", "set document size", "set page size",
				"image size", "picture size", "canvas size", "document size", "page size",
				"configure image size", "configure picture size", "configure canvas size", "configure document size", "configure page size",
			],
			action: () => { image_attributes(); },
			description: localize("Changes the attributes of the picture."),
		},
		{
			label: localize("&Clear Image"),
			...shortcut((window.is_electron_app || !looksLikeChrome) ? "Ctrl+Shift+N" : ""), // Ctrl+Shift+N opens incognito window in chrome
			speech_recognition: [
				"clear image", "clear canvas", "clear picture", "clear page", "clear drawing",
				// @TODO: erase?
			],
			// (mspaint says "Ctrl+Shft+N")
			action: () => { if (!selection) { clear(); } },
			enabled: () => !selection,
			description: localize("Clears the picture."),
			// action: ()=> {
			// 	if (selection) {
			// 		delete_selection();
			// 	} else {
			// 		clear();
			// 	}
			// },
			// mspaint says localize("Clears the picture or selection."), but grays out the option when there's a selection
		},
		{
			label: localize("&Draw Opaque"),
			speech_recognition: [
				"toggle draw opaque",
				"toggle transparent selection", "toggle transparent selections",
				"toggle transparent selection mode", "toggle transparent selections mode",
				"toggle opaque selection", "toggle opaque selections",
				"toggle opaque selection mode", "toggle opaque selections mode",
				// toggle opaque? toggle opacity?
				// @TODO: hide/show / "draw opaque" / "draw transparent"/translucent?
			],
			checkbox: {
				toggle: () => {
					tool_transparent_mode = !tool_transparent_mode;
					$G.trigger("option-changed");
				},
				check: () => !tool_transparent_mode,
			},
			description: localize("Makes the current selection either opaque or transparent."),
		},
	],
	[localize("&Colors")]: [
		{
			label: `${localize("&Edit Colors")}...`,
			speech_recognition: [
				"edit colors", "edit color", "edit custom colors", "edit custom color",
				"pick custom color", "choose custom color", "pick a custom color", "choose a custom color",
				"edit last color", "create new color", "choose new color", "create a new color", "pick a new color",
			],
			action: () => {
				show_edit_colors_window();
			},
			description: localize("Creates a new color."),
		},
		{
			label: localize("&Get Colors"),
			speech_recognition: [
				"get colors", "load colors", "load color palette", "load palette", "load color palette file", "load palette file", "load list of colors",
			],
			action: async () => {
				const { file } = await systemHooks.showOpenFileDialog({ formats: palette_formats });
				AnyPalette.loadPalette(file, (error, new_palette) => {
					if (error) {
						show_file_format_errors({ as_palette_error: error });
					} else {
						palette = new_palette.map((color) => color.toString());
						$colorbox.rebuild_palette();
						window.console?.log(`Loaded palette: ${palette.map(() => "%c█").join("")}`, ...palette.map((color) => `color: ${color};`));
					}
				});
			},
			description: localize("Uses a previously saved palette of colors."),
		},
		{
			label: localize("&Save Colors"),
			speech_recognition: [
				"save colors", "save list of colors", "save color palette", "save palette", "save color palette file", "save palette file",
			],
			action: () => {
				const ap = new AnyPalette.Palette();
				ap.name = "JS Paint Saved Colors";
				ap.numberOfColumns = 16; // 14?
				for (const color of palette) {
					const [r, g, b] = get_rgba_from_color(color);
					ap.push(new AnyPalette.Color({
						red: r / 255,
						green: g / 255,
						blue: b / 255,
					}));
				}
				systemHooks.showSaveFileDialog({
					dialogTitle: localize("Save Colors"),
					defaultFileName: localize("untitled.pal"),
					formats: palette_formats,
					getBlob: (format_id) => {
						const file_content = AnyPalette.writePalette(ap, AnyPalette.formats[format_id]);
						const blob = new Blob([file_content], { type: "text/plain" });
						return new Promise((resolve) => {
							sanity_check_blob(blob, () => {
								resolve(blob);
							});
						});
					},
				});
			},
			description: localize("Saves the current palette of colors to a file."),
		},
	],
	[localize("&Help")]: [
		{
			label: localize("&Help Topics"),
			speech_recognition: [
				"help topics", "help me", "show help", "help", "show help window", "show help topics", "open help",
				"help viewer", "show help viewer", "open help viewer",
			],
			action: () => { show_help(); },
			description: localize("Displays Help for the current task or command."),
		},
		MENU_DIVIDER,
		{
			label: localize("&About Paint"),
			speech_recognition: [
				"about paint", "about js paint", "about jspaint", "show about window", "open about window", "about window",
				"app info", "about the app", "app information", "information about the app",
				"application info", "about the application", "application information", "information about the application",
				"who made this", "who did this", "who did this xd",
			],
			action: () => { show_about_paint(); },
			description: localize("Displays information about this application."),
			//description: localize("Displays program information, version number, and copyright."),
		},
	],
	[localize("E&xtras")]: [
		{
			emoji_icon: "⌚",
			label: localize("&History"),
			...shortcut("Ctrl+Shift+Y"),
			speech_recognition: [
				// This is a duplicate menu item (for easy access), so it doesn't need speech recognition data here.
			],
			action: () => { show_document_history(); },
			description: localize("Shows the document history and lets you navigate to states not accessible with Undo or Repeat."),
		},
		{
			emoji_icon: "🎞️",
			label: localize("&Render History As GIF"),
			...shortcut("Ctrl+Shift+G"),
			speech_recognition: [
				// @TODO: animated gif, blah
				"render history as gif", "render history as a gif", "render history animation", "make history animation", "make animation of history", "make animation of document history", "make animation from document history",
				"render a gif from the history", "render a gif animation from the history", "render an animation from the history",
				"make a gif from the history", "make a gif animation from the history", "make an animation from the history",
				"create a gif from the history", "create a gif animation from the history", "create an animation from the history",
				// aaaaaaaaaaaaaaaaaaaaaaaaaa *exponentially explodes*
				"make a gif", "make a gif of the history", "make a gif of the document history", "make a gif from the document history",
				"create a gif", "create a gif of the history", "create a gif of the document history", "create a gif from the document history",
				"make gif", "make gif of the history", "make gif of the document history", "make gif from the document history",
				"create gif", "create gif of the history", "create gif of the document history", "create gif from the document history",
				"make an animation", "make an animation of the history", "make an animation of the document history", "make an animation from the document history",
				"create an animation", "create an animation of the history", "create an animation of the document history", "create an animation from the document history",
				"make animation", "make animation of the history", "make animation of the document history", "make animation from the document history",
				"create animation", "create animation of the history", "create animation of the document history", "create animation from the document history",
			],
			action: () => { render_history_as_gif(); },
			description: localize("Creates an animation from the document history."),
		},
		// {
		// 	label: localize("Render History as &APNG",
		// 	// shortcut: "Ctrl+Shift+A",
		// 	action: ()=> { render_history_as_apng(); },
		// 	description: localize("Creates an animation from the document history."),
		// },
		MENU_DIVIDER,
		// {
		// 	label: localize("Extra T&ool Box",
		// 	checkbox: {
		// 		toggle: ()=> {
		// 			// this doesn't really work well at all to have two toolboxes
		// 			// (this was not the original plan either)
		// 			$toolbox2.toggle();
		// 		},
		// 		check: ()=> {
		// 			return $toolbox2.is(":visible");
		// 		},
		// 	},
		// 	description: localize("Shows or hides an extra tool box."),
		// },
		// {
		// 	label: localize("&Preferences",
		// 	action: ()=> {
		// 		// :)
		// 	},
		// 	description: localize("Configures JS Paint."),
		// }
		{
			emoji_icon: "🤪",
			label: localize("&Draw Randomly"),
			speech_recognition: [
				"draw randomly", "draw pseudorandomly", "draw wildly", "make random art",
			],
			checkbox: {
				toggle: () => {
					if (simulatingGestures) {
						stopSimulatingGestures();
					} else {
						simulateRandomGesturesPeriodically();
					}
				},
				check: () => {
					return simulatingGestures;
				},
			},
			description: localize("Draws randomly with different tools."),
		},
		MENU_DIVIDER,
		{
			emoji_icon: "👥",
			label: localize("&Multi-User"),
			submenu: [
				{
					label: localize("&New Session From Document"),
					speech_recognition: [
						"new session from document",
						"session from document",
						"online session",
						"enable multi-user",
						"enable multiplayer",
						"start multi-user",
						"start multiplayer",
						"start collaboration",
						"start collaborating",
						"multi-user mode",
						"multiplayer mode",
						"collaboration mode",
						"collaborative mode",
						"collaborating mode",
						"online mode",
						"go online",
						"share canvas",
						"play with friends",
						"draw with friends",
						"draw together with friends",
						"draw together",
						"multiplayer",
						"multi-user",
						"collaborate",
						"collaboration",
						"collaborative",
						"collaborating",
					],
					action: () => {
						show_multi_user_setup_dialog(true);
					},
					description: localize("Starts a new multi-user session from the current document."),
				},
				{
					label: localize("New &Blank Session"),
					speech_recognition: [
						"new blank session",
						"new empty session",
						"new fresh session",
						"new blank multi-user session",
						"new empty multi-user session",
						"new fresh multi-user session",
						"new blank multiplayer session",
						"new empty multiplayer session",
						"new fresh multiplayer session",
						"new multi-user session",
						"new multiplayer session",
						"new collaboration session",
						"new collaborative session",
						"start multi-user session",
						"start multiplayer session",
						"start collaboration session",
						"start collaborative session",
						"start multi-user with a new",
						"start multiplayer with a new",
						"start collaboration with a new",
						"start collaborating with a new",
						"start multi-user with a blank",
						"start multiplayer with a blank",
						"start collaboration with a blank",
						"start collaborating with a blank",
						"start multi-user with an empty",
						"start multiplayer with an empty",
						"start collaboration with an empty",
						"start collaborating with an empty",
						"start multi-user with new",
						"start multiplayer with new",
						"start collaboration with new",
						"start collaborating with new",
						"start multi-user with blank",
						"start multiplayer with blank",
						"start collaboration with blank",
						"start collaborating with blank",
						"start multi-user with empty",
						"start multiplayer with empty",
						"start collaboration with empty",
						"start collaborating with empty",
					],
					action: () => {
						show_multi_user_setup_dialog(false);
					},
					description: localize("Starts a new multi-user session from an empty document."),
				},
			],
		},
		{
			emoji_icon: "💄",
			label: localize("&Themes"),
			submenu: [
				{
					emoji_icon: "⬜",
					label: localize("&Classic Light"),
					speech_recognition: [
						"reset theme", "revert theme setting",
						"classic theme", "switch to classic theme", "use classic theme", "set theme to classic", "set theme classic", "switch to classic theme", "switch theme to classic", "switch theme classic",
						"retro theme", "switch to retro theme", "use retro theme", "set theme to retro", "set theme retro", "switch to retro theme", "switch theme to retro", "switch theme retro",
						"normal theme", "switch to normal theme", "use normal theme", "set theme to normal", "set theme normal", "switch to normal theme", "switch theme to normal", "switch theme normal",
						"default theme", "switch to default theme", "use default theme", "set theme to default", "set theme default", "switch to default theme", "switch theme to default", "switch theme default",
						"original theme", "switch to original theme", "use original theme", "set theme to original", "set theme original", "switch to original theme", "switch theme to original", "switch theme original",
						"basic theme", "switch to basic theme", "use basic theme", "set theme to basic", "set theme basic", "switch to basic theme", "switch theme to basic", "switch theme basic",
						"90s theme", "switch to 90s theme", "use 90s theme", "set theme to 90s", "set theme 90s", "switch to 90s theme", "switch theme to 90s", "switch theme 90s",
						"windows 98 theme", "switch to windows 98 theme", "use windows 98 theme", "set theme to windows 98", "set theme windows 98", "switch to windows 98 theme", "switch theme to windows 98", "switch theme windows 98",
						"windows 95 theme", "switch to windows 95 theme", "use windows 95 theme", "set theme to windows 95", "set theme windows 95", "switch to windows 95 theme", "switch theme to windows 95", "switch theme windows 95",
						"windows 2000 theme", "switch to windows 2000 theme", "use windows 2000 theme", "set theme to windows 2000", "set theme windows 2000", "switch to windows 2000 theme", "switch theme to windows 2000", "switch theme windows 2000",
						// in contrast to the Dark theme:
						// TODO: stick with Modern/Classic while changing to Dark/Light variant
						"light theme", "switch to light theme", "use light theme", "set theme to light", "set theme light", "switch to light theme", "switch theme to light", "switch theme light",
						"light mode", "switch to light mode", "use light mode", "set mode to light", "set mode light", "switch to light mode", "switch mode to light", "switch mode light",
						"bright theme", "switch to bright theme", "use bright theme", "set theme to bright", "set theme bright", "switch to bright theme", "switch theme to bright", "switch theme bright",
						"bright mode", "switch to bright mode", "use bright mode", "set mode to bright", "set mode bright", "switch to bright mode", "switch mode to bright", "switch mode bright",
						"day theme", "switch to day theme", "use day theme", "set theme to day", "set theme day", "switch to day theme", "switch theme to day", "switch theme day",
						"day mode", "switch to day mode", "use day mode", "set mode to day", "set mode day", "switch to day mode", "switch mode to day", "switch mode day",
						"go light", "go bright",
						// new naming scheme
						"classic light", "light classic",
					],
					action: () => {
						set_theme("classic.css");
					},
					enabled: () => get_theme() != "classic.css",
					description: localize("Makes JS Paint look like MS Paint from Windows 98."),
				},
				{
					emoji_icon: "⬛",
					label: localize("Classic &Dark"),
					speech_recognition: [
						"dark theme", "switch to dark theme", "use dark theme", "set theme to dark", "set theme dark", "switch to dark theme", "switch theme to dark", "switch theme dark",
						"dark mode", "switch to dark mode", "use dark mode", "set mode to dark", "set mode dark", "switch to dark mode", "switch mode to dark", "switch mode dark",
						"dim theme", "switch to dim theme", "use dim theme", "set theme to dim", "set theme dim", "switch to dim theme", "switch theme to dim", "switch theme dim",
						"dim mode", "switch to dim mode", "use dim mode", "set mode to dim", "set mode dim", "switch to dim mode", "switch mode to dim", "switch mode dim",
						"night theme", "switch to night theme", "use night theme", "set theme to night", "set theme night", "switch to night theme", "switch theme to night", "switch theme night",
						"night mode", "switch to night mode", "use night mode", "set mode to night", "set mode night", "switch to night mode", "switch mode to night", "switch mode night",
						"go dark", "go dim",
						// new naming scheme
						"classic dark", "dark classic",
					],
					action: () => {
						set_theme("dark.css");
					},
					enabled: () => get_theme() != "dark.css",
					description: localize("Makes JS Paint look like MS Paint from Windows 98, with a dark color scheme."),
				},
				{
					emoji_icon: "⚪",
					label: localize("&Modern Light"),
					speech_recognition: [
						"modern theme", "switch to modern theme", "use modern theme", "set theme to modern", "set theme modern", "switch to modern theme", "switch theme to modern", "switch theme modern",
						// new naming scheme
						"modern light", "light modern",
					],
					action: () => {
						set_theme("modern.css");
					},
					enabled: () => get_theme() != "modern.css",
					description: localize("Gives JS Paint a more modern look, with light colors."),
				},
				{
					emoji_icon: "⚫",
					label: localize("Mod&ern Dark"),
					speech_recognition: [
						"dark modern theme", "switch to dark modern theme", "use dark modern theme", "set theme to dark modern", "set theme dark modern", "switch to dark modern theme", "switch theme to dark modern", "switch theme dark modern",
						// new naming scheme
						"modern dark", "dark modern",
					],
					action: () => {
						set_theme("modern-dark.css");
					},
					enabled: () => get_theme() != "modern-dark.css",
					description: localize("Gives JS Paint a more modern look, with dark colors."),
				},
				{
					emoji_icon: "❄️",
					label: localize("&Winter"),
					speech_recognition: [
						"winter theme", "switch to winter theme", "use winter theme", "set theme to winter", "set theme winter", "switch to winter theme", "switch theme to winter", "switch theme winter",
						"holiday theme", "switch to holiday theme", "use holiday theme", "set theme to holiday", "set theme holiday", "switch to holiday theme", "switch theme to holiday", "switch theme holiday",
						"christmas theme", "switch to christmas theme", "use christmas theme", "set theme to christmas", "set theme christmas", "switch to christmas theme", "switch theme to christmas", "switch theme christmas",
						"hanukkah theme", "switch to hanukkah theme", "use hanukkah theme", "set theme to hanukkah", "set theme hanukkah", "switch to hanukkah theme", "switch theme to hanukkah", "switch theme hanukkah",
					],
					action: () => {
						set_theme("winter.css");
					},
					enabled: () => get_theme() != "winter.css",
					description: localize("Makes JS Paint look festive for the holidays."),
				},
				{
					emoji_icon: "🤘",
					label: localize("&Occult"),
					speech_recognition: [
						"occult theme", "switch to occult theme", "use occult theme", "set theme to occult", "set theme occult", "switch to occult theme", "switch theme to occult", "switch theme occult",
						"occultist theme", "switch to occultist theme", "use occultist theme", "set theme to occultist", "set theme occultist", "switch to occultist theme", "switch theme to occultist", "switch theme occultist",
						"occultism theme", "switch to occultism theme", "use occultism theme", "set theme to occultism", "set theme occultism", "switch to occultism theme", "switch theme to occultism", "switch theme occultism",
						"satan theme", "switch to satan theme", "use satan theme", "set theme to satan", "set theme satan", "switch to satan theme", "switch theme to satan", "switch theme satan",
						"satanic theme", "switch to satanic theme", "use satanic theme", "set theme to satanic", "set theme satanic", "switch to satanic theme", "switch theme to satanic", "switch theme satanic",
						"satanist theme", "switch to satanist theme", "use satanist theme", "set theme to satanist", "set theme satanist", "switch to satanist theme", "switch theme to satanist", "switch theme satanist",
						"satanism theme", "switch to satanism theme", "use satanism theme", "set theme to satanism", "set theme satanism", "switch to satanism theme", "switch theme to satanism", "switch theme satanism",
						"demon theme", "switch to demon theme", "use demon theme", "set theme to demon", "set theme demon", "switch to demon theme", "switch theme to demon", "switch theme demon",
						"demonic theme", "switch to demonic theme", "use demonic theme", "set theme to demonic", "set theme demonic", "switch to demonic theme", "switch theme to demonic", "switch theme demonic",
						"daemon theme", "switch to daemon theme", "use daemon theme", "set theme to daemon", "set theme daemon", "switch to daemon theme", "switch theme to daemon", "switch theme daemon",
						"daemonic theme", "switch to daemonic theme", "use daemonic theme", "set theme to daemonic", "set theme daemonic", "switch to daemonic theme", "switch theme to daemonic", "switch theme daemonic",
						"devil theme", "switch to devil theme", "use devil theme", "set theme to devil", "set theme devil", "switch to devil theme", "switch theme to devil", "switch theme devil",
						"devilish theme", "switch to devilish theme", "use devilish theme", "set theme to devilish", "set theme devilish", "switch to devilish theme", "switch theme to devilish", "switch theme devilish",
						"devil worship theme", "switch to devil worship theme", "use devil worship theme", "set theme to devil worship", "set theme devil worship", "switch to devil worship theme", "switch theme to devil worship", "switch theme devil worship",
						"witchcraft theme", "switch to witchcraft theme", "use witchcraft theme", "set theme to witchcraft", "set theme witchcraft", "switch to witchcraft theme", "switch theme to witchcraft", "switch theme witchcraft",
						"witch theme", "switch to witch theme", "use witch theme", "set theme to witch", "set theme witch", "switch to witch theme", "switch theme to witch", "switch theme witch",
						"witchy theme", "switch to witchy theme", "use witchy theme", "set theme to witchy", "set theme witchy", "switch to witchy theme", "switch theme to witchy", "switch theme witchy",
						"witchery theme", "switch to witchery theme", "use witchery theme", "set theme to witchery", "set theme witchery", "switch to witchery theme", "switch theme to witchery", "switch theme witchery",
						"ritual theme", "switch to ritual theme", "use ritual theme", "set theme to ritual", "set theme ritual", "switch to ritual theme", "switch theme to ritual", "switch theme ritual",
						"ritualism theme", "switch to ritualism theme", "use ritualism theme", "set theme to ritualism", "set theme ritualism", "switch to ritualism theme", "switch theme to ritualism", "switch theme ritualism",
						"ritualistic theme", "switch to ritualistic theme", "use ritualistic theme", "set theme to ritualistic", "set theme ritualistic", "switch to ritualistic theme", "switch theme to ritualistic", "switch theme ritualistic",
						"Halloween theme", "switch to Halloween theme", "use Halloween theme", "set theme to Halloween", "set theme Halloween", "switch to Halloween theme", "switch theme to Halloween", "switch theme Halloween",

						"summon demon", "summon daemon", "summon demon theme", "summon daemon theme",
						"summon demons", "summon daemons", "summon demons theme", "summon daemons theme",
						"demon summoning", "daemon summoning", "demon summoning theme", "daemon summoning theme",
						"demons summoning", "daemons summoning", "demons summoning theme", "daemons summoning theme",
						"welcome demon", "welcome daemon", "welcome demon theme", "welcome daemon theme",
						"welcome demons", "welcome daemons", "welcome demons theme", "welcome daemons theme",
						"summon satan", "summon satan theme", "summon daemon theme",
						"satan summoning", "satan summoning theme", "daemon summoning theme",
						"welcome satan", "welcome satan theme",
						"summon devil", "summon the devil", "summon devil theme", "summon the devil theme",
						"welcome devil", "welcome the devil", "welcome devil theme", "welcome the devil theme",

						"I beseech thee", "I entreat thee", "I summon thee", "I call upon thy name", "I call upon thine name", "Lord Satan", "hail Satan", "hail Lord Satan", "O Mighty Satan", "Oh Mighty Satan",
						"In nomine Dei nostri Satanas Luciferi Excelsi", "Rege Satanas", "Ave Satanas", "Rege Satana", "Ave Satana",
						"go demonic", "go daemonic", "go occult", "666",
						"begin ritual", "begin the ritual", "begin a ritual",
						"start ritual", "start the ritual", "start a ritual",
					],
					action: () => {
						set_theme("occult.css");
					},
					enabled: () => get_theme() != "occult.css",
					description: localize("Starts the ritual."),
				},
				{
					emoji_icon: "🫧",
					label: localize("&Bubblegum"),
					speech_recognition: [
						"bubblegum theme", "switch to bubblegum theme", "use bubblegum theme", "set theme to bubblegum", "set theme bubblegum", "switch to bubblegum theme", "switch theme to bubblegum", "switch theme bubblegum",
						"pink theme", "switch to pink theme", "use pink theme", "set theme to pink", "set theme pink", "switch to pink theme", "switch theme to pink", "switch theme pink",
						"pearlescent theme", "pearlescent bubblegum", "pearlescent pink",
						"pearly theme", "pearly bubblegum", "pearly pink",
						"shiny theme", "shiny bubblegum", "shiny pink",
						"3D theme", "3D bubblegum", "3D pink",
						"bubbly theme",
						"corporate bubblegum",
						"business pink",
					],
					action: () => {
						set_theme("bubblegum.css");
					},
					enabled: () => get_theme() != "bubblegum.css",
					description: localize("Makes JS Paint look like pearlescent bubblegum."),
				},
				// {
				// 	emoji_icon: "🪐",
				// 	label: localize("&Retro Futurist"),
				// 	speech_recognition: [
				// 		"retrofuturist theme", "switch to retrofuturist theme", "use retrofuturist theme", "set theme to retrofuturist", "set theme retrofuturist", "switch to retrofuturist theme", "switch theme to retrofuturist", "switch theme retrofuturist",
				// 		"retro futurist theme", "switch to retro futurist theme", "use retro futurist theme", "set theme to retro futurist", "set theme retro futurist", "switch to retro futurist theme", "switch theme to retro futurist", "switch theme retro futurist",
				// 		"retrofuturistic theme", "switch to retrofuturistic theme", "use retrofuturistic theme", "set theme to retrofuturistic", "set theme retrofuturistic", "switch to retrofuturistic theme", "switch theme to retrofuturistic", "switch theme retrofuturistic",
				// 		"retro futuristic theme", "switch to retro futuristic theme", "use retro futuristic theme", "set theme to retro futuristic", "set theme retro futuristic", "switch to retro futuristic theme", "switch theme to retro futuristic", "switch theme retro futuristic",
				// 		// spell-checker: disable
				// 		"scifi theme", "switch to scifi theme", "use scifi theme", "set theme to scifi", "set theme scifi", "switch to scifi theme", "switch theme to scifi", "switch theme scifi",
				// 		// spell-checker: enable
				// 		"sci-fi theme", "switch to sci-fi theme", "use sci-fi theme", "set theme to sci-fi", "set theme sci-fi", "switch to sci-fi theme", "switch theme to sci-fi", "switch theme sci-fi",
				// 	],
				// 	action: () => {
				// 		set_theme("retrofuturist.css");
				// 	},
				// 	enabled: false,
				// 	// enabled: () => get_theme() != "retrofuturist.css",
				// 	description: localize("Makes JS Paint look like the future as imagined in the past."),
				// },
				// {
				// 	emoji_icon: "🧺",
				// 	label: localize("&Picnic"),
				// 	speech_recognition: [
				// 		"picnic theme", "switch to picnic theme", "use picnic theme", "set theme to picnic", "set theme picnic", "switch to picnic theme", "switch theme to picnic", "switch theme picnic",
				// 		"pic-nic theme", "switch to pic-nic theme", "use pic-nic theme", "set theme to pic-nic", "set theme pic-nic", "switch to pic-nic theme", "switch theme to pic-nic", "switch theme pic-nic",
				// 		"sandbox theme", "switch to sandbox theme", "use sandbox theme", "set theme to sandbox", "set theme sandbox", "switch to sandbox theme", "switch theme to sandbox", "switch theme sandbox",
				// 		"wooden theme", "switch to wooden theme", "use wooden theme", "set theme to wooden", "set theme wooden", "switch to wooden theme", "switch theme to wooden", "switch theme wooden",
				// 	],
				// 	action: () => {
				// 		set_theme("picnic.css");
				// 	},
				// 	enabled: false,
				// 	// enabled: () => get_theme() != "picnic.css",
				// 	description: localize("Makes JS Paint look like a picnic in the park."),
				// },
			],
		},
		{
			emoji_icon: "🌍",
			label: localize("&Language"),
			submenu: available_languages.map((available_language) => (
				{
					emoji_icon: get_language_emoji(available_language),
					label: get_language_endonym(available_language),
					action: () => {
						set_language(available_language);
					},
					enabled: () => get_language() != available_language,
					description: localize("Changes the language to %1.", get_iso_language_name(available_language)),
				}
			)),
		},
		{
			emoji_icon: "👁️",
			label: localize("&Eye Gaze Mode"),
			speech_recognition: [
				"toggle eye gaze mode",
				"enable eye gaze mode",
				"disable eye gaze mode",
				"enter eye gaze mode",
				"leave eye gaze mode",
				"exit eye gaze mode",
				"turn on eye gaze mode",
				"turn off eye gaze mode",
				"eye gaze mode on",
				"eye gaze mode off",
				"start eye gaze mode",
				"stop eye gaze mode",

				"toggle eye gaze",
				"enable eye gaze",
				"disable eye gaze",
				"enter eye gaze",
				"leave eye gaze",
				"exit eye gaze",
				"turn on eye gaze",
				"turn off eye gaze",
				"eye gaze on",
				"eye gaze off",
				"start eye gaze",
				"stop eye gaze",

				"toggle eye gazing",
				"enable eye gazing",
				"disable eye gazing",
				"enter eye gazing",
				"leave eye gazing",
				"exit eye gazing",
				"turn on eye gazing",
				"turn off eye gazing",
				"eye gazing on",
				"eye gazing off",
				"start eye gazing",
				"stop eye gazing",
			],
			checkbox: {
				toggle: () => {
					if (/eye-gaze-mode/i.test(location.hash)) {
						// @TODO: confirmation dialog that you could cancel with dwell clicking!
						// if (confirm("This will disable eye gaze mode.")) {
						change_url_param("eye-gaze-mode", false);
						// }
					} else {
						change_url_param("eye-gaze-mode", true);
					}
				},
				check: () => {
					return /eye-gaze-mode/i.test(location.hash);
				},
			},
			description: localize("Enlarges buttons and provides dwell clicking."),
		},
		{
			emoji_icon: "🎙️",
			label: localize("&Speech Recognition"),
			speech_recognition: [
				"toggle speech recognition", "toggle speech recognition mode",
				"disable speech recognition", "disable speech recognition mode", "turn off speech recognition", "turn off speech recognition mode", "leave speech recognition mode", "exit speech recognition mode",
			],
			checkbox: {
				toggle: () => {
					if (/speech-recognition-mode/i.test(location.hash)) {
						change_url_param("speech-recognition-mode", false);
					} else {
						change_url_param("speech-recognition-mode", true);
					}
				},
				check: () => {
					return speech_recognition_active;
				},
			},
			enabled: () => speech_recognition_available,
			description: localize("Controls the application with voice commands."),
		},
		{
			emoji_icon: "↕️",
			label: localize("&Vertical Color Box"),
			speech_recognition: [
				"toggle vertical color box", "toggle vertical color box mode",
				"toggle vertical colors box", "toggle vertical colors box mode",
				"toggle vertical palette", "toggle vertical palette mode",
				"toggle horizontal color box", "toggle horizontal color box mode",
				"toggle horizontal colors box", "toggle horizontal colors box mode",
				"toggle horizontal palette", "toggle horizontal palette mode",
				// @TODO: "use a vertical/horizontal color box", "place palette on the left", "make palette tall/wide", etc.
			],
			checkbox: {
				toggle: () => {
					if (/eye-gaze-mode/i.test(location.hash)) {
						// @TODO: confirmation dialog that you could cancel with dwell clicking!
						// if (confirm("This will disable eye gaze mode.")) {
						// change_some_url_params({
						// 	"eye-gaze-mode": false,
						// 	"vertical-color-box-mode": false,
						// });
						// }
					} else if (/vertical-color-box-mode/i.test(location.hash)) {
						change_url_param("vertical-color-box-mode", false);
					} else {
						change_url_param("vertical-color-box-mode", true);
					}
				},
				check: () => {
					return /vertical-color-box-mode|eye-gaze-mode/i.test(location.hash);
				},
			},
			enabled: () => {
				return !/eye-gaze-mode/i.test(location.hash);
			},
			description: localize("Arranges the color box vertically."),
		},
		MENU_DIVIDER,
		{
			emoji_icon: "🗃️",
			label: localize("Manage Storage"),
			speech_recognition: [
				// This is a duplicate menu item (for easy access), so it doesn't need speech recognition data here.
			],
			action: () => { manage_storage(); },
			description: localize("Manages storage of previously created or opened pictures."),
		},
		MENU_DIVIDER,
		{
			emoji_icon: "📢",
			label: localize("Project News"),
			speech_recognition: [
				"project news", "news about the project", "news about this project",
				"app news", "news about the app", "news about this app",
				"application news", "news about the application", "news about this application",
				"what's new", "new features",
				"show news", "show news update", "news update",
			],
			action: () => { show_news(); },
			description: localize("Shows news about JS Paint."),
		},
		{
			emoji_icon: "👾", // "👋",
			label: localize("Discord"),
			speech_recognition: [
				"chat on discord", "discord server", "discord community", "join the discord", "join discord", "visit the discord", "visit discord", "discord chat",
			],
			action: () => {
				window.open("https://discord.gg/SyFweYjTKx");
			},
			description: localize("Joins the community on Discord."),
		},
		{
			emoji_icon: "ℹ️",
			label: localize("GitHub"),
			speech_recognition: [
				"repo on github", "project on github", "show the source code", "show source code",
			],
			action: () => { window.open("https://github.com/1j01/jspaint"); },
			description: localize("Shows the project on GitHub."),
		},
		{
			emoji_icon: "💵",
			label: localize("Donate"),
			speech_recognition: [
				"donate", "make a monetary contribution",
			],
			action: () => { window.open("https://www.paypal.me/IsaiahOdhner"); },
			description: localize("Supports the project."),
		},
	],
};

for (const [top_level_menu_key, menu] of Object.entries(menus)) {
	const top_level_menu_name = top_level_menu_key.replace(/&/, "");
	const add_literal_navigation_speech_recognition = (menu, ancestor_names) => {
		for (const menu_item of menu) {
			if (menu_item !== MENU_DIVIDER) {
				const menu_item_name = menu_item.label.replace(/&|\.\.\.|\(|\)/g, "");
				// console.log(menu_item_name);
				let menu_item_matchers = [menu_item_name];
				if (/\//.test(menu_item_name)) {
					menu_item_matchers = [
						menu_item_name,
						menu_item_name.replace(/\//, " "),
						menu_item_name.replace(/\//, " and "),
						menu_item_name.replace(/\//, " or "),
						menu_item_name.replace(/\//, " slash "),
					];
				}
				menu_item_matchers = menu_item_matchers.map((menu_item_matcher) => {
					return `${ancestor_names} ${menu_item_matcher}`;
				});
				menu_item.speech_recognition = (menu_item.speech_recognition || []).concat(menu_item_matchers);
				// console.log(menu_item_matchers, menu_item.speech_recognition);

				if (menu_item.submenu) {
					add_literal_navigation_speech_recognition(menu_item.submenu, `${ancestor_names} ${menu_item_name}`);
				}
			}
		}
	};
	add_literal_navigation_speech_recognition(menu, top_level_menu_name);
}

export { menus };

/**
 * Expands a shortcut label into an object with the label and a corresponding ARIA key shortcuts value.
 * Could handle "CtrlOrCmd" like Electron does, here, or just treat "Ctrl" as control or command.
 * Of course it would be more ergonomic if OS-GUI.js handled this sort of thing,
 * and I have thought about rewriting the OS-GUI API to mimic Electron's.
 * I also have some munging logic in electron-main.js related to this.
 * @param {string} shortcutLabel
 * @returns {{shortcutLabel?: string, ariaKeyShortcuts?: string}}
 */
function shortcut(shortcutLabel) {
	if (!shortcutLabel) return {};
	const ariaKeyShortcuts = shortcutLabel.replace(/Ctrl/g, "Control").replace(/\bDel\b/, "Delete");//.replace(/\bEsc\b/, "Escape").replace(/\bIns\b/, "Insert");
	if (!validateAriaKeyshortcuts(ariaKeyShortcuts)) {
		console.error(`Invalid ARIA key shortcuts: ${JSON.stringify(ariaKeyShortcuts)} (from shortcut label: ${JSON.stringify(shortcutLabel)}) (or validator is incomplete)`);
	}
	return {
		shortcutLabel,
		ariaKeyShortcuts,
	};
}

/**
 * Validates an aria-keyshortcuts value.
 *
 * AI-generated code (ChatGPT), prompted with the spec section: https://w3c.github.io/aria/#aria-keyshortcuts
 *
 * @param {string} value
 * @returns {boolean} valid
 */
function validateAriaKeyshortcuts(value) {
	// Define valid modifier and non-modifier keys based on UI Events KeyboardEvent key Values spec
	const modifiers = ["Alt", "Control", "Shift", "Meta", "AltGraph"];
	const nonModifiers = [
		"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
		"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
		"1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
		"Delete",
		"Enter", "Tab", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
		"PageUp", "PageDown", "End", "Home", "Escape", "Space", "Plus",
		"Minus", "Comma", "Period", "Slash", "Backslash", "Quote", "Semicolon",
		"BracketLeft", "BracketRight", "F1", "F2", "F3", "F4", "F5", "F6",
		"F7", "F8", "F9", "F10", "F11", "F12",
		// Add more non-modifier keys as needed
	];

	// Split the value into individual shortcuts
	const shortcuts = value.split(" ");

	// Function to validate a single shortcut
	function validateShortcut(shortcut) {
		const keys = shortcut.split("+");

		if (keys.length === 0) {
			return false;
		}

		let nonModifierFound = false;

		// Check each key in the shortcut
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];

			if (modifiers.includes(key)) {
				if (nonModifierFound) {
					// Modifier key found after a non-modifier key
					return false;
				}
			} else if (nonModifiers.includes(key)) {
				if (nonModifierFound) {
					// Multiple non-modifier keys found
					return false;
				}
				nonModifierFound = true;
			} else {
				// Invalid key
				return false;
			}
		}

		// Ensure at least one non-modifier key is present
		return nonModifierFound;
	}

	// Validate all shortcuts
	for (let i = 0; i < shortcuts.length; i++) {
		if (!validateShortcut(shortcuts[i])) {
			return false;
		}
	}

	return true;
}

/** @type {[string, boolean][]} */
const ariaKeyShortcutsTestCases = [
	["Control+A Shift+Alt+B", true],
	["Control+Shift+1", true],
	["Shift+Alt+T Control+5", true],
	["T", true],
	["ArrowLeft", true],
	["Shift+T Alt+Control", false],
	["T+Shift", false],
	["Alt", false],
	["IncredibleKey", false],
	["Ctrl+Shift+A", false],
];
for (const [ariaKeyShortcuts, expectedValidity] of ariaKeyShortcutsTestCases) {
	const returnedValidity = validateAriaKeyshortcuts(ariaKeyShortcuts);
	if (returnedValidity !== expectedValidity) {
		console.error(`validateAriaKeyshortcuts("${ariaKeyShortcuts}") returned ${returnedValidity} but expected ${expectedValidity}`);
	}
}
