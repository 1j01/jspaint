
// expresses order in the URL as well as type
const param_types = {
	// settings
	"eye-gaze-mode": "bool",
	"vertical-color-box-mode": "bool",
	"speech-recognition-mode": "bool",
	// sessions
	"local": "string",
	"session": "string",
	"load": "string",
};

const exclusive_params = [
	"local",
	"session",
	"load",
];

function get_all_url_params() {
	const params = {};
	location.hash.replace(/^#/, "").split(/,/).forEach((param_decl)=> {
		// colon is used in param value for URLs so split(":") isn't good enough
		const colon_index = param_decl.indexOf(":");
		if (colon_index === -1) {
			// boolean value, implicitly true because it's in the URL
			const param_name = param_decl;
			params[param_name] = true;
		} else {
			const param_name = param_decl.slice(0, colon_index);
			const param_value = param_decl.slice(colon_index + 1);
			params[param_name] = decodeURIComponent(param_value);
		}
	});
	for (const [param_name, param_type] of Object.entries(param_types)) {
		if (param_type === "bool" && !params[param_name]) {
			params[param_name] = false;
		}
	}
	return params;
}

function get_url_param(param_name) {
	return get_all_url_params()[param_name];
}

function change_url_param(param_name, value, {replace_history_state=false}={}) {
	change_some_url_params({[param_name]: value}, {replace_history_state});
}

function change_some_url_params(updates, {replace_history_state=false}={}) {
	for (const exclusive_param of exclusive_params) {
		if (updates[exclusive_param]) {
			exclusive_params.forEach((param)=> {
				if (param !== exclusive_param) {
					updates[param] = null; // must be enumerated (for Object.assign) but falsy, to get removed from the URL
				}
			});
		}
	}
	set_all_url_params(Object.assign({}, get_all_url_params(), updates), {replace_history_state});
}

function set_all_url_params(params, {replace_history_state=false}={}) {

	let new_hash = "";
	for (const [param_name, param_type] of Object.entries(param_types)) {
		if (params[param_name]) {
			if (new_hash.length) {
				new_hash += ",";
			}
			new_hash += encodeURIComponent(param_name);
			if (param_type !== "bool") {
				new_hash += ":" + encodeURIComponent(params[param_name]);
			}
		}
	}
	// Note: gets rid of query string (?) portion of the URL
	// This is desired for upgrading backwards compatibility URLs;
	// may not be desired for future cases.
	const new_url = `${location.origin}${location.pathname}#${new_hash}`;
	try {
		// can fail when running from file: protocol
		if (replace_history_state) {
			history.replaceState(null, document.title, new_url);
		} else {
			history.pushState(null, document.title, new_url);
		}
	} catch(error) {
		location.hash = new_hash;
	}

	$G.triggerHandler("change-url-params");
}

function update_magnified_canvas_size(){
	$canvas.css("width", main_canvas.width * magnification);
	$canvas.css("height", main_canvas.height * magnification);

	update_canvas_rect();
}

function update_canvas_rect() {
	canvas_bounding_client_rect = main_canvas.getBoundingClientRect();

	update_helper_layer();
}

let helper_layer_update_queued;
let info_for_updating_pointer; // for updating on scroll or resize, where the mouse stays in the same place but its coordinates in the document change
function update_helper_layer(e){
	// e may be a number from requestAnimationFrame callback; ignore that
	if (e && isFinite(e.clientX)) {
		info_for_updating_pointer = {clientX: e.clientX, clientY: e.clientY, devicePixelRatio};
	}
	if (helper_layer_update_queued) {
		// window.console && console.log("update_helper_layer - nah, already queued");
		return;
	} else {
		// window.console && console.log("update_helper_layer");
	}
	helper_layer_update_queued = true;
	requestAnimationFrame(()=> {
		helper_layer_update_queued = false;
		update_helper_layer_immediately();
	});
}
function update_helper_layer_immediately() {
	// window.console && console.log("Update helper layer NOW");
	if (info_for_updating_pointer) {
		const rescale = info_for_updating_pointer.devicePixelRatio / devicePixelRatio;
		info_for_updating_pointer.clientX *= rescale;
		info_for_updating_pointer.clientY *= rescale;
		info_for_updating_pointer.devicePixelRatio = devicePixelRatio;
		pointer = to_canvas_coords(info_for_updating_pointer);
	}

	update_fill_and_stroke_colors_and_lineWidth(selected_tool);
	
	const grid_visible = show_grid && magnification >= 4 && (window.devicePixelRatio * magnification) >= 4;

	const scale = magnification * window.devicePixelRatio;

	if (!helper_layer) {
		helper_layer = new OnCanvasHelperLayer(0, 0, main_canvas.width, main_canvas.height, false, scale);
	}

	const hcanvas = helper_layer.canvas;
	const hctx = hcanvas.ctx;

	const margin = 15;
	const viewport_x = Math.floor(Math.max($canvas_area.scrollLeft() / magnification - margin, 0));
	// Nevermind, canvas, isn't aligned to the right in RTL layout!
	// const viewport_x =
	// 	get_direction() === "rtl" ?
	// 		// Note: $canvas_area.scrollLeft() can return negative numbers for RTL layout
	// 		Math.floor(Math.max(($canvas_area.scrollLeft() - $canvas_area.innerWidth()) / magnification + canvas.width - margin, 0)) :
	// 		Math.floor(Math.max($canvas_area.scrollLeft() / magnification - margin, 0));
	const viewport_y = Math.floor(Math.max($canvas_area.scrollTop() / magnification - margin, 0));
	const viewport_x2 = Math.floor(Math.min(viewport_x + $canvas_area.width() / magnification + margin*2, main_canvas.width));
	const viewport_y2 = Math.floor(Math.min(viewport_y + $canvas_area.height() / magnification + margin*2, main_canvas.height));
	const viewport_width = viewport_x2 - viewport_x;
	const viewport_height = viewport_y2 - viewport_y;
	const resolution_width = viewport_width * scale;
	const resolution_height = viewport_height * scale;
	if (
		hcanvas.width !== resolution_width ||
		hcanvas.height !== resolution_height
	) {
		hcanvas.width = resolution_width;
		hcanvas.height = resolution_height;
		hcanvas.ctx.disable_image_smoothing();
		helper_layer.width = viewport_width;
		helper_layer.height = viewport_height;
	}
	helper_layer.x = viewport_x;
	helper_layer.y = viewport_y;
	helper_layer.position();

	hctx.clearRect(0, 0, hcanvas.width, hcanvas.height);
	
	var tools_to_preview = [...selected_tools];

	// Don't preview tools while dragging components/component windows
	// (The magnifier preview is especially confusing looking together with the component preview!)
	if ($("body").hasClass("dragging") && !pointer_active) {
		// tools_to_preview.length = 0;
		// Curve and Polygon tools have a persistent state over multiple gestures,
		// which is, as of writing, part of the "tool preview"; it's ugly,
		// but at least they don't have ALSO a brush like preview, right?
		// so we can just allow those thru
		tools_to_preview = tools_to_preview.filter((tool)=>
			tool.id === TOOL_CURVE ||
			tool.id === TOOL_POLYGON
		);
	}

	// the select box previews draw the document canvas onto the preview canvas
	// so they have something to invert within the preview canvas
	// but this means they block out anything earlier
	// NOTE: sort Select after Free-Form Select,
	// Brush after Eraser, as they are from the toolbar ordering
	tools_to_preview.sort((a, b)=> {
		if (a.selectBox && !b.selectBox) {
			return -1;
		}
		if (!a.selectBox && b.selectBox) {
			return 1;
		}
		return 0;
	});
	// two select box previews would just invert and cancel each other out
	// so only render one if there's one or more
	var select_box_index = tools_to_preview.findIndex((tool)=> tool.selectBox);
	if (select_box_index >= 0) {
		tools_to_preview = tools_to_preview.filter((tool, index)=> !tool.selectBox || index == select_box_index);
	}

	tools_to_preview.forEach((tool)=> {
		if(tool.drawPreviewUnderGrid && pointer && pointers.length < 2){
			hctx.save();
			tool.drawPreviewUnderGrid(hctx, pointer.x, pointer.y, grid_visible, scale, -viewport_x, -viewport_y);
			hctx.restore();
		}
	});

	if (selection) {
		hctx.save();
		
		hctx.scale(scale, scale);
		hctx.translate(-viewport_x, -viewport_y);

		hctx.drawImage(selection.canvas, selection.x, selection.y);
		
		hctx.restore();
	}

	if (textbox) {
		hctx.save();
		
		hctx.scale(scale, scale);
		hctx.translate(-viewport_x, -viewport_y);

		hctx.drawImage(textbox.canvas, textbox.x, textbox.y);
		
		hctx.restore();
	}

	if (grid_visible) {
		draw_grid(hctx, scale);
	}

	tools_to_preview.forEach((tool)=> {
		if(tool.drawPreviewAboveGrid && pointer && pointers.length < 2){
			hctx.save();
			tool.drawPreviewAboveGrid(hctx, pointer.x, pointer.y, grid_visible, scale, -viewport_x, -viewport_y);
			hctx.restore();
		}
	});
}
function update_disable_aa() {
	const dots_per_canvas_px = window.devicePixelRatio * magnification;
	const round = Math.floor(dots_per_canvas_px) === dots_per_canvas_px;
	$canvas_area.toggleClass("disable-aa-for-things-at-main-canvas-scale", dots_per_canvas_px >= 3 || round);
}

function set_magnification(scale){
	const prev_magnification = magnification;
	let scroll_left = $canvas_area.scrollLeft();
	let scroll_top = $canvas_area.scrollTop();

	magnification = scale;
	if(scale !== 1){
		return_to_magnification = scale;
	}
	update_magnified_canvas_size();

	// rescale viewport with top left as anchor
	scroll_left *= magnification / prev_magnification;
	scroll_top *= magnification / prev_magnification;

	$canvas_area.scrollLeft(scroll_left);
	$canvas_area.scrollTop(scroll_top);

	$G.triggerHandler("resize"); // updates handles & grid
	$G.trigger("option-changed"); // updates options area
}

let $custom_zoom_window;

let dev_custom_zoom = false;
try {
	dev_custom_zoom = localStorage.dev_custom_zoom === "true";
	// eslint-disable-next-line no-empty
} catch (error) { }
if (dev_custom_zoom) {
	$(()=> {
		show_custom_zoom_window();
		$custom_zoom_window.css({
			left: 80,
			top: 50,
			opacity: 0.5,
		});
	});
}

function show_custom_zoom_window() {
	if ($custom_zoom_window) {
		$custom_zoom_window.close();
	}
	const $w = new $FormToolWindow(localize("Custom Zoom"));
	$custom_zoom_window = $w;
	$w.addClass("custom-zoom-window");

	// @TODO: update when zoom changes
	$w.$main.append(`<div class='current-zoom'>${localize("Current zoom:")} <bdi>${magnification * 100}%</bdi></div>`);

	const $fieldset = $(E("fieldset")).appendTo($w.$main);
	$fieldset.append(`
		<legend>${localize("Zoom to")}</legend>
		<div class="fieldset-body">
			<label><input type='radio' name='custom-zoom-radio' value='1'/>100%</label>
			<label><input type='radio' name='custom-zoom-radio' value='2'/>200%</label>
			<label><input type='radio' name='custom-zoom-radio' value='4'/>400%</label>
			<label><input type='radio' name='custom-zoom-radio' value='6'/>600%</label>
			<label><input type='radio' name='custom-zoom-radio' value='8'/>800%</label>
			<label><input type='radio' name='custom-zoom-radio' value='really-custom'/><input type='number' min='10' max='1000' name='really-custom-zoom-input' class='inset-deep no-spinner' value=''/>%</label>
		</div>
	`);
	let is_custom = true;
	$fieldset.find("input[type=radio]").get().forEach((el)=> {
		if (parseFloat(el.value) === magnification) {
			el.checked = true;
			is_custom = false;
		}
	});
	const $really_custom_radio_option = $fieldset.find("input[value='really-custom']");
	const $really_custom_input = $fieldset.find("input[name='really-custom-zoom-input']");

	$really_custom_input.closest("label").on("click", ()=> {
		$really_custom_radio_option.prop("checked", true);
		$really_custom_input[0].focus();
	});

	if (is_custom) {
		$really_custom_input.val(magnification * 100);
		$really_custom_radio_option.prop("checked", true);
	}

	$fieldset.find("label").css({display: "block"});

	$w.$Button(localize("OK"), () => {
		let option_val = $fieldset.find("input[name='custom-zoom-radio']:checked").val();
		let mag;
		if(option_val === "really-custom"){
			option_val = $really_custom_input.val();
			if(`${option_val}`.match(/\dx$/)) { // ...you can't actually type an x; oh well...
				mag = parseFloat(option_val);
			}else if(`${option_val}`.match(/\d%?$/)) {
				mag = parseFloat(option_val) / 100;
			}
			if(isNaN(mag)){
				please_enter_a_number();
				return;
			}
		}else{
			mag = parseFloat(option_val);
		}

		set_magnification(mag);

		$w.close();
	})[0].focus();
	$w.$Button(localize("Cancel"), () => {
		$w.close();
	});

	$w.center();
}


