const ChooserCanvas = (
	url,
	invert,
	width,
	height,
	sourceX,
	sourceY,
	sourceWidth,
	sourceHeight,
	destX,
	destY,
	destWidth,
	destHeight,
	reuse_canvas,
) => {
	const c = reuse_canvas(width, height);
	let img = ChooserCanvas.cache[url];
	if(!img){
		img = ChooserCanvas.cache[url] = E("img");
		img.onerror = ()=> {
			delete ChooserCanvas.cache[url];
		};
		img.src = url;
	}
	const render = () => {
		try {
			c.ctx.drawImage(
				img,
				sourceX, sourceY, sourceWidth, sourceHeight,
				destX, destY, destWidth, destHeight
			);
		// eslint-disable-next-line no-empty
		} catch(error) {}
		// if(invert){
		// 	invert_rgb(c.ctx); // can fail due to tainted canvas if running from file: protocol
		// }
		c.style.filter = invert ? "invert()" : "";
	};
	$(img).on("load", render);
	render();
	return c;
};
ChooserCanvas.cache = {};

const $Choose = (things, display, choose, is_chosen, gray_background_for_unselected) => {
	const $chooser = $(E("div")).addClass("chooser").attr("touch-action", "none");
	const choose_thing = (thing) => {
		if(is_chosen(thing)){
			return;
		}
		choose(thing);
		$G.trigger("option-changed");
	};
	$chooser.on("update", () => {
		if (!$chooser.is(":visible")) {
			return;
		}
		$chooser.empty();
		for(let i=0; i<things.length; i++){
			(thing => {
				const $option_container = $(E("div")).addClass("chooser-option").appendTo($chooser);
				$option_container.data("thing", thing);
				const reuse_canvas = (width, height)=> {
					let option_canvas = $option_container.find("canvas")[0];
					if (option_canvas) {
						if (option_canvas.width !== width) { option_canvas.width = width; }
						if (option_canvas.height !== height) { option_canvas.height = height; }
					} else {
						option_canvas = make_canvas(width, height);
						$option_container.append(option_canvas);
					}
					return option_canvas;
				};
				const update = () => {
					const selected_color = getComputedStyle($chooser[0]).getPropertyValue("--Hilight");
					const unselected_color = gray_background_for_unselected ? "rgb(192, 192, 192)" : "";
					$option_container.css({
						backgroundColor: is_chosen(thing) ? selected_color : unselected_color,
					});
					display(thing, is_chosen(thing), reuse_canvas);
				};
				update();
				$G.on("option-changed theme-load redraw-tool-options-because-webglcontextrestored", update);
			})(things[i]);
		}

		const onpointerover_while_pointer_down = (event)=> {
			const option_container = event.target.closest(".chooser-option");
			if (option_container) {
				choose_thing($(option_container).data("thing"));
			}
		};
		const ontouchmove_while_pointer_down = (event)=> {
			const touch = event.originalEvent.changedTouches[0];
			const target = document.elementFromPoint(touch.clientX, touch.clientY);
			const option_container = target.closest(".chooser-option");
			if (option_container) {
				choose_thing($(option_container).data("thing"));
			}
			event.preventDefault();
		};
		$chooser.on("pointerdown click", (event)=> {
			const option_container = event.target.closest(".chooser-option");
			if (option_container) {
				choose_thing($(option_container).data("thing"));
			}
			if (event.type === "pointerdown") {
				// glide thru tool options
				$chooser.on("pointerover", onpointerover_while_pointer_down);
				$chooser.on("touchmove", ontouchmove_while_pointer_down);
			}
		});
		$G.on("pointerup pointercancel", ()=> {
			$chooser.off("pointerover", onpointerover_while_pointer_down);
			$chooser.off("touchmove", ontouchmove_while_pointer_down);
		});
	});
	return $chooser;
};
const $ChooseShapeStyle = () => {
	const $chooser = $Choose(
		[
			{stroke: true, fill: false},
			{stroke: true, fill: true},
			{stroke: false, fill: true}
		],
		({stroke, fill}, is_chosen, reuse_canvas) => {
			const sscanvas = reuse_canvas(39, 21);
			const ssctx = sscanvas.ctx;
			
			// border px inwards amount
			let b = 5;

			const style = getComputedStyle(sscanvas);
			ssctx.fillStyle = is_chosen ? style.getPropertyValue("--HilightText") : style.getPropertyValue("--WindowText");
			
			if(stroke){
				// just using a solid rectangle for the stroke
				// so as not to have to deal with the pixel grid with strokes
				ssctx.fillRect(b, b, sscanvas.width-b*2, sscanvas.height-b*2);
			}
			
			// go inward a pixel for the fill
			b += 1;
			ssctx.fillStyle = style.getPropertyValue("--ButtonShadow");
			
			if(fill){
				ssctx.fillRect(b, b, sscanvas.width-b*2, sscanvas.height-b*2);
			}else{
				ssctx.clearRect(b, b, sscanvas.width-b*2, sscanvas.height-b*2);
			}
			
			return sscanvas;
		},
		({stroke, fill}) => {
			$chooser.stroke = stroke;
			$chooser.fill = fill;
		},
		({stroke, fill}) => $chooser.stroke === stroke && $chooser.fill === fill
	).addClass("choose-shape-style");
	
	$chooser.fill = false;
	$chooser.stroke = true;
	
	return $chooser;
};

