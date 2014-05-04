
var brush_image = new Image();
brush_image.src = "images/scroll-left.png";
var brush_canvas = E("canvas");
var brush_ctx = brush_canvas.getContext("2d");
var brush_rendered_color;

tools = [{
	name: "Free-Form Select",
	description: "Selects a free-form part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	implemented: false,
}, {
	name: "Select",
	description: "Selects a rectangular part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	implemented: "kinda",
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
		var s = selection = new Selection(mouse.x, mouse.y, 1, 1);
		$canvas.one("mousedown", function(){
			if(selection === s){
				selection.draw();
				selection.destroy();
				selection = null;
			}
		});
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
}, {
	name: "Eraser/Color Eraser",
	description: "Erases a portion of the picture, using the selected eraser shape.",
	continuous: "space",
	cursor: ["precise", [16, 16], "crosshair"], //@todo: draw square on canvas
	implemented: "partially",
	paint: function(ctx, x, y){
		ctx.fillStyle = colors[1];
		ctx.fillRect(x-4, y-4, 8, 8);
	}
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
		$tool_options_area.css({
			background: this.current_color
		});
	},
	mousedown: function(){
		$G.one("mouseup", function(){
			$tool_options_area.css({
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
	}
}, {
	name: "Magnifier",
	description: "Changes the magnification.",
	cursor: ["magnifier", [16, 16], "zoom-in"], //@todo: use zoom-in/zoom-out
	deselect: true,
	passive: true,
	implemented: false,
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
	paint: function(ctx, x, y){
		var sz = 16;
		if(brush_rendered_color !== stroke_color){
			brush_canvas.width = sz;
			brush_canvas.height = sz;
			brush_ctx.clearRect(0, 0, sz, sz);
			brush_ctx.drawImage(brush_image, sz/2-brush_image.width/2, sz/2-brush_image.height/2);
			brush_ctx.globalCompositeOperation = "source-atop";
			brush_ctx.fillStyle = stroke_color;
			brush_ctx.fillRect(0, 0, sz, sz);
			brush_ctx.globalCompositeOperation = "source-over";
			
			brush_rendered_color = stroke_color;
		}
		ctx.drawImage(brush_canvas, x-sz/2, y-sz/2);
	}
}, {
	name: "Airbrush",
	description: "Draws using an airbrush of the selected size.",
	cursor: ["airbrush", [7, 22], "crosshair"],
	continuous: "time",
	paint: function(ctx, x, y){
		var radius = 15; //@todo: options
		var sqr = radius * radius;
		for(var i=0; i<100; i++){
			var rx = (Math.random()*2-1)*radius;
			var ry = (Math.random()*2-1)*radius;
			var d = rx*rx + ry*ry;
			if(d <= radius){
				ctx.fillRect(x + ~~rx, y + ~~ry, 1, 1);
			}
		}
	}
}, {
	name: "Text",
	description: "Inserts text into the picture.",
	cursor: ["precise", [16, 16], "crosshair"],
	implemented: false,
}, {
	name: "Line",
	description: "Draws a straight line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	shape: function(ctx, x, y, w, h){
		draw_line(ctx, x, y, x+w, y+h);
	}
}, {
	name: "Curve",
	description: "Draws a curved line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	implemented: false,
}, {
	name: "Rectangle",
	description: "Draws a rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		ctx.beginPath();
		ctx.rect(x-0.5, y-0.5, w, h);
		ctx.fill();
		ctx.stroke();
	}
}, {
	name: "Polygon",
	description: "Draws a polygon with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	implemented: false,
}, {
	name: "Ellipse",
	description: "Draws an ellipse with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: draw_ellipse
}, {
	name: "Rounded Rectangle",
	description: "Draws a rounded rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(w<0){ x+=w; w=-w; }
		if(h<0){ y+=h; h=-h; }
		var radius = Math.min(7, w/2, h/2);
		
		draw_rounded_rectangle(ctx, x, y, w, h, radius);
	}
}];