function toggle_grid() {
	show_grid = !show_grid;
	// $G.trigger("option-changed");
	update_helper_layer();
}

function reset_selected_colors(){
	selected_colors = {
		foreground: "#000000",
		background: "#ffffff",
		ternary: "",
	};
	$G.trigger("option-changed");
}

function reset_file(){
	file_handle = null;
	document_file_path = null;
	file_name = localize("untitled");
	file_name_chosen = false;
	file_format = "image/png";
	update_title();
	saved = true;
}

function reset_canvas_and_history(){
	undos.length = 0;
	redos.length = 0;
	current_history_node = root_history_node = make_history_node({
		name: localize("New"),
		icon: get_help_folder_icon("p_blank.png"),
	});
	history_node_to_cancel_to = null;

	main_canvas.width = Math.max(1, my_canvas_width);
	main_canvas.height = Math.max(1, my_canvas_height);
	main_ctx.disable_image_smoothing();
	main_ctx.fillStyle = selected_colors.background;
	main_ctx.fillRect(0, 0, main_canvas.width, main_canvas.height);

	current_history_node.image_data = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);

	$canvas_area.trigger("resize");
	$G.triggerHandler("history-update"); // update history view
}

function make_history_node({
	parent = null,
	futures = [],
	timestamp = Date.now(),
	soft = false,
	image_data = null,
	selection_image_data = null,
	selection_x,
	selection_y,
	textbox_text,
	textbox_x,
	textbox_y,
	textbox_width,
	textbox_height,
	text_tool_font = null,
	tool_transparent_mode,
	foreground_color,
	background_color,
	ternary_color,
	name,
	icon = null,
}) {
	return {
		parent,
		futures,
		timestamp,
		soft,
		image_data,
		selection_image_data,
		selection_x,
		selection_y,
		textbox_text,
		textbox_x,
		textbox_y,
		textbox_width,
		textbox_height,
		text_tool_font,
		tool_transparent_mode,
		foreground_color,
		background_color,
		ternary_color,
		name,
		icon,
	};
}

function update_title(){
	document.title = `${file_name} - ${is_pride_month ? "June Solidarity " : ""}${localize("Paint")}`;

	if (is_pride_month) {
		$("link[rel~='icon']").attr("href", "./images/icons/gay-es-paint-16x16-light-outline.png");
	}
}

function get_uris(text) {
	// parse text/uri-list
	// get lines, discarding comments
	const lines = text.split(/[\n\r]+/).filter(line => line[0] !== "#" && line);
	// discard text with too many lines (likely pasted HTML or something) - may want to revisit this
	if (lines.length > 15) {
		return [];
	}
	// parse URLs, discarding anything that parses as a relative URL
	const uris = [];
	for (let i=0; i<lines.length; i++) {
		try {
			const url = new URL(lines[i]);
			uris.push(url.href);
		// eslint-disable-next-line no-empty
		} catch(e) {}
	}
	return uris;
}
async function load_image_from_uri(uri){
	const is_blob_uri = uri.match(/^blob:/);
	const is_download = !uri.match(/^(blob|data):/);

	if (is_blob_uri && uri.indexOf(`blob:${location.origin}`) === -1) {
		const error = new Error("can't load blob: URI from another domain");
		error.code = "cross-origin-blob-uri";
		throw error;
	}

	const uris_to_try = is_download ? [
		uri,
		// work around CORS headers not sent by whatever server
		`https://jspaint-cors-proxy.herokuapp.com/${uri}`,
		// if the image isn't available on the live web, see if it's archived
		`https://web.archive.org/${uri}`,
	] : [uri];
	const fails = [];

	for (let index_to_try = 0; index_to_try < uris_to_try.length; index_to_try += 1) {
		const uri_to_try = uris_to_try[index_to_try];
		try {
			if (is_download) {
				$status_text.text("Downloading picture...");
			}

			const show_progress = ({loaded, total})=> {
				if (is_download) {
					$status_text.text(`Downloading picture... (${Math.round(loaded/total*100)}%)`);
				}
			};

			if (is_download) {
				console.log(`Try loading image from URI (${index_to_try+1}/${uris_to_try.length}): "${uri_to_try}"`);
			}

			const original_response = await fetch(uri_to_try);
			let response_to_read = original_response;
			if (!original_response.ok) {
				fails.push({status: original_response.status, statusText: original_response.statusText, url: uri_to_try});
				continue;
			}
			if (!original_response.body) {
				if (is_download) {
					console.log("ReadableStream not yet supported in this browser. Progress won't be shown for image requests.");
				}
			} else {
				// to access headers, server must send CORS header "Access-Control-Expose-Headers: content-encoding, content-length x-file-size"
				// server must send custom x-file-size header if gzip or other content-encoding is used
				const contentEncoding = original_response.headers.get("content-encoding");
				const contentLength = original_response.headers.get(contentEncoding ? "x-file-size" : "content-length");
				if (contentLength === null) {
					if (is_download) {
						console.log("Response size header unavailable. Progress won't be shown for this image request.");
					}
				} else {
					const total = parseInt(contentLength, 10);
					let loaded = 0;
					response_to_read = new Response(
						new ReadableStream({
							start(controller) {
								const reader = original_response.body.getReader();
			
								read();
								function read() {
									reader.read().then(({done, value}) => {
										if (done) {
											controller.close();
											return; 
										}
										loaded += value.byteLength;
										show_progress({loaded, total})
										controller.enqueue(value);
										read();
									}).catch(error => {
										console.error(error);
										controller.error(error)									
									})
								}
							}
						})
					);
				}
			}
	
			const blob = await response_to_read.blob();
			if (is_download) {
				console.log("Download complete.");
				$status_text.text("Download complete.");
			}
			// @TODO: use headers to detect HTML, since a doctype is not guaranteed
			// @TODO: fall back to WayBack Machine still for decode errors,
			// since a website might start redirecting swathes of URLs regardless of what they originally pointed to,
			// at which point they would likely point to a web page instead of an image.
			// (But still show an error about it not being an image, if WayBack also fails.)
			const info = await new Promise((resolve, reject)=> {
				read_image_file(blob, (error, info)=> {
					if (error) {
						reject(error);
					} else {
						resolve(info);
					}
				});
			});
			return info;
		} catch (error) {
			fails.push({url: uri_to_try, error});
		}
	}
	if (is_download) {
		$status_text.text("Failed to download picture.");
	}
	const error = new Error(`failed to fetch image from any of ${uris_to_try.length} URI(s):\n  ${fails.map((fail)=>
		(fail.statusText ? `${fail.status} ${fail.statusText} ` : "") + fail.url + (fail.error ? `\n    ${fail.error}` : "")
	).join("\n  ")}`);
	error.code = "access-failure";
	error.fails = fails;
	throw error;
}
function open_from_uri(uri, callback, canceled){
	load_image_from_uri(uri).then((info) => {
		open_from_image_info(info, callback, canceled);
	}, (error) => {
		callback(error);
	});
}

// @TODO: shouldn't open_from_* start a new session!? and File > New too
function open_from_image_info(info, callback, canceled){
	are_you_sure(() => {
		deselect();
		cancel();

		reset_file();
		reset_selected_colors();
		reset_canvas_and_history(); // (with newly reset colors)
		set_magnification(default_magnification);

		main_ctx.copy(info.image || info.image_data);
		apply_file_format_and_palette_info(info);
		transparency = has_any_transparency(main_ctx);
		$canvas_area.trigger("resize");

		current_history_node.name = localize("Open");
		current_history_node.image_data = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);
		current_history_node.icon = get_help_folder_icon("p_open.png");

		$G.triggerHandler("session-update"); // autosave
		$G.triggerHandler("history-update"); // update history view

		if (info.source_blob instanceof File) {
			file_name = info.source_blob.name;
			// @TODO: probably always set file_name_chosen = true for consistency (you can always do Save As if you want a new file name)
			// file_name_chosen = true; // if false (default via reset_file), it will prompt initially for name/type when saving opened file
			document_file_path = info.source_blob.path; // available in Electron (see https://www.electronjs.org/docs/api/file-object#file-object)
			if (document_file_path) {
				file_name_chosen = true;
			}
		}
		if (info.source_file_handle) {
			file_name_chosen = true;
			file_handle = info.source_file_handle;
		}
		update_title();
		saved = true;

		callback && callback();
	}, canceled);
}

function open_from_file(file, file_handle) {
	if (file.type.match(/^image/)) {
		read_image_file(file, (error, info)=> {
			if (error) {
				show_read_image_file_error(error);
				return;
			}
			info.source_file_handle = file_handle
			open_from_image_info(info);
		});
	} else if (file.name.match(/\.theme(pack)?$/i)) {
		file.text().then(load_theme_from_text, (error)=> {
			show_error_message(localize("Paint cannot open this file."), error);
		});
	} else {
		AnyPalette.loadPalette(file, (error, new_palette)=> {
			if (error) {
				// fails.push({file, error});
				show_error_message(localize("Paint cannot open this file."), error);
				return;
			}
			palette = new_palette.map((color)=> color.toString());
			$colorbox.rebuild_palette();
			window.console && console.log(`Loaded palette: ${palette.map(()=> `%c█`).join("")}`, ...palette.map((color)=> `color: ${color};`));
		});
	}
}

async function open_from_file_handle(file_handle) {
	const file = await file_handle.getFile();
	open_from_file(file, file_handle);
}

function apply_file_format_and_palette_info(info) {
	if (info.palette) {
		window.console && console.log(`Loaded palette from image file: ${info.palette.map(()=> `%c█`).join("")}`, ...info.palette.map((color)=> `color: ${color};`));
		palette = info.palette;
		selected_colors.foreground = palette[0];
		selected_colors.background = palette.length === 14 * 2 ? palette[14] : palette[1]; // first in second row for default sized palette, else second color (debatable behavior; should it find a dark and a light color?)
		$G.trigger("option-changed");
	} else if (monochrome && !info.monochrome) {
		palette = default_palette;
		reset_selected_colors();
	}
	$colorbox.rebuild_palette();

	monochrome = info.monochrome;
	file_format = info.file_format;
}

function load_theme_from_text(fileText) {
	var cssProperties = parseThemeFileString(fileText);
	applyCSSProperties(cssProperties);

	window.themeCSSProperties = cssProperties;
	$("iframe").each((i, iframe)=> {
		try {
			applyCSSProperties(cssProperties, iframe.contentDocument.documentElement);
		} catch(error) {
			console.log("error applying theme to iframe", iframe, error);
		}
	})

	$G.triggerHandler("theme-load");
}

function file_new(){
	are_you_sure(() => {
		deselect();
		cancel();
		saved = false; // ??

		reset_file();
		reset_selected_colors();
		reset_canvas_and_history(); // (with newly reset colors)
		set_magnification(default_magnification);

		$G.triggerHandler("session-update"); // autosave
	});
}

async function file_open(){
	const {file, fileHandle} = await systemHooks.openFile({formats: image_formats})
	// @TODO: store file handle
	open_from_file(file);
}

let $file_load_from_url_window;
function file_load_from_url(){
	if($file_load_from_url_window){
		$file_load_from_url_window.close();
	}
	const $w = new $FormToolWindow().addClass("dialogue-window");
	$file_load_from_url_window = $w;
	$w.title("Load from URL");
	// @TODO: URL validation (input has to be in a form (and we don't want the form to submit))
	$w.$main.html("<label>URL: <input type='url' required value='' class='url-input inset-deep'/></label>");
	const $input = $w.$main.find(".url-input");
	$w.$Button("Load", () => {
		const uris = get_uris($input.val());
		if (uris.length > 0) {
			// @TODO: retry loading if same URL entered
			// actually, make it change the hash only after loading successfully
			// (but still load from the hash when necessary)
			// make sure it doesn't overwrite the old session before switching
			$w.close();
			change_url_param("load", uris[0]);
		} else {
			show_error_message("Invalid URL. It must include a protocol (https:// or http://)");
		}
	});
	$w.$Button(localize("Cancel"), () => {
		$w.close();
	});
	$w.center();
	$input[0].focus();
}

