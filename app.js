
var aliasing = true;
var transparency = false;

var default_width = 683;
var default_height = 384;

var palette = [
	"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
	"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
];

var stroke_width = 1;
var stroke_color;
var fill_color;
var stroke_color_i = 0;
var fill_color_i = 0;

var $tool_options_area = $();

var selected_tool = tools[6];
var previous_tool = selected_tool;
var colors = ["", "", ""];

var selection; //the one and only Selection
var undos = []; //array of <canvas>
var redos = []; //array of <canvas>
var frames = []; //array of {delay:N, undos:[<canvas>], redos:[<canvas>], canvas:<canvas>}

var file_name;



var $body = $(document.body||"body");
var $G = $(window);
var $app = $(E("div")).addClass("jspaint").appendTo("body");

var $V = $(E("div")).addClass("jspaint-vertical").appendTo($app);
var $H = $(E("div")).addClass("jspaint-horizontal").appendTo($V);

var $canvas_area = $(E("div")).addClass("jspaint-canvas-area").appendTo($H);
var $resize_ghost = $(E("div")).addClass("jspaint-canvas-resize-ghost");
var canvas = E("canvas");
var ctx = canvas.getContext("2d");
var $canvas = $(canvas).appendTo($canvas_area);

var $top = $(E("c-area")).prependTo($V);
var $bottom = $(E("c-area")).appendTo($V);
var $left = $(E("c-area")).prependTo($H);
var $right = $(E("c-area")).appendTo($H);

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

$.each([
	["top", "right"], //↗
	["top", "middle"], //↑
	["top", "left"], //↖
	["middle", "left"], //←
	["bottom", "left"], //↙
	["bottom", "middle"], //↓
	["bottom", "right"], //↘
	["middle", "right"], //→
], function(i, pos){
	$Handle(pos[0], pos[1]);
});
var $canvas_handles = $(".jspaint-handle"); //@todo: don't do this selection
var update_handles = function(){
	$canvas_handles.trigger("update");
};
$G.on("resize", update_handles);
$canvas_area.on("scroll", update_handles);
setTimeout(update_handles, 50);

$body.on("dragover dragenter", function(e){
	e.preventDefault();
	e.stopPropagation();
}).on("drop", function(e){
	e.preventDefault();
	e.stopPropagation();
	var dt = e.originalEvent.dataTransfer
	if(dt && dt.files && dt.files.length){
		open_from_FileList(dt.files);
	}
});


$G.on("keydown", function(e){
	if(e.keyCode === 27){ //Escape
		if(selection){
			deselect();
		}else{
			cancel();
		}
	}else if(e.keyCode === 115){ //F4
		redo();
	}else if(e.keyCode === 46){ //Delete
		delete_selection();
	}else if(e.ctrlKey){
		switch(String.fromCharCode(e.keyCode).toUpperCase()){
			case "Z":
				e.shiftKey ? redo() : undo();
			break;
			case "Y":
				redo();
			break;
			case "G":
				render_history_as_gif();
			break;
			case "F":
				//show image fullscreen
				canvas.requestFullscreen && canvas.requestFullscreen();
				canvas.webkitRequestFullscreen && canvas.webkitRequestFullscreen();
			break;
			case "O":
				file_open();
			break;
			case "N":
				file_new();
			break;
			case "S":
				e.shiftKey ? file_save_as() : file_save();
			break;
			case "A":
				select_all();
			break;
			case "I":
				invert();
			break;
			default: return true;
		}
		e.preventDefault();
		return false;
	}
});
$G.on("cut copy paste", function(e){
	e.preventDefault();
	var cd = e.originalEvent.clipboardData || window.clipboardData;
	if(!cd){ return console.log("No clipboardData"); }
	
	if(e.type === "copy" || e.type === "cut"){
		if(selection && selection.canvas){
			var data = selection.canvas.toDataURL("image/png");
			cd.setData("URL", data);
			cd.setData("image/png", data);
			if(e.type === "cut"){
				selection.draw();
				selection.destroy();
				selection = null;
			}
		}
	}else if(e.type === "paste"){
		$.each(cd.items, function(i, item){
			if(item.type.match(/image/)){
				var blob = item.getAsFile();
				var reader = new FileReader();
				reader.onload = function(e){
					var img = new Image();
					img.onload = function(){
						if(img.width > canvas.width || img.height > canvas.height){
							var $w = new $Window();
							$w.title("Paint");
							$w.$content.html(
								"The image is bigger than the canvas.<br>"
								+"Would you like the canvas to be enlarged?<br>"
							);
							$w.$Button("Enlarge", function(){
								//additional undo
								if(undoable()){
									//@todo: non-destructive resize
									canvas.width = img.width;
									canvas.height = img.height;
									paste_img();
								}
							});
							$w.$Button("Crop", function(){
								paste_img();
							});
							$w.$Button("Cancel", function(){});
						}else{
							paste_img();
						}
						function paste_img(){
							if(selection){
								selection.draw();
								selection.destroy();
							}
							selection = new Selection(0, 0, img.width, img.height);
							selection.instantiate(img);
						}
					};
					img.src = e.target.result;
				};
				reader.readAsDataURL(blob);
				return false;
			}
		});
	}
});

var mouse, mouse_start, mouse_previous;
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
		
		selected_tool.shape(ctx, mouse_start.x, mouse_start.y, mouse.x-mouse_start.x, mouse.y-mouse_start.y);
	}
	
	if(selected_tool[event_name]){
		selected_tool[event_name](ctx, mouse.x, mouse.y);
	}
	if(selected_tool.paint){
		if(selected_tool.continuous === "space"){
			bresenham(mouse_previous.x, mouse_previous.y, mouse.x, mouse.y, function(x, y){
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
		if(selected_tool.name === "Line"){
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
$canvas.on("mousedown", function(e){
	if(e.button === 0){
		reverse = false;
	}else if(e.button === 2){
		reverse = true;
	}else{
		return false;
	}
	if(reverse ? (button === 0) : (button === 2)){
		return cancel();
	}
	button = e.button;
	ctrl = e.ctrlKey;
	mouse_start = mouse_previous = mouse = e2c(e);
	
	if(!selected_tool.passive){
		if(!undoable()) return;
	}
	if(selected_tool.paint || selected_tool.mousedown){
		tool_go("mousedown");
	}
	
	$G.on("mousemove", canvas_mouse_move);
	if(selected_tool.continuous === "time"){
		var iid = setInterval(function(){
			tool_go();
		}, 10);
	}
	$G.one("mouseup", function(e, canceling){
		button = undefined;
		if(selected_tool.mouseup && !canceling){
			selected_tool.mouseup();
		}
		if(selected_tool.cancel && canceling){
			selected_tool.cancel();
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
});

$body.on("contextmenu", function(e){
	return false;
});
$body.on("mousedown", function(e){
	e.preventDefault();
});
