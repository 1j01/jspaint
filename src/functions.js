
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
					updates[param] = null; // must be enumerated (for Object.assign) but falsey, to get removed from the URL
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
	if (replace_history_state) {
		history.replaceState(null, document.title, new_url);
	} else {
		history.pushState(null, document.title, new_url);
	}

	$G.triggerHandler("change-url-params");
}

function update_magnified_canvas_size(){
	$canvas.css("width", canvas.width * magnification);
	$canvas.css("height", canvas.height * magnification);

	update_canvas_rect();
}

function update_canvas_rect() {
	canvas_bounding_client_rect = canvas.getBoundingClientRect();

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
		helper_layer = new OnCanvasHelperLayer(0, 0, canvas.width, canvas.height, false, scale);
	}

	const hcanvas = helper_layer.canvas;
	const hctx = hcanvas.ctx;

	const margin = 15;
	const viewport_x = Math.floor(Math.max($canvas_area.scrollLeft() / magnification - margin, 0));
	const viewport_y = Math.floor(Math.max($canvas_area.scrollTop() / magnification - margin, 0));
	const viewport_x2 = Math.floor(Math.min(viewport_x + $canvas_area.width() / magnification + margin*2, canvas.width));
	const viewport_y2 = Math.floor(Math.min(viewport_y + $canvas_area.height() / magnification + margin*2, canvas.height));
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
function show_custom_zoom_window() {
	if ($custom_zoom_window) {
		$custom_zoom_window.close();
	}
	const $w = new $FormToolWindow("Custom Zoom");
	$custom_zoom_window = $w;

	// @TODO: show Current zoom: blah% ?
	const $fieldset = $(E("fieldset")).appendTo($w.$main);
	$fieldset.append("<legend>Zoom to</legend>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='1'/>100%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='2'/>200%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='4'/>400%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='6'/>600%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='8'/>800%</label>");
	$fieldset.append("<label><input type='radio' name='custom-zoom-radio' value='really-custom'/><input type='number' min='10' max='1000' name='really-custom-zoom-input' value=''/>%</label>");
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

	$w.$Button("Okay", () => {
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
				const $msgw = new $FormToolWindow("Invalid Value").addClass("dialogue-window");
				$msgw.$main.text("The value specified for custom zoom was invalid.");
				$msgw.$Button("Okay", () => {
					$msgw.close();
				});
				return;
			}
		}else{
			mag = parseFloat(option_val);
		}

		set_magnification(mag);

		$w.close();
	})[0].focus();
	$w.$Button("Cancel", () => {
		$w.close();
	});

	$w.center();
}

function toggle_grid() {
	show_grid = !show_grid;
	// $G.trigger("option-changed");
	update_helper_layer();
}

function reset_colors(){
	colors = {
		foreground: "#000000",
		background: "#ffffff",
		ternary: "",
	};
	$G.trigger("option-changed");
}

function reset_file(){
	document_file_path = null;
	file_name = "untitled";
	update_title();
	saved = true;
}

function reset_canvas_and_history(){
	undos.length = 0;
	redos.length = 0;
	current_history_node = root_history_node = make_history_node({
		name: "New Document",
		icon: get_help_folder_icon("p_blank.png"),
	});
	history_node_to_cancel_to = null;

	canvas.width = Math.max(1, my_canvas_width);
	canvas.height = Math.max(1, my_canvas_height);
	ctx.disable_image_smoothing();
	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	current_history_node.image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

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
	document.title = `${file_name} - ${is_pride_month ? "Gay es " : ""}Paint`;

	if (is_pride_month) {
		$("link[rel~='icon']").attr("href", "./images/icons/gay-es-paint-16x16-light-outline.png");
	}
}

function create_and_trigger_input(attrs, callback){
	const $input = $(E("input")).attr(attrs)
		.on("change", ()=> {
			callback($input[0]);
			$input.remove();
		})
		.appendTo($app)
		.hide()
		.trigger("click");
	return $input;
}

// @TODO: rename these functions to lowercase (and maybe say "files" in this case)
function get_FileList_from_file_select_dialog(callback){
	// @TODO: specify mime types?
	create_and_trigger_input({type: "file"}, input => {
		callback(input.files);
	});
}