function file_save(maybe_saved_callback=()=>{}, update_from_saved=true){
	deselect();
	// @TODO: systemHook for saving over a file
	const save_file_handle = file_handle;
	const save_file_path = document_file_path;
	if (save_file_handle || save_file_path) {
		if(file_name.match(/\.svg$/i)){
			return file_save_as(maybe_saved_callback, update_from_saved);
		}
	}
	if (!file_name_chosen) {
		return file_save_as(maybe_saved_callback, update_from_saved);
	}
	write_image_file(main_canvas, file_format, async (blob)=> {
		if (save_file_handle) {
			const writableStream = await save_file_handle.createWritable();
			await writableStream.write(blob);
			await writableStream.close();
		} else if (save_file_path) {
			return save_to_file_path(save_file_path, blob, () => {
				saved = true;
				update_title();
				maybe_saved_callback();
				if (update_from_saved) {
					update_from_saved_file(blob);
				}
			});
		} else {
			const file_saver = saveAs(blob, file_name);
			// file_saver.onwriteend = () => {
			// 	// this won't fire in chrome
			// 	maybe_saved_callback();
			// };
			// hopefully if the page reloads/closes the save dialog/download will persist and succeed?
			maybe_saved_callback();
			if (update_from_saved) {
				update_from_saved_file(blob);
			}
		}
	});
}

function file_save_as(maybe_saved_callback=()=>{}, update_from_saved=true){
	deselect();
	systemHooks.saveFile({
		dialogTitle: localize("Save As"),
		formats: image_formats,
		defaultFileName: file_name,
		defaultPath: document_file_path,
		defaultFileFormatID: file_format,
		getBlob: (new_file_type)=> {
			return new Promise((resolve)=> {
				write_image_file(main_canvas, new_file_type, (blob)=> {
					resolve(blob);
				});
			});
		},
		savedCallbackUnreliable: ({newFileName, newFileFormatID, newFileHandle, newFilePath, newBlob})=> {
			saved = true;
			file_handle = newFileHandle;
			document_file_path = newFilePath;
			file_name = newFileName;
			file_name_chosen = true;
			file_format = newFileFormatID;
			update_title();
			maybe_saved_callback();
			if (update_from_saved) {
				update_from_saved_file(newBlob);
			}
		}
	});
}


function are_you_sure(action, canceled){
	if(saved){
		action();
	}else{
		const $w = new $FormToolWindow().addClass("dialogue-window");
		$w.title(localize("Paint"));
		$w.$main.text(localize("Save changes to %1?", file_name));
		$w.$Button(localize("Save"), () => {
			$w.close();
			file_save(()=> {
				action();
			}, false);
		})[0].focus();
		$w.$Button("Discard", () => {
			$w.close();
			action();
		});
		$w.$Button(localize("Cancel"), () => {
			$w.close();
			canceled && canceled();
		});
		$w.$x.on("click", () => {
			canceled && canceled();
		});
		$w.center();
	}
}

function please_enter_a_number() {
	const $w = new $FormToolWindow("Invalid Value").addClass("dialogue-window");
	$w.$main.text(localize("Please enter a number."));
	$w.$Button(localize("OK"), () => {
		$w.close();
	}).focus();
}

function show_error_message(message, error){
	const $w = $FormToolWindow().title(localize("Paint")).addClass("dialogue-window squish");
	$w.$main.text(message);
	$w.$main.css("max-width", "600px");
	if(error){
		const $details = $("<details><summary><span>Details</span></summary></details>")
		.appendTo($w.$main);

		// Chrome includes the error message in the error.stack string, whereas Firefox doesn't.
		// Also note that there can be Exception objects that don't have a message (empty string) but a name,
		// for instance Exception { message: "", name: "NS_ERROR_FAILURE", ... } for out of memory when resizing the canvas too large in Firefox.
		// Chrome just lets you bring the system to a grating halt by trying to grab too much memory.
		// Firefox does too sometimes.
		let error_string = error.stack;
		if (!error_string) {
			error_string = error.toString();
		} else if (error.message && error_string.indexOf(error.message) === -1) {
			error_string = `${error.toString()}\n\n${error_string}`;
		} else if (error.name && error_string.indexOf(error.name) === -1) {
			error_string = `${error.name}\n\n${error_string}`;
		}
		$(E("pre"))
		.text(error_string)
		.appendTo($details)
		.css({
			background: "white",
			color: "#333",
			// background: "#A00",
			// color: "white",
			fontFamily: "monospace",
			width: "500px",
			maxWidth: "100%",
			overflow: "auto",
		});
	}
	$w.$Button(localize("OK"), () => {
		$w.close();
	}).focus();
	$w.center();
	if (error) {
		window.console && console.error(message, error);
	} else {
		window.console && console.error(message);
	}
}

// @TODO: close are_you_sure windows and these Error windows when switching sessions
// because it can get pretty confusing
function show_resource_load_error_message(error){
	const $w = $FormToolWindow().title(localize("Paint")).addClass("dialogue-window");
	const firefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
	// @TODO: copy & paste vs download & open, more specific guidance
	if (error.code === "cross-origin-blob-uri") {
		$w.$main.html(`
			<p>Can't load image from address starting with "blob:".</p>
			${
				firefox ?
					`<p>Try "Copy Image" instead of "Copy Image Location".</p>` :
					`<p>Try "Copy image" instead of "Copy image address".</p>`
			}
		`);
	} else if (error.code === "html-not-image") {
		$w.$main.html(`
			<p>Address points to a web page, not an image file.</p>
			<p>Try copying and pasting an image instead of a URL.</p>
		`);
	} else if (error.code === "decoding-failure") {
		$w.$main.html(`
			<p>Address doesn't point to an image file of a supported format.</p>
			<p>Try copying and pasting an image instead of a URL.</p>
		`);
	} else if (error.code === "access-failure") {
		if (navigator.onLine) {
			$w.$main.html(`
				<p>Failed to download image.</p>
				<p>Try copying and pasting an image instead of a URL.</p>
			`);
			if (error.fails) {
				$("<ul>").append(error.fails.map(({status, statusText, url})=>
					$("<li>").text(url).prepend($("<b>").text(`${status || ""} ${statusText || "Failed"} `))
				)).appendTo($w.$main);
			}
		} else {
			$w.$main.html(`
				<p>Failed to download image.</p>
				<p>You're offline. Connect to the internet and try again.</p>
				<p>Or copy and paste an image instead of a URL, if possible.</p>
			`);
		}
	} else {
		$w.$main.html(`
			<p>Failed to load image from URL.</p>
			<p>Check your browser's devtools for details.</p>
		`);
	}
	$w.$main.css({maxWidth: "500px"});
	$w.$Button(localize("OK"), () => {
		$w.close();
	}).focus();
	$w.center();
}
function show_read_image_file_error(error) {
	// @TODO: similar friendly messages to show_resource_load_error_message,
	// but not specific to the case of loading from a web address.
	show_error_message(localize("This is not a valid bitmap file, or its format is not currently supported."), error);
}

let $about_paint_window;
const $about_paint_content = $("#about-paint");
let $news_window;
const $this_version_news = $("#news");
let $latest_news = $this_version_news;

// not included directly in the HTML as a simple way of not showing it if it's loaded with fetch
// (...not sure how to phrase this clearly and concisely...)
// "Showing the news as of this version of JS Paint. For the latest, see <a href='https://jspaint.app'>jspaint.app</a>"
if (location.origin !== "https://jspaint.app") {
	$this_version_news.prepend(
		$("<p>For the latest news, visit <a href='https://jspaint.app'>jspaint.app</a></p>")
		.css({padding: "8px 15px"})
	);
}

function show_about_paint(){
	if($about_paint_window){
		$about_paint_window.close();
	}
	$about_paint_window = $ToolWindow().title(localize("About Paint"));
	$about_paint_window.addClass("about-paint squish");
	if (is_pride_month) {
		$("#paint-32x32").attr("src", "./images/icons/gay-es-paint-32x32-light-outline.png");
	}

	$about_paint_window.$content.append($about_paint_content.show()).css({padding: "15px"});

	$("#maybe-outdated-view-project-news").removeAttr("hidden");

	$("#failed-to-check-if-outdated").attr("hidden", "hidden");
	$("#outdated").attr("hidden", "hidden");

	$about_paint_window.center();
	$about_paint_window.center(); // @XXX - but it helps tho

	$("#refresh-to-update").on("click", (event)=> {
		event.preventDefault();
		location.reload();
	});
	
	$("#view-project-news").on("click", ()=> {
		show_news();
	}).focus();
	
	$("#checking-for-updates").removeAttr("hidden");

	const url =
		// ".";
		// "test-news-newer.html";
		"https://jspaint.app";
	fetch(url)
	.then((response)=> response.text())
	.then((text)=> {
		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(text, "text/html");
		$latest_news = $(htmlDoc).find("#news");

		const $latest_entries = $latest_news.find(".news-entry");
		const $this_version_entries = $this_version_news.find(".news-entry");

		if (!$latest_entries.length) {
			$latest_news = $this_version_news;
			throw new Error(`No news found at fetched site (${url})`);
		}

		function entries_contains_update($entries, id) {
			return $entries.get().some((el_from_this_version)=> 
				id === el_from_this_version.id
			);
		}

		// @TODO: visibly mark entries that overlap
		const entries_newer_than_this_version =
			$latest_entries.get().filter((el_from_latest)=>
				!entries_contains_update($this_version_entries, el_from_latest.id)
			);
		
		const entries_new_in_this_version = // i.e. in development, when updating the news
			$this_version_entries.get().filter((el_from_latest)=>
				!entries_contains_update($latest_entries, el_from_latest.id)
			);

		if (entries_newer_than_this_version.length > 0) {
			$("#outdated").removeAttr("hidden");
		} else if(entries_new_in_this_version.length > 0) {
			$latest_news = $this_version_news; // show this version's news for development
		}

		$("#checking-for-updates").attr("hidden", "hidden");
		update_css_classes_for_conditional_messages();
	}).catch((exception)=> {
		$("#failed-to-check-if-outdated").removeAttr("hidden");
		$("#checking-for-updates").attr("hidden", "hidden");
		update_css_classes_for_conditional_messages();
		window.console && console.log("Couldn't check for updates.", exception);
	});
}
// show_about_paint(); // for testing

function update_css_classes_for_conditional_messages() {

	$(".on-dev-host, .on-third-party-host, .on-official-host").hide();
	if (location.hostname.match(/localhost|127.0.0.1/)) {
		$(".on-dev-host").show();
	} else if (location.hostname.match(/jspaint.app/)) {
		$(".on-official-host").show();
	} else {
		$(".on-third-party-host").show();
	}

	$(".navigator-online, .navigator-offline").hide();
	if (navigator.onLine) {
		$(".navigator-online").show();
	} else {
		$(".navigator-offline").show();
	}
}

function show_news(){
	if($news_window){
		$news_window.close();
	}
	$news_window = $ToolWindow().title("Project News");
	$news_window.addClass("news-window squish");


	// const $latest_entries = $latest_news.find(".news-entry");
	// const latest_entry = $latest_entries[$latest_entries.length - 1];
	// window.console && console.log("LATEST MEWS:", $latest_news);
	// window.console && console.log("LATEST ENTRY:", latest_entry);

	const $latest_news_style = $latest_news.find("style");
	$this_version_news.find("style").remove();
	$latest_news.append($latest_news_style); // in case $this_version_news is $latest_news

	$news_window.$content.append($latest_news.removeAttr("hidden"));

	$news_window.center();
	$news_window.center(); // @XXX - but it helps tho

	$latest_news.attr("tabIndex", "-1").focus();
}


// @TODO: DRY between these functions and open_from_* functions further?

function paste_image_from_file(blob){
	read_image_file(blob, (error, info) => {
		if (error) {
			show_read_image_file_error(error);
			return;
		}
		paste(info.image || make_canvas(info.image_data));
	});
}

// Edit > Paste From
async function choose_file_to_paste() {
	const {file} = await systemHooks.openFile({formats: image_formats});
	if (file.type.match(/^image/)) {
		paste_image_from_file(file);
		return;
	}
	show_error_message(localize("This is not a valid bitmap file, or its format is not currently supported."));
}

