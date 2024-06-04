// @ts-check
// eslint-disable-next-line no-unused-vars
/* global airbrush_size:writable, brush_shape:writable, brush_size:writable, button:writable, ctrl:writable, eraser_size:writable, fill_color:writable, pick_color_slot:writable, history_node_to_cancel_to:writable, MenuBar:writable, my_canvas_height:writable, my_canvas_width:writable, palette:writable, pencil_size:writable, pointer:writable, pointer_active:writable, pointer_buttons:writable, pointer_over_canvas:writable, pointer_previous:writable, pointer_start:writable, pointer_type:writable, pointers:writable, reverse:writable, shift:writable, stroke_color:writable, stroke_size:writable, update_helper_layer_on_pointermove_active:writable */
/* global AccessKeys, current_history_node, default_airbrush_size, default_brush_shape, default_brush_size, default_canvas_height, default_canvas_width, default_eraser_size, default_magnification, default_pencil_size, default_stroke_size, enable_fs_access_api, file_name, get_direction, localize, magnification, main_canvas, main_ctx, return_to_tools, selected_colors, selected_tool, selected_tools, selection, systemHooks, textbox, transparency */

import { $ColorBox } from "./$ColorBox.js";
import { $ToolBox } from "./$ToolBox.js";
import { Handles } from "./Handles.js";
// import { get_direction, localize } from "./app-localization.js";
import { default_palette, get_winter_palette } from "./color-data.js";
import { image_formats } from "./file-format-data.js";
import { $this_version_news, cancel, change_url_param, clear, confirm_overwrite_capability, delete_selection, deselect, edit_copy, edit_cut, edit_paste, file_new, file_open, file_save, file_save_as, get_tool_by_id, get_uris, image_attributes, image_flip_and_rotate, image_invert_colors, image_stretch_and_skew, load_image_from_uri, make_or_update_undoable, open_from_file, paste, paste_image_from_file, redo, render_history_as_gif, reset_canvas_and_history, reset_file, reset_selected_colors, resize_canvas_and_save_dimensions, resize_canvas_without_saving_dimensions, save_as_prompt, select_all, select_tool, select_tools, set_magnification, show_document_history, show_error_message, show_news, show_resource_load_error_message, toggle_grid, undo, update_canvas_rect, update_disable_aa, update_helper_layer, update_magnified_canvas_size, view_bitmap, write_image_file } from "./functions.js";
import { show_help } from "./help.js";
import { $G, E, TAU, get_file_extension, get_help_folder_icon, is_discord_embed, make_canvas, to_canvas_coords } from "./helpers.js";
import { init_webgl_stuff, rotate } from "./image-manipulation.js";
import { menus } from "./menus.js";
import { showMessageBox } from "./msgbox.js";
import { stopSimulatingGestures } from "./simulate-random-gestures.js";
import { disable_speech_recognition, enable_speech_recognition, trace_and_sketch_stop } from "./speech-recognition.js";
import { localStore } from "./storage.js";
import { get_theme, set_theme } from "./theme.js";
import { TOOL_AIRBRUSH, TOOL_BRUSH, TOOL_CURVE, TOOL_ELLIPSE, TOOL_ERASER, TOOL_LINE, TOOL_PENCIL, TOOL_POLYGON, TOOL_RECTANGLE, TOOL_ROUNDED_RECTANGLE, TOOL_SELECT, tools } from "./tools.js";

// #region Exports

// Q: Why are the exports at the top of the file?
// A: The exports are scattered throughout the file, exactly where they
//    were implicitly being exported before transitioning to ESM.
//    For function declarations at the top level, this means the start of the file.
//    For let/const, this means the line after the declaration.
//    This is a temporary solution to resolve circular dependencies.
//    For instance, $ToolBox uses $left/$right. If $left/$right were exported
//    at the bottom of this file, an error would occur. This is because $ToolBox
//    is instantiated in the middle of this file (but after $left/$right are declared).
// @TODO: Minimize global variables and exports from app.js
window.update_fill_and_stroke_colors_and_lineWidth = update_fill_and_stroke_colors_and_lineWidth;
window.tool_go = tool_go;
window.average_points = average_points;

// #endregion


// #region System Hooks and default implementations

/**
 * @param {string} extension
 * @returns {`.${string}`}
 */
const prependDot = (extension) => `.${extension}`;
/**
 * @param {FileFormat} format
 * @returns {string}
 */
const getMimeType = (format) => "mimeType" in format ? format.mimeType : `application/x-${format.formatID}`;

// Note: JSDoc type annotations don't seem to actually work on window.*
/**
 * @type {SystemHooks}
 * The methods in systemHooks can be overridden by a containing page like 98.js.org which hosts jspaint in a same-origin iframe.
 * This allows integrations like setting the wallpaper as the background of the host page, or saving files to a server.
 * This API may be removed at any time (and perhaps replaced by something based around postMessage)
 * The API is documented in the README.md file.
 */
