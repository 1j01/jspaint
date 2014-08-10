
function TextBox(x, y, w, h){
	var tb = this;
	
	tb.x = x;
	tb.y = y;
	tb.w = w;
	tb.h = h;
	tb._x = x;
	tb._y = y;
	tb._w = w;
	tb._h = h;
	
	tb.$ghost = $(E("div")).addClass("jspaint-textbox").appendTo($canvas_area);
	tb.$editor = $(E("textarea")).addClass("jspaint-textbox-editor");
	tb.$editor.on("mousedown dragover dragenter drop contextmenu", function(e){
		e.stopPropagation();
	});
	
	tb.fontFamily = "Arial";
	tb.fontSize = "12pt";
	tb.lineHeight = 20;
	
	var update = function(){
		tb.color = colors[0];
		tb.background = ({
			transparent: "transparent",
			opaque: colors[1]
		}[transparent_opaque]);
		
		tb.$editor.css({
			fontFamily: tb.fontFamily,
			fontSize: tb.fontSize,
			lineHeight: tb.lineHeight + "px",
			color: tb.color,
			background: tb.background
		});
	};
	update();
	$G.on("option-changed", update);
	
	$canvas_handles.hide();
}

TextBox.prototype.instantiate = function(){
	var tb = this;
	
	tb.$ghost.addClass("instantiated").css({
		cursor: Cursor(["move", [8, 8], "move"])
	});
	tb.position();
	
	instantiate();
	
	function instantiate(){
		
		tb.$ghost.append(tb.$editor);
		tb.$editor.focus();
		
		var mox, moy;
		var mousemove = function(e){
			var m = e2c(e);
			tb._x = Math.max(Math.min(m.x - mox, canvas.width), -tb._w);
			tb._y = Math.max(Math.min(m.y - moy, canvas.height), -tb._h);
			tb.position();
			
			if(e.shiftKey){
				tb.draw();
			}
		};
		tb.$ghost.on("mousedown", function(e){
			e.preventDefault();
			
			var rect = tb.$ghost[0].getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			mox = ~~(cx);
			moy = ~~(cy);
			
			$G.on("mousemove", mousemove);
			$G.one("mouseup", function(){
				$G.off("mousemove", mousemove);
			});
			
		});
		$status_position.text("");
		$status_size.text("");
		
		$canvas_area.trigger("resize");
	}
};

TextBox.prototype.position = function(){
	this.$ghost.css({
		position: "absolute",
		left: this._x + 3,
		top: this._y + 3,
		width: this._w,
		height: this._h,
	});
	$status_position.text(this._x + "," + this._y);
	$status_size.text(this._w + "," + this._h);
};

TextBox.prototype.draw = function(){
	var tb = this;
	var text = tb.$editor.val();
	if(text){
		undoable(0, function(){
			ctx.fillStyle = tb.background;
			ctx.fillRect(tb._x, tb._y, tb._w, tb._h);
			
			ctx.fillStyle = tb.color;
			ctx.font = tb.fontSize + " " + tb.fontFamily;
			ctx.textBaseline = "middle";
			var lines = text.split("\n")
			for(var i=0; i<lines.length; i++){
				ctx.fillText(lines[i], tb._x+1, tb._y+1 + (i+0.5)*tb.lineHeight, tb._w);
			}
		});
	}
};

TextBox.prototype.destroy = function(){
	this.$ghost.remove();
	$canvas_handles.show();
};