function paste(img_or_canvas){

	if(img_or_canvas.width > main_canvas.width || img_or_canvas.height > main_canvas.height){
		const $w = new $FormToolWindow().addClass("dialogue-window");
		$w.title(localize("Paint"));
		$w.$main.html(`
			${localize("The image in the clipboard is larger than the bitmap.")}<br>
			${localize("Would you like the bitmap enlarged?")}<br>
		`);
		$w.$Button("Enlarge", () => {
			$w.close();
			// The resize gets its own undoable, as in mspaint
			resize_canvas_and_save_dimensions(
				Math.max(main_canvas.width, img_or_canvas.width),
				Math.max(main_canvas.height, img_or_canvas.height),
				{
					name: "Enlarge Canvas For Paste",
					icon: get_help_folder_icon("p_stretch_both.png"),
				}
			);
			do_the_paste();
			$canvas_area.trigger("resize");
		})[0].focus();
		$w.$Button("Crop", () => {
			$w.close();
			do_the_paste();
		});
		$w.$Button(localize("Cancel"), () => {
			$w.close();
		});
		$w.center();
	}else{
		do_the_paste();
	}

	function do_the_paste(){
		deselect();
		select_tool(get_tool_by_id(TOOL_SELECT));
		
		const x = Math.max(0, Math.ceil($canvas_area.scrollLeft() / magnification));
		const y = Math.max(0, Math.ceil(($canvas_area.scrollTop()) / magnification));
		// Nevermind, canvas, isn't aligned to the right in RTL layout!
		// let x = Math.max(0, Math.ceil($canvas_area.scrollLeft() / magnification));
		// if (get_direction() === "rtl") {
		// 	// magic number 8 is a guess, I guess based on the scrollbar width which shows on the left in RTL layout
		// 	// x = Math.max(0, Math.ceil(($canvas_area.innerWidth() - canvas.width + $canvas_area.scrollLeft() + 8) / magnification));
		// 	const scrollbar_width = $canvas_area[0].offsetWidth - $canvas_area[0].clientWidth; // maybe??
		// 	console.log("scrollbar_width", scrollbar_width);
		// 	x = Math.max(0, Math.ceil((-$canvas_area.innerWidth() + $canvas_area.scrollLeft() + scrollbar_width) / magnification + canvas.width));
		// }

		undoable({
			name: localize("Paste"),
			icon: get_help_folder_icon("p_paste.png"),
			soft: true,
		}, ()=> {
			selection = new OnCanvasSelection(x, y, img_or_canvas.width, img_or_canvas.height, img_or_canvas);
		});
	}
}

function render_history_as_gif(){
	const $win = $FormToolWindow();
	$win.title("Rendering GIF");
	
	const $output = $win.$main;
	const $progress = $(E("progress")).appendTo($output).addClass("inset-deep");
	const $progress_percent = $(E("span")).appendTo($output).css({
		width: "2.3em",
		display: "inline-block",
		textAlign: "center",
	});
	$win.$main.css({padding: 5});

	const $cancel = $win.$Button('Cancel', () => {
		$win.close();
	}).focus();

	$win.center();

	try{
		const width = main_canvas.width;
		const height = main_canvas.height;
		const gif = new GIF({
			//workers: Math.min(5, Math.floor(undos.length/50)+1),
			workerScript: "lib/gif.js/gif.worker.js",
			width,
			height,
		});

		$win.on('close', () => {
			gif.abort();
		});
	
		gif.on("progress", p => {
			$progress.val(p);
			$progress_percent.text(`${~~(p*100)}%`);
		});

		gif.on("finished", blob => {
			$win.title("Rendered GIF");
			const blob_url = URL.createObjectURL(blob);
			$output.empty().append(
				$(E("img")).attr({
					src: blob_url,
					width,
					height,
				})
			);
			$win.on("close", ()=> {
				// revoking on image load(+error) breaks right click > "Save image as" and "Open image in new tab"
				URL.revokeObjectURL(blob_url);
			});
			$win.$Button("Upload to Imgur", () => {
				$win.close();
				sanity_check_blob(blob, () => {
					show_imgur_uploader(blob);
				});
			}).focus();
			$win.$Button(localize("Save"), () => {
				$win.close();
				sanity_check_blob(blob, () => {
					const suggested_file_name = `${file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/i, "")} history.gif`;
					systemHooks.saveFile({
						dialogTitle: localize("Save As"), // localize("Save Animation As"),
						getBlob: ()=> blob,
						defaultFileName: suggested_file_name,
						defaultPath: document_file_path && `${document_file_path.replace(/[/\\][^/\\]*/)}/${suggested_file_name}`,
						defaultFileFormatID: "image/gif",
						formats: [{
							formatID: "image/gif",
							mimeType: "image/gif",
							name: localize("Animated GIF (*.gif)").replace(/\s+\([^(]+$/, ""),
							nameWithExtensions: localize("Animated GIF (*.gif)"),
							extensions: ["gif"],
						}],
					});
				});
			});
			$cancel.appendTo($win.$buttons);
			$win.center();
		});

		const gif_canvas = make_canvas(width, height);
		const frame_history_nodes = [...undos, current_history_node];
		for(const frame_history_node of frame_history_nodes){
			gif_canvas.ctx.clearRect(0, 0, gif_canvas.width, gif_canvas.height);
			gif_canvas.ctx.putImageData(frame_history_node.image_data, 0, 0);
			if (frame_history_node.selection_image_data) {
				const selection_canvas = make_canvas(frame_history_node.selection_image_data);
				gif_canvas.ctx.drawImage(selection_canvas, frame_history_node.selection_x, frame_history_node.selection_y);
			}
			gif.addFrame(gif_canvas, {delay: 200, copy: true});
		}
		gif.render();

	}catch(err){
		$win.close();
		show_error_message("Failed to render GIF.", err);
	}
}

function go_to_history_node(target_history_node, canceling) {
	const from_history_node = current_history_node;

	if (!target_history_node.image_data) {
		if (!canceling) {
			show_error_message("History entry has no image data.");
			window.console && console.log("Target history entry has no image data:", target_history_node);
		}
		return;
	}
	const current_image_data = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);
	if (!current_history_node.image_data || !image_data_match(current_history_node.image_data, current_image_data, 5)) {
		window.console && console.log("Canvas image data changed outside of undoable", current_history_node, "current_history_node.image_data:", current_history_node.image_data, "document's current image data:", current_image_data);
		undoable({name: "Unknown [go_to_history_node]", use_loose_canvas_changes: true}, ()=> {});
	}
	current_history_node = target_history_node;
	
	deselect(true);
	if (!canceling) {
		cancel(true);
	}
	saved = false;

	main_ctx.copy(target_history_node.image_data);
	if (target_history_node.selection_image_data) {
		if (selection) {
			selection.destroy();
		}
		// @TODO maybe: could store whether a selection is from Free-Form Select
		// so it selects Free-Form Select when you jump to e.g. Move Selection
		// (or could traverse history to figure it out)
		if (target_history_node.name === localize("Free-Form Select")) {
			select_tool(get_tool_by_id(TOOL_FREE_FORM_SELECT));
		} else {
			select_tool(get_tool_by_id(TOOL_SELECT));
		}
		selection = new OnCanvasSelection(
			target_history_node.selection_x,
			target_history_node.selection_y,
			target_history_node.selection_image_data.width,
			target_history_node.selection_image_data.height,
			target_history_node.selection_image_data,
		);
	}
	if (target_history_node.textbox_text != null) {
		if (textbox) {
			textbox.destroy();
		}
		// @# text_tool_font =
		for (const [k, v] of Object.entries(target_history_node.text_tool_font)) {
			text_tool_font[k] = v;
		}
		
		selected_colors.foreground = target_history_node.foreground_color;
		selected_colors.background = target_history_node.background_color;
		tool_transparent_mode = target_history_node.tool_transparent_mode;
		$G.trigger("option-changed");

		select_tool(get_tool_by_id(TOOL_TEXT));
		textbox = new OnCanvasTextBox(
			target_history_node.textbox_x,
			target_history_node.textbox_y,
			target_history_node.textbox_width,
			target_history_node.textbox_height,
			target_history_node.textbox_text,
		);
	}

	const ancestors_of_target = get_history_ancestors(target_history_node);

	undos = [...ancestors_of_target];
	undos.reverse();

	const old_history_path =
		redos.length > 0 ?
			[redos[0], ...get_history_ancestors(redos[0])] :
			[from_history_node, ...get_history_ancestors(from_history_node)];

	// window.console && console.log("target_history_node:", target_history_node);
	// window.console && console.log("ancestors_of_target:", ancestors_of_target);
	// window.console && console.log("old_history_path:", old_history_path);
	redos.length = 0;

	let latest_node = target_history_node;
	while (latest_node.futures.length > 0) {
		const futures = [...latest_node.futures];
		futures.sort((a, b)=> {
			if(old_history_path.indexOf(a) > -1) {
				return -1;
			}
			if(old_history_path.indexOf(b) > -1) {
				return +1;
			}
			return 0;
		});
		latest_node = futures[0];
		redos.unshift(latest_node);
	}
	// window.console && console.log("new undos:", undos);
	// window.console && console.log("new redos:", redos);

	$canvas_area.trigger("resize");
	$G.triggerHandler("session-update"); // autosave
	$G.triggerHandler("history-update"); // update history view
}
function undoable({name, icon, use_loose_canvas_changes, soft}, callback){
	if (!use_loose_canvas_changes) {
		const current_image_data = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);
		if (!current_history_node.image_data || !image_data_match(current_history_node.image_data, current_image_data, 5)) {
			window.console && console.log("Canvas image data changed outside of undoable", current_history_node, "current_history_node.image_data:", current_history_node.image_data, "document's current image data:", current_image_data);
			undoable({name: "Unknown [undoable]", use_loose_canvas_changes: true}, ()=> {});
		}
	}

	saved = false;

	const before_callback_history_node = current_history_node;
	callback && callback();
	if (current_history_node !== before_callback_history_node) {
		show_error_message(`History node switched during undoable callback for ${name}. This shouldn't happen.`);
		window.console && console.log(`History node switched during undoable callback for ${name}, from`, before_callback_history_node, "to", current_history_node);
	}

	const image_data = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);

	redos.length = 0;
	undos.push(current_history_node);

	const new_history_node = make_history_node({
		image_data,
		selection_image_data: selection && selection.canvas.ctx.getImageData(0, 0, selection.canvas.width, selection.canvas.height),
		selection_x: selection && selection.x,
		selection_y: selection && selection.y,
		textbox_text: textbox && textbox.$editor.val(),
		textbox_x: textbox && textbox.x,
		textbox_y: textbox && textbox.y,
		textbox_width: textbox && textbox.width,
		textbox_height: textbox && textbox.height,
		text_tool_font: JSON.parse(JSON.stringify(text_tool_font)),
		tool_transparent_mode,
		foreground_color: selected_colors.foreground,
		background_color: selected_colors.background,
		ternary_color: selected_colors.ternary,
		parent: current_history_node,
		name,
		icon,
		soft,
	});
	current_history_node.futures.push(new_history_node);
	current_history_node = new_history_node;

	$G.triggerHandler("history-update"); // update history view

	$G.triggerHandler("session-update"); // autosave
}
function make_or_update_undoable(undoable_meta, undoable_action) {
	if (current_history_node.futures.length === 0 && undoable_meta.match(current_history_node)) {
		undoable_action();
		current_history_node.image_data = main_ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);
		current_history_node.selection_image_data = selection && selection.canvas.ctx.getImageData(0, 0, selection.canvas.width, selection.canvas.height);
		current_history_node.selection_x = selection && selection.x;
		current_history_node.selection_y = selection && selection.y;
		if (undoable_meta.update_name) {
			current_history_node.name = undoable_meta.name;
		}
		$G.triggerHandler("history-update"); // update history view
	} else {
		undoable(undoable_meta, undoable_action);
	}
}
function undo(){
	if(undos.length<1){ return false; }

	redos.push(current_history_node);
	let target_history_node = undos.pop();

	while (target_history_node.soft && undos.length) {
		redos.push(target_history_node);
		target_history_node = undos.pop();
	}

	go_to_history_node(target_history_node);

	return true;
}

let $document_history_prompt_window;
function redo(){
	if(redos.length<1){
		if ($document_history_prompt_window) {
			$document_history_prompt_window.close();
		}
		if (!$document_history_window || $document_history_window.closed) {
			const $w = $document_history_prompt_window = new $ToolWindow();
			$w.title("Redo");
			$w.$content.html("Use Edit > History to view all branches of the history tree.").css({padding: 10});
			$w.$Button("Show History", show_document_history).css({margin: 10}).focus();
			$w.$Button(localize("Cancel"), ()=> { $w.close(); }).css({margin: 10});
			$w.center();
		}
		return false;
	}

	undos.push(current_history_node);
	let target_history_node = redos.pop();

	while (target_history_node.soft && redos.length) {
		undos.push(target_history_node);
		target_history_node = redos.pop();
	}

	go_to_history_node(target_history_node);

	return true;
}

