
function Selection(x, y, w, h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this._x = x;
	this._y = y;
	this._w = w;
	this._h = h;
	
	this.$ghost = $(E("div")).addClass("jspaint-selection").appendTo($canvas_area);
	
	$canvas_handles.hide();
}

Selection.prototype.instantiate = function(_img, _passive){
	var sel = this;
	
	sel.$ghost.addClass("instantiated").css({
		cursor: Cursor(["move", [8, 8], "move"])
	});
	sel.position();
	
	if(_passive){
		instantiate();
	}else if(!undoable(instantiate)){
		sel.destroy();
	}
	
	function instantiate(){
		if(_img){
			sel.canvas = _img;
			if(sel.canvas.width !== sel._w){ sel.canvas.width = sel._w; }
			if(sel.canvas.height !== sel._h){ sel.canvas.height = sel._h; }
		}else{
			sel.canvas = new Canvas(sel._w, sel._h);
			sel.canvas.ctx.drawImage(
				canvas,
				sel._x, sel._y,
				sel._w, sel._h,
				0, 0,
				sel._w, sel._h
			);
			if(!_passive){
				sel.cut_out_background();
			}
		}
		sel.$ghost.append(sel.canvas);
		
		//sel.$handles = $Handles(sel.$ghost, sel.canvas, {outset: 2});
		
		sel.$ghost.on("user-resized", function(e, x, y, width, height){
			//tb._x = x;
			//tb._y = y;
			sel._w = width;
			sel._h = height;
			sel.position();
			sel.resize();
		});
		
		var mox, moy;
		var mousemove = function(e){
			var m = e2c(e);
			sel._x = Math.max(Math.min(m.x - mox, canvas.width), -sel._w);
			sel._y = Math.max(Math.min(m.y - moy, canvas.height), -sel._h);
			sel.position();
			
			if(e.shiftKey){
				sel.draw();
			}
		};
		
		sel.canvas_mousedown = function(e){
			e.preventDefault();
			
			var rect = sel.canvas.getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			mox = ~~(cx / rect.width * sel.canvas.width);
			moy = ~~(cy / rect.height * sel.canvas.height);
			
			$G.on("mousemove", mousemove);
			$G.one("mouseup", function(){
				$G.off("mousemove", mousemove);
			});
			
			if(e.shiftKey){
				sel.draw();
			}
		};
		
		$(sel.canvas).on("mousedown", sel.canvas_mousedown);
		$canvas_area.trigger("resize");
		$status_position.text("");
		$status_size.text("");
		
	}
};

Selection.prototype.cut_out_background = function(){
	var sel = this;
	var cutout = sel.canvas;
	if(transparency){
		ctx.save();
		ctx.globalCompositeOperation = "destination-out";
		ctx.drawImage(cutout, sel._x, sel._y);
		ctx.restore();
	}else{
		var colored_canvas = new Canvas(cutout);
		colored_canvas.ctx.globalCompositeOperation = "source-in";
		colored_canvas.ctx.fillStyle = colors[1];
		colored_canvas.ctx.fillRect(0, 0, colored_canvas.width, colored_canvas.height);
		ctx.drawImage(colored_canvas, sel._x, sel._y);
	}
};

Selection.prototype.position = function(){
	var z = (+$canvas.css("zoom")||1);
	this.$ghost.css({
		position: "absolute",
		left: z * this._x + 3,
		top: z * this._y + 3,
		width: z * this._w,
		height: z * this._h,
	});
	$status_position.text(this._x + "," + this._y);
	$status_size.text(this._w + "," + this._h);
};

Selection.prototype.resize = function(){
	var sel = this;
	var width = sel._w;
	var height = sel._h;
	
	var new_canvas = new Canvas(width, height);
	
	new_canvas.ctx.drawImage(sel.canvas, 0, 0, width, height);
	
	sel.replace_canvas(new_canvas);
};

Selection.prototype.replace_canvas = function(new_canvas){
	var sel = this;
	
	var cx = sel._x + sel._w/2;
	var cy = sel._y + sel._h/2;
	var new_width = new_canvas.width;
	var new_height = new_canvas.height;
	
	sel._x = cx - new_width/2;
	sel._y = cy - new_height/2;
	sel._w = new_width;
	sel._h = new_height;
	
	sel.position();
	
	$(sel.canvas).replaceWith(new_canvas);
	sel.canvas = new_canvas;

	$(sel.canvas).on("mousedown", sel.canvas_mousedown);
	sel.$ghost.triggerHandler("new-element", [sel.canvas]);
	sel.$ghost.triggerHandler("resize");//?
};

Selection.prototype.scale = function(factor){
	var sel = this;
	
	var original_canvas = sel.canvas;
	
	var new_canvas = new Canvas(sel._w * factor, sel._h * factor);
	sel.replace_canvas(new_canvas);
	
	new_canvas.ctx.drawImage(original_canvas, 0, 0, new_canvas.width, new_canvas.height);
};

Selection.prototype.draw = function(){
	try{ctx.drawImage(this.canvas, this._x, this._y);}catch(e){}
};

Selection.prototype.destroy = function(){
	this.$ghost.remove();
	$canvas_handles.show();
	$G.triggerHandler("session-update");
};

Selection.prototype.crop = function(){
	var sel = this;
	sel.instantiate(null, "passive");
	if(sel.canvas){
		undoable(0, function(){
			canvas.width = sel.canvas.width;
			canvas.height = sel.canvas.height;
			ctx.drawImage(sel.canvas, 0, 0);
			$canvas.trigger("update"); //update handles
		});
	}
};
