// @ts-check
/* global $canvas_area, magnification */
import { Handles } from "./Handles.js";
import { OnCanvasObject } from "./OnCanvasObject.js";
import { $G, E, make_canvas, make_css_cursor, to_canvas_coords } from "./helpers.js";

class ReferenceImage extends OnCanvasObject {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {HTMLImageElement | HTMLCanvasElement | ImageData} image_source
	 * @param {number} [opacity=0.5]
	 */
	constructor(x, y, image_source, opacity = 0.5) {
		const img_canvas = make_canvas(image_source);
		super(x, y, img_canvas.width, img_canvas.height, false);

		this.$el.addClass("reference-image");
		this._opacity = opacity;
		this._visible = true;
		this._original_canvas = img_canvas;
		this.canvas = make_canvas(img_canvas);

		this._update_canvas_opacity();
		this.$el.append(this.canvas);
		this.position();

		this.$move_handle = $(E("div")).addClass("reference-move-handle");
		this.$move_handle.css({
			position: "absolute",
			width: "20px",
			height: "20px",
			background: "#c0c0c0",
			border: "2px outset #dfdfdf",
			cursor: make_css_cursor("move", [8, 8], "move"),
			touchAction: "none",
			pointerEvents: "all",
			zIndex: 1,
		});
		this.$el.append(this.$move_handle);

		this.handles = new Handles({
			$handles_container: this.$el,
			$object_container: $canvas_area,
			outset: 2,
			get_rect: () => ({ x: this.x, y: this.y, width: this.width, height: this.height }),
			set_rect: ({ x, y, width, height }) => {
				this.x = x;
				this.y = y;
				this._resize(width, height);
				this.position();
			},
			get_ghost_offset_left: () => parseFloat($canvas_area.css("padding-left")) + 1,
			get_ghost_offset_top: () => parseFloat($canvas_area.css("padding-top")) + 1,
		});

		let mox, moy;
		const pointermove = (e) => {
			const m = to_canvas_coords(e);
			this.x = m.x - mox;
			this.y = m.y - moy;
			this.position();
			this._update_move_handle_position();
		};
		this.$move_handle.on("pointerdown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			const rect = this.canvas.getBoundingClientRect();
			const cx = e.clientX - rect.left;
			const cy = e.clientY - rect.top;
			mox = ~~(cx / rect.width * this.canvas.width);
			moy = ~~(cy / rect.height * this.canvas.height);
			$G.on("pointermove", pointermove);
			this.dragging = true;
			$G.one("pointerup", () => {
				$G.off("pointermove", pointermove);
				this.dragging = false;
			});
		});

		this._update_move_handle_position();

		$G.on("resize theme-load", this._on_resize = () => {
			this.position();
			this._update_move_handle_position();
		});
	}

	_update_move_handle_position() {
		const handle_size = 20;
		const outset = 2;
		this.$move_handle.css({
			left: -outset * magnification - handle_size - 4,
			top: -outset * magnification,
		});
	}

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	_resize(width, height) {
		width = Math.max(1, width);
		height = Math.max(1, height);

		const new_canvas = make_canvas(width, height);
		new_canvas.ctx.imageSmoothingEnabled = true;
		new_canvas.ctx.drawImage(this._original_canvas, 0, 0, width, height);

		$(this.canvas).replaceWith(new_canvas);
		this.canvas = new_canvas;
		this._update_canvas_opacity();
		this.width = width;
		this.height = height;

		this.$el.triggerHandler("resize");
		this._update_move_handle_position();
	}

	_update_canvas_opacity() {
		this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.canvas.ctx.globalAlpha = this._opacity;
		this.canvas.ctx.drawImage(this._original_canvas, 0, 0, this.width, this.height);
		this.canvas.ctx.globalAlpha = 1;
	}

	/**
	 * @param {number} opacity - 0 to 1
	 */
	set_opacity(opacity) {
		this._opacity = Math.max(0, Math.min(1, opacity));
		this._update_canvas_opacity();
	}

	get_opacity() {
		return this._opacity;
	}

	show() {
		this._visible = true;
		this.$el.removeClass("hidden");
	}

	hide() {
		this._visible = false;
		this.$el.addClass("hidden");
	}

	toggle() {
		if (this._visible) {
			this.hide();
		} else {
			this.show();
		}
	}

	is_visible() {
		return this._visible;
	}

	destroy() {
		$G.off("resize theme-load", this._on_resize);
		super.destroy();
	}
}

export { ReferenceImage };