function get_history_ancestors(node) {
	const ancestors = [];
	for (node = node.parent; node; node = node.parent) {
		ancestors.push(node);
	}
	return ancestors;
}

let $document_history_window;
// setTimeout(show_document_history, 100);
function show_document_history() {
	if ($document_history_prompt_window) {
		$document_history_prompt_window.close();
	}
	if ($document_history_window) {
		$document_history_window.close();
	}
	const $w = $document_history_window = new $ToolWindow();
	// $w.prependTo("body").css({position: ""});
	$w.title("Document History");
	$w.addClass("history-window squish");
	$w.$content.html(`
		<div class="history-view" tabIndex="0"></div>
	`);

	const $history_view = $w.$content.find(".history-view");
	$history_view.focus();

	let previous_scroll_position = 0;

	let rendered_$entries = [];
	let current_$entry;

	function render_tree_from_node(node) {
		const $entry = $(`
			<div class="history-entry">
				<div class="history-entry-icon-area"></div>
				<div class="history-entry-name"></div>
			</div>
		`);
		// $entry.find(".history-entry-name").text((node.name || "Unknown") + (node.soft ? " (soft)" : ""));
		$entry.find(".history-entry-name").text((node.name || "Unknown") + (node === root_history_node ? " (Start of History)" : ""));
		$entry.find(".history-entry-icon-area").append(node.icon);
		if (node === current_history_node) {
			$entry.addClass("current");
			current_$entry = $entry;
			requestAnimationFrame(()=> {
				// scrollIntoView causes <html> to scroll when the window is partially offscreen,
				// despite overflow: hidden on html and body, so it's not an option.
				$history_view[0].scrollTop =
					Math.min(
						$entry[0].offsetTop,
						Math.max(
							previous_scroll_position,
							$entry[0].offsetTop - $history_view[0].clientHeight + $entry.outerHeight()
						)
					);
			});
		} else {
			const history_ancestors = get_history_ancestors(current_history_node);
			if (history_ancestors.indexOf(node) > -1) {
				$entry.addClass("ancestor-of-current");
			}
		}
		for (const sub_node of node.futures) {
			render_tree_from_node(sub_node);
		}
		$entry.on("click", ()=> {
			go_to_history_node(node);
		});
		$entry.history_node = node;
		rendered_$entries.push($entry);
	}
	const render_tree = ()=> {
		previous_scroll_position = $history_view.scrollTop();
		$history_view.empty();
		rendered_$entries = [];
		render_tree_from_node(root_history_node);
		rendered_$entries.sort(($a, $b)=> {
			if ($a.history_node.timestamp < $b.history_node.timestamp) {
				return -1;
			}
			if ($b.history_node.timestamp < $a.history_node.timestamp) {
				return +1;
			}
			return 0;
		});
		rendered_$entries.forEach(($entry)=> {
			$history_view.append($entry);
		});
	};
	render_tree();

	// This is different from Ctrl+Z/Ctrl+Shift+Z because it goes over all branches of the history tree, chronologically,
	// not just one branch.
	const go_by = (index_delta)=> {
		const from_index = rendered_$entries.indexOf(current_$entry);
		const to_index = from_index + index_delta;
		if (rendered_$entries[to_index]) {
			rendered_$entries[to_index].click();
		}
	};
	$history_view.on("keydown", (event)=> {
		if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
			if (event.key === "ArrowDown" || event.key === "Down") {
				go_by(1);
				event.preventDefault();
			} else if (event.key === "ArrowUp" || event.key === "Up") {
				go_by(-1);
				event.preventDefault();
			}
		}
	});

	$G.on("history-update", render_tree);
	$w.on("close", ()=> {
		$G.off("history-update", render_tree);
	});

	$w.center();
}

function cancel(going_to_history_node){
	// Note: this function should be idempotent.
	// `cancel(); cancel();` should do the same thing as `cancel();`
	history_node_to_cancel_to = history_node_to_cancel_to || current_history_node;
	$G.triggerHandler("pointerup", ["canceling"]);
	for (const selected_tool of selected_tools) {
		selected_tool.cancel && selected_tool.cancel();
	}
	if (!going_to_history_node) {
		// Note: this will revert any changes from other users in multi-user sessions
		// which isn't good, but there's no real conflict resolution in multi-user mode anyways
		go_to_history_node(history_node_to_cancel_to, true);
	}
	history_node_to_cancel_to = null;
	update_helper_layer();
}
function meld_selection_into_canvas(going_to_history_node) {
	selection.draw();
	selection.destroy();
	selection = null;
	if (!going_to_history_node) {
		undoable({
			name: "Deselect",
			icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
			use_loose_canvas_changes: true, // HACK; @TODO: make OnCanvasSelection not change the canvas outside undoable, same rules as tools
		}, ()=> { });
	}
}
function meld_textbox_into_canvas(going_to_history_node) {
	const text = textbox.$editor.val();
	if (text && !going_to_history_node) {
		undoable({
			name: localize("Text"),
			icon: get_icon_for_tool(get_tool_by_id(TOOL_TEXT)),
			soft: true,
		}, ()=> { });
		undoable({
			name: "Finish Text",
			icon: get_icon_for_tool(get_tool_by_id(TOOL_TEXT)),
		}, () => {
			main_ctx.drawImage(textbox.canvas, textbox.x, textbox.y);
			textbox.destroy();
			textbox = null;
		});
	} else {
		textbox.destroy();
		textbox = null;
	}
}
function deselect(going_to_history_node){
	if(selection){
		meld_selection_into_canvas(going_to_history_node);
	}
	if(textbox){
		meld_textbox_into_canvas(going_to_history_node);
	}
	for (const selected_tool of selected_tools) {
		selected_tool.end && selected_tool.end(main_ctx);
	}
}
function delete_selection(meta={}){
	if(selection){
		undoable({
			name: meta.name || localize("Clear Selection"), //"Delete", (I feel like "Clear Selection" is unclear, could mean "Deselect")
			icon: meta.icon || get_help_folder_icon("p_delete.png"),
			// soft: @TODO: conditionally soft?,
		}, ()=> {
			selection.destroy();
			selection = null;
		});
	}
}
function select_all(){
	deselect();
	select_tool(get_tool_by_id(TOOL_SELECT));

	undoable({
		name: localize("Select All"),
		icon: get_icon_for_tool(get_tool_by_id(TOOL_SELECT)),
		soft: true,
	}, ()=> {
		selection = new OnCanvasSelection(0, 0, main_canvas.width, main_canvas.height);
	});
}

const ctrlOrCmd = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? "⌘" : "Ctrl";
const recommendationForClipboardAccess = `Please use the keyboard: ${ctrlOrCmd}+C to copy, ${ctrlOrCmd}+X to cut, ${ctrlOrCmd}+V to paste. If keyboard is not an option, try using Chrome version 76 or higher.`;
function try_exec_command(commandId) {
	if (document.queryCommandEnabled(commandId)) { // not a reliable source for whether it'll work, if I recall
		document.execCommand(commandId);
		if (!navigator.userAgent.includes("Firefox") || commandId === "paste") {
			return show_error_message(`That ${commandId} probably didn't work. ${recommendationForClipboardAccess}`);
		}
	} else {
		return show_error_message(`Cannot perform ${commandId}. ${recommendationForClipboardAccess}`);
	}
}

function getSelectionText() {
	let text = "";
	const activeEl = document.activeElement;
	const activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
	if (
		(activeElTagName == "textarea") || (activeElTagName == "input" &&
		/^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
		(typeof activeEl.selectionStart == "number")
	) {
		text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
	} else if (window.getSelection) {
		text = window.getSelection().toString();
	}
	return text;
}

function edit_copy(execCommandFallback){
	const text = getSelectionText();

	if (text.length > 0) {
		if (!navigator.clipboard || !navigator.clipboard.writeText) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				throw new Error(`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`);
				// throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
			}
		}
		navigator.clipboard.writeText(text);
	} else if(selection && selection.canvas) {
		if (!navigator.clipboard || !navigator.clipboard.write) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				throw new Error(`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`);
				// throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
			}
		}
		selection.canvas.toBlob(blob => {
			sanity_check_blob(blob, () => {
				navigator.clipboard.write([
					new ClipboardItem(Object.defineProperty({}, blob.type, {
						value: blob,
						enumerable: true,
					}))
				]).then(() => {
					window.console && console.log("Copied image to the clipboard.");
				}, error => {
					show_error_message("Failed to copy to the Clipboard.", error);
				});
			});
		});
	}
}
function edit_cut(execCommandFallback){
	if (!navigator.clipboard || !navigator.clipboard.write) {
		if (execCommandFallback) {
			return try_exec_command("cut");
		} else {
			throw new Error(`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`);
			// throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
		}
	}
	edit_copy();
	delete_selection({
		name: localize("Cut"),
		icon: get_help_folder_icon("p_cut.png"),
	});
}
async function edit_paste(execCommandFallback){
	if(
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement
	){
		if (!navigator.clipboard || !navigator.clipboard.readText) {
			if (execCommandFallback) {
				return try_exec_command("paste");
			} else {
				throw new Error(`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`);
				// throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
			}
		}
		const clipboardText = await navigator.clipboard.readText();
		document.execCommand("InsertText", false, clipboardText);
		return;
	}
	if (!navigator.clipboard || !navigator.clipboard.read) {
		if (execCommandFallback) {
			return try_exec_command("paste");
		} else {
			throw new Error(`${localize("Error getting the Clipboard Data!")} ${recommendationForClipboardAccess}`);
			// throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
		}
	}
	try {
		const clipboardItems = await navigator.clipboard.read();
		const blob = await clipboardItems[0].getType("image/png");
		paste_image_from_file(blob);
	} catch(error) {
		if (error.name === "NotFoundError") {
			try {
				const clipboardText = await navigator.clipboard.readText();
				if(clipboardText) {
					const uris = get_uris(clipboardText);
					if (uris.length > 0) {
						load_image_from_uri(uris[0]).then((info) => {
							paste(info.image || make_canvas(info.image_data));
						}, (error) => {
							show_resource_load_error_message(error);
						});
					} else {
						// @TODO: should I just make a textbox instead?
						show_error_message("The information on the Clipboard can't be inserted into Paint.");
					}
				} else {
					show_error_message("The information on the Clipboard can't be inserted into Paint.");
				}
			} catch(error) {
				show_error_message(localize("Error getting the Clipboard Data!"), error);
			}
		} else {
			show_error_message(localize("Error getting the Clipboard Data!"), error);
		}
	}
}

function image_invert_colors(){
	apply_image_transformation({
		name: localize("Invert Colors"),
		icon: get_help_folder_icon("p_invert.png"),
	}, (original_canvas, original_ctx, new_canvas, new_ctx) => {
		const monochrome_info = monochrome && detect_monochrome(original_ctx);
		if (monochrome && monochrome_info.isMonochrome) {
			invert_monochrome(original_ctx, new_ctx, monochrome_info);
		} else {
			invert_rgb(original_ctx, new_ctx);
		}
	});
}

function clear(){
	deselect();
	cancel();
	undoable({
		name: localize("Clear Image"),
		icon: get_help_folder_icon("p_blank.png"),
	}, () => {
		saved = false;

		if(transparency){
			main_ctx.clearRect(0, 0, main_canvas.width, main_canvas.height);
		}else{
			main_ctx.fillStyle = selected_colors.background;
			main_ctx.fillRect(0, 0, main_canvas.width, main_canvas.height);
		}
	});
}

function view_bitmap(){
	if(main_canvas.requestFullscreen){ main_canvas.requestFullscreen(); }
	if(main_canvas.webkitRequestFullscreen){ main_canvas.webkitRequestFullscreen(); }
}

function get_tool_by_id(id){
	for(let i=0; i<tools.length; i++){
		if(tools[i].id == id){
			return tools[i];
		}
	}
	for(let i=0; i<extra_tools.length; i++){
		if(extra_tools[i].id == id){
			return extra_tools[i];
		}
	}
}

// hacky but whatever
// this whole "multiple tools" thing is hacky for now
function select_tools(tools) {
	for (let i=0; i<tools.length; i++) {
		select_tool(tools[i], i > 0);
	}
	update_helper_layer();
}

function select_tool(tool, toggle){
	deselect();

	if(!(selected_tools.length === 1 && selected_tool.deselect)){
		return_to_tools = [...selected_tools];
	}
	if (toggle) {
		const index = selected_tools.indexOf(tool);
		if (index === -1) {
			selected_tools.push(tool);
			selected_tools.sort((a, b)=> {
				if (tools.indexOf(a) < tools.indexOf(b)) {
					return -1;
				}
				if (tools.indexOf(a) > tools.indexOf(b)) {
					return +1;
				}
				return 0;
			});
		} else {
			selected_tools.splice(index, 1);
		}
		if (selected_tools.length > 0) {
			selected_tool = selected_tools[selected_tools.length - 1];
		} else {
			selected_tool = default_tool;
			selected_tools = [selected_tool];
		}
	} else {
		selected_tool = tool;
		selected_tools = [tool];
	}
	
	if(tool.preload){
		tool.preload();
	}
	
	$toolbox.update_selected_tool();
	// $toolbox2.update_selected_tool();
}

