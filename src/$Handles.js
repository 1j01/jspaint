
function $Handles($container, element, options){
	var outset = options.outset || 0;
	var get_offset_left = options.get_offset_left || function(){ return 0; };
	var get_offset_top = options.get_offset_top || function(){ return 0; };
	var size_only = options.size_only || false;
	var el = element;
	$container.on("new-element", function(e, element){
		el = element;
	});
	
	var $resize_ghost = $(E("div")).addClass("resize-ghost");
	var handles = $.map([
		["top", "right"], // ↗
		["top", "middle"], // ↑
		["top", "left"], // ↖
		["middle", "left"], // ←
		["bottom", "left"], // ↙
		["bottom", "middle"], // ↓
		["bottom", "right"], // ↘
		["middle", "right"], // →
	], function(pos){
		var y_axis = pos[0];
		var x_axis = pos[1];
		
		var $h = $(E("div")).addClass("handle");
		$h.appendTo($container);
		
		$h.attr("touch-action", "none");
		
		var delta_x = 0, delta_y = 0, width, height;
		var dragged = false;
		var resizes_height = y_axis !== "middle";
		var resizes_width = x_axis !== "middle";
		if(size_only && (y_axis === "top" || x_axis === "left")){
			$h.addClass("useless-handle");
		}else{
			
			var cursor_fname;
			if((x_axis === "left" && y_axis === "top") || (x_axis === "right" && y_axis === "bottom")){
				cursor_fname = "nwse-resize";
			}else if((x_axis === "right" && y_axis === "top") || (x_axis === "left" && y_axis === "bottom")){
				cursor_fname = "nesw-resize";
			}else if(resizes_width){
				cursor_fname = "ew-resize";
			}else if(resizes_height){
				cursor_fname = "ns-resize";
			}
			
			var cursor = "";
			if(y_axis === "top"){ cursor += "n"; }
			if(y_axis === "bottom"){ cursor += "s"; }
			if(x_axis === "left"){ cursor += "w"; }
			if(x_axis === "right"){ cursor += "e"; }
			
			cursor += "-resize";
			cursor = Cursor([cursor_fname, [16, 16], cursor]);
			$h.css({cursor: cursor});
			
			var drag = function(e){
				$resize_ghost.appendTo($container);
				dragged = true;
				
				var rect = el.getBoundingClientRect();
				var mx = e.clientX / magnification;
				var my = e.clientY / magnification;
				// TODO: decide between Math.floor/Math.ceil/Math.round for these values
				if(x_axis === "right"){
					delta_x = 0;
					width = ~~(mx - rect.left);
				}else if(x_axis === "left"){
					delta_x = ~~(mx - rect.left);
					width = ~~(rect.right - mx);
				}else{
					width = ~~(rect.width);
				}
				if(y_axis === "bottom"){
					delta_y = 0;
					height = ~~(my - rect.top);
				}else if(y_axis === "top"){
					delta_y = ~~(my - rect.top);
					height = ~~(rect.bottom - my);
				}else{
					height = ~~(rect.height);
				}
				$resize_ghost.css({
					position: "absolute",
					left: magnification * delta_x + get_offset_left(),
					top: magnification * delta_y + get_offset_top(),
					width: magnification * width,
					height: magnification * height,
				});
			};
			$h.on("pointerdown", function(e){
				dragged = false;
				if(e.button === 0){
					$G.on("pointermove", drag);
					$("body").css({cursor: cursor}).addClass("cursor-bully");
				}
				$G.one("pointerup", function(e){
					$G.off("pointermove", drag);
					$("body").css({cursor: ""}).removeClass("cursor-bully");
					
					$resize_ghost.remove();
					if(dragged){
						$(el).trigger("user-resized", [delta_x, delta_y, width, height]);
					}
					$container.trigger("update");
				});
			});
			$h.on("mousedown selectstart", function(e){
				e.preventDefault();
			});
		}
		
		var update_handle = function(){
			var rect = el.getBoundingClientRect();
			var hs = $h.width();
			if(x_axis === "middle"){
				$h.css({ left: get_offset_left() + (rect.width - hs) / 2 });
			}else if(x_axis === "left"){
				$h.css({ left: get_offset_left() - outset });
			}else if(x_axis === "right"){
				$h.css({ left: get_offset_left() + (rect.width - hs/2) });
			}
			if(y_axis === "middle"){
				$h.css({ top: get_offset_top() + (rect.height - hs) / 2 });
			}else if(y_axis === "top"){
				$h.css({ top: get_offset_top() - outset });
			}else if(y_axis === "bottom"){
				$h.css({ top: get_offset_top() + (rect.height - hs/2) });
			}
		};
		
		$container.on("update resize scroll", update_handle);
		$G.on("resize theme-load", update_handle);
		setTimeout(update_handle, 50);
		
		return $h[0];
	});
	return $(handles);
}
