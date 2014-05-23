
var brush_canvas = E("canvas");
var brush_ctx = brush_canvas.getContext("2d");
var brush_shape = "circle";
var brush_size = 5;
var eraser_size = 8;
var airbrush_size = 9;
var pencil_size = 1;
var stroke_size = 1; // lines, curves, shape outlines

var render_brush = function(ctx, shape, size){
	if(shape === "circle"){
		size /= 2;
		size += 0.25;
	}else if(shape.match(/diagonal/)){
		size -= 0.4;
	}
	
	var mid_x = ctx.canvas.width / 2;
	var left = ~~(mid_x - size/2);
	var right = ~~(mid_x + size/2);
	var mid_y = ctx.canvas.height / 2;
	var top = ~~(mid_y - size/2);
	var bottom = ~~(mid_y + size/2);
	
	if(shape === "circle"){
		draw_ellipse(ctx, left, top, size, size);
	}else if(shape === "square"){
		ctx.fillRect(left, top, ~~size, ~~size);
	}else if(shape === "diagonal"){
		draw_line(ctx, left, top, right, bottom);
	}else if(shape === "reverse_diagonal"){
		draw_line(ctx, left, bottom, right, top);
	}else if(shape === "horizontal"){
		draw_line(ctx, left, mid_y, size, mid_y);
	}else if(shape === "vertical"){
		draw_line(ctx, mid_x, top, mid_x, size);
	}
};

var $Choose = function(things, display, choose, is_chosen){
	var $div = $(E("div"));
	$div.on("update", function(){
		$div.empty();
		for(var i=0; i<things.length; i++){
			(function(thing){
				var $option_container = $(E("div")).appendTo($div);
				var $option = $();
				var choose_thing = function(){
					choose(thing);
					$div.children().trigger("redraw");
					update();
				}
				var update = function(){
					$option_container.css({
						backgroundColor: is_chosen(thing) ? "rgb(0, 0, 123)" : ""
					});
					$option_container.empty();
					$option = $(display(thing, is_chosen(thing)));
					$option.appendTo($option_container);
				};
				update();
				$option_container.on("redraw", update);
				
				$option_container.on("mousedown click", choose_thing);
				$div.on("mousedown", function(){
					$option_container.on("mouseenter", choose_thing);
				});
				$(window).on("mouseup", function(){
					$option_container.off("mouseenter", choose_thing);
				});
				
			})(things[i]);
		}
	});
	return $div;
};
var $ChooseShapeStyle = function(){
	return $Choose(
		[
			[1, 0], [1, 1], [0, 1]
		],
		function(a, is_chosen){
			var canvas = E("canvas");
			var ctx = canvas.getContext("2d");
			
			canvas.width = 39;
			canvas.height = 21;
			var b = 5;
			
			ctx.fillStyle = is_chosen ? "#fff" : "#000";
			
			if(a[0]){
				ctx.fillRect(b, b, canvas.width-b*2, canvas.height-b*2);
			}
			b++;
			ctx.fillStyle = "#777";
			if(a[1]){
				if(!a[1]){
					b--;
				}
				ctx.fillRect(b, b, canvas.width-b*2, canvas.height-b*2);
			}else{
				ctx.clearRect(b, b, canvas.width-b*2, canvas.height-b*2);
			}
			
			return canvas;
		},
		function(a){
			alert("Shape styles are not yet supported.");
		},
		function(a){
			return a[1] && a[0];
		}
	).addClass("jspaint-choose-shape-style");
};

var $choose_brush = $Choose(
	(function(){
		var brush_shapes = ["circle", "square", "reverse_diagonal", "diagonal"];
		var brush_sizes = [8, 5, 2];
		var things = [];
		for(var brush_shape_i in brush_shapes){
			for(var brush_size_i in brush_sizes){
				things.push({
					shape: brush_shapes[brush_shape_i],
					size: brush_sizes[brush_size_i],
				});
			}
		}
		return things;
	})(), 
	function(o, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		var shape = o.shape;
		var size = o.size;
		if(shape === "circle"){
			size -= 1;
		}
		
		canvas.width = canvas.height = 10;
		
		ctx.fillStyle = ctx.strokeStyle = is_chosen ? "#fff" : "#000";
		render_brush(ctx, shape, size);
		
		return canvas;
	},
	function(o){
		brush_shape = o.shape;
		brush_size = o.size;
	},
	function(o){
		return brush_shape === o.shape && brush_size === o.size;
	}
).addClass("jspaint-choose-brush");

var $choose_eraser_size = $Choose(
	[4, 6, 8, 10],
	function(size, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		canvas.width = 39;
		canvas.height = 16;
		
		ctx.fillStyle = is_chosen ? "#fff" : "#000";
		render_brush(ctx, "square", size);
		
		return canvas;
	},
	function(size){
		eraser_size = size;
	},
	function(size){
		return eraser_size === size;
	}
).addClass("jspaint-choose-eraser");

