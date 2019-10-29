
tools = [{
	// @#: polygonal selection, polygon selection, shape selection, freeform selection
	name: "Free-Form Select",
	description: "Selects a free-form part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,

	// A canvas for rendering a preview of the selection polygon
	preview_canvas: null,
	
	// The vertices of the polygon
	points: [],
	
	// The boundaries of the polygon
	x_min: +Infinity,
	x_max: -Infinity,
	y_min: +Infinity,
	y_max: -Infinity,
	
	pointerdown: function(){
		var tool = this;
		tool.x_min = pointer.x;
		tool.x_max = pointer.x+1;
		tool.y_min = pointer.y;
		tool.y_max = pointer.y+1;
		tool.points = [];
		tool.preview_canvas = new Canvas(canvas.width, canvas.height);

		// End prior selection, drawing it to the canvas
		deselect();

		// The inverty brush is continuous in space which means
		// paint(ctx, x, y) will be called for each pixel the pointer moves
		// and we only need to record individual pointer events to make the polygon
		var onpointermove = function(e){
			var pointer = e2c(e);
			// Constrain the pointer to the canvas
			pointer.x = Math.min(canvas.width, pointer.x);
			pointer.x = Math.max(0, pointer.x);
			pointer.y = Math.min(canvas.height, pointer.y);
			pointer.y = Math.max(0, pointer.y);
			// Add the point
			tool.points.push(pointer);
			// Update the boundaries of the polygon
			tool.x_min = Math.min(pointer.x, tool.x_min);
			tool.x_max = Math.max(pointer.x, tool.x_max);
			tool.y_min = Math.min(pointer.y, tool.y_min);
			tool.y_max = Math.max(pointer.y, tool.y_max);
		};
		$G.on("pointermove", onpointermove);
		$G.one("pointerup", function(){
			$G.off("pointermove", onpointermove);
		});

		$canvas_handles.hide();
	},
	continuous: "space",
	paint: function(ctx, x, y){
		
		// Constrain the inverty paint brush position to the canvas
		x = Math.min(canvas.width, x);
		x = Math.max(0, x);
		y = Math.min(canvas.height, y);
		y = Math.max(0, y);
		
		// Find the dimensions on the canvas of the tiny square to invert
		var inverty_size = 2;
		var rect_x = ~~(x - inverty_size/2);
		var rect_y = ~~(y - inverty_size/2);
		var rect_w = inverty_size;
		var rect_h = inverty_size;
		
		var ctx_dest = this.preview_canvas.ctx;
		var id_src = ctx.getImageData(rect_x, rect_y, rect_w, rect_h);
		var id_dest = ctx_dest.getImageData(rect_x, rect_y, rect_w, rect_h);
		
		for(var i=0, l=id_dest.data.length; i<l; i+=4){
			id_dest.data[i+0] = 255 - id_src.data[i+0];
			id_dest.data[i+1] = 255 - id_src.data[i+1];
			id_dest.data[i+2] = 255 - id_src.data[i+2];
			id_dest.data[i+3] = 255;
			// @TODO maybe: invert based on id_src.data[i+3] and the checkered background
		}
		
		ctx_dest.putImageData(id_dest, rect_x, rect_y);
	},
	pointerup: function(){
		this.preview_canvas.width = 1;
		this.preview_canvas.height = 1;

		var contents_within_polygon = copy_contents_within_polygon(
			canvas,
			this.points,
			this.x_min,
			this.y_min,
			this.x_max,
			this.y_max
		);
		
		if(selection){
			// for silly multitools feature
			// TODO: select a rectangle minus the polygon, or xor the polygon
			selection.draw();
			selection.destroy();
			selection = null;
		}
		selection = new OnCanvasSelection(
			this.x_min,
			this.y_min,
			this.x_max - this.x_min,
			this.y_max - this.y_min,
			contents_within_polygon
		);
		selection.cut_out_background();
	},
	cancel: function(){
		$canvas_handles.show();
		if(!this.preview_canvas){return;}
		this.preview_canvas.width = 1;
		this.preview_canvas.height = 1;
	},
	drawPreviewUnderGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		if(!this.preview_canvas){return;}

		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);

		ctx.drawImage(this.preview_canvas, 0, 0);
	},
	$options: $choose_transparent_mode
}, {
	// @#: rectangle selection, rectangular selection
	name: "Select",
	description: "Selects a rectangular part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,
	drag_start_x: 0,
	drag_start_y: 0,
	
	pointerdown: function(){
		this.drag_start_x = pointer.x;
		this.drag_start_y = pointer.y;
		if(selection){
			selection.draw(); // TODO: isn't this.. not passive??
			selection.destroy();
			selection = null;
		}
		// TODO: port this behavior over
		// var pointer_has_moved = false;
		// $G.one("pointermove", function(){
		// 	pointer_has_moved = true;
		// });
		// $G.one("pointerup", function(){
		// 	if(!pointer_has_moved && selection){
		// 		selection.draw();//?
		// 		selection.destroy();
		// 		selection = null;
		// 	}
		// });
		$canvas_handles.hide();
	},
	paint: function(){
		this.x1 = Math.max(0, Math.min(this.drag_start_x, pointer.x));
		this.y1 = Math.max(0, Math.min(this.drag_start_y, pointer.y));
		this.x2 = Math.min(canvas.width, Math.max(this.drag_start_x, pointer.x));
		this.y2 = Math.min(canvas.height, Math.max(this.drag_start_y, pointer.y));
	},
	pointerup: function(){
		if(selection){
			selection.draw(); // TODO: isn't this.. not passive??
			selection.destroy();
			selection = null;
		}
		selection = new OnCanvasSelection(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
		delete this.x1;
		delete this.x2;
		delete this.y1;
		delete this.y2;

		if(ctrl){
			selection.crop();
			selection.destroy();
			selection = null;
		}
	},
	cancel: function(){
		delete this.x1;
		delete this.x2;
		delete this.y1;
		delete this.y2;
		$canvas_handles.show();
	},
	drawDots: function(ctx, x, y, go_x, go_y) {

		const len = 4 / magnification;
		const w = 1;
		// const hairline_width = 1/scaled_by_amount;

		ctx.save();
		ctx.translate(x, y);
		ctx.globalCompositeOperation = "difference";
		// ctx.fillStyle = "white";
		// ctx.fillRect(0, 0, 100, 100);

		ctx.translate(0.5, 0.5);
		ctx.strokeStyle = "white";
		ctx.lineWidth = w;
		ctx.beginPath();
		if (go_x) {
			for (var gone_x=0; gone_x<go_x; gone_x += len * 2) {
				ctx.moveTo(gone_x, 0);
				ctx.lineTo(gone_x + len, 0);
			}
		} else {
			for (var gone_y=0; gone_y<go_y; gone_y += len * 2) {
				ctx.moveTo(0, gone_y);
				ctx.lineTo(0, gone_y + len);
			}
		}
		ctx.stroke();
		ctx.restore();
	},
	// TODO: might be above? but would need to do things differently wrt drawImage and inverting and the grid
	drawPreviewUnderGrid: function(ctx, x, y, scaled_by_amount, grid_visible) {
		if(!pointer_active && !pointer_over_canvas){return;}
		if(typeof this.x1 === "undefined"){return;}

		// draw selection border

		// the dots of the border are sized such that at 4x zoom, they're squares equal to one canvas pixel
		// they're off by a screen pixel tho
		
		ctx.drawImage(canvas, 0, 0);

		var rect_x = ~~(this.x1);
		var rect_y = ~~(this.y1);
		var rect_w = ~~(this.x2 - this.x1);
		var rect_h = ~~(this.y2 - this.y1);
		this.drawDots(ctx, rect_x, rect_y, rect_w, 0);
		this.drawDots(ctx, rect_x, rect_y, 0, rect_h);
		this.drawDots(ctx, rect_x + rect_w, rect_y, 0, rect_h);
		this.drawDots(ctx, rect_x, rect_y + rect_h, rect_w, 0);

		// if (grid_visible) {
		// 	ctx.strokeRect(rect_x+ctx.lineWidth/2, rect_y+ctx.lineWidth/2, rect_w, rect_h);
		// } else {
		// 	ctx.strokeRect(rect_x+ctx.lineWidth/2, rect_y+ctx.lineWidth/2, rect_w-ctx.lineWidth, rect_h-ctx.lineWidth);
		// }
	},
	$options: $choose_transparent_mode
}, {
	// @#: eraser but also color replacer
	name: "Eraser/Color Eraser",
	description: "Erases a portion of the picture, using the selected eraser shape.",
	cursor: ["precise", [16, 16], "crosshair"],
	continuous: "space",
	drawPreviewUnderGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		var rect_x = ~~(x - eraser_size/2);
		var rect_y = ~~(y - eraser_size/2);
		var rect_w = eraser_size;
		var rect_h = eraser_size;
		
		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);

		ctx.fillStyle = colors.background;
		ctx.fillRect(rect_x, rect_y, rect_w, rect_h);
	},
	drawPreviewAboveGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		
		var rect_x = ~~(x - eraser_size/2);
		var rect_y = ~~(y - eraser_size/2);
		var rect_w = eraser_size;
		var rect_h = eraser_size;
		
		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);
		var hairline_width = 1/scale;

		ctx.strokeStyle = "black";
		ctx.lineWidth = hairline_width;
		if (grid_visible) {
			ctx.strokeRect(rect_x+ctx.lineWidth/2, rect_y+ctx.lineWidth/2, rect_w, rect_h);
		} else {
			ctx.strokeRect(rect_x+ctx.lineWidth/2, rect_y+ctx.lineWidth/2, rect_w-ctx.lineWidth, rect_h-ctx.lineWidth);
		}
	},
	paint: function(ctx, x, y){
		
		var rect_x = ~~(x - eraser_size/2);
		var rect_y = ~~(y - eraser_size/2);
		var rect_w = eraser_size;
		var rect_h = eraser_size;
		
		if(button === 0){
			// Eraser
			if(transparency){
				ctx.clearRect(rect_x, rect_y, rect_w, rect_h);
			}else{
				ctx.fillStyle = colors.background;
				ctx.fillRect(rect_x, rect_y, rect_w, rect_h);
			}
		}else{
			// Color Eraser
			// Right click with the eraser to selectively replace
			// the selected foreground color with the selected background color
			
			var fg_rgba = get_rgba_from_color(colors.foreground);
			var bg_rgba = get_rgba_from_color(colors.background);
			
			var id = ctx.getImageData(rect_x, rect_y, rect_w, rect_h);
			
			for(var i=0, l=id.data.length; i<l; i+=4){
				if(
					id.data[i+0] === fg_rgba[0] &&
					id.data[i+1] === fg_rgba[1] &&
					id.data[i+2] === fg_rgba[2] &&
					id.data[i+3] === fg_rgba[3]
				){
					id.data[i+0] = bg_rgba[0];
					id.data[i+1] = bg_rgba[1];
					id.data[i+2] = bg_rgba[2];
					id.data[i+3] = bg_rgba[3];
				}
			}
			
			ctx.putImageData(id, rect_x, rect_y);
		}
	},
	$options: $choose_eraser_size
}, {
	// @#: fill bucket, flood fill
	name: "Fill With Color",
	description: "Fills an area with the selected drawing color.",
	cursor: ["fill-bucket", [8, 22], "crosshair"],
	pointerdown: function(ctx, x, y){
		
		// Get the rgba values of the selected fill color
		var rgba = get_rgba_from_color(fill_color);
		
		if(shift){
			// Perform a global (non-contiguous) fill operation, AKA color replacement
			draw_noncontiguous_fill(ctx, x, y, rgba[0], rgba[1], rgba[2], rgba[3]);
		} else {
			// Perform a normal fill operation
			draw_fill(ctx, x, y, rgba[0], rgba[1], rgba[2], rgba[3]);
		}
	}
}, {
	// @#: eyedropper, eye dropper, Pasteur pipette, select colors, pick colors
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
	pointerdown: function(){
		var _this = this;
		$G.one("pointerup", function(){
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
	pointerup: function(){
		colors[fill_color_k] = this.current_color;
		$G.trigger("option-changed");
	},
	$options: $(E("div"))
}, {
	// @#: magnifying glass, zoom
	name: "Magnifier",
	description: "Changes the magnification.",
	cursor: ["magnifier", [16, 16], "zoom-in"],
	// @TODO: use zoom-in/zoom-out as default,
	// even though the custom cursor image is less descriptive
	deselect: true,
	passive: true,
	
	getProspectiveMagnification: ()=> (
		magnification === 1 ? return_to_magnification : 1
	),

	drawPreviewAboveGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		if(pointer_active) { return; }
		var prospective_magnification = this.getProspectiveMagnification();

		if(prospective_magnification < magnification) { return; } // hide if would be zooming out

		// prospective viewport size in document coords
		var w = $canvas_area.width() / prospective_magnification;
		var h = $canvas_area.height() / prospective_magnification;

		var rect_x1 = ~~(x - w/2);
		var rect_y1 = ~~(y - h/2);

		// try to move rect into bounds without squishing
		rect_x1 = Math.max(0, rect_x1);
		rect_y1 = Math.max(0, rect_y1);
		rect_x1 = Math.min(canvas.width - w, rect_x1);
		rect_y1 = Math.min(canvas.height - h, rect_y1);

		var rect_x2 = rect_x1 + w;
		var rect_y2 = rect_y1 + h;
		
		// clamp rect to bounds (with squishing)
		rect_x1 = Math.max(0, rect_x1);
		rect_y1 = Math.max(0, rect_y1);
		rect_x2 = Math.min(canvas.width, rect_x2);
		rect_y2 = Math.min(canvas.height, rect_y2);
		
		var rect_w = rect_x2 - rect_x1;
		var rect_h = rect_y2 - rect_y1;
		var rect_x = rect_x1;
		var rect_y = rect_y1;

		var id_src = canvas.ctx.getImageData(rect_x, rect_y, rect_w+1, rect_h+1);
		var id_dest = ctx.getImageData((rect_x+translate_x)*scale, (rect_y+translate_y)*scale, rect_w*scale+1, rect_h*scale+1);
		
		function copyPixelInverted(x_dest, y_dest) {
			var x_src = ~~(x_dest / scale);
			var y_src = ~~(y_dest / scale);
			var index_src = (x_src + y_src * id_src.width) * 4;
			var index_dest = (x_dest + y_dest * id_dest.width) * 4;
			id_dest.data[index_dest+0] = 255 - id_src.data[index_src+0];
			id_dest.data[index_dest+1] = 255 - id_src.data[index_src+1];
			id_dest.data[index_dest+2] = 255 - id_src.data[index_src+2];
			id_dest.data[index_dest+3] = 255;
			// @TODO maybe: invert based on id_src.data[index_src+3] and the checkered background
		}

		for(let x=0, limit=id_dest.width; x<limit; x+=1){
			copyPixelInverted(x, 0);
			copyPixelInverted(x, id_dest.height-1);
		}
		for(let y=1, limit=id_dest.height-1; y<limit; y+=1){
			copyPixelInverted(0, y);
			copyPixelInverted(id_dest.width-1, y);
		}

		// for debug: fill rect
		// for(let x=0, x_limit=id_dest.width; x<x_limit; x+=1){
		// 	for(let y=1, y_limit=id_dest.height-1; y<y_limit; y+=1){
		// 		copyPixelInverted(x, y);
		// 	}
		// }
		
		ctx.putImageData(id_dest, (rect_x+translate_x)*scale, (rect_y+translate_y)*scale);

		// debug:
		// ctx.scale(scale, scale);
		// ctx.translate(translate_x, translate_y);
		// ctx.strokeStyle = "#f0f";
		// ctx.strokeRect(rect_x1, rect_y1, rect_w, rect_h);
	},
	pointerdown: function(ctx, x, y){
		var prev_magnification = magnification;
		var prospective_magnification = this.getProspectiveMagnification();
		
		set_magnification(prospective_magnification);

		if (magnification > prev_magnification) {

			// (new) viewport size in document coords
			var w = $canvas_area.width() / magnification;
			var h = $canvas_area.height() / magnification;

			var scroll_left = (x - w/2) * magnification / prev_magnification;
			var scroll_top = (y - h/2) * magnification / prev_magnification;
			
			$canvas_area.scrollLeft(scroll_left);
			$canvas_area.scrollTop(scroll_top);
			$canvas_area.trigger("scroll");
		}
	},
	$options: $choose_magnification
}, {
	name: "Pencil",
	description: "Draws a free-form line one pixel wide.",
	cursor: ["pencil", [13, 23], "crosshair"],
	continuous: "space",
	stroke_only: true,
	pencil_canvas: Canvas(),
	paint: function(ctx, x, y){
		// XXX: WET (Write Everything Twice) / DAMP (Duplicate Anything Moderately Pastable) (I'm coining that)
		// TODO: DRY (Don't Repeat Yourself) / DEHYDRATE (Delete Everything Hindering Yourself Drastically Reducing Aqueous Text Evil) (I'm coining that too)
		var csz = get_brush_canvas_size(pencil_size, "circle");
		if(
			this.rendered_shape !== "circle" ||
			this.rendered_color !== stroke_color ||
			this.rendered_size !== pencil_size
		){
			this.pencil_canvas.width = csz;
			this.pencil_canvas.height = csz;
			// don't need to do this.pencil_canvas.ctx.disable_image_smoothing() currently because images aren't drawn to the brush

			this.pencil_canvas.ctx.fillStyle = this.pencil_canvas.ctx.strokeStyle = stroke_color;
			render_brush(this.pencil_canvas.ctx, "circle", pencil_size);
			
			this.rendered_color = stroke_color;
			this.rendered_size = pencil_size;
			this.rendered_shape = "circle";
		}
		ctx.drawImage(this.pencil_canvas, Math.ceil(x-csz/2), Math.ceil(y-csz/2));
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
		var csz = get_brush_canvas_size(brush_size, brush_shape);
		if(
			this.rendered_shape !== brush_shape ||
			this.rendered_color !== stroke_color ||
			this.rendered_size !== brush_size
		){
			brush_canvas.width = csz;
			brush_canvas.height = csz;
			// don't need to do brush_ctx.disable_image_smoothing() currently because images aren't drawn to the brush

			brush_ctx.fillStyle = brush_ctx.strokeStyle = stroke_color;
			render_brush(brush_ctx, brush_shape, brush_size);
			
			this.rendered_color = stroke_color;
			this.rendered_size = brush_size;
			this.rendered_shape = brush_shape;
		}
		ctx.drawImage(brush_canvas, Math.ceil(x-csz/2), Math.ceil(y-csz/2));
	},
	drawPreviewUnderGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		
		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);

		this.paint(ctx, x, y);
	},
	$options: $choose_brush
}, {
	// @#: spray paint
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
	passive: true,
	preload: function(){
		setTimeout(FontDetective.preload, 10);
	},
	drag_start_x: 0,
	drag_start_y: 0,
	pointerdown: function(){
		this.drag_start_x = pointer.x;
		this.drag_start_y = pointer.y;
		if(textbox){
			textbox.draw();
			textbox.destroy();
		}
		var pointer_has_moved = false;
		$G.one("pointermove", function(){
			pointer_has_moved = true;
		});
		$G.one("pointerup", function(){
			if(!pointer_has_moved && textbox){
				textbox.draw();
				textbox.destroy();
				textbox = null;
			}
		});
		textbox = new OnCanvasTextBox(pointer.x, pointer.y, 1, 1);
	},
	paint: function(){
		if(!textbox){ return; }
		var x1 = Math.max(0, Math.min(this.drag_start_x, pointer.x));
		var y1 = Math.max(0, Math.min(this.drag_start_y, pointer.y));
		var x2 = Math.min(canvas.width, Math.max(this.drag_start_x, pointer.x));
		var y2 = Math.min(canvas.height, Math.max(this.drag_start_y, pointer.y));
		textbox.x = x1;
		textbox.y = y1;
		textbox.width = Math.max(1, x2 - x1);
		textbox.height = Math.max(1, y2 - y1);
		textbox.position();
	},
	pointerup: function(){
		if(!textbox){ return; }
		textbox.instantiate();
	},
	cancel: function(){
		if(!textbox){ return; }
		textbox.destroy();
		textbox = null;
	},
	$options: $choose_transparent_mode
}, {
	name: "Line",
	description: "Draws a straight line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	shape: function(ctx, x, y, w, h){
		update_brush_for_drawing_lines(stroke_size);
		draw_line(ctx, x, y, x+w, y+h, stroke_size);
	},
	$options: $choose_stroke_size
}, {
	name: "Curve",
	description: "Draws a curved line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	points: [],
	passive: function(){
		// Actions are passive if you've already started using the tool,
		// but the first action should be undoable / cancelable
		return this.points.length > 0;
	},
	pointerup: function(ctx, x, y){
		if(this.points.length >= 4){
			this.points = [];
		}
	},
	pointerdown: function(ctx, x, y){
		if(this.points.length < 1){
			undoable(()=> {
				this.points.push({x: x, y: y});
				// second point so first action draws a line
				this.points.push({x: x, y: y});
			});
		}else{
			this.points.push({x: x, y: y});
		}
	},
	paint: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		var i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		
		update_brush_for_drawing_lines(stroke_size);
		
		if(this.points.length === 4){
			draw_bezier_curve(
				ctx,
				this.points[0].x, this.points[0].y,
				this.points[2].x, this.points[2].y,
				this.points[3].x, this.points[3].y,
				this.points[1].x, this.points[1].y,
				stroke_size
			);
		}else if(this.points.length === 3){
			draw_quadratic_curve(
				ctx,
				this.points[0].x, this.points[0].y,
				this.points[2].x, this.points[2].y,
				this.points[1].x, this.points[1].y,
				stroke_size
			);
		}else{
			draw_line(
				ctx,
				this.points[0].x, this.points[0].y,
				this.points[1].x, this.points[1].y,
				stroke_size
			);
		}
	},
	cancel: function(){
		this.points = [];
	},
	end: function(){
		this.points = [];
	},
	shape: function(){true},
	$options: $choose_stroke_size
}, {
	// @#: square
	name: "Rectangle",
	description: "Draws a rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }
		
		if(this.$options.fill){
			ctx.fillRect(x, y, w, h);
		}
		if(this.$options.stroke){
			if(w < stroke_size * 2 || h < stroke_size * 2){
				ctx.save();
				ctx.fillStyle = ctx.strokeStyle;
				ctx.fillRect(x, y, w, h);
				ctx.restore();
			}else{
				// TODO: shouldn't that be ~~(stroke_size / 2)?
				ctx.strokeRect(x + stroke_size / 2, y + stroke_size / 2, w - stroke_size, h - stroke_size);
			}
		}
	},
	$options: $ChooseShapeStyle()
}, {
	name: "Polygon",
	description: "Draws a polygon with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	
	// Record the last click for double-clicking
	// A double click happens on pointerdown of a second click
	// (within a cylindrical volume in 2d space + 1d time)
	last_click_pointerdown: {x: -Infinity, y: -Infinity, time: -Infinity},
	last_click_pointerup: {x: -Infinity, y: -Infinity, time: -Infinity},
	
	// The vertices of the polygon
	points: [],
	
	passive: function(){
		// actions are passive if you've already started using the tool
		// but the first action should be undoable
		return this.points.length > 0;
		// In other words, it's supposed to be one undoable action
	},
	pointerup: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		var i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		var dx = this.points[i].x - this.points[0].x;
		var dy = this.points[i].y - this.points[0].y;
		var d = Math.sqrt(dx*dx + dy*dy);
		if(d < stroke_size * 5.1010101){ // arbitrary 101 (TODO: find correct value (or formula))
			this.complete(ctx, x, y);
		}
		
		this.last_click_pointerup = {x: x, y: y, time: +(new Date)};
	},
	pointerdown: function(ctx, x, y){
		var tool = this;
		
		if(tool.points.length < 1){
			// @TODO: stop needing this:
			tool.canvas_base = canvas;
			
			undoable(function(){
				// @TODO: stop needing this:
				tool.canvas_base = undos[undos.length-1];
				
				// Add the first point of the polygon
				tool.points.push({x: x, y: y});
				// Add a second point so first action draws a line
				tool.points.push({x: x, y: y});
			});
		}else{
			var lx = tool.last_click_pointerdown.x;
			var ly = tool.last_click_pointerdown.y;
			var lt = tool.last_click_pointerdown.time;
			var dx = x - lx;
			var dy = y - ly;
			var dt = +(new Date) - lt;
			var d = Math.sqrt(dx*dx + dy*dy);
			if(d < 4.1010101 && dt < 250){ // arbitrary 101 (TODO: find correct value (or formula))
				tool.complete(ctx, x, y);
				// Release the pointer to prevent tool.paint()
				// being called and clearing the canvas
				$canvas.trigger("pointerup");
			}else{
				// Add the point
				tool.points.push({x: x, y: y});
			}
		}
		tool.last_click_pointerdown = {x: x, y: y, time: +new Date};
	},
	paint: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		// Clear the canvas to the previous image to get
		// rid of lines drawn while constructing the shape
		// @TODO: stop needing this
		ctx.copy(this.canvas_base);
		
		var i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		
		ctx.strokeStyle = stroke_color;
		draw_line_strip(
			ctx,
			this.points
		);
	},
	complete: function(ctx, x, y){
		if(this.points.length < 1){ return; }
		
		// Clear the canvas to the previous image to get
		// rid of lines drawn while constructing the shape
		// @TODO: stop needing this
		ctx.copy(this.canvas_base);
		
		ctx.fillStyle = fill_color;
		ctx.strokeStyle = stroke_color;

		draw_polygon(
			ctx,
			this.points,
			this.$options.stroke,
			this.$options.fill
		);
		
		this.reset();
	},
	cancel: function(){
		this.reset();
	},
	end: function(){
		this.reset();
	},
	reset: function(){
		this.points = [];
		this.last_click_pointerdown = {x: -Infinity, y: -Infinity, time: -Infinity};
		this.last_click_pointerup = {x: -Infinity, y: -Infinity, time: -Infinity};
	},
	shape_colors: true,
	$options: $ChooseShapeStyle()
}, {
	// @#: circle
	name: "Ellipse",
	description: "Draws an ellipse with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }

		if(w < stroke_size || h < stroke_size){
			ctx.fillStyle = ctx.strokeStyle;
			draw_ellipse(ctx, x, y, w, h, false, true);
		}else{
			draw_ellipse(
				ctx,
				x + ~~(stroke_size / 2),
				y + ~~(stroke_size / 2),
				w - stroke_size,
				h - stroke_size,
				this.$options.stroke,
				this.$options.fill
			);
		}
	},
	$options: $ChooseShapeStyle()
}, {
	// @#: rounded square
	name: "Rounded Rectangle",
	description: "Draws a rounded rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape: function(ctx, x, y, w, h){
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }

		var radius;
		if(w < stroke_size || h < stroke_size){
			ctx.fillStyle = ctx.strokeStyle;
			radius = Math.min(8, w/2, h/2);
			// var radius_x = Math.min(8, w/2);
			// var radius_y = Math.min(8, h/2);
			draw_rounded_rectangle(
				ctx,
				x, y, w, h,
				radius, radius,
				// radius_x, radius_y,
				false,
				true
			);
		}else{
			radius = Math.min(8, (w - stroke_size)/2, (h - stroke_size)/2);
			// var radius_x = Math.min(8, (w - stroke_size)/2);
			// var radius_y = Math.min(8, (h - stroke_size)/2);
			draw_rounded_rectangle(
				ctx,
				x + ~~(stroke_size / 2),
				y + ~~(stroke_size / 2),
				w - stroke_size,
				h - stroke_size,
				radius, radius,
				// radius_x, radius_y,
				this.$options.stroke,
				this.$options.fill
			);
		}
	},
	$options: $ChooseShapeStyle()
}];
