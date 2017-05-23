
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
			sel.canvas = _img;
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
	if(transparency){
		// @FIXME: this doesn't work well with transparency between 0 and 1
		ctx.save();
		ctx.globalCompositeOperation = "destination-out";
		ctx.drawImage(cutout, sel.x, sel.y);
		ctx.restore();
	}else{
		var colored_canvas = new Canvas(cutout);
		colored_canvas.ctx.globalCompositeOperation = "source-in";
		colored_canvas.ctx.fillStyle = colors.background;
		colored_canvas.ctx.fillRect(0, 0, colored_canvas.width, colored_canvas.height);
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
	
	var cx = sel.x + sel.width/2;
	var cy = sel.y + sel.height/2;
	var new_width = new_canvas.width;
	var new_height = new_canvas.height;
	
	sel.x = cx - new_width/2;
	sel.y = cy - new_height/2;
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
