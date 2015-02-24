
function $ColorBox(){
	var $cb = $(E("div")).addClass("jspaint-color-box");
	
	var $current_colors = $(E("div")).addClass("jspaint-current-colors");
	var $palette = $(E("div")).addClass("jspaint-palette");
	
	$cb.append($current_colors, $palette);
	
	var $foreground_color = $(E("div")).addClass("jspaint-color-selection");
	var $background_color = $(E("div")).addClass("jspaint-color-selection");
	$current_colors.append($foreground_color, $background_color);
	
	$current_colors.css({
		position: "relative",
	});
	$foreground_color.css({
		position: "absolute",
		zIndex: 1,
		left: 2,
		top: 4,
	});
	$background_color.css({
		position: "absolute",
		right: 3,
		bottom: 3,
	});
	
	$G.on("option-changed", function(){
		$foreground_color.css({background: colors.foreground});
		$background_color.css({background: colors.background});
		$current_colors.css({background: colors.ternary});
	});
	
	// the only color editted by Colors > Edit Colors...
	var $last_fg_color_button;
	
	$.each(palette, function(i, color){
		var $b = $(E("button")).addClass("jspaint-color-button");
		$b.appendTo($palette);
		$b.css("background-color", color);
		
		// the last foreground color button starts out as the first one
		if(i === 0){
			$last_fg_color_button = $b;
		}
		
		var $i = $(E("input")).attr({type: "color"});
		$i.appendTo($b);
		$i.on("change", function(){
			color = $i.val();
			$b.css("background-color", color);
			set_color(color);
		});
		
		$i.css("opacity", 0);
		$i.prop("enabled", false);
		
		$i.val(rgb2hex($b.css("background-color")));
		
		var button, ctrl;
		$b.on("mousedown", function(e){
			ctrl = e.ctrlKey;
			button = e.button;
			if(button === 0){
				$last_fg_color_button = $b;
			}
			
			set_color($b.css("background-color"));
			
			$i.val(rgb2hex($b.css("background-color")));
			
			$i.prop("enabled", true);
			setTimeout(function(){
				$i.prop("enabled", false);
			}, 400);
		});
		$i.on("mousedown", function(e){
			if(e.button === button && $i.prop("enabled")){
				$i.trigger("click", "synthetic");
			}
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
			var rgb = col.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			function hex(x){
				return ("0" + parseInt(x).toString(16)).slice(-2);
			}
			return rgb ? ("#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])) : col;
		}
	});
	
	var $c = $Component("Colors", "wide", $cb);
	$c.get_last_foreground_color_$button = function(){
		return $last_fg_color_button;
	};
	return $c;
}
