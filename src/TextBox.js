
function TextBox(x, y, width, height){
	var tb = this;
	
	OnCanvasObject.call(tb, x, y, width, height);
	
	tb.$el.addClass("jspaint-textbox");
	tb.$editor = $(E("textarea")).addClass("jspaint-textbox-editor");
	
	var update = function(){
		font.color = colors.foreground;
		font.background = ({
			transparent: "transparent",
			opaque: colors.background,
		}[transparent_opaque]);
		
		tb.$editor.css({
			fontFamily: font.family,
			fontSize: font.size * magnification + "px",
			fontWeight: font.bold ? "bold" : "normal",
			fontStyle: font.italic ? "italic" : "normal",
			textDecoration: font.underline ? "underline" : "none",
			writingMode: font.vertical ? "vertical-lr" : "",
			oWritingMode: font.vertical ? "vertical-lr" : "",
			msWritingMode: font.vertical ? "vertical-lr" : "",
			mozWritingMode: font.vertical ? "vertical-lr" : "",
			kxmlWritingMode: font.vertical ? "vertical-lr" : "",
			khtmlWritingMode: font.vertical ? "vertical-lr" : "",
			webkitWritingMode: font.vertical ? "vertical-lr" : "",
			linesupWritingMode: font.vertical ? "vertical-lr" : "",
			nonsenseWritingMode: font.vertical ? "vertical-lr" : "",
			totesfakeWritingMode: font.vertical ? "vertical-lr" : "",
			lineHeight: font.size * font.line_scale * magnification + "px",
			color: font.color,
			background: font.background,
		});
	};
	update();
	$G.on("option-changed", update);
}

TextBox.prototype = Object.create(OnCanvasObject.prototype);

TextBox.prototype.instantiate = function(){
	var tb = this;
	
	tb.$el.addClass("instantiated").css({
		cursor: Cursor(["move", [8, 8], "move"])
	});
	tb.$el.attr("touch-action", "none");
	
	tb.position();
	
	instantiate();
	
	if(TextBox.$fontbox && TextBox.$fontbox.closed){
		TextBox.$fontbox = null;
	}
	var $fb = TextBox.$fontbox = TextBox.$fontbox || new $FontBox();
	
	// move the font box out of the way if it's overlapping the TextBox
	var $tb = tb.$el;
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
		
		tb.$el.append(tb.$editor);
		tb.$editor.focus();
		
		//tb.$handles = $Handles(tb.$el, tb.$editor[0], {outset: 2});
		
		tb.$el.on("user-resized", function(e, x, y, width, height){
			//tb.x = x;
			//tb.y = y;
			tb.width = width;
			tb.height = height;
			tb.position();
		});
		
		var mox, moy;
		var pointermove = function(e){
			var m = e2c(e);
			tb.x = Math.max(Math.min(m.x - mox, canvas.width), -tb.width);
			tb.y = Math.max(Math.min(m.y - moy, canvas.height), -tb.height);
			tb.position();
			
			if(e.shiftKey){
				tb.draw();
			}
		};
		tb.$el.on("pointerdown", function(e){
			if(
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			){
				return;
			}
			e.preventDefault();
			
			var rect = tb.$el[0].getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			mox = ~~(cx);
			moy = ~~(cy);
			
			$G.on("pointermove", pointermove);
			$G.one("pointerup", function(){
				$G.off("pointermove", pointermove);
			});
			
		});
		$status_position.text("");
		$status_size.text("");
		
		$canvas_area.trigger("resize"); // ?
	}
};

TextBox.prototype.draw = function(){
	var tb = this;
	var text = tb.$editor.val();
	if(text){
		undoable(0, function(){
			ctx.fillStyle = font.background;
			ctx.fillRect(tb.x, tb.y, tb.width, tb.height);
			
			ctx.fillStyle = font.color;
			var style_ = (font.bold ? (font.italic ? "italic bold " : "bold ") : (font.italic ? "italic " : ""));
			ctx.font = style_ + font.size + "px " + font.family;
			ctx.textBaseline = "middle";
			var lines = text.split("\n")
			for(var i=0; i<lines.length; i++){
				ctx.fillText(lines[i], tb.x+1, tb.y+1 + (i+0.5)*(font.size * font.line_scale), tb.width);
			}
		});
	}
};

TextBox.prototype.destroy = function(){
	OnCanvasObject.prototype.destroy.call(this);
	
	if(TextBox.$fontbox && !TextBox.$fontbox.closed){
		TextBox.$fontbox.close();
	}
	TextBox.$fontbox = null;
};
