
function $ColorBox(){
	var $cb = $(E("div")).addClass("jspaint-color-box");
	$cb.addClass("jspaint-color-box");
	
	var $current_colors = $(E("div")).addClass("jspaint-current-colors");
	var $palette = $(E("div")).addClass("jspaint-palette");
	
	$cb.append($current_colors, $palette);
	
	var $color0 = $(E("div")).addClass("jspaint-color-selection");
	var $color1 = $(E("div")).addClass("jspaint-color-selection");
	$current_colors.append($color0, $color1);
	
	$current_colors.css({
		position: "relative",
	});
	$color0.css({
		position: "absolute",
		zIndex: 1,
		left: 2,
		top: 4,
	});
	$color1.css({
		position: "absolute",
		right: 3,
		bottom: 3,
	});
	
	function update_colors(){
		$current_colors.css({background:colors[2]});
		$color0.css({background:colors[0]});
		$color1.css({background:colors[1]});
		$G.trigger("option-changed");
	}
	
	$.each(palette, function(i, color){
		var $b = $(E("button")).addClass("jspaint-color-button");
		$b.appendTo($palette);
		$b.css("background-color", color);
		
		var $i = $(E("input")).attr({type:"color"});
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
				colors[2] = col;
			}else if(button === 0){
				colors[0] = col;
			}else if(button === 2){
				colors[1] = col;
			}
			update_colors();
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
	$c.update_colors = update_colors;
	return $c;
}
