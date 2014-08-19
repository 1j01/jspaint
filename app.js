
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



var $body = $(document.body||"body");
var $G = $(window);
var $app = $(E("div")).addClass("jspaint").appendTo("body");

var $V = $(E("div")).addClass("jspaint-vertical").appendTo($app);
var $H = $(E("div")).addClass("jspaint-horizontal").appendTo($V);

var $canvas_area = $(E("div")).addClass("jspaint-canvas-area").appendTo($H);

var canvas = E("canvas");
var ctx = canvas.getContext("2d");
var $canvas = $(canvas).appendTo($canvas_area);

var $canvas_handles = $Handles($canvas_area, canvas, {outset: 4, offset: 4, size_only: true});

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

var $menus = $(E("div")).addClass("jspaint-menus").prependTo($V);
var selecting_menus = false;
var ____________________________ = "A HORIZONTAL RULE / DIVIDER";
$.each({
	"&File": [
		{
			item: "&New",
			shortcut: "Ctrl+N",
			action: file_new
		},
		{
			item: "&Open",
			shortcut: "Ctrl+O",
			action: file_open
		},
		{
			item: "&Save",
			shortcut: "Ctrl+S",
			action: file_save
		},
		{
			item: "Save &As",
			shortcut: "Ctrl+Shift+S",
			action: file_save_as
		},
		____________________________,
		{
			item: "Print Pre&view"
		},
		{
			item: "Page Se&tup"
		},
		{
			item: "&Print",
			shortcut: "Ctrl+P",
			action: function(){print();}
		},
		____________________________,
		{
			item: "Set As &Wallpaper (Tiled)",
			action: function(){
				var wp = document.createElement("canvas");
				wp.width = screen.width;
				wp.height = screen.height;
				var wpctx = wp.getContext("2d");
				for(var x=0; x<wp.width; x+=canvas.width){
					for(var y=0; y<wp.height; y+=canvas.height){
						wpctx.drawImage(canvas, x, y);
					}
				}
				if(window.chrome && chrome.wallpaper){
					chrome.wallpaper.setWallpaper({
						url: wp.toDataURL(),
						layout: 'CENTER_CROPPED',
						name: file_name,
					}, function(){});
				}else{
					window.open(wp.toDataURL());
				}
			}
		},
		{
			item: "Set As Wa&llpaper (Centered)",
			action: function(){
				chrome.wallpaper.setWallpaper({
					url: canvas.toDataURL(),
					layout: 'CENTER_CROPPED',
					name: file_name,
				}, function(){});
			}
		},
		____________________________,
		{
			item: "Recent File",
			disabled: true
		},
		____________________________,
		{
			item: "E&xit",
			shortcut: "Alt+F4",
			action: function(){
				window.close();
			}
		}
	],
	"&Edit": [
		{
			item: "&Undo",
			shortcut: "Ctrl+Z",
			action: undo
		},
		{
			item: "&Repeat",
			shortcut: "F4",
			action: redo,
			disabled: true
		},
		____________________________,
		{
			item: "Cu&t",
			shortcut: "Ctrl+X",
			disabled: true
		},
		{
			item: "&Copy",
			shortcut: "Ctrl+C",
			disabled: true
		},
		{
			item: "&Paste",
			shortcut: "Ctrl+V",
			disabled: true
		},
		{
			item: "C&lear Selection",
			shortcut: "Del",
			action: delete_selection,
			disabled: true
		},
		{
			item: "Select &All",
			shortcut: "Ctrl+A",
			action: select_all
		},
		____________________________,
		{
			item: "C&opy To...",
			disabled: true
		},
		{
			item: "Paste &From...",
			action: paste_from
		}
	],
	"&View": [
		{
			item: "&Tool Box",
			shortcut: "Ctrl+T",
			checkbox: {}
		},
		{
			item: "&Color Box",
			shortcut: "Ctrl+L",
			checkbox: {}
		},
		{
			item: "&Status Bar",
			checkbox: {}
		},
		{
			item: "T&ext Toolbar",
			disabled: true,
			checkbox: {}
		},
		____________________________,
		{
			item: "&Zoom",
			submenu: []
		},
		{
			item: "&View Bitmap",
			shortcut: "Ctrl+F",
			action: view_bitmap
		}
	],
	"&Image": [
		{
			item: "&Flip/Rotate",
			shortcut: "Ctrl+R"
		},
		{
			item: "&Stretch/Skew",
			shortcut: "Ctrl+W"
		},
		{
			item: "&Invert Colors",
			shortcut: "Ctrl+I",
			action: invert
		},
		{
			item: "&Attributes...",
			shortcut: "Ctrl+E"
		},
		{
			item: "&Clear Image",
			shortcut: "Ctrl+Shift+N",
			action: clear
		},
		{
			item: "&Draw Opaque",
			checkbox: {}
		}
	],
	"&Colors": [
		{
			item: "&Edit Colors...",
			action: function(){}
		}
	],
	"&Help": [
		{
			item: "&Help Topics",
			action: function(){}
		},
		____________________________,
		{
			item: "&About Paint",
			action: function(){}
		}
	],
}, function(menu_key, menu_items){
	var _html = function(menu_key){
		return menu_key.replace(/&(.)/, function(m){
			return "<span class='jspaint-menu-hotkey'>" + m[1] + "</span>";
		});
	};
	var _hotkey = function(menu_key){
		return menu_key[menu_key.indexOf("&")+1].toUpperCase();
	};
	var this_click_opened_the_menu = false;
	var $menu_container = $(E("div")).addClass("jspaint-menu-container").appendTo($menus);
	var $menu_button = $(E("div")).addClass("jspaint-menu-button").appendTo($menu_container);
	var $menu_popup = $(E("div")).addClass("jspaint-menu-popup").appendTo($menu_container);
	var $menu_popup_table = $(E("table")).addClass("jspaint-menu-popup-table").appendTo($menu_popup);
	$menu_popup.hide();
	$menu_button.html(_html(menu_key));
	$menu_button.on("mousedown mousemove", function(e){
		if(e.type === "mousemove" && !selecting_menus){
			return;
		}
		if(e.type === "mousedown"){
			if(!$menu_button.hasClass("active")){
				this_click_opened_the_menu = true;
			}
		}
		
		$menus.find(".jspaint-menu-button").trigger("release");
		
		$menu_button.addClass("active");
		$menu_popup.show();
		
		selecting_menus = true;
	});
	$menu_button.on("mouseup", function(e){
		if(this_click_opened_the_menu){
			this_click_opened_the_menu = false;
			return;
		}
		if($menu_button.hasClass("active")){
			$menus.find(".jspaint-menu-button").trigger("release");
		}
	});
	$menu_button.on("release", function(e){
		selecting_menus = false;
		
		$menu_button.removeClass("active");
		$menu_popup.hide();
	});
	$.map(menu_items, function(item){
		var $row = $(E("tr")).addClass("jspaint-menu-row").appendTo($menu_popup_table)
		if(item === ____________________________){
			var $td = $(E("td")).attr({colspan: 4}).appendTo($row);
			var $hr = $(E("hr")).addClass("jspaint-menu-hr").appendTo($td);
		}else{
			var $item = $row.addClass("jspaint-menu-item");
			var $checkbox_area = $(E("td")).addClass("jspaint-menu-item-checkbox-area");
			var $label = $(E("td")).addClass("jspaint-menu-item-label");
			var $shortcut = $(E("td")).addClass("jspaint-menu-item-shortcut");
			var $submenu_area = $(E("td")).addClass("jspaint-menu-item-submenu-area");
			$item.append($checkbox_area, $label, $shortcut, $submenu_area);
			
			$label.html(_html(item.item));
			$shortcut.text(item.shortcut);
			$item.attr("disabled", item.disabled);
			if(item.checkbox){
				$checkbox_area.text("✓");
			}
			
			$item.on("click", function(){
				$menus.find(".jspaint-menu-button").trigger("release");
				item.action && item.action();
			});
		}
	});
});
$(window).on("keypress", function(e){
	$menus.find(".jspaint-menu-button").trigger("release");
});
$(window).on("mousedown mouseup", function(e){
	if(!$.contains($menus.get(0), e.target)){
		$menus.find(".jspaint-menu-button").trigger("release");
	}
});

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
		
		$canvas.trigger("update"); //update handles
		
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
	}else if(e.keyCode === 115){ //F4
		redo();
	}else if(e.keyCode === 46){ //Delete
		delete_selection();
	}else if(e.keyCode === 107 || e.keyCode === 109){
		var plus = e.keyCode === 107;
		var minus = e.keyCode === 109;
		if(selection){
			//scale selection
		}else{
			var delta = +plus++ -minus--;//Δ = ±±±±
			
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
				invert();
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
	if(textbox){ return; }
	e.preventDefault();
	var cd = e.originalEvent.clipboardData || window.clipboardData;
	if(!cd){ return; }
	
	if(e.type === "copy" || e.type === "cut"){
		if(selection && selection.canvas){
			var data = selection.canvas.toDataURL("image/png");
			cd.setData("URL", data);
			cd.setData("image/png", data);
			if(e.type === "cut"){
				selection.destroy();
				selection = null;
			}
		}
	}else if(e.type === "paste"){
		$.each(cd.items, function(i, item){
			if(item.type.match(/image/)){
				paste_file(item.getAsFile());
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
	
	// this would be a lot nicer in ruby (or ooplie)
	// it would be just "if selected_tool.passive" (or in ooplie, "If the selected tool is passive")
	if((typeof selected_tool.passive === "function") ? selected_tool.passive() : selected_tool.passive){
		mousedown_action();
	}else{
		undoable(mousedown_action);
	}
});

$body.on("contextmenu", function(e){
	return false;
});
$body.on("mousedown", function(e){
	if(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement){
		return true;
	}
	e.preventDefault();
});
