
// Segments here represent UI components as far as a layout algorithm is concerned,
// line segments in one dimension (regardless of whether that dimension is vertical or horizontal),
// with a reference to the UI component DOM element so it can be updated.

function get_segments(component_area_el, pos_axis, exclude_component_el) {
	const $other_components = $(component_area_el).find(".component").not(exclude_component_el);
	return $other_components.toArray().map((component_el)=> {
		return {
			element: component_el,
			pos: component_el[pos_axis === "top" ? "offsetTop" : "offsetLeft"],
			length: component_el[pos_axis === "top" ? "clientHeight" : "clientWidth"],
		};
	});
}

function adjust_segments(segments, total_available_length) {
	segments.sort((a, b)=> a.pos - b.pos);

	// Clamp
	for (const segment of segments) {
		segment.pos = Math.max(segment.pos, 0);
		segment.pos = Math.min(segment.pos, total_available_length - segment.length);
	}

	// Shove things downwards to prevent overlap
	for (let i = 1; i < segments.length; i++) {
		const segment = segments[i];
		const prev_segment = segments[i - 1];
		const overlap = prev_segment.pos + prev_segment.length - segment.pos;
		if (overlap > 0) {
			segment.pos += overlap;
		}
	}

	// Clamp
	for (const segment of segments) {
		segment.pos = Math.max(segment.pos, 0);
		segment.pos = Math.min(segment.pos, total_available_length - segment.length);
	}

	// Shove things upwards to get things back on screen
	for (let i = segments.length - 2; i >= 0; i--) {
		const segment = segments[i];
		const prev_segment = segments[i + 1];
		const overlap = segment.pos + segment.length - prev_segment.pos;
		if (overlap > 0) {
			segment.pos -= overlap;
		}
	}
}

function apply_segments(component_area_el, pos_axis, segments) {
	// Since things aren't positioned absolutely, calculate space between
	let length_before = 0;
	for (const segment of segments) {
		segment.margin_before = segment.pos - length_before;
		length_before = segment.length + segment.pos;
	}

	// Apply to the DOM
	for (const segment of segments) {
		component_area_el.appendChild(segment.element);
		$(segment.element).css(`margin-${pos_axis}`, segment.margin_before);
	}
}