window.systemHooks = window.systemHooks || {};
/** @type {SystemHooks} */
window.systemHookDefaults = {
	// named to be distinct from various platform APIs (showSaveFilePicker, saveAs, electron's showSaveDialog; and saveFile is too ambiguous)
	// could call it saveFileAs maybe but then it'd be weird that you don't pass in the file directly
	showSaveFileDialog: async ({ formats, defaultFileName, defaultPath, defaultFileFormatID, getBlob, savedCallbackUnreliable, dialogTitle }) => {

		// Note: showSaveFilePicker currently doesn't support suggesting a filename,
		// or retrieving which file type was selected in the dialog (you have to get it (guess it) from the file name)
		// In particular, some formats are ambiguous with the file name, e.g. different bit depths of BMP files.
		// So, it's a tradeoff with the benefit of overwriting on Save.
		// https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
		// Also, if you're using accessibility options Speech Recognition or Eye Gaze Mode,
		// `showSaveFilePicker` fails based on a notion of it not being a "user gesture".
		// `saveAs` will likely also fail on the same basis,
		// but at least in chrome, there's a "Downloads Blocked" icon with a popup where you can say Always Allow.
		// I can't detect when it's allowed or blocked, but `saveAs` has a better chance of working,
		// so in Speech Recognition and Eye Gaze Mode, I set a global flag temporarily to disable File System Access API (window.untrusted_gesture).
		if (window.showSaveFilePicker && !window.untrusted_gesture && enable_fs_access_api) {
			// We can't get the selected file type, not even from newHandle.getFile()
			// so limit formats shown to a set that can all be used by their unique file extensions
			// formats = formats_unique_per_file_extension(formats);
			// OR, show two dialogs, one for the format and then one for the save location.
			const { newFileFormatID } = await save_as_prompt({ dialogTitle, defaultFileName, defaultFileFormatID, formats, promptForName: false });
			const new_format = formats.find((format) => format.formatID === newFileFormatID);
			const blob = await getBlob(new_format && new_format.formatID);
			formats = [new_format];
			let newHandle;
			let newFileName;
			try {
				newHandle = await showSaveFilePicker({
					types: formats.map((format) => {
						return {
							description: format.name,
							accept: {
								[getMimeType(format)]: format.extensions.map(prependDot),
							},
						};
					}),
				});
				newFileName = newHandle.name;
				const newFileExtension = get_file_extension(newFileName);
				const doItAgain = async (message) => {
					const button_value = await showMessageBox({
						message: `${message}\n\nTry adding .${new_format.extensions[0]} to the name. Sorry about this.`,
						iconID: "error",
						buttons: [
							{
								label: localize("Save As"), // or "Retry"
								value: "show-save-as-dialog-again",
								default: true,
							},
							{
								label: localize("Save"), // or "Ignore"
								value: "save-without-extension",
							},
							{
								label: localize("Cancel"), // or "Abort"
								value: "cancel",
							},
						],
					});
					if (button_value === "show-save-as-dialog-again") {
						return window.systemHookDefaults.showSaveFileDialog({
							formats,
							defaultFileName,
							defaultPath,
							defaultFileFormatID,
							getBlob,
							savedCallbackUnreliable,
							dialogTitle,
						});
					} else if (button_value === "save-without-extension") {
						// @TODO: DRY
						const writableStream = await newHandle.createWritable();
						await writableStream.write(blob);
						await writableStream.close();
						savedCallbackUnreliable?.({
							newFileName: newFileName,
							newFileFormatID: new_format && new_format.formatID,
							newFileHandle: newHandle,
							newBlob: blob,
						});
					} else {
						// user canceled save
					}
				};
				if (!newFileExtension) {
					// return await doItAgain(`Missing file extension.`);
					return await doItAgain(`'${newFileName}' doesn't have an extension.`);
				}
				if (!new_format.extensions.includes(newFileExtension)) {
					// Closest translation: "Paint cannot save to the same filename with a different file type."
					// return await doItAgain(`Wrong file extension for selected file type.`);
					return await doItAgain(`File extension '.${newFileExtension}' does not match the selected file type ${new_format.name}.`);
				}
				// const new_format =
				// 	get_format_from_extension(formats, newHandle.name) ||
				// 	formats.find((format)=> format.formatID === defaultFileFormatID);
				// const blob = await getBlob(new_format && new_format.formatID);
				const writableStream = await newHandle.createWritable();
				await writableStream.write(blob);
				await writableStream.close();
			} catch (error) {
				if (error.name === "AbortError") {
					// user canceled save
					return;
				}
				// console.warn("Error during showSaveFileDialog (for showSaveFilePicker; now falling back to saveAs)", error);
				// newFileName = (newFileName || file_name || localize("untitled"))
				// 	.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/i, "") +
				// 	"." + new_format.extensions[0];
				// saveAs(blob, newFileName);
				if (error.message.match(/gesture|activation/)) {
					// show_error_message("Your browser blocked the file from being saved, because you didn't use the mouse or keyboard directly to save. Try looking for a Downloads Blocked icon and say Always Allow, or save again with the keyboard or mouse.", error);
					show_error_message("Sorry, due to browser security measures, you must use the keyboard or mouse directly to save.");
					return;
				}
				show_error_message(localize("Failed to save document."), error);
				return;
			}
			savedCallbackUnreliable?.({
				newFileName: newFileName,
				newFileFormatID: new_format && new_format.formatID,
				newFileHandle: newHandle,
				newBlob: blob,
			});
		} else {

			const { newFileName, newFileFormatID } = await save_as_prompt({ dialogTitle, defaultFileName, defaultFileFormatID, formats });
			const blob = await getBlob(newFileFormatID);
			saveAs(blob, newFileName);
			savedCallbackUnreliable?.({
				newFileName,
				newFileFormatID,
				newFileHandle: null,
				newBlob: blob,
			});
		}
	},
	showOpenFileDialog: async ({ formats }) => {
		if (window.untrusted_gesture) {
			// We can't show a file picker RELIABLY.
			show_error_message("Sorry, a file picker cannot be shown when using Speech Recognition or Eye Gaze Mode. You must click File > Open directly with the mouse, or press Ctrl+O on the keyboard.");
			throw new Error("can't show file picker reliably");
		}
		if (window.showOpenFilePicker && enable_fs_access_api) {
			const [fileHandle] = await window.showOpenFilePicker({
				types: formats.map((format) => {
					return {
						description: format.name,
						accept: {
							[getMimeType(format)]: format.extensions.map(prependDot),
						},
					};
				}),
			});
			const file = await fileHandle.getFile();
			return { file, fileHandle };
		} else {
			// @TODO: specify mime types?
			return new Promise((resolve) => {
				const $input = /** @type {JQuery<HTMLInputElement>} */($("<input type='file'>")
					.on("change", () => {
						resolve({ file: $input[0].files[0] });
						$input.remove();
					})
					.appendTo($app)
					.hide()
					.trigger("click")
				);
			});
		}
	},
	writeBlobToHandle: async (save_file_handle, blob) => {
		if (save_file_handle && save_file_handle.createWritable && enable_fs_access_api) {
			const acknowledged = await confirm_overwrite_capability();
			if (!acknowledged) {
				return false;
			}
			try {
				const writableStream = await save_file_handle.createWritable();
				await writableStream.write(blob);
				await writableStream.close();
				return true;
			} catch (error) {
				if (error.name === "AbortError") {
					// user canceled save (this might not be a real error code that can occur here)
					return false;
				}
				if (error.name === "NotAllowedError") {
					// use didn't give permission to save
					// is this too much of a warning?
					show_error_message(localize("Save was interrupted, so your file has not been saved."), error);
					return false;
				}
				if (error.name === "SecurityError") {
					// not in a user gesture ("User activation is required to request permissions.")
					saveAs(blob, file_name);
					return undefined;
				}
			}
		} else {
			saveAs(blob, file_name);
			// hopefully if the page reloads/closes the save dialog/download will persist and succeed?
			return undefined;
		}
	},
	readBlobFromHandle: async (file_handle) => {
		if (file_handle && file_handle.getFile) {
			const file = await file_handle.getFile();
			return file;
		} else {
			throw new Error(`Unknown file handle (${file_handle})`);
			// show_error_message(`${localize("Failed to open document.")}\n${localize("An unsupported operation was attempted.")}`, error);
		}
	},
	setWallpaperTiled: (canvas) => {
		const wallpaperCanvas = make_canvas(screen.width, screen.height);
		const pattern = wallpaperCanvas.ctx.createPattern(canvas, "repeat");
		wallpaperCanvas.ctx.fillStyle = pattern;
		wallpaperCanvas.ctx.fillRect(0, 0, wallpaperCanvas.width, wallpaperCanvas.height);

		systemHooks.setWallpaperCentered(wallpaperCanvas);
	},
	setWallpaperCentered: (canvas) => {
		systemHooks.showSaveFileDialog({
			dialogTitle: localize("Save As"),
			defaultFileName: `${file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/i, "")} wallpaper.png`,
			defaultFileFormatID: "image/png",
			formats: image_formats,
			getBlob: (new_file_type) => {
				return new Promise((resolve) => {
					write_image_file(canvas, new_file_type, (blob) => {
						resolve(blob);
					});
				});
			},
		});
	},
};

for (const [key, defaultValue] of Object.entries(window.systemHookDefaults)) {
	window.systemHooks[key] = window.systemHooks[key] || defaultValue;
}

// #endregion

