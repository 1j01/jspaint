
const default_magnification = 1;
const default_tool = get_tool_by_id(TOOL_PENCIL);

const default_canvas_width = 683;
const default_canvas_height = 384;
let my_canvas_width = default_canvas_width;
let my_canvas_height = default_canvas_height;

let aliasing = true;
let transparency = false;
let monochrome = false;

let magnification = default_magnification;
let return_to_magnification = 4;

const canvas = make_canvas();
canvas.classList.add("main-canvas");
const ctx = canvas.ctx;

const default_palette = [
	"rgb(0,0,0)", // Black
	"rgb(128,128,128)", // Dark Gray
	"rgb(128,0,0)", // Dark Red
	"rgb(128,128,0)", // Pea Green
	"rgb(0,128,0)", // Dark Green
	"rgb(0,128,128)", // Slate
	"rgb(0,0,128)", // Dark Blue
	"rgb(128,0,128)", // Lavender
	"rgb(128,128,64)", //
	"rgb(0,64,64)", //
	"rgb(0,128,255)", //
	"rgb(0,64,128)", //
	"rgb(64,0,255)", //
	"rgb(128,64,0)", //

	"rgb(255,255,255)", // White
	"rgb(192,192,192)", // Light Gray
	"rgb(255,0,0)", // Bright Red
	"rgb(255,255,0)", // Yellow
	"rgb(0,255,0)", // Bright Green
	"rgb(0,255,255)", // Cyan
	"rgb(0,0,255)", // Bright Blue
	"rgb(255,0,255)", // Magenta
	"rgb(255,255,128)", //
	"rgb(0,255,128)", //
	"rgb(128,255,255)", //
	"rgb(128,128,255)", //
	"rgb(255,0,128)", //
	"rgb(255,128,64)", //
];
const monochrome_palette_as_colors = [
	"rgb(0,0,0)",
	"rgb(9,9,9)",
	"rgb(18,18,18)",
	"rgb(27,27,27)",
	"rgb(37,37,37)",
	"rgb(46,46,46)",
	"rgb(55,55,55)",
	"rgb(63,63,63)",
	"rgb(73,73,73)",
	"rgb(82,82,82)",
	"rgb(92,92,92)",
	"rgb(101,101,101)",
	"rgb(110,110,110)",
	"rgb(119,119,119)",

	"rgb(255,255,255)",
	"rgb(250,250,250)",
	"rgb(242,242,242)",
	"rgb(212,212,212)",
	"rgb(201,201,201)",
	"rgb(191,191,191)",
	"rgb(182,182,182)",
	"rgb(159,159,159)",
	"rgb(128,128,128)",
	"rgb(173,173,173)",
	"rgb(164,164,164)",
	"rgb(155,155,155)",
	"rgb(146,146,146)",
	"rgb(137,137,137)",
];
let palette = default_palette;
let polychrome_palette = palette;
let monochrome_palette = make_monochrome_palette();

// https://github.com/kouzhudong/win2k/blob/ce6323f76d5cd7d136b74427dad8f94ee4c389d2/trunk/private/shell/win16/comdlg/color.c#L38-L43
// These are a fallback in case colors are not recieved from some driver.
// const default_basic_colors = [
// 	"#8080FF", "#80FFFF", "#80FF80", "#80FF00", "#FFFF80", "#FF8000", "#C080FF", "#FF80FF",
// 	"#0000FF", "#00FFFF", "#00FF80", "#40FF00", "#FFFF00", "#C08000", "#C08080", "#FF00FF",
// 	"#404080", "#4080FF", "#00FF00", "#808000", "#804000", "#FF8080", "#400080", "#8000FF",
// 	"#000080", "#0080FF", "#008000", "#408000", "#FF0000", "#A00000", "#800080", "#FF0080",
// 	"#000040", "#004080", "#004000", "#404000", "#800000", "#400000", "#400040", "#800040",
// 	"#000000", "#008080", "#408080", "#808080", "#808040", "#C0C0C0", "#400040", "#FFFFFF",
// ];
// Grabbed with Color Cop from the screen with Windows 98 SE running in VMWare
const basic_colors = [
	"#FF8080", "#FFFF80", "#80FF80", "#00FF80", "#80FFFF", "#0080FF", "#FF80C0", "#FF80FF",
	"#FF0000", "#FFFF00", "#80FF00", "#00FF40", "#00FFFF", "#0080C0", "#8080C0", "#FF00FF",
	"#804040", "#FF8040", "#00FF00", "#008080", "#004080", "#8080FF", "#800040", "#FF0080",
	"#800000", "#FF8000", "#008000", "#008040", "#0000FF", "#0000A0", "#800080", "#8000FF",
	"#400000", "#804000", "#004000", "#004040", "#000080", "#000040", "#400040", "#400080",
	"#000000", "#808000", "#808040", "#808080", "#408080", "#C0C0C0", "#400040", "#FFFFFF",
];
let custom_colors = [
	"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
	"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
];

// declared like this for Cypress tests
window.default_brush_shape = "circle";
window.default_brush_size = 4;
window.default_eraser_size = 8;
window.default_airbrush_size = 9;
window.default_pencil_size = 1;
window.default_stroke_size = 1; // applies to lines, curves, shape outlines
// declared like this for Cypress tests
window.brush_shape = default_brush_shape;
window.brush_size = default_brush_size
window.eraser_size = default_eraser_size;
window.airbrush_size = default_airbrush_size;
window.pencil_size = default_pencil_size;
window.stroke_size = default_stroke_size; // applies to lines, curves, shape outlines
let tool_transparent_mode = false;

let stroke_color;
let fill_color;
let stroke_color_k = "foreground"; // enum of "foreground", "background", "ternary"
let fill_color_k = "background"; // enum of "foreground", "background", "ternary"

let selected_tool = default_tool;
let selected_tools = [selected_tool];
let return_to_tools = [selected_tool];
window.colors = { // declared like this for Cypress tests
	foreground: "",
	background: "",
	ternary: "",
};