function $Component(name, orientation, $el){
	// A draggable widget that can be undocked into a window
	const $c = $(E("div")).addClass("component");
	$c.addClass(`${name}-component`);
	$c.addClass(orientation);
	$c.append($el);
	$c.attr("touch-action", "none");
	
	const $w = new $ToolWindow($c);
	$w.title(name);
	$w.hide();
	$w.$content.addClass({
		tall: "vertical",
		wide: "horizontal",
	}[orientation]);
	
	// Nudge the Colors component over a tiny bit
	if(name === "Colors" && orientation === "wide"){
		$c.css("position", "relative");
		$c.css("left", "3px");
	}

	let iid;
	if($("body").hasClass("eye-gaze-mode")){
		// @TODO: don't use an interval for this!
		iid = setInterval(()=> {
			const scale = 3;
			$c.css({
				transform: `scale(${scale})`,
				transformOrigin: "0 0",
				marginRight: $c[0].scrollWidth * (scale - 1),
				marginBottom: $c[0].scrollHeight * (scale - 1),
			});
		}, 200);
	}
	
	let ox, oy;
	let w, h;
	let pos = 0;
	let pos_axis;
	let last_docked_to_pos;
	let $last_docked_to;
	let $dock_to;
	let $ghost;
	
	if(orientation === "tall"){
		pos_axis = "top";
	}else{
		pos_axis = "left";
	}
	
	const dock_to = $dock_to => {
		$w.hide();

		// must get layout state *before* changing it
		const segments = get_segments($dock_to[0], pos_axis, $c[0]);

		// so we can measure clientWidth/clientHeight
		$dock_to.append($c);

		segments.push({
			element: $c[0],
			pos: pos,
			length: $c[0][pos_axis === "top" ? "clientHeight" : "clientWidth"],
		});

		const total_available_length = pos_axis === "top" ? $dock_to.height() : $dock_to.width();
		// console.log("before adjustment", JSON.stringify(segments, (_key,val)=> (val instanceof Element) ? val.className : val));
		adjust_segments(segments, total_available_length);
		// console.log("after adjustment", JSON.stringify(segments, (_key,val)=> (val instanceof Element) ? val.className : val));
		
		apply_segments($dock_to[0], pos_axis, segments);

		// Save where it's now docked to
		$last_docked_to = $dock_to;
		last_docked_to_pos = pos;
	};
	
	$c.on("pointerdown", e => {
		// Only start a drag via a left click directly on the component element
		if(e.button !== 0){ return; }
		if(!$c.is(e.target)){ return; }
		// Don't allow dragging in eye gaze mode
		if($("body").hasClass("eye-gaze-mode")){ return; }
		
		$G.on("pointermove", drag_update_position);
		$G.one("pointerup", e => {
			$G.off("pointermove", drag_update_position);
			drag_onpointerup(e);
		});
		
		const rect = $c[0].getBoundingClientRect();
		// Make sure these dimensions are odd numbers
		// so the alternating pattern of the border is unbroken
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

		drag_update_position(e);
		
		// Prevent text selection anywhere within the component
		e.preventDefault();
	});
	const drag_update_position = e => {
		
		$ghost.css({
			left: e.clientX + ox,
			top: e.clientY + oy,
		});
		
		$dock_to = null;
		
		const ghost_rect = $ghost[0].getBoundingClientRect();
		const q = 5;
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
		
		if($dock_to){
			const dock_to_rect = $dock_to[0].getBoundingClientRect();
			pos = ghost_rect[pos_axis] - dock_to_rect[pos_axis];
			$ghost.addClass("dock");
		}else{
			$ghost.removeClass("dock");
		}
		
		e.preventDefault();
	};
	
	const drag_onpointerup = e => {
		
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
			const component_area_el = $c.closest(".component-area")[0];
			// must get layout state *before* changing it
			const segments = get_segments(component_area_el, pos_axis, $c[0]);
			
			$c.css("position", "relative");
			$c.css(`margin-${pos_axis}`, "");

			// Put the component in the window
			$w.$content.append($c);
			// Show and position the window
			$w.show();
			const window_rect = $w[0].getBoundingClientRect();
			const window_content_rect = $w.$content[0].getBoundingClientRect();
			const dx = window_content_rect.left - window_rect.left;
			const dy = window_content_rect.top - window_rect.top;
			$w.css({
				left: e.clientX + ox - dx,
				top: e.clientY + oy - dy,
			});

			const total_available_length = pos_axis === "top" ? $(component_area_el).height() : $(component_area_el).width();
			// console.log("before adjustment", JSON.stringify(segments, (_key,val)=> (val instanceof Element) ? val.className : val));
			adjust_segments(segments, total_available_length);
			// console.log("after adjustment", JSON.stringify(segments, (_key,val)=> (val instanceof Element) ? val.className : val));
			apply_segments(component_area_el, pos_axis, segments);
		}
		
		$ghost && $ghost.remove();
		$ghost = null;
		
		$G.trigger("resize");
	};
	
	$c.dock = () => {
		pos = last_docked_to_pos;
		dock_to($last_docked_to);
	};
	
	$c.show = () => {
		$($c[0]).show(); // avoid recursion
		if($.contains($w[0], $c[0])){
			$w.show();
		}
		return $c;
	};
	$c.hide = () => {
		$c.add($w).hide();
		return $c;
	};
	$c.toggle = () => {
		if($c.is(":visible")){
			$c.hide();
		}else{
			$c.show();
		}
		return $c;
	};
	$c.destroy = ()=> {
		$w.close();
		$c.remove();
		clearInterval(iid);
	};
	
	$w.on("close", e => {
		e.preventDefault();
		$w.hide();
	});
	
	return $c;
}