// #region URL Params
const update_from_url_params = () => {
	if (location.hash.match(/eye-gaze-mode/i)) {
		if (!$("body").hasClass("eye-gaze-mode")) {
			$("body").addClass("eye-gaze-mode");
			$G.triggerHandler("eye-gaze-mode-toggled");
			$G.triggerHandler("theme-load"); // signal layout change
		}
	} else {
		if ($("body").hasClass("eye-gaze-mode")) {
			$("body").removeClass("eye-gaze-mode");
			$G.triggerHandler("eye-gaze-mode-toggled");
			$G.triggerHandler("theme-load"); // signal layout change
		}
	}

	if (location.hash.match(/vertical-color-box-mode|eye-gaze-mode/i)) {
		if (!$("body").hasClass("vertical-color-box-mode")) {
			$("body").addClass("vertical-color-box-mode");
			$G.triggerHandler("vertical-color-box-mode-toggled");
			$G.triggerHandler("theme-load"); // signal layout change
		}
	} else {
		if ($("body").hasClass("vertical-color-box-mode")) {
			$("body").removeClass("vertical-color-box-mode");
			$G.triggerHandler("vertical-color-box-mode-toggled");
			$G.triggerHandler("theme-load"); // signal layout change
		}
	}

	if (location.hash.match(/speech-recognition-mode/i)) {
		enable_speech_recognition();
	} else {
		disable_speech_recognition();
	}

	$("body").toggleClass("compare-reference", !!location.hash.match(/compare-reference/i));
	$("body").toggleClass("compare-reference-tool-windows", !!location.hash.match(/compare-reference-tool-windows/i));
	setTimeout(() => {
		if (location.hash.match(/compare-reference/i)) { // including compare-reference-tool-windows
			select_tool(get_tool_by_id(TOOL_SELECT));
			const test_canvas_width = 576;
			const test_canvas_height = 432;
			if (main_canvas.width !== test_canvas_width || main_canvas.height !== test_canvas_height) {
				// Unfortunately, right now this can cause a reverse "Save changes?" dialog,
				// where Discard will restore your drawing, Cancel will discard it, and Save will save a blank canvas,
				// because the load from storage happens after this resize.
				// But this is just a helper for development, so it's not a big deal.
				// are_you_sure here doesn't help, either.
				// are_you_sure(() => {
				resize_canvas_without_saving_dimensions(test_canvas_width, test_canvas_height);
				// });
			}
			if (!location.hash.match(/compare-reference-tool-windows/i)) {
				$toolbox.dock($left);
				$colorbox.dock($bottom);
				window.debugKeepMenusOpen = false;
			}
		}
		if (location.hash.match(/compare-reference-tool-windows/i)) {
			$toolbox.undock_to(84, 35);
			$colorbox.undock_to(239, 195);
			window.debugKeepMenusOpen = true;
			// $(".help-menu-button").click(); // have to trigger pointerdown/up, it doesn't respond to click
			// $(".help-menu-button").trigger("pointerdown").trigger("pointerup"); // and it doesn't use jQuery
			$(".help-menu-button")[0].dispatchEvent(new Event("pointerdown"));
			$(".help-menu-button")[0].dispatchEvent(new Event("pointerup"));
			$("[aria-label='About Paint']")[0].dispatchEvent(new Event("pointerenter"));
		}
	}, 500);
};
update_from_url_params();
$G.on("hashchange popstate change-url-params", update_from_url_params);

// handle backwards compatibility URLs
if (location.search.match(/eye-gaze-mode/)) {
	change_url_param("eye-gaze-mode", true, { replace_history_state: true });
	update_from_url_params();
}
if (location.search.match(/vertical-colors?-box/)) {
	change_url_param("vertical-color-box", true, { replace_history_state: true });
	update_from_url_params();
}

// #endregion

// #region App UI

const $app = $(E("div")).addClass("jspaint").appendTo("body");
window.$app = $app;

const $V = $(E("div")).addClass("vertical").appendTo($app);
const $H = $(E("div")).addClass("horizontal").appendTo($V);

const $canvas_area = $(E("div")).addClass("canvas-area inset-deep").appendTo($H);
window.$canvas_area = $canvas_area;

const $canvas = $(main_canvas).appendTo($canvas_area);
window.$canvas = $canvas;
$canvas.css("touch-action", "none");
window.canvas_bounding_client_rect = main_canvas.getBoundingClientRect(); // cached for performance, updated later
const canvas_handles = new Handles({
	$handles_container: $canvas_area,
	$object_container: $canvas_area,
	get_rect: () => ({ x: 0, y: 0, width: main_canvas.width, height: main_canvas.height }),
	set_rect: ({ width, height }) => resize_canvas_and_save_dimensions(width, height),
	outset: 4,
	get_handles_offset_left: () => parseFloat($canvas_area.css("padding-left")) + 1,
	get_handles_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
	get_ghost_offset_left: () => parseFloat($canvas_area.css("padding-left")) + 1,
	get_ghost_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
	size_only: true,
});
window.canvas_handles = canvas_handles;

const $top = $(E("div")).addClass("component-area top").prependTo($V);
window.$top = $top;
const $bottom = $(E("div")).addClass("component-area bottom").appendTo($V);
window.$bottom = $bottom;
const $left = $(E("div")).addClass("component-area left").prependTo($H);
window.$left = $left;
const $right = $(E("div")).addClass("component-area right").appendTo($H);
window.$right = $right;


// there's also probably a CSS solution alternative to this
if (get_direction() === "rtl") {
	$left.appendTo($H);
	$right.prependTo($H);
}

// #endregion
// (arguably still App UI stuff below, but it becomes a fuzzy line later on)

// #region Status Bar
const $status_area = $(E("div")).addClass("status-area").appendTo($V);
window.$status_area = $status_area;
const $status_text = /** @type {JQuery<HTMLDivElement> & {default: ()=> void}} */($(E("div")).addClass("status-text status-field inset-shallow").appendTo($status_area));
window.$status_text = $status_text;
const $status_position = $(E("div")).addClass("status-coordinates status-field inset-shallow").appendTo($status_area);
window.$status_position = $status_position;
const $status_size = $(E("div")).addClass("status-coordinates status-field inset-shallow").appendTo($status_area);
window.$status_size = $status_size;

// #region News Indicator
const news_seen_key = "jspaint latest news seen";
const latest_news_datetime = $this_version_news.find("time").attr("datetime");
const $news_indicator = $(`
	<a class="news-indicator" href="#project-news">
		<!--<img src="images/winter/present.png" width="24" height="22" alt=""/>-->
		<img src="images/about/news.gif" width="40" height="16" alt="" style="filter: hue-rotate(234deg);"/>
		<!--<img src="images/new.gif" width="40" height="16" alt=""/>-->
		<!--<span class="marquee" dir="ltr" style="--text-width: 44ch; --animation-duration: 3s;">
			<span>
				<b>Cool new things</b> — One thing! Another thing! Something else!
			</span>
		</span>-->
		<span>
			<b>Bubblegum theme</b>
		</span>
	</a>
`);
$news_indicator.on("click auxclick", (event) => {
	event.preventDefault();
	show_news();
	$news_indicator.remove();
	try {
		localStorage[news_seen_key] = latest_news_datetime;
	} catch (_error) { /* ignore */ }
});
let news_seen;
let local_storage_unavailable;
try {
	news_seen = localStorage[news_seen_key];
} catch (_error) {
	local_storage_unavailable = true;
}
const day = 24 * 60 * 60 * 1000;
const news_period_if_can_dismiss = 15 * day;
const news_period_if_cannot_dismiss = 5 * day;
const news_period = local_storage_unavailable ? news_period_if_cannot_dismiss : news_period_if_can_dismiss;
if (Date.now() < Date.parse(latest_news_datetime) + news_period && news_seen !== latest_news_datetime) {
	$status_area.append($news_indicator);
}
if ($news_indicator.text().includes("Bubblegum")) {
	let bubbles_raf_id = -1;
	const bubbles = [];
	const make_bubble = () => {
		const $bubble = $(E("img")).attr({
			src: "images/bubblegum/bubble.png",
			width: 24,
			height: 24,
			alt: "",
		}).css({
			position: "absolute",
			pointerEvents: "none",
			top: 0,
			left: 0,
			zIndex: 10,
		}).appendTo("body");
		const rect = $news_indicator[0].getBoundingClientRect();
		const x = rect.left + Math.random() * rect.width;
		const y = rect.top + rect.height;
		const scale = Math.random() * 0.5 + 0.5;
		const bubble = { $bubble, x, y, scale, vx: Math.random() * 2 - 1, vy: -Math.random() * 2 };
		bubbles.push(bubble);
		if (bubbles_raf_id === -1) {
			animate_bubbles();
		}
		setTimeout(() => {
			$bubble.remove();
			bubbles.splice(bubbles.indexOf(bubble), 1);
			if (bubbles.length === 0) {
				cancelAnimationFrame(bubbles_raf_id);
				bubbles_raf_id = -1;
			}
		}, 10000);
	};
	let last_time = performance.now();
	const animate_bubbles = () => {
		bubbles_raf_id = requestAnimationFrame(animate_bubbles);
		const now = performance.now();
		const dt = now - last_time;
		for (const bubble of bubbles) {
			// not actually frame rate independent physics, I don't think
			bubble.x += bubble.vx * dt / 16;
			bubble.y += bubble.vy * dt / 16;
			const wind_x = Math.sin(bubble.y / 100 + now / 3000) * 0.01;
			const wind_y = Math.cos(bubble.x / 100 + now / 3000) * 0.01;
			bubble.vx += wind_x;
			bubble.vy += wind_y;
			bubble.$bubble.css({
				transform: `translate(${bubble.x}px, ${bubble.y}px) scale(${bubble.scale})`,
			});
		}
		last_time = now;
	};
	$news_indicator.on("pointerenter", () => {
		for (let i = 0; i < 10; i++) {
			setTimeout(make_bubble, i * 100);
		}
	});
	$news_indicator.on("pointerdown", () => {
		for (let i = 0; i < 50; i++) {
			setTimeout(make_bubble, i * 1);
		}
	});
}
// #endregion