let selection; //the one and only OnCanvasSelection
let textbox; //the one and only OnCanvasTextBox
let helper_layer; //the OnCanvasHelperLayer for the grid and tool previews
let show_grid = false;
let text_tool_font = {
	family: '"Arial"', // should be an exact value detected by Font Detective
	size: 12,
	line_scale: 20 / 12,
	bold: false,
	italic: false,
	underline: false,
	vertical: false,
	color: "",
	background: "",
};

let root_history_node = make_history_node({name: "App Not Loaded Properly - Please send a bug report."}); // will be replaced
let current_history_node = root_history_node;
let history_node_to_cancel_to = null;
/** array of history nodes */
let undos = [];
/** array of history nodes */
let redos = [];

let file_name;
let document_file_path;
let saved = true;
let file_name_chosen = false;

/** works in canvas coordinates */
let pointer;
/** works in canvas coordinates */
let pointer_start;
/** works in canvas coordinates */
let pointer_previous;

let pointer_active = false;
let pointer_type, pointer_buttons;
let reverse;
let ctrl;
let button;
let pointer_over_canvas = false;
let update_helper_layer_on_pointermove_active = false;

/** works in client coordinates */
let pointers = [];

const update_from_url_params = ()=> {
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
		window.enable_speech_recognition && enable_speech_recognition();
	} else {
		window.disable_speech_recognition && disable_speech_recognition();
	}
};
update_from_url_params();
$G.on("hashchange popstate change-url-params", update_from_url_params);

// handle backwards compatibility URLs
if (location.search.match(/eye-gaze-mode/)) {
	change_url_param("eye-gaze-mode", true, {replace_history_state: true});
	update_from_url_params();
}
if (location.search.match(/vertical-colors?-box/)) {
	change_url_param("vertical-color-box", true, {replace_history_state: true});
	update_from_url_params();
}

const $app = $(E("div")).addClass("jspaint").appendTo("body");

const $V = $(E("div")).addClass("vertical").appendTo($app);
const $H = $(E("div")).addClass("horizontal").appendTo($V);

const $canvas_area = $(E("div")).addClass("canvas-area").appendTo($H);

const $canvas = $(canvas).appendTo($canvas_area);
$canvas.attr("touch-action", "none");
let canvas_bounding_client_rect = canvas.getBoundingClientRect(); // cached for performance, updated later
const getRect = ()=> ({left: 0, top: 0, width: canvas.width, height: canvas.height, right: canvas.width, bottom: canvas.height})
const $canvas_handles = $Handles($canvas_area, getRect, {
	outset: 4,
	get_offset_left: ()=> parseFloat($canvas_area.css("padding-left")) + 1,
	get_offset_top: ()=> parseFloat($canvas_area.css("padding-top")) + 1,
	size_only: true,
});
// hack: fix canvas handles causing document to scroll when selecting/deselecting
// by overriding these methods
$canvas_handles.hide = ()=> { $canvas_handles.css({opacity: 0, pointerEvents: "none"}); };
$canvas_handles.show = ()=> { $canvas_handles.css({opacity: "", pointerEvents: ""}); };

const $top = $(E("div")).addClass("component-area").prependTo($V);
const $bottom = $(E("div")).addClass("component-area").appendTo($V);
const $left = $(E("div")).addClass("component-area").prependTo($H);
const $right = $(E("div")).addClass("component-area").appendTo($H);
// there's also probably a CSS solution alternative to this
if (get_direction() === "rtl") {
	$left.appendTo($H);
	$right.prependTo($H);
}

const $status_area = $(E("div")).addClass("status-area").appendTo($V);
const $status_text = $(E("div")).addClass("status-text").appendTo($status_area);
const $status_position = $(E("div")).addClass("status-coordinates").appendTo($status_area);
const $status_size = $(E("div")).addClass("status-coordinates").appendTo($status_area);

const $news_indicator = $(`
	<a class='news-indicator' href='#project-news'>
		<img src='images/winter/present.png' width='24' height='22' alt=''/>
		<span class='marquee' dir='ltr' style='--text-width: 52ch; --animation-duration: 5s;'>
			<span>
				<strong>New!</strong>&nbsp;Localization, Eye Gaze Mode, and Speech Recognition!
			</span>
		</span>
	</a>
`);
$news_indicator.on("click auxclick", (event)=> {
	event.preventDefault();
	show_news();
});
// @TODO: use localstorage to show until clicked, if available
// and show for a longer period of time after the update, if available
if (Date.now() < Date.parse("Jan 5 2021 23:42:42 GMT-0500")) {
	$status_area.append($news_indicator);
}

$status_text.default = () => {
	$status_text.text(localize("For Help, click Help Topics on the Help Menu."));
};
$status_text.default();

// menu bar
let menu_bar_outside_frame = false;
if(frameElement){
	try{
		if(parent.$MenuBar){
			$MenuBar = parent.$MenuBar;
			menu_bar_outside_frame = true;
		}
	// eslint-disable-next-line no-empty
	}catch(e){}
}
const $menu_bar = $MenuBar(menus);
if(menu_bar_outside_frame){
	$menu_bar.insertBefore(frameElement);
}else{
	$menu_bar.prependTo($V);
}

$menu_bar.on("info", (_event, info) => {
	$status_text.text(info);
});
$menu_bar.on("default-info", ()=> {
	$status_text.default();
});
// </menu bar>

let $toolbox = $ToolBox(tools);
// let $toolbox2 = $ToolBox(extra_tools, true);//.hide();
// Note: a second $ToolBox doesn't work because they use the same tool options (which could be remedied)
// If there's to be extra tools, they should probably get a window, with different UI
// so it can display names of the tools, and maybe authors and previews (and not necessarily icons)

let $colorbox = $ColorBox($("body").hasClass("vertical-color-box-mode"));

