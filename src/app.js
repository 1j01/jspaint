
const default_magnification = 1;
const default_tool = get_tool_by_name("Pencil");

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
	"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
	"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
];
let palette = default_palette;
let polychrome_palette = palette;
let monochrome_palette = make_monochrome_palette();

let brush_shape = "circle";
let brush_size = 4;
let eraser_size = 8;
let airbrush_size = 9;
let pencil_size = 1;
let stroke_size = 1; // lines, curves, shape outlines
let tool_transparent_mode = false;

let stroke_color;
let fill_color;
let stroke_color_k = "foreground"; // enum of "foreground", "background", "ternary"
let fill_color_k = "background"; // enum of "foreground", "background", "ternary"

let selected_tool = default_tool;
let selected_tools = [selected_tool];
let return_to_tools = [selected_tool];
let colors = {
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

/** canvas coords */
let pointer, pointer_start, pointer_previous;

let pointer_active = false;
let pointer_type, pointer_buttons;
let reverse;
let ctrl;
let button;
let pointer_over_canvas = false;
let update_helper_layer_on_pointermove_active = false;

/** client coords */
let pointers = [];

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

const $status_area = $(E("div")).addClass("status-area").appendTo($V);
const $status_text = $(E("div")).addClass("status-text").appendTo($status_area);
const $status_position = $(E("div")).addClass("status-coordinates").appendTo($status_area);
const $status_size = $(E("div")).addClass("status-coordinates").appendTo($status_area);

const $news_indicator = $(`
	<a class='news-indicator' href='#project-news'>
		<img src='images/winter/present.png' width='24' height='22' alt=''/>
		<span class='not-the-icon'>
			<strong>New!</strong>&nbsp;Holiday theme, multitouch panning, and revamped history
		</span>
	</a>
`);
$news_indicator.on("click auxclick", (event)=> {
	event.preventDefault();
	show_news();
});
// TODO: use localstorage to show until clicked, if available
// and show for a longer period of time after the update, if available
if (Date.now() < Date.parse("Jan 5 2020 23:42:42 GMT-0500")) {
	$status_area.append($news_indicator);
}

$status_text.default = () => {
	$status_text.text("For Help, click Help Topics on the Help Menu.");
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

const $toolbox = $ToolBox(tools);
// const $toolbox2 = $ToolBox(extra_tools, true);//.hide();
// Note: a second $ToolBox doesn't work because they use the same tool options (which could be remedied)
// and also the UI isn't designed for multiple vertical components (or horizontal ones)
// If there's to be extra tools, they should probably get a window, with different UI
// so it can display names of the tools, and maybe authors and previews (and not necessarily icons)
const $colorbox = $ColorBox();

if (location.search.match(/eye-gaze-mode/)) {
	$("body").addClass("eye-gaze-mode");
}

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
	// TODO: return if menus/menubar focused or focus in dialog window
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

	// TODO: preventDefault in all cases where the event is handled
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
		stopSimulatingGestures();
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
			if(selected_tool.name === "Brush"){
				brush_size = Math.max(1, Math.min(brush_size + delta, 500));
			}else if(selected_tool.name === "Eraser/Color Eraser"){
				eraser_size = Math.max(1, Math.min(eraser_size + delta, 500));
			}else if(selected_tool.name === "Airbrush"){
				airbrush_size = Math.max(1, Math.min(airbrush_size + delta, 500));
			}else if(selected_tool.name === "Pencil"){
				pencil_size = Math.max(1, Math.min(pencil_size + delta, 50));
			}else if(selected_tool.name.match(/Line|Curve|Rectangle|Ellipse|Polygon/)){
				stroke_size = Math.max(1, Math.min(stroke_size + delta, 500));
			}

			$G.trigger("option-changed");
			if(button !== undefined){
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
						name: "Cut",
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
						load_image_from_URI(uris[0], (err, img) => {
							if(err){ return show_resource_load_error_message(); }
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

// this is synchronous for now, but TODO: handle possibility of loading a document before callback
// when switching to asynchronous storage, e.g. with localforage
storage.get({
	width: default_canvas_width,
	height: default_canvas_height,
}, (err, stored_values) => {
	if(err){return;}
	my_canvas_width = stored_values.width;
	my_canvas_height = stored_values.height;
	
	make_or_update_undoable({
		match: (history_node)=> history_node.name === "New Document",
		name: "Resize New Document Canvas",
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
		if(selected_tool.name.match(/Line|Curve/)){
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
	pointers.push({pointerId: event.pointerId, x: event.clientX, y: event.clientY});

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
	pointers = pointers.filter((pointer)=> {
		if (event.pointerId === pointer.pointerId) {
			return false;
		}
		return true;
	});
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

$app
.add($toolbox)
// .add($toolbox2)
.add($colorbox)
.on("mousedown selectstart contextmenu", e => {
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

// Stop drawing (or dragging or whatver) if you Alt+Tab or whatever
$G.on("blur", () => {
	$G.triggerHandler("pointerup");
});
