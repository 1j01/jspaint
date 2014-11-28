
var aliasing = true;
var transparency = false;

var default_canvas_width = 683;
var default_canvas_height = 384;
var my_canvas_width = default_canvas_width;
var my_canvas_height = default_canvas_height;

try{
	if(localStorage){
		my_canvas_width = Number(localStorage.width) || default_canvas_width;
		my_canvas_height = Number(localStorage.height) || default_canvas_height;
	}
}catch(e){}

var palette = [
	"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
	"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
];

var stroke_color;
var fill_color;
var stroke_color_i = 0;
var fill_color_i = 0;

var selected_tool = tools[6];
var previous_tool = selected_tool;
var colors = ["", "", ""];

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



var $body = $("body");
var $G = $(window);
var $app = $(E("div")).addClass("jspaint").appendTo("body");

var $V = $(E("div")).addClass("jspaint-vertical").appendTo($app);
var $H = $(E("div")).addClass("jspaint-horizontal").appendTo($V);

var $canvas_area = $(E("div")).addClass("jspaint-canvas-area").appendTo($H);

var canvas = new Canvas();
var ctx = canvas.ctx;
var $canvas = $(canvas).appendTo($canvas_area);

var $canvas_handles = $Handles($canvas_area, canvas, {outset: 4, offset: 4, size_only: true});

var $top = $(E("div")).addClass("jspaint-component-area").prependTo($V);
var $bottom = $(E("div")).addClass("jspaint-component-area").appendTo($V);
var $left = $(E("div")).addClass("jspaint-component-area").prependTo($H);
var $right = $(E("div")).addClass("jspaint-component-area").appendTo($H);

var $status_area = $(E("div")).addClass("jspaint-status-area").appendTo($V);
var $status_text = $(E("div")).addClass("jspaint-status-text").appendTo($status_area);
var $status_position = $(E("div")).addClass("jspaint-status-coordinates").appendTo($status_area);
var $status_size = $(E("div")).addClass("jspaint-status-coordinates").appendTo($status_area);

$status_text.default = function(){
	$status_text.text("For Help, click Help Topics on the Help Menu.");
};
$status_text.default();

var $toolbox = $ToolBox();
var $colorbox = $ColorBox();

reset();

if(window.file_entry){
	open_from_FileEntry(window.file_entry);
}else if(window.intent){
	open_from_URI(window.intent.data, "intent");
}

$canvas.on("user-resized", function(e, _x, _y, width, height){
	undoable(0, function(){
		canvas.width = Math.max(1, width);
		canvas.height = Math.max(1, height);
		if(transparency){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}else{
			ctx.fillStyle = colors[1];
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		
		var previous_canvas = undos[undos.length-1];
		if(previous_canvas){
			ctx.drawImage(previous_canvas, 0, 0);
		}
		
		$canvas.trigger("update"); // update handles
		
		try{
			localStorage.width = canvas.width;
			localStorage.height = canvas.height;
		}catch(e){}
	});
});

$body.on("dragover dragenter", function(e){
	e.preventDefault();
	e.stopPropagation();
}).on("drop", function(e){
	e.preventDefault();
	e.stopPropagation();
	var dt = e.originalEvent.dataTransfer;
	if(dt && dt.files && dt.files.length){
		open_from_FileList(dt.files);
	}
});

var keys = {};
$G.on("keyup", function(e){
	delete keys[e.keyCode];
});
$G.on("keydown", function(e){
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
		return false;
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
					return true;
			}
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
				// This shortcut is not handled, do not (try to) prevent the default.
				return true;
		}
		e.preventDefault();
		return false;
	}
});
$G.on("cut copy paste", function(e){
	if(
		document.activeElement instanceof HTMLInputElement ||
		document.activeElement instanceof HTMLTextAreaElement
	){
		// Don't prevent or interfere with cutting/copying/pasting within inputs or textareas
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
				return false; // break $.each
			}else if(item.type.match(/^image/)){
				paste_file(item.getAsFile());
				return false; // break $.each
			}
		});
	}
});

