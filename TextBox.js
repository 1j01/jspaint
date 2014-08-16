
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
	
	var update = function(){
		font.color = colors[0];
		font.background = ({
			transparent: "transparent",
			opaque: colors[1]
		}[transparent_opaque]);
		
		tb.$editor.css({
			fontFamily: font.family,
			fontSize: font.size + "px",
			fontWeight: font.bold ? "bold" : "normal",
			fontStyle: font.italic ? "italic" : "none",
			textDecoration: font.underline ? "underline" : "none",
			writingMode: font.vertical ? "vertical-lr" : "",
			oWritingMode: font.vertical ? "vertical-lr" : "",
			msWritingMode: font.vertical ? "vertical-lr" : "",
			mozWritingMode: font.vertical ? "vertical-lr" : "",
			kxmlWritingMode: font.vertical ? "vertical-lr" : "",
			khtmlWritingMode: font.vertical ? "vertical-lr" : "",
			webkitWritingMode: font.vertical ? "vertical-lr" : "",
			lineHeight: font.size * font.line_scale + "px",
			color: font.color,
			background: font.background
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
	
	if(TextBox.$fontbox && TextBox.$fontbox.closed){
		TextBox.$fontbox = null;
	}
	var $fb = TextBox.$fontbox = TextBox.$fontbox || new $FontBox();
	
	// move the font box out of the way if it's overlapping the TextBox
	var $tb = tb.$ghost;
	var fb_rect = $fb[0].getBoundingClientRect();
	var tb_rect = $tb[0].getBoundingClientRect();
	
	if(
		// the fontbox overlaps textbox
		fb_rect.left <= tb_rect.right &&
		tb_rect.left <= fb_rect.right &&
		fb_rect.top <= tb_rect.bottom &&
		tb_rect.top <= fb_rect.bottom
	){
		// move the font box out of the way
		$fb.css({
			top: $tb.position().top - $fb.height()
		});
	}
		
	$fb.applyBounds();
	
	function instantiate(){
		// this doesn't need to be a seperate function
		
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
			ctx.fillStyle = font.background;
			ctx.fillRect(tb._x, tb._y, tb._w, tb._h);
			
			ctx.fillStyle = font.color;
			var style_ = (font.bold ? (font.italic ? "italic bold " : "bold ") : (font.italic ? "italic " : ""));
			ctx.font = style_ + font.size + "px " + font.family;
			ctx.textBaseline = "middle";
			var lines = text.split("\n")
			for(var i=0; i<lines.length; i++){
				ctx.fillText(lines[i], tb._x+1, tb._y+1 + (i+0.5)*(font.size * font.line_scale), tb._w);
			}
		});
	}
};

TextBox.prototype.destroy = function(){
	this.$ghost.remove();
	$canvas_handles.show();
	
	if(TextBox.$fontbox && !TextBox.$fontbox.closed){
		TextBox.$fontbox.close();
	}
	TextBox.$fontbox = null;
};
