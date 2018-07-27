
function get_brush_canvas_size(brush_size, brush_shape){
	// brush_shape optional, only matters if it's circle
	// TODO: does it actually still matter? the ellipse drawing code has changed
	
	// round to nearest even number in order for the canvas to be drawn centered at a point reasonably
	return Math.ceil(brush_size * (brush_shape === "circle" ? 2.1 : 1) / 2) * 2;
}
function render_brush(ctx, shape, size){
	// USAGE NOTE: must be called outside of any other usage of op_canvas (because of draw_ellipse)
	if(shape.match(/diagonal/)){
		size -= 0.4;
	}
	
	var mid_x = Math.round(ctx.canvas.width / 2);
	var left = Math.round(mid_x - size/2);
	var right = Math.round(mid_x + size/2);
	var mid_y = Math.round(ctx.canvas.height / 2);
	var top = Math.round(mid_y - size/2);
	var bottom = Math.round(mid_y + size/2);
	
	if(shape === "circle"){
		// TODO: ideally _without_pattern_support
		draw_ellipse(ctx, left, top, size, size, false, true);
		// was useful for testing:
		// ctx.fillStyle = "red";
		// ctx.fillRect(mid_x, mid_y, 1, 1);
	}else if(shape === "square"){
		ctx.fillRect(left, top, ~~size, ~~size);
	}else if(shape === "diagonal"){
		draw_line_without_pattern_support(ctx, left, top, right, bottom);
	}else if(shape === "reverse_diagonal"){
		draw_line_without_pattern_support(ctx, left, bottom, right, top);
	}else if(shape === "horizontal"){
		draw_line_without_pattern_support(ctx, left, mid_y, size, mid_y);
	}else if(shape === "vertical"){
		draw_line_without_pattern_support(ctx, mid_x, top, mid_x, size);
	}
}

function draw_ellipse(ctx, x, y, w, h, stroke, fill){
	var center_x = x + w/2;
	var center_y = y + h/2;
	
	if(aliasing){
		var points = [];
		var step = 0.05;
		for(var theta = 0; theta < TAU; theta += step){
			points.push({
				x: center_x + Math.cos(theta) * w/2,
				y: center_y + Math.sin(theta) * h/2,
			});
		}
		draw_polygon(ctx, points, stroke, fill);
	}else{
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }
		ctx.beginPath();
		ctx.ellipse(center_x, center_y, w/2, h/2, 0, TAU, false);
		ctx.stroke();
		ctx.fill();
	}
}

function draw_rounded_rectangle(ctx, x, y, width, height, radius_x, radius_y, stroke, fill){
	
	if(aliasing){
		var points = [];
		var lineTo = (x, y)=> {
			points.push({x, y});
		};
		var arc = (x, y, radius_x, radius_y, startAngle, endAngle)=> {
			var step = 0.05;
			for(var theta = startAngle; theta < endAngle; theta += step){
				points.push({
					x: x + Math.cos(theta) * radius_x,
					y: y + Math.sin(theta) * radius_y,
				});
			}
			// not just doing `theta <= endAngle` above because that doesn't account for floating point rounding errors
			points.push({
				x: x + Math.cos(endAngle) * radius_x,
				y: y + Math.sin(endAngle) * radius_y,
			});
		};

		var x2 = x + width;
		var y2 = y + height;
		arc(x2 - radius_x, y + radius_y, radius_x, radius_y, TAU*3/4, TAU, false);
		lineTo(x2, y2 - radius_y);
		arc(x2 - radius_x, y2 - radius_y, radius_x, radius_y, 0, TAU*1/4, false);
		lineTo(x + radius_x, y2);
		arc(x + radius_x, y2 - radius_y, radius_x, radius_y, TAU*1/4, TAU*1/2, false);
		lineTo(x, y + radius_y);
		arc(x + radius_x, y + radius_y, radius_x, radius_y, TAU/2, TAU*3/4, false);

		draw_polygon(ctx, points, stroke, fill);
	}else{
		ctx.beginPath();
		ctx.moveTo(x + radius_x, y);
		ctx.lineTo(x + width - radius_x, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius_y);
		ctx.lineTo(x + width, y + height - radius_y);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius_x, y + height);
		ctx.lineTo(x + radius_x, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius_y);
		ctx.lineTo(x, y + radius_y);
		ctx.quadraticCurveTo(x, y, x + radius_x, y);
		ctx.closePath();
		if(stroke){
			ctx.stroke();
		}
		if(fill){
			ctx.fill();
		}
	}
}