var $choose_stroke_size = $Choose(
	[1, 2, 3, 4, 5],
	function(size, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		canvas.width = 39;
		canvas.height = 12;
		
		ctx.fillStyle = is_chosen ? "#fff" : "#000";
		ctx.fillRect(5, ~~((canvas.height-size)/2), canvas.width-5-5, size);
		
		return canvas;
	},
	function(size){
		stroke_size = size;
	},
	function(size){
		return stroke_size === size;
	}
).addClass("jspaint-choose-stroke-size");

var $choose_magnification = $Choose(
	[1, 2, 6, 8/*, 10*/],
	function(size, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		canvas.width = 39;
		canvas.height = 12;
		
		ctx.fillStyle = is_chosen ? "#fff" : "#000";
		
		ctx.translate(5, 0);
		render_brush(ctx, "square", size);
		
		ctx.textBaseline = "middle";
		ctx.textAlign = "right";
		ctx.fillText(size+"x", 10, canvas.height/2);
		
		return canvas;
	},
	function(size){
		alert("Magnification is not yet supported.");
	},
	function(size){
		return size === 1;
	}
).addClass("jspaint-choose-magnification");

var airbrush_sizes = [9, 16, 24];
var $choose_airbrush_size = $Choose(
	airbrush_sizes,
	function(size, is_chosen){
		var e = E("div");
		var sprite_width = 72;
		var pos = airbrush_sizes.indexOf(size) / airbrush_sizes.length * -sprite_width;
		var is_bottom = size === 24;
		var _ = 4 * !is_bottom;
		$(e).css({
			backgroundImage: "url(images/options-airbrush-size.png)",
			backgroundPosition: pos - _  + "px 0px",
			width: (72 / 3 - _*2) + "px",
			height: "23px",
			webkitFilter: is_chosen ? "invert()" : "" // @todo: invert and upscale with canvas
		});
		return e;
	},
	function(size){
		airbrush_size = size;
	},
	function(size){
		return size === airbrush_size;
	}
).addClass("jspaint-choose-airbrush-size");

var $choose_transparency = $Choose(
	["opaque", "transparent"],
	function(t_o, is_chosen){
		var e = E("div");
		$(e).css({
			backgroundImage: "url(images/options-transparency.png)",
			backgroundPosition: "0px "+(t_o === "opaque" ? 0 : 23)+"px",
			width: "35px",
			height: "23px"
		});
		return e;
	},
	function(t_o){
		alert("Transparency is not yet supported.");
	},
	function(t_o){
		return t_o === "opaque";
	}
).addClass("jspaint-choose-transparency");

