
var aliasing = true;
var transparency = false;
var monochrome = false;

var magnification = 1;

var default_canvas_width = 683;
var default_canvas_height = 384;
var my_canvas_width = default_canvas_width;
var my_canvas_height = default_canvas_height;

var canvas = new Canvas();
var ctx = canvas.ctx;

var palette = [
	"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
	"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
];
var polychrome_palette = palette;
var monochrome_palette = make_monochrome_palette();


var stroke_color;
var fill_color;
var stroke_color_k = 0;
var fill_color_k = 0;

var selected_tool = tools[6];
var previous_tool = selected_tool;
var colors = {
	foreground: "",
	background: "",
	ternary: "",
};

var selection; //the one and only Selection
var textbox; //the one and only TextBox
var font = {
	family: "Arial",
	size: 12,
	line_scale: 20 / 12
};

var undos = []; //array of <canvas>
var redos = []; //array of <canvas>
//var frames = []; //array of {delay: N, undos: [<canvas>], redos: [<canvas>], canvas: <canvas>}? array of Frames?

var file_name;
var document_file_path;
var saved = true;



var $app = $(E("div")).addClass("jspaint").appendTo("body");

var $V = $(E("div")).addClass("vertical").appendTo($app);
var $H = $(E("div")).addClass("horizontal").appendTo($V);

var $canvas_area = $(E("div")).addClass("canvas-area").appendTo($H);
$canvas_area.attr("touch-action", "pan-x pan-y");

var $canvas = $(canvas).appendTo($canvas_area);
$canvas.attr("touch-action", "none");

var $canvas_handles = $Handles($canvas_area, canvas, {
	outset: 4,
	get_offset_left: function(){ return parseFloat($canvas_area.css("padding-left")) + 1; },
	get_offset_top: function(){ return parseFloat($canvas_area.css("padding-top")) + 1; },
	size_only: true
});

var $top = $(E("div")).addClass("component-area").prependTo($V);
var $bottom = $(E("div")).addClass("component-area").appendTo($V);
var $left = $(E("div")).addClass("component-area").prependTo($H);
var $right = $(E("div")).addClass("component-area").appendTo($H);

var $status_area = $(E("div")).addClass("status-area").appendTo($V);
var $status_text = $(E("div")).addClass("status-text").appendTo($status_area);
var $status_position = $(E("div")).addClass("status-coordinates").appendTo($status_area);
var $status_size = $(E("div")).addClass("status-coordinates").appendTo($status_area);

$status_text.default = function(){
	$status_text.text("For Help, click Help Topics on the Help Menu.");
};
$status_text.default();

var $toolbox = $ToolBox(tools);
// var $toolbox2 = $ToolBox(extra_tools, true);//.hide();
// Note: a second $ToolBox doesn't work because they use the same tool options (which could be remedied)
// and also the UI isn't designed for multiple vertical components (or horizontal ones)
// If there's to be extra tools, they should probably get a window, with different UI
// so it can display names of the tools, and maybe authors and previews (and not necessarily icons)
var $colorbox = $ColorBox();

reset_file();
reset_colors();
reset_canvas(); // (with newly reset colors)
reset_magnification();

if(window.document_file_path_to_open){
	open_from_file_path(document_file_path_to_open, function(err){
		if(err){
			return show_error_message("Failed to open file " + document_file_path_to_open, err);
		}
	});
}

