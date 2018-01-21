
function Selection(x, y, width, height){
	var sel = this;
	OnCanvasObject.call(sel, x, y, width, height);
	
	sel.$el.addClass("selection");

	var last_transparent_opaque_option = transparent_opaque;
	var last_background_color = colors.background;

	this._on_option_changed = function(){
		if(!sel.source_canvas){
			return;
		}
		if(
			last_transparent_opaque_option !== transparent_opaque ||
			last_background_color !== colors.background
		){
			last_transparent_opaque_option = transparent_opaque;
			last_background_color = colors.background;
			sel.update_transparent_opaque();
		}
	};
	$G.on("option-changed", this._on_option_changed);
}

Selection.prototype = Object.create(OnCanvasObject.prototype);

Selection.prototype.instantiate = function(_img, _passive){
	var sel = this;
	
	sel.$el.addClass("instantiated").css({
		cursor: Cursor(["move", [8, 8], "move"])
	});
	sel.$el.attr("touch-action", "none");
	sel.position();
	
	if(_passive){
		instantiate();
	}else if(!undoable(instantiate)){
		sel.destroy();
	}
	
	function instantiate(){
		if(_img){
			// (this applies when pasting a selection)
			// NOTE: need to create a Canvas because something about imgs makes dragging not work with magnification
			// (width vs naturalWidth?)
			// and at least apply_image_transformation needs it to be a canvas now (and the property name says canvas anyways)
			sel.source_canvas = new Canvas(_img);
			// TODO: is this width/height code needed? probably not! wouldn't it clear the canvas anyways?
			// but maybe we should assert in some way that the widths are the same, or resize the selection?
			if(sel.source_canvas.width !== sel.width){ sel.source_canvas.width = sel.width; }
			if(sel.source_canvas.height !== sel.height){ sel.source_canvas.height = sel.height; }
			sel.canvas = new Canvas(sel.source_canvas);
		}else{
			sel.source_canvas = new Canvas(sel.width, sel.height);
			sel.source_canvas.ctx.drawImage(
				canvas,
				sel.x, sel.y,
				sel.width, sel.height,
				0, 0,
				sel.width, sel.height
			);
			sel.canvas = new Canvas(sel.source_canvas);
			if(!_passive){
				sel.cut_out_background();
			}
		}
		sel.$el.append(sel.canvas);
		
		sel.$handles = $Handles(sel.$el, sel.canvas, {outset: 2});
		
		sel.$el.on("user-resized", function(e, delta_x, delta_y, width, height){
			sel.x += delta_x;
			sel.y += delta_y;
			sel.width = width;
			sel.height = height;
			sel.position();
			sel.resize();
		});
		
		var mox, moy;
		var pointermove = function(e){
			var m = e2c(e);
			sel.x = Math.max(Math.min(m.x - mox, canvas.width), -sel.width);
			sel.y = Math.max(Math.min(m.y - moy, canvas.height), -sel.height);
			sel.position();
			
			if(e.shiftKey){
				sel.draw();
			}
		};
		
		sel.canvas_pointerdown = function(e){
			e.preventDefault();
			
			var rect = sel.canvas.getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			mox = ~~(cx / rect.width * sel.canvas.width);
			moy = ~~(cy / rect.height * sel.canvas.height);
			
			$G.on("pointermove", pointermove);
			$G.one("pointerup", function(){
				$G.off("pointermove", pointermove);
			});
			
			if(e.shiftKey){
				sel.draw();
			}
		};
		
		$(sel.canvas).on("pointerdown", sel.canvas_pointerdown);
		$canvas_area.trigger("resize");
		$status_position.text("");
		$status_size.text("");
		
	}
};

Selection.prototype.cut_out_background = function(){
	var sel = this;
	var cutout = sel.canvas;

	// doc/sel or canvas/cutout, either of those pairs would result in variable names of equal length which is nice :)
	var canvasImageData = ctx.getImageData(sel.x, sel.y, sel.width, sel.height);
	var cutoutImageData = cutout.ctx.getImageData(0, 0, sel.width, sel.height);
	// cutoutImageData is initialzed with the shape to be cut out (whether rectangular or polygonal)
	// and should end up as the cut out image data for the selection
	// canvasImageData is initially the portion of image data on the canvas,
	// and should end up as... the portion of image data on the canvas that it should end up as.

	// TODO: could simplify by making the later (shared) condition just if(colored_cutout){}
	// but might change how it works anyways so whatever
	// if(!transparency){ // now if !transparency or if transparent_opaque == "transparent"
		// this is mainly in order to support patterns as the background color
		// NOTE: must come before cutout canvas is modified
		var colored_cutout = new Canvas(cutout);
		colored_cutout.ctx.globalCompositeOperation = "source-in";
		colored_cutout.ctx.fillStyle = colors.background;
		colored_cutout.ctx.fillRect(0, 0, colored_cutout.width, colored_cutout.height);
		var colored_cutout_image_data = colored_cutout.ctx.getImageData(0, 0, sel.width, sel.height);
	// }

	for(var i=0; i<cutoutImageData.data.length; i+=4){
		var in_cutout = cutoutImageData.data[i+3] > 0;
		if(in_cutout){
			cutoutImageData.data[i+0] = canvasImageData.data[i+0];
			cutoutImageData.data[i+1] = canvasImageData.data[i+1];
			cutoutImageData.data[i+2] = canvasImageData.data[i+2];
			cutoutImageData.data[i+3] = canvasImageData.data[i+3];
			canvasImageData.data[i+0] = 0;
			canvasImageData.data[i+1] = 0;
			canvasImageData.data[i+2] = 0;
			canvasImageData.data[i+3] = 0;
		}else{
			cutoutImageData.data[i+0] = 0;
			cutoutImageData.data[i+1] = 0;
			cutoutImageData.data[i+2] = 0;
			cutoutImageData.data[i+3] = 0;
		}
	}
	ctx.putImageData(canvasImageData, sel.x, sel.y);
	cutout.ctx.putImageData(cutoutImageData, 0, 0);

	sel.update_transparent_opaque();

	// NOTE: in case you want to use the transparent_opaque=="transparent" mode
	// in a document with transparency (for an operation in an area where there's a local background color)
	// (and since currently switching to the opaque document mode makes the image opaque)
	// (and it would be complicated to make it update the canvas when switching tool options (as opposed to just the selection))
	// I'm having it use the transparent_opaque option here, so you could at least choose beforehand
	// (and this might actually give you more options, although it could be confusingly inconsistent)
	// FIXME: yeah, this is confusing; if you have both transparency modes on and you try to clear an area to transparency, it doesn't work
	// and there's no indication that you should try the other selection transparency mode,
	// and even if you do, if you do it after creating a selection, it still won't work,
	// because you will have already *not cut out* the selection from the canvas
	if(!transparency || transparent_opaque=="transparent"){
		ctx.drawImage(colored_cutout, sel.x, sel.y);
	}
};