tools = [{
	name: "Free-Form Select",
	description: "Selects a free-form part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	implemented: false,
	$options: $choose_transparency
}, {
	name: "Select",
	description: "Selects a rectangular part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	mousedown: function(){
		if(selection){
			selection.draw();
			selection.destroy();
		}
		var mouse_has_moved = false;
		$G.one("mousemove", function(){
			mouse_has_moved = true;
		});
		$G.one("mouseup", function(){
			if(!mouse_has_moved && selection){
				selection.draw();
				selection.destroy();
				selection = null;
			}
		});
		selection = new Selection(mouse.x, mouse.y, 1, 1);
	},
	paint: function(){
		if(!selection){return;}
		selection.w = selection.x - mouse.x;
		selection.h = selection.y - mouse.y;
		var x1 = Math.max(0, Math.min(selection.x, mouse.x));
		var y1 = Math.max(0, Math.min(selection.y, mouse.y));
		var x2 = Math.min(canvas.width, Math.max(selection.x, mouse.x));
		var y2 = Math.min(canvas.height, Math.max(selection.y, mouse.y));
		selection._x = x1;
		selection._y = y1;
		selection._w = Math.max(1, x2 - x1);
		selection._h = Math.max(1, y2 - y1);
		selection.position();
	},
	mouseup: function(){
		if(!selection){return;}
		
		selection.instantiate();
		if(ctrl){
			selection.crop();
			deselect();
		}
	},
	cancel: function(){
		if(!selection){return;}
		selection.destroy();
		selection = null;
	},
	$options: $choose_transparency
}, {
	name: "Eraser/Color Eraser",
	description: "Erases a portion of the picture, using the selected eraser shape.",
	continuous: "space",
	cursor: ["precise", [16, 16], "crosshair"], //@todo: draw square on canvas
	implemented: "partially",
	paint: function(ctx, x, y){
		if(transparency){
			ctx.clearRect(~~(x-eraser_size/2), ~~(y-eraser_size/2), eraser_size, eraser_size);
		}else{
			ctx.fillStyle = colors[1];
			ctx.fillRect(~~(x-eraser_size/2), ~~(y-eraser_size/2), eraser_size, eraser_size);
		}
	},
	$options: $choose_eraser_size
}, {
	name: "Fill With Color",
	description: "Fills an area with the selected drawing color.",
	cursor: ["fill-bucket", [8, 22], "crosshair"],
	mousedown: function(ctx, x, y){
		var _c = E("canvas");
		_c.width = _c.height = 1;
		var _ctx = _c.getContext("2d");
		_ctx.fillStyle = fill_color;
		_ctx.fillRect(0, 0, 1, 1);
		var _id = _ctx.getImageData(0, 0, 1, 1);
		var fill_r = _id.data[0];
		var fill_g = _id.data[1];
		var fill_b = _id.data[2];
		
		var stack = [[x, y]];
		var c_width = canvas.width;
		var c_height = canvas.height;
		var id = ctx.getImageData(0, 0, c_width, c_height);
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
}, {
	name: "Pick Color",
	description: "Picks up a color from the picture for drawing.",
	cursor: ["eye-dropper", [9, 22], "crosshair"],
	deselect: true,
	passive: true,
	
	current_color: "",
	display_current_color: function(){
		this.$options.css({
			background: this.current_color
		});
	},
	mousedown: function(){
		var _this = this;
		$G.one("mouseup", function(){
			_this.$options.css({
				background: ""
			});
		});
	},
	paint: function(ctx, x, y){
		if(x >= 0 && y >= 0 && x < canvas.width && y < canvas.height){
			var id = ctx.getImageData(~~x, ~~y, 1, 1);
			var r = id.data[0];
			var g = id.data[1];
			var b = id.data[2];
			var a = id.data[3];
			this.current_color = "rgba("+r+","+g+","+b+","+a/255+")";
		}else{
			this.current_color = "white";
		}
		this.display_current_color();
	},
	mouseup: function(){
		colors[fill_color_i] = this.current_color;
		$colorbox && $colorbox.update_colors();
	},
	$options: $(E("div"))
}, {
	name: "Magnifier",
	description: "Changes the magnification.",
	cursor: ["magnifier", [16, 16], "zoom-in"], //@todo: use zoom-in/zoom-out
	deselect: true,
	passive: true,
	implemented: false,
	$options: $choose_magnification
}, {
	name: "Pencil",
	description: "Draws a free-form line one pixel wide.",
	cursor: ["pencil", [13, 23], "crosshair"],
	continuous: "space",
	stroke_only: true,
	paint: function(ctx, x, y){
		ctx.fillRect(x, y, 1, 1);
	}
}, {
	name: "Brush",
	description: "Draws using a brush with the selected shape and size.",
	cursor: ["precise-dotted", [16, 16], "crosshair"],
	continuous: "space",
	rendered_color: "",
	rendered_size: 0,
	rendered_shape: "",
	paint: function(ctx, x, y){
		var csz = brush_size * (brush_shape === "circle" ? 2.1 : 1);
		if(this.rendered_shape !== brush_shape || this.rendered_color !== stroke_color || this.rendered_size !== brush_size){
			brush_canvas.width = csz;
			brush_canvas.height = csz;

			brush_ctx.fillStyle = brush_ctx.strokeStyle = stroke_color;
			render_brush(brush_ctx, brush_shape, brush_size);
			
			this.rendered_color = stroke_color;
			this.rendered_size = brush_size;
			this.rendered_shape = brush_shape;
		}
		ctx.drawImage(brush_canvas, ~~(x-csz/2), ~~(y-csz/2));
	},
	$options: $choose_brush
}, {
	name: "Airbrush",
	description: "Draws using an airbrush of the selected size.",
	cursor: ["airbrush", [7, 22], "crosshair"],
	continuous: "time",
	paint: function(ctx, x, y){
		var r = airbrush_size / 2;
		for(var i = 0; i < 6 + r/5; i++){
			var rx = (Math.random()*2-1) * r;
			var ry = (Math.random()*2-1) * r;
			var d = rx*rx + ry*ry;
			if(d <= r * r){
				ctx.fillRect(x + ~~rx, y + ~~ry, 1, 1);
			}
		}
	},
	$options: $choose_airbrush_size
}, {
	name: "Text",
	description: "Inserts text into the picture.",
	cursor: ["precise", [16, 16], "crosshair"],
	implemented: false,
	$options: $choose_transparency
}, {
	name: "Line",
	description: "Draws a straight line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	shape: function(ctx, x, y, w, h){
		draw_line(ctx, x, y, x+w, y+h);
	},
	$options: $choose_stroke_size
}, {
	name: "Curve",
	description: "Draws a curved line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	implemented: false,
	$options: $choose_stroke_size
}, {
	name: "Rectangle",
	description: "Draws a rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		ctx.beginPath();
		ctx.rect(x-0.5, y-0.5, w, h);
		ctx.fill();
		ctx.stroke();
	},
	$options: $ChooseShapeStyle()
}, {
	name: "Polygon",
	description: "Draws a polygon with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	implemented: false,
	$options: $ChooseShapeStyle()
}, {
	name: "Ellipse",
	description: "Draws an ellipse with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: draw_ellipse,
	$options: $ChooseShapeStyle()
}, {
	name: "Rounded Rectangle",
	description: "Draws a rounded rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(w<0){ x+=w; w=-w; }
		if(h<0){ y+=h; h=-h; }
		var radius = Math.min(7, w/2, h/2);
		
		draw_rounded_rectangle(ctx, x, y, w, h, radius);
	},
	$options: $ChooseShapeStyle()
}];