function has_any_transparency(ctx) {
	// @TODO Optimization: Assume JPEGs and some other file types are opaque.
	// Raster file formats that SUPPORT transparency include GIF, PNG, BMP and TIFF
	// (Yes, even BMPs support transparency!)
	const id = ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);
	for(let i=0, l=id.data.length; i<l; i+=4){
		// I've seen firefox give [ 254, 254, 254, 254 ] for get_rgba_from_color("#fff")
		// or other values
		if(id.data[i+3] < 253){
			return true;
		}
	}
	return false;
}

function detect_monochrome(ctx) {
	// Note: Brave browser, and DuckDuckGo Privacy Essentials browser extension
	// implement a privacy technique known as "farbling", which breaks this code.
	// (I've implemented workarounds in many places, but not here yet.)
	// This function currently returns the set of one or two colors if applicable,
	// and things outside would need to be changed to handle a "near-monochrome" state.

	const id = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	const pixelArray = new Uint32Array(id.data.buffer); // to access as whole pixels (for greater efficiency & simplicity)
	// Note: values in pixelArray may be different on big endian vs little endian machines.
	// Use id.data, which is guaranteed to be in RGBA order, for getting color information.
	// Only use the Uint32Array for comparing pixel equality (faster than comparing each color component).
	const colorUint32s = [];
	const colorRGBAs = [];
	let anyTransparency = false;
	for(let i=0, len=pixelArray.length; i<len; i+=1){
		// @TODO: should this threshold not mirror has_any_transparency?
		// seems to have different notions of "any transparency"
		// has_any_transparency is "has any pixels not fully opaque"
		// detect_monochrome's anyTransparency means "has any pixels fully transparent"
		if (id.data[i*4+3] > 1) {
			if (!colorUint32s.includes(pixelArray[i])) {
				if (colorUint32s.length < 2) {
					colorUint32s.push(pixelArray[i]);
					colorRGBAs.push(id.data.slice(i*4, (i+1)*4));
				} else {
					return {isMonochrome: false};
				}
			}
		} else {
			anyTransparency = true;
		}
	}
	return {
		isMonochrome: true,
		presentNonTransparentRGBAs: colorRGBAs,
		presentNonTransparentUint32s: colorUint32s,
		monochromeWithTransparency: anyTransparency,
	};
}

function make_monochrome_pattern(lightness, rgba1=[0, 0, 0, 255], rgba2=[255, 255, 255, 255]){

	const dither_threshold_table = Array.from({length: 64}, (_undefined, p) => {
		const q = p ^ (p >> 3);
		return (
			((p & 4) >> 2) | ((q & 4) >> 1) |
			((p & 2) << 1) | ((q & 2) << 2) |
			((p & 1) << 4) | ((q & 1) << 5)
		) / 64;
	});

	const pattern_canvas = document.createElement("canvas");
	const pattern_ctx = pattern_canvas.getContext("2d");

	pattern_canvas.width = 8;
	pattern_canvas.height = 8;

	const pattern_image_data = main_ctx.createImageData(pattern_canvas.width, pattern_canvas.height);

	for(let x = 0; x < pattern_canvas.width; x += 1){
		for(let y = 0; y < pattern_canvas.height; y += 1){
			const map_value = dither_threshold_table[(x & 7) + ((y & 7) << 3)];
			const px_white = lightness > map_value;
			const index = ((y * pattern_image_data.width) + x) * 4;
			pattern_image_data.data[index + 0] = px_white ? rgba2[0] : rgba1[0];
			pattern_image_data.data[index + 1] = px_white ? rgba2[1] : rgba1[1];
			pattern_image_data.data[index + 2] = px_white ? rgba2[2] : rgba1[2];
			pattern_image_data.data[index + 3] = px_white ? rgba2[3] : rgba1[3];
		}
	}

	pattern_ctx.putImageData(pattern_image_data, 0, 0);

	return main_ctx.createPattern(pattern_canvas, "repeat");
}

function make_monochrome_palette(rgba1=[0, 0, 0, 255], rgba2=[255, 255, 255, 255]){
	const palette = [];
	const n_colors_per_row = 14;
	const n_colors = n_colors_per_row * 2;
	for(let i=0; i<n_colors_per_row; i++){
		let lightness = i / n_colors;
		palette.push(make_monochrome_pattern(lightness, rgba1, rgba2));
	}
	for(let i=0; i<n_colors_per_row; i++){
		let lightness = 1 - i / n_colors;
		palette.push(make_monochrome_pattern(lightness, rgba1, rgba2));
	}

	return palette;
}

function make_stripe_pattern(reverse, colors, stripe_size=4){
	const rgba_colors = colors.map(get_rgba_from_color);

	const pattern_canvas = document.createElement("canvas");
	const pattern_ctx = pattern_canvas.getContext("2d");

	pattern_canvas.width = colors.length * stripe_size;
	pattern_canvas.height = colors.length * stripe_size;

	const pattern_image_data = main_ctx.createImageData(pattern_canvas.width, pattern_canvas.height);

	for(let x = 0; x < pattern_canvas.width; x += 1){
		for(let y = 0; y < pattern_canvas.height; y += 1){
			const pixel_index = ((y * pattern_image_data.width) + x) * 4;
			// +1000 to avoid remainder on negative numbers
			const pos = reverse ? (x - y) : (x + y);
			const color_index = Math.floor((pos + 1000) / stripe_size) % colors.length;
			const rgba = rgba_colors[color_index];
			pattern_image_data.data[pixel_index + 0] = rgba[0];
			pattern_image_data.data[pixel_index + 1] = rgba[1];
			pattern_image_data.data[pixel_index + 2] = rgba[2];
			pattern_image_data.data[pixel_index + 3] = rgba[3];
		}
	}

	pattern_ctx.putImageData(pattern_image_data, 0, 0);

	return main_ctx.createPattern(pattern_canvas, "repeat");
}

function switch_to_polychrome_palette(){

}

function make_opaque() {
	undoable({
		name: "Make Opaque",
		icon: get_help_folder_icon("p_make_opaque.png"),
	}, ()=> {
		main_ctx.save();
		main_ctx.globalCompositeOperation = "destination-atop";

		main_ctx.fillStyle = selected_colors.background;
		main_ctx.fillRect(0, 0, main_canvas.width, main_canvas.height);
		
		// in case the selected background color is transparent/translucent
		main_ctx.fillStyle = "white";
		main_ctx.fillRect(0, 0, main_canvas.width, main_canvas.height);

		main_ctx.restore();
	});
}

function resize_canvas_without_saving_dimensions(unclamped_width, unclamped_height, undoable_meta={}) {
	const new_width = Math.max(1, unclamped_width);
	const new_height = Math.max(1, unclamped_height);
	if (main_canvas.width !== new_width || main_canvas.height !== new_height) {
		undoable({
			name: undoable_meta.name || "Resize Canvas",
			icon: undoable_meta.icon || get_help_folder_icon("p_stretch_both.png"),
		}, () => {
			try {
				const image_data = main_ctx.getImageData(0, 0, new_width, new_height);
				main_canvas.width = new_width;
				main_canvas.height = new_height;
				main_ctx.disable_image_smoothing();
				
				if(!transparency){
					main_ctx.fillStyle = selected_colors.background;
					main_ctx.fillRect(0, 0, main_canvas.width, main_canvas.height);
				}

				const temp_canvas = make_canvas(image_data);
				main_ctx.drawImage(temp_canvas, 0, 0);
			} catch (exception) {
				if (exception.name === "NS_ERROR_FAILURE") {
					// or localize("There is not enough memory or resources to complete operation.")
					show_error_message(localize("Insufficient memory to perform operation."), exception);
				} else {
					show_error_message(localize("An unknown error has occurred."), exception);
				}
				// @TODO: undo and clean up undoable
				// maybe even keep Attributes dialog open if that's what's triggering the resize
				return;
			}

			$canvas_area.trigger("resize");
		});
	}
}

function resize_canvas_and_save_dimensions(unclamped_width, unclamped_height, undoable_meta={}) {
	resize_canvas_without_saving_dimensions(unclamped_width, unclamped_height, undoable_meta);
	storage.set({
		width: main_canvas.width,
		height: main_canvas.height,
	}, (/*error*/) => {
		// oh well
	})
}

function image_attributes(){
	if(image_attributes.$window){
		image_attributes.$window.close();
	}
	const $w = image_attributes.$window = new $FormToolWindow(localize("Attributes"));
	$w.addClass("attributes-window");

	const $main = $w.$main;

	// Information

	const table = {
		[localize("File last saved:")]: localize("Not Available"), // @TODO: make available?
		[localize("Size on disk:")]: localize("Not Available"), // @TODO: make available?
		[localize("Resolution:")]: "72 x 72 dots per inch", // if localizing this, remove "direction" setting below
	};
	const $table = $(E("table")).appendTo($main);
	for(const k in table){
		const $tr = $(E("tr")).appendTo($table);
		const $key = $(E("td")).appendTo($tr).text(k);
		const $value = $(E("td")).appendTo($tr).text(table[k]);
		if (table[k].indexOf("72") !== -1) {
			$value.css("direction", "ltr");
		}
	}

	// Dimensions

	const unit_sizes_in_px = {px: 1, in: 72, cm: 28.3465};
	let current_unit = image_attributes.unit = image_attributes.unit || "px";
	let width_in_px = main_canvas.width;
	let height_in_px = main_canvas.height;

	const $width_label = $(E("label")).appendTo($main).text(localize("Width:"));
	const $height_label = $(E("label")).appendTo($main).text(localize("Height:"));
	const $width = $(E("input")).attr({type: "number", min: 1}).addClass("no-spinner inset-deep").appendTo($width_label);
	const $height = $(E("input")).attr({type: "number", min: 1}).addClass("no-spinner inset-deep").appendTo($height_label);

	$main.find("input")
		.css({width: "40px"})
		.on("change keyup keydown keypress pointerdown pointermove paste drop", ()=> {
			width_in_px = $width.val() * unit_sizes_in_px[current_unit];
			height_in_px = $height.val() * unit_sizes_in_px[current_unit];
		});

	// Fieldsets

	const $units = $(E("fieldset")).appendTo($main).append(`
		<legend>${localize("Units")}</legend>
		<div class="fieldset-body">
			<label><input type="radio" name="units" value="in">${localize("Inches")}</label>
			<label><input type="radio" name="units" value="cm">${localize("Cm")}</label>
			<label><input type="radio" name="units" value="px">${localize("Pixels")}</label>
		</div>
	`);
	$units.find(`[value=${current_unit}]`).attr({checked: true});
	$units.on("change", () => {
		const new_unit = $units.find(":checked").val();
		$width.val(width_in_px / unit_sizes_in_px[new_unit]);
		$height.val(height_in_px / unit_sizes_in_px[new_unit]);
		current_unit = new_unit;
	}).triggerHandler("change");

	const $colors = $(E("fieldset")).appendTo($main).append(`
		<legend>${localize("Colors")}</legend>
		<div class="fieldset-body">
			<label><input type="radio" name="colors" value="monochrome">${localize("Black and white")}</label>
			<label><input type="radio" name="colors" value="polychrome">${localize("Colors")}</label>
		</div>
	`);
	$colors.find(`[value=${monochrome ? "monochrome" : "polychrome"}]`).attr({checked: true});

	const $transparency = $(E("fieldset")).appendTo($main).append(`
		<legend>${localize("Transparency")}</legend>
		<div class="fieldset-body">
			<label><input type="radio" name="transparency" value="transparent">${localize("Transparent")}</label>
			<label><input type="radio" name="transparency" value="opaque">${localize("Opaque")}</label>
		</div>
	`);
	$transparency.find(`[value=${transparency ? "transparent" : "opaque"}]`).attr({checked: true});

	// Buttons on the right

	$w.$Button(localize("OK"), () => {
		const transparency_option = $transparency.find(":checked").val();
		const colors_option = $colors.find(":checked").val();
		const unit = $units.find(":checked").val();

		const was_monochrome = monochrome;
		let monochrome_info;

		image_attributes.unit = unit;
		transparency = (transparency_option == "transparent");
		monochrome = (colors_option == "monochrome");

		if(monochrome != was_monochrome){
			if (selection) {
				// want to detect monochrome based on selection + canvas
				// simplest way to do that is to meld them together
				meld_selection_into_canvas();
			}
			monochrome_info = detect_monochrome(main_ctx);

			if(monochrome){
				if(monochrome_info.isMonochrome && monochrome_info.presentNonTransparentRGBAs.length === 2) {
					palette = make_monochrome_palette(...monochrome_info.presentNonTransparentRGBAs);
				}else{
					palette = monochrome_palette;
				}
			}else{
				palette = polychrome_palette;
			}
			selected_colors.foreground = palette[0];
			selected_colors.background = palette[14]; // first in second row
			selected_colors.ternary = "";
			$colorbox.rebuild_palette();
			$G.trigger("option-changed");
		}

		const unit_to_px = unit_sizes_in_px[unit];
		const width = $width.val() * unit_to_px;
		const height = $height.val() * unit_to_px;
		resize_canvas_and_save_dimensions(~~width, ~~height);

		if (!transparency && has_any_transparency(main_ctx)) {
			make_opaque();
		}

		// 1. Must be after canvas resize to avoid weird undoable interaction and such.
		// 2. Check that monochrome option changed, same as above.
		//   a) for monochrome_info variable to be available
		//   b) Consider the case where color is introduced to the canvas while in monochrome mode.
		//      We only want to show this dialog if it would also change the palette (above), never leave you on an outdated palette.
		//   c) And it's nice to be able to change other options without worrying about it trying to convert the document to monochrome.
		if(monochrome != was_monochrome){
			if (monochrome && !monochrome_info.isMonochrome) {
				show_convert_to_black_and_white();
			}
		}

		image_attributes.$window.close();
	})[0].focus();

	$w.$Button(localize("Cancel"), () => {
		image_attributes.$window.close();
	});

	$w.$Button(localize("Default"), () => {
		width_in_px = default_canvas_width;
		height_in_px = default_canvas_height;
		$width.val(width_in_px / unit_sizes_in_px[current_unit]);
		$height.val(height_in_px / unit_sizes_in_px[current_unit]);
	});

	// Reposition the window

	image_attributes.$window.center();
}