var mouse, mouse_start, mouse_previous;
var reverse, ctrl, button;
function e2c(e){
	var rect = canvas.getBoundingClientRect();
	//var z = (+$canvas_area.css("width") || canvas.width) / canvas.width;
	var z = (+$canvas.css("zoom") || 1);
	var cx = e.clientX / z - rect.left;
	var cy = e.clientY / z - rect.top;
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
			(ctrl && colors[2]) ? 2 :
			(reverse ? 1 : 0)
		];
	
	fill_color_i =
	stroke_color_i =
		ctrl ? 2 : (reverse ? 1 : 0)
	
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
				fill_color_i = 0;
				stroke_color_i = 1;
			}else{
				fill_color_i = 1;
				stroke_color_i = 0;
			}
		}
		ctx.fillStyle = fill_color = colors[fill_color_i];
		ctx.strokeStyle = stroke_color = colors[stroke_color_i];
	}
	if(selected_tool.shape){
		selected_tool.shape(ctx, mouse_start.x, mouse_start.y, mouse.x-mouse_start.x, mouse.y-mouse_start.y);
	}
	
	if(selected_tool[event_name]){
		selected_tool[event_name](ctx, mouse.x, mouse.y);
	}
	if(selected_tool.paint){
		if(selected_tool.continuous === "space"){
			var ham = brush_shape.match(/diagonal/) ? brosandham_line : bresenham_line;
			ham(mouse_previous.x, mouse_previous.y, mouse.x, mouse.y, function(x, y){
				selected_tool.paint(ctx, x, y);
			});
		}else{
			selected_tool.paint(ctx, mouse.x, mouse.y);
		}
	}
}
function canvas_mouse_move(e){
	ctrl = e.ctrlKey;
	mouse = e2c(e);
	if(e.shiftKey){
		if(selected_tool.name.match(/Line|Curve/)){
			var dist = Math.sqrt(
				(mouse.y - mouse_start.y) * (mouse.y - mouse_start.y) +
				(mouse.x - mouse_start.x) * (mouse.x - mouse_start.x)
			);
			var octurn = (TAU / 8);
			var dir08 = Math.atan2(mouse.y - mouse_start.y, mouse.x - mouse_start.x) / octurn;
			var dir = Math.round(dir08) * octurn;
			mouse.x = Math.round(mouse_start.x + Math.cos(dir) * dist);
			mouse.y = Math.round(mouse_start.y + Math.sin(dir) * dist);
		}else if(selected_tool.shape){
			var w = Math.abs(mouse.x - mouse_start.x);
			var h = Math.abs(mouse.y - mouse_start.y);
			if(w < h){
				if(mouse.y > mouse_start.y){
					mouse.y = mouse_start.y + w;
				}else{
					mouse.y = mouse_start.y - w;
				}
			}else{
				if(mouse.x > mouse_start.x){
					mouse.x = mouse_start.x + h;
				}else{
					mouse.x = mouse_start.x - h;
				}
			}
		}
	}
	tool_go();
	mouse_previous = mouse;
}
$canvas.on("mousemove", function(e){
	mouse = e2c(e);
	$status_position.text(mouse.x + "," + mouse.y);
});
$canvas.on("mouseleave", function(e){
	$status_position.text("");
});

var mouse_was_pressed = false;
$canvas.on("mousedown", function(e){
	if(mouse_was_pressed && (reverse ? (button === 2) : (button === 0))){
		mouse_was_pressed = false;
		return cancel();
	}
	mouse_was_pressed = true;
	$G.one("mouseup", function(e){
		mouse_was_pressed = false;
	});
	
	if(e.button === 0){
		reverse = false;
	}else if(e.button === 2){
		reverse = true;
	}else{
		return false;
	}
	button = e.button;
	ctrl = e.ctrlKey;
	mouse_start = mouse_previous = mouse = e2c(e);
	
	var mousedown_action = function(){
		if(selected_tool.paint || selected_tool.mousedown){
			tool_go("mousedown");
		}
		
		$G.on("mousemove", canvas_mouse_move);
		if(selected_tool.continuous === "time"){
			var iid = setInterval(function(){
				tool_go();
			}, 5);
		}
		$G.one("mouseup", function(e, canceling){
			button = undefined;
			if(canceling){
				selected_tool.cancel && selected_tool.cancel();
			}else{
				mouse = e2c(e);
				selected_tool.mouseup && selected_tool.mouseup(ctx, mouse.x, mouse.y);
			}
			if(selected_tool.deselect){
				selected_tool = previous_tool;
				$toolbox && $toolbox.update_selected_tool();
			}
			$G.off("mousemove", canvas_mouse_move);
			if(iid){
				clearInterval(iid);
			}
		});
	};
	
	// This would be a lot nicer in ruby (or in OOPLiE!)
	// It would be just `if selected_tool.passive`
	// (Or in OOPLiE, `If the selected tool is passive`)
	// Or it could use a getter
	if((typeof selected_tool.passive === "function") ? selected_tool.passive() : selected_tool.passive){
		mousedown_action();
	}else{
		undoable(mousedown_action);
	}
});

$canvas_area.on("mousedown", function(e){
	if(e.button === 0){
		if($canvas_area.is(e.target)){
			if(selection){
				deselect();
			}
		}
	}
});

$body.on("mousedown contextmenu", function(e){
	if(
		e.target instanceof HTMLSelectElement ||
		e.target instanceof HTMLTextAreaElement ||
		(e.target instanceof HTMLLabelElement && e.type !== "contextmenu") ||
		(e.target instanceof HTMLInputElement && e.target.type !== "color")
	){
		return true;
	}
	e.preventDefault();
});

// Stop drawing (or dragging or whatver) if you Alt+Tab or whatever
$G.on("blur", function(e){
	$G.triggerHandler("mouseup");
});
