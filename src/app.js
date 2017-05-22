
var aliasing = true;
var transparency = false;

var magnification = 1;

var default_canvas_width = 683;
var default_canvas_height = 384;
var my_canvas_width = default_canvas_width;
var my_canvas_height = default_canvas_height;

var palette = [
	"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
	"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
];

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
var saved = true;



var $app = $(E("div")).addClass("jspaint").appendTo("body");

var $V = $(E("div")).addClass("jspaint-vertical").appendTo($app);
var $H = $(E("div")).addClass("jspaint-horizontal").appendTo($V);

var $canvas_area = $(E("div")).addClass("jspaint-canvas-area").appendTo($H);
$canvas_area.attr("touch-action", "pan-x pan-y");

var canvas = new Canvas();
var ctx = canvas.ctx;
var $canvas = $(canvas).appendTo($canvas_area);
$canvas.attr("touch-action", "none");

var $canvas_handles = $Handles($canvas_area, canvas, {outset: 4, offset: 4, size_only: true});

var $top = $(E("div")).addClass("jspaint-component-area").prependTo($V);
var $bottom = $(E("div")).addClass("jspaint-component-area").appendTo($V);
var $left = $(E("div")).addClass("jspaint-component-area").prependTo($H);
var $right = $(E("div")).addClass("jspaint-component-area").appendTo($H);

var $status_area = $(E("div")).addClass("jspaint-status-area").appendTo($V);
var $status_text = $(E("div")).addClass("jspaint-status-text").appendTo($status_area);
var $status_position = $(E("div")).addClass("jspaint-status-coordinates").appendTo($status_area);
var $status_size = $(E("div")).addClass("jspaint-status-coordinates").appendTo($status_area);

($status_text.default = function(){
	$status_text.text("For Help, click Help Topics on the Help Menu.");
})();

var $toolbox = $ToolBox();
var $colorbox = $ColorBox();

reset_file();
reset_colors();
reset_canvas(); // (with newly reset colors)
reset_magnification();

if(window.file_entry){
	open_from_FileEntry(window.file_entry);
}