$status_text.default = () => {
	$status_text.text(localize("For Help, click Help Topics on the Help Menu."));
};
$status_text.default();

// #endregion

// #region Menu Bar
let menu_bar_outside_frame = false;
if (frameElement) {
	try {
		if (parent.MenuBar) {
			// @ts-ignore
			MenuBar = parent.MenuBar;
			menu_bar_outside_frame = true;
		}
	} catch (_error) { /* ignore */ }
}
const menu_bar = MenuBar(menus);
window.menu_bar = menu_bar;
if (menu_bar_outside_frame) {
	$(menu_bar.element).insertBefore(frameElement);
} else {
	$(menu_bar.element).prependTo($V);
}

$(menu_bar.element).on("info", (event) => {
	// @ts-ignore
	$status_text.text(event.detail?.description ?? "");
});
$(menu_bar.element).on("default-info", () => {
	$status_text.default();
});

// Hidden in a menu, these GIFs are not as obtrusive even though they can't be dismissed
const theme_updated_period = 20 * day;
const theme_new_period = 40 * day;
const theme_soon_period = 40 * day;
if (Date.now() < Date.parse("2024-02-22") + theme_new_period) {
	$("[role=menuitem][aria-label*='Modern Dark'] .menu-item-shortcut").append("<img src='images/new2.gif' alt='New!'/>");
}
if (Date.now() < Date.parse("2024-02-24") + theme_soon_period) {
	// $("[role=menuitem][aria-label*='Bubblegum'] .menu-item-shortcut").append("<img src='images/soon-twist-anim.gif' alt='Coming Soon!' class='too-big-soon-gif'/>");
	// $("[role=menuitem][aria-label*='Retro Futurist'] .menu-item-shortcut").append("<img src='images/soon.gif' alt='Coming Soon!'/>");
	// $("[role=menuitem][aria-label*='Picnic'] .menu-item-shortcut").append("<img src='images/soon.gif' alt='Coming Soon!'/>");
}
if (Date.now() < Date.parse("2024-02-22") + theme_updated_period) {
	$("[role=menuitem][aria-label*='Modern Light'] .menu-item-shortcut").append("<img src='images/updated.gif' alt='Updated!'/>");
	$("[role=menuitem][aria-label*='Classic Dark'] .menu-item-shortcut").append("<img src='images/updated.gif' alt='Updated!'/>");
	$("[role=menuitem][aria-label*='Occult'] .menu-item-shortcut").append("<img src='images/updated.gif' alt='Updated!'/>");
}

// Extras menu emoji icons
// (OS-GUI.js doesn't support icons yet but I wanted to spruce it up a bit.)
// Originally I defined the emoji as part of the label, which worked well for a while.
// Now I'm rendering the emoji as pseudo elements.
// - It allows for matching on the menu item text exactly, without including emoji in my tests,
//   which will hopefully be replaced with custom icons in the future.
// - It makes it easier to replace the emoji with custom icons in the future.
// - It hides the emoji from `aria-label`, for screen reader users.
// - It makes the menu data cleaner.
// - It allows aligning the emoji nicely, even when some don't show as emoji, depending on the platform.

/**
 * @param {OSGUIMenuFragment[]} menu_items
 * @param {HTMLElement} menu_element
 * @yields {[OSGUIMenuItem, HTMLElement]}
 * @returns {Generator<[OSGUIMenuItem, HTMLElement], void, void>}
 */
function* traverse_menu(menu_items, menu_element) {
	// Traverse menu data and elements in tandem, yielding pairs of menu item specifications and elements.
	// This approach handles identically named menu items in separate menus,
	// as is the case with "File > Manage Storage" and "Edit > History", both present in the Extras menu,
	// but also in the other menus for discoverability.
	// However, it doesn't handle identically named menu items in the same menu,
	// as it still matches up items within the menu using aria-label.

	// Menu structure:
	// - Menu popups are not descendants of the menu bar or other menu popups; they are always direct children of the body.
	// - Menu items that open submenus have "aria-controls" pointing to the ID of the submenu.
	// - (Menu popups also have "data-semantic-parent" pointing to the ID of the menu item that opens them.)
	// - `submenu` is an array, but the top level (menu bar) is represented as an object, which is a bit awkward.
	//   However, this function doesn't deal with the top level.

	const menu_item_elements = /** @type {HTMLElement[]} */([...menu_element.querySelectorAll(".menu-item")]);
	for (const menu_item of menu_items) {
		if (typeof menu_item !== "object" || !("label" in menu_item)) {
			continue;
		}
		const aria_label = AccessKeys.toText(menu_item.label);
		const menu_item_element = menu_item_elements.filter((el) =>
			el.getAttribute("aria-label") === aria_label
		)[0];
		if (!menu_item_element) {
			console.warn("Couldn't find menu item", menu_item, "with aria-label", aria_label);
			continue;
		}
		yield [menu_item, menu_item_element];
		if (menu_item.submenu) {
			yield* traverse_menu(menu_item.submenu, document.getElementById(menu_item_element.getAttribute("aria-controls")));
		}
		// if (menu_item.radioItems) {
		// 	yield* traverse_menu(menu_item.radioItems, menu_element);
		// }
	}
}

const menu_document = menu_bar.element.ownerDocument;
const extras_menu_button = menu_document.querySelector(".extras-menu-button");
const extras_menu_popup = menu_document.getElementById(extras_menu_button.getAttribute("aria-controls"));

let emoji_css = `
	.menu-item .menu-item-label::before {
		display: inline-block;
		width: 1.8em;
		margin-right: 0.2em;
		text-align: center;
	}
`;
for (const [menu_item, menu_item_element] of traverse_menu(menus["E&xtras"], extras_menu_popup)) {
	if (menu_item.emoji_icon) {
		emoji_css += `
			#${menu_item_element.id} .menu-item-label::before {
				content: "${menu_item.emoji_icon}";
			}
		`;
	}
}
$("<style>").text(emoji_css).appendTo("head");

// Electron menu integration
if (window.is_electron_app) {
	window.setMenus(menus);
}

// #endregion

let $toolbox = $ToolBox(tools);
window.$toolbox = $toolbox;
// let $toolbox2 = $ToolBox(extra_tools, true);//.hide();
// Note: a second $ToolBox doesn't work because they use the same tool options (which could be remedied)
// If there's to be extra tools, they should probably get a window, with different UI
// so it can display names of the tools, and maybe authors and previews (and not necessarily icons)

let $colorbox = $ColorBox($("body").hasClass("vertical-color-box-mode"));
window.$colorbox = $colorbox;

$G.on("vertical-color-box-mode-toggled", () => {
	$colorbox.destroy();
	$colorbox = $ColorBox($("body").hasClass("vertical-color-box-mode"));
	window.$colorbox = $colorbox;
	prevent_selection($colorbox);
});
$G.on("eye-gaze-mode-toggled", () => {
	$colorbox.destroy();
	$colorbox = $ColorBox($("body").hasClass("vertical-color-box-mode"));
	window.$colorbox = $colorbox;
	prevent_selection($colorbox);

	$toolbox.destroy();
	$toolbox = $ToolBox(tools);
	window.$toolbox = $toolbox;
	prevent_selection($toolbox);

	// $toolbox2.destroy();
	// $toolbox2 = $ToolBox(extra_tools, true);
	// prevent_selection($toolbox2);
});


$G.on("resize", () => { // for browser zoom, and in-app zoom of the canvas
	update_canvas_rect();
	update_disable_aa();
});
$canvas_area.on("scroll", () => {
	update_canvas_rect();
});
$canvas_area.on("resize", () => {
	update_magnified_canvas_size();
});