function open_from_Image(img, callback, canceled){
	are_you_sure(() => {
		// @TODO: shouldn't open_from_* start a new session?

		deselect();
		cancel();
		saved = false;

		reset_file();
		reset_colors();
		reset_canvas_and_history(); // (with newly reset colors)
		set_magnification(default_magnification);

		ctx.copy(img);
		detect_transparency();
		$canvas_area.trigger("resize");

		current_history_node.name = "Load Document";
		current_history_node.image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		current_history_node.icon = null; // @TODO

		$G.triggerHandler("session-update"); // autosave
		$G.triggerHandler("history-update"); // update history view

		callback && callback();
	}, canceled);
}
function get_URIs(text) {
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
function load_image_from_URI(uri, callback){
	const is_blob_uri = uri.match(/^blob:/);
	const is_download = !uri.match(/^(blob|data):/);

	if (is_blob_uri && uri.indexOf(`blob:${location.origin}`) === -1) {
		const error = new Error("can't load blob: URI from another domain");
		error.code = "cors-blob-uri";
		callback(error);
		return;
	}

	const uris_to_try = is_download ? [
		uri,
		// work around CORS headers not sent by whatever server
		`https://jspaint-cors-proxy.herokuapp.com/${uri}`,
		// if the image isn't available on the live web, see if it's archived
		`https://web.archive.org/${uri}`,
	] : [uri];

	let index = 0;
	const try_next_uri = ()=> {
		const uri_to_try = uris_to_try[index];
		if (is_download) {
			$status_text.text("Downloading picture...");
		}

		const handle_fetch_fail = ()=> {
			index += 1;
			if (index >= uris_to_try.length) {
				if (is_download) {
					$status_text.text("Failed to download picture.");
				}
				callback && callback(new Error(`failed to download image from any of three URIs (${JSON.stringify(uris_to_try)}).`));
			} else {
				try_next_uri();
			}
		};
		const show_progress = ({loaded, total})=> {
			if (is_download) {
				$status_text.text(`Downloading picture... (${Math.round(loaded/total*100)}%)`);
			}
		};

		if (is_download) {
			console.log(`Try loading image from URI (${index + 1}/${uris_to_try.length}): "${uri_to_try}"`);
		}
		fetch(uri_to_try)
		.then(response => {
			if (!response.ok) {
				throw Error(`${response.status} ${response.statusText}`);
			}
			if (!response.body) {
				if (is_download) {
					console.log("ReadableStream not yet supported in this browser. Progress won't be shown for image requests.");
				}
				return response;
			}
	
			// to access headers, server must send CORS header "Access-Control-Expose-Headers: content-encoding, content-length x-file-size"
			// server must send custom x-file-size header if gzip or other content-encoding is used
			const contentEncoding = response.headers.get("content-encoding");
			const contentLength = response.headers.get(contentEncoding ? "x-file-size" : "content-length");
			if (contentLength === null) {
				if (is_download) {
					console.log("Response size header unavailable. Progress won't be shown for this image request.");
				}
				return response;
			}
	
			const total = parseInt(contentLength, 10);
			let loaded = 0;
	
			return new Response(
				new ReadableStream({
					start(controller) {
						const reader = response.body.getReader();
	
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
		})
		.then(response => response.blob())
		.then(blob => {
			if (is_download) {
				console.log("Download complete.");
				$status_text.text("Download complete.");
			}
			const img = new Image();
			img.crossOrigin = "Anonymous";
			const handle_decode_fail = ()=> {
				// @TODO: use headers to detect HTML instead, since a doctype is not guaranteed
				// @TODO: fall back to WayBack Machine still for decode errors,
				// since a website might start redirecting swathes of URLs regardless of what they originally pointed to,
				// at which point they would likely point to a web page instead of an image.
				// (But still show an error about it not being an image, if WayBack also fails.)
				var fr = new FileReader();
				fr.onerror = ()=> {
					const error = new Error("failed to decode blob as image or text");
					error.code = "decode-fail";
					callback(error);
				};
				fr.onload = (e)=> {
					const error = new Error("failed to decode blob as an image");
					error.code = e.target.result.match(/^\s*<!doctype\s+html/i) ? "html-not-image" : "decode-fail";
					callback(error);
				};
				fr.readAsText(blob);
			};
			img.onload = ()=> {
				if (!img.complete || typeof img.naturalWidth == "undefined" || img.naturalWidth === 0) {
					handle_decode_fail();
					return;
				}
				callback(null, img);
			};
			img.onerror = handle_decode_fail;
			img.src = window.URL.createObjectURL(blob);
		})
		.catch(handle_fetch_fail);
	};
	try_next_uri();
}
function open_from_URI(uri, callback, canceled){
	load_image_from_URI(uri, (error, img) => {
		if(error){ return callback(error); }
		open_from_Image(img, callback, canceled);
	});
}
function open_from_File(file, callback, canceled){
	const blob_url = URL.createObjectURL(file);
	load_image_from_URI(blob_url, (error, img) => {
		// revoke object URL regardless of error
		URL.revokeObjectURL(file);
		if(error){ return callback(error); }

		open_from_Image(img, () => {
			file_name = file.name;
			document_file_path = file.path; // available in Electron
			update_title();
			saved = true;
			callback();
		}, canceled);
	});
}
function open_from_FileList(files, user_input_method_verb_past_tense){
	for (const file of files) {
		if (file.type.match(/^image/)) {
			open_from_File(file, err => {
				if(err){ return show_error_message("Failed to open file:", err); }
			});
			return;
		} else if (file.name.match(/\.theme(pack)?$/i)) {
			loadThemeFile(file);
			return;
		}
	}
	if(files.length > 1){
		show_error_message(`None of the files ${user_input_method_verb_past_tense} appear to be images.`);
	}else{
		show_error_message(`File ${user_input_method_verb_past_tense} does not appear to be an image.`);
	}
}

function loadThemeFile(file) {
	var reader = new FileReader();
	reader.onload = ()=> {
		loadThemeFromText(reader.result);
	};
	reader.readAsText(file);
}
function loadThemeFromText(fileText) {
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
		saved = false;

		reset_file();
		reset_colors();
		reset_canvas_and_history(); // (with newly reset colors)
		set_magnification(default_magnification);

		$G.triggerHandler("session-update"); // autosave
	});
}

// @TODO: factor out open_select/choose_file_dialog or get_file_from_file_select_dialog or whatever
// all these open_from_* things are done backwards, basically
// there's this little thing called Inversion of Control...
// also paste_from_file_select_dialog
function file_open(){
	get_FileList_from_file_select_dialog(files => {
		open_from_FileList(files, "selected");
	});
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
	$w.$main.html("<label>URL: <input type='url' required value='' class='url-input'/></label>");
	const $input = $w.$main.find(".url-input");
	$w.$Button("Load", () => {
		const uris = get_URIs($input.val());
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
	$w.$Button("Cancel", () => {
		$w.close();
	});
	$w.center();
	$input[0].focus();
}

function file_save(){
	deselect();
	if(file_name.match(/\.svg$/)){
		// @TODO: only affect suggested name in save dialog, don't change file_name
		file_name = `${file_name.replace(/\.svg$/, "")}.png`;
		return file_save_as();
	}
	if(document_file_path){
		// @TODO: save as JPEG by default if the previously opened/saved file was a JPEG?
		return save_to_file_path(document_file_path, "PNG", (saved_file_path, saved_file_name) => {
			saved = true;
			document_file_path = saved_file_path;
			file_name = saved_file_name;
			update_title();
		});
	}
	file_save_as();
}

function file_save_as(){
	deselect();
	save_canvas_as(canvas, `${file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "")}.png`, (saved_file_path, saved_file_name) => {
		saved = true;
		document_file_path = saved_file_path;
		file_name = saved_file_name;
		update_title();
	});
}


function are_you_sure(action, canceled){
	if(saved){
		action();
	}else{
		const $w = new $FormToolWindow().addClass("dialogue-window");
		$w.title("Paint");
		$w.$main.text(`Save changes to ${file_name}?`);
		$w.$Button("Save", () => {
			$w.close();
			file_save();
			action();
		})[0].focus();
		$w.$Button("Discard", () => {
			$w.close();
			action();
		});
		$w.$Button("Cancel", () => {
			$w.close();
			canceled && canceled();
		});
		$w.$x.on("click", () => {
			canceled && canceled();
		});
		$w.center();
	}
}

function show_error_message(message, error){
	const $w = $FormToolWindow().title("Error").addClass("dialogue-window");
	$w.$main.text(message);
	$w.$main.css("max-width", "600px");
	if(error){
		$(E("pre"))
		.appendTo($w.$main)
		.text(error.stack || error.toString())
		.css({
			background: "white",
			color: "#333",
			// background: "#A00",
			// color: "white",
			fontFamily: "monospace",
			width: "500px",
			overflow: "auto",
		});
	}
	$w.$Button("OK", () => {
		$w.close();
	});
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
	const $w = $FormToolWindow().title("Error").addClass("dialogue-window");
	const firefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
	if (error.code === "cors-blob-uri") {
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
	} else if (error.code === "decode-fail") {
		$w.$main.html(`
			<p>Address doesn't point to an image file of a supported format.</p>
			<p>Try copying and pasting an image instead of a URL.</p>
		`);
	} else {
		$w.$main.html(`
			<p>Failed to load image from URL.</p>
			<p>Check your browser's devtools for details.</p>
		`);
	}
	$w.$main.css({maxWidth: "500px"});
	$w.$Button("OK", () => {
		$w.close();
	});
	$w.center();
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
	$about_paint_window = $ToolWindow().title("About Paint");
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
	});
	
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
		entries_newer_than_this_version =
			$latest_entries.get().filter((el_from_latest)=>
				!entries_contains_update($this_version_entries, el_from_latest.id)
			);
		
		entries_new_in_this_version = // i.e. in development, when updating the news
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
}


// @TODO: DRY between these functions and open_from_* functions further?

// function paste_image_from_URI(uri, callback){
// 	load_image_from_URI(uri, (err, img)=> {
// 		if(err){ return callback(err); }
// 		paste(img);
// 	});
// };

function paste_image_from_file(file){
	const blob_url = URL.createObjectURL(file);
	// paste_image_from_URI(blob_url);
	load_image_from_URI(blob_url, (error, img) => {
		if(error){ return show_resource_load_error_message(error); }
		paste(img);
		URL.revokeObjectURL(blob_url);
	});
}

function paste_from_file_select_dialog(){
	get_FileList_from_file_select_dialog(files => {
		for (const file of files) {
			if(file.type.match(/^image/)){
				paste_image_from_file(file);
				return;
			}
		}
		if(files.length > 1){
			show_error_message(`None of the files selected appear to be images.`);
		}else{
			show_error_message(`File selected does not appear to be an image.`);
		}
	});
}

function paste(img){

	if(img.width > canvas.width || img.height > canvas.height){
		const $w = new $FormToolWindow().addClass("dialogue-window");
		$w.title("Paint");
		$w.$main.html(
			"The image is bigger than the canvas.<br>" +
			"Would you like the canvas to be enlarged?<br>"
		);
		$w.$Button("Enlarge", () => {
			$w.close();
			// The resize gets its own undoable, as in mspaint
			resize_canvas_and_save_dimensions(img.width, img.height, {
				name: "Enlarge Canvas For Paste",
				icon: get_help_folder_icon("p_stretch_both.png"),
			});
			do_the_paste();
			$canvas_area.trigger("resize");
		})[0].focus();
		$w.$Button("Crop", () => {
			$w.close();
			do_the_paste();
		});
		$w.$Button("Cancel", () => {
			$w.close();
		});
		$w.center();
	}else{
		do_the_paste();
	}

	function do_the_paste(){
		deselect();
		select_tool(get_tool_by_name("Select"));
		const x = Math.max(0, Math.ceil($canvas_area.scrollLeft() / magnification));
		const y = Math.max(0, Math.ceil($canvas_area.scrollTop() / magnification));

		undoable({
			name: "Paste",
			icon: get_help_folder_icon("p_paste.png"),
			soft: true,
		}, ()=> {
			selection = new OnCanvasSelection(x, y, img.width, img.height, img);
		});
	}
}

function render_history_as_gif(){
	const $win = $FormToolWindow();
	$win.title("Rendering GIF");
	$win.center();
	const $output = $win.$main;
	const $progress = $(E("progress")).appendTo($output);
	const $progress_percent = $(E("span")).appendTo($output).css({
		width: "2.3em",
		display: "inline-block",
		textAlign: "center",
	});
	$win.$main.css({padding: 5});

	const $cancel = $win.$Button('Cancel', () => {
		$win.close();
	});

	try{
		const width = canvas.width;
		const height = canvas.height;
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
			const url = URL.createObjectURL(blob);
			$output.empty().append(
				$(E("img")).attr({
					src: url,
					width,
					height,
				})
			);
			$win.$Button("Upload to Imgur", () => {
				$win.close();
				sanity_check_blob(blob, () => {
					show_imgur_uploader(blob);
				});
			});
			$win.$Button("Save", () => {
				$win.close();
				sanity_check_blob(blob, () => {
					saveAs(blob, `${file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "")} history.gif`);
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
		show_error_message("Failed to render GIF:", err);
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
	const current_image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	if (!current_history_node.image_data || !image_data_match(current_history_node.image_data, current_image_data, 5)) {
		window.console && console.log("Canvas image data changed outside of undoable", current_history_node, "current_history_node.image_data:", current_history_node.image_data, "document's current image data:", current_image_data);
		undoable({name: "Unknown [GTHN]", use_loose_canvas_changes: true}, ()=> {});
	}
	current_history_node = target_history_node;
	
	deselect(true);
	if (!canceling) {
		cancel(true);
	}
	saved = false;

	ctx.copy(target_history_node.image_data);
	if (target_history_node.selection_image_data) {
		if (selection) {
			selection.destroy();
		}
		// @TODO maybe: could store whether a selection is from Free-Form Select
		// so it selects Free-Form Select when you jump to e.g. Move Selection
		// (or could traverse history to figure it out)
		if (target_history_node.name === "Free-Form Select") {
			select_tool(get_tool_by_name("Free-Form Select"));
		} else {
			select_tool(get_tool_by_name("Select"));
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
		
		colors.foreground = target_history_node.foreground_color;
		colors.background = target_history_node.background_color;
		tool_transparent_mode = target_history_node.tool_transparent_mode;
		$G.trigger("option-changed");

		select_tool(get_tool_by_name("Text"));
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
		const current_image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

	const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

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
		foreground_color: colors.foreground,
		background_color: colors.background,
		ternary_color: colors.ternary,
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
		current_history_node.image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
			$w.$content.html("Press <b>Ctrl+Shift+Y</b> at any time to open the History window.");
			$w.$Button("Show History", show_document_history);
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
function show_document_history() {
	if ($document_history_prompt_window) {
		$document_history_prompt_window.close();
	}
	if ($document_history_window) {
		$document_history_window.close();
	}
	const $w = $document_history_window = new $ToolWindow();
	$w.title("Document History");
	$w.$content.html(`
		<div class="history-view"></div>
		<p>Press <b>Ctrl+Shift+Y</b> at any time to open this window.</p>
	`);

	const $history_view = $w.$content.find(".history-view");

	let previous_scroll_position = 0;

	let rendered_$entries = [];

	function render_tree_from_node(node) {
		const $entry = $(`
			<div class="history-entry">
				<div class="history-entry-icon-area"></div>
				<div class="history-entry-name"></div>
			</div>
		`);
		// $entry.find(".history-entry-name").text((node.name || "Unknown") + (node.soft ? " (soft)" : ""));
		$entry.find(".history-entry-name").text(node.name || "Unknown");
		$entry.find(".history-entry-icon-area").append(node.icon);
		if (node === current_history_node) {
			$entry.addClass("current");
			requestAnimationFrame(()=> {
				$history_view.scrollTop(previous_scroll_position);
				$entry[0].scrollIntoView({block: "nearest"});
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
			icon: get_icon_for_tool(get_tool_by_name("Select")),
			use_loose_canvas_changes: true, // HACK; @TODO: make OnCanvasSelection not change the canvas outside undoable, same rules as tools
		}, ()=> { });
	}
}
function meld_textbox_into_canvas(going_to_history_node) {
	const text = textbox.$editor.val();
	if (text && !going_to_history_node) {
		undoable({
			name: "Text",
			icon: get_icon_for_tool(get_tool_by_name("Text")),
			soft: true,
		}, ()=> { });
		undoable({
			name: "Finish Text",
			icon: get_icon_for_tool(get_tool_by_name("Text")),
		}, () => {
			ctx.drawImage(textbox.canvas, textbox.x, textbox.y);
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
		selected_tool.end && selected_tool.end(ctx);
	}
}
function delete_selection(meta={}){
	if(selection){
		undoable({
			name: meta.name || "Delete",
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
	select_tool(get_tool_by_name("Select"));

	undoable({
		name: "Select All",
		icon: get_icon_for_tool(get_tool_by_name("Select")),
		soft: true,
	}, ()=> {
		selection = new OnCanvasSelection(0, 0, canvas.width, canvas.height);
	});
}

const browserRecommendationForClipboardAccess = "Try using Chrome 76+";
function try_exec_command(commandId) {
	if (document.queryCommandEnabled(commandId)) { // not a reliable source for whether it'll work, if I recall
		document.execCommand(commandId);
		if (!navigator.userAgent.includes("Firefox") || commandId === "paste") {
			return show_error_message(`That ${commandId} probably didn't work. ${browserRecommendationForClipboardAccess}`);
		}
	} else {
		return show_error_message(`Cannot perform ${commandId}. ${browserRecommendationForClipboardAccess}`);
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

async function edit_copy(execCommandFallback){
	const text = getSelectionText();

	if (text.length > 0) {
		if (!navigator.clipboard || !navigator.clipboard.writeText) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
			}
		}
		navigator.clipboard.writeText(text);
	} else if(selection && selection.canvas) {
		if (!navigator.clipboard || !navigator.clipboard.write) {
			if (execCommandFallback) {
				return try_exec_command("copy");
			} else {
				throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
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
			throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
		}
	}
	edit_copy();
	delete_selection({
		name: "Cut",
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
				throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
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
			throw new Error(`The Async Clipboard API is not supported by this browser. ${browserRecommendationForClipboardAccess}`);
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
					const uris = get_URIs(clipboardText);
					if (uris.length > 0) {
						load_image_from_URI(uris[0], (error, img) => {
							if(error){ return show_resource_load_error_message(error); }
							paste(img);
						});
					} else {
						show_error_message("The information on the Clipboard can't be inserted into Paint.");
					}
				} else {
					show_error_message("The information on the Clipboard can't be inserted into Paint.");
				}
			} catch(error) {
				show_error_message("Failed to read from the Clipboard.", error);
			}
		} else {
			show_error_message("Failed to read from the Clipboard.", error);
		}
	}
}

function image_invert_colors(){
	apply_image_transformation({
		name: "Invert Colors",
		icon: get_help_folder_icon("p_invert.png"),
	}, (original_canvas, original_ctx, new_canvas, new_ctx) => {
		invert_rgb(original_ctx, new_ctx);
	});
}

function clear(){
	deselect();
	cancel();
	undoable({
		name: "Clear Image",
		icon: get_help_folder_icon("p_blank.png"),
	}, () => {
		saved = false;

		if(transparency){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}else{
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
	});
}

function view_bitmap(){
	if(canvas.requestFullscreen){ canvas.requestFullscreen(); }
	if(canvas.webkitRequestFullscreen){ canvas.webkitRequestFullscreen(); }
}

function get_tool_by_name(name){
	for(let i=0; i<tools.length; i++){
		if(tools[i].name == name){
			return tools[i];
		}
	}
	for(let i=0; i<extra_tools.length; i++){
		if(extra_tools[i].name == name){
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
	const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for(let i=0, l=id.data.length; i<l; i+=4){
		if(id.data[i+3] < 255){
			return true;
		}
	}
	return false;
}

function detect_transparency(){
	transparency = has_any_transparency(ctx);
}

function is_all_black_and_white(ctx) { 
	const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for(let i=0, l=id.data.length; i<l; i+=4){
		if(id.data[i+3] < 255){
			return false;
		}
		if(!(
			(id.data[i] === 255 && id.data[i+1] === 255 && id.data[i+2] === 255) ||
			(id.data[i] === 0 && id.data[i+1] === 0 && id.data[i+2] === 0)
		)){
			return false;
		}
	}
	return true;
}

function make_monochrome_pattern(lightness){

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

	const pattern_image_data = ctx.createImageData(pattern_canvas.width, pattern_canvas.height);

	for(let x = 0; x < pattern_canvas.width; x += 1){
		for(let y = 0; y < pattern_canvas.height; y += 1){
			const map_value = dither_threshold_table[(x & 7) + ((y & 7) << 3)];
			const px_white = lightness > map_value;
			const index = ((y * pattern_image_data.width) + x) * 4;
			pattern_image_data.data[index + 0] = px_white * 255;
			pattern_image_data.data[index + 1] = px_white * 255;
			pattern_image_data.data[index + 2] = px_white * 255;
			pattern_image_data.data[index + 3] = 255;
		}
	}

	pattern_ctx.putImageData(pattern_image_data, 0, 0);

	return ctx.createPattern(pattern_canvas, "repeat");
}

function make_monochrome_palette(){
	const palette = [];
	const n_colors_per_row = 14;
	const n_colors = n_colors_per_row * 2;
	for(let i=0; i<n_colors_per_row; i++){
		let lightness = i / n_colors;
		palette.push(make_monochrome_pattern(lightness));
	}
	for(let i=0; i<n_colors_per_row; i++){
		let lightness = 1 - i / n_colors;
		palette.push(make_monochrome_pattern(lightness));
	}

	return palette;
}

function make_stripe_pattern(reverse, colors, stripe_size=4){
	const rgba_colors = colors.map(get_rgba_from_color);

	const pattern_canvas = document.createElement("canvas");
	const pattern_ctx = pattern_canvas.getContext("2d");

	pattern_canvas.width = colors.length * stripe_size;
	pattern_canvas.height = colors.length * stripe_size;

	const pattern_image_data = ctx.createImageData(pattern_canvas.width, pattern_canvas.height);

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

	return ctx.createPattern(pattern_canvas, "repeat");
}

function switch_to_polychrome_palette(){

}

function make_opaque() {
	undoable({
		name: "Make Opaque",
		icon: get_help_folder_icon("p_make_opaque.png"),
	}, ()=> {
		ctx.save();
		ctx.globalCompositeOperation = "destination-atop";

		ctx.fillStyle = colors.background;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		// in case the selected background color is transparent/translucent
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.restore();
	});
}

function resize_canvas_without_saving_dimensions(unclamped_width, unclamped_height, undoable_meta={}) {
	const new_width = Math.max(1, unclamped_width);
	const new_height = Math.max(1, unclamped_height);
	if (canvas.width !== new_width || canvas.height !== new_height) {
		undoable({
			name: undoable_meta.name || "Resize Canvas",
			icon: undoable_meta.icon || get_help_folder_icon("p_stretch_both.png"),
		}, () => {
			const image_data = ctx.getImageData(0, 0, new_width, new_height);
			canvas.width = new_width;
			canvas.height = new_height;
			ctx.disable_image_smoothing();
			
			if(!transparency){
				ctx.fillStyle = colors.background;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			const temp_canvas = make_canvas(image_data);
			ctx.drawImage(temp_canvas, 0, 0);

			$canvas_area.trigger("resize");
		});
	}
}

function resize_canvas_and_save_dimensions(unclamped_width, unclamped_height, undoable_meta={}) {
	resize_canvas_without_saving_dimensions(unclamped_width, unclamped_height, undoable_meta);
	storage.set({
		width: canvas.width,
		height: canvas.height,
	}, (/*error*/) => {
		// oh well
	})
}

function image_attributes(){
	if(image_attributes.$window){
		image_attributes.$window.close();
	}
	const $w = image_attributes.$window = new $FormToolWindow("Attributes");

	const $main = $w.$main;

	// Information

	const table = {
		"File last saved": "Not available", // @TODO
		"Size on disk": "Not available", // @TODO
		"Resolution": "72 x 72 dots per inch",
	};
	const $table = $(E("table")).appendTo($main);
	for(const k in table){
		const $tr = $(E("tr")).appendTo($table);
		const $key = $(E("td")).appendTo($tr).text(`${k}:`);
		const $value = $(E("td")).appendTo($tr).text(table[k]);
	}

	// Dimensions

	const unit_sizes_in_px = {px: 1, in: 72, cm: 28.3465};
	let current_unit = image_attributes.unit = image_attributes.unit || "px";
	let width_in_px = canvas.width;
	let height_in_px = canvas.height;

	const $width_label = $(E("label")).appendTo($main).text("Width:");
	const $height_label = $(E("label")).appendTo($main).text("Height:");
	const $width = $(E("input")).attr({type: "number", min: 1}).addClass("no-spinner").appendTo($width_label);
	const $height = $(E("input")).attr({type: "number", min: 1}).addClass("no-spinner").appendTo($height_label);

	$main.find("input")
		.css({width: "40px"})
		.on("change keyup keydown keypress pointerdown pointermove paste drop", ()=> {
			width_in_px = $width.val() * unit_sizes_in_px[current_unit];
			height_in_px = $height.val() * unit_sizes_in_px[current_unit];
		});

	// Fieldsets

	const $units = $(E("fieldset")).appendTo($main).append('<legend>Units</legend>');
	$units.append('<label><input type="radio" name="units" value="in">Inches</label>');
	$units.append('<label><input type="radio" name="units" value="cm">Cm</label>');
	$units.append('<label><input type="radio" name="units" value="px">Pixels</label>');
	$units.find(`[value=${current_unit}]`).attr({checked: true});
	$units.on("change", () => {
		const new_unit = $units.find(":checked").val();
		$width.val(width_in_px / unit_sizes_in_px[new_unit]);
		$height.val(height_in_px / unit_sizes_in_px[new_unit]);
		current_unit = new_unit;
	}).triggerHandler("change");

	const $colors = $(E("fieldset")).appendTo($main).append('<legend>Colors</legend>');
	$colors.append('<label><input type="radio" name="colors" value="monochrome">Black and White</label>');
	$colors.append('<label><input type="radio" name="colors" value="polychrome">Color</label>');
	$colors.find(`[value=${monochrome ? "monochrome" : "polychrome"}]`).attr({checked: true});

	const $transparency = $(E("fieldset")).appendTo($main).append('<legend>Transparency</legend>');
	$transparency.append('<label><input type="radio" name="transparency" value="transparent">Transparent</label>');
	$transparency.append('<label><input type="radio" name="transparency" value="opaque">Opaque</label>');
	$transparency.find(`[value=${transparency ? "transparent" : "opaque"}]`).attr({checked: true});

	// Buttons on the right

	$w.$Button("Okay", () => {
		const transparency_option = $transparency.find(":checked").val();
		const colors_option = $colors.find(":checked").val();
		const unit = $units.find(":checked").val();

		const was_monochrome = monochrome;

		image_attributes.unit = unit;
		transparency = (transparency_option == "transparent");
		monochrome = (colors_option == "monochrome");

		if(monochrome != was_monochrome){
			if(monochrome){
				palette = monochrome_palette;
			}else{
				palette = polychrome_palette;
			}

			$colorbox.rebuild_palette();
			reset_colors();
		}
		if (monochrome && !is_all_black_and_white(ctx)) {
			show_convert_to_black_and_white();
		}

		const unit_to_px = unit_sizes_in_px[unit];
		const width = $width.val() * unit_to_px;
		const height = $height.val() * unit_to_px;
		resize_canvas_and_save_dimensions(~~width, ~~height);

		if (!transparency && has_any_transparency(ctx)) {
			make_opaque();
		}

		image_attributes.$window.close();
	})[0].focus();

	$w.$Button("Cancel", () => {
		image_attributes.$window.close();
	});

	$w.$Button("Default", () => {
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
	$w.$main.append("<fieldset><legend>Threshold</legend><input type='range' min='0' max='1' step='0.01' value='0.5'></fieldset>");
	const $slider = $w.$main.find("input[type='range']");
	const original_canvas = make_canvas(canvas);
	let threshold;
	const update_threshold = ()=> {
		make_or_update_undoable({
			name: "Make Monochrome",
			match: (history_node)=> history_node.name === "Make Monochrome",
			icon: get_help_folder_icon("p_monochrome.png"),
		}, ()=> {
			threshold = $slider.val();
			ctx.copy(original_canvas);
			threshold_black_and_white(ctx, threshold);
		});
	};
	update_threshold();
	$slider.on("input", debounce(update_threshold, 100));

	$w.$Button("Okay", ()=> {
		$w.close();
	});
	$w.$Button("Cancel", ()=> {
		if (current_history_node.name === "Make Monochrome") {
			undo();
		} else {
			undoable({
				name: "Cancel Make Monochrome",
				icon: get_help_folder_icon("p_monochrome_undo.png"),
			}, ()=> {
				ctx.copy(original_canvas);
			});
		}
		$w.close();
	});
	$w.center();
}

function image_flip_and_rotate(){
	const $w = new $FormToolWindow("Flip and Rotate");
	$w.addClass("flip-and-rotate");

	const $fieldset = $(E("fieldset")).appendTo($w.$main);
	$fieldset.append(`
		<legend>Flip or rotate</legend>
		<label><input type="radio" name="flip-or-rotate" value="flip-horizontal" checked/>Flip horizontal</label>
		<label><input type="radio" name="flip-or-rotate" value="flip-vertical"/>Flip vertical</label>
		<label><input type="radio" name="flip-or-rotate" value="rotate-by-angle"/>Rotate by angle</label>
	`);

	const $rotate_by_angle = $(E("div")).appendTo($fieldset);
	$rotate_by_angle.css({paddingLeft: "30px"});
	$rotate_by_angle.append(`
		<label><input type="radio" name="rotate-by-angle" value="90" checked/>90°</label>
		<label><input type="radio" name="rotate-by-angle" value="180"/>180°</label>
		<label><input type="radio" name="rotate-by-angle" value="270"/>270°</label>
		<label><input type="radio" name="rotate-by-angle" value="arbitrary"/><input type="number" min="-360" max="360" name="rotate-by-arbitrary-angle" value="" class="no-spinner" style="width: 50px"/> Degrees</label>
	`);
	$rotate_by_angle.find("input").attr({disabled: true});

	$fieldset.find("input").on("change", () => {
		const action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		$rotate_by_angle.find("input").attr({
			disabled: action !== "rotate-by-angle"
		});
	});
	$rotate_by_angle.find("label, input").on("click", (e)=> {
		// Select "Rotate by angle" and enable subfields
		$fieldset.find("input[value='rotate-by-angle']").prop("checked", true);
		$fieldset.find("input").triggerHandler("change");

		const $label = $(e.target).closest("label");
		// Focus the numerical input if this field has one
		const num_input = $label.find("input[type='number']")[0];
		if (num_input) {
			num_input.focus();
		}
		// Select the radio for this field
		$label.find("input[type='radio']").prop("checked", true);
	});
	// @TODO: enable all controls that are accessable to the pointer

	$fieldset.find("label").css({display: "block"});

	$w.$Button("Okay", () => {
		const action = $fieldset.find("input[name='flip-or-rotate']:checked").val();
		let angle_val = $fieldset.find("input[name='rotate-by-angle']:checked").val();
		if(angle_val === "arbitrary"){
			angle_val = $fieldset.find("input[name='rotate-by-arbitrary-angle']").val();
		}
		const angle_deg = parseFloat(angle_val);
		const angle = angle_deg / 360 * TAU;

		if(isNaN(angle)){
			const $msgw = new $FormToolWindow("Invalid Value").addClass("dialogue-window");
			$msgw.$main.text("The value specified for Degrees was invalid.");
			$msgw.$Button("Okay", () => {
				$msgw.close();
			});
			return;
		}

		switch(action){
			case "flip-horizontal":
				flip_horizontal();
				break;
			case "flip-vertical":
				flip_vertical();
				break;
			case "rotate-by-angle":
				rotate(angle);
				break;
		}

		$canvas_area.trigger("resize");

		$w.close();
	})[0].focus();
	$w.$Button("Cancel", () => {
		$w.close();
	});

	$w.center();
}

function image_stretch_and_skew(){
	const $w = new $FormToolWindow("Stretch and Skew");

	const $fieldset_stretch = $(E("fieldset")).appendTo($w.$main);
	$fieldset_stretch.append("<legend>Stretch</legend><table></table>");
	const $fieldset_skew = $(E("fieldset")).appendTo($w.$main);
	$fieldset_skew.append("<legend>Skew</legend><table></table>");

	const $RowInput = ($table, img_src, label_text, default_value, label_unit, min, max) => {
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
		}).css({
			width: "40px"
		}).addClass("no-spinner");
		$(E("td")).appendTo($tr).append($img);
		$(E("td")).appendTo($tr).append($(E("label")).text(label_text).attr("for", input_id));
		$(E("td")).appendTo($tr).append($input);
		$(E("td")).appendTo($tr).text(label_unit);

		return $input;
	};

	const stretch_x = $RowInput($fieldset_stretch.find("table"), "stretch-x", "Horizontal:", 100, "%", 1, 5000);
	const stretch_y = $RowInput($fieldset_stretch.find("table"), "stretch-y", "Vertical:", 100, "%", 1, 5000);
	const skew_x = $RowInput($fieldset_skew.find("table"), "skew-x", "Horizontal:", 0, "Degrees", -90, 90);
	const skew_y = $RowInput($fieldset_skew.find("table"), "skew-y", "Vertical:", 0, "Degrees", -90, 90);

	$w.$Button("Okay", () => {
		const xscale = parseFloat(stretch_x.val())/100;
		const yscale = parseFloat(stretch_y.val())/100;
		const hskew = parseFloat(skew_x.val())/360*TAU;
		const vskew = parseFloat(skew_y.val())/360*TAU;
		stretch_and_skew(xscale, yscale, hskew, vskew);
		$canvas_area.trigger("resize");
		$w.close();
	})[0].focus();

	$w.$Button("Cancel", () => {
		$w.close();
	});

	$w.center();
}

// @TODO: establish a better pattern for this (platform-specific functions, with browser-generic fallbacks)
// Note: we can't just poke in a different save_canvas_as function in electron-injected.js because electron-injected.js is loaded first
function save_canvas_as(canvas, fileName, savedCallbackUnreliable){
	if(window.systemSaveCanvasAs){
		return systemSaveCanvasAs(canvas, fileName, savedCallbackUnreliable);
	}

	// @TODO: file name + type dialog
	canvas.toBlob(blob => {
		sanity_check_blob(blob, () => {
			const file_saver = saveAs(blob, `${file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "")}.png`);
			file_saver.onwriteend = () => {
				// this won't fire in chrome
				savedCallbackUnreliable();
			};
		});
	});
}

function set_as_wallpaper_tiled(c = canvas) {
	// Note: we can't just poke in a different set_as_wallpaper_tiled function, because it's stored by reference in menus.js
	if(window.systemSetAsWallpaperTiled){
		return window.systemSetAsWallpaperTiled(c);
	}

	const wallpaperCanvas = make_canvas(screen.width, screen.height);
	const pattern = wallpaperCanvas.ctx.createPattern(c, "repeat");
	wallpaperCanvas.ctx.fillStyle = pattern;
	wallpaperCanvas.ctx.fillRect(0, 0, wallpaperCanvas.width, wallpaperCanvas.height);

	set_as_wallpaper_centered(wallpaperCanvas);
}

function set_as_wallpaper_centered(c = canvas) {
	// Note: we can't just poke in a different set_as_wallpaper_centered function, because it's stored by reference in menus.js
	if(window.systemSetAsWallpaperCentered){
		return window.systemSetAsWallpaperCentered(c);
	}

	c.toBlob(blob => {
		sanity_check_blob(blob, () => {
			saveAs(blob, `${file_name.replace(/\.(bmp|dib|a?png|gif|jpe?g|jpe|jfif|tiff?|webp|raw)$/, "")} wallpaper.png`);
		});
	});
}

/**
 * @param {HTMLElement} canvas
 * @return {Promise}
 */
function get_array_buffer_from_canvas(canvas) {
	return new Promise((resolve, reject) => {
		const file_reader = new FileReader();

		file_reader.onloadend = () => {
			resolve(file_reader.result);
		};

		file_reader.onerror = () => {
			reject(new Error("Failed to read canvas image to array buffer"));
		};

		canvas.toBlob(blob => {
			sanity_check_blob(blob, () => {
				file_reader.readAsArrayBuffer(blob);
			});
		});
	});
}

function save_selection_to_file(){
	if(selection && selection.canvas){
		selection.canvas.toBlob(blob => {
			sanity_check_blob(blob, () => {
				saveAs(blob, "selection.png");
			});
		});
	}
}

function sanity_check_blob(blob, okay_callback){
	if(blob.size > 0){
		okay_callback();
	}else{
		const $w = $FormToolWindow().title("Warning").addClass("dialogue-window");
		$w.$main.html(`
			<p>Tried to save file, but file was empty.</p>
			<p>Try again, or if the problem persists, report here:
			<a href='https://github.com/1j01/jspaint/issues/118'>Issue #118</a>
		`);
		$w.$main.css({maxWidth: "500px"});
		$w.$Button("OK", () => {
			$w.close();
		});
		$w.center();
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
	$w.$Button("Cancel", () => {
		$w.close();
	});
	$w.center();
	$session_name.focus();
}
