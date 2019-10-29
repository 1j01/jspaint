
class OnCanvasTextBox extends OnCanvasObject {
	constructor(x, y, width, height) {
		super(x, y, width, height, true);

		var tb = this;
		tb.$el.addClass("textbox");
		tb.$editor = $(E("textarea")).addClass("textbox-editor");
		var update = function () {
			var font = text_tool_font;
			font.color = colors.foreground;
			font.background = tool_transparent_mode ? "transparent" : colors.background;
			tb.$editor.css({
				fontFamily: font.family,
				fontSize: font.size * magnification + "px",
				fontWeight: font.bold ? "bold" : "normal",
				fontStyle: font.italic ? "italic" : "normal",
				textDecoration: font.underline ? "underline" : "none",
				writingMode: font.vertical ? "vertical-lr" : "",
				MsWritingMode: font.vertical ? "vertical-lr" : "",
				WebkitWritingMode: font.vertical ? "vertical-lr" : "",
				lineHeight: font.size * font.line_scale * magnification + "px",
				color: font.color,
				background: font.background,
			});
		};
		update();
		$G.on("option-changed", this._on_option_changed = update);
		tb.$el.css({
			cursor: Cursor(["move", [8, 8], "move"])
		});
		tb.$el.attr("touch-action", "none");
		tb.position();
		tb.$el.append(tb.$editor);
		tb.$editor[0].focus();
		tb.$handles = $Handles(tb.$el, tb.$editor[0], { outset: 2 });
		tb.$el.on("user-resized", function (e, delta_x, delta_y, width, height) {
			tb.x += delta_x;
			tb.y += delta_y;
			tb.width = width;
			tb.height = height;
			tb.position();
		});
		var mox, moy;
		var pointermove = function (e) {
			var m = e2c(e);
			tb.x = Math.max(Math.min(m.x - mox, canvas.width), -tb.width);
			tb.y = Math.max(Math.min(m.y - moy, canvas.height), -tb.height);
			tb.position();
			if (e.shiftKey) {
				tb.draw();
			}
		};
		tb.$el.on("pointerdown", function (e) {
			if (e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target.classList.contains("handle")) {
				return;
			}
			e.preventDefault();
			var rect = tb.$el[0].getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			mox = ~~(cx);
			moy = ~~(cy);
			$G.on("pointermove", pointermove);
			$G.one("pointerup", function () {
				$G.off("pointermove", pointermove);
			});
		});
		$status_position.text("");
		$status_size.text("");
		$canvas_area.trigger("resize"); // to update handles, get them to hide?
		if (OnCanvasTextBox.$fontbox && OnCanvasTextBox.$fontbox.closed) {
			OnCanvasTextBox.$fontbox = null;
		}
		var $fb = OnCanvasTextBox.$fontbox = OnCanvasTextBox.$fontbox || new $FontBox();
		// move the font box out of the way if it's overlapping the OnCanvasTextBox
		var $tb = tb.$el;
		var fb_rect = $fb[0].getBoundingClientRect();
		var tb_rect = $tb[0].getBoundingClientRect();
		if (
			// the fontbox overlaps textbox
			fb_rect.left <= tb_rect.right &&
			tb_rect.left <= fb_rect.right &&
			fb_rect.top <= tb_rect.bottom &&
			tb_rect.top <= fb_rect.bottom) {
			// move the font box out of the way
			$fb.css({
				top: $tb.position().top - $fb.height()
			});
		}
		$fb.applyBounds();
	}
	position() {
		OnCanvasObject.prototype.position.call(this, true);
	}
	draw() {
		var tb = this;
		var text = tb.$editor.val();
		if (text) {
			undoable(0, function () {
				var font = text_tool_font;
				ctx.fillStyle = font.background;
				ctx.fillRect(tb.x, tb.y, tb.width, tb.height);
				ctx.fillStyle = font.color;
				var style_ = (font.bold ? (font.italic ? "italic bold " : "bold ") : (font.italic ? "italic " : ""));
				ctx.font = style_ + font.size + "px " + font.family;
				ctx.textBaseline = "top";
				var max_width = Math.max(tb.width, font.size);
				draw_text_wrapped(ctx, text, tb.x + 1, tb.y + 1, max_width, font.size * font.line_scale);
			});
		}
	}
	destroy() {
		OnCanvasObject.prototype.destroy.call(this);
		if (OnCanvasTextBox.$fontbox && !OnCanvasTextBox.$fontbox.closed) {
			OnCanvasTextBox.$fontbox.close();
		}
		OnCanvasTextBox.$fontbox = null;
		$G.off("option-changed", this._on_option_changed);
	}
}

function draw_text_wrapped(ctx, text, x, y, maxWidth, lineHeight) {
	var original_lines = text.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
	for(var j = 0; j < original_lines.length; j++){
		var original_line = original_lines[j];
		var words = original_line.split(' ');
		var line = '';
		var test;
		var metrics;
		for (var i = 0; i < words.length; i++) {
			test = words[i];
			metrics = ctx.measureText(test);
			// TODO: break words on hyphens and perhaps other characters
			while (metrics.width > maxWidth) {
				// Determine how much of the word will fit
				test = test.substring(0, test.length - 1);
				metrics = ctx.measureText(test);
			}
			if (words[i] != test) {
				words.splice(i + 1, 0,  words[i].substr(test.length));
				words[i] = test;
			}
			
			test = line + words[i] + ' ';
			metrics = ctx.measureText(test);
			
			if (metrics.width > maxWidth && i > 0) {
				ctx.fillText(line, x, y);
				line = words[i] + ' ';
				y += lineHeight;
			} else {
				line = test;
			}
		}
		ctx.fillText(line, x, y);
		y += lineHeight;
	}
}