// Despite overflow:hidden on html and body,
// focusing elements that are partially offscreen can still scroll the page.
// For example, with Edit Colors dialog partially offscreen, navigating the color grid.
// We need to prevent (reset) scroll on focus, and also avoid scrollIntoView().
// Listening for scroll here is mainly in case a case is forgotten, like scrollIntoView,
// in which case it will flash sometimes but at least not end up with part of
// the application scrolled off the screen with no scrollbar to get it back.
$G.on("scroll focusin", () => {
	window.scrollTo(0, 0);
});

// #region Drag and Drop

// jQuery's multiple event handling is not that useful in the first place, but when adding type info... it's downright ugly.
$("body").on("dragover dragenter", (/** @type {JQuery.DragOverEvent | JQuery.DragEnterEvent} */event) => {
	const dt = event.originalEvent.dataTransfer;
	const has_files = dt && Array.from(dt.types).includes("Files");
	if (has_files) {
		event.preventDefault();
	}
}).on("drop", async (event) => {
	if (event.isDefaultPrevented()) {
		return;
	}
	const dt = event.originalEvent.dataTransfer;
	const has_files = dt && Array.from(dt.types).includes("Files");
	if (has_files) {
		event.preventDefault();
		// @TODO: sort files/items in priority of image, theme, palette
		// and then try loading them in series, with async await to avoid race conditions?
		// or maybe support opening multiple documents in tabs
		// Note: don't use FS Access API in Electron app because:
		// 1. it's faulty (permissions problems, 0 byte files maybe due to the perms problems)
		// 2. we want to save the file.path, which the dt.files code path takes care of
		if (window.FileSystemHandle && !window.is_electron_app) {
			for (const item of dt.items) {
				// kind will be "file" for file/directory entries.
				if (item.kind === "file") {
					let handle;
					try {
						// Experimental API, not supported on Firefox as of 2024-02-17
						if ("getAsFileSystemHandle" in item) {
							// @ts-ignore
							handle = await item.getAsFileSystemHandle();
						}
					} catch (error) {
						// I'm not sure when this happens.
						// should this use "An invalid file handle was associated with %1." message?
						show_error_message(localize("File not found."), error);
						return;
					}
					if (!handle || handle.kind === "file") {
						let file;
						try {
							// instanceof is for the type checker; it should be guaranteed since kind is "file"
							if (handle && handle instanceof FileSystemFileHandle) {
								file = await handle.getFile();
							} else {
								file = item.getAsFile();
							}
						} catch (error) {
							// NotFoundError can happen when the file was moved or deleted,
							// then dragged and dropped via the browser's downloads bar, or some other outdated file listing.
							show_error_message(localize("File not found."), error);
							return;
						}
						open_from_file(file, handle);
						if (window._open_images_serially) {
							// For testing a suite of files:
							await new Promise((resolve) => setTimeout(resolve, 500));
						} else {
							// Normal behavior: only open one file.
							return;
						}
					}
					// else if (handle.kind === "directory") {}
				}
			}
		} else if (dt.files && dt.files.length) {
			if (window._open_images_serially) {
				// For testing a suite of files, such as http://www.schaik.com/pngsuite/
				let i = 0;
				const iid = setInterval(() => {
					console.log("opening", dt.files[i].name);
					open_from_file(dt.files[i]);
					i++;
					if (i >= dt.files.length) {
						clearInterval(iid);
					}
				}, 1500);
			} else {
				// Normal behavior: only open one file.
				open_from_file(dt.files[0]);
			}
		}
	}
});

// #endregion