var line_brush_canvas;
var line_brush_canvas_rendered_shape;
var line_brush_canvas_rendered_color;
var line_brush_canvas_rendered_size;
function update_brush_for_drawing_lines(stroke_size){
	// USAGE NOTE: must be called outside of any other usage of op_canvas (because of render_brush)
	if(aliasing && stroke_size > 1){
		// TODO: DRY brush caching code
		if(
			line_brush_canvas_rendered_shape !== "circle" ||
			line_brush_canvas_rendered_color !== stroke_color ||
			line_brush_canvas_rendered_size !== stroke_size
		){
			// don't need to do brush_ctx.disable_image_smoothing() currently because images aren't drawn to the brush
			var csz = get_brush_canvas_size(stroke_size, "circle");
			line_brush_canvas = new Canvas(csz, csz);
			line_brush_canvas.width = csz;
			line_brush_canvas.height = csz;
			line_brush_canvas.ctx.fillStyle = line_brush_canvas.ctx.strokeStyle = stroke_color;
			render_brush(line_brush_canvas.ctx, "circle", stroke_size);

			line_brush_canvas_rendered_shape = "circle";
			line_brush_canvas_rendered_color = stroke_color;
			line_brush_canvas_rendered_size = stroke_size;
		}
	}
}

function draw_line_without_pattern_support(ctx, x1, y1, x2, y2, stroke_size){
	stroke_size = stroke_size || 1;
	if(aliasing){
		if(stroke_size > 1){
			bresenham_line(x1, y1, x2, y2, function(x, y){
				ctx.drawImage(line_brush_canvas, ~~(x - line_brush_canvas.width/2), ~~(y - line_brush_canvas.height/2));
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

function replace_colors_with_swatch(ctx, swatch, x_offset_from_global_canvas, y_offset_from_global_canvas){
	// USAGE NOTE: Context MUST be untranslated! (for the rectangle to cover the exact area of the canvas, and presumably for the pattern alignment as well)
	// This function is mainly for patterns support (for black & white mode) but naturally handles solid colors as well.
	ctx.globalCompositeOperation = "source-in";
	ctx.fillStyle = swatch;
	ctx.beginPath();
	ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.save();
	ctx.translate(-x_offset_from_global_canvas, -y_offset_from_global_canvas);
	ctx.fill();
	ctx.restore();
}

// adapted from https://github.com/Pomax/bezierjs
function compute_bezier(t, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y){
	var mt = 1-t;
	var mt2 = mt*mt;
	var t2 = t*t;
	var a, b, c, d = 0;

	a = mt2*mt;
	b = mt2*t*3;
	c = mt*t2*3;
	d = t*t2;

	return {
		x: a*start_x + b*control_1_x + c*control_2_x + d*end_x,
		y: a*start_y + b*control_1_y + c*control_2_y + d*end_y
	};
}

function draw_bezier_curve_without_pattern_support(ctx, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y, stroke_size) {
	var steps = 100;
	var point_a = {x: start_x, y: start_y};
	for(var t=0; t<1; t+=1/steps){
		var point_b = compute_bezier(t, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y);
		// TODO: carry "error" from Bresenham line algorithm between iterations? and/or get a proper Bezier drawing algorithm
		draw_line_without_pattern_support(ctx, point_a.x, point_a.y, point_b.x, point_b.y, stroke_size);
		point_a = point_b;
	}
};
function draw_quadratic_curve(ctx, start_x, start_y, control_x, control_y, end_x, end_y, stroke_size) {
	draw_bezier_curve(ctx, start_x, start_y, control_x, control_y, control_x, control_y, end_x, end_y, stroke_size);
};

function draw_bezier_curve(ctx, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y, stroke_size) {
	// could calculate bounds of Bezier curve with something like bezier-js
	// but just using the control points should be fine
	var min_x = Math.min(start_x, control_1_x, control_2_x, end_x);
	var min_y = Math.min(start_y, control_1_y, control_2_y, end_y);
	var max_x = Math.max(start_x, control_1_x, control_2_x, end_x);
	var max_y = Math.max(start_y, control_1_y, control_2_y, end_y);
	draw_with_swatch(ctx, min_x, min_y, max_x, max_y, stroke_color, function(op_ctx_2d){
		draw_bezier_curve_without_pattern_support(op_ctx_2d, start_x, start_y, control_1_x, control_1_y, control_2_x, control_2_y, end_x, end_y, stroke_size);
	});
}
function draw_line(ctx, x1, y1, x2, y2, stroke_size){
	var min_x = Math.min(x1, x2);
	var min_y = Math.min(y1, y2);
	var max_x = Math.max(x1, x2);
	var max_y = Math.max(y1, y2);
	draw_with_swatch(ctx, min_x, min_y, max_x, max_y, stroke_color, function(op_ctx_2d){
		draw_line_without_pattern_support(op_ctx_2d, x1, y1, x2, y2, stroke_size);
	});
	// also works:
	// draw_line_strip(ctx, [{x: x1, y: y1}, {x: x2, y: y2}]);
}

(function(){

	var tessy = (function initTesselator() {
		// function called for each vertex of tesselator output
		function vertexCallback(data, polyVertArray) {
			// console.log(data[0], data[1]);
			polyVertArray[polyVertArray.length] = data[0];
			polyVertArray[polyVertArray.length] = data[1];
		}
		function begincallback(type) {
			if (type !== libtess.primitiveType.GL_TRIANGLES) {
				console.log('expected TRIANGLES but got type: ' + type);
			}
		}
		function errorcallback(errno) {
			console.log('error callback');
			console.log('error number: ' + errno);
		}
		// callback for when segments intersect and must be split
		function combinecallback(coords, data, weight) {
			// console.log('combine callback');
			return [coords[0], coords[1], coords[2]];
		}
		function edgeCallback(flag) {
			// don't really care about the flag, but need no-strip/no-fan behavior
			// console.log('edge flag: ' + flag);
		}

		var tessy = new libtess.GluTesselator();
		// tessy.gluTessProperty(libtess.gluEnum.GLU_TESS_WINDING_RULE, libtess.windingRule.GLU_TESS_WINDING_POSITIVE);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, vertexCallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, begincallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, errorcallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, combinecallback);
		tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, edgeCallback);

		return tessy;
	})();

	function triangulate(contours) {
		// libtess will take 3d verts and flatten to a plane for tesselation
		// since only doing 2d tesselation here, provide z=1 normal to skip
		// iterating over verts only to get the same answer.
		tessy.gluTessNormal(0, 0, 1);

		var triangleVerts = [];
		tessy.gluTessBeginPolygon(triangleVerts);

		for (var i = 0; i < contours.length; i++) {
			tessy.gluTessBeginContour();
			var contour = contours[i];
			for (var j = 0; j < contour.length; j += 2) {
				var coords = [contour[j], contour[j + 1], 0];
				tessy.gluTessVertex(coords, coords);
			}
			tessy.gluTessEndContour();
		}

		tessy.gluTessEndPolygon();

		return triangleVerts;
	}


	var gl;
	var positionLoc;

	function initWebGL(canvas) {
		gl = canvas.getContext('webgl', { antialias: false });

		var program = createShaderProgram();
		positionLoc = gl.getAttribLocation(program, 'position');
		gl.enableVertexAttribArray(positionLoc);
	}

	function initArrayBuffer(triangleVertexCoords) {
		// put triangle coordinates into a WebGL ArrayBuffer and bind to
		// shader's 'position' attribute variable
		var rawData = new Float32Array(triangleVertexCoords);
		var polygonArrayBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, polygonArrayBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, rawData, gl.STATIC_DRAW);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		return triangleVertexCoords.length / 2;
	}

	function createShaderProgram() {
		// create vertex shader
		var vertexSrc = [
			'attribute vec4 position;',
			'void main() {',
			'    /* already in normalized coordinates, so just pass through */',
			'    gl_Position = position;',
			'}'
		].join('');
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, vertexSrc);
		gl.compileShader(vertexShader);

		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			console.log(
				'Vertex shader failed to compile. Log: ' +
				gl.getShaderInfoLog(vertexShader)
			);
		}

		// create fragment shader
		var fragmentSrc = [
			'precision mediump float;',
			'void main() {',
			'    gl_FragColor = vec4(0, 0, 0, 1);',
			'}'
		].join('');
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, fragmentSrc);
		gl.compileShader(fragmentShader);

		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			console.log(
				'Fragment shader failed to compile. Log: ' +
				gl.getShaderInfoLog(fragmentShader)
			);
		}

		// link shaders to create our program
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		gl.useProgram(program);

		return program;
	}


	var op_canvas_webgl = document.createElement('canvas');
	var op_canvas_2d = document.createElement('canvas');
	var op_ctx_2d = op_canvas_2d.getContext("2d");

	initWebGL(op_canvas_webgl);

	window.draw_line_strip = function(ctx, points){
		draw_polygon_or_line_strip(ctx, points, true, false, false);
	};
	window.draw_polygon = function(ctx, points, stroke, fill){
		draw_polygon_or_line_strip(ctx, points, stroke, fill, true);
	};

	function draw_polygon_or_line_strip(ctx, points, stroke, fill, close_path){

		// this must be before stuff is done with op_canvas
		// otherwise update_brush_for_drawing_lines calls render_brush calls draw_ellipse calls draw_polygon calls draw_polygon_or_line_strip
		// trying to use the same op_canvas
		// (also, avoiding infinite recursion by checking for stroke; assuming brushes will never have outlines)
		if(stroke && stroke_size > 1){
			update_brush_for_drawing_lines(stroke_size);
		}

		var stroke_color = ctx.strokeStyle;
		var fill_color = ctx.fillStyle;

		var numPoints = points.length;
		var numCoords = numPoints * 2

		if(numPoints === 0){
			return;
		}

		var x_min = +Infinity;
		var x_max = -Infinity;
		var y_min = +Infinity;
		var y_max = -Infinity;
		for (var i = 0; i < numPoints; i++) {
			var {x, y} = points[i];
			x_min = Math.min(x, x_min);
			x_max = Math.max(x, x_max);
			y_min = Math.min(y, y_min);
			y_max = Math.max(y, y_max);
		}
		x_max += 1;
		y_max += 1;
		x_min -= 1;
		y_min -= 1;

		op_canvas_webgl.width = x_max - x_min;
		op_canvas_webgl.height = y_max - y_min;
		gl.viewport(0, 0, op_canvas_webgl.width, op_canvas_webgl.height);

		var coords = new Float32Array(numCoords);
		for (var i = 0; i < numPoints; i++) {
			coords[i*2+0] = (points[i].x - x_min) / op_canvas_webgl.width * 2 - 1;
			coords[i*2+1] = 1 - (points[i].y - y_min) / op_canvas_webgl.height * 2;
			// TODO: investigate: does this cause resolution/information loss? can we change the coordinate system?
		}

		if(fill){
			var contours = [coords];
			var polyTriangles = triangulate(contours);
			var numVertices = initArrayBuffer(polyTriangles);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, numVertices);

			op_canvas_2d.width = op_canvas_webgl.width;
			op_canvas_2d.height = op_canvas_webgl.height;

			op_ctx_2d.drawImage(op_canvas_webgl, 0, 0);
			replace_colors_with_swatch(op_ctx_2d, fill_color, x_min, y_min);
			ctx.drawImage(op_canvas_2d, x_min, y_min);
		}
		if(stroke){
			if(stroke_size > 1){
				var stroke_margin = ~~(stroke_size * 1.1);

				var x = x_min - stroke_margin;
				var y = y_min - stroke_margin;

				op_canvas_2d.width = x_max - x_min + stroke_margin * 2;
				op_canvas_2d.height = y_max - y_min + stroke_margin * 2;
				for (var i = 0; i < numPoints - (close_path ? 0 : 1); i++) {
					var point_a = points[i];
					var point_b = points[(i + 1) % numPoints];
					// Note: update_brush_for_drawing_lines way above
					draw_line_without_pattern_support(
						op_ctx_2d,
						point_a.x - x,
						point_a.y - y,
						point_b.x - x,
						point_b.y - y,
						stroke_size
					);
				}

				replace_colors_with_swatch(op_ctx_2d, stroke_color, x, y);
				ctx.drawImage(op_canvas_2d, x, y);
			}else{
				var numVertices = initArrayBuffer(coords);
				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.drawArrays(close_path ? gl.LINE_LOOP : gl.LINE_STRIP, 0, numVertices);

				op_canvas_2d.width = op_canvas_webgl.width;
				op_canvas_2d.height = op_canvas_webgl.height;

				op_ctx_2d.drawImage(op_canvas_webgl, 0, 0);
				replace_colors_with_swatch(op_ctx_2d, stroke_color, x_min, y_min);
				ctx.drawImage(op_canvas_2d, x_min, y_min);
			}
		}
	};

	window.copy_contents_within_polygon = function(canvas, points, x_min, y_min, x_max, y_max){
		// Copy the contents of the given canvas within the polygon given by points bounded by x/y_min/max
		x_max = Math.max(x_max, x_min + 1);
		y_max = Math.max(y_max, y_min + 1);
		var width = x_max - x_min;
		var height = y_max - y_min;
		
		// TODO: maybe have the cutout only the width/height of the bounds
		// var cutout = new Canvas(width, height);
		var cutout = new Canvas(canvas);

		cutout.ctx.save();
		cutout.ctx.globalCompositeOperation = "destination-in";
		draw_polygon(cutout.ctx, points, false, true);
		cutout.ctx.restore();
		
		var cutout_crop = new Canvas(width, height);
		cutout_crop.ctx.drawImage(cutout, x_min, y_min, width, height, 0, 0, width, height);

		return cutout_crop;
	}

	// TODO: maybe shouldn't be external...
	window.draw_with_swatch = function(ctx, x_min, y_min, x_max, y_max, swatch, callback) {
		var stroke_margin = ~~(stroke_size * 1.1);
		
		x_max = Math.max(x_max, x_min + 1);
		y_max = Math.max(y_max, y_min + 1);
		op_canvas_2d.width = x_max - x_min + stroke_margin * 2;
		op_canvas_2d.height = y_max - y_min + stroke_margin * 2;

		var x = x_min - stroke_margin;
		var y = y_min - stroke_margin;

		op_ctx_2d.save();
		op_ctx_2d.translate(-x, -y);
		callback(op_ctx_2d);
		op_ctx_2d.restore(); // for replace_colors_with_swatch!

		replace_colors_with_swatch(op_ctx_2d, swatch, x, y);
		ctx.drawImage(op_canvas_2d, x, y);

		// for debug:
		// ctx.fillStyle = "rgba(255, 0, 255, 0.1)";
		// ctx.fillRect(x, y, op_canvas_2d.width, op_canvas_2d.height);
	}
})();
