
var app = {};
var TAU = 2 * Math.PI;

app.open = function(){
	
	var stroke_width = 1;
	var stroke_color;
	var fill_color;
	
	var brush_image = new Image();
	brush_image.src = "images/scroll-left.png";
	var brush_canvas = $("<canvas>")[0];
	var brush_ctx = brush_canvas.getContext("2d");
	var brush_rendered_color;
	
	var tools = [{
		name: "Free-Form Select",
		description: "Selects a free-form part of the picture to move, copy, or edit.",
		passive: true,
	},{
		name: "Select",
		description: "Selects a rectangular part of the picture to move, copy, or edit.",
		passive: true,
	},{
		name: "Eraser/Color Eraser",
		description: "Erases a portion of the picture, using the selected eraser shape.",
		continuous: "space",
		paint: function(ctx, x, y){
			ctx.fillStyle = color2;
			ctx.fillRect(x-4, y-4, 8, 8);
		}
	},{
		name: "Fill With Color",
		description: "Fills an area with the selected drawing color.",
		mousedown: function(ctx, x, y){
			var _c = document.createElement("canvas");
			_c.width = _c.height = 1;
			var _ctx = _c.getContext("2d");
			_ctx.fillStyle = fill_color;
			_ctx.fillRect(0,0,1,1);
			var _id = _ctx.getImageData(0,0,1,1);
			var fill_r = _id.data[0];
			var fill_g = _id.data[1];
			var fill_b = _id.data[2];
			
			var stack = [[x, y]];
			var c_width = canvas.width;
			var c_height = canvas.height;
			var id = ctx.getImageData(0,0,c_width,c_height);
			pixel_pos = (y*c_width + x) * 4;
			var start_r = id.data[pixel_pos+0];
			var start_g = id.data[pixel_pos+1];
			var start_b = id.data[pixel_pos+2];
			if(fill_r === start_r
			&& fill_g === start_g
			&& fill_b === start_b){
				return;
			}
			while(stack.length){
				var new_pos, x, y, pixel_pos, reach_left, reach_right;
				new_pos = stack.pop();
				x = new_pos[0];
				y = new_pos[1];

				pixel_pos = (y*c_width + x) * 4;
				while(match_start_color(pixel_pos)){
					pixel_pos -= c_width * 4, y--;
				}
				pixel_pos += c_width * 4, y++;
				reach_left = false;
				reach_right = false;
				while(y++ < c_height && match_start_color(pixel_pos)){
					color_pixel(pixel_pos);

					if(x > 0){
						if(match_start_color(pixel_pos - 4)){
							if(!reach_left){
								stack.push([x - 1, y]);
								reach_left = true;
							}
						}else if(reach_left){
							reach_left = false;
						}
					}

					if(x < c_width-1){
						if(match_start_color(pixel_pos + 4)){
							if(!reach_right){
								stack.push([x + 1, y]);
								reach_right = true;
							}
						}else if(reach_right){
							reach_right = false;
						}
					}

					pixel_pos += c_width * 4;
				}
			}
			ctx.putImageData(id, 0, 0);

			function match_start_color(pixel_pos){
				return (id.data[pixel_pos+0] === start_r
				     && id.data[pixel_pos+1] === start_g
				     && id.data[pixel_pos+2] === start_b);
			}

			function color_pixel(pixel_pos){
				id.data[pixel_pos+0] = fill_r;
				id.data[pixel_pos+1] = fill_g;
				id.data[pixel_pos+2] = fill_b;
				id.data[pixel_pos+3] = 255;
			}
		}
	},{
		name: "Pick Color",
		description: "Picks up a color from the picture for drawing.",
		deselectable: true,
		passive: true,
	},{
		name: "Magnifier",
		description: "Changes the magnification.",
		deselectable: true,
		passive: true,
	},{
		name: "Pencil",
		description: "Draws a free-form line one pixel wide.",
		continuous: "space",
		paint: function(ctx, x, y){
			ctx.fillRect(x, y, 1, 1);
		}
	},{
		name: "Brush",
		description: "Draws using a brush with the selected shape and size.",
		continuous: "space",
		paint: function(ctx, x, y){
			var sz = 16;
			if(brush_rendered_color !== stroke_color){
				brush_canvas.width = sz;
				brush_canvas.height = sz;
				brush_ctx.clearRect(0,0,sz,sz);
				brush_ctx.drawImage(brush_image,sz/2-brush_image.width/2,sz/2-brush_image.height/2);
				brush_ctx.globalCompositeOperation = "source-atop";
				brush_ctx.fillStyle = stroke_color;
				brush_ctx.fillRect(0,0,sz,sz);
				brush_ctx.globalCompositeOperation = "source-over";
				
				brush_rendered_color = stroke_color;
			}
			ctx.drawImage(brush_canvas, x-sz/2, y-sz/2);
		}
	},{
		name: "Airbrush",
		description: "Draws using an airbrush of the selected size.",
		continuous: "time",
		paint: function(ctx, x, y){
			var radius = 15;//@TODO: options
			var sqr = radius * radius;
			for(var i=0; i<100; i++){
				var rx = (Math.random()*2-1)*radius;
				var ry = (Math.random()*2-1)*radius;
				var d = rx*rx + ry*ry;
				if(d <= radius){
					ctx.fillRect(x+rx|0, y+ry|0, 1, 1);
				}
			}
		}
	},{
		name: "Text",
		description: "Inserts text into the picture.",
	},{
		name: "Line",
		description: "Draws a straight line with the selected line width.",
		stroke_only: true,
		shape: function(ctx, x, y, w, h){
			line(ctx, x, y, x+w, y+h);
		}
	},{
		name: "Curve",
		description: "Draws a curved line with the selected line width.",
	},{
		name: "Rectangle",
		description: "Draws a rectangle with the selected fill style.",
		shape: function(ctx, x, y, w, h){
			ctx.beginPath();
			ctx.rect(x-0.5, y-0.5, w, h);
			ctx.fill();
			ctx.stroke();
		}
	},{
		name: "Polygon",
		description: "Draws a polygon with the selected fill style.",
	},{
		name: "Ellipse",
		description: "Draws an ellipse with the selected fill style.",
		shape: function(ctx, x, y, w, h){
			var fill = ctx.fillStyle;
			var stroke = ctx.strokeStyle;
			
			var r1 = Math.round;
			var r2 = Math.round;
			
			var cx = x + w/2;
			var cy = y + h/2;
			ctx.fillStyle = stroke;
			for(var r=0; r<Math.PI*2; r+=0.01){
				var rx = Math.cos(r) * w/2;
				var ry = Math.sin(r) * h/2;
				
				var rect_x = r1(cx+rx);
				var rect_y = r1(cy+ry);
				var rect_w = r2(-rx*2);
				var rect_h = r2(-ry*2);
				
				ctx.fillRect(rect_x+1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y+1, rect_w, rect_h);
				ctx.fillRect(rect_x-1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y-1, rect_w, rect_h);
			}
			ctx.fillStyle = fill;
			for(var r=0; r<Math.PI*2; r+=0.01){
				var rx = Math.cos(r) * w/2;
				var ry = Math.sin(r) * h/2;
				ctx.fillRect(
					r1(cx+rx),
					r1(cy+ry),
					r2(-rx*2),
					r2(-ry*2)
				);
			}
		}
	},{
		name: "Rounded Rectangle",
		description: "Draws a rounded rectangle with the selected fill style.",
		shape: function(ctx, x, y, w, h){
			if(w<0){ x+=w; w=-w; }
			if(h<0){ y+=h; h=-h; }
			var radius = Math.min(7, w/2, h/2);
			
			
			var iw = w-radius*2;
			var ih = h-radius*2;
			var ix = x+radius;
			var iy = y+radius;
			
			var fill = ctx.fillStyle;
			var stroke = ctx.strokeStyle;
			
			var r1 = Math.round;
			var r2 = Math.round;
			
			ctx.fillStyle = stroke;
			for(var r=0; r<Math.PI*2; r+=0.05){
				var rx = Math.cos(r) * radius;
				var ry = Math.sin(r) * radius;
				
				var rect_x = r1(ix+rx);
				var rect_y = r1(iy+ry);
				var rect_w = r2(iw-rx*2);
				var rect_h = r2(ih-ry*2);
				
				ctx.fillRect(rect_x+1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y+1, rect_w, rect_h);
				ctx.fillRect(rect_x-1, rect_y, rect_w, rect_h);
				ctx.fillRect(rect_x, rect_y-1, rect_w, rect_h);
			}
			ctx.fillStyle = fill;
			for(var r=0; r<Math.PI*2; r+=0.05){
				var rx = Math.cos(r) * radius;
				var ry = Math.sin(r) * radius;
				ctx.fillRect(
					r1(ix+rx),
					r1(iy+ry),
					r2(iw-rx*2),
					r2(ih-ry*2)
				);
			}
		}
	}];
	
	var palette = [
		"#000000","#787878","#790300","#757A01","#007902","#007778","#0A0078","#7B0077","#767A38","#003637","#286FFE","#083178","#4C00FE","#783B00",
		"#FFFFFF","#BBBBBB","#FF0E00","#FAFF08","#00FF0B","#00FEFF","#3400FE","#FF00FE","#FBFF7A","#00FF7B","#76FEFF","#8270FE","#FF0677","#FF7D36",
	];
	
	var selected_tool = tools[6];
	var previous_tool = selected_tool;
	var color1, color2, color3;
	
	var default_width = 683;
	var default_height = 384;
	
	
	var $app = $("<div class='jspaint'>").appendTo("body");
	
	var $V = $("<div class='jspaint-vertical'>").appendTo($app);
	var $H = $("<div class='jspaint-horizontal'>").appendTo($V);
	
	var $canvas_area = $("<div class='jspaint-canvas-area'>").appendTo($H);
	var $resize_ghost = $("<div class='jspaint-canvas-resize-ghost'>");
	var $canvas = $("<canvas>").appendTo($canvas_area);
	var canvas = $canvas[0];
	var ctx = canvas.getContext("2d");
	
	var $top = $("<c-area>").prependTo($V);
	var $bottom = $("<c-area>").appendTo($V);
	var $left = $("<c-area>").prependTo($H);
	var $right = $("<c-area>").appendTo($H);
	
	var $toolbox = $ToolBox();
	var $colorbox = $ColorBox();
	
	
	var undos = [];
	var redos = [];
	
	file_new();
	
	
	
	function are_you_sure(action){
		if(undos.length || redos.length){
			//@TODO: window within DOM
			confirm("Are you sure? Of everything?") && action();
		}else{
			action();
		}
	}
	
	function reset_colors(){
		color1 = "black";
		color2 = "white";
		color3 = "";
		$colorbox.update_colors();
	}
	
	function file_new(){
		undos = [];
		redos = [];
		reset_colors();
		
		canvas.width = default_width;
		canvas.height = default_height;
		
		ctx.fillStyle = color2;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	
	function file_open(){
		var $input = $("<input type=file>")
		.appendTo("body")
		.hide()
		.click()
		.on("change", function(){
			$.each(this.files, function(i, file){
				if(file.type.match(/image/)){
					var reader = new FileReader();
					reader.onload = function(e){
						var img = new Image();
						img.onload = function(){
							undos = [];
							redos = [];
							reset_colors();
							
							canvas.width = img.naturalWidth;
							canvas.height = img.naturalHeight;
							
							ctx.clearRect(0, 0, canvas.width, canvas.height);
							ctx.drawImage(img,0,0);
						};
						img.src = e.target.result;
					};
					reader.readAsDataURL(file);
					return false;
				}
			});
			$input.remove();
		});
	}
	
	function file_save(){
		window.open(canvas.toDataURL());
	}
	
	
	function render_GIF(){
		var $win = $Window();
		$win.title("Rendering GIF");
		var $output = $win.$content;
		
		if(typeof GIF === "undefined"){
			$.getScript("gif.js/gif.js",go);
			$output.text("Fetching GIF.js");
		}else{
			go();
		}
		function go(){
			
			var gif = new GIF({
				workers: Math.floor(undos.length/50)+1,
				workerScript: 'gif.js/gif.worker.js',
				width: canvas.width,
				height: canvas.height,
			});
			
			gif.on('progress', function(p){
				$output.text(~~(p*100)+'%');
			});
			
			gif.on('finished', function(blob){
				$win.title("Rendered GIF");
				$output.empty().append(
					$("<img>").attr("src", URL.createObjectURL(blob))
				);
			});
			
			for(var i=0; i<undos.length; i++){
				gif.addFrame(undos[i], {delay: 200});
			}
			gif.addFrame(canvas, {delay: 200});
			gif.render();

		}
	}
	
	function undoable(){
		if(redos.length > 5){
			if(confirm("Discard "+redos.length+" possible redo-able actions? \n(Ctrl+Y to redo)")){
				redos = [];
			}
			return false;
		}else{
			redos = [];
		}
		
		var c = document.createElement("canvas");
		c.width = canvas.width;
		c.height = canvas.height;
		var x = c.getContext("2d");
		x.drawImage(canvas,0,0);
		
		undos.push(c);
		
		return true;
	}
	function undo(){
		if(undos.length<1) return false;
		
		var c = document.createElement("canvas");
		c.width = canvas.width;
		c.height = canvas.height;
		var x = c.getContext("2d");
		x.drawImage(canvas,0,0);
		
		redos.push(c);
		
		c = undos.pop();
		canvas.width = c.width;
		canvas.height = c.height;
		ctx.drawImage(c,0,0);
		$handles.trigger("update");
		
		return true;
	}
	function redo(){
		if(redos.length<1) return false;
		
		var c = document.createElement("canvas");
		c.width = canvas.width;
		c.height = canvas.height;
		var x = c.getContext("2d");
		x.drawImage(canvas,0,0);
		
		undos.push(c);
		
		c = redos.pop();
		canvas.width = c.width;
		canvas.height = c.height;
		ctx.drawImage(c,0,0);
		$handles.trigger("update");
		
		return true;
	}
	
	function $Handle(pos_y, pos_x){
		var $h = $("<div>").addClass("jspaint-handle");
		$h.appendTo($canvas_area);
		
		var resizes_height = pos_x !== "left" && pos_y === "bottom";
		var resizes_width = pos_x === "right" && pos_y !== "top";
		var width = default_width;
		var height = default_height;
		var dragged = false;
		if(!(resizes_width || resizes_height)){
			$h.addClass("jspaint-useless-handle");
		}else{
			var cursor;
			if(resizes_width && resizes_height){
				cursor = "nwse-resize";
			}else if(resizes_width){
				cursor = "ew-resize";
			}else if(resizes_height){
				cursor = "ns-resize";
			}
			$h.css({cursor:cursor});
			
			var mousemove = function(e){
				$resize_ghost.appendTo("body");
				dragged = true;
				
				var rect = canvas.getBoundingClientRect();
				$resize_ghost.css({
					position: "absolute",
					left: rect.left,
					top: rect.top,
					width: width = (resizes_width? (e.clientX - rect.left) : (rect.width)),
					height: height = (resizes_height? (e.clientY - rect.top) : (rect.height)),
				});
			};
			$h.on("mousedown", function(e){
				dragged = false;
				if(e.button === 0){
					$(window).on("mousemove", mousemove);
					$("body").css({cursor:cursor});
				}
				$(window).one("mouseup", function(e){
					$(window).off("mousemove", mousemove);
					$("body").css({cursor:"auto"});
					
					$resize_ghost.remove();
					if(dragged){
						if(undoable()){
							canvas.width = Math.max(1, width);
							canvas.height = Math.max(1, height);
							ctx.fillStyle = color2;
							ctx.fillRect(0,0,width,height);
							
							var previous_canvas = undos[undos.length-1];
							if(previous_canvas){
								ctx.drawImage(previous_canvas,0,0);
							}
						}
					}
					$handles.trigger("update");
				});
			});
		}
		$h.on("update", function(){
			var rect = canvas.getBoundingClientRect();
			var hs = $h.width();
			if(pos_x === "middle"){
				$h.css({ left: rect.left + rect.width/2 - hs/2 });
			}else if(pos_x === "left"){
				$h.css({ left: rect.left - hs });
			}else if(pos_x === "right"){
				$h.css({ left: rect.right });
			}
			if(pos_y === "middle"){
				$h.css({ top: rect.top + rect.height/2 - hs/2 });
			}else if(pos_y === "top"){
				$h.css({ top: rect.top - hs });
			}else if(pos_y === "bottom"){
				$h.css({ top: rect.bottom });
			}
		});
	}
	$.each([
		["top", "right"],//↗
		["top", "middle"],//↑
		["top", "left"],//↖
		["middle", "left"],//←
		["bottom", "left"],//↙
		["bottom", "middle"],//↓
		["bottom", "right"],//↘
		["middle", "right"],//→
	],function(i,pos){
		$Handle(pos[0], pos[1]);
	});
	var $handles = $(".jspaint-handle");
	var update_handles = function(){
		$handles.trigger("update");
	};
	$(window).on("resize",update_handles);
	$canvas_area.on("scroll",update_handles);
	setTimeout(update_handles,50);
	
	
	
	$(window).on("keydown",function(e){
		if(e.keyCode === 27){//Escape
			//if(tool_active){
			//	cancel();
			//}else{
			//	deselect();
			//}
		}else if(e.keyCode === 27){//F4
			redo();
		}else if(e.ctrlKey){
			switch(String.fromCharCode(e.keyCode).toUpperCase()){
				case "Z":
					e.shiftKey ? redo() : undo();
				break;
				case "Y":
					redo();
				break;
				case "G":
					render_GIF();
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
					file_save();
				break;
				case "A":
					//select_all();
				break;
				default: return true;
			}
			e.preventDefault();
			return false;
		}
	});
	$(window).on("paste", function(e){
		var items = e.originalEvent.clipboardData.items;
		$.each(items, function(i, item){
			if(item.type.match(/image/)){
				var blob = item.getAsFile();
				var reader = new FileReader();
				reader.onload = function(e){
					var img = new Image();
					img.onload = function(){
						if(undoable()){
							if(img.width > canvas.width || img.height > canvas.height){
								//todo: don't use confirm
								if(confirm("The image is bigger than the canvas. Would you like the canvas to be enlarged?")){
									canvas.width = img.width;
									canvas.height = img.height;
								}
							}
							//todo: make draggable selection object
							ctx.drawImage(img,0,0);
						}
					};
					img.src = e.target.result;
				};
				reader.readAsDataURL(blob);
				return false;
			}
		});
	});
	
	var mouse, mouse_start, mouse_previous;
	var reverse, ctrl;
	var e2c = function(e){
		var rect = canvas.getBoundingClientRect();
		var cx = e.clientX - rect.left;
		var cy = e.clientY - rect.top;
		return {
			x: (cx / rect.width * canvas.width)|0,
			y: (cy / rect.height * canvas.height)|0,
		};
	};
	var tool_go = function(event_name){
		if(selected_tool.shape){
			var previous_canvas = undos[undos.length-1];
			if(previous_canvas){
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.drawImage(previous_canvas,0,0);
			}
			if(reverse ^ selected_tool.stroke_only){
				ctx.fillStyle = color1;
				ctx.strokeStyle = color2;
			}else{
				ctx.fillStyle = color2;
				ctx.strokeStyle = color1;
			}
			selected_tool.shape(ctx, mouse_start.x, mouse_start.y, mouse.x-mouse_start.x, mouse.y-mouse_start.y);
		}
		
		ctx.fillStyle = fill_color = 
		ctx.strokeStyle = stroke_color = 
			(ctrl&&color3) ? color3 :
			reverse ? color2 : color1;
		
		if(selected_tool[event_name]){
			selected_tool[event_name](ctx, mouse.x, mouse.y);
		}
		if(selected_tool.paint){
			if(selected_tool.continuous === "space"){
				bresenham(mouse_previous.x, mouse_previous.y, mouse.x, mouse.y, function(x,y){
					selected_tool.paint(ctx, x, y);
				});
			}else{
				selected_tool.paint(ctx, mouse.x, mouse.y);
			}
		}
	};
	var canvas_mouse_move = function(e){
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
	};
	$canvas.on("mousedown", function(e){
		if(e.button === 0){
			reverse = false;
		}else if(e.button === 2){
			reverse = true;
		}else{
			return false;
		}
		ctrl = e.ctrlKey;
		mouse_start = mouse_previous = mouse = e2c(e);
		
		if(!selected_tool.passive){
			if(!undoable()) return;
		}
		if(selected_tool.paint || selected_tool.mousedown){
			tool_go("mousedown");
		}
		
		$(window).on("mousemove", canvas_mouse_move);
		if(selected_tool.continuous === "time"){
			var iid = setInterval(function(){
				tool_go();
			},10);
		}
		$(window).one("mouseup", function(e){
			$(window).off("mousemove",canvas_mouse_move);
			if(iid){
				clearInterval(iid);
			}
		});
	});
	
	function bresenham(x1, y1, x2, y2, callback){
		// Bresenham's line algorithm
		
		x1=x1|0,x2=x2|0,y1=y1|0,y2=y2|0;
		
		var dx = Math.abs(x2 - x1);
		var dy = Math.abs(y2 - y1);
		var sx = (x1 < x2) ? 1 : -1;
		var sy = (y1 < y2) ? 1 : -1;
		var err = dx - dy;
		
		while(1){
			callback(x1, y1);
			
			if(x1===x2 && y1===y2) break;
			var e2 = err*2;
			if(e2 >-dy){ err -= dy; x1 += sx; }
			if(e2 < dx){ err += dx; y1 += sy; }
		}
		
	}
	
	function line(ctx, x1, y1, x2, y2){
		bresenham(x1, y1, x2, y2, function(x,y){
			ctx.fillRect(x,y,1,1);
		});
	}
	
	function $ToolBox(){
		var $tb = $("<div>").addClass("jspaint-tool-box");
		var $tools = $("<div class='jspaint-tools'>");
		var $tool_options = $("<div class='jspaint-tool-options'>");
		
		var $buttons;
		$.each(tools, function(i, tool){
			var $b = $("<button class='jspaint-tool'>");
			$b.appendTo($tools);
			tool.$button = $b;
			
			$b.attr("title", tool.name);
			if(tool === selected_tool){
				$b.addClass("selected");
			}
			
			var $icon = $("<span/>");
			$icon.appendTo($b);
			var bx = (i%2)*24;
			var by = ((i/2)|0)*25;
			$icon.css({
				display: "block",
				width: "100%",
				height: "100%",
				backgroundImage: "url(images/toolbar-icons.png)",
				backgroundPositionX: bx,
				backgroundPositionY: -by,
			});
			
			$b.on("click", function(){
				$buttons.removeClass("selected");
				
				if(selected_tool === tool && tool.deselectable){
					$.each(tools, function(j, _tool){
						if(_tool === previous_tool){
							selected_tool = previous_tool;
							previous_tool.$button.addClass("selected");
						}
					});
				}else{
					if(!tool.deselectable){
						previous_tool = tool;
					}
					selected_tool = tool;
					$b.addClass("selected");
				}
			});
		});
		$buttons = $tools.find(".jspaint-tool");
		
		return $Component("Tools", "tall", $tools.add($tool_options));
	}
	function $ColorBox(){
		var $cb = $("<div>").addClass("jspaint-color-box");
		$cb.addClass("jspaint-color-box");
		
		var $current_colors = $("<div>").addClass("jspaint-current-colors");
		var $palette = $("<div>").addClass("jspaint-palette");
		
		$cb.append($current_colors, $palette);
		
		var $color1 = $("<div class='jspaint-color-selection'>");
		var $color2 = $("<div class='jspaint-color-selection'>");
		$current_colors.append($color1, $color2);
		
		$current_colors.css({
			position: "relative",
		});
		$color1.css({
			position: "absolute",
			zIndex: 1,
			left: 2,
			top: 4,
		});
		$color2.css({
			position: "absolute",
			right: 3,
			bottom: 3,
		});
		
		function update_colors(){
			$current_colors.css({background:color3});
			$color1.css({background:color1});
			$color2.css({background:color2});
		}
		
		$.each(palette, function(i, color){
			var $b = $("<button class='jspaint-color-button'>");
			$b.appendTo($palette);
			
			$b.css({background:color});
			
			$b.on("mousedown", function(e){
				e.preventDefault();
				if(e.ctrlKey){
					color3 = color;
				}else if(e.button === 0){
					color1 = color;
				}else if(e.button === 2){
					color2 = color;
				}
				update_colors();
			});
		});
		
		var $c = $Component("Colors", "wide", $cb);
		$c.update_colors = update_colors;
		return $c;
		
	}
	function $Component(name, orientation, $el){
		//a draggable widget that can be undocked into a window
		var $c = $("<div>").addClass("jspaint-component");
		$c.addClass("jspaint-"+name+"-component");
		$c.append($el);
		$c.appendTo({
			tall: $left,
			wide: $bottom,
		}[orientation]);
		
		var ox, oy, w, h, pos, pos_axis;
		var dragging = false;
		var $dock_to;
		var $ghost;
		$c.on("mousedown",function(e){
			if(e.button !== 0) return;
			
			var rect = $c[0].getBoundingClientRect();
			w = ((rect.width/2)|0)*2+1;//make sure these dimensions are odd numbers
			h = ((rect.height/2)|0)*2+1;
			ox = $c.position().left - e.clientX;
			oy = $c.position().top - e.clientY;
			dragging = true;
			
			if(!$ghost){
				$ghost = $("<div class='jspaint-component-ghost dock'>");
				$ghost.css({
					position: "absolute",
					display: "block",
					width: w,
					height: h,
					left: e.clientX + ox,
					top: e.clientY + oy
				});
				$ghost.appendTo("body");
			}
			
			e.preventDefault();
		});
		$el.on("mousedown",function(e){
			return false;
		});
		$(window).on("mousemove",function(e){
			if(!dragging) return;
			
			$ghost.css({
				left: e.clientX + ox,
				top: e.clientY + oy,
			});
			
			$dock_to = null;
			
			var ghost = $ghost[0].getBoundingClientRect();
			var q = 5;
			if(orientation === "tall"){
				pos_axis = "top";
				if(ghost.left-q < $left[0].getBoundingClientRect().right){
					$dock_to = $left;
				}
				if(ghost.right+q > $right[0].getBoundingClientRect().left){
					$dock_to = $right;
				}
			}else{
				pos_axis = "left";
				if(ghost.top-q < $top[0].getBoundingClientRect().bottom){
					$dock_to = $top;
				}
				if(ghost.bottom+q > $bottom[0].getBoundingClientRect().top){
					$dock_to = $bottom;
				}
			}
			pos = ghost[pos_axis];
			
			if($dock_to){
				$ghost.addClass("dock");
			}else{
				$ghost.removeClass("dock");
			}
			
			e.preventDefault();
		});
		$(window).on("mouseup",function(e){
			if(!dragging) return;
			dragging = false;
			
			if($dock_to){
				$dock_to.append($c);
				
				pos = Math.max(pos, 0);
				if(pos_axis === "top"){
					pos = Math.min(pos, $dock_to.height() - $ghost.height());
				}else{
					pos = Math.min(pos, $dock_to.width() - $ghost.width());
				}
				
				$c.css("position", "relative");
				$c.css(pos_axis, pos);
			}else{
				//put component in window
			}
			
			$ghost && $ghost.remove(), $ghost = null;
			
			update_handles();
		});
		return $c;
	}
	function $Window(){
		var $w = $("<div class='jspaint-window'/>").appendTo("body");
		$w.$titlebar = $("<div class='jspaint-window-titlebar'/>").appendTo($w);
		$w.$title = $("<span class='jspaint-window-title'/>").appendTo($w.$titlebar);
		$w.$x = $("<button class='jspaint-window-close-button'/>").appendTo($w.$titlebar);
		$w.$content = $("<div class='jspaint-window-content'/>").appendTo($w);
		
		$w.$x.on("click", function(){
			$w.close();
		});
		
		$w.title = function(title){
			if(title){
				$w.$title.text(title);
				return $w;
			}else{
				return $w.$title.text();
			}
		};
		$w.close = function(){
			$w.remove();
		};
		
		$w.css({
			position: "absolute",
			right: 50,
			top: 50
		});
		
		return $w;
	}
};

$(function(){
	app.open();
	$("body").on("contextmenu",function(e){
		return false;
	});
	$("body").on("mousedown",function(e){
		e.preventDefault();
	});
});