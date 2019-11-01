
tools = [{
	// @#: polygonal selection, polygon selection, shape selection, freeform selection
	name: "Free-Form Select",
	description: "Selects a free-form part of the picture to move, copy, or edit.",
	cursor: ["precise", [16, 16], "crosshair"],
	passive: true,

	// A canvas for rendering a preview of the shape
	preview_canvas: null,
	
	// The vertices of the polygon
	points: [],
	
	// The boundaries of the polygon
	x_min: +Infinity,
	x_max: -Infinity,
	y_min: +Infinity,
	y_max: -Infinity,
	
	pointerdown() {
		this.x_min = pointer.x;
		this.x_max = pointer.x+1;
		this.y_min = pointer.y;
		this.y_max = pointer.y+1;
		this.points = [];
		this.preview_canvas = make_canvas(canvas.width, canvas.height);

		// End prior selection, drawing it to the canvas
		deselect();

		// The inverty brush is continuous in space which means
		// paint(ctx, x, y) will be called for each pixel the pointer moves
		// and we only need to record individual pointer events to make the polygon
		const onpointermove = e => {
			const pointer = to_canvas_coords(e);
			// Constrain the pointer to the canvas
			pointer.x = Math.min(canvas.width, pointer.x);
			pointer.x = Math.max(0, pointer.x);
			pointer.y = Math.min(canvas.height, pointer.y);
			pointer.y = Math.max(0, pointer.y);
			// Add the point
			this.points.push(pointer);
			// Update the boundaries of the polygon
			this.x_min = Math.min(pointer.x, this.x_min);
			this.x_max = Math.max(pointer.x, this.x_max);
			this.y_min = Math.min(pointer.y, this.y_min);
			this.y_max = Math.max(pointer.y, this.y_max);
		};
		$G.on("pointermove", onpointermove);
		$G.one("pointerup", () => {
			$G.off("pointermove", onpointermove);
		});
	},
	continuous: "space",
	paint(ctx, x, y) {
		
		// Constrain the inverty paint brush position to the canvas
		x = Math.min(canvas.width, x);
		x = Math.max(0, x);
		y = Math.min(canvas.height, y);
		y = Math.max(0, y);
		
		// Find the dimensions on the canvas of the tiny square to invert
		const inverty_size = 2;
		const rect_x = ~~(x - inverty_size/2);
		const rect_y = ~~(y - inverty_size/2);
		const rect_w = inverty_size;
		const rect_h = inverty_size;
		
		const ctx_dest = this.preview_canvas.ctx;
		const id_src = ctx.getImageData(rect_x, rect_y, rect_w, rect_h);
		const id_dest = ctx_dest.getImageData(rect_x, rect_y, rect_w, rect_h);
		
		for(let i=0, l=id_dest.data.length; i<l; i+=4){
			id_dest.data[i+0] = 255 - id_src.data[i+0];
			id_dest.data[i+1] = 255 - id_src.data[i+1];
			id_dest.data[i+2] = 255 - id_src.data[i+2];
			id_dest.data[i+3] = 255;
			// @TODO maybe: invert based on id_src.data[i+3] and the checkered background
		}
		
		ctx_dest.putImageData(id_dest, rect_x, rect_y);
	},
	pointerup() {
		this.preview_canvas.width = 1;
		this.preview_canvas.height = 1;

		const contents_within_polygon = copy_contents_within_polygon(
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
			this.y_max - this.y_min
		);
		selection.instantiate(contents_within_polygon);
		selection.cut_out_background();
	},
	cancel() {
		if(!this.preview_canvas){return;}
		this.preview_canvas.width = 1;
		this.preview_canvas.height = 1;
	},
	drawPreviewUnderGrid(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
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
	
	// TODO: DRY with Text tool
	drag_start_x: 0,
	drag_start_y: 0,
	pointer_has_moved: false,
	rect_x: 0,
	rect_y: 0,
	rect_width: 0,
	rect_height: 0,
	
	pointerdown: function(){
		this.drag_start_x = pointer.x;
		this.drag_start_y = pointer.y;
		this.pointer_has_moved = false;
		$G.one("pointermove", ()=> {
			this.pointer_has_moved = true;
		});
		if(selection){
			selection.draw();
			selection.destroy();
			selection = null;
		}
		$canvas_handles.hide();
	},
	paint: function(){
		this.rect_x = ~~Math.max(0, Math.min(this.drag_start_x, pointer.x));
		this.rect_y = ~~Math.max(0, Math.min(this.drag_start_y, pointer.y));
		this.rect_width = (~~Math.min(canvas.width, Math.max(this.drag_start_x, pointer.x))) - this.rect_x + 1;
		this.rect_height = (~~Math.min(canvas.height, Math.max(this.drag_start_y, pointer.y))) - this.rect_y + 1;
	},
	pointerup: function(){
		if (this.rect_width > 1 && this.rect_height > 1) {
			selection = new OnCanvasSelection(this.rect_x, this.rect_y, this.rect_width, this.rect_height);

			if(ctrl){
				selection.crop();
				selection.destroy();
				selection = null;
			}else{
				selection.instantiate();
			}
		}

		delete this.rect_x;
		delete this.rect_y;
		delete this.rect_width;
		delete this.rect_height;
	},
	cancel: function(){
		delete this.rect_x;
		delete this.rect_y;
		delete this.rect_width;
		delete this.rect_height;
		
		$canvas_handles.show();
	},
	
	drawPreviewUnderGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active){ return; }
		if(!this.pointer_has_moved) { return; }
		if(typeof this.rect_x === "undefined"){ return; }

		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);

		// make the document canvas part of the helper canvas so that inversion can apply to it
		ctx.drawImage(canvas, 0, 0);
	},
	drawPreviewAboveGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active){ return; }
		if(!this.pointer_has_moved) { return; }
		if(typeof this.rect_x === "undefined"){ return; }

		draw_selection_box(ctx, this.rect_x, this.rect_y, this.rect_width, this.rect_height, scale, translate_x, translate_y);
	},
	$options: $choose_transparent_mode
}, {
	// @#: eraser but also color replacer
	name: "Eraser/Color Eraser",
	description: "Erases a portion of the picture, using the selected eraser shape.",
	cursor: ["precise", [16, 16], "crosshair"],
	continuous: "space",
	drawPreviewUnderGrid(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		const rect_x = ~~(x - eraser_size/2);
		const rect_y = ~~(y - eraser_size/2);
		const rect_w = eraser_size;
		const rect_h = eraser_size;
		
		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);

		ctx.fillStyle = colors.background;
		ctx.fillRect(rect_x, rect_y, rect_w, rect_h);
	},
	drawPreviewAboveGrid(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		
		const rect_x = ~~(x - eraser_size/2);
		const rect_y = ~~(y - eraser_size/2);
		const rect_w = eraser_size;
		const rect_h = eraser_size;
		
		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);
		const hairline_width = 1/scale;

		ctx.strokeStyle = "black";
		ctx.lineWidth = hairline_width;
		if (grid_visible) {
			ctx.strokeRect(rect_x+ctx.lineWidth/2, rect_y+ctx.lineWidth/2, rect_w, rect_h);
		} else {
			ctx.strokeRect(rect_x+ctx.lineWidth/2, rect_y+ctx.lineWidth/2, rect_w-ctx.lineWidth, rect_h-ctx.lineWidth);
		}
	},
	paint(ctx, x, y) {
		
		const rect_x = ~~(x - eraser_size/2);
		const rect_y = ~~(y - eraser_size/2);
		const rect_w = eraser_size;
		const rect_h = eraser_size;
		
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
			
			const fg_rgba = get_rgba_from_color(colors.foreground);
			const bg_rgba = get_rgba_from_color(colors.background);
			
			const id = ctx.getImageData(rect_x, rect_y, rect_w, rect_h);
			
			for(let i=0, l=id.data.length; i<l; i+=4){
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
	pointerdown(ctx, x, y) {
		
		// Get the rgba values of the selected fill color
		const rgba = get_rgba_from_color(fill_color);
		
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
	display_current_color() {
		this.$options.css({
			background: this.current_color
		});
	},
	pointerdown() {
		$G.one("pointerup", () => {
			this.$options.css({
				background: ""
			});
		});
	},
	paint(ctx, x, y) {
		if(x >= 0 && y >= 0 && x < canvas.width && y < canvas.height){
			const id = ctx.getImageData(~~x, ~~y, 1, 1);
			const r = id.data[0];
			const g = id.data[1];
			const b = id.data[2];
			const a = id.data[3];
			this.current_color = `rgba(${r},${g},${b},${a/255})`;
		}else{
			this.current_color = "white";
		}
		this.display_current_color();
	},
	pointerup() {
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

	drawPreviewAboveGrid(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active && !pointer_over_canvas){return;}
		if(pointer_active) { return; }
		const prospective_magnification = this.getProspectiveMagnification();

		if(prospective_magnification < magnification) { return; } // hide if would be zooming out

		// prospective viewport size in document coords
		const w = $canvas_area.width() / prospective_magnification;
		const h = $canvas_area.height() / prospective_magnification;

		let rect_x1 = ~~(x - w/2);
		let rect_y1 = ~~(y - h/2);

		// try to move rect into bounds without squishing
		rect_x1 = Math.max(0, rect_x1);
		rect_y1 = Math.max(0, rect_y1);
		rect_x1 = Math.min(canvas.width - w, rect_x1);
		rect_y1 = Math.min(canvas.height - h, rect_y1);

		let rect_x2 = rect_x1 + w;
		let rect_y2 = rect_y1 + h;
		
		// clamp rect to bounds (with squishing)
		rect_x1 = Math.max(0, rect_x1);
		rect_y1 = Math.max(0, rect_y1);
		rect_x2 = Math.min(canvas.width, rect_x2);
		rect_y2 = Math.min(canvas.height, rect_y2);
		
		const rect_w = rect_x2 - rect_x1;
		const rect_h = rect_y2 - rect_y1;
		const rect_x = rect_x1;
		const rect_y = rect_y1;

		const id_src = canvas.ctx.getImageData(rect_x, rect_y, rect_w+1, rect_h+1);
		const id_dest = ctx.getImageData((rect_x+translate_x)*scale, (rect_y+translate_y)*scale, rect_w*scale+1, rect_h*scale+1);
		
		function copyPixelInverted(x_dest, y_dest) {
			const x_src = ~~(x_dest / scale);
			const y_src = ~~(y_dest / scale);
			const index_src = (x_src + y_src * id_src.width) * 4;
			const index_dest = (x_dest + y_dest * id_dest.width) * 4;
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
	pointerdown(ctx, x, y) {
		const prev_magnification = magnification;
		const prospective_magnification = this.getProspectiveMagnification();
		
		set_magnification(prospective_magnification);

		if (magnification > prev_magnification) {

			// (new) viewport size in document coords
			const w = $canvas_area.width() / magnification;
			const h = $canvas_area.height() / magnification;

			const scroll_left = (x - w/2) * magnification / prev_magnification;
			const scroll_top = (y - h/2) * magnification / prev_magnification;
			
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
	pencil_canvas: make_canvas(),
	paint(ctx, x, y) {
		// XXX: WET (Write Everything Twice) / DAMP (Duplicate Anything Moderately Pastable) (I'm coining that)
		// TODO: DRY (Don't Repeat Yourself) / DEHYDRATE (Delete Everything Hindering Yourself Drastically Reducing Aqueous Text Evil) (I'm coining that too)
		const csz = get_brush_canvas_size(pencil_size, "circle");
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
	paint(ctx, x, y) {
		const csz = get_brush_canvas_size(brush_size, brush_shape);
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
	drawPreviewUnderGrid(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
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
	paint(ctx, x, y) {
		const r = airbrush_size / 2;
		for(let i = 0; i < 6 + r/5; i++){
			const rx = (Math.random()*2-1) * r;
			const ry = (Math.random()*2-1) * r;
			const d = rx*rx + ry*ry;
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
	preload() {
		setTimeout(FontDetective.preload, 10);
	},

	// TODO: DRY with Select tool
	drag_start_x: 0,
	drag_start_y: 0,
	pointer_has_moved: false,
	rect_x: 0,
	rect_y: 0,
	rect_width: 0,
	rect_height: 0,
	
	pointerdown: function(){
		this.drag_start_x = pointer.x;
		this.drag_start_y = pointer.y;
		this.pointer_has_moved = false;
		$G.one("pointermove", ()=> {
			this.pointer_has_moved = true;
		});
		if(textbox){
			textbox.draw();
			textbox.destroy();
			textbox = null;
		}
		$canvas_handles.hide();
	},
	paint: function(){
		this.rect_x = ~~Math.max(0, Math.min(this.drag_start_x, pointer.x));
		this.rect_y = ~~Math.max(0, Math.min(this.drag_start_y, pointer.y));
		this.rect_width = (~~Math.min(canvas.width, Math.max(this.drag_start_x, pointer.x))) - this.rect_x + 1;
		this.rect_height = (~~Math.min(canvas.height, Math.max(this.drag_start_y, pointer.y))) - this.rect_y + 1;
	},
	pointerup: function(){
		if (this.rect_width > 1 && this.rect_height > 1) {
			textbox = new OnCanvasTextBox(this.rect_x, this.rect_y, this.rect_width, this.rect_height);
		}

		delete this.rect_x;
		delete this.rect_y;
		delete this.rect_width;
		delete this.rect_height;
	},
	cancel: function(){
		delete this.rect_x;
		delete this.rect_y;
		delete this.rect_width;
		delete this.rect_height;
		
		$canvas_handles.show();
	},
	
	drawPreviewUnderGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active){ return; }
		if(!this.pointer_has_moved) { return; }
		if(typeof this.rect_x === "undefined"){ return; }

		ctx.scale(scale, scale);
		ctx.translate(translate_x, translate_y);

		// make the document canvas part of the helper canvas so that inversion can apply to it
		ctx.drawImage(canvas, 0, 0);
	},
	drawPreviewAboveGrid: function(ctx, x, y, grid_visible, scale, translate_x, translate_y) {
		if(!pointer_active){ return; }
		if(!this.pointer_has_moved) { return; }
		if(typeof this.rect_x === "undefined"){ return; }

		draw_selection_box(ctx, this.rect_x, this.rect_y, this.rect_width, this.rect_height, scale, translate_x, translate_y);
	},
	$options: $choose_transparent_mode
}, {
	name: "Line",
	description: "Draws a straight line with the selected line width.",
	cursor: ["precise", [16, 16], "crosshair"],
	stroke_only: true,
	shape(ctx, x, y, w, h) {
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
	passive() {
		// Actions are passive if you've already started using the this,
		// but the first action should be undoable / cancelable
		return this.points.length > 0;
	},
	pointerup(ctx, x, y) {
		if(this.points.length >= 4){
			this.points = [];
		}
	},
	pointerdown(ctx, x, y) {
		if(this.points.length < 1){
			undoable(()=> {
				this.points.push({x, y});
				// second point so first action draws a line
				this.points.push({x, y});
			});
		}else{
			this.points.push({x, y});
		}
	},
	paint(ctx, x, y) {
		if(this.points.length < 1){ return; }
		
		const i = this.points.length - 1;
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
	cancel() {
		this.points = [];
	},
	end() {
		this.points = [];
	},
	shape() {true},
	$options: $choose_stroke_size
}, {
	// @#: square
	name: "Rectangle",
	description: "Draws a rectangle with the selected fill style.",
	cursor: ["precise", [16, 16], "crosshair"],
	shape(ctx, x, y, w, h) {
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
	
	passive() {
		// actions are passive if you've already started using the this
		// but the first action should be undoable
		return this.points.length > 0;
		// In other words, it's supposed to be one undoable action
	},
	pointerup(ctx, x, y) {
		if(this.points.length < 1){ return; }
		
		const i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		const dx = this.points[i].x - this.points[0].x;
		const dy = this.points[i].y - this.points[0].y;
		const d = Math.sqrt(dx*dx + dy*dy);
		if(d < stroke_size * 5.1010101){ // arbitrary 101 (TODO: find correct value (or formula))
			this.complete(ctx, x, y);
		}
		
		this.last_click_pointerup = {x, y, time: +(new Date)};
	},
	pointerdown(ctx, x, y) {
		if(this.points.length < 1){
			// @TODO: stop needing this:
			this.canvas_base = canvas;
			
			undoable(() => {
				// @TODO: stop needing this:
				this.canvas_base = undos[undos.length-1];
				
				// Add the first point of the polygon
				this.points.push({x, y});
				// Add a second point so first action draws a line
				this.points.push({x, y});
			});
		}else{
			const lx = this.last_click_pointerdown.x;
			const ly = this.last_click_pointerdown.y;
			const lt = this.last_click_pointerdown.time;
			const dx = x - lx;
			const dy = y - ly;
			const dt = +(new Date) - lt;
			const d = Math.sqrt(dx*dx + dy*dy);
			if(d < 4.1010101 && dt < 250){ // arbitrary 101 (TODO: find correct value (or formula))
				this.complete(ctx, x, y);
				// Release the pointer to prevent this.paint()
				// being called and clearing the canvas
				$canvas.trigger("pointerup");
			}else{
				// Add the point
				this.points.push({x, y});
			}
		}
		this.last_click_pointerdown = {x, y, time: +new Date};
	},
	paint(ctx, x, y) {
		if(this.points.length < 1){ return; }
		
		// Clear the canvas to the previous image to get
		// rid of lines drawn while constructing the shape
		// @TODO: stop needing this
		ctx.copy(this.canvas_base);
		
		const i = this.points.length - 1;
		this.points[i].x = x;
		this.points[i].y = y;
		
		ctx.strokeStyle = stroke_color;
		draw_line_strip(
			ctx,
			this.points
		);
	},
	complete(ctx, x, y) {
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
	cancel() {
		this.reset();
	},
	end() {
		this.reset();
	},
	reset() {
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
	shape(ctx, x, y, w, h) {
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
	shape(ctx, x, y, w, h) {
		if(w < 0){ x += w; w = -w; }
		if(h < 0){ y += h; h = -h; }

		let radius;
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