Selection.prototype.update_transparent_opaque = function(){
	var sel = this;

	var sourceImageData = sel.source_canvas.ctx.getImageData(0, 0, sel.width, sel.height);
	var cutoutImageData = sel.canvas.ctx.createImageData(sel.width, sel.height);
	var background_color_rgba = get_rgba_from_color(colors.background);
	// NOTE: In b&w mode, mspaint treats the transparency color as white,
	// regardless of the pattern selected, even if the selected background color is pure black.
	// We allow any kind of image data while in our "b&w mode".
	// Our b&w mode is essentially 'patterns in the palette'.

	for(var i=0; i<cutoutImageData.data.length; i+=4){
		var in_cutout = sourceImageData.data[i+3] > 0;
		if(transparent_opaque == "transparent"){
			// FIXME: work with transparent selected background color
			// (support treating partially transparent background colors as transparency)
			if(
				sourceImageData.data[i+0] === background_color_rgba[0] &&
				sourceImageData.data[i+1] === background_color_rgba[1] &&
				sourceImageData.data[i+2] === background_color_rgba[2] &&
				sourceImageData.data[i+3] === background_color_rgba[3]
			){
				in_cutout = false;
			}
		}
		if(in_cutout){
			cutoutImageData.data[i+0] = sourceImageData.data[i+0];
			cutoutImageData.data[i+1] = sourceImageData.data[i+1];
			cutoutImageData.data[i+2] = sourceImageData.data[i+2];
			cutoutImageData.data[i+3] = sourceImageData.data[i+3];
		}else{
			// cutoutImageData.data[i+0] = 0;
			// cutoutImageData.data[i+1] = 0;
			// cutoutImageData.data[i+2] = 0;
			// cutoutImageData.data[i+3] = 0;
		}
	}
	sel.canvas.ctx.putImageData(cutoutImageData, 0, 0);
};

// TODO: should Image > Invert apply to sel.source_canvas or to sel.canvas (replacing sel.source_canvas with the result)?

Selection.prototype.replace_source_canvas = function(new_source_canvas){
	var sel = this;

	sel.source_canvas = new_source_canvas;

	var new_canvas = new Canvas(new_source_canvas);
	$(sel.canvas).replaceWith(new_canvas);
	sel.canvas = new_canvas;

	var center_x = sel.x + sel.width/2;
	var center_y = sel.y + sel.height/2;
	var new_width = new_canvas.width;
	var new_height = new_canvas.height;
	
	// NOTE: flooring the coordinates to integers avoids blurring
	// but it introduces "inching", where the selection can move along by pixels if you rotate it repeatedly
	// could introduce an "error offset" just to avoid this but that seems overkill
	// and then that would be weird hidden behavior, probably not worth it
	// Math.round() might make it do it on fewer occasions(?),
	// but then it goes down *and* to the right, 2 directions vs One Direction
	// and Math.ceil() is the worst of both worlds
	sel.x = ~~(center_x - new_width/2);
	sel.y = ~~(center_y - new_height/2);
	sel.width = new_width;
	sel.height = new_height;
	
	sel.position();
	
	$(sel.canvas).on("pointerdown", sel.canvas_pointerdown);
	sel.$el.triggerHandler("new-element", [sel.canvas]);
	sel.$el.triggerHandler("resize");//?

	sel.update_transparent_opaque();
};

Selection.prototype.resize = function(){
	var sel = this;
	
	var new_source_canvas = new Canvas(sel.width, sel.height);
	new_source_canvas.ctx.drawImage(sel.source_canvas, 0, 0, sel.width, sel.height);
	
	sel.replace_source_canvas(new_source_canvas);
};

Selection.prototype.scale = function(factor){
	var sel = this;
	
	var new_source_canvas = new Canvas(sel.width * factor, sel.height * factor);
	new_source_canvas.ctx.drawImage(sel.source_canvas, 0, 0, new_source_canvas.width, new_source_canvas.height);

	sel.replace_source_canvas(new_source_canvas);
};

Selection.prototype.draw = function(){
	try{ctx.drawImage(this.canvas, this.x, this.y);}catch(e){}
};

Selection.prototype.destroy = function(){
	OnCanvasObject.prototype.destroy.call(this);
	$G.triggerHandler("session-update"); // what does this mean, and why is it needed?
	$G.off("option-changed", this._on_option_changed);
};

Selection.prototype.crop = function(){
	var sel = this;
	sel.instantiate(null, "passive");
	if(sel.canvas){
		undoable(0, function(){
			ctx.copy(sel.canvas);
			$canvas_area.trigger("resize");
		});
	}
};