const $choose_brush = $Choose(
	(() => {
		const brush_shapes = ["circle", "square", "reverse_diagonal", "diagonal"];
		const circular_brush_sizes = [7, 4, 1];
		const brush_sizes = [8, 5, 2];
		const things = [];
		brush_shapes.forEach((brush_shape)=> {
			const sizes = brush_shape === "circle" ? circular_brush_sizes : brush_sizes;
			sizes.forEach((brush_size)=> {
				things.push({
					shape: brush_shape,
					size: brush_size,
				});
			});
		});
		return things;
	})(),
	(o, is_chosen, reuse_canvas) => {
		const cbcanvas = reuse_canvas(10, 10);
		const style = getComputedStyle(cbcanvas);
		
		const shape = o.shape;
		const size = o.size;
		const color = is_chosen ? style.getPropertyValue("--HilightText") : style.getPropertyValue("--WindowText");
		
		stamp_brush_canvas(cbcanvas.ctx, 5, 5, shape, size);
		replace_colors_with_swatch(cbcanvas.ctx, color);

		return cbcanvas;
	}, ({shape, size}) => {
		brush_shape = shape;
		brush_size = size;
	}, ({shape, size}) => brush_shape === shape && brush_size === size
).addClass("choose-brush");

const $choose_eraser_size = $Choose(
	[4, 6, 8, 10],
	(size, is_chosen, reuse_canvas) => {
		const cecanvas = reuse_canvas(39, 16);
		
		const style = getComputedStyle(cecanvas);
		cecanvas.ctx.fillStyle = is_chosen ? style.getPropertyValue("--HilightText") : style.getPropertyValue("--WindowText");
		render_brush(cecanvas.ctx, "square", size);
		
		return cecanvas;
	},
	size => {
		eraser_size = size;
	},
	size => eraser_size === size
).addClass("choose-eraser");

const $choose_stroke_size = $Choose(
	[1, 2, 3, 4, 5],
	(size, is_chosen, reuse_canvas) => {
		const w = 39, h = 12, b = 5;
		const cscanvas = reuse_canvas(w, h);
		const center_y = (h - size) / 2;
		const style = getComputedStyle(cscanvas);
		cscanvas.ctx.fillStyle = is_chosen ? style.getPropertyValue("--HilightText") : style.getPropertyValue("--WindowText");
		cscanvas.ctx.fillRect(b, ~~center_y, w - b*2, size);
		return cscanvas;
	},
	size => {
		stroke_size = size;
	},
	size => stroke_size === size
).addClass("choose-stroke-size");

const magnifications = [1, 2, 6, 8, 10];
const $choose_magnification = $Choose(
	magnifications,
	(scale, is_chosen, reuse_canvas) => {
		const i = magnifications.indexOf(scale);
		const secret = scale === 10; // 10x is secret
		const chooser_canvas = ChooserCanvas(
			"images/options-magnification.png",
			is_chosen, // invert if chosen
			39, (secret ? 2 : 13), // width, height of destination canvas
			i*23, 0, 23, 9, // x, y, width, height from source image
			8, 2, 23, 9, // x, y, width, height on destination
			reuse_canvas,
		);
		if(secret){
			$(chooser_canvas).addClass("secret-option");
		}
		return chooser_canvas;
	},
	scale => {
		set_magnification(scale);
	},
	scale => scale === magnification,
	true,
).addClass("choose-magnification")
.css({position: "relative"}); // positioning context for above `position: "absolute"` canvas

$choose_magnification.on("update", () => {
	$choose_magnification
		.find(".secret-option")
		.parent()
		.css({position: "absolute", bottom: "-2px", left: 0, opacity: 0});
});

const airbrush_sizes = [9, 16, 24];
const $choose_airbrush_size = $Choose(
	airbrush_sizes,
	(size, is_chosen, reuse_canvas) => {
		
		const image_width = 72; // width of source image
		const i = airbrush_sizes.indexOf(size); // 0 or 1 or 2
		const l = airbrush_sizes.length; // 3
		const is_bottom = (i === 2);
		
		const shrink = 4 * !is_bottom;
		const w = image_width / l - shrink * 2;
		const h = 23;
		const source_x = image_width / l * i + shrink;
		
		return ChooserCanvas(
			"images/options-airbrush-size.png",
			is_chosen, // invert if chosen
			w, h, // width, height of created destination canvas
			source_x, 0, w, h, // x, y, width, height from source image
			0, 0, w, h, // x, y, width, height on created destination canvas
			reuse_canvas,
		);
	},
	size => {
		airbrush_size = size;
	},
	size => size === airbrush_size,
	true,
).addClass("choose-airbrush-size");

const $choose_transparent_mode = $Choose(
	[false, true],
	(option, _is_chosen, reuse_canvas) => {
		const sw = 35, sh = 23; // width, height from source image
		const b = 2; // margin by which the source image is inset on the destination
		const theme_folder = `images/${get_theme().replace(/\.css/i, "")}`;
		return ChooserCanvas(
			`${theme_folder}/options-transparency.png`,
			false, // never invert it
			b+sw+b, b+sh+b, // width, height of created destination canvas
			0, option ? 22 : 0, sw, sh, // x, y, width, height from source image
			b, b, sw, sh, // x, y, width, height on created destination canvas
			reuse_canvas,
		);
	},
	option => {
		tool_transparent_mode = option;
	},
	option => option === tool_transparent_mode,
	true,
).addClass("choose-transparent-mode");

