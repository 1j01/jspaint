
function draw_ellipse(ctx, x, y, w, h, stroke, fill){
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	var r1 = Math.round;
	var r2 = Math.round;
	
	var cx = x + w/2;
	var cy = y + h/2;
	
	if(aliasing){
		ctx.fillStyle = stroke_color;
		for(var r=0; r<TAU; r+=0.01){
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
		ctx.fillStyle = fill_color;
		for(var r=0; r<TAU; r+=0.01){
			var rx = Math.cos(r) * w/2;
			var ry = Math.sin(r) * h/2;
			ctx.fillRect(
				r1(cx+rx),
				r1(cy+ry),
				r2(-rx*2),
				r2(-ry*2)
			);
		}
	}else{
		if(w<0){ x+=w; w=-w; }
		if(h<0){ y+=h; h=-h; }
		ctx.beginPath();
		ctx.ellipse(cx, cy, w/2, h/2, 0, TAU, false);
		ctx.stroke();
		ctx.fill();
	}
}
function draw_rounded_rectangle(ctx, x, y, width, height, radius){
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	if(aliasing){
		var iw = width - radius*2;
		var ih = height - radius*2;
		var ix = x+radius;
		var iy = y+radius;
		
		var r1 = Math.round;
		var r2 = Math.round;
		
		ctx.fillStyle = stroke_color;
		for(var r=0; r<TAU; r+=0.05){
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
		ctx.fillStyle = fill_color;
		for(var r=0; r<TAU; r+=0.05){
			var rx = Math.cos(r) * radius;
			var ry = Math.sin(r) * radius;
			ctx.fillRect(
				r1(ix+rx),
				r1(iy+ry),
				r2(iw-rx*2),
				r2(ih-ry*2)
			);
		}
	}else{
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}
}
function draw_line(ctx, x1, y1, x2, y2){
	if(aliasing){
		bresenham_line(x1, y1, x2, y2, function(x, y){
			ctx.fillRect(x, y, 1, 1);
		});
	}else{
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		
		ctx.lineCap = "round";
		ctx.stroke();
		ctx.lineCap = "butt";
	}
}
function bresenham_line(x1, y1, x2, y2, callback){
	// Bresenham's line algorithm
	x1=~~x1, x2=~~x2, y1=~~y1, y2=~~y2;
	
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
function brosandham_line(x1, y1, x2, y2, callback){
	// Bresenham's line algorithm modified to callback in-between going horizontal and vertical
	x1=~~x1, x2=~~x2, y1=~~y1, y2=~~y2;
	
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
		callback(x1, y1);
		if(e2 < dx){ err += dx; y1 += sy; }
	}
}
function draw_fill(ctx, x, y, fill_r, fill_g, fill_b, fill_a){
	
	var stack = [[x, y]];
	var c_width = canvas.width;
	var c_height = canvas.height;
	var id = ctx.getImageData(0, 0, c_width, c_height);
	pixel_pos = (y*c_width + x) * 4;
	var start_r = id.data[pixel_pos+0];
	var start_g = id.data[pixel_pos+1];
	var start_b = id.data[pixel_pos+2];
	var start_a = id.data[pixel_pos+3];
	
	if(
		fill_r === start_r &&
		fill_g === start_g &&
		fill_b === start_b &&
		fill_a === start_a
	){
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
		return (
			id.data[pixel_pos+0] === start_r &&
			id.data[pixel_pos+1] === start_g &&
			id.data[pixel_pos+2] === start_b &&
			id.data[pixel_pos+3] === start_a
		);
	}

	function color_pixel(pixel_pos){
		id.data[pixel_pos+0] = fill_r;
		id.data[pixel_pos+1] = fill_g;
		id.data[pixel_pos+2] = fill_b;
		id.data[pixel_pos+3] = fill_a;
	}
}

function apply_image_transformation(fn){
	// Apply an image transformation function to either the selection or the entire canvas
	var new_canvas = E("canvas");
	var original_canvas =
		selection? selection.
		canvas: canvas;
	
	// sometimes selection.canvas is an Image
	// maybe that should be changed instead having of this
	if(!original_canvas.getContext){
		var _c = E("canvas");
		_c.width = original_canvas.width;
		_c.height = original_canvas.height;
		var _ctx = _c.getContext("2d");
		_ctx.drawImage(original_canvas, 0, 0);
		original_canvas = _c;
	}
	
	var new_ctx = new_canvas.getContext("2d");
	var original_ctx = original_canvas.getContext("2d");
	
	new_canvas.width = original_canvas.width;
	new_canvas.height = original_canvas.height;
	
	fn(original_canvas, original_ctx, new_canvas, new_ctx);
	
	if(selection){
		selection.replace_canvas(new_canvas);
	}else{
		undoable(0, function(){
			this_ones_a_frame_changer();
			
			canvas.width = new_canvas.width;
			canvas.height = new_canvas.height;
			
			ctx.drawImage(new_canvas, 0, 0);
			
			$canvas.trigger("update"); // update handles
		});
	}
}