// #region Keyboard Shortcuts
$G.on("keydown", (e) => {
	// typecast to HTMLElement because e.target is incorrectly given as Window, due to $G wrapping window
	const target = /** @type {HTMLElement} */ (/** @type {unknown} */ (e.target));

	if (e.isDefaultPrevented()) {
		return;
	}
	if (e.key === "Escape") { // Note: Escape handled below too! (after input/textarea return condition)
		if (textbox && textbox.$editor.is(target)) {
			deselect();
		}
	}
	if (
		// Ctrl+Shift+Y for history window,
		// chosen because it's related to the undo/redo shortcuts
		// and it looks like a branching symbol.
		(e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey &&
		e.key.toUpperCase() === "Y"
	) {
		show_document_history();
		e.preventDefault();
		return;
	}
	// @TODO: return if menus/menubar focused or focus in dialog window
	// or maybe there's a better way to do this that works more generally
	// maybe it should only handle the event if document.activeElement is the body or html element?
	// (or $app could have a tabIndex and no focus style and be focused under various conditions,
	// if that turned out to make more sense for some reason)
	if (
		e.target instanceof HTMLInputElement ||
		e.target instanceof HTMLTextAreaElement
	) {
		return;
	}

	// @TODO: preventDefault in all cases where the event is handled
	// also, ideally check that modifiers *aren't* pressed
	// probably best to use a library at this point!

	if (selection) {
		const nudge_selection = (delta_x, delta_y) => {
			selection.x += delta_x;
			selection.y += delta_y;
			selection.position();
		};
		switch (e.key) {
			case "ArrowLeft":
				nudge_selection(-1, 0);
				e.preventDefault();
				break;
			case "ArrowRight":
				nudge_selection(+1, 0);
				e.preventDefault();
				break;
			case "ArrowDown":
				nudge_selection(0, +1);
				e.preventDefault();
				break;
			case "ArrowUp":
				nudge_selection(0, -1);
				e.preventDefault();
				break;
		}
	}

	if (e.key === "Escape") { // Note: Escape handled above too!
		if (selection) {
			deselect();
		} else {
			cancel();
		}
		stopSimulatingGestures();
		trace_and_sketch_stop();
	} else if (e.key === "Enter") {
		if (selection) {
			deselect();
		}
	} else if (e.key === "F1") {
		show_help();
		e.preventDefault();
	} else if (e.key === "F4") {
		redo();
	} else if (e.key === "Delete" || e.key === "Backspace") {
		// alt+backspace: undo
		// shift+delete: cut
		// delete/backspace: delete selection
		if (e.key === "Delete" && e.shiftKey) {
			edit_cut();
		} else if (e.key === "Backspace" && e.altKey) {
			undo();
		} else {
			delete_selection();
		}
		e.preventDefault();
	} else if (e.key === "Insert") {
		// ctrl+insert: copy
		// shift+insert: paste
		if (e.ctrlKey) {
			edit_copy();
			e.preventDefault();
		} else if (e.shiftKey) {
			edit_paste();
			e.preventDefault();
		}
	} else if (
		e.code === "NumpadAdd" ||
		e.code === "NumpadSubtract" ||
		// normal + and - keys
		e.key === "+" ||
		e.key === "-" ||
		e.key === "="
	) {
		const plus = e.code === "NumpadAdd" || e.key === "+" || e.key === "=";
		const minus = e.code === "NumpadSubtract" || e.key === "-";
		const delta = Number(plus) - Number(minus); // const delta = +plus++ -minus--; // Δ = ±±±±

		if (selection) {
			selection.scale(2 ** delta);
		} else {
			if (selected_tool.id === TOOL_BRUSH) {
				brush_size = Math.max(1, Math.min(brush_size + delta, 500));
			} else if (selected_tool.id === TOOL_ERASER) {
				eraser_size = Math.max(1, Math.min(eraser_size + delta, 500));
			} else if (selected_tool.id === TOOL_AIRBRUSH) {
				airbrush_size = Math.max(1, Math.min(airbrush_size + delta, 500));
			} else if (selected_tool.id === TOOL_PENCIL) {
				pencil_size = Math.max(1, Math.min(pencil_size + delta, 50));
			} else if (
				selected_tool.id === TOOL_LINE ||
				selected_tool.id === TOOL_CURVE ||
				selected_tool.id === TOOL_RECTANGLE ||
				selected_tool.id === TOOL_ROUNDED_RECTANGLE ||
				selected_tool.id === TOOL_ELLIPSE ||
				selected_tool.id === TOOL_POLYGON
			) {
				stroke_size = Math.max(1, Math.min(stroke_size + delta, 500));
			}

			$G.trigger("option-changed");
			if (button !== undefined && pointer) { // pointer may only be needed for tests
				selected_tools.forEach((selected_tool) => {
					tool_go(selected_tool);
				});
			}
			update_helper_layer();
		}
		e.preventDefault();
		return;
	} else if (e.ctrlKey || e.metaKey) {
		if (textbox) {
			switch (e.key.toUpperCase()) {
				case "A":
				case "Z":
				case "Y":
				case "I":
				case "B":
				case "U":
					// Don't prevent the default. Allow text editing commands.
					return;
			}
		}
		// Ctrl+PageDown: zoom to 400%
		// Ctrl+PageUp: zoom to 100%
		// In Chrome and Firefox, these switch to the next/previous tab,
		// but it's allowed to be overridden in fullscreen in Chrome.
		if (e.key === "PageDown") {
			set_magnification(4);
			e.preventDefault();
			return;
		} else if (e.key === "PageUp") {
			set_magnification(1);
			e.preventDefault();
			return;
		}
		switch (e.key.toUpperCase()) {
			case ",": // "<" without Shift
			case "<":
			case "[":
			case "{":
				rotate(-TAU / 4);
				break;
			case ".": // ">" without Shift
			case ">":
			case "]":
			case "}":
				rotate(+TAU / 4);
				break;
			case "Z":
				if (e.shiftKey) {
					redo();
				} else {
					undo();
				}
				break;
			case "Y":
				// Ctrl+Shift+Y handled above
				redo();
				break;
			case "G":
				if (e.shiftKey) {
					render_history_as_gif();
				} else {
					toggle_grid();
				}
				break;
			case "F":
				// @ts-ignore (repeat doesn't exist on jQuery.Event, I guess, but this is fine)
				if (!e.repeat && !e.originalEvent?.repeat) {
					view_bitmap();
				}
				break;
			case "O":
				file_open();
				break;
			case "S":
				if (e.shiftKey) {
					file_save_as();
				} else {
					file_save();
				}
				break;
			case "A":
				select_all();
				break;
			case "I":
				image_invert_colors();
				break;
			case "E":
				image_attributes();
				break;

			// These shortcuts are mostly reserved by browsers,
			// but they are allowed in Electron.
			// The shortcuts are hidden in the menus (or changed) when not in Electron,
			// to prevent accidental closing/refreshing.
			// I'm supporting Alt+<shortcut> here (implicitly) as a workaround (and showing this in the menus in some cases).
			// Also, note that Chrome allows some shortcuts to be overridden in fullscreen (but showing/hiding the shortcuts would be confusing).
			case "N":
				if (e.shiftKey) {
					clear();
				} else {
					file_new();
				}
				break;
			case "T":
				$toolbox.toggle();
				break;
			case "L": // allowed to override in Firefox
				$colorbox.toggle();
				break;
			case "R":
				image_flip_and_rotate();
				break;
			case "W":
				image_stretch_and_skew();
				break;

			default:
				return; // don't preventDefault
		}
		e.preventDefault();
		// put nothing below! note return above
	}
});
// #endregion

// #region Alt+Mousewheel Zooming (and also some dev helper that I haven't used in years)
let alt_zooming = false;
addEventListener("keyup", (e) => {
	if (e.key === "Alt" && alt_zooming) {
		e.preventDefault(); // prevent menu bar from activating in Firefox from zooming
	}
	if (!e.altKey) {
		alt_zooming = false;
	}
});
// $G.on("wheel", (e) => {
addEventListener("wheel", (e) => {
	if (e.altKey) {
		e.preventDefault();
		let new_magnification = magnification;
		if (e.deltaY < 0) {
			new_magnification *= 1.5;
		} else {
			new_magnification /= 1.5;
		}
		new_magnification = Math.max(0.5, Math.min(new_magnification, 80));
		set_magnification(new_magnification, to_canvas_coords(e));
		alt_zooming = true;
		return;
	}
	if (e.ctrlKey || e.metaKey) {
		return;
	}
	// for reference screenshot mode (development helper):
	if (location.hash.match(/compare-reference/i)) { // including compare-reference-tool-windows
		// const delta_opacity = Math.sign(e.originalEvent.deltaY) * -0.1; // since attr() is not supported other than for content, this increment must match CSS
		const delta_opacity = Math.sign(e.deltaY) * -0.2; // since attr() is not supported other than for content, this increment must match CSS
		let old_opacity = parseFloat($("body").attr("data-reference-opacity"));
		if (!isFinite(old_opacity)) {
			old_opacity = 0.5;
		}
		const new_opacity = Math.max(0, Math.min(1, old_opacity + delta_opacity));
		$("body").attr("data-reference-opacity", new_opacity);
		// prevent scrolling, keeping the screenshot lined up
		// e.preventDefault(); // doesn't work
		// $canvas_area.scrollTop(0); // doesn't work with smooth scrolling
		// $canvas_area.scrollLeft(0);
	}
}, { passive: false });
// #endregion

// #region Clipboard Handling
$G.on("cut copy paste", (e) => {
	if (e.isDefaultPrevented()) {
		return;
	}
	if (
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement ||
		!window.getSelection().isCollapsed
	) {
		// Don't prevent cutting/copying/pasting within inputs or textareas, or if there's a selection
		return;
	}

	e.preventDefault();
	// @ts-ignore
	const cd = e.originalEvent.clipboardData || window.clipboardData;
	if (!cd) { return; }

	if (e.type === "copy" || e.type === "cut") {
		if (selection && selection.canvas) {
			const do_sync_clipboard_copy_or_cut = () => {
				// works only for pasting within a jspaint instance
				const data_url = selection.canvas.toDataURL();
				cd.setData("text/x-data-uri; type=image/png", data_url);
				cd.setData("text/uri-list", data_url);
				cd.setData("URL", data_url);
				if (e.type === "cut") {
					delete_selection({
						name: localize("Cut"),
						icon: get_help_folder_icon("p_cut.png"),
					});
				}
			};
			if (!navigator.clipboard || !navigator.clipboard.write || is_discord_embed) {
				return do_sync_clipboard_copy_or_cut();
			}
			try {
				if (e.type === "cut") {
					edit_cut();
				} else {
					edit_copy();
				}
			} catch (_error) {
				do_sync_clipboard_copy_or_cut();
			}
		}
	} else if (e.type === "paste") {
		for (const item of cd.items) {
			if (item.type.match(/^text\/(?:x-data-uri|uri-list|plain)|URL$/)) {
				item.getAsString((text) => {
					const uris = get_uris(text);
					if (uris.length > 0) {
						load_image_from_uri(uris[0]).then((info) => {
							paste(info.image || make_canvas(info.image_data));
						}, (error) => {
							show_resource_load_error_message(error);
						});
					} else {
						show_error_message("The information on the Clipboard can't be inserted into Paint.");
					}
				});
				break;
			} else if (item.type.match(/^image\//)) {
				paste_image_from_file(item.getAsFile());
				break;
			}
		}
	}
});
// #endregion

// #region Initialization
// This sort of thing should really be at the END of the file.

reset_file();
reset_selected_colors();
reset_canvas_and_history(); // (with newly reset colors)
set_magnification(default_magnification);

// this is synchronous for now, but @TODO: handle possibility of loading a document before callback
// when switching to asynchronous storage, e.g. with localforage
localStore.get({
	width: default_canvas_width,
	height: default_canvas_height,
}, (err, stored_values) => {
	if (err) { return; }
	my_canvas_width = Number(stored_values.width);
	my_canvas_height = Number(stored_values.height);

	make_or_update_undoable({
		match: (history_node) => history_node.name === localize("New"),
		name: "Resize Canvas For New Document",
		icon: get_help_folder_icon("p_stretch_both.png"),
	}, () => {
		main_canvas.width = Math.max(1, my_canvas_width);
		main_canvas.height = Math.max(1, my_canvas_height);
		main_ctx.disable_image_smoothing();
		if (!transparency) {
			main_ctx.fillStyle = selected_colors.background;
			main_ctx.fillRect(0, 0, main_canvas.width, main_canvas.height);
		}
		$canvas_area.trigger("resize");
	});
});

if (window.initial_system_file_handle) {
	systemHooks.readBlobFromHandle(window.initial_system_file_handle).then((file) => {
		if (file) {
			open_from_file(file, window.initial_system_file_handle);
		}
	}, (error) => {
		// this handler is not always called, sometimes error message is shown from readBlobFromHandle
		show_error_message(`Failed to open file ${window.initial_system_file_handle}`, error);
	});
}
// #endregion

// #region Palette Updating From Theme

const update_palette_from_theme = () => {
	if (get_theme() === "winter.css") {
		palette = get_winter_palette();
		$colorbox.rebuild_palette();
	} else {
		palette = default_palette;
		$colorbox.rebuild_palette();
	}
};

$G.on("theme-load", update_palette_from_theme);
// #region Initialization (continued)
update_palette_from_theme();
// #endregion

// #endregion

function update_fill_and_stroke_colors_and_lineWidth(selected_tool) {
	main_ctx.lineWidth = stroke_size;

	const reverse_because_fill_only = !!(selected_tool.$options && selected_tool.$options.fill && !selected_tool.$options.stroke);
	/** @type {ColorSelectionSlot} */
	const color_k =
		(ctrl && selected_colors.ternary && pointer_active) ? "ternary" :
			((reverse !== reverse_because_fill_only) ? "background" : "foreground");
	main_ctx.fillStyle = fill_color =
		main_ctx.strokeStyle = stroke_color =
		selected_colors[color_k];

	/** @type {ColorSelectionSlot} */
	let fill_color_k =
		ctrl ? "ternary" : ((reverse !== reverse_because_fill_only) ? "background" : "foreground");
	/** @type {ColorSelectionSlot} */
	let stroke_color_k = fill_color_k;

	if (selected_tool.shape || selected_tool.shape_colors) {
		if (!selected_tool.stroke_only) {
			if ((reverse !== reverse_because_fill_only)) {
				fill_color_k = "foreground";
				stroke_color_k = "background";
			} else {
				fill_color_k = "background";
				stroke_color_k = "foreground";
			}
		}
		main_ctx.fillStyle = fill_color = selected_colors[fill_color_k];
		main_ctx.strokeStyle = stroke_color = selected_colors[stroke_color_k];
	}
	pick_color_slot = fill_color_k;
}

// #region Primary Canvas Interaction
function tool_go(selected_tool, event_name) {
	update_fill_and_stroke_colors_and_lineWidth(selected_tool);

	if (selected_tool[event_name]) {
		selected_tool[event_name](main_ctx, pointer.x, pointer.y);
	}
	if (selected_tool.paint) {
		selected_tool.paint(main_ctx, pointer.x, pointer.y);
	}
}
function canvas_pointer_move(e) {
	ctrl = e.ctrlKey;
	shift = e.shiftKey;
	pointer = to_canvas_coords(e);

	// Quick Undo (for mouse/pen)
	// (Note: pointermove also occurs when the set of buttons pressed changes,
	// except when another event would fire like pointerdown)
	if (pointers.length && e.button != -1) {
		// compare buttons other than middle mouse button by using bitwise OR to make that bit of the number the same
		const MMB = 4;
		if (e.pointerType != pointer_type || (e.buttons | MMB) != (pointer_buttons | MMB)) {
			cancel();
			pointer_active = false; // NOTE: pointer_active used in cancel()
			return;
		}
	}

	if (e.shiftKey) {
		// TODO: snap to 45 degrees for Pencil and Polygon tools
		// TODO: manipulating the pointer object directly is a bit of a hack
		if (
			selected_tool.id === TOOL_LINE ||
			selected_tool.id === TOOL_CURVE
		) {
			// snap to eight directions
			const dist = Math.sqrt(
				(pointer.y - pointer_start.y) * (pointer.y - pointer_start.y) +
				(pointer.x - pointer_start.x) * (pointer.x - pointer_start.x)
			);
			const eighth_turn = TAU / 8;
			const angle_0_to_8 = Math.atan2(pointer.y - pointer_start.y, pointer.x - pointer_start.x) / eighth_turn;
			const angle = Math.round(angle_0_to_8) * eighth_turn;
			pointer.x = Math.round(pointer_start.x + Math.cos(angle) * dist);
			pointer.y = Math.round(pointer_start.y + Math.sin(angle) * dist);
		} else if (selected_tool.shape) {
			// snap to four diagonals
			const w = Math.abs(pointer.x - pointer_start.x);
			const h = Math.abs(pointer.y - pointer_start.y);
			if (w < h) {
				if (pointer.y > pointer_start.y) {
					pointer.y = pointer_start.y + w;
				} else {
					pointer.y = pointer_start.y - w;
				}
			} else {
				if (pointer.x > pointer_start.x) {
					pointer.x = pointer_start.x + h;
				} else {
					pointer.x = pointer_start.x - h;
				}
			}
		}
	}
	selected_tools.forEach((selected_tool) => {
		tool_go(selected_tool);
	});
	pointer_previous = pointer;
}
$canvas.on("pointermove", (e) => {
	pointer = to_canvas_coords(e);
	$status_position.text(`${pointer.x},${pointer.y}`);
});
$canvas.on("pointerenter", (e) => {
	pointer_over_canvas = true;

	update_helper_layer(e);

	if (!update_helper_layer_on_pointermove_active) {
		$G.on("pointermove", update_helper_layer);
		update_helper_layer_on_pointermove_active = true;
	}
});
$canvas.on("pointerleave", (e) => {
	pointer_over_canvas = false;

	$status_position.text("");

	update_helper_layer(e);

	if (!pointer_active && update_helper_layer_on_pointermove_active) {
		$G.off("pointermove", update_helper_layer);
		update_helper_layer_on_pointermove_active = false;
	}
});
// #endregion

// #region Panning and Zooming
let last_zoom_pointer_distance;
let pan_last_pos;
// let pan_start_magnification; // for panning and zooming in the same gesture (...was this ever used?)
let first_pointer_time;
const discard_quick_undo_period = 500; // milliseconds in which to treat gesture as just a pan/zoom if you use two fingers, rather than treating it as a brush stroke you might care about
function average_points(points) {
	const average = { x: 0, y: 0 };
	for (const pointer of points) {
		average.x += pointer.x;
		average.y += pointer.y;
	}
	average.x /= points.length;
	average.y /= points.length;
	return average;
}
$canvas_area.on("pointerdown", (event) => {
	if (
		document.activeElement instanceof HTMLElement && // exists and (for type checker:) has blur()
		document.activeElement !== document.body &&
		document.activeElement !== document.documentElement
	) {
		// Allow unfocusing dialogs etc. in order to use keyboard shortcuts
		document.activeElement.blur();
	}

	if (pointers.every((pointer) =>
		// prevent multitouch panning in case of synthetic events from eye gaze mode
		pointer.pointerId !== 1234567890 &&
		// prevent multitouch panning in case of dragging across iframe boundary with a mouse/pen
		// Note: there can be multiple active primary pointers, one per pointer type
		!(pointer.isPrimary && (pointer.pointerType === "mouse" || pointer.pointerType === "pen"))
		// @TODO: handle case of dragging across iframe boundary with touch
	)) {
		pointers.push({
			pointerId: event.pointerId,
			pointerType: event.pointerType,
			// isPrimary not available on jQuery.Event, and originalEvent not available in synthetic case
			// @ts-ignore
			isPrimary: event.originalEvent && event.originalEvent.isPrimary || event.isPrimary,
			x: event.clientX,
			y: event.clientY,
		});
	}
	if (pointers.length === 1) {
		first_pointer_time = performance.now();
	}
	if (pointers.length == 2) {
		last_zoom_pointer_distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
		pan_last_pos = average_points(pointers);
		// pan_start_magnification = magnification;
	}
	// Quick Undo when there are multiple pointers (i.e. for touch)
	// See pointermove for other pointer types
	// SEE OTHER POINTERDOWN HANDLER ALSO
	if (pointers.length >= 2) {
		// If you press two fingers quickly, it shouldn't make a new history entry.
		// But if you draw something and then press a second finger to clear it, it should let you redo.
		const discard_document_state = first_pointer_time && performance.now() - first_pointer_time < discard_quick_undo_period;
		cancel(false, discard_document_state);
		pointer_active = false; // NOTE: pointer_active used in cancel(); must be set after cancel()
		return;
	}
});
$G.on("pointerup pointercancel", (event) => {
	pointers = pointers.filter((pointer) =>
		pointer.pointerId !== event.pointerId
	);
});
$G.on("pointermove", (event) => {
	for (const pointer of pointers) {
		if (pointer.pointerId === event.pointerId) {
			pointer.x = event.clientX;
			pointer.y = event.clientY;
		}
	}
	if (pointers.length >= 2) {
		const current_pos = average_points(pointers);
		const distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
		const difference_in_distance = distance - last_zoom_pointer_distance;
		let new_magnification = magnification;
		if (Math.abs(difference_in_distance) > 60) {
			last_zoom_pointer_distance = distance;
			if (difference_in_distance > 0) {
				new_magnification *= 1.5;
			} else {
				new_magnification /= 1.5;
			}
		}
		new_magnification = Math.max(0.5, Math.min(new_magnification, 40));
		if (new_magnification != magnification) {
			set_magnification(new_magnification, to_canvas_coords({ clientX: current_pos.x, clientY: current_pos.y }));
		}
		const difference_in_x = current_pos.x - pan_last_pos.x;
		const difference_in_y = current_pos.y - pan_last_pos.y;
		$canvas_area.scrollLeft($canvas_area.scrollLeft() - difference_in_x);
		$canvas_area.scrollTop($canvas_area.scrollTop() - difference_in_y);
		pan_last_pos = current_pos;
	}
});
// #endregion

// #region Primary Canvas Interaction (continued)
$canvas.on("pointerdown", (e) => {
	update_canvas_rect();

	// Quick Undo when there are multiple pointers (i.e. for touch)
	// see pointermove for other pointer types
	// SEE OTHER POINTERDOWN HANDLER ALSO
	// NOTE: this relies on event handler order for pointerdown
	// pointer is not added to pointers yet
	if (pointers.length >= 1) {
		// If you press two fingers quickly, it shouldn't make a new history entry.
		// But if you draw something and then press a second finger to clear it, it should let you redo.
		const discard_document_state = first_pointer_time && performance.now() - first_pointer_time < discard_quick_undo_period;
		cancel(false, discard_document_state);
		pointer_active = false; // NOTE: pointer_active used in cancel(); must be set after cancel()

		// in eye gaze mode, allow drawing with mouse after canceling gaze gesture with mouse
		pointers = pointers.filter((pointer) =>
			pointer.pointerId !== 1234567890
		);
		return;
	}

	history_node_to_cancel_to = current_history_node;

	pointer_active = !!(e.buttons & (1 | 2)); // as far as tools are concerned
	pointer_type = e.pointerType;
	pointer_buttons = e.buttons;
	$G.one("pointerup", (e) => {
		pointer_active = false;
		update_helper_layer(e);

		if (!pointer_over_canvas && update_helper_layer_on_pointermove_active) {
			$G.off("pointermove", update_helper_layer);
			update_helper_layer_on_pointermove_active = false;
		}
	});

	if (e.button === 0) {
		reverse = false;
	} else if (e.button === 2) {
		reverse = true;
	} else {
		return;
	}

	button = e.button;
	ctrl = e.ctrlKey;
	shift = e.shiftKey;
	pointer_start = pointer_previous = pointer = to_canvas_coords(e);

	const pointerdown_action = () => {
		let interval_ids = [];
		selected_tools.forEach((selected_tool) => {
			if (selected_tool.paint || selected_tool.pointerdown) {
				tool_go(selected_tool, "pointerdown");
			}
			if (selected_tool.paint_on_time_interval != null) {
				interval_ids.push(setInterval(() => {
					tool_go(selected_tool);
				}, selected_tool.paint_on_time_interval));
			}
		});

		$G.on("pointermove", canvas_pointer_move);

		$G.one("pointerup", (e, canceling, no_undoable) => {
			button = undefined;
			reverse = false;

			if (e.clientX !== undefined) { // may be synthetic event without coordinates
				pointer = to_canvas_coords(e);
			}
			// don't create undoables if you're two-finger-panning
			// @TODO: do any tools use pointerup for cleanup?
			if (!no_undoable) {
				selected_tools.forEach((selected_tool) => {
					selected_tool.pointerup?.(main_ctx, pointer.x, pointer.y);
				});
			}

			if (selected_tools.length === 1) {
				if (selected_tool.deselect) {
					select_tools(return_to_tools);
				}
			}
			$G.off("pointermove", canvas_pointer_move);
			for (const interval_id of interval_ids) {
				clearInterval(interval_id);
			}

			if (!canceling) {
				history_node_to_cancel_to = null;
			}
		});
	};

	pointerdown_action();

	update_helper_layer(e);
});
// #endregion

// #region Deselection / Selection Prevention
$canvas_area.on("pointerdown", (e) => {
	if (e.button === 0) {
		if ($canvas_area.is(e.target)) {
			if (selection) {
				deselect();
			}
		}
	}
});

function prevent_selection($el) {
	$el.on("mousedown selectstart contextmenu", (e) => {
		if (e.isDefaultPrevented()) {
			return;
		}
		if (
			e.target instanceof HTMLSelectElement ||
			e.target instanceof HTMLTextAreaElement ||
			(e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
			(e.target instanceof HTMLInputElement && e.target.type !== "color")
		) {
			return;
		}
		if (e.button === 1) {
			return; // allow middle-click scrolling
		}
		e.preventDefault();
		// we're just trying to prevent selection
		// but part of the default for mousedown is *deselection*
		// so we have to do that ourselves explicitly
		window.getSelection().removeAllRanges();
	});
}

prevent_selection($app);
prevent_selection($toolbox);
// prevent_selection($toolbox2);
prevent_selection($colorbox);
// #endregion

// Stop drawing (or dragging or whatever) if you Alt+Tab or whatever
$G.on("blur", () => {
	$G.triggerHandler("pointerup");
});

// #region Fullscreen Handling for iOS
// For Safari on iPad, Fullscreen mode overlays the system bar, completely obscuring our menu bar.
// See CSS .fullscreen handling (and exit_fullscreen_if_ios) for more info.
function iOS() {
	return (
		[
			"iPad Simulator",
			"iPhone Simulator",
			"iPod Simulator",
			"iPad",
			"iPhone",
			"iPod",
		].includes(navigator.platform) ||
		// iPad on iOS 13 detection
		(navigator.userAgent.includes("Mac") && "ontouchend" in document)
	);
}
$("html").toggleClass("ios", iOS());
$G.on("fullscreenchange webkitfullscreenchange", () => {
	// const fullscreen = $G.is(":fullscreen") || $G.is(":-webkit-full-screen"); // gives "Script error."
	const fullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
	// $status_text.text(`fullscreen: ${fullscreen}`);
	$("html").toggleClass("fullscreen", fullscreen);
});
// #endregion

// #region Testing Helpers
// Note: this is defined here so the app is loaded when this is defined.
window.api_for_cypress_tests = {
	reset_for_next_test() {
		selected_colors.foreground = "#000";
		selected_colors.background = "#fff";
		brush_shape = default_brush_shape;
		brush_size = default_brush_size;
		eraser_size = default_eraser_size;
		airbrush_size = default_airbrush_size;
		pencil_size = default_pencil_size;
		stroke_size = default_stroke_size;
		clear();
	},
	selected_colors,
	set_theme,
	$,
};
// #endregion

init_webgl_stuff();
