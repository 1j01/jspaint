
class OnCanvasTextBox extends OnCanvasObject {
	constructor(x, y, width, height) {
		super(x, y, width, height, true);

		this.$el.addClass("textbox");
		this.$editor = $(E("textarea")).addClass("textbox-editor");

		// TODO: handle resizing
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("version", 1.1);
		svg.setAttribute("width", width);
		svg.setAttribute("height", height);
		var foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
		foreignObject.setAttribute("x", 0);
		foreignObject.setAttribute("y", 0);
		foreignObject.setAttribute("width", width);
		foreignObject.setAttribute("height", height);
		svg.append(foreignObject);
		
		this.$editor.css({
			"position": "absolute",
			"left": "0",
			"top": "0",
			"right": "0",
			"bottom": "0",
			"padding": "0",
			"margin": "0",
			"border": "0",
			"resize": "none",
			"overflow": "hidden",
		});
		var edit_textarea = this.$editor[0];
		var render_textarea = edit_textarea.cloneNode(false);
		foreignObject.append(render_textarea);

		this.canvas = make_canvas(width, height);
		this.canvas.style.pointerEvents = "none";
		this.$el.append(this.canvas);

		// this.canvas.style.outline = "5px solid lightgray";

		const update = ()=> {
			requestAnimationFrame(()=> {
				edit_textarea.scrollTop = 0; // prevent scrolling edit textarea to keep in sync
			});

			const font = text_tool_font;
			font.color = colors.foreground;
			font.background = tool_transparent_mode ? "transparent" : colors.background;
			this.$editor.add(render_textarea).css({
				width: width,
				height: height,
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

			while (render_textarea.firstChild) {
				render_textarea.removeChild(render_textarea.firstChild);
			}
			render_textarea.appendChild(document.createTextNode(edit_textarea.value));
			
			var svg_source = new XMLSerializer().serializeToString(svg);
			// var blob = new Blob([svg_source], {type: "image/svg+xml;charset=utf-8"});
			// var blob_url = URL.createObjectURL(blob);
			var data_url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg_source);
			
			var img = new Image();
			img.onload = ()=> {
				// URL.revokeObjectURL(blob_url);
				this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				this.canvas.ctx.drawImage(img, 0, 0);
				// this.canvas.style.outlineColor = "lime";
			};
			img.onerror = (e)=> {
				// URL.revokeObjectURL(blob_url);
				// this.canvas.style.outlineColor = "red";
				console.log("failed to load image", e);
			};
			img.src = data_url; //blob_url;
		};

		update();
		$G.on("option-changed", this._on_option_changed = update);
		this.$editor.on("input", this._on_input = update);
		this.$editor.on("scroll", this._on_scroll = ()=> {
			requestAnimationFrame(()=> {
				edit_textarea.scrollTop = 0; // prevent scrolling edit textarea to keep in sync
			});
		});

		
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
				// const font = text_tool_font;
				// ctx.fillStyle = font.background;
				// ctx.fillRect(this.x, this.y, this.width, this.height);
				// ctx.fillStyle = font.color;
				// const style_ = (font.bold ? (font.italic ? "italic bold " : "bold ") : (font.italic ? "italic " : ""));
				// ctx.font = `${style_ + font.size}px ${font.family}`;
				// ctx.textBaseline = "top";
				// const max_width = Math.max(this.width, font.size);
				// const line_height = font.size * font.line_scale;
				ctx.drawImage(this.canvas, this.x, this.y);
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
		this.$editor.off("input", this._on_input);
		this.$editor.off("scroll", this._on_scroll);
	}
}