$G.on("vertical-color-box-mode-toggled", ()=> {
	$colorbox.destroy();
	$colorbox = $ColorBox($("body").hasClass("vertical-color-box-mode"));
	prevent_selection($colorbox);
});
$G.on("eye-gaze-mode-toggled", ()=> {
	$colorbox.destroy();
	$colorbox = $ColorBox($("body").hasClass("vertical-color-box-mode"));
	prevent_selection($colorbox);
	
	$toolbox.destroy();
	$toolbox = $ToolBox(tools);
	prevent_selection($toolbox);

	// $toolbox2.destroy();
	// $toolbox2 = $ToolBox(extra_tools, true);
	// prevent_selection($toolbox2);
});


$canvas_area.on("user-resized", (_event, _x, _y, unclamped_width, unclamped_height) => {
	resize_canvas_and_save_dimensions(unclamped_width, unclamped_height);
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
$G.on("scroll focusin", (event) => {
	window.scrollTo(0, 0);
});

$("body").on("dragover dragenter", e => {
	const dt = e.originalEvent.dataTransfer;
	const has_files = Array.from(dt.types).includes("Files");
	if(has_files){
		e.preventDefault();
	}
}).on("drop", e => {
	if(e.isDefaultPrevented()){
		return;
	}
	const dt = e.originalEvent.dataTransfer;
	const has_files = Array.from(dt.types).includes("Files");
	if(has_files){
		e.preventDefault();
		if(dt && dt.files && dt.files.length){
			open_from_FileList(dt.files, "dropped");
		}
	}
});

$G.on("keydown", e => {
	if(e.isDefaultPrevented()){
		return;
	}
	if (e.keyCode === 27) { // Esc
		if (textbox && textbox.$editor.is(e.target)) {
			deselect();
		}
	}
	if (
		// Ctrl+Shift+Y
		(e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey &&
		String.fromCharCode(e.keyCode).toUpperCase() === "Y"
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
	if(
		e.target instanceof HTMLInputElement ||
		e.target instanceof HTMLTextAreaElement
	){
		return;
	}

	// @TODO: preventDefault in all cases where the event is handled
	// also, ideally check that modifiers *aren't* pressed
	// probably best to use a library at this point!
	
	if(selection){
		const nudge_selection = (delta_x, delta_y) => {
			selection.x += delta_x;
			selection.y += delta_y;
			selection.position();
		};
		switch(e.keyCode){
			case 37: // Left
				nudge_selection(-1, 0);
				e.preventDefault();
				break;
			case 39: // Right
				nudge_selection(+1, 0);
				e.preventDefault();
				break;
			case 40: // Down
				nudge_selection(0, +1);
				e.preventDefault();
				break;
			case 38: // Up
				nudge_selection(0, -1);
				e.preventDefault();
				break;
		}
	}

	if(e.keyCode === 27){ //Escape
		if(selection){
			deselect();
		}else{
			cancel();
		}
		window.stopSimulatingGestures && window.stopSimulatingGestures();
		window.trace_and_sketch_stop && window.trace_and_sketch_stop();
	}else if(e.keyCode === 13){ //Enter
		if(selection){
			deselect();
		}
	}else if(e.keyCode === 115){ //F4
		redo();
	}else if(e.keyCode === 46){ //Delete
		delete_selection();
	}else if(e.keyCode === 107 || e.keyCode === 109){ // Numpad Plus and Minus
		const plus = e.keyCode === 107;
		const minus = e.keyCode === 109;
		const delta = plus - minus; // const delta = +plus++ -minus--; // Δ = ±±±±

		if(selection){
			selection.scale(2 ** delta);
		}else{
			if(selected_tool.id === TOOL_BRUSH){
				brush_size = Math.max(1, Math.min(brush_size + delta, 500));
			}else if(selected_tool.id === TOOL_ERASER){
				eraser_size = Math.max(1, Math.min(eraser_size + delta, 500));
			}else if(selected_tool.id === TOOL_AIRBRUSH){
				airbrush_size = Math.max(1, Math.min(airbrush_size + delta, 500));
			}else if(selected_tool.id === TOOL_PENCIL){
				pencil_size = Math.max(1, Math.min(pencil_size + delta, 50));
			}else if(
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
			if(button !== undefined && pointer){ // pointer may only be needed for tests
				selected_tools.forEach((selected_tool)=> {
					tool_go(selected_tool);
				});
			}
			update_helper_layer();
		}
		e.preventDefault();
		return;
	}else if(e.ctrlKey || e.metaKey){
		const key = String.fromCharCode(e.keyCode).toUpperCase();
		if(textbox){
			switch(key){
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
		switch(e.keyCode){
			case 188: // , <
			case 219: // [ {
				rotate(-TAU/4);
				$canvas_area.trigger("resize");
			break;
			case 190: // . >
			case 221: // ] }
				rotate(+TAU/4);
				$canvas_area.trigger("resize");
			break;
		}
		switch(key){
			case "Z":
				e.shiftKey ? redo() : undo();
			break;
			case "Y":
				// Ctrl+Shift+Y handled above
				redo();
			break;
			case "G":
				e.shiftKey ? render_history_as_gif() : toggle_grid();
			break;
			case "F":
				view_bitmap();
			break;
			case "O":
				file_open();
			break;
			case "N":
				e.shiftKey ? clear() : file_new();
			break;
			case "S":
				e.shiftKey ? file_save_as() : file_save();
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
			default:
				return; // don't preventDefault
		}
		e.preventDefault();
	}
});
$G.on("cut copy paste", e => {
	if(e.isDefaultPrevented()){
		return;
	}
	if(
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement ||
		!window.getSelection().isCollapsed
	){
		// Don't prevent cutting/copying/pasting within inputs or textareas, or if there's a selection
		return;
	}

	e.preventDefault();
	const cd = e.originalEvent.clipboardData || window.clipboardData;
	if(!cd){ return; }

	if(e.type === "copy" || e.type === "cut"){
		if(selection && selection.canvas){
			const do_sync_clipboard_copy_or_cut = () => {
				// works only for pasting within a jspaint instance
				const data_url = selection.canvas.toDataURL();
				cd.setData("text/x-data-uri; type=image/png", data_url);
				cd.setData("text/uri-list", data_url);
				cd.setData("URL", data_url);
				if(e.type === "cut"){
					delete_selection({
						name: localize("Cut"),
						icon: get_help_folder_icon("p_cut.png"),
					});
				}
			};
			if (!navigator.clipboard || !navigator.clipboard.write) {
				return do_sync_clipboard_copy_or_cut();
			}
			try {
				if (e.type === "cut") {
					edit_cut();
				} else {
					edit_copy();
				}
			} catch(e) {
				do_sync_clipboard_copy_or_cut();
			}
		}
	}else if(e.type === "paste"){
		for (const item of cd.items) {
			if(item.type.match(/^text\/(?:x-data-uri|uri-list|plain)|URL$/)){
				item.getAsString(text => {
					const uris = get_URIs(text);
					if (uris.length > 0) {
						load_image_from_URI(uris[0], (error, img) => {
							if(error){ return show_resource_load_error_message(error); }
							paste(img);
						});
					} else {
						show_error_message("The information on the Clipboard can't be inserted into Paint.");
					}
				});
				break;
			}else if(item.type.match(/^image\//)){
				paste_image_from_file(item.getAsFile());
				break;
			}
		}
	}
});

reset_file();
reset_colors();
reset_canvas_and_history(); // (with newly reset colors)
set_magnification(default_magnification);

// this is synchronous for now, but @TODO: handle possibility of loading a document before callback
// when switching to asynchronous storage, e.g. with localforage
storage.get({
	width: default_canvas_width,
	height: default_canvas_height,
}, (err, stored_values) => {
	if(err){return;}
	my_canvas_width = stored_values.width;
	my_canvas_height = stored_values.height;
	
	make_or_update_undoable({
		match: (history_node)=> history_node.name === localize("New"),
		name: "Resize Canvas For New Document",
		icon: get_help_folder_icon("p_stretch_both.png"),
	}, ()=> {
		canvas.width = Math.max(1, my_canvas_width);
		canvas.height = Math.max(1, my_canvas_height);
		ctx.disable_image_smoothing();
		if(!transparency){
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		$canvas_area.trigger("resize");
	});
});

if(window.document_file_path_to_open){
	open_from_file_path(document_file_path_to_open, err => {
		if(err){
			return show_error_message(`Failed to open file ${document_file_path_to_open}`, err);
		}
	});
}

const lerp = (a, b, b_ness)=> a + (b - a) * b_ness;

const color_ramp = (num_colors, start_hsla, end_hsla)=>
	Array(num_colors).fill().map((_undefined, index, array)=>
		`hsla(${
			lerp(start_hsla[0], end_hsla[0], index/array.length)
		}deg, ${
			lerp(start_hsla[1], end_hsla[1], index/array.length)
		}%, ${
			lerp(start_hsla[2], end_hsla[2], index/array.length)
		}%, ${
			lerp(start_hsla[3], end_hsla[3], index/array.length)
		}%)`
	);

const update_palette_from_theme = ()=> {
	if (get_theme() === "winter.css") {
		const make_stripe_patterns = (reverse)=> [
			make_stripe_pattern(reverse, [
				"hsl(166, 93%, 38%)",
				"white",
			]),
			make_stripe_pattern(reverse, [
				"white",
				"hsl(355, 78%, 46%)",
			]),
			make_stripe_pattern(reverse, [
				"hsl(355, 78%, 46%)",
				"white",
				"white",
				"hsl(355, 78%, 46%)",
				"hsl(355, 78%, 46%)",
				"hsl(355, 78%, 46%)",
				"white",
				"white",
				"hsl(355, 78%, 46%)",
				"white",
			], 2),
			make_stripe_pattern(reverse, [
				"hsl(166, 93%, 38%)",
				"white",
				"white",
				"hsl(166, 93%, 38%)",
				"hsl(166, 93%, 38%)",
				"hsl(166, 93%, 38%)",
				"white",
				"white",
				"hsl(166, 93%, 38%)",
				"white",
			], 2),
			make_stripe_pattern(reverse, [
				"hsl(166, 93%, 38%)",
				"white",
				"hsl(355, 78%, 46%)",
				"white",
			], 2),
		];
		palette = [
			"black",
			// green
			"hsl(91, 55%, 81%)",
			"hsl(142, 57%, 64%)",
			"hsl(166, 93%, 38%)",
			"#04ce1f", // elf green
			"hsl(159, 93%, 16%)",
			// red
			"hsl(2, 77%, 27%)",
			"hsl(350, 100%, 50%)",
			"hsl(356, 97%, 64%)",
			// brown
			"#ad4632",
			"#5b3b1d",
			// stripes
			...make_stripe_patterns(false),
			// white to blue
			...color_ramp(
				6,
				[200, 100, 100, 100],
				[200, 100, 10, 100],
			),
			// pink
			"#fcbaf8",
			// silver
			"hsl(0, 0%, 90%)",
			"hsl(22, 5%, 71%)",
			// gold
			"hsl(48, 82%, 54%)",
			"hsl(49, 82%, 72%)",
			// stripes
			...make_stripe_patterns(true),
		];
		$colorbox.rebuild_palette();
	} else {
		palette = default_palette;
		$colorbox.rebuild_palette();
	}
};

$G.on("theme-load", update_palette_from_theme);
update_palette_from_theme();

function to_canvas_coords({clientX, clientY}) {
	const rect = canvas_bounding_client_rect;
	const cx = clientX - rect.left;
	const cy = clientY - rect.top;
	return {
		x: ~~(cx / rect.width * canvas.width),
		y: ~~(cy / rect.height * canvas.height),
	};
}

function update_fill_and_stroke_colors_and_lineWidth(selected_tool) {
	ctx.lineWidth = stroke_size;

	const reverse_because_fill_only = selected_tool.$options && selected_tool.$options.fill && !selected_tool.$options.stroke;
	ctx.fillStyle = fill_color =
	ctx.strokeStyle = stroke_color =
		colors[
			(ctrl && colors.ternary && pointer_active) ? "ternary" :
			((reverse ^ reverse_because_fill_only) ? "background" : "foreground")
		];
		
	fill_color_k =
	stroke_color_k =
		ctrl ? "ternary" : ((reverse ^ reverse_because_fill_only) ? "background" : "foreground");
		
	if(selected_tool.shape || selected_tool.shape_colors){
		if(!selected_tool.stroke_only){
			if((reverse ^ reverse_because_fill_only)){
				fill_color_k = "foreground";
				stroke_color_k = "background";
			}else{
				fill_color_k = "background";
				stroke_color_k = "foreground";
			}
		}
		ctx.fillStyle = fill_color = colors[fill_color_k];
		ctx.strokeStyle = stroke_color = colors[stroke_color_k];
	}
}

function tool_go(selected_tool, event_name){
	update_fill_and_stroke_colors_and_lineWidth(selected_tool);

	if(selected_tool[event_name]){
		selected_tool[event_name](ctx, pointer.x, pointer.y);
	}
	if(selected_tool.paint){
		selected_tool.paint(ctx, pointer.x, pointer.y);
	}
}
function canvas_pointer_move(e){
	ctrl = e.ctrlKey;
	shift = e.shiftKey;
	pointer = to_canvas_coords(e);
	
	// Quick Undo
	// (Note: pointermove also occurs when the set of buttons pressed changes,
	// except when another event would fire like pointerdown)
	if(pointers.length && e.button != -1){
		// compare buttons other than middle mouse button by using bitwise OR to make that bit of the number the same
		const MMB = 4;
		if(e.pointerType != pointer_type || (e.buttons | MMB) != (pointer_buttons | MMB)){
			cancel();
			pointer_active = false; // NOTE: pointer_active used in cancel()
			return;
		}
	}

	if(e.shiftKey){
		if(
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
		}else if(selected_tool.shape){
			// snap to four diagonals
			const w = Math.abs(pointer.x - pointer_start.x);
			const h = Math.abs(pointer.y - pointer_start.y);
			if(w < h){
				if(pointer.y > pointer_start.y){
					pointer.y = pointer_start.y + w;
				}else{
					pointer.y = pointer_start.y - w;
				}
			}else{
				if(pointer.x > pointer_start.x){
					pointer.x = pointer_start.x + h;
				}else{
					pointer.x = pointer_start.x - h;
				}
			}
		}
	}
	selected_tools.forEach((selected_tool)=> {
		tool_go(selected_tool);
	});
	pointer_previous = pointer;
}
$canvas.on("pointermove", e => {
	pointer = to_canvas_coords(e);
	$status_position.text(`${pointer.x},${pointer.y}`);
});
$canvas.on("pointerenter", ()=> {
	pointer_over_canvas = true;

	update_helper_layer();

	if (!update_helper_layer_on_pointermove_active) {
		$G.on("pointermove", update_helper_layer);
		update_helper_layer_on_pointermove_active = true;
	}
});
$canvas.on("pointerleave", ()=> {
	pointer_over_canvas = false;

	$status_position.text("");

	update_helper_layer();
	
	if (!pointer_active && update_helper_layer_on_pointermove_active) {
		$G.off("pointermove", update_helper_layer);
		update_helper_layer_on_pointermove_active = false;
	}
});

let clean_up_eye_gaze_mode = ()=> {};
$G.on("eye-gaze-mode-toggled", ()=> {
	if ($("body").hasClass("eye-gaze-mode")) {
		init_eye_gaze_mode();
	} else {
		clean_up_eye_gaze_mode();
	}
});
if ($("body").hasClass("eye-gaze-mode")) {
	init_eye_gaze_mode();
}

function init_eye_gaze_mode() {
	const circle_radius_max = 50; // dwell indicator size in pixels
	const hover_timespan = 500; // how long between the dwell indicator appearing and triggering a click
	const averaging_window_timespan = 500;
	const inactive_at_startup_timespan = 1500; // (should be at least averaging_window_timespan, but more importantly enough to make it not awkward when enabling eye gaze mode)
	const inactive_after_release_timespan = 1000; // after click or drag release (from dwell or otherwise)
	const inactive_after_hovered_timespan = 1000; // after dwell click indicator appears; does not control the time to finish that dwell click, only to click on something else after this is canceled (but it doesn't control that directly)
	const inactive_after_invalid_timespan = 1000; // after a dwell click is canceled due to an element popping up in front, or existing in front at the center of the other element
	const inactive_after_focused_timespan = 1000; // after page becomes focused after being unfocused
	let recent_points = [];
	let inactive_until_time = Date.now();
	let paused = false;
	let $pause_button;
	let hover_candidate;
	let gaze_dragging = null;

	const deactivate_for_at_least = (timespan)=> {
		inactive_until_time = Math.max(inactive_until_time, Date.now() + timespan);
	};
	deactivate_for_at_least(inactive_at_startup_timespan);

	const $halo = $("<div class='hover-halo'>").appendTo("body").hide();
	const $dwell_indicator = $("<div class='dwell-indicator'>").css({
		width: circle_radius_max,
		height: circle_radius_max,
	}).appendTo("body").hide();

	const on_pointer_move = (e)=> {
		recent_points.push({x: e.clientX, y: e.clientY, time: Date.now()});
	};
	const on_pointer_up_or_cancel = (e)=> {
		deactivate_for_at_least(inactive_after_release_timespan);
		gaze_dragging = null;
	};

	let page_focused = document.visibilityState === "visible"; // guess/assumption
	let mouse_inside_page = true; // assumption
	const on_focus = ()=> {
		page_focused = true;
		deactivate_for_at_least(inactive_after_focused_timespan);
	};
	const on_blur = ()=> {
		page_focused = false;
	};
	const on_mouse_leave_page = ()=> {
		mouse_inside_page = false;
	};
	const on_mouse_enter_page = ()=> {
		mouse_inside_page = true;
	};

	$G.on("pointermove", on_pointer_move);
	$G.on("pointerup pointercancel", on_pointer_up_or_cancel);
	$G.on("focus", on_focus);
	$G.on("blur", on_blur);
	$(document).on("mouseleave", on_mouse_leave_page);
	$(document).on("mouseenter", on_mouse_enter_page);

	const get_hover_candidate = (clientX, clientY)=> {

		if (!page_focused || !mouse_inside_page) return null;

		let target = document.elementFromPoint(clientX, clientY);
		if (!target) {
			return null;
		}
		
		let hover_candidate = {
			x: clientX,
			y: clientY,
			time: Date.now(),
		};
		
		// top level menus are just immediately switched between for now
		// prevent awkward hover clicks on top level menu buttons while menus are open
		if(
			(target.closest(".menu-button") || target.matches(".menu-container")) &&
			$(".menu-button.active").length
		) {
			return null;
		}

		const target_selector = `
			button:not([disabled]),
			input,
			textarea,
			label,
			a,
			.current-colors,
			.color-button,
			.edit-colors-window .swatch,
			.edit-colors-window .rainbow-canvas,
			.edit-colors-window .luminosity-canvas,
			.tool:not(.selected),
			.chooser-option,
			.menu-button:not(.active),
			.menu-item,
			.main-canvas,
			.selection canvas,
			.handle,
			.window:not(.maximized) .window-titlebar,
			.history-entry,
			.canvas-area
		`;
		// .canvas-area is handled specially below
		// (it's not itself a desired target)

		target = target.closest(target_selector);

		if (!target) {
			return null;
		}

		// if (target.matches(".help-window li")) {
		// 	target = target.querySelector(".item");
		// }

		if (target === $canvas_area[0]) {
			// Nudge hovers near the edges of the canvas onto the canvas
			const margin = 50;
			if (
				hover_candidate.x > canvas_bounding_client_rect.left - margin &&
				hover_candidate.y > canvas_bounding_client_rect.top - margin &&
				hover_candidate.x < canvas_bounding_client_rect.right + margin &&
				hover_candidate.y < canvas_bounding_client_rect.bottom + margin
			) {
				target = canvas;
				hover_candidate.x = Math.min(
					canvas_bounding_client_rect.right - 1,
					Math.max(
						canvas_bounding_client_rect.left,
						hover_candidate.x,
					),
				);
				hover_candidate.y = Math.min(
					canvas_bounding_client_rect.bottom - 1,
					Math.max(
						canvas_bounding_client_rect.top,
						hover_candidate.y,
					),
				);
			} else {
				return null;
			}
		}else if(!target.matches(".main-canvas, .selection canvas, .window-titlebar, .rainbow-canvas, .luminosity-canvas")){
			// Nudge hover previews to the center of buttons and things
			const rect = target.getBoundingClientRect();
			hover_candidate.x = rect.left + rect.width / 2;
			hover_candidate.y = rect.top + rect.height / 2;
		}
		hover_candidate.target = target;
		return hover_candidate;
	};

	const get_event_options = ({x, y, target=document.body})=> {
		const rect = target.getBoundingClientRect();
		return {
			pageX: x,
			pageY: y,
			clientX: x,
			clientY: y,
			// handling CSS transform scaling but not rotation
			offsetX: (x - rect.left) * target.offsetWidth / rect.width,
			offsetY: (y - rect.top) * target.offsetHeight / rect.height,
			pointerId: 1234567890,
			pointerType: "mouse",
			isPrimary: true,
		};
	};

	const update = ()=> {
		const time = Date.now();
		recent_points = recent_points.filter((point_record)=> time < point_record.time + averaging_window_timespan);
		if (recent_points.length) {
			const latest_point = recent_points[recent_points.length - 1];
			recent_points.push({x: latest_point.x, y: latest_point.y, time});
			const average_point = average_points(recent_points);
			// debug
			// const canvas_point = to_canvas_coords({clientX: average_point.x, clientY: average_point.y});
			// ctx.fillStyle = "red";
			// ctx.fillRect(canvas_point.x, canvas_point.y, 10, 10);
			const recent_movement_amount = Math.hypot(latest_point.x - average_point.x, latest_point.y - average_point.y);

			// Invalidate in case an element pops up in front of the element you're hovering over, e.g. a submenu
			if (hover_candidate && !gaze_dragging) {
				const apparent_hover_candidate = get_hover_candidate(hover_candidate.x, hover_candidate.y);
				if (apparent_hover_candidate) {
					if (
						apparent_hover_candidate.target !== hover_candidate.target &&
						apparent_hover_candidate.target.closest("label") !== hover_candidate.target
					) {
						hover_candidate = null;
						deactivate_for_at_least(inactive_after_invalid_timespan);
					}
				} else {
					hover_candidate = null;
					deactivate_for_at_least(inactive_after_invalid_timespan);
				}
			}
			
			let circle_position = latest_point;
			let circle_opacity = 0;
			let circle_radius = 0;
			if (hover_candidate) {
				circle_position = hover_candidate;
				circle_opacity = 0.4;
				circle_radius =
					(hover_candidate.time - time + hover_timespan) / hover_timespan
					* circle_radius_max;
				if (time > hover_candidate.time + hover_timespan) {
					if (pointer_active || gaze_dragging) {
						$(hover_candidate.target).trigger($.Event("pointerup", Object.assign(get_event_options(hover_candidate), {
							button: 0,
							buttons: 0,
						})));
					} else {
						pointers = []; // prevent multi-touch panning
						$(hover_candidate.target).trigger($.Event("pointerdown", Object.assign(get_event_options(hover_candidate), {
							button: 0,
							buttons: 1,
						})));
						const is_drag =
							hover_candidate.target.matches(".window-titlebar, .window-titlebar *:not(button)") ||
							hover_candidate.target.matches(".selection, .selection *, .handle") ||
							(
								hover_candidate.target === canvas &&
								selected_tool.id !== TOOL_PICK_COLOR &&
								selected_tool.id !== TOOL_FILL &&
								selected_tool.id !== TOOL_MAGNIFIER &&
								selected_tool.id !== TOOL_POLYGON &&
								selected_tool.id !== TOOL_CURVE
							);
						if (is_drag) {
							gaze_dragging = hover_candidate.target;
						} else {
							$(hover_candidate.target).trigger($.Event("pointerup", Object.assign(get_event_options(hover_candidate), {
								button: 0,
								buttons: 0,
							})));
							if (hover_candidate.target.matches("button:not(.toggle)")) {
								((button)=> {
									button.style.borderImage = "var(--inset-deep-border-image)";
									setTimeout(()=> {
										button.style.borderImage = "";
										// delay the button click to here so the pressed state is
										// visible even when the button closes a dialog
										button.click();
									}, 100);
								})(hover_candidate.target);
							} else {
								hover_candidate.target.click();
								if (hover_candidate.target.matches("input, textarea")) {
									hover_candidate.target.focus();
								}
							}
						}
					}
					hover_candidate = null;
					deactivate_for_at_least(inactive_after_hovered_timespan);
				}
			}

			if (gaze_dragging) {
				$dwell_indicator.addClass("for-release");
			} else {
				$dwell_indicator.removeClass("for-release");
			}
			$dwell_indicator.show().css({
				opacity: circle_opacity,
				transform: `scale(${circle_radius / circle_radius_max})`,
				left: circle_position.x - circle_radius_max/2,
				top: circle_position.y - circle_radius_max/2,
			});

			let halo_target =
				gaze_dragging ||
				(hover_candidate || get_hover_candidate(latest_point.x, latest_point.y) || {}).target;
			
			if (halo_target && (!paused || $pause_button.is(halo_target))) {
				let rect = halo_target.getBoundingClientRect();
				// Clamp to visible region if in scrollable area
				// (could generalize to look for overflow: auto parents in the future)
				if (halo_target.closest(".canvas-area")) {
					const scroll_area_rect = $canvas_area[0].getBoundingClientRect();
					rect = {
						left: Math.max(rect.left, scroll_area_rect.left),
						top: Math.max(rect.top, scroll_area_rect.top),
						right: Math.min(rect.right, scroll_area_rect.right),
						bottom: Math.min(rect.bottom, scroll_area_rect.bottom),
					};
					rect.width = rect.right - rect.left;
					rect.height = rect.bottom - rect.top;
				}
				// this is so overkill just for border radius mimicry
				const computed_style = getComputedStyle(halo_target);
				const border_radius_scale = parseInt(
					(
						$(halo_target).closest(".component").css("transform") || ""
					).match(/\d+/) || 1
				);
				$halo.css({
					display: "block",
					position: "fixed",
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height,
					// shorthand properties might not work in all browsers (not tested)
					// this is so overkill...
					borderTopRightRadius: parseFloat(computed_style.borderTopRightRadius) * border_radius_scale,
					borderTopLeftRadius: parseFloat(computed_style.borderTopLeftRadius) * border_radius_scale,
					borderBottomRightRadius: parseFloat(computed_style.borderBottomRightRadius) * border_radius_scale,
					borderBottomLeftRadius: parseFloat(computed_style.borderBottomLeftRadius) * border_radius_scale,
				});
			} else {
				$halo.hide();
			}

			if (time < inactive_until_time) {
				return;
			}
			if (recent_movement_amount < 5) {
				if (!hover_candidate) {
					hover_candidate = {
						x: average_point.x,
						y: average_point.y,
						time: Date.now(),
						target: gaze_dragging || null,
					};
					if (!gaze_dragging) {
						hover_candidate = get_hover_candidate(hover_candidate.x, hover_candidate.y);
					}
					if (hover_candidate && (paused && !$pause_button.is(hover_candidate.target))) {
						hover_candidate = null;
					}
				}
			}
			if (recent_movement_amount > 100) {
				if (gaze_dragging) {
					$G.trigger($.Event("pointerup", Object.assign(get_event_options(average_point), {
						button: 0,
						buttons: 0,
					})));
					pointers = []; // prevent multi-touch panning
				}
			}
			if (recent_movement_amount > 60) {
				hover_candidate = null;
			}
		}
	};
	let raf_id;
	const animate = ()=> {
		raf_id = requestAnimationFrame(animate);
		update();
	};
	raf_id = requestAnimationFrame(animate);

	const $floating_buttons =
		$("<div/>")
		.appendTo("body")
		.css({
			position: "fixed",
			bottom: 0,
			left: 0,
			transformOrigin: "bottom left",
			transform: "scale(3)",
		});
	
	$("<button title='Undo'/>")
	.on("click", undo)
	.appendTo($floating_buttons)
	.css({
		width: 28,
		height: 28,
		verticalAlign: "bottom",
		position: "relative", // to make the icon's "absolute" relative to here
	})
	.append(
		$("<div>")
		.css({
			position: "absolute",
			left: 0,
			top: 0,
			width: 24,
			height: 24,
			backgroundImage: "url(images/classic/undo.svg)",
		})
	);

	// These are matched on exactly for speech recognition synonymization
	const pause_button_text = "Pause Dwell Clicking";
	const resume_button_text = "Resume Dwell Clicking";

	$pause_button = $(`<button title="${pause_button_text}"/>`)
	.on("click", ()=> {
		paused = !paused;
		$pause_button
		.attr("title", paused ? resume_button_text : pause_button_text)
		.find("div").css({
			backgroundImage:
				paused ?
				"url(images/classic/eye-gaze-unpause.svg)" :
				"url(images/classic/eye-gaze-pause.svg)",
		});
	})
	.appendTo($floating_buttons)
	.css({
		width: 28,
		height: 28,
		verticalAlign: "bottom",
		position: "relative", // to make the icon's "absolute" relative to here
	})
	.append(
		$("<div>")
		.css({
			position: "absolute",
			left: 0,
			top: 0,
			width: 24,
			height: 24,
			backgroundImage: "url(images/classic/eye-gaze-pause.svg)",
		})
	);

	clean_up_eye_gaze_mode = ()=> {
		console.log("Cleaning up / disabling eye gaze mode");
		cancelAnimationFrame(raf_id);
		$halo.remove();
		$dwell_indicator.remove();
		$floating_buttons.remove();
		$G.off("pointermove", on_pointer_move);
		$G.off("pointerup pointercancel", on_pointer_up_or_cancel);
		$G.off("focus", on_focus);
		$G.off("blur", on_blur);
		$(document).off("mouseleave", on_mouse_leave_page);
		$(document).off("mouseenter", on_mouse_enter_page);
		clean_up_eye_gaze_mode = ()=> {};
	};
}

let pan_start_pos;
let pan_start_scroll_top;
let pan_start_scroll_left;
function average_points(points) {
	const average = {x: 0, y: 0};
	for (const pointer of points) {
		average.x += pointer.x;
		average.y += pointer.y;
	}
	average.x /= points.length;
	average.y /= points.length;
	return average;
}
$canvas_area.on("pointerdown", (event)=> {
	if (document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement) {
		// Allow unfocusing dialogs etc. in order to use keyboard shortcuts
		document.activeElement.blur();
	}

	if (pointers.every((pointer)=>
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
			isPrimary: event.originalEvent && event.originalEvent.isPrimary || event.isPrimary,
			x: event.clientX,
			y: event.clientY,
		});
	}

	if (pointers.length == 2) {
		pan_start_pos = average_points(pointers);
		pan_start_scroll_top = $canvas_area.scrollTop();
		pan_start_scroll_left = $canvas_area.scrollLeft();
	}
	// Quick Undo when there are multiple pointers (i.e. for touch)
	// see pointermove for other pointer types
	if (pointers.length >= 2) {
		cancel();
		pointer_active = false; // NOTE: pointer_active used in cancel()
		return;
	}
});
$G.on("pointerup pointercancel", (event)=> {
	pointers = pointers.filter((pointer)=>
		pointer.pointerId !== event.pointerId
	);
});
$G.on("pointermove", (event)=> {
	for (const pointer of pointers) {
		if (pointer.pointerId === event.pointerId) {
			pointer.x = event.clientX;
			pointer.y = event.clientY;
		}
	}
	if (pointers.length >= 2) {
		const current_pos = average_points(pointers);
		const difference_in_x = current_pos.x - pan_start_pos.x;
		const difference_in_y = current_pos.y - pan_start_pos.y;
		$canvas_area.scrollLeft(pan_start_scroll_left - difference_in_x);
		$canvas_area.scrollTop(pan_start_scroll_top - difference_in_y);
	}
});

// window.onerror = show_error_message;

$canvas.on("pointerdown", e => {
	update_canvas_rect();

	// Quick Undo when there are multiple pointers (i.e. for touch)
	// see pointermove for other pointer types
	// NOTE: this relies on event handler order for pointerdown
	// pointer is not added to pointers yet
	if(pointers.length >= 1){
		cancel();
		pointer_active = false; // NOTE: pointer_active used in cancel()
		// in eye gaze mode, allow drawing with mouse after canceling gaze gesture with mouse
		pointers = pointers.filter((pointer)=>
			pointer.pointerId !== 1234567890
		);
		return;
	}

	history_node_to_cancel_to = current_history_node;
	
	pointer_active = !!(e.buttons & (1 | 2)); // as far as tools are concerned
	pointer_type = e.pointerType;
	pointer_buttons = e.buttons;
	$G.one("pointerup", ()=> {
		pointer_active = false;
		update_helper_layer();
		
		if (!pointer_over_canvas && update_helper_layer_on_pointermove_active) {
			$G.off("pointermove", update_helper_layer);
			update_helper_layer_on_pointermove_active = false;
		}
	});
	
	if(e.button === 0){
		reverse = false;
	}else if(e.button === 2){
		reverse = true;
	}else{
		return;
	}

	button = e.button;
	ctrl = e.ctrlKey;
	shift = e.shiftKey;
	pointer_start = pointer_previous = pointer = to_canvas_coords(e);

	const pointerdown_action = () => {
		let interval_ids = [];
		selected_tools.forEach((selected_tool)=> {
			if(selected_tool.paint || selected_tool.pointerdown){
				tool_go(selected_tool, "pointerdown");
			}
			if(selected_tool.paint_on_time_interval != null){
				interval_ids.push(setInterval(()=> {
					tool_go(selected_tool);
				}, selected_tool.paint_on_time_interval));
			}
		});

		$G.on("pointermove", canvas_pointer_move);

		$G.one("pointerup", (e, canceling) => {
			button = undefined;
			reverse = false;

			pointer = to_canvas_coords(e);
			selected_tools.forEach((selected_tool)=> {
				selected_tool.pointerup && selected_tool.pointerup(ctx, pointer.x, pointer.y);
			});

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
	
	update_helper_layer();
});

$canvas_area.on("pointerdown", e => {
	if(e.button === 0){
		if($canvas_area.is(e.target)){
			if(selection){
				deselect();
			}
		}
	}
});

function prevent_selection($el) {
	$el.on("mousedown selectstart contextmenu", (e) => {
		if(e.isDefaultPrevented()){
			return;
		}
		if(
			e.target instanceof HTMLSelectElement ||
			e.target instanceof HTMLTextAreaElement ||
			(e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
			(e.target instanceof HTMLInputElement && e.target.type !== "color")
		){
			return;
		}
		if(e.button === 1){
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

// Stop drawing (or dragging or whatver) if you Alt+Tab or whatever
$G.on("blur", () => {
	$G.triggerHandler("pointerup");
});
