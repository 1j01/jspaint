

function $Swatch(color){
	var $b = $(E("div")).addClass("swatch");
	var swatch_canvas = new Canvas();
	$(swatch_canvas).css({pointerEvents: "none"}).appendTo($b);
	
	$b.update = function(_color){
		color = _color;
		if(color instanceof CanvasPattern){
			$b.addClass("pattern");
		}else{
			$b.removeClass("pattern");
		}
		
		requestAnimationFrame(function(){
			swatch_canvas.width = $b.innerWidth();
			swatch_canvas.height = $b.innerHeight();
			// I don't think disable_image_smoothing() is needed here
			
			if(color){
				swatch_canvas.ctx.fillStyle = color;
				swatch_canvas.ctx.fillRect(0, 0, swatch_canvas.width, swatch_canvas.height);
			}
		});
	};
	$G.on("theme-load", function(){
		$b.update(color);
	});
	$b.update(color);
	
	return $b;
}

function $ColorBox(){
	var $cb = $(E("div")).addClass("color-box");
	
	var $current_colors = $Swatch().addClass("current-colors");
	var $palette = $(E("div")).addClass("palette");
	
	$cb.append($current_colors, $palette);
	
	var $foreground_color = $Swatch().addClass("color-selection");
	var $background_color = $Swatch().addClass("color-selection");
	$current_colors.append($background_color, $foreground_color);
	
	$current_colors.css({
		position: "relative",
	});
	$foreground_color.css({
		position: "absolute",
		left: 2,
		top: 4,
	});
	$background_color.css({
		position: "absolute",
		right: 3,
		bottom: 3,
	});
	
	$G.on("option-changed", function(){
		$foreground_color.update(colors.foreground);
		$background_color.update(colors.background);
		$current_colors.update(colors.ternary);
	});
	
	$current_colors.on("pointerdown", function(){
		var new_bg = colors.foreground;
		colors.foreground = colors.background;
		colors.background = new_bg;
		$G.triggerHandler("option-changed");
	});
	
	// the one color editted by "Edit Colors..."
	var $last_fg_color_button;
	
	// TODO: base this on the element sizes
	var width_per_button = 16;
	
	var build_palette = function(){
		$palette.empty();
		$.each(palette, function(i, color){
			var $b = $Swatch(color).addClass("color-button");
			$b.appendTo($palette);
			
			// the "last foreground color button" starts out as the first in the palette
			if(i === 0){
				$last_fg_color_button = $b;
			}
			
			var $i = $(E("input")).attr({type: "color"});
			$i.appendTo($b);
			$i.on("change", function(){
				color = $i.val();
				$b.update(color);
				set_color(color);
			});
			
			$i.css("opacity", 0);
			$i.prop("enabled", false);
			
			$i.val(rgb2hex(color));
			
			var button, ctrl;
			$b.on("pointerdown", function(e){
				ctrl = e.ctrlKey;
				button = e.button;
				if(button === 0){
					$last_fg_color_button = $b;
				}
				
				set_color(color);
				
				$i.val(rgb2hex(color));
				
				if(e.button === button && $i.prop("enabled")){
					$i.trigger("click", "synthetic");
				}
				
				$i.prop("enabled", true);
				setTimeout(function(){
					$i.prop("enabled", false);
				}, 400);
			});
			$i.on("click", function(e, synthetic){
				if(!synthetic){
					e.preventDefault();
				}
			});
			
			function set_color(col){
				if(ctrl){
					colors.ternary = col;
				}else if(button === 0){
					colors.foreground = col;
				}else if(button === 2){
					colors.background = col;
				}
				$G.trigger("option-changed");
			};
			function rgb2hex(col){
				if(!col.match){ // i.e. CanvasPattern
					return "#000000";
				}
				var rgb = col.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
				function hex(x){
					return ("0" + parseInt(x).toString(16)).slice(-2);
				}
				return rgb ? ("#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])) : col;
			}
		});
		$palette.width(Math.ceil(palette.length/2) * width_per_button);
	};
	build_palette();
	
	var $c = $Component("Colors", "wide", $cb);
	
	$c.edit_last_color = function(){
		// Edit the last color cell that's been selected as the foreground color.
		create_and_trigger_input({type: "color"}, function(input){
			// console.log(input, input.value);
			$last_fg_color_button.trigger({type: "pointerdown", ctrlKey: false, button: 0});
			$last_fg_color_button.find("input").val(input.value).triggerHandler("change");
		})
		.show().css({width: 0, height: 0, padding: 0, border: 0, position: "absolute", pointerEvents: "none", overflow: "hidden"});
	};
	
	$c.rebuild_palette = build_palette;
	
	return $c;
}