function show_convert_to_black_and_white() {
	const $w = new $FormToolWindow("Convert to Black and White");
	$w.addClass("convert-to-black-and-white");
	$w.$main.append("<fieldset><legend>Threshold:</legend><input type='range' min='0' max='1' step='0.01' value='0.5'></fieldset>");
	const $slider = $w.$main.find("input[type='range']");
	const original_canvas = make_canvas(main_canvas);
	let threshold;
	const update_threshold = ()=> {
		make_or_update_undoable({
			name: "Make Monochrome",
			match: (history_node)=> history_node.name === "Make Monochrome",
			icon: get_help_folder_icon("p_monochrome.png"),
		}, ()=> {
			threshold = $slider.val();
			main_ctx.copy(original_canvas);
			threshold_black_and_white(main_ctx, threshold);
		});
	};
	update_threshold();
	$slider.on("input", debounce(update_threshold, 100));

	$w.$Button(localize("OK"), ()=> {
		$w.close();
	}).focus();
	$w.$Button(localize("Cancel"), ()=> {
		if (current_history_node.name === "Make Monochrome") {
			undo();
		} else {
			undoable({
				name: "Cancel Make Monochrome",
				icon: get_help_folder_icon("p_color.png"),
			}, ()=> {
				main_ctx.copy(original_canvas);
			});
		}
		$w.close();
	});
	$w.center();
}

function image_flip_and_rotate(){
	const $w = new $FormToolWindow(localize("Flip and Rotate"));
	$w.addClass("flip-and-rotate");

	const $fieldset = $(E("fieldset")).appendTo($w.$main);
	$fieldset.append(`
		<legend>${localize("Flip or rotate")}</legend>
		<div class="radio-wrapper">
			<input
				type="radio"
				name="flip-or-rotate"
				id="flip-horizontal"
				value="flip-horizontal"
				aria-keyshortcuts="Alt+F"
				checked
			/><label for="flip-horizontal">${display_hotkey(localize("&Flip horizontal"))}</label>
		</div>
		<div class="radio-wrapper">
			<input
				type="radio"
				name="flip-or-rotate"
				id="flip-vertical"
				value="flip-vertical"
				aria-keyshortcuts="Alt+V"
			/><label for="flip-vertical">${display_hotkey(localize("Flip &vertical"))}</label>
		</div>
		<div class="radio-wrapper">
			<input
				type="radio"
				name="flip-or-rotate"
				id="rotate-by-angle"
				value="rotate-by-angle"
				aria-keyshortcuts="Alt+R"
			/><label for="rotate-by-angle">${display_hotkey(localize("&Rotate by angle"))}</label>
		</div>
	`);

	const $rotate_by_angle = $(E("div")).appendTo($fieldset);
	$rotate_by_angle.addClass("sub-options");
	for (const label_with_hotkey of [
		"&90°",
		"&180°",
		"&270°",
	]) {
		const degrees = parseInt(remove_hotkey(label_with_hotkey), 10);
		$rotate_by_angle.append(`
			<div class="radio-wrapper">
				<input
					type="radio"
					name="rotate-by-angle"
					value="${degrees}"
					id="rotate-${degrees}"
					aria-keyshortcuts="Alt+${get_hotkey(label_with_hotkey).toUpperCase()}"
				/><label
					for="rotate-${degrees}"
				>${display_hotkey(label_with_hotkey)}</label>
			</div>
		`);
	}
	$rotate_by_angle.append(`
		<div class="radio-wrapper">
			<input
				type="radio"
				name="rotate-by-angle"
				value="arbitrary"
			/><input
				type="number"
				min="-360"
				max="360"
				name="rotate-by-arbitrary-angle"
				id="custom-degrees"
				value=""
				class="no-spinner inset-deep"
				style="width: 50px"
			/>
			<label for="custom-degrees">${localize("Degrees")}</label>
		</div>
	`);
	$rotate_by_angle.find("#rotate-90").attr({checked: true});
	// Disabling inputs makes them not even receive mouse events,
	// and so pointer-events: none is needed to respond to events on the parent.
	$rotate_by_angle.find("input").attr({disabled: true});
	$fieldset.find("input").on("change", () => {
		const action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		$rotate_by_angle.find("input").attr({
			disabled: action !== "rotate-by-angle"
		});
	});
	$rotate_by_angle.find(".radio-wrapper").on("click", (e)=> {
		// Select "Rotate by angle" and enable subfields
		$fieldset.find("input[value='rotate-by-angle']").prop("checked", true);
		$fieldset.find("input").triggerHandler("change");

		const $wrapper = $(e.target).closest(".radio-wrapper");
		// Focus the numerical input if this field has one
		const num_input = $wrapper.find("input[type='number']")[0];
		if (num_input) {
			num_input.focus();
		}
		// Select the radio for this field
		$wrapper.find("input[type='radio']").prop("checked", true);
	});

	$fieldset.find("input[name='rotate-by-arbitrary-angle']").on("input", ()=> {
		$fieldset.find("input[value='rotate-by-angle']").prop("checked", true);
		$fieldset.find("input[value='arbitrary']").prop("checked", true);
	});

	$w.$Button(localize("OK"), () => {
		const action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		switch(action){
			case "flip-horizontal":
				flip_horizontal();
				break;
			case "flip-vertical":
				flip_vertical();
				break;
			case "rotate-by-angle": {
				let angle_val = $fieldset.find("input[name='rotate-by-angle']:checked").val();
				if(angle_val === "arbitrary"){
					angle_val = $fieldset.find("input[name='rotate-by-arbitrary-angle']").val();
				}
				const angle_deg = parseFloat(angle_val);
				const angle = angle_deg / 360 * TAU;
		
				if(isNaN(angle)){
					please_enter_a_number();
					return;
				}
				rotate(angle);
				break;
			}
		}

		$canvas_area.trigger("resize");

		$w.close();
	})[0].focus();
	$w.$Button(localize("Cancel"), () => {
		$w.close();
	});

	$w.center();

	handle_keyshortcuts_alt_only($w);
}

function image_stretch_and_skew(){
	const $w = new $FormToolWindow(localize("Stretch and Skew"));
	$w.addClass("stretch-and-skew");

	const $fieldset_stretch = $(E("fieldset")).appendTo($w.$main);
	$fieldset_stretch.append(`<legend>${localize("Stretch")}</legend><table></table>`);
	const $fieldset_skew = $(E("fieldset")).appendTo($w.$main);
	$fieldset_skew.append(`<legend>${localize("Skew")}</legend><table></table>`);

	const $RowInput = ($table, img_src, label_with_hotkey, default_value, label_unit, min, max) => {
		const $tr = $(E("tr")).appendTo($table);
		const $img = $(E("img")).attr({
			src: `images/transforms/${img_src}.png`,
			width: 32,
			height: 32,
		}).css({
			marginRight: "20px"
		});
		const input_id = ("input" + Math.random() + Math.random()).replace(/\./, "");
		const $input = $(E("input")).attr({
			type: "number",
			min,
			max,
			value: default_value,
			id: input_id,
			"aria-keyshortcuts": `Alt+${get_hotkey(label_with_hotkey).toUpperCase()}`,
		}).css({
			width: "40px"
		}).addClass("no-spinner inset-deep");
		$(E("td")).appendTo($tr).append($img);
		$(E("td")).appendTo($tr).append($(E("label")).html(display_hotkey(label_with_hotkey)).attr("for", input_id));
		$(E("td")).appendTo($tr).append($input);
		$(E("td")).appendTo($tr).text(label_unit);

		return $input;
	};

	const stretch_x = $RowInput($fieldset_stretch.find("table"), "stretch-x", localize("&Horizontal:"), 100, "%", 1, 5000);
	const stretch_y = $RowInput($fieldset_stretch.find("table"), "stretch-y", localize("&Vertical:"), 100, "%", 1, 5000);
	const skew_x = $RowInput($fieldset_skew.find("table"), "skew-x", localize("H&orizontal:"), 0, localize("Degrees"), -90, 90);
	const skew_y = $RowInput($fieldset_skew.find("table"), "skew-y", localize("V&ertical:"), 0, localize("Degrees"), -90, 90);

	$w.$Button(localize("OK"), () => {
		const x_scale = parseFloat(stretch_x.val())/100;
		const y_scale = parseFloat(stretch_y.val())/100;
		const h_skew = parseFloat(skew_x.val())/360*TAU;
		const v_skew = parseFloat(skew_y.val())/360*TAU;
		if (isNaN(x_scale) || isNaN(y_scale) || isNaN(h_skew) || isNaN(v_skew)) {
			please_enter_a_number();
			return;
		}
		try {
			stretch_and_skew(x_scale, y_scale, h_skew, v_skew);
		} catch (exception) {
			if (exception.name === "NS_ERROR_FAILURE") {
				// or localize("There is not enough memory or resources to complete operation.")
				show_error_message(localize("Insufficient memory to perform operation."), exception);
			} else {
				show_error_message(localize("An unknown error has occurred."), exception);
			}
			// @TODO: undo and clean up undoable 
			return;
		}
		$canvas_area.trigger("resize");
		$w.close();
	})[0].focus();

	$w.$Button(localize("Cancel"), () => {
		$w.close();
	});

	$w.center();

	handle_keyshortcuts_alt_only($w);
}

// could be expanded to handle all different modifiers, but for now I'm naming it so the limitation is clear
function handle_keyshortcuts_alt_only($container) {
	$container.on("keydown", (event)=> {
		if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
			let shortcut_target = $container.find(`[aria-keyshortcuts="Alt+${event.key.toUpperCase()}"]`)[0];
			if (shortcut_target) {
				event.preventDefault();
				event.stopPropagation();
				if (shortcut_target.disabled) {
					shortcut_target = shortcut_target.closest(".radio-wrapper");
				}
				shortcut_target.click();
				shortcut_target.focus();
			}
		}
	});
}

