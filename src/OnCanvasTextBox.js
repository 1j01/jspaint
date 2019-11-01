
class OnCanvasTextBox extends OnCanvasObject {
	constructor(x, y, width, height) {
		super(x, y, width, height, true);

		this.$el.addClass("textbox");
		this.$editor = $(E("textarea")).addClass("textbox-editor");
		const update = () => {
			const font = text_tool_font;
			font.color = colors.foreground;
			font.background = tool_transparent_mode ? "transparent" : colors.background;
			this.$editor.css({
				fontFamily: font.family,
				fontSize: `${font.size * magnification}px`,
				fontWeight: font.bold ? "bold" : "normal",
				fontStyle: font.italic ? "italic" : "normal",
				textDecoration: font.underline ? "underline" : "none",
				writingMode: font.vertical ? "vertical-lr" : "",
				MsWritingMode: font.vertical ? "vertical-lr" : "",
				WebkitWritingMode: font.vertical ? "vertical-lr" : "",
				lineHeight: `${font.size * font.line_scale * magnification}px`,
				color: font.color,
				background: font.background,
			});
		};
		update();
		$G.on("option-changed", this._on_option_changed = update);
		
		this.$el.css({
			cursor: make_css_cursor("move", [8, 8], "move")
		});
		this.$el.attr("touch-action", "none");
		this.position();
		
		this.$el.append(this.$editor);
		this.$editor[0].focus();
		this.$handles = $Handles(this.$el, this.$editor[0], { outset: 2 });
		this.$el.on("user-resized", (e, delta_x, delta_y, width, height) => {
			this.x += delta_x;
			this.y += delta_y;
			this.width = width;
			this.height = height;
			this.position();
		});
		let mox, moy;
		const pointermove = e => {
			const m = to_canvas_coords(e);
			this.x = Math.max(Math.min(m.x - mox, canvas.width), -this.width);
			this.y = Math.max(Math.min(m.y - moy, canvas.height), -this.height);
			this.position();
			if (e.shiftKey) {
				this.draw();
			}
		};
		this.$el.on("pointerdown", e => {
			if (e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target.classList.contains("handle")) {
				return;
			}
			e.preventDefault();
			const rect = this.$el[0].getBoundingClientRect();
			const cx = e.clientX - rect.left;
			const cy = e.clientY - rect.top;
			mox = ~~(cx);
			moy = ~~(cy);
			$G.on("pointermove", pointermove);
			$G.one("pointerup", () => {
				$G.off("pointermove", pointermove);
			});
		});
		$status_position.text("");
		$status_size.text("");
		$canvas_area.trigger("resize"); // to update handles, get them to hide?

		if (OnCanvasTextBox.$fontbox && OnCanvasTextBox.$fontbox.closed) {
			OnCanvasTextBox.$fontbox = null;
		}
		const $fb = OnCanvasTextBox.$fontbox = OnCanvasTextBox.$fontbox || new $FontBox();
		// move the font box out of the way if it's overlapping the OnCanvasTextBox
		const fb_rect = $fb[0].getBoundingClientRect();
		const tb_rect = this.$el[0].getBoundingClientRect();
		if (
			// the fontbox overlaps textbox
			fb_rect.left <= tb_rect.right &&
			tb_rect.left <= fb_rect.right &&
			fb_rect.top <= tb_rect.bottom &&
			tb_rect.top <= fb_rect.bottom) {
			// move the font box out of the way
			$fb.css({
				top: this.$el.position().top - $fb.height()
			});
		}
		$fb.applyBounds();
	}
	position() {
		super.position(true);
	}
	draw() {
		const text = this.$editor.val();
		if (text) {
			undoable(0, () => {
				const font = text_tool_font;
				ctx.fillStyle = font.background;
				ctx.fillRect(this.x, this.y, this.width, this.height);
				ctx.fillStyle = font.color;
				const style_ = (font.bold ? (font.italic ? "italic bold " : "bold ") : (font.italic ? "italic " : ""));
				ctx.font = `${style_ + font.size}px ${font.family}`;
				ctx.textBaseline = "top";
				const max_width = Math.max(this.width, font.size);
				draw_text_wrapped(ctx, text, this.x + 1, this.y + 1, max_width, font.size * font.line_scale);
			});
		}
	}
	destroy() {
		super.destroy();
		if (OnCanvasTextBox.$fontbox && !OnCanvasTextBox.$fontbox.closed) {
			OnCanvasTextBox.$fontbox.close();
		}
		OnCanvasTextBox.$fontbox = null;
		$G.off("option-changed", this._on_option_changed);
	}
}

function draw_text_wrapped(ctx, text, x, y, maxWidth, lineHeight) {
	const original_lines = text.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);

	for (const original_line of original_lines) {
		const words = original_line.split(' ');
		let line = '';
		let test;
		let metrics;
		for (let i = 0; i < words.length; i++) {
			test = words[i];
			metrics = ctx.measureText(test);
			// TODO: break words on hyphens and perhaps other characters
			while (metrics.width > maxWidth) {
				// Determine how much of the word will fit
				test = test.substring(0, test.length - 1);
				metrics = ctx.measureText(test);
			}
			if (words[i] != test) {
				words.splice(i + 1, 0, words[i].substr(test.length));
				words[i] = test;
			}
			
			test = `${line + words[i]} `;
			metrics = ctx.measureText(test);
			
			if (metrics.width > maxWidth && i > 0) {
				ctx.fillText(line, x, y);
				line = `${words[i]} `;
				y += lineHeight;
			} else {
				line = test;
			}
		}
		ctx.fillText(line, x, y);
		y += lineHeight;
	}
}
