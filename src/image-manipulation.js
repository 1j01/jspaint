
function render_brush(ctx, shape, size){
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
}

function draw_ellipse(ctx, x, y, w, h, stroke, fill){
	
	var stroke_color = ctx.strokeStyle;
	var fill_color = ctx.fillStyle;
	
	var cx = x + w/2;
	var cy = y + h/2;
	
	if(aliasing){
		// @TODO: use proper raster ellipse algorithm
		
		var r1 = Math.round;
		var r2 = Math.round;
		
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
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }
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
		// @TODO: use proper raster rounded rectangle algorithm
		
		var iw = width - radius*2;
		var ih = height - radius*2;
		var ix = x + radius;
		var iy = y + radius;
		
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

function draw_line(ctx, x1, y1, x2, y2, stroke_size){
	stroke_size = stroke_size || 1;
	if(aliasing){
		if(stroke_size > 1){
			var csz = stroke_size * 2.1; // XXX: magic constant duplicated from tools.js
			var brush_canvas = new Canvas(csz, csz);
			brush_canvas.width = csz;
			brush_canvas.height = csz;
			brush_canvas.ctx.fillStyle = brush_canvas.ctx.strokeStyle = stroke_color;
			render_brush(brush_canvas.ctx, "circle", stroke_size);
			bresenham_line(x1, y1, x2, y2, function(x, y){
				ctx.drawImage(brush_canvas, ~~(x - brush_canvas.width/2), ~~(y - brush_canvas.height/2));
			});
		}else{
			bresenham_line(x1, y1, x2, y2, function(x, y){
				ctx.fillRect(x, y, 1, 1);
			});
		}
	}else{
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		
		ctx.lineWidth = stroke_size;
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
	// Bresenham's line argorithm with a callback between going horizontal and vertical
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
	
	// TODO: split up processing in case it takes too long?
	// progress bar and abort button (outside of image-manipulation.js)
	// or at least just free up the main thread every once in a while
	// TODO: speed up with typed arrays? https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
	// could avoid endianness issues if only copying colors
	// the jsperf only shows ~15% improvement
	// maybe do something fancier like special-casing large chunks of single-color image
	// (octree? or just have a higher level stack of chunks to fill and check at if a chunk is homogeneous)

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
		while(matches_start_color(pixel_pos)){
			y--;
			pixel_pos = (y*c_width + x) * 4;
		}
		reach_left = false;
		reach_right = false;
		while(true){
			y++;
			pixel_pos = (y*c_width + x) * 4;
			
			if(!(y < c_height && matches_start_color(pixel_pos))){
				break;
			}
			
			color_pixel(pixel_pos);

			if(x > 0){
				if(matches_start_color(pixel_pos - 4)){
					if(!reach_left){
						stack.push([x - 1, y]);
						reach_left = true;
					}
				}else if(reach_left){
					reach_left = false;
				}
			}

			if(x < c_width-1){
				if(matches_start_color(pixel_pos + 4)){
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

	function matches_start_color(pixel_pos){
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

function draw_noncontiguous_fill(ctx, x, y, fill_r, fill_g, fill_b, fill_a){
	
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
	
	for(var i=0; i<id.data.length; i+=4){
		if(matches_start_color(i)){
			color_pixel(i);
		}
	}
	
	ctx.putImageData(id, 0, 0);

	function matches_start_color(pixel_pos){
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
	var original_canvas = selection ? selection.source_canvas: canvas;
	
	var new_canvas = new Canvas(original_canvas.width, original_canvas.height);

	var original_ctx = original_canvas.getContext("2d");
	var new_ctx = new_canvas.getContext("2d");

	fn(original_canvas, original_ctx, new_canvas, new_ctx);
	
	if(selection){
		selection.replace_source_canvas(new_canvas);
	}else{
		undoable(0, function(){
			this_ones_a_frame_changer();
			
			ctx.copy(new_canvas);
			
			$canvas.trigger("update"); // update handles
		});
	}
}

function flip_horizontal(){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		new_ctx.translate(new_canvas.width, 0);
		new_ctx.scale(-1, 1);
		new_ctx.drawImage(original_canvas, 0, 0);
	});
}

function flip_vertical(){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		new_ctx.translate(0, new_canvas.height);
		new_ctx.scale(1, -1);
		new_ctx.drawImage(original_canvas, 0, 0);
	});
}

function rotate(angle){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		new_ctx.save();
		switch(angle){
			case TAU / 4:
			case TAU * -3/4:
				new_canvas.width = original_canvas.height;
				new_canvas.height = original_canvas.width;
				new_ctx.disable_image_smoothing();
				new_ctx.translate(new_canvas.width, 0);
				new_ctx.rotate(TAU / 4);
				break;
			case TAU / 2:
			case TAU / -2:
				new_ctx.translate(new_canvas.width, new_canvas.height);
				new_ctx.rotate(TAU / 2);
				break;
			case TAU * 3/4:
			case TAU / -4:
				new_canvas.width = original_canvas.height;
				new_canvas.height = original_canvas.width;
				new_ctx.disable_image_smoothing();
				new_ctx.translate(0, new_canvas.height);
				new_ctx.rotate(TAU / -4);
				break;
			default:
				var w = original_canvas.width;
				var h = original_canvas.height;
				
				var bb_min_x = +Infinity;
				var bb_max_x = -Infinity;
				var bb_min_y = +Infinity;
				var bb_max_y = -Infinity;
				var corner = function(x01, y01){
					var x = Math.sin(-angle)*h*x01 + Math.cos(+angle)*w*y01;
					var y = Math.sin(+angle)*w*y01 + Math.cos(-angle)*h*x01;
					bb_min_x = Math.min(bb_min_x, x);
					bb_max_x = Math.max(bb_max_x, x);
					bb_min_y = Math.min(bb_min_y, y);
					bb_max_y = Math.max(bb_max_y, y);
				};
				
				corner(0, 0);
				corner(0, 1);
				corner(1, 0);
				corner(1, 1);
				
				var bb_x = bb_min_x;
				var bb_y = bb_min_y;
				var bb_w = bb_max_x - bb_min_x;
				var bb_h = bb_max_y - bb_min_y;
				
				new_canvas.width = bb_w;
				new_canvas.height = bb_h;
				new_ctx.disable_image_smoothing();
				
				if(!transparency){
					new_ctx.fillStyle = colors.background;
					new_ctx.fillRect(0, 0, new_canvas.width, new_canvas.height);
				}
				
				new_ctx.translate(-bb_x,-bb_y);
				new_ctx.rotate(angle);
				new_ctx.drawImage(original_canvas, 0, 0, w, h);
				break;
		}
		new_ctx.drawImage(original_canvas, 0, 0);
		new_ctx.restore();
	});
}

function stretch_and_skew(xscale, yscale, hsa, vsa){
	apply_image_transformation(function(original_canvas, original_ctx, new_canvas, new_ctx){
		var w = original_canvas.width * xscale;
		var h = original_canvas.height * yscale;
		
		var bb_min_x = +Infinity;
		var bb_max_x = -Infinity;
		var bb_min_y = +Infinity;
		var bb_max_y = -Infinity;
		var corner = function(x01, y01){
			var x = Math.tan(hsa)*h*x01 + w*y01;
			var y = Math.tan(vsa)*w*y01 + h*x01;
			bb_min_x = Math.min(bb_min_x, x);
			bb_max_x = Math.max(bb_max_x, x);
			bb_min_y = Math.min(bb_min_y, y);
			bb_max_y = Math.max(bb_max_y, y);
		};
		
		corner(0, 0);
		corner(0, 1);
		corner(1, 0);
		corner(1, 1);
		
		var bb_x = bb_min_x;
		var bb_y = bb_min_y;
		var bb_w = bb_max_x - bb_min_x;
		var bb_h = bb_max_y - bb_min_y;
		
		new_canvas.width = bb_w;
		new_canvas.height = bb_h;
		new_ctx.disable_image_smoothing();
		
		if(!transparency){
			new_ctx.fillStyle = colors.background;
			new_ctx.fillRect(0, 0, new_canvas.width, new_canvas.height);
		}
		
		new_ctx.save();
		new_ctx.transform(
			1, // x scale
			Math.tan(vsa), // vertical skew (skewY)
			Math.tan(hsa), // horizontal skew (skewX)
			1, // y scale
			-bb_x, // x translation
			-bb_y // y translation
		);
		new_ctx.drawImage(original_canvas, 0, 0, w, h);
		new_ctx.restore();
	});
}

function cut_polygon(points, x_min, y_min, x_max, y_max, from_canvas){
	// Cut out the polygon given by points bounded by x/y_min/max from from_canvas
	
	from_canvas = from_canvas || canvas;
	
	var X_MIN = x_min; // || 0;
	var X_MAX = x_max; // || canvas.width;
	var Y_MIN = y_min; // || 0;
	var Y_MAX = y_max; // || canvas.height;
	var WIDTH = X_MAX - X_MIN;
	var HEIGHT = Y_MAX - Y_MIN;
	
	var cutout = new Canvas(WIDTH, HEIGHT);
	
	// Take image data from source canvas context
	var id_src = from_canvas.ctx.getImageData(X_MIN, Y_MIN, WIDTH, HEIGHT);
	// Create image data to draw the polygon onto
	var id_dest = cutout.ctx.createImageData(WIDTH, HEIGHT);
	
	// Loosely based off of some public-domain code by Darel Rex Finley, 2007
	
	var nodes; // length of the nodeX array
	var nodeX = new Array(points.length);
	var swap;
	var i, j;
	//var edge_points = [];
	
	// Loop through the rows of the image.
	for(var y = Y_MIN; y < Y_MAX; y++){
		
		// Build a list of nodes.
		// (In this context, "nodes" are one-dimensional points of intersection)
		// (Also, `nodes` is treated as the length of the nodeX array)
		nodes = 0;
		j = points.length - 1;
		for(i = 0; i < points.length; i++){
			if(
				points[i].y < y && points[j].y >= y ||
				points[j].y < y && points[i].y >= y
			){
				nodeX[nodes++] =
					points[i].x +
					(y - points[i].y) /
					(points[j].y - points[i].y) *
					(points[j].x - points[i].x);
			}
			j = i;
		}

		// Sort the nodes, via a simple “Bubble” sort.
		i = 0;
		while(i < nodes-1){
			if(nodeX[i] > nodeX[i+1]){
				swap = nodeX[i];
				nodeX[i] = nodeX[i+1];
				nodeX[i+1] = swap;
				if(i){ i--; }
			}else{
				i++;
			}
		}
		// Browsers optimize sorting numbers, so just use Array::sort
		/*nodeX.sort(function(a, b){
			return a - b;
		});*/
		// But this array can contain undefineds [citation needed]
		// It's not defined by its length but by the variable `nodes`
		
		
		// Fill the pixels between node pairs.
		for(i = 0; i < nodes; i += 2){
			if(nodeX[i+0] >= X_MAX) break;
			if(nodeX[i+1] > X_MIN){
				if(nodeX[i+0] < X_MIN) nodeX[i+0] = X_MIN;
				if(nodeX[i+1] > X_MAX) nodeX[i+1] = X_MAX;
				for(var x = nodeX[i]; x < nodeX[i+1]; x++){
					// fill pixel at (x, y)
					var idi = ((y-Y_MIN)*WIDTH + ~~(x-X_MIN))*4;
					id_dest.data[idi+0] = id_src.data[idi+0];
					id_dest.data[idi+1] = id_src.data[idi+1];
					id_dest.data[idi+2] = id_src.data[idi+2];
					id_dest.data[idi+3] = id_src.data[idi+3];
				}
				//edge_points.push({x: nodeX[i+0], y: y});
				//edge_points.push({x: nodeX[i+1], y: y});
			}
		}
	}
	
	// Done boom okay
	cutout.ctx.putImageData(id_dest, 0, 0);
	//cutout.edge_points = edge_points;
	return cutout;
	
}
