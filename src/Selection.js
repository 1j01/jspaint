
function Selection(x, y, width, height){
	OnCanvasObject.call(this, x, y, width, height);
	
	this.$el.addClass("selection");
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
			// NOTE: need to create a Canvas because something about imgs makes dragging not work with magnification
			// (width vs naturalWidth?)
			// it is called sel.canvas after all tho
			sel.canvas = new Canvas(_img);
			if(sel.canvas.width !== sel.width){ sel.canvas.width = sel.width; }
			if(sel.canvas.height !== sel.height){ sel.canvas.height = sel.height; }
		}else{
			sel.canvas = new Canvas(sel.width, sel.height);
			sel.canvas.ctx.drawImage(
				canvas,
				sel.x, sel.y,
				sel.width, sel.height,
				0, 0,
				sel.width, sel.height
			);
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

	// doc/sel or canvas/cutout, either of which would be the same variable name length which is nice
	var canvasImageData = ctx.getImageData(sel.x, sel.y, sel.width, sel.height);
	var cutoutImageData = cutout.ctx.getImageData(0, 0, sel.width, sel.height);
	// cutoutImageData is initialzed with the shape to be cut out (whether rectangular or polygonal)
	// and should end up as the cut out image data for the selection
	// canvasImageData is initially the portion of image data on the canvas,
	// and should end up as... the portion of image data on the canvas that it should end up as.

	// if(!transparency){ // now if !transparency or if transparent_opaque == "transparent"
		// this is mainly in order to support patterns as the background color
		// NOTE: must come before cutout canvas is modified
		var colored_canvas = new Canvas(cutout);
		colored_canvas.ctx.globalCompositeOperation = "source-in";
		colored_canvas.ctx.fillStyle = colors.background;
		colored_canvas.ctx.fillRect(0, 0, colored_canvas.width, colored_canvas.height);
		var colored_canvas_image_data = colored_canvas.ctx.getImageData(0, 0, sel.width, sel.height);
		// TODO: should we check based on patterns for the background for transparent_opaque == "transparent"
		// or should we only check against a solid color? if so, from what offset in the pattern?
		// or should the feature be disabled?
		// let's see...
		// mspaint treats it as white, regardless of the pattern, even if the selected background is pure black
		// we should probably do something more like that, but...
		// we allow any kind of image data while in our "b&w mode"
		// our b&w mode is basically patterns in the palette
	// }

	for(var i=0; i<cutoutImageData.data.length; i+=4){
		var in_cutout = cutoutImageData.data[i+3] > 0;
		if(transparent_opaque == "transparent"){
			// TODO: support switching the transparent_opaque tool option
			// so remove this code from here, and store a hidden source canvas for the selection
			// and apply this logic when switching tool options based on that offscreen canvas,
			// updating the sel.canvas
			// FIXME: work with transparent selected background color
			// (support treating partially transparent background colors as transparency)
			if(
				canvasImageData.data[i+0] === colored_canvas_image_data.data[i+0] &&
				canvasImageData.data[i+1] === colored_canvas_image_data.data[i+1] &&
				canvasImageData.data[i+2] === colored_canvas_image_data.data[i+2] &&
				canvasImageData.data[i+3] === colored_canvas_image_data.data[i+3]
			){
				in_cutout = false;
			}
		}
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

	if(!transparency){
		ctx.drawImage(colored_canvas, sel.x, sel.y);
	}
};

Selection.prototype.resize = function(){
	var sel = this;
	var new_width = sel.width;
	var new_height = sel.height;
	
	var new_canvas = new Canvas(new_width, new_height);
	new_canvas.ctx.drawImage(sel.canvas, 0, 0, new_width, new_height);
	
	sel.replace_canvas(new_canvas);
};

Selection.prototype.replace_canvas = function(new_canvas){
	var sel = this;
	
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
	
	$(sel.canvas).replaceWith(new_canvas);
	sel.canvas = new_canvas;
	
	$(sel.canvas).on("pointerdown", sel.canvas_pointerdown);
	sel.$el.triggerHandler("new-element", [sel.canvas]);
	sel.$el.triggerHandler("resize");//?
};

Selection.prototype.scale = function(factor){
	var sel = this;
	
	var original_canvas = sel.canvas;
	
	var new_canvas = new Canvas(sel.width * factor, sel.height * factor);
	sel.replace_canvas(new_canvas);
	
	new_canvas.ctx.drawImage(original_canvas, 0, 0, new_canvas.width, new_canvas.height);
};

Selection.prototype.draw = function(){
	try{ctx.drawImage(this.canvas, this.x, this.y);}catch(e){}
};

Selection.prototype.destroy = function(){
	OnCanvasObject.prototype.destroy.call(this);
	$G.triggerHandler("session-update");
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
