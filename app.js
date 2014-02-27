
var app = {};

app.open = function(){
	
	var tools = [{
		name: "Free-Form Select",
		description: "Selects a free-form part of the picture to move, copy, or edit.",
	},{
		name: "Select",
		description: "Selects a rectangular part of the picture to move, copy, or edit.",
	},{
		name: "Eraser/Color Eraser",
		description: "Erases a portion of the picture, using the selected eraser shape.",
	},{
		name: "Fill With Color",
		description: "Fills an area with the selected drawing color.",
	},{
		name: "Pick Color",
		description: "Picks up a color from the picture for drawing.",
		deselectable: true,
	},{
		name: "Magnifier",
		description: "Changes the magnification.",
		deselectable: true,
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
			ctx.drawImage(selected_brush_img, x, y);
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
		shape: function(ctx, x, y, w, h){
			ctx.moveTo(x, y);
			ctx.lineTo(x+w, y+h);
		}
	},{
		name: "Curve",
		description: "Draws a curved line with the selected line width.",
	},{
		name: "Rectangle",
		description: "Draws a rectangle with the selected fill style.",
		shape: function(ctx, x, y, w, h){
			ctx.rect(x, y, w, h);
		}
	},{
		name: "Polygon",
		description: "Draws a polygon with the selected fill style.",
	},{
		name: "Ellipse",
		description: "Draws an ellipse with the selected fill style.",
		shape: function(ctx, x, y, w, h){
			var kappa = 0.5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w,           // x-end
			ye = y + h,           // y-end
			xm = x + w / 2,       // x-middle
			ym = y + h / 2;       // y-middle
			
			ctx.beginPath();
			ctx.moveTo(x, ym);
			ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
			ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
			ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
			ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
			ctx.closePath();
			ctx.stroke();
		}
	},{
		name: "Rounded Rectangle",
		description: "Draws a rounded rectangle with the selected fill style.",
		shape: function(ctx, x, y, w, h){
			var radius = 10;//ish
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + w - radius, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
			ctx.lineTo(x + w, y + h - radius);
			ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
			ctx.lineTo(x + radius, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
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
	
	
	file_new();
	
	var $toolbox = $ToolBox();
	var $colorbox = $ColorBox();
	
	
	
	var undos = [];
	var redos = [];
	
	
	function file_new(){
		color1 = "black";
		color2 = "white";
		color3 = "transparent";
		
		canvas.width = default_width;
		canvas.height = default_height;
		
		ctx.fillStyle = color2;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	
	function undoable(){
		var c = document.createElement("canvas");
		c.width = canvas.width;
		c.height = canvas.height;
		var x = c.getContext("2d");
		x.drawImage(canvas,0,0);
		
		undos.push(c);
		if(redos.length){
			console.log(redos.length+" redos lost.");
		}
		redos = [];
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
						undoable();
						
						canvas.width = Math.max(1, width);
						canvas.height = Math.max(1, height);
						ctx.fillStyle = color2;
						ctx.fillRect(0,0,width,height);
						
						var previous_canvas = undos[undos.length-1];
						if(previous_canvas){
							ctx.drawImage(previous_canvas,0,0);
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
				case "Z"://undo (+shift=redo)
					e.shiftKey ? redo() : undo();
				break;
				case "Y"://redo
					redo();
				break;
				case "A"://select all
					//select_all();
					e.preventDefault();
				break;
			}
		}
	});
	$(document).on("paste", function(e){
		var items = e.originalEvent.clipboardData.items;
		$.each(items, function(i, item){
			if(item.type.match(/image/)){
				var blob = item.getAsFile();
				var reader = new FileReader();
				reader.onload = function(e){
					console.log(e.target.result);
				};
				reader.readAsDataURL(blob);
				return false;
			}
		});
	});
	
	var mouse, mouse_start, mouse_previous, reverse;
	var e2c = function(e){
		var rect = canvas.getBoundingClientRect();
		var cx = e.clientX - rect.left;
		var cy = e.clientY - rect.top;
		return {
			x: (cx / rect.width * canvas.width)|0,
			y: (cy / rect.height * canvas.height)|0,
		};
	};
	var tool_go = function(){
		if(selected_tool.shape){
			var previous_canvas = undos[undos.length-1];
			if(previous_canvas){
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.drawImage(previous_canvas,0,0);
			}
			if(reverse){
				ctx.fillStyle = color1;
				ctx.strokeStyle = color2;
			}else{
				ctx.fillStyle = color2;
				ctx.strokeStyle = color1;
			}
			ctx.beginPath();
			selected_tool.shape(ctx, mouse_start.x, mouse_start.y, mouse.x-mouse_start.x, mouse.y-mouse_start.y);
			ctx.fill();
			ctx.stroke();
		}
		if(selected_tool.paint){
			if(reverse){
				ctx.fillStyle = color2;
				ctx.strokeStyle = color2;
			}else{
				ctx.fillStyle = color1;
				ctx.strokeStyle = color1;
			}
			if(selected_tool.continuous){
				selected_tool.paint(ctx, mouse.x, mouse.y);
			}else{
				selected_tool.paint(ctx, mouse.x, mouse.y);
			}
		}
	};
	var canvas_mouse_move = function(e){
		mouse = e2c(e);
		tool_go();
		mouse_previous = mouse;
	};
	$canvas.on("mousedown",function(e){
		if(e.button === 0){
			reverse = false;
		}else if(e.button === 2){
			reverse = true;
		}else{
			return false;
		}
		
		if(selected_tool.shape || selected_tool.paint){
			undoable();
		}
		mouse_start = mouse = e2c(e);
		if(selected_tool.paint){
			tool_go();
		}
		
		$canvas.on("mousemove", canvas_mouse_move);
		if(selected_tool.continuous === "time"){
			var iid = setInterval(function(){
				tool_go();
			},10);
		}
		$(window).one("mouseup", function(e){
			$canvas.off("mousemove",canvas_mouse_move);
			if(iid){
				clearInterval(iid);
			}
		});
	});
	
	
	
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
		update_colors();
		
		return $Component("Colors", "wide", $cb);
		
		function update_colors(){
			if(color3 !== "transparent"){
				$current_colors.css({background:color3});
			}
			$color1.css({background:color1});
			$color2.css({background:color2});
		}
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