$canvas.on("user-resized", function(e, _x, _y, width, height){
	undoable(0, function(){
		canvas.width = Math.max(1, width);
		canvas.height = Math.max(1, height);
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
	if(!transparency){
		ctx.fillStyle = colors.background;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	$canvas_area.trigger("resize");
});

$("body").on("dragover dragenter", function(e){
	if(
		e.target instanceof HTMLInputElement ||
		e.target instanceof HTMLTextAreaElement
	){
		return;
	}
	e.preventDefault();
}).on("drop", function(e){
	if(
		e.target instanceof HTMLInputElement ||
		e.target instanceof HTMLTextAreaElement
	){
		return;
	}
	e.preventDefault();
	var dt = e.originalEvent.dataTransfer;
	if(dt && dt.files && dt.files.length){
		open_from_FileList(dt.files, function(err){
			if(err){
				show_error_message("Failed to open file:", err);
			}
		});
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
	if(
		e.target instanceof HTMLInputElement ||
		e.target instanceof HTMLTextAreaElement
	){
		return;
	}
	var brush_shapes = {
		circle: [
			0, 1, 0,
			1, 0, 1,
			0, 1, 0
		],
		diagonal: [
			1, 0, 0,
			0, 0, 0,
			0, 0, 1
		],
		reverse_diagonal: [
			0, 0, 1,
			0, 0, 0,
			1, 0, 0
		],
		horizontal: [
			0, 0, 0,
			1, 0, 1,
			0, 0, 0
		],
		vertical: [
			0, 1, 0,
			0, 0, 0,
			0, 1, 0
		],
		square: [
			0, 0, 0,
			0, 1, 0,
			0, 0, 0
		]
	};
	keys[e.keyCode] = true;
	for(var k in brush_shapes){
		var bs = brush_shapes[k];
		var fits_shape = true;
		for(var i=0; i<9; i++){
			var keyCode = [103, 104, 105, 100, 101, 102, 97, 98, 99][i];
			if(bs[i] && !keys[keyCode]){
				fits_shape = false;
			}
		}
		if(fits_shape){
			brush_shape = k;
			$G.trigger("option-changed");
			break;
		}
	}
	if(e.keyCode === 96){
		brush_shape = "circle";
		$G.trigger("option-changed");
	}
	if(e.keyCode === 111){
		brush_shape = "diagonal";
		$G.trigger("option-changed");
	}
	
	if(e.altKey){
		//find key codes
		window.console && console.log(e.keyCode);
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
	}else if(e.keyCode === 107 || e.keyCode === 109){
		var plus = e.keyCode === 107;
		var minus = e.keyCode === 109;
		var delta = plus - minus; // +plus++ -minus--; // Δ = ±±±±
		
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
			break;
			case 190: // . >
			case 221: // ] }
				rotate(+TAU/4);
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
	if(
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement
	){
		// Don't prevent cutting/copying/pasting within inputs or textareas
		return;
	}
	
	e.preventDefault();
	var cd = e.originalEvent.clipboardData || window.clipboardData;
	if(!cd){ return; }
	
	if(e.type === "copy" || e.type === "cut"){
		if(selection && selection.canvas){
			var data_url = selection.canvas.toDataURL();
			cd.setData("text/x-data-uri; type=image/png", data_url);
			cd.setData("text/uri-list", data_url);
			cd.setData("URL", data_url);
			if(e.type === "cut"){
				selection.destroy();
				selection = null;
			}
		}
	}else if(e.type === "paste"){
		$.each(cd.items, function(i, item){
			if(item.type.match(/^text\/(?:x-data-)?uri/)){
				item.getAsString(function(str){
					var img = E("img");
					img.onload = function(){
						paste(img);
					};
					img.src = str;
				});
				return false; // break out of $.each loop
			}else if(item.type.match(/^image/)){
				paste_file(item.getAsFile());
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
	
	ctx.fillStyle = fill_color =
	ctx.strokeStyle = stroke_color =
		colors[
			(ctrl && colors.ternary) ? "ternary" :
			(reverse ? "background" : "foreground")
		];
	
	fill_color_k =
	stroke_color_k =
		ctrl ? "ternary" : (reverse ? "background" : "foreground");
	
	if(selected_tool.shape){
		var previous_canvas = undos[undos.length-1];
		if(previous_canvas){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(previous_canvas, 0, 0);
		}
	}
	if(selected_tool.shape || selected_tool.shape_colors){
		if(!selected_tool.stroke_only){
			if(reverse){
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
	pointer = e2c(e);
	if(e.shiftKey){
		if(selected_tool.name.match(/Line|Curve/)){
			var dist = Math.sqrt(
				(pointer.y - pointer_start.y) * (pointer.y - pointer_start.y) +
				(pointer.x - pointer_start.x) * (pointer.x - pointer_start.x)
			);
			var octurn = (TAU / 8);
			var dir08 = Math.atan2(pointer.y - pointer_start.y, pointer.x - pointer_start.x) / octurn;
			var dir = Math.round(dir08) * octurn;
			pointer.x = Math.round(pointer_start.x + Math.cos(dir) * dist);
			pointer.y = Math.round(pointer_start.y + Math.sin(dir) * dist);
		}else if(selected_tool.shape){
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
// NOTE: mousedown and pointerdown can happen in either order
// $canvas.on("mousedown", function(e){
// 	console.log("MOUSEDOWN");
// 	if(e.buttons == (1|2)){
// 		if(pointer_was_pressed){
// 			pointer_was_pressed = false;
// 			cancel();
// 			console.log("CANCEL");
// 			e.preventDefault();
// 		}
// 	}
// });
$canvas.on("pointerdown", function(e){
	// console.log("POINTERDOWN");
	// if(pointer_was_pressed && (reverse ? (button === 2) : (button === 0))){
	// 	pointer_was_pressed = false;
	// 	cancel();
	// 	console.log("CANCEL");
	// 	return;
	// }
	pointer_was_pressed = true;
	$G.one("pointerup", function(e){
		console.log("pup");
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
				selected_tool = previous_tool;
				$toolbox && $toolbox.update_selected_tool();
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
$canvas.on("pointermove", function(e){
	// TODO: touch (reimplement)
	// TODO: if the pen eraser button is pressed while the pointer was already down, cancel
	if(pointer_was_pressed && e.buttons === 3){
		pointer_was_pressed = false;
		console.log("pointermove > CANCEL");
		cancel();
		return;
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

$app.on("mousedown selectstart contextmenu", function(e){
	if(
		e.target instanceof HTMLSelectElement ||
		e.target instanceof HTMLTextAreaElement ||
		(e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
		(e.target instanceof HTMLInputElement && e.target.type !== "color")
	){
		return;
	}
	e.preventDefault();
});

// Stop drawing (or dragging or whatver) if you Alt+Tab or whatever
$G.on("blur", function(e){
	$G.triggerHandler("pointerup");
});