$canvas.on("user-resized", function(e, _x, _y, width, height){
	undoable(0, function(){
		canvas.width = Math.max(1, width);
		canvas.height = Math.max(1, height);
		ctx.disable_image_smoothing();
		
		if(!transparency){
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		var previous_canvas = undos[undos.length-1];
		if(previous_canvas){
			ctx.drawImage(previous_canvas, 0, 0);
		}

		$canvas_area.trigger("resize");

		storage.set({
			width: canvas.width,
			height: canvas.height,
		}, function(err){
			// oh well
		})
	});
});

$canvas_area.on("resize", function(){
	update_magnified_canvas_size();
});

storage.get({
	width: default_canvas_width,
	height: default_canvas_height,
}, function(err, values){
	if(err){return;}
	my_canvas_width = values.width;
	my_canvas_height = values.height;
	canvas.width = Math.max(1, my_canvas_width);
	canvas.height = Math.max(1, my_canvas_height);
	ctx.disable_image_smoothing();
	if(!transparency){
		ctx.fillStyle = colors.background;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	$canvas_area.trigger("resize");
});


$("body").on("dragover dragenter", function(e){
	var dt = e.originalEvent.dataTransfer;
	var has_files = Array.from(dt.types).indexOf("Files") !== -1;
	if(has_files){
		e.preventDefault();
	}
}).on("drop", function(e){
	if(e.isDefaultPrevented()){
		return;
	}
	var dt = e.originalEvent.dataTransfer;
	var has_files = Array.from(dt.types).indexOf("Files") !== -1;
	if(has_files){
		e.preventDefault();
		if(dt && dt.files && dt.files.length){
			open_from_FileList(dt.files, "dropped");
		}
	}
});

var keys = {};
$G.on("keyup", function(e){
	delete keys[e.keyCode];
});
$G.on("keydown", function(e){
	if(e.isDefaultPrevented()){
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
	
	if(e.altKey){
		//find key codes
		window.console && console.log(e.keyCode);
	}
	
	if(selection){
		var nudge_selection = function(delta_x, delta_y){
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
	}else if(e.keyCode === 13){ //Enter
		if(selection){
			deselect();
		}
	}else if(e.keyCode === 115){ //F4
		redo();
	}else if(e.keyCode === 46){ //Delete
		delete_selection();
	}else if(e.keyCode === 107 || e.keyCode === 109){ // Numpad Plus and Minus
		var plus = e.keyCode === 107;
		var minus = e.keyCode === 109;
		var delta = plus - minus; // var delta = +plus++ -minus--; // Δ = ±±±±

		if(selection){
			selection.scale(Math.pow(2, delta));
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
				tool_go();
			}
		}
		e.preventDefault();
		return;
	}else if(e.ctrlKey){
		var key = String.fromCharCode(e.keyCode).toUpperCase();
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
				image_invert();
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
$G.on("cut copy paste", function(e){
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
	var cd = e.originalEvent.clipboardData || window.clipboardData;
	if(!cd){ return; }

	if(e.type === "copy" || e.type === "cut"){
		if(selection && selection.canvas){
			if(window.require && window.process){
				const {clipboard, nativeImage} = require('electron');
				selection.canvas.toBlob(function(blob){
					sanity_check_blob(blob, function(){
						blob_to_buffer(blob, function(err, buffer){
							if(err){
								return show_error_message("Failed to copy to clipboard! (Technically, failed to convert a Blob to a Buffer.)", err);
							}
							var native_image = nativeImage.createFromBuffer(buffer);
							clipboard.writeImage(native_image);
						});
					});
				});
			} else {
				var data_url = selection.canvas.toDataURL();
				cd.setData("text/x-data-uri; type=image/png", data_url);
				cd.setData("text/uri-list", data_url);
				cd.setData("URL", data_url);
				// var svg = `
				// 	<svg
				// 		xmlns="http://www.w3.org/2000/svg" version="1.1"
				// 		viewBox="0 0 ${selection.canvas.width} ${selection.canvas.height}" preserveAspectRatio="xMidYMid slice">
				// 		<image xlink:href="${data_url}" x="0" y="0" height="${selection.canvas.height}" width="${selection.canvas.width}"/>
				// 	</svg>
				// `;
				// cd.setData("image/svg+xml", svg);
				// cd.setData("text/html", svg);
			}
			if(e.type === "cut"){
				selection.destroy();
				selection = null;
			}
		}
	}else if(e.type === "paste"){
		$.each(cd.items, function(i, item){
			if(item.type.match(/^text\/(?:x-data-uri|uri-list|plain)|URL$/)){
				item.getAsString(function(text){
					// parse text/uri-list (might as well do it properly)
					var uris = text.split(/[\n\r]+/).filter(function(line){return line[0] !== "#" && line});
					// TODO: check that it's actually a URI,
					// and if text/plain maybe silently ignore the paste
					// but definitely generally show a better error than show_resource_load_error_message()
					// some strings from mspaint:
					// "The information on the Clipboard can't be inserted into Paint."
					// also
					// "Downloading picture"
					// "Reading data from the device (%1!ld!%% complete)"
					// "Processing data (%1!ld!%% complete)"
					// "Transferring data (%1!ld!%% complete)"
					load_image_from_URI(uris[0], function(err, img){
						if(err){ return show_resource_load_error_message(); }
						paste(img);
					});
				});
				return false; // break out of $.each loop
			}else if(item.type.match(/^image\//)){
				paste_image_from_file(item.getAsFile());
				return false; // break out of $.each loop
			}
		});
	}
});

var pointer, pointer_start, pointer_previous;
var reverse, ctrl, button;
function e2c(e){
	var rect = canvas.getBoundingClientRect();
	var cx = e.clientX - rect.left;
	var cy = e.clientY - rect.top;
	return {
		x: ~~(cx / rect.width * canvas.width),
		y: ~~(cy / rect.height * canvas.height),
	};
}

function tool_go(event_name){

	ctx.lineWidth = stroke_size;

	var reverse_because_fill_only = selected_tool.$options && selected_tool.$options.fill && !selected_tool.$options.stroke;
	ctx.fillStyle = fill_color =
	ctx.strokeStyle = stroke_color =
		colors[
			(ctrl && colors.ternary) ? "ternary" :
			((reverse ^ reverse_because_fill_only) ? "background" : "foreground")
		];

	fill_color_k =
	stroke_color_k =
		ctrl ? "ternary" : ((reverse ^ reverse_because_fill_only) ? "background" : "foreground");

	if(selected_tool.shape){
		var previous_canvas = undos[undos.length-1];
		if(previous_canvas){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(previous_canvas, 0, 0);
		}
	}
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
	if(selected_tool.shape){
		selected_tool.shape(ctx, pointer_start.x, pointer_start.y, pointer.x-pointer_start.x, pointer.y-pointer_start.y);
	}

	if(selected_tool[event_name]){
		selected_tool[event_name](ctx, pointer.x, pointer.y);
	}
	if(selected_tool.paint){
		if(selected_tool.continuous === "space"){
			var ham = brush_shape.match(/diagonal/) ? brosandham_line : bresenham_line;
			ham(pointer_previous.x, pointer_previous.y, pointer.x, pointer.y, function(x, y){
				selected_tool.paint(ctx, x, y);
			});
		}else{
			selected_tool.paint(ctx, pointer.x, pointer.y);
		}
	}
}
function canvas_pointer_move(e){
	ctrl = e.ctrlKey;
	shift = e.shiftKey;
	pointer = e2c(e);
	if(e.shiftKey){
		if(selected_tool.name.match(/Line|Curve/)){
			// snap to eight directions
			var dist = Math.sqrt(
				(pointer.y - pointer_start.y) * (pointer.y - pointer_start.y) +
				(pointer.x - pointer_start.x) * (pointer.x - pointer_start.x)
			);
			var eighth_turn = TAU / 8;
			var angle_0_to_8 = Math.atan2(pointer.y - pointer_start.y, pointer.x - pointer_start.x) / eighth_turn;
			var angle = Math.round(angle_0_to_8) * eighth_turn;
			pointer.x = Math.round(pointer_start.x + Math.cos(angle) * dist);
			pointer.y = Math.round(pointer_start.y + Math.sin(angle) * dist);
		}else if(selected_tool.shape){
			// snap to four diagonals
			var w = Math.abs(pointer.x - pointer_start.x);
			var h = Math.abs(pointer.y - pointer_start.y);
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
	tool_go();
	pointer_previous = pointer;
}
$canvas.on("pointermove", function(e){
	pointer = e2c(e);
	$status_position.text(pointer.x + "," + pointer.y);
});
$canvas.on("pointerleave", function(e){
	$status_position.text("");
});

var pointer_was_pressed = false;
$canvas.on("pointerdown", function(e){
	if(pointer_was_pressed && (reverse ? (button === 2) : (button === 0))){
		pointer_was_pressed = false;
		cancel();
		return;
	}
	pointer_was_pressed = true;
	$G.one("pointerup", function(e){
		pointer_was_pressed = false;
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
	pointer_start = pointer_previous = pointer = e2c(e);

	var pointerdown_action = function(){
		if(selected_tool.paint || selected_tool.pointerdown){
			tool_go("pointerdown");
		}

		$G.on("pointermove", canvas_pointer_move);
		if(selected_tool.continuous === "time"){
			var iid = setInterval(tool_go, 5);
		}
		$G.one("pointerup", function(e, canceling){
			button = undefined;
			if(canceling){
				selected_tool.cancel && selected_tool.cancel();
			}else{
				pointer = e2c(e);
				selected_tool.pointerup && selected_tool.pointerup(ctx, pointer.x, pointer.y);
			}
			if(selected_tool.deselect){
				select_tool(previous_tool);
			}
			$G.off("pointermove", canvas_pointer_move);
			if(iid){
				clearInterval(iid);
			}
		});
	};

	if((typeof selected_tool.passive === "function") ? selected_tool.passive() : selected_tool.passive){
		pointerdown_action();
	}else{
		undoable(pointerdown_action);
	}
});

$canvas_area.on("pointerdown", function(e){
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
.on("mousedown selectstart contextmenu", function(e){
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
$G.on("blur", function(e){
	$G.triggerHandler("pointerup");
});
