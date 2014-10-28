
function $Component(name, orientation, $el){
	//a draggable widget that can be undocked into a window
	var $c = $(E("div")).addClass("jspaint-component");
	$c.addClass("jspaint-"+name+"-component");
	$c.append($el);
	
	$c.appendTo({
		tall: $left,
		wide: $bottom,
	}[orientation]);
	
	// nudge the Colors component over a tiny bit
	if(name === "Colors"){
		$c.css("position", "relative");
		$c.css("left", "3px");
	}
	
	var ox, oy, w, h, pos, pos_axis;
	
	if(orientation === "tall"){
		pos_axis = "top";
	}else{
		pos_axis = "left";
	}
	
	var dock_to = function($dock_to){
		if($w){
			$w.close();
			$w = null;
		}
		
		$dock_to.append($c);
		
		pos = Math.max(pos, 0);
		if(pos_axis === "top"){
			pos = Math.min(pos, $dock_to.height() - $c.height());
		}else{
			pos = Math.min(pos, $dock_to.width() - $c.width());
		}
		
		$c.css("position", "relative");
		$c.css(pos_axis, pos);
	};
	
	var last_docked_to_pos;
	var $last_docked_to;
	var $dock_to;
	var $ghost;
	var $w;
	$c.on("mousedown", function(e){
		$G.on("mousemove", drag_onmousemove);
		$G.one("mouseup", function(e){
			$G.off("mousemove", drag_onmousemove);
			drag_onmouseup(e);
		});
		
		if(e.button !== 0) return;
		
		var rect = $c[0].getBoundingClientRect();
		w = (~~(rect.width/2))*2 + 1; //make sure these dimensions are odd numbers
		h = (~~(rect.height/2))*2 + 1;
		ox = rect.left - e.clientX;
		oy = rect.top - e.clientY;
		
		if(!$ghost){
			$ghost = $(E("div")).addClass("jspaint-component-ghost dock");
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
		
		e.preventDefault();
	});
	$el.on("mousedown", function(e){
		//e.preventDefault();
		e.stopPropagation();
	});
	var drag_onmousemove = function(e){
		
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
	
	var drag_onmouseup = function(e){
		
		if($w){
			$w.close();
			$w = null;
		}
		
		// If the component is docked to a component area (a side)
		if($c.parent().is(".jspaint-component-area")){
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
			
			// Put the component in a new window
			$w = new $Window($c);
			$w.title(name);
			$w.$content.append($c);
			$w.$content.addClass({
				tall: "jspaint-vertical",
				wide: "jspaint-horizontal",
			}[orientation]);
			$w.css({
				left: e.clientX + ox,
				top: e.clientY + oy
			});
		}
		
		$ghost && $ghost.remove(), $ghost = null;
		
		$G.trigger("resize");
	};
	
	$c.dock = function(){
		pos = last_docked_to_pos;
		dock_to($last_docked_to);
	};
	
	return $c;
}
