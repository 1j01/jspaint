
function $Handles($container, getRect, options){
	const outset = options.outset || 0;
	const get_offset_left = options.get_offset_left || (() => 0);
	const get_offset_top = options.get_offset_top || (() => 0);
	const size_only = options.size_only || false;
	
	const $resize_ghost = $(E("div")).addClass("resize-ghost");
	if (options.thick) {
		$resize_ghost.addClass("thick");
	}
	const handles = $.map([
		["top", "right"], // ↗
		["top", "middle"], // ↑
		["top", "left"], // ↖
		["middle", "left"], // ←
		["bottom", "left"], // ↙
		["bottom", "middle"], // ↓
		["bottom", "right"], // ↘
		["middle", "right"], // →
	], pos => {
		const y_axis = pos[0];
		const x_axis = pos[1];
		
		const $h = $(E("div")).addClass("handle");
		$h.appendTo($container);
		
		$h.attr("touch-action", "none");
		
		let rect;
		let dragged = false;
		const resizes_height = y_axis !== "middle";
		const resizes_width = x_axis !== "middle";
		if(size_only && (y_axis === "top" || x_axis === "left")){
			$h.addClass("useless-handle");
		}else{
			
			let cursor_fname;
			if((x_axis === "left" && y_axis === "top") || (x_axis === "right" && y_axis === "bottom")){
				cursor_fname = "nwse-resize";
			}else if((x_axis === "right" && y_axis === "top") || (x_axis === "left" && y_axis === "bottom")){
				cursor_fname = "nesw-resize";
			}else if(resizes_width){
				cursor_fname = "ew-resize";
			}else if(resizes_height){
				cursor_fname = "ns-resize";
			}
			
			let fallback_cursor = "";
			if(y_axis === "top"){ fallback_cursor += "n"; }
			if(y_axis === "bottom"){ fallback_cursor += "s"; }
			if(x_axis === "left"){ fallback_cursor += "w"; }
			if(x_axis === "right"){ fallback_cursor += "e"; }
			
			fallback_cursor += "-resize";
			const cursor = make_css_cursor(cursor_fname, [16, 16], fallback_cursor);
			$h.css({cursor});
			
			const drag = (event) => {
				$resize_ghost.appendTo($container);
				dragged = true;
				
				rect = getRect();
				const m = to_canvas_coords(event);
				let delta_x = 0;
				let delta_y = 0;
				// @TODO: decide between Math.floor/Math.ceil/Math.round for these values
				if(x_axis === "right"){
					delta_x = 0;
					width = ~~(m.x - rect.x);
				}else if(x_axis === "left"){
					delta_x = ~~(m.x - rect.x);
					width = ~~(rect.x + rect.width - m.x);
				}else{
					width = ~~(rect.width);
				}
				if(y_axis === "bottom"){
					delta_y = 0;
					height = ~~(m.y - rect.y);
				}else if(y_axis === "top"){
					delta_y = ~~(m.y - rect.y);
					height = ~~(rect.y + rect.height - m.y);
				}else{
					height = ~~(rect.height);
				}
				let new_rect = {
					x: rect.x + delta_x + get_offset_left(),
					y: rect.y + delta_y + get_offset_top(),
					width: width,
					height: height,
				};
				new_rect.width = Math.max(1, new_rect.width);
				new_rect.height = Math.max(1, new_rect.height);
				if (options.constrain) {
					new_rect = options.constrain(new_rect);
				}
				const inset = options.thick ? 3 : 0;
				$resize_ghost.css({
					position: "absolute",
					left: magnification * (new_rect.x - rect.x) + inset,
					top: magnification * (new_rect.y - rect.y) + inset,
					width: magnification * new_rect.width - inset * 2,
					height: magnification * new_rect.height - inset * 2,
				});
				rect = new_rect;
			};
			$h.on("pointerdown", event => {
				dragged = false;
				if(event.button === 0){
					$G.on("pointermove", drag);
					$("body").css({cursor}).addClass("cursor-bully");
				}
				$G.one("pointerup", ()=> {
					$G.off("pointermove", drag);
					$("body").css({cursor: ""}).removeClass("cursor-bully");
					
					$resize_ghost.remove();
					if(dragged){
						// triggerHandler so it doesn't bubble
						$container.triggerHandler("user-resized", [rect.x, rect.y, rect.width, rect.height]);
					}
					$container.trigger("update");
				});
			});
			$h.on("mousedown selectstart", event => {
				event.preventDefault();
			});
		}
		
		const update_handle = () => {
			const rect = getRect();
			const hs = $h.width();
			if(x_axis === "middle"){
				$h.css({ left: get_offset_left() + (rect.width * magnification - hs) / 2 });
			}else if(x_axis === "left"){
				$h.css({ left: get_offset_left() - outset });
			}else if(x_axis === "right"){
				$h.css({ left: get_offset_left() + (rect.width * magnification - hs/2) });
			}
			if(y_axis === "middle"){
				$h.css({ top: get_offset_top() + (rect.height * magnification - hs) / 2 });
			}else if(y_axis === "top"){
				$h.css({ top: get_offset_top() - outset });
			}else if(y_axis === "bottom"){
				$h.css({ top: get_offset_top() + (rect.height * magnification - hs/2) });
			}
			$h.css({
				"max-width": rect.width * magnification / 2,
				"max-height": rect.height * magnification / 2,
			});
		};
		
		$container.on("update resize scroll", update_handle);
		$G.on("resize theme-load", update_handle);
		setTimeout(update_handle, 50);
		
		return $h[0];
	});
	return $(handles);
}