function save_as_prompt({
	dialogTitle=localize("Save As"),
	defaultFileName="",
	defaultFileFormatID,
	formats,
	promptForName=true,
}) {
	return new Promise((resolve)=> {
		const $w = new $FormToolWindow(dialogTitle);
		$w.addClass("save-as");

		// @TODO: hotkeys (N, T, S, Enter, Esc)
		if (promptForName) {
			$w.$main.append(`
				<label>
					File name:
					<input type="text" class="file-name inset-deep"/>
				</label>
			`);
		}
		$w.$main.append(`
			<label>
				Save as type:
				<select class="file-type-select inset-deep"></select>
			</label>
		`);
		const $file_type = $w.$main.find(".file-type-select");
		const $file_name = $w.$main.find(".file-name");

		for (const format of formats) {
			$file_type.append($("<option>").val(format.formatID).text(format.nameWithExtensions));
		}

		if (promptForName) {
			$file_name.val(defaultFileName);
		}

		const get_selected_format = ()=> {
			const selected_format_id = $file_type.val();
			for (const format of formats) {
				if (format.formatID === selected_format_id) {
					return format;
				}
			}
		};

		// Select file type when typing file name
		const select_file_type_from_file_name = ()=> {
			const extension_match = (promptForName ? $file_name.val() : defaultFileName).match(/\.([\w\d]+)$/);
			if (extension_match) {
				const selected_format = get_selected_format();
				const matched_ext = extension_match[1].toLowerCase();
				if (selected_format && selected_format.extensions.includes(matched_ext)) {
					// File extension already matches selected file type.
					// Don't select a different file type with the same extension.
					return;
				}
				for (const format of formats) {
					if (format.extensions.includes(matched_ext)) {
						$file_type.val(format.formatID);
					}
				}
			}
		};
		if (promptForName) {
			$file_name.on("input", select_file_type_from_file_name);
		}
		if (defaultFileFormatID && formats.some((format)=> format.formatID === defaultFileFormatID)) {
			$file_type.val(defaultFileFormatID);
		} else {
			select_file_type_from_file_name();
		}

		// Change file extension when selecting file type
		// allowing non-default extension like .dib vs .bmp, .jpg vs .jpeg to stay
		const update_extension_from_file_type = (add_extension_if_absent)=> {
			if (!promptForName) {
				return;
			}
			let file_name = $file_name.val();
			const selected_format = get_selected_format();
			if (!selected_format) {
				return;
			}
			const extensions_for_type = selected_format.extensions;
			const primary_extension_for_type = extensions_for_type[0];
			// This way of removing the file extension doesn't scale very well! But I don't want to delete text the user wanted like in case of a version number...
			const without_extension = file_name.replace(/\.(\w{1,3}|apng|jpeg|jfif|tiff|webp|psppalette|sketchpalette|gimp|colors|scss|sass|less|styl|html|theme|themepack)$/i, "");
			const extension_present = without_extension !== file_name;
			const extension = file_name.slice(without_extension.length + 1).toLowerCase(); // without dot
			if (
				(add_extension_if_absent || extension_present) &&
				extensions_for_type.indexOf(extension) === -1
			) {
				file_name = `${without_extension}.${primary_extension_for_type}`;
				$file_name.val(file_name);
			}
		};
		$file_type.on("change", ()=> {
			update_extension_from_file_type(false);
		});
		// and initially
		update_extension_from_file_type(false);

		const $save = $w.$Button(localize("Save"), () => {
			$w.close();
			update_extension_from_file_type(true);
			resolve({
				newFileName: promptForName ? $file_name.val() : defaultFileName,
				newFileFormatID: $file_type.val(),
			});
		});
		$w.$Button(localize("Cancel"), () => {
			$w.close();
		});

		$w.center();
		// For mobile devices with on-screen keyboards, move the window to the top
		if (window.innerWidth < 500 || window.innerHeight < 700) {
			$w.css({ top: 20 });
		}

		if (promptForName) {
			$file_name.focus().select();
		} else {
			// $file_type.focus(); // most of the time you don't want to change the type from PNG
			$save.focus();
		}
	});
}

function write_image_file(canvas, mime_type, blob_callback) {
	const bmp_match = mime_type.match(/^image\/(?:x-)?bmp\s*(?:-(\d+)bpp)?/);
	if (bmp_match) {
		const file_content = encodeBMP(canvas.ctx.getImageData(0, 0, canvas.width, canvas.height), parseInt(bmp_match[1] || "24", 10));
		const blob = new Blob([file_content]);
		sanity_check_blob(blob, () => {
			blob_callback(blob);
		});
	} else {
		canvas.toBlob(blob => {
			// Note: could check blob.type (mime type) instead
			const png_magic_bytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
			sanity_check_blob(blob, () => {
				blob_callback(blob);
			}, png_magic_bytes, mime_type === "image/png");
		}, mime_type);
	}
}

function read_image_file(blob, callback) {
	// @TODO: handle SVG (might need to keep track of source URL, for relative resources)
	// @TODO: read palette from PNG, GIF files

	let file_format;
	let palette;
	let monochrome = false;

	blob.arrayBuffer().then((arrayBuffer)=> {
		// Helpers:
		// "GIF".split("").map(c=>"0x"+c.charCodeAt(0).toString("16")).join(", ")
		// [0x47, 0x49, 0x46].map(c=>String.fromCharCode(c)).join("")
		const magics = {
			png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
			bmp: [0x42, 0x4D], // "BM" in ASCII
			jpeg: [0xFF, 0xD8, 0xFF],
			gif: [0x47, 0x49, 0x46, 0x38], // "GIF8" in ASCII, fully either "GIF87a" or "GIF89a"
			webp: [0x57, 0x45, 0x42, 0x50], // "WEBP" in ASCII
			tiff_be: [0x4D, 0x4D, 0x0, 0x2A],
			tiff_le: [0x49, 0x49, 0x2A, 0x0],
			ico: [0x00, 0x00, 0x01, 0x00],
			cur: [0x00, 0x00, 0x02, 0x00],
			icns: [0x69, 0x63, 0x6e, 0x73], // "icns" in ASCII
		};
		const file_bytes = new Uint8Array(arrayBuffer);
		let detected_type_id;
		for (const [type_id, magic_bytes] of Object.entries(magics)) {
			const magic_found = magic_bytes.every((byte, index)=> byte === file_bytes[index]);
			if (magic_found) {
				detected_type_id = type_id;
			}
		}
		if (detected_type_id === "bmp") {
			const {colorTable, bitsPerPixel, imageData} = decodeBMP(arrayBuffer);
			file_format = bitsPerPixel === 24 ? "image/bmp" : `image/bmp;bpp=${bitsPerPixel}`;
			if (colorTable.length >= 2) {
				if (colorTable.length === 2) {
					palette = make_monochrome_palette(...colorTable.map((color)=> [color.r, color.g, color.b, 255]));
					monochrome = true;
				} else {
					palette = colorTable.map((color)=> `rgb(${color.r}, ${color.g}, ${color.b})`);
					monochrome = false;
				}
			}
			// if (bitsPerPixel !== 32 && bitsPerPixel !== 16) {
			// 	for (let i = 3; i < imageData.data.length; i += 4) {
			// 		imageData.data[i] = 255;
			// 	}
			// }
			callback(null, {file_format, monochrome, palette, image_data: imageData, source_blob: blob});
		} else {
			monochrome = false;
			file_format = {
				// bmp: "image/bmp",
				png: "image/png",
				webp: "image/webp",
				jpeg: "image/jpeg",
				gif: "image/gif",
				tiff_be: "image/tiff",
				tiff_le: "image/tiff", // can also be image/x-canon-cr2 etc.
				ico: "image/x-icon",
				cur: "image/x-win-bitmap",
				icns: "image/icns",
			}[detected_type_id] || blob.type;

			const blob_uri = URL.createObjectURL(blob);
			const img = new Image();
			// img.crossOrigin = "Anonymous";
			const handle_decode_fail = ()=> {
				URL.revokeObjectURL(blob_uri);
				blob.text().then((file_text)=> {
					const error = new Error("failed to decode blob as an image");
					error.code = file_text.match(/^\s*<!doctype\s+html/i) ? "html-not-image" : "decoding-failure";
					callback(error);
				}, (err)=> {
					const error = new Error("failed to decode blob as image or text");
					error.code = "decoding-failure";
					callback(error);
				});
			};
			img.onload = ()=> {
				URL.revokeObjectURL(blob_uri);
				if (!img.complete || typeof img.naturalWidth == "undefined" || img.naturalWidth === 0) {
					handle_decode_fail();
					return;
				}
				callback(null, {file_format, monochrome, palette, image: img, source_blob: blob});
			};
			img.onerror = handle_decode_fail;
			img.src = blob_uri;
		}
	}, (error)=> {
		callback(error);
	});
}

function update_from_saved_file(blob) {
	read_image_file(blob, (error, info)=> {
		if (error) {
			show_error_message("The file has been saved, however... " + localize("Paint cannot read this file."), error);
			return;
		}
		apply_file_format_and_palette_info(info);
		const format = image_formats.find(({mimeType})=> mimeType === info.file_format);
		undoable({
			name: `${localize("Save As")} ${format ? format.name : info.file_format}`,
			icon: get_help_folder_icon("p_save.png"),
		}, ()=> {
			main_ctx.copy(info.image || info.image_data);
		});
	});
}

function save_selection_to_file(){
	if(selection && selection.canvas){
		systemHooks.saveFile({
			dialogTitle: localize("Save As"),
			defaultName: "selection.png",
			defaultFileFormatID: "image/png",
			formats: image_formats,
			getBlob: (new_file_type)=> {
				return new Promise((resolve)=> {
					write_image_file(selection.canvas, new_file_type, (blob)=> {
						resolve(blob);
					});
				});
			},
		});
	}
}

function sanity_check_blob(blob, okay_callback, magic_number_bytes, magic_wanted=true){
	if(blob.size > 0){
		if (magic_number_bytes) {
			blob.arrayBuffer().then((arrayBuffer)=> {
				const file_bytes = new Uint8Array(arrayBuffer);
				const magic_found = magic_number_bytes.every((byte, index)=> byte === file_bytes[index]);
				// console.log(file_bytes, magic_number_bytes, magic_found, magic_wanted);
				if (magic_found === magic_wanted) {
					okay_callback();
				} else {
					const $w = $FormToolWindow().title(localize("Paint")).addClass("dialogue-window");
					// hackily combining messages that are already localized
					// you have to do some deduction to understand this message
					$w.$main.html(`
						<p>${localize("Unexpected file format.")}</p>
						<p>${localize("An unsupported operation was attempted.")}</p>
					`);
					$w.$main.css({maxWidth: "500px"});
					$w.$Button(localize("OK"), () => {
						$w.close();
					}).focus();
					$w.center();
				}
			}, (error)=> {
				show_error_message(localize("An unknown error has occurred."), error);
			});
		} else {
			okay_callback();
		}
	}else{
		show_error_message(localize("Failed to save document."));
	}
}

function show_multi_user_setup_dialog(from_current_document){
	const $w = $FormToolWindow().title("Multi-User Setup").addClass("dialogue-window");
	$w.$main.html(`
		${from_current_document ? "<p>This will make the current document public.</p>" : ""}
		<p>
			<!-- Choose a name for the multi-user session, included in the URL for sharing: -->
			Enter the session name that will be used in the URL for sharing:
		</p>
		<p>
			<label>
				<span class="partial-url-label">jspaint.app/#session:</span>
				<input
					type="text"
					id="session-name"
					aria-label="session name"
					pattern="[-0-9A-Za-z\\u00c0-\\u00d6\\u00d8-\\u00f6\\u00f8-\\u02af\\u1d00-\\u1d25\\u1d62-\\u1d65\\u1d6b-\\u1d77\\u1d79-\\u1d9a\\u1e00-\\u1eff\\u2090-\\u2094\\u2184-\\u2184\\u2488-\\u2490\\u271d-\\u271d\\u2c60-\\u2c7c\\u2c7e-\\u2c7f\\ua722-\\ua76f\\ua771-\\ua787\\ua78b-\\ua78c\\ua7fb-\\ua7ff\\ufb00-\\ufb06]+"
					title="Numbers, letters, and hyphens are allowed."
					class="inset-deep"
				>
			</label>
		</p>
	`);
	const $session_name = $w.$main.find("#session-name");
	$w.$main.css({maxWidth: "500px"});
	$w.$Button("Start", () => {
		let name = $session_name.val().trim();

		if(name == ""){
			show_error_message("The session name cannot be empty.");
		// }else if(name.match(/[./[\]#$]/)){
		// 	show_error_message("The session name cannot contain any of ./[]#$");
		// }else if(name.match(/\s/)){
		// 	show_error_message("The session name cannot contain spaces.");
		}else if($session_name.is(":invalid")){
			show_error_message("The session name must be made from only numbers, letters, and hyphens.");
		}else{
			if (from_current_document) {
				change_url_param("session", name);
			} else {
				// @TODO: load new empty session in the same browser tab
				// (or at least... keep settings like vertical-color-box-mode?)
				window.open(`${location.origin}${location.pathname}#session:${name}`);
			}
			$w.close();
		}
	});
	$w.$Button(localize("Cancel"), () => {
		$w.close();
	});
	$w.center();
	$session_name.focus();
}
