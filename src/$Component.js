
function $Component(name, orientation, $el){
	// A draggable widget that can be undocked into a window
	var $c = $(E("div")).addClass("component");
	$c.addClass(""+name+"-component");
	$c.append($el);
	$c.attr("touch-action", "none");
	
	$c.appendTo({
		tall: $left,
		wide: $bottom,
	}[orientation]);
	
	var $w = new $Window($c);
	$w.title(name);
	$w.hide();
	$w.$content.addClass({
		tall: "vertical",
		wide: "horizontal",
	}[orientation]);
	
	// Nudge the Colors component over a tiny bit
	if(name === "Colors"){
		$c.css("position", "relative");
		$c.css("left", "3px");
	}
	
	var ox, oy;
	var w, h;
	var pos = 0;
	var pos_axis;
	
	if(orientation === "tall"){
		pos_axis = "top";
	}else{
		pos_axis = "left";
	}
	
	var dock_to = function($dock_to){
		$w.hide();
		
		$dock_to.append($c);
		
		pos = Math.max(pos, 0);
		if(pos_axis === "top"){
			pos = Math.min(pos, $dock_to.height() - $c.height());
		}else{
			pos = Math.min(pos, $dock_to.width() - $c.width());
		}
		
		$c.css("position", "relative");
		$c.css(pos_axis, pos);
		
		// Save where it's now docked to
		$last_docked_to = $dock_to;
		last_docked_to_pos = pos;
	};
	
	var last_docked_to_pos;
	var $last_docked_to;
	var $dock_to;
	var $ghost;
	$c.on("pointerdown", function(e){
		// Only start a drag via a left click directly on the component element
		if(e.button !== 0){ return; }
		if(!$c.is(e.target)){ return; }
		
		$G.on("pointermove", drag_onpointermove);
		$G.one("pointerup", function(e){
			$G.off("pointermove", drag_onpointermove);
			drag_onpointerup(e);
		});
		
		var rect = $c[0].getBoundingClientRect();
		// Make sure these dimensions are odd numbers
		w = (~~(rect.width/2))*2 + 1;
		h = (~~(rect.height/2))*2 + 1;
		ox = rect.left - e.clientX;
		oy = rect.top - e.clientY;
		
		if(!$ghost){
			$ghost = $(E("div")).addClass("component-ghost dock");
			$ghost.css({
				position: "absolute",
				display: "block",
				width: w,
				height: h,
				left: e.clientX + ox,
				top: e.clientY + oy
			});
			$ghost.appendTo("body");
		}
		
		// Prevent text selection anywhere within the component
		e.preventDefault();
	});
	var drag_onpointermove = function(e){
		
		$ghost.css({
			left: e.clientX + ox,
			top: e.clientY + oy,
		});
		
		$dock_to = null;
		
		var ghost_rect = $ghost[0].getBoundingClientRect();
		var q = 5;
		if(orientation === "tall"){
			pos_axis = "top";
			if(ghost_rect.left-q < $left[0].getBoundingClientRect().right){
				$dock_to = $left;
			}
			if(ghost_rect.right+q > $right[0].getBoundingClientRect().left){
				$dock_to = $right;
			}
		}else{
			pos_axis = "left";
			if(ghost_rect.top-q < $top[0].getBoundingClientRect().bottom){
				$dock_to = $top;
			}
			if(ghost_rect.bottom+q > $bottom[0].getBoundingClientRect().top){
				$dock_to = $bottom;
			}
		}
		pos = ghost_rect[pos_axis];
		
		if($dock_to){
			var dock_to_rect = $dock_to[0].getBoundingClientRect();
			pos -= dock_to_rect[pos_axis];
			$ghost.addClass("dock");
		}else{
			$ghost.removeClass("dock");
		}
		
		e.preventDefault();
	};
	
	var drag_onpointerup = function(e){
		
		$w.hide();
		
		// If the component is docked to a component area (a side)
		if($c.parent().is(".component-area")){
			// Save where it's docked so we can dock back later
			$last_docked_to = $c.parent();
			if($dock_to){
				last_docked_to_pos = pos;
			}
		}
		
		if($dock_to){
			// Dock component to $dock_to
			dock_to($dock_to);
		}else{
			$c.css("position", "relative");
			$c.css(pos_axis, "");
			
			// Put the component in the window
			$w.$content.append($c);
			// Show and position the window
			$w.show();
			var window_rect = $w[0].getBoundingClientRect();
			var window_content_rect = $w.$content[0].getBoundingClientRect();
			var dx = window_content_rect.left - window_rect.left;
			var dy = window_content_rect.top - window_rect.top;
			$w.css({
				left: e.clientX + ox - dx,
				top: e.clientY + oy - dy,
			});
		}
		
		$ghost && $ghost.remove();
		$ghost = null;
		
		$G.trigger("resize");
	};
	
	$c.dock = function(){
		pos = last_docked_to_pos;
		dock_to($last_docked_to);
	};
	
	$c.show = function(){
		$($c[0]).show();
		if($.contains($w[0], $c[0])){
			$w.show();
		}
		return $c;
	};
	$c.hide = function(){
		$c.add($w).hide();
		return $c;
	};
	$c.toggle = function(){
		if($c.is(":visible")){
			$c.hide();
		}else{
			$c.show();
		}
		return $c;
	};
	
	$w.on("close", function(e){
		e.preventDefault();
		$w.hide();
	});
	
	return $c;
}
