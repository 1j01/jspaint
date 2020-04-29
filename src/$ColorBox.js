

function $Swatch(color){
	const $b = $(E("div")).addClass("swatch");
	const swatch_canvas = make_canvas();
	$(swatch_canvas).css({pointerEvents: "none"}).appendTo($b);
	
	$b.update = _color => {
		color = _color;
		if(color instanceof CanvasPattern){
			$b.addClass("pattern");
		}else{
			$b.removeClass("pattern");
		}
		
		requestAnimationFrame(() => {
			swatch_canvas.width = $b.innerWidth();
			swatch_canvas.height = $b.innerHeight();
			// I don't think disable_image_smoothing() is needed here
			
			if(color){
				swatch_canvas.ctx.fillStyle = color;
				swatch_canvas.ctx.fillRect(0, 0, swatch_canvas.width, swatch_canvas.height);
			}
		});
	};
	$G.on("theme-load", () => {
		$b.update(color);
	});
	$b.update(color);
	
	return $b;
}

function $ColorBox(vertical){
	const $cb = $(E("div")).addClass("color-box");
	
	const $current_colors = $Swatch(colors.ternary).addClass("current-colors");
	const $palette = $(E("div")).addClass("palette");
	
	$cb.append($current_colors, $palette);
	
	const $foreground_color = $Swatch(colors.foreground).addClass("color-selection foreground-color");
	const $background_color = $Swatch(colors.background).addClass("color-selection background-color");
	$current_colors.append($background_color, $foreground_color);
	
	$G.on("option-changed", () => {
		$foreground_color.update(colors.foreground);
		$background_color.update(colors.background);
		$current_colors.update(colors.ternary);
	});
	
	$current_colors.on("pointerdown", () => {
		const new_bg = colors.foreground;
		colors.foreground = colors.background;
		colors.background = new_bg;
		$G.triggerHandler("option-changed");
	});
	
	// the one color editted by "Edit Colors..."
	let $last_fg_color_button;
	
	function set_color(col){
		if(ctrl){
			colors.ternary = col;
		}else if(button === 0){
			colors.foreground = col;
		}else if(button === 2){
			colors.background = col;
		}
		$G.trigger("option-changed");
	}
	function color_to_hex(col){
		if(!col.match){ // i.e. CanvasPattern
			return "#000000";
		}
		const rgb_match = col.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		const rgb = rgb_match ? rgb_match.slice(1) : get_rgba_from_color(col).slice(0, 3);
		function hex(x){
			return (`0${parseInt(x).toString(16)}`).slice(-2);
		}
		return rgb ? (`#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`) : col;
	}
	
	const make_color_button = (color) => {

		const $b = $Swatch(color).addClass("color-button");
		$b.appendTo($palette);
		
		const $i = $(E("input")).attr({type: "color"});
		$i.appendTo($b);
		$i.on("change", () => {
			color = $i.val();
			$b.update(color);
			set_color(color);
		});
		
		$i.css("opacity", 0);
		$i.prop("enabled", false);
		
		$i.val(color_to_hex(color));
		
		$b.on("pointerdown", e => {
			// @TODO: how should the ternary color, and selection cropping, work on macOS?
			ctrl = e.ctrlKey;
			button = e.button;
			if(button === 0){
				$last_fg_color_button = $b;
			}
			
			set_color(color);
			
			$i.val(color_to_hex(color));
			
			if(e.button === button && $i.prop("enabled")){
				$i.trigger("click", "synthetic");
			}
			
			$i.prop("enabled", true);
			setTimeout(() => {
				$i.prop("enabled", false);
			}, 400);
		});
		$i.on("click", (e, synthetic) => {
			if(!synthetic){
				e.preventDefault();
			}
		});
	};

	const build_palette = () => {
		$palette.empty();

		palette.forEach(make_color_button);

		// Note: this doesn't work until the colors box is in the DOM
		const $some_button = $palette.find(".color-button");
		if (vertical) {
			const height_per_button =
				$some_button.outerHeight() +
				parseFloat(getComputedStyle($some_button[0]).getPropertyValue("margin-top")) +
				parseFloat(getComputedStyle($some_button[0]).getPropertyValue("margin-bottom"));
			$palette.height(Math.ceil(palette.length/2) * height_per_button);
		} else {
			const width_per_button =
				$some_button.outerWidth() +
				parseFloat(getComputedStyle($some_button[0]).getPropertyValue("margin-left")) +
				parseFloat(getComputedStyle($some_button[0]).getPropertyValue("margin-right"));
			$palette.width(Math.ceil(palette.length/2) * width_per_button);
		}

		// the "last foreground color button" starts out as the first in the palette
		$last_fg_color_button = $palette.find(".color-button");
	};
	build_palette();
	$(window).on("theme-change", build_palette);
	
	let $c;
	if (vertical) {
		$c = $Component("Colors", "tall", $cb);
		$c.appendTo($right);
	}else{
		$c = $Component("Colors", "wide", $cb);
		$c.appendTo($bottom);
	}
	
	$c.edit_last_color = () => {
		// Edit the last color cell that's been selected as the foreground color.
		create_and_trigger_input({type: "color"}, input => {
			// window.console && console.log(input, input.value);
			// @FIXME
			$last_fg_color_button.trigger({type: "pointerdown", ctrlKey: false, button: 0});
			$last_fg_color_button.find("input").val(input.value).triggerHandler("change");
		})
		.show().css({width: 0, height: 0, padding: 0, border: 0, position: "absolute", pointerEvents: "none", overflow: "hidden"});
	};
	
	$c.rebuild_palette = build_palette;
	
	return $c;
}
