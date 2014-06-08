
function $Component(name, orientation, $el){
	//a draggable widget that can be undocked into a window
	var $c = $(E("div")).addClass("jspaint-component");
	$c.addClass("jspaint-"+name+"-component");
	$c.append($el);
	$c.appendTo({
		tall: $left,
		wide: $bottom,
	}[orientation]);
	
	var $w;
	
	var ox, oy, w, h, pos, pos_axis;
	var dragging = false;
	var $dock_to;
	var $ghost;
	$c.on("mousedown", function(e){
		if(e.button !== 0) return;
		
		var rect = $c[0].getBoundingClientRect();
		w = (~~(rect.width/2))*2 + 1; //make sure these dimensions are odd numbers
		h = (~~(rect.height/2))*2 + 1;
		ox = $c.position().left - e.clientX;
		oy = $c.position().top - e.clientY;
		dragging = true;
		
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
		return false;
	});
	$G.on("mousemove", function(e){
		if(!dragging) return;
		
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
	});
	$G.on("mouseup", function(e){
		if(!dragging) return;
		dragging = false;
		
		if($w){
			$w.close();
			$w = null;
		}
		if($dock_to){
			//dock component to $dock_to
			$dock_to.append($c);
			
			pos = Math.max(pos, 0);
			if(pos_axis === "top"){
				pos = Math.min(pos, $dock_to.height() - $ghost.height());
			}else{
				pos = Math.min(pos, $dock_to.width() - $ghost.width());
			}
			
			$c.css("position", "relative");
			$c.css(pos_axis, pos);
		}else{
			//put component in a window
			/*
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
			*/
		}
		
		$ghost && $ghost.remove(), $ghost = null;
		
		$G.trigger("resize");
	});
	return $c;
}
